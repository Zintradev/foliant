import { useState, useCallback, useEffect } from 'react';
import { TextNode } from '../../../../types/project';

export const OUTLINE_COLLAPSED_STORAGE_PREFIX = 'foliant_outline_collapsed_';

export function getOutlineStorageKey(projectId?: string): string {
  return projectId ? `${OUTLINE_COLLAPSED_STORAGE_PREFIX}${projectId}` : 'foliant_outline_collapsed_default';
}

function loadStoredCollapsed(storageKey: string): Set<string> | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed);
    }
  } catch {
    // Non-fatal if localStorage read fails
  }
  return null;
}

interface UseOutlineFoldersProps {
  chapters: TextNode[];
  activeChapterId?: string;
  onAddChapter: (type?: 'folder' | 'scene', parentId?: string | null) => void;
  onAddFolder?: (parentId?: string | null) => void;
  projectId?: string;
}

export function useOutlineFolders({
  chapters,
  activeChapterId,
  onAddChapter,
  onAddFolder,
  projectId,
}: UseOutlineFoldersProps) {
  const storageKey = getOutlineStorageKey(projectId);

  const computeInitialCollapsed = useCallback((): Set<string> => {
    const stored = loadStoredCollapsed(storageKey);
    if (stored !== null) {
      return stored;
    }
    const activeAncestors = new Set<string>();
    if (activeChapterId) {
      let current = chapters.find((c) => c.id === activeChapterId);
      while (current && current.parentId) {
        activeAncestors.add(current.parentId);
        current = chapters.find((c) => c.id === current!.parentId);
      }
    }
    const folderIds = chapters
      .filter((c) => c.type === 'folder' && !activeAncestors.has(c.id))
      .map((c) => c.id);
    return new Set(folderIds);
  }, [storageKey, activeChapterId, chapters]);

  // Start with saved folder state from local storage, or internal folders collapsed by default
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(computeInitialCollapsed);

  // Sync collapsed state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(collapsedFolderIds)));
    } catch {
      // Non-fatal if localStorage write fails
    }
  }, [collapsedFolderIds, storageKey]);

  // Reload folder state when switching project
  useEffect(() => {
    setCollapsedFolderIds(computeInitialCollapsed());
  }, [storageKey]);

  const handleToggleFolder = useCallback((folderId: string) => {
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleToggleExpandAll = useCallback(() => {
    if (collapsedFolderIds.size > 0) {
      setCollapsedFolderIds(new Set());
    } else {
      const folderIds = chapters.filter((c) => c.type === 'folder').map((c) => c.id);
      setCollapsedFolderIds(new Set(folderIds));
    }
  }, [collapsedFolderIds, chapters]);

  const handleAddSceneToParent = useCallback(
    (parentId: string | null = null) => {
      onAddChapter('scene', parentId);
      if (parentId && collapsedFolderIds.has(parentId)) {
        setCollapsedFolderIds((prev) => {
          const next = new Set(prev);
          next.delete(parentId);
          return next;
        });
      }
    },
    [onAddChapter, collapsedFolderIds]
  );

  const handleAddFolderToParent = useCallback(
    (parentId: string | null = null) => {
      if (onAddFolder) {
        onAddFolder(parentId);
      } else {
        onAddChapter('folder', parentId);
      }
      if (parentId && collapsedFolderIds.has(parentId)) {
        setCollapsedFolderIds((prev) => {
          const next = new Set(prev);
          next.delete(parentId);
          return next;
        });
      }
    },
    [onAddFolder, onAddChapter, collapsedFolderIds]
  );

  return {
    collapsedFolderIds,
    handleToggleFolder,
    handleToggleExpandAll,
    handleAddSceneToParent,
    handleAddFolderToParent,
  };
}
