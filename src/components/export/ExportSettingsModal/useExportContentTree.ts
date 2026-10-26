import { useState, useEffect, useMemo, useCallback } from 'react';
import { FoliantProject, TextNode } from '../../../types/project';
import { ChapterFormatting } from '../../../utils/exportEpub';
import { countWords } from '../../../utils/textMetrics';
import { TreeItem } from './types';

interface UseExportContentTreeParams {
  project: FoliantProject;
  isOpen: boolean;
}

export function useExportContentTree({ project, isOpen }: UseExportContentTreeParams) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());
  const [chapterFormatting, setChapterFormatting] = useState<ChapterFormatting>('top-folders');

  // Select all nodes by default and reset collapsed folders whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(project.chapters.map((c) => c.id)));
      setCollapsedFolderIds(new Set());
      setChapterFormatting('top-folders');
    }
  }, [isOpen, project.chapters]);

  // Build Hierarchical Tree of Chapters & Fast Descendant Lookup
  const { tree, allDescendantMap } = useMemo(() => {
    const nodeMap = new Map<string, TreeItem>();
    const roots: TreeItem[] = [];
    const chMap = new Map<string, string[]>();

    project.chapters.forEach((node) => {
      nodeMap.set(node.id, {
        node,
        children: [],
        depth: 0,
      });
      chMap.set(node.id, []);
    });

    project.chapters.forEach((node) => {
      const item = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(item);
        chMap.get(node.parentId)!.push(node.id);
      } else {
        roots.push(item);
      }
    });

    const setDepth = (item: TreeItem, currentDepth: number) => {
      item.depth = currentDepth;
      item.children.forEach((c) => setDepth(c, currentDepth + 1));
    };
    roots.forEach((root) => setDepth(root, 0));

    // Compute all descendants map for fast toggle
    const descMap = new Map<string, string[]>();
    const computeDescendants = (id: string): string[] => {
      const children = chMap.get(id) || [];
      const res: string[] = [...children];
      for (const childId of children) {
        res.push(...computeDescendants(childId));
      }
      descMap.set(id, res);
      return res;
    };
    project.chapters.forEach((n) => computeDescendants(n.id));

    return { tree: roots, childrenMap: chMap, allDescendantMap: descMap };
  }, [project.chapters]);

  const handleToggleFolder = useCallback((folderId: string) => {
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  const handleToggleNodeSelection = useCallback((node: TextNode) => {
    setSelectedIds((prevSelected) => {
      const isCurrentlySelected = prevSelected.has(node.id);
      const next = new Set(prevSelected);

      if (node.type === 'folder') {
        const descendants = allDescendantMap.get(node.id) || [];
        if (isCurrentlySelected) {
          next.delete(node.id);
          descendants.forEach((id) => next.delete(id));
        } else {
          next.add(node.id);
          descendants.forEach((id) => next.add(id));
        }
      } else {
        if (isCurrentlySelected) {
          next.delete(node.id);
        } else {
          next.add(node.id);
          let curr = project.chapters.find((c) => c.id === node.id);
          while (curr?.parentId) {
            next.add(curr.parentId);
            curr = project.chapters.find((c) => c.id === curr!.parentId);
          }
        }
      }

      return next;
    });
  }, [allDescendantMap, project.chapters]);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(project.chapters.map((c) => c.id)));
  }, [project.chapters]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleToggleExpandAll = useCallback(() => {
    setCollapsedFolderIds((prev) => {
      if (prev.size > 0) {
        return new Set();
      } else {
        const allFolderIds = project.chapters
          .filter((c) => c.type === 'folder')
          .map((c) => c.id);
        return new Set(allFolderIds);
      }
    });
  }, [project.chapters]);

  // Metrics
  const totalScenes = useMemo(
    () => project.chapters.filter((c) => c.type === 'scene'),
    [project.chapters]
  );
  const selectedScenes = useMemo(
    () => totalScenes.filter((s) => selectedIds.has(s.id)),
    [totalScenes, selectedIds]
  );
  const selectedWords = useMemo(
    () => selectedScenes.reduce((acc, s) => acc + countWords(s.content), 0),
    [selectedScenes]
  );

  return {
    tree,
    allDescendantMap,
    selectedIds,
    collapsedFolderIds,
    chapterFormatting,
    setChapterFormatting,
    handleToggleFolder,
    handleToggleNodeSelection,
    handleSelectAll,
    handleDeselectAll,
    handleToggleExpandAll,
    totalScenes,
    selectedScenes,
    selectedWords,
  };
}
