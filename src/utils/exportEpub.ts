import JSZip from 'jszip';
import { save, message } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { FoliantProject, TextNode } from '../types/project';

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
 * Resolves the primary author or creator names from project metadata,
 * characters, or context blocks.
 */
function resolveProjectAuthor(project: FoliantProject): string {
  // 1. Check if any context block explicitly defines an author
  const authorBlock = project.contextBlocks?.find(
    (b) => b.title.trim().toLowerCase() === 'author' || b.title.trim().toLowerCase() === 'author name'
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
 * Converts raw markdown or TipTap HTML content into clean, standard-compliant XHTML.
 */
function formatChapterBody(rawContent: string): string {
  if (!rawContent || !rawContent.trim()) {
    return '<p><em>(Empty scene)</em></p>';
  }

  const trimmed = rawContent.trim();

  // If already structured HTML (from TipTap editor)
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    // Ensure standard XHTML self-closing tags and clean encoding
    return trimmed
      .replace(/<br\s*\/?>/gi, '<br />')
      .replace(/<hr\s*\/?>/gi, '<hr />')
      .replace(/<img([^>]*?)(?<!\/)>/gi, '<img$1 />');
  }

  // Otherwise, transform plain text / Markdown lines into XHTML paragraphs
  const paragraphs = trimmed.split(/\n\s*\n/);
  return paragraphs
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
      formatted = formatted.replace(/\n/g, '<br />');

      return `<p>${formatted}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Builds standard EPUB 3 CSS typography stylesheet.
 */
function generateEpubCss(): string {
  return `@charset "utf-8";

body {
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.65;
  margin: 5% 8%;
  color: #1a1a1a;
  background-color: transparent;
}

h1, h2, h3, h4 {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-weight: 600;
  text-align: center;
  color: #111827;
  margin-top: 1.6em;
  margin-bottom: 0.8em;
}

h1.book-title {
  font-size: 2.2em;
  margin-top: 25%;
  margin-bottom: 0.3em;
  letter-spacing: -0.02em;
}

p.book-author {
  font-size: 1.2em;
  text-align: center;
  color: #4b5563;
  font-style: italic;
  margin-bottom: 2em;
}

h1.chapter-title {
  font-size: 1.7em;
  margin-top: 2em;
  margin-bottom: 1.2em;
  page-break-before: always;
}

p {
  margin-top: 0;
  margin-bottom: 0.85em;
  text-align: justify;
  text-indent: 1.5em;
}

p.lead, p:first-of-type {
  text-indent: 0;
}

blockquote {
  margin: 1.5em 2em;
  padding-left: 1em;
  border-left: 2px solid #9ca3af;
  font-style: italic;
  color: #374151;
}

.title-page {
  text-align: center;
  padding-top: 20%;
  page-break-after: always;
}

.title-page hr {
  width: 40%;
  margin: 2em auto;
  border: 0;
  border-top: 1px solid #d1d5db;
}

.toc-container {
  padding: 1em;
}

.toc-container ol {
  list-style: none;
  padding-left: 0;
}

.toc-container li {
  margin: 0.8em 0;
}

.toc-container a {
  color: #2563eb;
  text-decoration: none;
}
`;
}

/**
 * Exports the currently loaded FoliantProject into a valid, standard-compliant .epub file
 * using JSZip and Tauri's native dialog & filesystem plugins.
 */
export async function exportProjectToEpub(project: FoliantProject): Promise<boolean> {
  const author = resolveProjectAuthor(project);
  const bookTitle = project.title || 'Untitled Manuscript';
  const bookId = `urn:uuid:${project.id}`;
  const now = new Date().toISOString();
  const dateString = now.split('T')[0];

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
        name: 'EPUB Book',
        extensions: ['epub'],
      },
    ],
    title: 'Export Manuscript to EPUB',
  });

  if (!destinationPath) {
    return false; // User cancelled
  }

  // 2. Extract ordered scenes
  const rawScenes = getChronologicalScenes(project.chapters);
  const scenes =
    rawScenes.length > 0
      ? rawScenes
      : [
          {
            id: 'scene-default',
            title: 'Chapter 1',
            content: '<p>Manuscript has no scenes yet.</p>',
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

  // Stylesheet
  oebps.file('styles.css', generateEpubCss());

  // Title Page
  const titlePageHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(bookTitle)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body class="title-page">
  <h1 class="book-title">${escapeXml(bookTitle)}</h1>
  <p class="book-author">by ${escapeXml(author)}</p>
  <hr />
  <p style="font-size: 0.85em; color: #6b7280;">Generated with Foliant Studio</p>
</body>
</html>`;
  oebps.file('titlepage.xhtml', titlePageHtml);

  // Chapter files
  scenes.forEach((scene, index) => {
    const chapterNum = index + 1;
    const sceneTitle = scene.title || `Chapter ${chapterNum}`;
    const chapterHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(sceneTitle)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1 class="chapter-title">${escapeXml(sceneTitle)}</h1>
  ${formatChapterBody(scene.content)}
</body>
</html>`;
    oebps.file(`chapter_${chapterNum}.xhtml`, chapterHtml);
  });

  // Table of Contents (EPUB 3 nav)
  const navItems = scenes
    .map((scene, i) => {
      const chapterNum = i + 1;
      const title = scene.title || `Chapter ${chapterNum}`;
      return `      <li><a href="chapter_${chapterNum}.xhtml">${escapeXml(title)}</a></li>`;
    })
    .join('\n');

  const navHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body class="toc-container">
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="titlepage.xhtml">Title Page</a></li>
${navItems}
    </ol>
  </nav>
</body>
</html>`;
  oebps.file('toc.xhtml', navHtml);

  // Table of Contents (EPUB 2 NCX for backward compatibility)
  const ncxNavPoints = [
    `    <navPoint id="navPoint-1" playOrder="1">
      <navLabel><text>Title Page</text></navLabel>
      <content src="titlepage.xhtml"/>
    </navPoint>`,
    ...scenes.map((scene, i) => {
      const chapterNum = i + 1;
      const title = scene.title || `Chapter ${chapterNum}`;
      return `    <navPoint id="navPoint-${chapterNum + 1}" playOrder="${chapterNum + 1}">
      <navLabel><text>${escapeXml(title)}</text></navLabel>
      <content src="chapter_${chapterNum}.xhtml"/>
    </navPoint>`;
    }),
  ].join('\n');

  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(bookId)}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(bookTitle)}</text></docTitle>
  <docAuthor><text>${escapeXml(author)}</text></docAuthor>
  <navMap>
${ncxNavPoints}
  </navMap>
</ncx>`;
  oebps.file('toc.ncx', tocNcx);

  // OEBPS/content.opf
  const manifestItems = [
    '    <item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>',
    '    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
    '    <item id="css" href="styles.css" media-type="text/css"/>',
    ...scenes.map((_, i) => {
      const chapterNum = i + 1;
      return `    <item id="chapter_${chapterNum}" href="chapter_${chapterNum}.xhtml" media-type="application/xhtml+xml"/>`;
    }),
  ].join('\n');

  const spineItems = [
    '    <itemref idref="titlepage"/>',
    '    <itemref idref="toc"/>',
    ...scenes.map((_, i) => {
      const chapterNum = i + 1;
      return `    <itemref idref="chapter_${chapterNum}"/>`;
    }),
  ].join('\n');

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">${escapeXml(bookId)}</dc:identifier>
    <dc:title>${escapeXml(bookTitle)}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator id="creator">${escapeXml(author)}</dc:creator>
    <meta refines="#creator" property="role" scheme="marc:relators">aut</meta>
    <dc:date>${escapeXml(dateString)}</dc:date>
    <meta property="dcterms:modified">${escapeXml(now.replace(/\.\d+Z$/, 'Z'))}</meta>
  </metadata>
  <manifest>
${manifestItems}
  </manifest>
  <spine toc="ncx">
${spineItems}
  </spine>
</package>`;
  oebps.file('content.opf', contentOpf);

  // 4. Generate final binary zip buffer
  const binaryZip = await zip.generateAsync({
    type: 'uint8array',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });

  // 5. Write binary EPUB file to destination path
  await writeFile(destinationPath, binaryZip);

  // 6. Notify user of success
  await message(
    `Book "${bookTitle}" has been successfully exported to EPUB:\n\n${destinationPath}\n\nIncludes ${scenes.length} scene(s).`,
    {
      title: 'EPUB Export Successful',
      kind: 'info',
    }
  );

  return true;
}
