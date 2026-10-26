import { describe, it, expect } from 'vitest';
import { getDescendantChapterIds } from './chapterTree';
import { TextNode } from '../types/project';

describe('getDescendantChapterIds', () => {
  const mockChapters: TextNode[] = [
    { id: 'root-1', title: 'Act 1', type: 'folder', content: '', parentId: null },
    { id: 'ch-1', title: 'Chapter 1', type: 'folder', content: '', parentId: 'root-1' },
    { id: 'sc-1', title: 'Scene 1', type: 'scene', content: 'Text 1', parentId: 'ch-1' },
    { id: 'sc-2', title: 'Scene 2', type: 'scene', content: 'Text 2', parentId: 'ch-1' },
    { id: 'sc-3', title: 'Scene 3', type: 'scene', content: 'Text 3', parentId: 'root-1' },
    { id: 'root-2', title: 'Act 2', type: 'folder', content: '', parentId: null },
    { id: 'sc-4', title: 'Scene 4', type: 'scene', content: 'Text 4', parentId: 'root-2' },
  ];

  it('resolves direct and nested descendants recursively', () => {
    const descendants = getDescendantChapterIds(mockChapters, 'root-1');
    expect(descendants).toEqual(['ch-1', 'sc-1', 'sc-2', 'sc-3']);
  });

  it('returns empty array when node has no children', () => {
    const descendants = getDescendantChapterIds(mockChapters, 'sc-1');
    expect(descendants).toEqual([]);
  });

  it('returns only children for a leaf folder', () => {
    const descendants = getDescendantChapterIds(mockChapters, 'ch-1');
    expect(descendants).toEqual(['sc-1', 'sc-2']);
  });
});
