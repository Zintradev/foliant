import { useMemo } from 'react';
import { TextNode, ChapterStatus } from '../../../../types/project';
import { TreeStatItem } from './types';
import { countWords } from '../../../../utils/textMetrics';

export function useProjectStatsTree(chapters: TextNode[]) {
  const sumSceneTargets = useMemo(() => {
    return chapters
      .filter((c) => c.type === 'scene')
      .reduce((sum, c) => sum + (c.targetWords || 0), 0);
  }, [chapters]);

  const { roots, totalWords, sceneCount, folderCount, statusCounts } = useMemo(() => {
    const nodeMap = new Map<string, TreeStatItem>();
    const rootItems: TreeStatItem[] = [];
    const counts: Record<ChapterStatus, number> = {
      'Not Started': 0,
      'In Progress': 0,
      'First Draft': 0,
      'Revised': 0,
      'Completed': 0,
    };

    chapters.forEach((node) => {
      nodeMap.set(node.id, {
        node,
        children: [],
        depth: 0,
        currentWords: 0,
        targetWords: node.targetWords || 0,
        completionPercent: 0,
      });

      const st = node.status || 'In Progress';
      counts[st] = (counts[st] || 0) + 1;
    });

    chapters.forEach((node) => {
      const item = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(item);
      } else {
        rootItems.push(item);
      }
    });

    let totalProjectWords = 0;
    let sCount = 0;
    let fCount = 0;

    const processStats = (item: TreeStatItem, depth: number): { words: number; target: number } => {
      item.depth = depth;

      if (item.node.type === 'scene') {
        sCount++;
        const words = countWords(item.node.content);
        item.currentWords = words;
        totalProjectWords += words;
        const target = item.node.targetWords || 0;
        item.targetWords = target;
        item.completionPercent = target > 0 ? (words / target) * 100 : 0;
        return { words, target };
      }

      fCount++;
      let sumWords = 0;
      let sumChildTargets = 0;

      for (const child of item.children) {
        const res = processStats(child, depth + 1);
        sumWords += res.words;
        sumChildTargets += res.target;
      }

      item.currentWords = sumWords;
      const effectiveTarget =
        item.node.targetWords && item.node.targetWords > 0
          ? item.node.targetWords
          : sumChildTargets;

      item.targetWords = effectiveTarget;
      item.completionPercent =
        effectiveTarget > 0 ? (sumWords / effectiveTarget) * 100 : 0;

      return { words: sumWords, target: effectiveTarget };
    };

    rootItems.forEach((root) => processStats(root, 0));

    return {
      roots: rootItems,
      totalWords: totalProjectWords,
      sceneCount: sCount,
      folderCount: fCount,
      statusCounts: counts,
    };
  }, [chapters]);

  return {
    roots,
    totalWords,
    sceneCount,
    folderCount,
    statusCounts,
    sumSceneTargets,
  };
}
