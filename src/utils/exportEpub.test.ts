import { describe, it, expect } from 'vitest';
import { getChronologicalScenes } from './exportEpub';
import { TextNode } from '../types/project';

describe('exportEpub - getChronologicalScenes', () => {
  it('correctly traverses tree hierarchy depth-first and extracts scenes in order', () => {
    const chapters: TextNode[] = [
      { id: 'act-1', title: 'Act I', type: 'folder', content: '', parentId: null },
      { id: 'ch-1', title: 'Chapter 1', type: 'folder', content: '', parentId: 'act-1' },
      { id: 'sc-1', title: 'Scene 1', type: 'scene', content: 'Intro text', parentId: 'ch-1' },
      { id: 'sc-2', title: 'Scene 2', type: 'scene', content: 'Middle text', parentId: 'ch-1' },
      { id: 'act-2', title: 'Act II', type: 'folder', content: '', parentId: null },
      { id: 'sc-3', title: 'Scene 3', type: 'scene', content: 'Climax text', parentId: 'act-2' },
      { id: 'standalone', title: 'Epilogue', type: 'scene', content: 'Ending text', parentId: null },
    ];

    const scenes = getChronologicalScenes(chapters);
    expect(scenes.map((s) => s.id)).toEqual(['sc-1', 'sc-2', 'sc-3', 'standalone']);
  });

  it('handles empty chapters gracefully', () => {
    const scenes = getChronologicalScenes([]);
    expect(scenes).toEqual([]);
  });

  it('handles scenes without folders', () => {
    const chapters: TextNode[] = [
      { id: 's1', title: 'Scene 1', type: 'scene', content: '1', parentId: null },
      { id: 's2', title: 'Scene 2', type: 'scene', content: '2', parentId: null },
    ];
    const scenes = getChronologicalScenes(chapters);
    expect(scenes.map((s) => s.id)).toEqual(['s1', 's2']);
  });
});
