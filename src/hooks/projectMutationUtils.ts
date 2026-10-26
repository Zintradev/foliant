import { ask } from '@tauri-apps/plugin-dialog';
import { TextNode } from '../types/project';
import { getDescendantChapterIds } from '../utils/chapterTree';

export function resolveEntityUpdate<T>(
  prev: T,
  updaterOrValue: T | ((prev: T) => T)
): T {
  return typeof updaterOrValue === 'function'
    ? (updaterOrValue as (prev: T) => T)(prev)
    : updaterOrValue;
}

export function createDefaultChapter(
  type: 'folder' | 'scene',
  count: number,
  parentId: string | null
): TextNode {
  const isFolder = type === 'folder';
  return {
    id: `${type}-${Date.now()}`,
    title: isFolder ? `Folder ${count}: New Section` : `Chapter ${count}: Untitled`,
    content: '',
    synopsis: isFolder ? 'Section overview notes...' : 'Scene outline notes...',
    type,
    parentId,
    targetWords: isFolder ? 5000 : 2500,
    status: 'In Progress',
    attachedCharacterIds: [],
  };
}

export async function confirmChapterDeletion(
  chapterTitle: string,
  dialogTitle: string
): Promise<boolean> {
  try {
    return await ask(
      `Are you sure you want to delete "${chapterTitle}"? This action cannot be undone.`,
      { title: dialogTitle, kind: 'warning' }
    );
  } catch {
    if (typeof window !== 'undefined') {
      return window.confirm(
        `Are you sure you want to delete "${chapterTitle}"? This action cannot be undone.`
      );
    }
    return false;
  }
}

export function deleteChapterFromList(
  chapters: TextNode[],
  idToDelete: string,
  activeChapterId: string
): { updatedChapters: TextNode[]; nextActiveId?: string } {
  if (chapters.length <= 1) {
    return { updatedChapters: chapters };
  }

  const idsToDelete = new Set([idToDelete, ...getDescendantChapterIds(chapters, idToDelete)]);
  const filtered = chapters.filter((c) => !idsToDelete.has(c.id));

  let nextActiveId: string | undefined;
  if (idsToDelete.has(activeChapterId)) {
    const nextActive = filtered.find((c) => c.type === 'scene') ?? filtered[0];
    nextActiveId = nextActive?.id ?? '';
  }

  return { updatedChapters: filtered, nextActiveId };
}
