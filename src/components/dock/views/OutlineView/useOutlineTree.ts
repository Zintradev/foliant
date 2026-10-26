import { useMemo } from 'react';
import { TextNode } from '../../../../types/project';
import { TreeItem } from './types';
import { countWords } from '../../../../utils/textMetrics';

export function useOutlineTree(chapters: TextNode[]) {
  const { tree, totalWords } = useMemo(() => {
    const nodeMap = new Map<string, TreeItem>();
    const roots: TreeItem[] = [];

    chapters.forEach((node) => {
      nodeMap.set(node.id, {
        node,
        children: [],
        depth: 0,
        wordCount: 0,
      });
    });

    chapters.forEach((node) => {
      const item = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!;
        parent.children.push(item);
      } else {
        roots.push(item);
      }
    });

    let totalProjectWords = 0;
    const processTree = (item: TreeItem, currentDepth: number): number => {
      item.depth = currentDepth;
      if (item.node.type === 'scene') {
        const w = countWords(item.node.content);
        item.wordCount = w;
        totalProjectWords += w;
        return w;
      }

      let subtotal = 0;
      for (const child of item.children) {
        subtotal += processTree(child, currentDepth + 1);
      }
      item.wordCount = subtotal;
      return subtotal;
    };

    roots.forEach((root) => processTree(root, 0));

    return { tree: roots, totalWords: totalProjectWords };
  }, [chapters]);

  const { leftRoots, rightRoots } = useMemo(() => {
    const mid = Math.ceil(tree.length / 2);
    return {
      leftRoots: tree.slice(0, mid),
      rightRoots: tree.slice(mid),
    };
  }, [tree]);

  return { tree, totalWords, leftRoots, rightRoots };
}
