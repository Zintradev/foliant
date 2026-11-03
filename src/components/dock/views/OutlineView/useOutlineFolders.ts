import { useState, useCallback } from 'react';
import { TextNode } from '../../../../types/project';

interface UseOutlineFoldersProps {
  chapters: TextNode[];
  activeChapterId?: string;
  onAddChapter: (type?: 'folder' | 'scene', parentId?: string | null) => void;
  onAddFolder?: (parentId?: string | null) => void;
}

export function useOutlineFolders({
  chapters,
  activeChapterId,
  onAddChapter,
  onAddFolder,
}: UseOutlineFoldersProps) {
  // Start with all internal folders collapsed by default, EXCEPT ancestors of active scene
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(() => {
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
  });

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
