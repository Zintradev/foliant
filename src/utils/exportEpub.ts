/**
 * @file exportEpub.ts
 * @description Core EPUB 3.0 / EPUB 2.0 dual-mode compilation engine for Foliant.
 *
 * ## Architectural Design & Compliance Decisions:
 * 1. **Dual Navigation Architecture (EPUB 3 + EPUB 2)**:
 *    - Modern readers (Apple Books, Calibre, Kobo) rely on `nav.xhtml` (`properties="nav"`).
 *    - Legacy e-ink readers (Kindle Paperwhite Gen 1-3, older Nook devices) require `toc.ncx`
 *      per the OPF 2.0 compatibility spec. Both are packaged in parallel to maximize reach.
 * 2. **Strict OCF (Open Container Format) Compliance**:
 *    - The `mimetype` file MUST be the exact first entry in the ZIP package and MUST be
 *      uncompressed (`compression: 'STORE'`). Any preceding bytes or compression will cause
 *      hard validation failure in EPUBCheck (error PKG-006).
 * 3. **Amazon KDP Enhanced Typesetting vs Standard Reading Profiles**:
 *    - Standard: Uses CSS widows/orphans, generous paragraph margins, and gentle justification.
 *    - Amazon: Kindle's KFX rendering engine aggressively purges inline `<br>` separators between
 *      block elements to prevent unwanted page gaps and reflow jitter on E-Ink displays.
 */

import JSZip from 'jszip';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { FoliantProject, TextNode } from '../types/project';

/**
 * Structural strategy for grouping folders and scenes into reading files:
 * - `top-folders`: Top-level folders become distinct chapter files (`chapter_X.xhtml` with `<h1>`),
 *   bundling all internal scenes separated by narrative break asterisks (`* * *`).
 * - `sub-folders`: Preserves nested multi-tier hierarchy (Acts `<h1>`, Folders `<h2>`, Scenes `<h3>`).
 * - `flatten`: Compiles all selected scenes sequentially into a single consolidated project document.
 */
export type ChapterFormatting = 'top-folders' | 'sub-folders' | 'flatten';

/**
 * Rendering engine target profile:
 * - `standard`: Balanced typography compliant with W3C EPUB 3.2 recommendations.
 * - `amazon`: Strictly stripped of inter-block `<br>` tags and empty paragraph containers
 *   to avoid Kindle Direct Publishing (KDP) validation warnings and formatting distortion.
 */
export type ExportProfile = 'standard' | 'amazon';

export interface EpubExportOptions {
  /** Book title override; falls back to `project.title` if omitted */
  title?: string;
  /** Author name override; falls back to resolved project metadata/protagonist if omitted */
  author?: string;
  /** Optional publishing house or publication year for OPF metadata `<dc:publisher>` */
  publisher?: string;
  /** ISO 639-1 language code (e.g. 'es', 'en') for dictionary hyphenation and TTS reading */
  language?: string;
  /** Reading engine target profile: 'standard' or 'amazon' */
  profile?: ExportProfile;
  /** Base64-encoded cover image data URL or raw string */
  coverBase64?: string | null;
  /** Explicit whitelist of TextNode IDs; if omitted, all project chapters are compiled */
  selectedIds?: string[];
  /** Grouping hierarchy strategy for folders and scenes */
  chapterFormatting?: ChapterFormatting;
  /** Whether to inject a dedicated visual Table of Contents reading page before chapter 1 */
  includeVisualToc?: boolean;
}

/**
 * Escapes XML/HTML entities for valid XHTML documents.
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates an RFC 4122 compliant UUID v4 string (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx).
 * Uses crypto.randomUUID() when available, with a standard fallback.
 */
export function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Resolves the primary author or creator names from project metadata,
 * characters, or context blocks.
 */
export function resolveProjectAuthor(project: FoliantProject): string {
  // 1. Check if any context block explicitly defines an author
  const authorBlock = project.contextBlocks?.find(
    (b) =>
      b.title.trim().toLowerCase() === 'author' ||
      b.title.trim().toLowerCase() === 'author name'
  );
  if (authorBlock && authorBlock.content.trim()) {
    return authorBlock.content.trim();
  }

  // 2. Check if a protagonist character is defined
  const protagonists = project.characters?.filter(
    (c) => c.role?.toLowerCase() === 'protagonist'
  );
  if (protagonists && protagonists.length > 0) {
    return protagonists.map((p) => p.name).join(', ');
  }

  // 3. Fallback to main characters or default author label
  const firstChars = project.characters?.slice(0, 3);
  if (firstChars && firstChars.length > 0) {
    return firstChars.map((c) => c.name).join(', ');
  }

  return 'Foliant Author';
}

/**
 * Extracts and traverses scenes in chronological / narrative order
 * based on the project outline tree structure.
 */
export function getChronologicalScenes(chapters: TextNode[]): TextNode[] {
  const nodeMap = new Map<string, { node: TextNode; children: string[] }>();
  const rootIds: string[] = [];

  // Register all nodes in map
  for (const node of chapters) {
    nodeMap.set(node.id, { node, children: [] });
  }

  // Build parent-child relationships preserving array order
  for (const node of chapters) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node.id);
    } else {
      rootIds.push(node.id);
    }
  }

  const orderedScenes: TextNode[] = [];

  function traverse(nodeId: string) {
    const entry = nodeMap.get(nodeId);
    if (!entry) return;

    if (entry.node.type === 'scene') {
      orderedScenes.push(entry.node);
    }

    for (const childId of entry.children) {
      traverse(childId);
    }
  }

  for (const rootId of rootIds) {
    traverse(rootId);
  }

  return orderedScenes;
}

/**
 * Returns all descendant scene nodes under a given node ID in depth-first order.
 */
export function getDescendantScenes(nodeId: string, chapters: TextNode[]): TextNode[] {
  const nodeMap = new Map<string, { node: TextNode; children: string[] }>();
  for (const node of chapters) {
    nodeMap.set(node.id, { node, children: [] });
  }
  for (const node of chapters) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node.id);
    }
  }

  const scenes: TextNode[] = [];
  function traverse(id: string) {
    const entry = nodeMap.get(id);
    if (!entry) return;
    if (entry.node.type === 'scene') {
      scenes.push(entry.node);
    }
    for (const childId of entry.children) {
      traverse(childId);
    }
  }
  traverse(nodeId);
  return scenes;
}

/**
 * Sanitizes rich-text HTML produced by TipTap/ProseMirror into standard XML-well-formed XHTML.
 *
 * ### Why this transformation is necessary:
 * 1. **ProseMirror Trailing Breaks**: TipTap appends `<br class="ProseMirror-trailingBreak">`
 *    at the end of nodes to keep cursor positioning predictable in web browsers. If leaked into an
 *    EPUB, this causes unsightly trailing whitespace and phantom blank lines.
 * 2. **Amazon Kindle KDP Quirks**: Kindle's layout engine misinterprets `<br>` tags placed
 *    outside or between paragraph tags, often treating them as un-indented block breaks or double-spaced
 *    lines. For the `amazon` profile, all such breaks are flattened into spaces.
 * 3. **Empty Paragraph Cascade**: Multiple consecutive `<p></p>` or `<p>&nbsp;</p>` tags result
 *    in accidental blank pages on e-ink hardware with small viewports. They are purged recursively.
 * 4. **Self-closing XML compliance**: Validates that all void tags (`<br />`, `<hr />`, `<img />`)
 *    have the trailing slash required by the XML parser in strict XHTML 1.1 / EPUB 3.
 */
function cleanTipTapHtml(html: string, isAmazon = false): string {
  let cleaned = html;

  // 1. Remove ProseMirror trailing breaks and metadata attributes
  cleaned = cleaned.replace(/<br\s+class="ProseMirror-trailingBreak"\s*\/?>/gi, '');
  cleaned = cleaned.replace(/class="ProseMirror-trailingBreak"/gi, '');

  if (isAmazon) {
    // Aggressive filter for Amazon ecosystem: eliminate ALL <br> tags completely
    cleaned = cleaned.replace(/<br\s*\/?>/gi, ' ');
    cleaned = cleaned.replace(/<br[^>]*>/gi, ' ');
  } else {
    // Standard: Remove <br> tags placed directly between block elements
    cleaned = cleaned.replace(/(<\/(?:p|h[1-6]|blockquote|div|ul|ol|li)>)\s*(?:<br\s*\/?>\s*)+/gi, '$1\n');
    cleaned = cleaned.replace(/(?:<br\s*\/?>\s*)+(<(?:p|h[1-6]|blockquote|div|ul|ol|li)[^>]*>)/gi, '\n$1');
  }

  cleaned = cleaned.replace(/^(?:\s*<br\s*\/?>)+/gi, '');
  cleaned = cleaned.replace(/(?:<br\s*\/?>\s*)+$/gi, '');

  // Strip empty paragraphs repeatedly until stable (with iteration guard to protect CPU)
  let prev = '';
  let iterations = 0;
  while (prev !== cleaned && iterations++ < 5) {
    prev = cleaned;
    // Eliminates <p></p>, <p><br /></p>, <p>&nbsp;</p>, <p>&#160;</p>, <p><span></span></p>, etc.
    // Uses unnested linear-time tokens to prevent V8 catastrophic backtracking.
    cleaned = cleaned.replace(
      /<p[^>]*>(?:[\s\u00a0]|&nbsp;|&#160;|&#xA0;|<br\s*\/?>|<\/?(?:span|strong|em)[^>]*>)*<\/p>/gi,
      ''
    );
  }

  // Ensure standard XHTML self-closing tags
  if (!isAmazon) {
    cleaned = cleaned.replace(/<br(?!\s*\/\s*>)\s*\/?>/gi, '<br />');
  }
  cleaned = cleaned
    .replace(/<hr(?!\s*\/\s*>)\s*\/?>/gi, '<hr />')
    .replace(/<img([^>]*?)(?<!\/)>/gi, '<img$1 />');

  // Normalize excessive spaces
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  return cleaned.trim();
}

interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
  marks?: Array<{
    type: string;
    attrs?: Record<string, unknown>;
  }>;
  attrs?: Record<string, unknown> & {
    level?: number;
  };
}

/**
 * Renders TipTap JSON doc tree into clean XHTML without empty paragraphs or injected breaks.
 */
function renderTipTapJson(doc: TipTapNode | null | undefined, isAmazon = false): string {
  if (!doc || typeof doc !== 'object') return '';
  if (doc.type === 'doc' && Array.isArray(doc.content)) {
    return doc.content
      .map((block: TipTapNode) => renderTipTapBlock(block, isAmazon))
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function renderTipTapBlock(node: TipTapNode | null | undefined, isAmazon = false): string {
  if (!node || typeof node !== 'object') return '';

  switch (node.type) {
    case 'paragraph': {
      if (!node.content || !Array.isArray(node.content) || node.content.length === 0) {
        return '';
      }
      const inlineContent = node.content.map((child: TipTapNode) => renderTipTapInline(child, isAmazon)).join('');
      const textOnly = inlineContent
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;|&#160;|&#xA0;/g, '')
        .trim();
      if (!textOnly) {
        return '';
      }
      return `<p>${inlineContent}</p>`;
    }
    case 'heading': {
      const level = node.attrs?.level || 2;
      const inlineContent = (node.content || []).map((child: TipTapNode) => renderTipTapInline(child, isAmazon)).join('');
      if (!inlineContent.replace(/<[^>]*>/g, '').trim()) return '';
      return `<h${level}>${inlineContent}</h${level}>`;
    }
    case 'blockquote': {
      const inner = (node.content || []).map((child: TipTapNode) => renderTipTapBlock(child, isAmazon)).filter(Boolean).join('\n');
      if (!inner.trim()) return '';
      return `<blockquote>${inner}</blockquote>`;
    }
    case 'bulletList': {
      const items = (node.content || []).map((child: TipTapNode) => renderTipTapBlock(child, isAmazon)).filter(Boolean).join('\n');
      return items ? `<ul>${items}</ul>` : '';
    }
    case 'orderedList': {
      const items = (node.content || []).map((child: TipTapNode) => renderTipTapBlock(child, isAmazon)).filter(Boolean).join('\n');
      return items ? `<ol>${items}</ol>` : '';
    }
    case 'listItem': {
      const inner = (node.content || []).map((child: TipTapNode) => renderTipTapBlock(child, isAmazon)).filter(Boolean).join('\n');
      return `<li>${inner}</li>`;
    }
    case 'horizontalRule': {
      return '<hr />';
    }
    default:
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((child: TipTapNode) => renderTipTapBlock(child, isAmazon)).filter(Boolean).join('\n');
      }
      return '';
  }
}

function renderTipTapInline(node: TipTapNode | null | undefined, isAmazon = false): string {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'hardBreak') {
    return isAmazon ? ' ' : '<br />';
  }
  if (node.type === 'text') {
    let text = escapeXml(node.text || '');
    if (node.marks && Array.isArray(node.marks)) {
      for (const mark of node.marks) {
        if (mark.type === 'bold' || mark.type === 'strong') {
          text = `<strong>${text}</strong>`;
        } else if (mark.type === 'italic' || mark.type === 'em') {
          text = `<em>${text}</em>`;
        } else if (mark.type === 'strike') {
          text = `<s>${text}</s>`;
        } else if (mark.type === 'code') {
          text = `<code>${text}</code>`;
        }
      }
    }
    return text;
  }
  return '';
}

/**
 * Converts raw markdown or TipTap HTML/JSON content into clean, standard-compliant XHTML,
 * filtering out empty paragraphs and eliminating injected <br> tags between text blocks.
 * In Amazon profile, aggressively eliminates all <br> tags and empty paragraphs.
 */
export function formatChapterBody(rawContent: string, profile: ExportProfile = 'standard'): string {
  if (!rawContent || !rawContent.trim()) {
    return '<p><em>(Empty scene)</em></p>';
  }

  const isAmazon = profile === 'amazon';
  const trimmed = rawContent.trim();

  // 1. Check if raw content is a TipTap JSON string
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.type === 'doc') {
        const jsonHtml = renderTipTapJson(parsed, isAmazon);
        const cleaned = cleanTipTapHtml(jsonHtml, isAmazon);
        return cleaned || '<p><em>(Empty scene)</em></p>';
      }
    } catch {
      // Continue if not valid JSON
    }
  }

  // 2. If already structured HTML (from TipTap editor)
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    const cleaned = cleanTipTapHtml(trimmed, isAmazon);
    return cleaned || '<p><em>(Empty scene)</em></p>';
  }

  // 3. Otherwise, transform plain text / Markdown lines into XHTML paragraphs
  const paragraphs = trimmed.split(/\n\s*\n/);
  const result = paragraphs
    .map((para) => {
      const p = para.trim();
      if (!p) return '';

      // Markdown Headers
      if (p.startsWith('### ')) {
        return `<h3>${escapeXml(p.slice(4))}</h3>`;
      }
      if (p.startsWith('## ')) {
        return `<h2>${escapeXml(p.slice(3))}</h2>`;
      }
      if (p.startsWith('# ')) {
        return `<h2>${escapeXml(p.slice(2))}</h2>`;
      }

      // Blockquotes
      if (p.startsWith('>')) {
        return `<blockquote><p>${escapeXml(p.replace(/^>\s*/gm, ''))}</p></blockquote>`;
      }

      // Inline basic markdown formatting
      let formatted = escapeXml(p);
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Replace single newlines with space instead of injecting <br />
      formatted = formatted.replace(/\n+/g, ' ').trim();

      if (!formatted) return '';
      return `<p>${formatted}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return result || '<p><em>(Empty scene)</em></p>';
}

/**
 * Builds standard EPUB 3 CSS typography stylesheet with required paragraph spacing,
 * indentation, and widow/orphan control depending on reading profile (standard vs amazon).
 */
export function generateEpubCss(profile: ExportProfile = 'standard'): string {
  const isAmazon = profile === 'amazon';

  const pRule = isAmazon
    ? `/* Ecosistema Amazon Profile: strictly purged of line-height, widows/orphans, and vertical margins */
p {
  margin: 0;
  text-indent: 1em;
}`
    : `/* EPUB Estándar Profile: line-height 1.4, widows 2, orphans 2, margin-bottom 0.5em, text-indent 1em */
p {
  line-height: 1.4;
  widows: 2;
  orphans: 2;
  margin-bottom: 0.5em;
  text-indent: 1em;
}`;

  return `@charset "utf-8";

@page {
  margin: 5% 7%;
}

body {
  font-family: Georgia, Cambria, "Times New Roman", serif;
  font-size: 1em;
  line-height: ${isAmazon ? '1.4' : '1.5'};
  margin: ${isAmazon ? '0' : '5% 8%'};
  color: #1a1a1a;
  background-color: transparent;
}

h1, h2, h3, h4 {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-weight: 600;
  text-align: center;
  color: #111827;
  text-indent: 0;
  page-break-after: avoid;
  break-after: avoid;
}

h1 {
  font-size: 2em;
  text-align: center;
  margin-top: 15%;
  margin-bottom: 2em;
  page-break-before: always;
}

h2 {
  font-size: 1.5em;
  text-align: center;
  margin-top: 10%;
  margin-bottom: 1.5em;
  page-break-before: always;
}

.book-title {
  font-size: 2.5em;
  font-weight: bold;
  text-align: center;
  margin-top: 20vh; /* Empuja el texto hacia el tercio superior de la pantalla */
  margin-bottom: 0.2em;
  letter-spacing: 2px;
}

.book-author {
  font-size: 1.5em;
  font-weight: normal;
  text-align: center;
  margin-top: 2em;
  font-style: italic; /* Da un contraste elegante frente al título */
  page-break-before: avoid;
  break-before: avoid;
}

.book-publisher {
  font-size: 1em;
  text-align: center;
  margin-top: 4em;
  text-transform: uppercase;
}

h3.scene-heading, h3 {
  font-size: 1.1em;
  margin-top: 1.4em;
  margin-bottom: 0.5em;
  font-weight: 600;
  color: #374151;
  text-align: left;
  text-indent: 0;
  page-break-after: avoid;
  break-after: avoid;
}

${pRule}

/* Professional standard: Suppress indent for first paragraph of chapter or after dividers */
h1 + p,
h2 + p,
h3 + p,
p.scene-break + p,
.title-page + p {
  text-indent: 0;
}

/* Scene break divider asterisks */
p.scene-break {
  text-align: center;
  text-indent: 0;
  margin: 1.8em 0;
  letter-spacing: 0.6em;
  font-weight: bold;
  color: #6b7280;
  page-break-inside: avoid;
  break-inside: avoid;
  -webkit-hyphens: none;
  -epub-hyphens: none;
  hyphens: none;
}

blockquote {
  margin: 1.2em 2em;
  padding-left: 1em;
  border-left: 2px solid #9ca3af;
  font-style: italic;
  color: #374151;
  text-align: justify;
  page-break-inside: avoid;
  break-inside: avoid;
}

blockquote p {
  text-indent: 0;
}

.title-page {
  text-align: center;
  page-break-after: always;
  break-after: page;
}

.toc-container {
  padding: 1em;
}

.toc-container ol {
  list-style: none;
  padding-left: 1.2em;
}

.toc-container > nav > ol {
  padding-left: 0;
}

.toc-container li {
  margin: 0.6em 0;
}

.toc-container a {
  color: #2563eb;
  text-decoration: none;
}
`;
}

export interface TocNavEntry {
  title: string;
  src: string;
  anchorId?: string;
  children?: TocNavEntry[];
}

/**
 * Generates standard-compliant EPUB 2 Navigation Control file XML (`toc.ncx`).
 *
 * ### Architectural & Specification Rationale:
 * - **Backward Compatibility**: While EPUB 3 uses XHTML5 `<nav>` elements, legacy e-readers
 *   (e.g., Kindle Gen 1-3, older Sony Readers, Nook Simple Touch) rely solely on NCX.
 * - **EPUBCheck Error RSC-005 Prevention**:
 *   1. `playOrder` MUST be strictly ascending (1, 2, 3...) across the entire document tree,
 *      regardless of nesting depth. Discontinuous or duplicated playOrder values fail validation.
 *   2. Each `<navPoint>` content `src` must resolve to a distinct location. If two navigation points
 *      target the same file, unique anchor identifiers (`#nav-point-X`) are generated dynamically
 *      to maintain strict URI target uniqueness.
 */
export function generateTocNcx(
  bookId: string,
  bookTitle: string,
  author: string,
  navEntries: TocNavEntry[]
): string {
  let playOrderCounter = 1;
  let maxDepth = 1;
  const seenTargets = new Map<string, number>();

  function renderNavPoints(entries: TocNavEntry[], currentDepth = 1): string {
    if (currentDepth > maxDepth) {
      maxDepth = currentDepth;
    }

    let xml = '';
    const indent = '  '.repeat(currentDepth + 1);

    for (const entry of entries) {
      const order = playOrderCounter++;

      // Ensure target uniqueness:
      // If the exact same base target has been seen, ensure anchor differentiation
      let finalSrc = entry.src;
      if (entry.anchorId) {
        finalSrc = `${entry.src}#${entry.anchorId}`;
      }

      if (seenTargets.has(finalSrc)) {
        // Enforce uniqueness with distinct anchor if duplicate found
        finalSrc = `${entry.src}#nav-point-${order}`;
      }
      seenTargets.set(finalSrc, order);

      const navPointId = `navPoint-${order}`;
      xml += `${indent}<navPoint id="${navPointId}" playOrder="${order}">\n`;
      xml += `${indent}  <navLabel><text>${escapeXml(entry.title)}</text></navLabel>\n`;
      xml += `${indent}  <content src="${finalSrc}"/>\n`;

      if (entry.children && entry.children.length > 0) {
        xml += renderNavPoints(entry.children, currentDepth + 1);
      }

      xml += `${indent}</navPoint>\n`;
    }

    return xml;
  }

  const navPointsXml = renderNavPoints(navEntries, 1);

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(bookId)}"/>
    <meta name="dtb:depth" content="${maxDepth}"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(bookTitle)}</text></docTitle>
  <docAuthor><text>${escapeXml(author)}</text></docAuthor>
  <navMap>
${navPointsXml}  </navMap>
</ncx>`;
}

/**
 * Generates EPUB 3 Navigation Document (toc.xhtml) matching the exact hierarchy.
 */
export function generateTocXhtml(navEntries: TocNavEntry[], language = 'es'): string {
  function renderList(entries: TocNavEntry[], depth = 3): string {
    let html = '';
    const indent = '  '.repeat(depth);

    for (const entry of entries) {
      const finalSrc = entry.anchorId ? `${entry.src}#${entry.anchorId}` : entry.src;
      html += `${indent}<li>\n`;
      html += `${indent}  <a href="${finalSrc}">${escapeXml(entry.title)}</a>\n`;
      if (entry.children && entry.children.length > 0) {
        html += `${indent}  <ol>\n`;
        html += renderList(entry.children, depth + 2);
        html += `${indent}  </ol>\n`;
      }
      html += `${indent}</li>\n`;
    }

    return html;
  }

  const listItems = renderList(navEntries, 3);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escapeXml(language)}" xml:lang="${escapeXml(language)}">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body class="toc-container">
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${listItems}    </ol>
  </nav>
</body>
</html>`;
}

export interface BuiltEpubResult {
  zip: JSZip;
  bookTitle: string;
  author: string;
  bookLanguage: string;
  scenesCount: number;
  chapterFormatting: ChapterFormatting;
  hasCover: boolean;
  contentFiles: Array<{ id: string; filename: string }>;
  tocNavEntries: TocNavEntry[];
  contentOpf: string;
  hasVisualToc: boolean;
}

/**
 * Builds in-memory EPUB archive with standard-compliant packaging, XHTML section files,
 * visual hierarchy for headings (Acts <h1> vs Chapters <h2>), and optional visual TOC page.
 */
export function buildEpubArchive(
  project: FoliantProject,
  options?: EpubExportOptions
): BuiltEpubResult {
  const author = options?.author?.trim() || resolveProjectAuthor(project);
  const bookTitle = options?.title?.trim() || project.title || 'Untitled Project';
  const bookLanguage = options?.language?.trim() || 'es';
  const profile: ExportProfile = options?.profile || 'standard';
  const generatedUuid = generateUuidV4();
  const bookId = `urn:uuid:${generatedUuid}`;
  const now = new Date().toISOString();
  const dateString = now.split('T')[0];
  const chapterFormatting = options?.chapterFormatting || 'top-folders';
  const includeVisualToc = options?.includeVisualToc ?? true;

  // 1. Filter chapters by selectedIds (if specified)
  const selectedSet =
    options?.selectedIds && options.selectedIds.length > 0
      ? new Set(options.selectedIds)
      : null;

  const filteredChapters = selectedSet
    ? project.chapters.filter((c) => selectedSet.has(c.id))
    : project.chapters;

  // 2. Extract ordered scenes
  const rawScenes = getChronologicalScenes(filteredChapters);
  const scenes =
    rawScenes.length > 0
      ? rawScenes
      : [
          {
            id: 'scene-default',
            title: 'Chapter 1',
            content: '<p>Project has no selected scenes.</p>',
            type: 'scene' as const,
          },
        ];

  // 3. Initialize JSZip archive
  const zip = new JSZip();

  // EPUB Specification Rule: 'mimetype' MUST be the first entry, uncompressed
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.folder('META-INF')!.file('container.xml', containerXml);

  const oebps = zip.folder('OEBPS')!;

  // Inject Stylesheets (both style.css and styles.css for compatibility)
  const cssContent = generateEpubCss(profile);
  oebps.file('style.css', cssContent);
  oebps.file('styles.css', cssContent);

  // 4. Handle Cover Image (if provided)
  let hasCover = false;
  let coverFileName = 'cover.jpg';
  let coverMimeType = 'image/jpeg';

  if (options?.coverBase64 && options.coverBase64.trim()) {
    const rawCover = options.coverBase64.trim();
    const mimeMatch = rawCover.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    let cleanBase64 = rawCover;

    if (mimeMatch) {
      coverMimeType = mimeMatch[1];
      cleanBase64 = rawCover.substring(mimeMatch[0].length);
      if (coverMimeType === 'image/png') coverFileName = 'cover.png';
      else if (coverMimeType === 'image/webp') coverFileName = 'cover.webp';
      else if (coverMimeType === 'image/gif') coverFileName = 'cover.gif';
      else coverFileName = 'cover.jpg';
    }

    // Save cover image binary file in OEBPS/images/
    const imagesFolder = oebps.folder('images')!;
    imagesFolder.file(coverFileName, cleanBase64, { base64: true });

    // Create OEBPS/cover.xhtml as the visual opening page
    const coverHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escapeXml(bookLanguage)}" xml:lang="${escapeXml(bookLanguage)}">
<head>
  <title>Cover</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
  <style type="text/css">
    @page {
      margin: 0;
      padding: 0;
    }
    body.cover-page {
      margin: 0;
      padding: 0;
      text-align: center;
      background-color: #0b0f17;
    }
    div.cover-wrapper {
      height: 100vh;
      max-width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0;
      padding: 0;
    }
    img.cover-image {
      max-width: 100vw;
      max-height: 100vh;
      height: auto;
      width: auto;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
  </style>
</head>
<body class="cover-page">
  <div class="cover-wrapper" epub:type="cover">
    <img class="cover-image" src="images/${coverFileName}" alt="${escapeXml(bookTitle)} Cover"/>
  </div>
</body>
</html>`;
    oebps.file('cover.xhtml', coverHtml);
    hasCover = true;
  }

  // 5. Title Page
  const publisher = options?.publisher?.trim();
  const publisherHtml = publisher
    ? `\n  <p class="book-publisher">${escapeXml(publisher)}</p>`
    : '';

  const titlePageHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXml(bookLanguage)}" xml:lang="${escapeXml(bookLanguage)}">
<head>
  <title>${escapeXml(bookTitle)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body class="title-page">
  <h1 class="book-title">${escapeXml(bookTitle)}</h1>
  <h2 class="book-author">${escapeXml(author)}</h2>${publisherHtml}
</body>
</html>`;
  oebps.file('titlepage.xhtml', titlePageHtml);

  // ---------------------------------------------------------------------------
  // 6. Structural Chapter Assembly based on chapterFormatting & Depth Hierarchy
  // ---------------------------------------------------------------------------
  const contentFiles: Array<{ id: string; filename: string }> = [];
  const tocNavEntries: TocNavEntry[] = [
    {
      title: 'Title Page',
      src: 'titlepage.xhtml',
    },
  ];

  // Helper to build Tree Maps from filteredChapters
  const nodeMap = new Map<string, TextNode>();
  const childrenMap = new Map<string, string[]>();
  const rootIds: string[] = [];

  for (const node of filteredChapters) {
    nodeMap.set(node.id, node);
    childrenMap.set(node.id, []);
  }

  for (const node of filteredChapters) {
    if (node.parentId && childrenMap.has(node.parentId)) {
      childrenMap.get(node.parentId)!.push(node.id);
    } else {
      rootIds.push(node.id);
    }
  }

  // -------------------------------------------------------------------------
  // Case C: "flatten"
  // Export scenes in sequence, separated by asterisks, without folder indexes.
  // -------------------------------------------------------------------------
  if (chapterFormatting === 'flatten') {
    const formattedScenes = scenes.map((s) => {
      const sceneTitleHtml = s.title?.trim()
        ? `<h2 class="scene-heading">${escapeXml(s.title)}</h2>\n`
        : '';
      return `${sceneTitleHtml}${formatChapterBody(s.content, profile)}`;
    });

    const projectBody = formattedScenes.join('\n\n<p class="scene-break">* * *</p>\n\n');

    const projectHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXml(bookLanguage)}" xml:lang="${escapeXml(bookLanguage)}">
<head>
  <title>${escapeXml(bookTitle)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${escapeXml(bookTitle)}</h1>
  ${projectBody}
</body>
</html>`;

    oebps.file('project.xhtml', projectHtml);
    contentFiles.push({ id: 'project', filename: 'project.xhtml' });
    tocNavEntries.push({
      title: bookTitle,
      src: 'project.xhtml',
    });
  }

  // -------------------------------------------------------------------------
  // Case A: "top-folders"
  // Treat top Folders as Chapters (Level 1: <h1>). Bundles scenes inside.
  // -------------------------------------------------------------------------
  else if (chapterFormatting === 'top-folders') {
    let chapterIndex = 1;

    for (const rootId of rootIds) {
      const node = nodeMap.get(rootId);
      if (!node) continue;

      if (node.type === 'folder') {
        const descendantScenes = getDescendantScenes(node.id, filteredChapters);
        if (descendantScenes.length === 0) continue;

        const filename = `chapter_${chapterIndex}.xhtml`;
        const title = node.title?.trim() || `Chapter ${chapterIndex}`;

        const sceneParts = descendantScenes.map((sc) => {
          const titleHtml = sc.title?.trim()
            ? `<h2 class="scene-heading">${escapeXml(sc.title)}</h2>\n`
            : '';
          return `${titleHtml}${formatChapterBody(sc.content, profile)}`;
        });
        const chapterBody = sceneParts.join('\n\n<p class="scene-break">* * *</p>\n\n');

        // Level 1: Carpeta Principal -> <h1>
        const chapterHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXml(bookLanguage)}" xml:lang="${escapeXml(bookLanguage)}">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${escapeXml(title)}</h1>
  ${chapterBody}
</body>
</html>`;

        oebps.file(filename, chapterHtml);
        contentFiles.push({ id: `chapter_${chapterIndex}`, filename });
        tocNavEntries.push({
          title,
          src: filename,
        });
        chapterIndex++;
      } else if (node.type === 'scene') {
        const filename = `chapter_${chapterIndex}.xhtml`;
        const title = node.title?.trim() || `Chapter ${chapterIndex}`;

        // Level 1: Standalone Root Scene -> <h1>
        const chapterHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXml(bookLanguage)}" xml:lang="${escapeXml(bookLanguage)}">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${escapeXml(title)}</h1>
  ${formatChapterBody(node.content, profile)}
</body>
</html>`;

        oebps.file(filename, chapterHtml);
        contentFiles.push({ id: `chapter_${chapterIndex}`, filename });
        tocNavEntries.push({
          title,
          src: filename,
        });
        chapterIndex++;
      }
    }

    // Fallback if no folders or root scenes produced files
    if (contentFiles.length === 0) {
      const filename = 'chapter_1.xhtml';
      const chapterHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXml(bookLanguage)}" xml:lang="${escapeXml(bookLanguage)}">
<head><title>Chapter 1</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><h1>Chapter 1</h1><p>No scenes selected.</p></body></html>`;
      oebps.file(filename, chapterHtml);
      contentFiles.push({ id: 'chapter_1', filename });
      tocNavEntries.push({
        title: 'Chapter 1',
        src: filename,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Case B: "sub-folders"
  // Carpeta Principal (Nivel 1 / Acto): <h1>
  // Subcarpeta (Nivel 2 / Capítulo): <h2>
  // -------------------------------------------------------------------------
  else if (chapterFormatting === 'sub-folders') {
    let partIndex = 1;
    let chapterIndex = 1;

    for (const rootId of rootIds) {
      const node = nodeMap.get(rootId);
      if (!node) continue;

      if (node.type === 'folder') {
        const childIds = childrenMap.get(node.id) || [];
        const subFolderIds = childIds.filter((id) => nodeMap.get(id)?.type === 'folder');
        const directSceneIds = childIds.filter((id) => nodeMap.get(id)?.type === 'scene');

        // Root folder has subfolders: acts as a 'Part' / 'Act' (Level 1 -> <h1>)
        if (subFolderIds.length > 0) {
          const partFilename = `part_${partIndex}.xhtml`;
          const partTitle = node.title?.trim() || `Part ${partIndex}`;

          // Carpeta Principal (Nivel 1 / Acto): Envuelve su título en <h1>
          const partHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXml(bookLanguage)}" xml:lang="${escapeXml(bookLanguage)}">
<head>
  <title>${escapeXml(partTitle)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body class="title-page">
  <h1>${escapeXml(partTitle)}</h1>
</body>
</html>`;
          oebps.file(partFilename, partHtml);
          contentFiles.push({ id: `part_${partIndex}`, filename: partFilename });

          const partEntry: TocNavEntry = {
            title: partTitle,
            src: partFilename,
            children: [],
          };

          // If there are direct scenes under Part before subfolders, bundle them into an intro/prologue (Level 2 under Part -> <h2>)
          if (directSceneIds.length > 0) {
            const directScenes = directSceneIds
              .map((id) => nodeMap.get(id))
              .filter((n): n is TextNode => Boolean(n));
            const introFilename = `chapter_${chapterIndex}.xhtml`;
            const introTitle = 'Prologue';
            const introBody = directScenes
              .map(
                (s) =>
                  `${s.title ? `<h3 class="scene-heading">${escapeXml(s.title)}</h3>\n` : ''}${formatChapterBody(s.content, profile)}`
              )
              .join('\n\n<p class="scene-break">* * *</p>\n\n');

            const introHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXml(bookLanguage)}" xml:lang="${escapeXml(bookLanguage)}">
<head><title>${escapeXml(introTitle)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
  <h2>${escapeXml(introTitle)}</h2>
  ${introBody}
</body>
</html>`;
            oebps.file(introFilename, introHtml);
            contentFiles.push({ id: `chapter_${chapterIndex}`, filename: introFilename });

            partEntry.children!.push({
              title: introTitle,
              src: introFilename,
            });
            chapterIndex++;
          }

          // Subcarpetas act as Capítulos (Nivel 2 / Capítulo -> <h2>)
          for (const subFolderId of subFolderIds) {
            const subNode = nodeMap.get(subFolderId);
            if (!subNode) continue;
            const subScenes = getDescendantScenes(subFolderId, filteredChapters);
            if (subScenes.length === 0) continue;

            const chFilename = `chapter_${chapterIndex}.xhtml`;
            const chTitle = subNode.title?.trim() || `Chapter ${chapterIndex}`;
            const chBody = subScenes
              .map(
                (s) =>
                  `${s.title ? `<h3 class="scene-heading">${escapeXml(s.title)}</h3>\n` : ''}${formatChapterBody(s.content, profile)}`
              )
              .join('\n\n<p class="scene-break">* * *</p>\n\n');

            // Subcarpeta (Nivel 2 / Capítulo): Envuelve su título en <h2>
            const chHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXml(bookLanguage)}" xml:lang="${escapeXml(bookLanguage)}">
<head><title>${escapeXml(chTitle)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
  <h2>${escapeXml(chTitle)}</h2>
  ${chBody}
</body>
</html>`;
            oebps.file(chFilename, chHtml);
            contentFiles.push({ id: `chapter_${chapterIndex}`, filename: chFilename });

            partEntry.children!.push({
              title: chTitle,
              src: chFilename,
            });
            chapterIndex++;
          }

          tocNavEntries.push(partEntry);
          partIndex++;
        }
        // Root folder without subfolders: acts as Level 1 -> <h1>
        else {
          const folderScenes = getDescendantScenes(node.id, filteredChapters);
          if (folderScenes.length === 0) continue;

          const chFilename = `chapter_${chapterIndex}.xhtml`;
          const chTitle = node.title?.trim() || `Chapter ${chapterIndex}`;
          const chBody = folderScenes
            .map(
              (s) =>
                `${s.title ? `<h2 class="scene-heading">${escapeXml(s.title)}</h2>\n` : ''}${formatChapterBody(s.content, profile)}`
            )
            .join('\n\n<p class="scene-break">* * *</p>\n\n');

          const chHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXml(bookLanguage)}" xml:lang="${escapeXml(bookLanguage)}">
<head><title>${escapeXml(chTitle)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
  <h1>${escapeXml(chTitle)}</h1>
  ${chBody}
</body>
</html>`;
          oebps.file(chFilename, chHtml);
          contentFiles.push({ id: `chapter_${chapterIndex}`, filename: chFilename });

          tocNavEntries.push({
            title: chTitle,
            src: chFilename,
          });
          chapterIndex++;
        }
      } else if (node.type === 'scene') {
        const chFilename = `chapter_${chapterIndex}.xhtml`;
        const chTitle = node.title?.trim() || `Chapter ${chapterIndex}`;

        const chHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXml(bookLanguage)}" xml:lang="${escapeXml(bookLanguage)}">
<head><title>${escapeXml(chTitle)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
  <h1>${escapeXml(chTitle)}</h1>
  ${formatChapterBody(node.content, profile)}
</body>
</html>`;
        oebps.file(chFilename, chHtml);
        contentFiles.push({ id: `chapter_${chapterIndex}`, filename: chFilename });

        tocNavEntries.push({
          title: chTitle,
          src: chFilename,
        });
        chapterIndex++;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 7. System Navigation: Native NCX (toc.ncx) & EPUB 3 Navigation (nav.xhtml)
  // Both are ALWAYS generated to guarantee standard compliance and reader menus.
  // ---------------------------------------------------------------------------
  const tocNcx = generateTocNcx(bookId, bookTitle, author, tocNavEntries);
  oebps.file('toc.ncx', tocNcx);

  const navHtml = generateTocXhtml(tocNavEntries, bookLanguage);
  oebps.file('nav.xhtml', navHtml);

  // Optional Visual Table of Contents page (toc.xhtml)
  if (includeVisualToc) {
    oebps.file('toc.xhtml', navHtml);
  }

  // ---------------------------------------------------------------------------
  // 8. OEBPS/content.opf Packaging metadata
  // ---------------------------------------------------------------------------
  const manifestItems = [
    ...(hasCover
      ? [
          '    <item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"/>',
          `    <item id="cover-image" href="images/${coverFileName}" media-type="${coverMimeType}" properties="cover-image"/>`,
        ]
      : []),
    '    <item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>',
    ...(includeVisualToc
      ? ['    <item id="visual-toc" href="toc.xhtml" media-type="application/xhtml+xml"/>']
      : []),
    '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
    '    <item id="style" href="style.css" media-type="text/css"/>',
    '    <item id="styles" href="styles.css" media-type="text/css"/>',
    ...contentFiles.map((file) => `    <item id="${file.id}" href="${file.filename}" media-type="application/xhtml+xml"/>`),
  ].join('\n');

  const spineItems = [
    ...(hasCover ? ['    <itemref idref="cover-page"/>'] : []),
    '    <itemref idref="titlepage"/>',
    ...(includeVisualToc ? ['    <itemref idref="visual-toc"/>'] : []),
    ...contentFiles.map((file) => `    <itemref idref="${file.id}"/>`),
  ].join('\n');

  const firstContentFile = contentFiles[0]?.filename || 'titlepage.xhtml';

  const guideItems = [
    ...(hasCover ? ['    <reference type="cover" title="Cover" href="cover.xhtml"/>'] : []),
    '    <reference type="title-page" title="Title Page" href="titlepage.xhtml"/>',
    ...(includeVisualToc ? ['    <reference type="toc" title="Table of Contents" href="toc.xhtml"/>'] : []),
    `    <reference type="text" title="Beginning" href="${firstContentFile}"/>`,
  ].join('\n');

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="pub-id">urn:uuid:${generatedUuid}</dc:identifier>
    <dc:title>${escapeXml(bookTitle)}</dc:title>
    <dc:language>${escapeXml(bookLanguage)}</dc:language>
    <dc:creator id="creator">${escapeXml(author)}</dc:creator>
    <meta refines="#creator" property="role" scheme="marc:relators">aut</meta>
    ${publisher ? `<dc:publisher>${escapeXml(publisher)}</dc:publisher>` : ''}
    <dc:date>${escapeXml(dateString)}</dc:date>
    <meta property="dcterms:modified">${escapeXml(now.replace(/\.\d+Z$/, 'Z'))}</meta>
    ${hasCover ? '<meta name="cover" content="cover-image"/>' : ''}
  </metadata>
  <manifest>
${manifestItems}
  </manifest>
  <spine toc="ncx">
${spineItems}
  </spine>
  <guide>
${guideItems}
  </guide>
</package>`;
  oebps.file('content.opf', contentOpf);

  return {
    zip,
    bookTitle,
    author,
    bookLanguage,
    scenesCount: scenes.length,
    chapterFormatting,
    hasCover,
    contentFiles,
    tocNavEntries,
    contentOpf,
    hasVisualToc: includeVisualToc,
  };
}

export interface ExportEpubSuccessResult {
  destinationPath: string;
  bookTitle: string;
  author: string;
  scenesCount: number;
  chapterFormatting: ChapterFormatting;
  hasCover: boolean;
}

/**
 * Exports the currently loaded FoliantProject into a valid, standard-compliant .epub file
 * using JSZip and Tauri's native dialog & filesystem plugins.
 * Returns ExportEpubSuccessResult on success, or null if the user cancelled the save dialog.
 */
export async function exportProjectToEpub(
  project: FoliantProject,
  options?: EpubExportOptions
): Promise<ExportEpubSuccessResult | null> {
  const bookTitle = options?.title?.trim() || project.title || 'Untitled Project';

  // 1. Prompt user for save destination with native Tauri dialog
  const defaultFileName = `${bookTitle
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'my-novel'}.epub`;

  const destinationPath = await save({
    defaultPath: defaultFileName,
    filters: [
      {
        name: 'EPUB Book (*.epub)',
        extensions: ['epub'],
      },
    ],
    title: 'Export Project to EPUB',
  });

  if (!destinationPath) {
    return null; // User cancelled
  }

  // 2. Build EPUB in-memory package
  const built = buildEpubArchive(project, options);

  // 3. Generate final binary zip buffer
  const binaryZip = await built.zip.generateAsync({
    type: 'uint8array',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });

  // 4. Write binary EPUB file to destination path
  await writeFile(destinationPath, binaryZip);

  // 5. Return success result for Foliant's custom aesthetic notification modal
  return {
    destinationPath,
    bookTitle: built.bookTitle,
    author: built.author,
    scenesCount: built.scenesCount,
    chapterFormatting: built.chapterFormatting,
    hasCover: built.hasCover,
  };
}
