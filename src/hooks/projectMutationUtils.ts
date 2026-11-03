import { ask } from '@tauri-apps/plugin-dialog';
import { isTauriApp } from '../utils/platform';
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
  _count: number,
  parentId: string | null,
  language: string = 'en'
): TextNode {
  const isFolder = type === 'folder';
  const isEs = language === 'es' || language?.startsWith('es');
  let defaultTitle = '';
  if (isEs) {
    defaultTitle = isFolder ? `Nueva Sección` : 'Sin título';
  } else {
    defaultTitle = isFolder ? `New Section` : 'Untitled';
  }
  return {
    id: `${type}-${Date.now()}`,
    title: defaultTitle,
    content: '',
    synopsis: isFolder
      ? (isEs ? 'Notas generales de la sección...' : 'Section overview notes...')
      : (isEs ? 'Notas de la escena...' : 'Scene outline notes...'),
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
  const confirmMsg = `Are you sure you want to delete "${chapterTitle}"? This action cannot be undone.`;
  if (isTauriApp()) {
    try {
      return await ask(confirmMsg, { title: dialogTitle, kind: 'warning' });
    } catch {
      // fallback
    }
  }
  if (typeof window !== 'undefined') {
    return window.confirm(confirmMsg);
  }
  return false;
}

export function deleteChapterFromList(
  chapters: TextNode[],
  idToDelete: string,
  activeChapterId: string
): { updatedChapters: TextNode[]; nextActiveId?: string } {
  const idsToDelete = new Set([idToDelete, ...getDescendantChapterIds(chapters, idToDelete)]);
  const filtered = chapters.filter((c) => !idsToDelete.has(c.id));

  let nextActiveId: string | undefined;
  if (idsToDelete.has(activeChapterId)) {
    const nextActive = filtered.find((c) => c.type === 'scene') ?? filtered[0];
    nextActiveId = nextActive?.id ?? '';
  }

  return { updatedChapters: filtered, nextActiveId };
}
