import { useState, useCallback } from 'react';
import { TextNode } from '../../../../types/project';

interface UseOutlineFoldersProps {
  chapters: TextNode[];
  onAddChapter: (type?: 'folder' | 'scene', parentId?: string | null) => void;
  onAddFolder?: (parentId?: string | null) => void;
}

export function useOutlineFolders({
  chapters,
  onAddChapter,
  onAddFolder,
}: UseOutlineFoldersProps) {
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());

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
