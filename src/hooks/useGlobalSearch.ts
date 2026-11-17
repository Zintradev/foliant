import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { FoliantProject, TextNode } from '../types/project';

export type SearchScope = 'global' | 'current_folder' | 'current_scene';

export interface SearchResult {
  sceneId: string;
  sceneTitle: string;
  snippet: string;
  matchIndex?: number;
  matchedWord?: string;
  score?: number;
}

export interface SearchOptions {
  scope?: SearchScope;
  activeSceneId?: string;
  fuzzy?: boolean;
}

export interface UseGlobalSearchOptions extends SearchOptions {
  query: string;
  project: FoliantProject | TextNode[];
}

const MAX_STRIP_CACHE_SIZE = 500;
const plainTextCache = new Map<string, string>();

/**
 * Strips HTML markup and decodes XML/HTML entities to produce searchable plain text.
 *
 * ### Search Accuracy Decision:
 * Standard naive regex stripping (`/<[^>]+>/g`) causes word collisions at block boundaries:
 * `<p>Sentence one.</p><p>Sentence two.</p>` becomes `"Sentence one.Sentence two."`, which breaks
 * whole-word matching and multi-token queries. This function injects boundary spaces before closing
 * block tags (`</p>`, `</div>`, `</h2>`, etc.) prior to parsing to preserve natural word spacing.
 *
 * ### Performance Decision:
 * Employs a bounded LRU memory cache for stripped plain text strings to avoid creating thousands of
 * DOMParser document trees across project scenes on every query keystroke.
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  const cached = plainTextCache.get(html);
  if (cached !== undefined) {
    return cached;
  }

  let text = '';
  // Insert space before block closing tags so adjacent paragraphs don't concatenate into single words
  const spaced = html.replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, ' </$1> ');

  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(spaced, 'text/html');
      text = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    } catch {
      // Fallback to regex below
    }
  }

  if (!text) {
    text = spaced
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (plainTextCache.size >= MAX_STRIP_CACHE_SIZE) {
    const firstKey = plainTextCache.keys().next().value;
    if (firstKey !== undefined) {
      plainTextCache.delete(firstKey);
    }
  }
  plainTextCache.set(html, text);

  return text;
}

/**
 * Global search engine that finds case-insensitive matches across scenes
 * in the project according to the specified scope, with optional fuzzy typo tolerance.
 */
export function searchProject(
  query: string,
  project: FoliantProject | TextNode[],
  options?: SearchOptions
): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const chapters: TextNode[] = Array.isArray(project) ? project : project.chapters || [];
  const allScenes = chapters.filter((c) => c.type === 'scene');
  const scope: SearchScope = options?.scope || 'global';
  const activeSceneId = options?.activeSceneId;
  const isFuzzy = Boolean(options?.fuzzy);

  // Filter candidate scenes based on scope
  let candidateScenes = allScenes;

  if (scope === 'current_scene') {
    candidateScenes = activeSceneId
      ? allScenes.filter((s) => s.id === activeSceneId)
      : allScenes.slice(0, 1);
  } else if (scope === 'current_folder') {
    if (activeSceneId) {
      const activeNode = chapters.find((c) => c.id === activeSceneId);
      if (activeNode?.parentId) {
        // Collect active folder and all its nested subfolders
        const folderIds = new Set<string>([activeNode.parentId]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const node of chapters) {
            if (
              node.type === 'folder' &&
              node.parentId &&
              folderIds.has(node.parentId) &&
              !folderIds.has(node.id)
            ) {
              folderIds.add(node.id);
              changed = true;
            }
          }
        }
        candidateScenes = allScenes.filter((s) => s.parentId && folderIds.has(s.parentId));
      } else {
        // Root-level scenes without parent folder
        candidateScenes = allScenes.filter((s) => !s.parentId);
      }
    }
  }

  const SNIPPET_BEFORE = 45;
  const SNIPPET_AFTER = 65;

  if (!isFuzzy || trimmed.length < 2) {
    // Exact case-insensitive search
    const results: SearchResult[] = [];
    const lowerQuery = trimmed.toLowerCase();

    for (const scene of candidateScenes) {
      const plainText = stripHtml(scene.content || '');
      if (!plainText) continue;

      const lowerText = plainText.toLowerCase();
      let searchStart = 0;

      while (searchStart < lowerText.length) {
        const matchIndex = lowerText.indexOf(lowerQuery, searchStart);
        if (matchIndex === -1) break;

        const snippetStart = Math.max(0, matchIndex - SNIPPET_BEFORE);
        const snippetEnd = Math.min(plainText.length, matchIndex + trimmed.length + SNIPPET_AFTER);

        let snippet = plainText.substring(snippetStart, snippetEnd).trim();
        if (snippetStart > 0) {
          snippet = '...' + snippet;
        }
        if (snippetEnd < plainText.length) {
          snippet = snippet + '...';
        }

        results.push({
          sceneId: scene.id,
          sceneTitle: scene.title || 'Untitled Scene',
          snippet,
          matchIndex,
          matchedWord: plainText.substring(matchIndex, matchIndex + trimmed.length),
        });

        // Advance search position to find subsequent occurrences
        searchStart = matchIndex + Math.max(1, trimmed.length);
      }
    }

    return results;
  }

  // --- Fuzzy search via Fuse.js for typo tolerance ---
  const results: SearchResult[] = [];
  const wordRegex = /\b[\p{L}\p{N}'-]+\b/gu;

  interface WordOccurrence {
    sceneId: string;
    sceneTitle: string;
    plainText: string;
    word: string;
    matchIndex: number;
  }

  const wordOccurrences = new Map<string, WordOccurrence[]>();
  const scenesWithPlainText: { id: string; title: string; plainText: string }[] = [];

  for (const scene of candidateScenes) {
    const plainText = stripHtml(scene.content || '');
    if (!plainText) continue;

    scenesWithPlainText.push({
      id: scene.id,
      title: scene.title || 'Untitled Scene',
      plainText,
    });

    let m: RegExpExecArray | null;
    wordRegex.lastIndex = 0;
    while ((m = wordRegex.exec(plainText)) !== null) {
      const lower = m[0].toLowerCase();
      let list = wordOccurrences.get(lower);
      if (!list) {
        list = [];
        wordOccurrences.set(lower, list);
      }
      list.push({
        sceneId: scene.id,
        sceneTitle: scene.title || 'Untitled Scene',
        plainText,
        word: m[0],
        matchIndex: m.index,
      });
    }
  }

  const uniqueWordEntries = Array.from(wordOccurrences.keys()).map((w) => ({ word: w }));
  const fuse = new Fuse(uniqueWordEntries, {
    keys: ['word'],
    threshold: 0.4,
    includeScore: true,
  });

  const qWords = trimmed.split(/\s+/);
  const seenMatches = new Set<string>();

  if (qWords.length === 1) {
    const fuseMatches = fuse.search(qWords[0].toLowerCase());
    for (const fMatch of fuseMatches) {
      const matchedLower = fMatch.item.word;
      const occs = wordOccurrences.get(matchedLower) || [];
      for (const occ of occs) {
        const key = `${occ.sceneId}:${occ.matchIndex}`;
        if (seenMatches.has(key)) continue;
        seenMatches.add(key);

        const snippetStart = Math.max(0, occ.matchIndex - SNIPPET_BEFORE);
        const snippetEnd = Math.min(occ.plainText.length, occ.matchIndex + occ.word.length + SNIPPET_AFTER);

        let snippet = occ.plainText.substring(snippetStart, snippetEnd).trim();
        if (snippetStart > 0) {
          snippet = '...' + snippet;
        }
        if (snippetEnd < occ.plainText.length) {
          snippet = snippet + '...';
        }

        results.push({
          sceneId: occ.sceneId,
          sceneTitle: occ.sceneTitle,
          snippet,
          matchIndex: occ.matchIndex,
          matchedWord: occ.word,
          score: fMatch.score,
        });
      }
    }
  } else {
    // Multi-word query: resolve fuzzy typos for each word token
    const resolvedWords = qWords.map((qw) => {
      const lower = qw.toLowerCase();
      if (wordOccurrences.has(lower)) return lower;
      const res = fuse.search(lower);
      return res.length > 0 ? res[0].item.word : lower;
    });

    const escapedWords = resolvedWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const phraseRegex = new RegExp(escapedWords.join('[\\s,.:;!?"\'-]+'), 'gi');

    for (const scene of scenesWithPlainText) {
      phraseRegex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = phraseRegex.exec(scene.plainText)) !== null) {
        const key = `${scene.id}:${m.index}`;
        if (seenMatches.has(key)) continue;
        seenMatches.add(key);

        const snippetStart = Math.max(0, m.index - SNIPPET_BEFORE);
        const snippetEnd = Math.min(scene.plainText.length, m.index + m[0].length + SNIPPET_AFTER);

        let snippet = scene.plainText.substring(snippetStart, snippetEnd).trim();
        if (snippetStart > 0) {
          snippet = '...' + snippet;
        }
        if (snippetEnd < scene.plainText.length) {
          snippet = snippet + '...';
        }

        results.push({
          sceneId: scene.id,
          sceneTitle: scene.title,
          snippet,
          matchIndex: m.index,
          matchedWord: m[0],
          score: 0.1,
        });
      }
    }
  }

  return results;
}

/**
 * React hook for global omnisearch across the project with scope filtering.
 * Overloaded to support both positional arguments and an options object.
 */
export function useGlobalSearch(
  queryOrOptions: string | UseGlobalSearchOptions,
  projectParam?: FoliantProject | TextNode[],
  scopeParam: SearchScope = 'global',
  activeSceneIdParam?: string,
  fuzzyParam: boolean = false
): SearchResult[] {
  const isOptionsObj = typeof queryOrOptions !== 'string';
  const query = isOptionsObj ? queryOrOptions.query : queryOrOptions;
  const project = isOptionsObj ? queryOrOptions.project : projectParam!;
  const scope = isOptionsObj ? queryOrOptions.scope || 'global' : scopeParam;
  const activeSceneId = isOptionsObj ? queryOrOptions.activeSceneId : activeSceneIdParam;
  const fuzzy = isOptionsObj ? Boolean(queryOrOptions.fuzzy) : fuzzyParam;

  return useMemo(() => {
    if (!project) return [];
    return searchProject(query, project, { scope, activeSceneId, fuzzy });
  }, [query, project, scope, activeSceneId, fuzzy]);
}
