import { open } from '@tauri-apps/plugin-dialog';
import { readDir, readTextFile } from '@tauri-apps/plugin-fs';
import { join, basename } from '@tauri-apps/api/path';
import { FoliantProject, TextNode, createEmptyProject } from '../types/project';
import {
  CharacterItem,
  CharacterCustomField,
  CharacterRole,
  WorldItem,
  WorldCategory,
  StorylineItem,
  StorylineColor,
} from '../types/dock';

export interface ImportManuskriptResult {
  project: FoliantProject;
  bundlePath: string | null;
}

/**
 * Generates a unique domain entity identifier.
 */
export function genId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Internal Manuskript character keys that should strictly be ignored to avoid polluting user attributes.
 */
export const IGNORED_CHARACTER_KEYS = new Set([
  'id',
  'importance',
  'pov',
  'color',
  'compile',
  'charcount',
  'setgoal',
]);

/**
 * Attempts to read a UTF-8 text file, returning null if the file does not exist or read fails.
 */
async function tryReadTextFile(filePath: string): Promise<string | null> {
  try {
    return await readTextFile(filePath);
  } catch {
    return null;
  }
}

/**
 * Cleans chapter and scene titles by removing numeric prefixes and file extensions.
 * Example: "01 - The Beginning.md" -> "The Beginning"
 */
export function cleanTitle(rawName: string): string {
  return (
    rawName
      .replace(/\.[^/.]+$/, '')
      .replace(/^[\d_-]+\s*[-–—]?\s*/, '')
      .trim() || rawName
  );
}

/**
 * Numerically compares file and folder names based on their leading digit prefixes.
 *
 * ### Narrative Integrity Rationale:
 * Manuskript serializes outline chapters to disk using numeric prefixes (e.g., `00/`, `01/`, `2/`, `10/`).
 * Standard ASCII/UTF-8 alphabetical sorting (`Array.prototype.sort()`) sorts lexicographically, which
 * inadvertently places chapter `10/` immediately after `1/` and before `2/`, destroying the author's
 * intended narrative chronology. This comparator extracts the leading integer radix to guarantee true
 * chronological sequence.
 */
export function compareNumericPrefixes(a: string, b: string): number {
  const matchA = a.match(/^(\d+)/);
  const matchB = b.match(/^(\d+)/);
  if (matchA && matchB) {
    const numA = parseInt(matchA[1], 10);
    const numB = parseInt(matchB[1], 10);
    if (numA !== numB) return numA - numB;
  } else if (matchA && !matchB) {
    return -1;
  } else if (!matchA && matchB) {
    return 1;
  }
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Parses key-value metadata from a Manuskript folder descriptor (`folder.txt`).
 * Extracts the folder title if defined.
 */
export function parseFolderMetadata(rawText: string, fallbackTitle: string): string {
  const lines = rawText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.slice(0, colonIndex).trim().toLowerCase();
      const val = trimmed.slice(colonIndex + 1).trim();
      if (key === 'title' && val) return val;
    }
  }
  return fallbackTitle;
}

/**
 * Parses a Manuskript scene (.md) file according to header metadata and prose formatting rules:
 * 1. The top metadata block ends at the FIRST line that does NOT match `^([a-zA-Z0-9_-]+):\s*(.*)$`.
 * 2. Extracts `title:` from the header metadata if present.
 * 3. Narrative prose begins immediately after the metadata block, ignoring leading blank lines.
 * 4. Filters out empty lines and wraps each paragraph in `<p>...</p>` tags.
 * 5. Replaces `*asterisks*` with `<em>...</em>` to ensure TipTap rich text compatibility.
 */
export function parseSceneMarkdown(rawText: string, fallbackTitle: string): { 
  title: string; 
  content: string; 
  synopsis: string; 
  targetWords: number 
} {
  const lines = rawText.split(/\r?\n/);
  
  let title = fallbackTitle;
  let synopsisLines: string[] = [];
  let notesLines: string[] = [];
  let targetWords = 2500;
  
  let proseStartIndex = 0;
  let currentBlock: 'summary' | 'notes' | 'none' = 'none';
  let foundProse = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Líneas vacías
    if (trimmed === '') {
       if (currentBlock === 'summary') synopsisLines.push('');
       if (currentBlock === 'notes') notesLines.push('');
       continue; 
    }

    // 2. Detectar Clave: Valor
    const metaMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (metaMatch) {
      const key = metaMatch[1].toLowerCase();
      const val = metaMatch[2].trim();
      
      if (key === 'title') title = val || title;
      else if (key === 'setgoal') targetWords = parseInt(val, 10) || targetWords;
      else if (key === 'summary' || key === 'summaryfull') {
        currentBlock = 'summary';
        if (val) synopsisLines.push(val);
      }
      else if (key === 'notes') {
        currentBlock = 'notes';
        if (val) notesLines.push(val);
      }
      else {
        currentBlock = 'none'; // Otras claves (compile, charCount, type...)
      }
      continue;
    }

    // 3. Ignorar etiquetas de referencia internas de Manuskript (Ej: {C:0:Ara})
    if (trimmed.startsWith('{') && trimmed.includes(':') && trimmed.endsWith('}')) {
      currentBlock = 'none';
      continue;
    }

    // 4. Si no es clave ni etiqueta, podría ser texto huérfano (Short Summary) o la Prosa.
    // Lookahead: Buscamos si hay claves técnicas puras más abajo.
    let hasTechnicalKeysBelow = false;
    for (let j = i + 1; j < lines.length && j < i + 10; j++) { 
       if (lines[j].match(/^(compile|setgoal|charcount|id|type|pov):/i)) {
          hasTechnicalKeysBelow = true;
          break;
       }
    }

    if (hasTechnicalKeysBelow) {
       // Es parte de la cabecera (Short Summary huérfano). Lo guardamos en la sinopsis.
       synopsisLines.push(trimmed);
       currentBlock = 'summary';
       continue;
    }

    // 5. ¡AQUÍ EMPIEZA LA NOVELA!
    proseStartIndex = i;
    foundProse = true;
    break;
  }

  if (!foundProse) {
      proseStartIndex = lines.length;
  }

  const rawProseLines = lines.slice(proseStartIndex);
  const htmlContent = rawProseLines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const withItalics = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
      return `<p>${withItalics}</p>`;
    })
    .join('');

  let finalSynopsis = synopsisLines.join('\n').trim();
  const finalNotes = notesLines.join('\n').trim();
  if (finalNotes) {
     finalSynopsis += finalSynopsis ? `\n\nNotas:\n${finalNotes}` : `Notas:\n${finalNotes}`;
  }

  return {
    title,
    content: htmlContent,
    synopsis: finalSynopsis,
    targetWords
  };
}

/**
 * Parses character attributes from a Manuskript character text file.
 * Discards internal engine metadata while capturing custom literary fields and notes.
 */
export function parseCharacterFile(rawText: string, fallbackName: string): CharacterItem {
  const lines = rawText.split(/\r?\n/);
  let characterName = '';
  let role: CharacterRole = 'Supporting';
  const fields: CharacterCustomField[] = [];
  const summaryParts: string[] = [];
  let blankLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      blankLineIndex = i;
      break;
    }

    let key = '';
    let value = '';
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      key = line.slice(0, colonIndex).trim();
      value = line.slice(colonIndex + 1).trim();
    } else {
      const parts = line.trim().split(/[\t]+|\s{2,}/);
      if (parts.length >= 2) {
        key = parts[0].trim();
        value = parts.slice(1).join(' ').trim();
      } else {
        key = 'Notes';
        value = line.trim();
      }
    }

    const lowerKey = key.toLowerCase();
    if (IGNORED_CHARACTER_KEYS.has(lowerKey)) continue;

    if (lowerKey === 'name') {
      if (value) characterName = value;
      continue;
    }
    if (lowerKey === 'role') {
      if (value) role = value as CharacterRole;
      continue;
    }

    if (value) {
      fields.push({ id: genId('field'), label: key, value });
      summaryParts.push(`${key}: ${value}`);
    }
  }

  if (blankLineIndex !== -1) {
    const bodyNotes = lines.slice(blankLineIndex + 1).join('\n').trim();
    if (bodyNotes) {
      fields.push({ id: genId('field'), label: 'Notes', value: bodyNotes });
      summaryParts.push(`Notes: ${bodyNotes}`);
    }
  }

  return {
    id: genId('char'),
    name: characterName || fallbackName,
    role,
    summary: summaryParts.join('\n'),
    fields: fields.length > 0 ? fields : undefined,
  };
}

/**
 * Loads and parses all character files from the `characters/` subfolder.
 */
async function loadCharacters(baseDir: string): Promise<CharacterItem[]> {
  try {
    const charactersDir = await join(baseDir, 'characters');
    const entries = await readDir(charactersDir);
    entries.sort((a, b) => compareNumericPrefixes(a.name || '', b.name || ''));

    const characterResults = await Promise.all(
      entries
        .filter((entry) => entry.name && entry.name.toLowerCase().endsWith('.txt'))
        .map(async (entry) => {
          const filePath = await join(charactersDir, entry.name!);
          const content = await tryReadTextFile(filePath);
          if (content !== null) {
            return parseCharacterFile(content, cleanTitle(entry.name!));
          }
          return null;
        })
    );
    return characterResults.filter((char): char is CharacterItem => char !== null);
  } catch (err) {
    console.warn('[Manuskript Importer] characters/ folder not found or unreadable:', err);
    return [];
  }
}

/**
 * Loads storyline / plot definitions from `plots.xml`.
 */
async function loadPlots(baseDir: string): Promise<StorylineItem[]> {
  const storylines: StorylineItem[] = [];
  const palette: StorylineColor[] = ['emerald', 'purple', 'amber', 'blue', 'rose', 'cyan'];

  try {
    const plotsPath = await join(baseDir, 'plots.xml');
    const rawXml = await tryReadTextFile(plotsPath);
    if (!rawXml) return storylines;

    const parser = new DOMParser();
    const doc = parser.parseFromString(rawXml, 'text/xml');

    const plotNodes = doc.querySelectorAll('plot');
    plotNodes.forEach((node, index) => {
      const name =
        node.getAttribute('name') ||
        node.getAttribute('title') ||
        node.querySelector('name')?.textContent ||
        `Plot ${index + 1}`;
      const desc =
        node.getAttribute('description') ||
        node.querySelector('description')?.textContent ||
        '';
      const result =
        node.getAttribute('result') ||
        node.querySelector('result')?.textContent ||
        '';
      const fullDescription = result ? `${desc}\n\nOutcome / Result: ${result}`.trim() : desc;

      storylines.push({
        id: genId('storyline'),
        title: name.trim(),
        color: palette[index % palette.length],
        description: fullDescription,
        linkedChapterIds: [],
      });
    });
  } catch (err) {
    console.warn('[Manuskript Importer] Failed to load plots.xml:', err);
  }
  return storylines;
}

/**
 * Normalizes OPML category tags into standard Foliant WorldCategory values.
 */
function normalizeWorldCategory(rawCategory: string | null): WorldCategory {
  if (!rawCategory) return 'Location';
  const lower = rawCategory.toLowerCase();
  if (lower.includes('faction') || lower.includes('group')) return 'Faction';
  if (lower.includes('lore') || lower.includes('magic')) return 'Lore';
  if (lower.includes('artifact') || lower.includes('item')) return 'Artifact';
  return 'Location';
}

/**
 * Loads world-building entities from `world.opml`.
 */
async function loadWorldItems(baseDir: string): Promise<WorldItem[]> {
  const worldItems: WorldItem[] = [];

  try {
    const worldPath = await join(baseDir, 'world.opml');
    const rawOpml = await tryReadTextFile(worldPath);
    if (!rawOpml) return worldItems;

    const parser = new DOMParser();
    const doc = parser.parseFromString(rawOpml, 'text/xml');

    const outlineNodes = doc.querySelectorAll('outline');
    let itemIndex = 0;

    outlineNodes.forEach((node) => {
      const name =
        node.getAttribute('name') ||
        node.getAttribute('text') ||
        node.getAttribute('title') ||
        '';
      const desc =
        node.getAttribute('description') ||
        node.getAttribute('_note') ||
        node.querySelector('description')?.textContent ||
        '';
      if (!name.trim() && !desc.trim()) return;

      const parentOutline = node.parentElement?.closest('outline');
      const parentLabel =
        parentOutline?.getAttribute('text') || parentOutline?.getAttribute('name') || null;

      worldItems.push({
        id: genId('world'),
        title: name.trim() || `World Item ${++itemIndex}`,
        category: normalizeWorldCategory(node.getAttribute('category') || parentLabel),
        summary: desc.trim(),
        description: desc.trim(),
        tags: [],
      });
    });
  } catch (err) {
    console.warn('[Manuskript Importer] Failed to load world.opml:', err);
  }
  return worldItems;
}

/**
 * Recursively traverses the hierarchical outline directory.
 * Entries not ending in .md or .txt are processed as folders and traversed recursively.
 * Uses official Tauri path resolution to preserve permission scopes.
 */
export async function traverseOutline(
  currentDir: string,
  parentId: string | null
): Promise<TextNode[]> {
  const nodes: TextNode[] = [];
  try {
    const entries = await readDir(currentDir);
    entries.sort((a, b) => compareNumericPrefixes(a.name || '', b.name || ''));

    for (const entry of entries) {
      const name = entry.name;
      if (!name) continue;

      const lowerName = name.toLowerCase();
      if (lowerName === 'folder.txt' || lowerName === 'index.txt' || name.startsWith('.')) {
        continue;
      }

      const entryPath = await join(currentDir, name);
      const isScene = lowerName.endsWith('.md') || lowerName.endsWith('.txt');

      if (!isScene) {
        const folderId = genId('folder');
        let title = cleanTitle(name);

        try {
          const folderTxtPath = await join(entryPath, 'folder.txt');
          const folderTxt = await readTextFile(folderTxtPath);
          title = parseFolderMetadata(folderTxt, title);
        } catch {
          // folder.txt is optional in Manuskript
        }

        nodes.push({
          id: folderId,
          title,
          content: '',
          synopsis: '',
          type: 'folder',
          parentId,
          targetWords: 5000,
          status: 'In Progress',
          attachedCharacterIds: [],
        });

        const children = await traverseOutline(entryPath, folderId);
        nodes.push(...children);
      } else {
        const sceneId = genId('scene');
        let title = cleanTitle(name);
        let content = '';
        let synopsis = '';
        let targetWords = 2500;

        try {
          const fileContent = await readTextFile(entryPath);
          const parsed = parseSceneMarkdown(fileContent, title);
          title = parsed.title;
          content = parsed.content;
          synopsis = parsed.synopsis;
          targetWords = parsed.targetWords;
        } catch (err) {
          content = `<p>⚠️ ERROR DE LECTURA: ${String(err)}</p>`;
        }

        nodes.push({
          id: sceneId,
          title,
          content,
          synopsis,
          type: 'scene',
          parentId,
          targetWords,
          status: 'In Progress',
          attachedCharacterIds: [],
        });
      }
    }
  } catch (err) {
    console.error(`[Manuskript Importer] Error traversing outline directory at '${currentDir}':`, err);
  }
  return nodes;
}

/**
 * Main importer entry point for Manuskript projects:
 * 1. Prompts the user to pick a project folder via native file dialog.
 * 2. Loads characters, plotlines, and world items concurrently.
 * 3. Recursively scans the `outline/` directory to construct chapter and scene nodes.
 * 4. Assembles the persistent FoliantProject bundle.
 */
export async function importManuskriptProject(): Promise<ImportManuskriptResult | null> {
  const selectedPath = (await open({ directory: true, multiple: false })) as string | null;
  if (!selectedPath) return null;

  const rawTitleName = await basename(selectedPath);
  let projectTitle = cleanTitle(rawTitleName || 'Imported Manuskript');

  try {
    const rootEntries = await readDir(selectedPath);
    const mskEntry = rootEntries.find(
      (e) =>
        e.name &&
        (e.name.toLowerCase() === 'manuskript.msk' || e.name.toLowerCase().endsWith('.msk'))
    );
    if (mskEntry && mskEntry.name) {
      const mskPath = await join(selectedPath, mskEntry.name);
      const mskContent = await tryReadTextFile(mskPath);
      if (mskContent) {
        try {
          const parsed = JSON.parse(mskContent);
          if (parsed.metadata?.title) projectTitle = parsed.metadata.title;
          else if (parsed.title) projectTitle = parsed.title;
        } catch {
          // Ignore non-JSON .msk files
        }
      }
    }
  } catch (err) {
    console.warn('[Manuskript Importer] Could not inspect project descriptor:', err);
  }

  const [characters, storylines, worldItems] = await Promise.all([
    loadCharacters(selectedPath),
    loadPlots(selectedPath),
    loadWorldItems(selectedPath),
  ]);

  let chapters: TextNode[] = [];
  try {
    const outlinePath = await join(selectedPath, 'outline');
    chapters = await traverseOutline(outlinePath, null);
  } catch (err) {
    console.error('[Manuskript Importer] Failed to access outline folder:', err);
  }

  if (chapters.length === 0) {
    chapters.push({
      id: genId('scene'),
      title: 'Chapter 1',
      content: '<p>Start writing your novel...</p>',
      synopsis: '',
      type: 'scene',
      parentId: null,
      targetWords: 2500,
      status: 'In Progress',
      attachedCharacterIds: [],
    });
  }

  const importedProject: FoliantProject = {
    ...createEmptyProject(genId('project'), projectTitle),
    chapters,
    characters,
    storylines,
    worldItems,
    lastModified: Date.now(),
  };

  return { project: importedProject, bundlePath: null };
}