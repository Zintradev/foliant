import { useMemo } from 'react';
import { FoliantProject, TextNode } from '../types/project';

export type SearchScope = 'global' | 'current_folder' | 'current_scene';

export interface SearchResult {
  sceneId: string;
  sceneTitle: string;
  snippet: string;
  matchIndex?: number;
}

export interface SearchOptions {
  scope?: SearchScope;
  activeSceneId?: string;
}

export interface UseGlobalSearchOptions extends SearchOptions {
  query: string;
  manuscript: FoliantProject | TextNode[];
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
 * DOMParser document trees across manuscript scenes on every query keystroke.
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
 * in the manuscript according to the specified scope.
 */
export function searchManuscript(
  query: string,
  manuscript: FoliantProject | TextNode[],
  options?: SearchOptions
): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const chapters: TextNode[] = Array.isArray(manuscript) ? manuscript : manuscript.chapters || [];
  const allScenes = chapters.filter((c) => c.type === 'scene');
  const scope: SearchScope = options?.scope || 'global';
  const activeSceneId = options?.activeSceneId;

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

  const results: SearchResult[] = [];
  const lowerQuery = trimmed.toLowerCase();
  const SNIPPET_BEFORE = 45;
  const SNIPPET_AFTER = 65;

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
      });

      // Advance search position to find subsequent occurrences
      searchStart = matchIndex + Math.max(1, trimmed.length);
    }
  }

  return results;
}

/**
 * React hook for global omnisearch across the manuscript with scope filtering.
 * Overloaded to support both positional arguments and an options object.
 */
export function useGlobalSearch(
  queryOrOptions: string | UseGlobalSearchOptions,
  manuscriptParam?: FoliantProject | TextNode[],
  scopeParam: SearchScope = 'global',
  activeSceneIdParam?: string
): SearchResult[] {
  const query = typeof queryOrOptions === 'string' ? queryOrOptions : queryOrOptions.query;
  const manuscript = typeof queryOrOptions === 'string' ? manuscriptParam! : queryOrOptions.manuscript;
  const scope = typeof queryOrOptions === 'string' ? scopeParam : queryOrOptions.scope || 'global';
  const activeSceneId =
    typeof queryOrOptions === 'string' ? activeSceneIdParam : queryOrOptions.activeSceneId;

  return useMemo(() => {
    if (!manuscript) return [];
    return searchManuscript(query, manuscript, { scope, activeSceneId });
  }, [query, manuscript, scope, activeSceneId]);
}
