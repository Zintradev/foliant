import { describe, it, expect } from 'vitest';
import { stripHtml, searchProject } from './useGlobalSearch';
import { FoliantProject, TextNode } from '../types/project';

describe('useGlobalSearch & searchProject', () => {
  describe('stripHtml', () => {
    it('strips basic html tags cleanly', () => {
      const html = '<p>The night was <strong>dark</strong> and cold.</p>';
      expect(stripHtml(html)).toBe('The night was dark and cold.');
    });

    it('decodes HTML entities and handles empty strings', () => {
      expect(stripHtml('')).toBe('');
      const html = 'Lord &amp; Lady &quot;Winter&quot;&nbsp;smiled.';
      expect(stripHtml(html)).toBe('Lord & Lady "Winter" smiled.');
    });

    it('inserts spaces between adjacent block tags', () => {
      const html = '<p>First line.</p><p>Second line.</p>';
      expect(stripHtml(html)).toBe('First line. Second line.');
    });
  });

  describe('searchProject engine', () => {
    const mockChapters: TextNode[] = [
      {
        id: 'folder-1',
        title: 'Act I',
        content: '',
        type: 'folder',
        parentId: null,
      },
      {
        id: 'scene-1',
        title: 'The Tavern',
        content: '<p>A mysterious stranger entered the tavern and ordered ale.</p>',
        type: 'scene',
        parentId: 'folder-1',
      },
      {
        id: 'scene-2',
        title: 'The Forest',
        content: '<p>Shadows lengthened in the forest. A stranger lurked behind the pine tree.</p>',
        type: 'scene',
        parentId: 'folder-1',
      },
      {
        id: 'folder-2',
        title: 'Act II',
        content: '',
        type: 'folder',
        parentId: null,
      },
      {
        id: 'scene-3',
        title: 'The Castle',
        content: '<p>The king sat quietly upon his golden throne.</p>',
        type: 'scene',
        parentId: 'folder-2',
      },
    ];

    const mockProject: FoliantProject = {
      id: 'proj-1',
      title: 'Test Novel',
      lastModified: Date.now(),
      chapters: mockChapters,
      storylines: [],
      characters: [],
      relationships: [],
      junctions: [],
      worldItems: [],
      contextBlocks: [],
    };

    it('returns empty array when query is empty or whitespace', () => {
      expect(searchProject('', mockProject)).toEqual([]);
      expect(searchProject('   ', mockProject)).toEqual([]);
    });

    it('finds case-insensitive matches across global scope', () => {
      const results = searchProject('STRANGER', mockProject, { scope: 'global' });
      expect(results).toHaveLength(2);
      expect(results[0].sceneId).toBe('scene-1');
      expect(results[0].sceneTitle).toBe('The Tavern');
      expect(results[0].snippet.toLowerCase()).toContain('stranger');

      expect(results[1].sceneId).toBe('scene-2');
      expect(results[1].sceneTitle).toBe('The Forest');
      expect(results[1].snippet.toLowerCase()).toContain('stranger');
    });

    it('restricts search to current_folder scope', () => {
      // scene-1 belongs to folder-1
      const results = searchProject('stranger', mockProject, {
        scope: 'current_folder',
        activeSceneId: 'scene-1',
      });
      expect(results).toHaveLength(2);

      // Search for king in folder-1 -> should be 0 because king is in folder-2
      const kingInFolder1 = searchProject('king', mockProject, {
        scope: 'current_folder',
        activeSceneId: 'scene-1',
      });
      expect(kingInFolder1).toHaveLength(0);

      // Search for king in folder-2 -> 1 result
      const kingInFolder2 = searchProject('king', mockProject, {
        scope: 'current_folder',
        activeSceneId: 'scene-3',
      });
      expect(kingInFolder2).toHaveLength(1);
      expect(kingInFolder2[0].sceneId).toBe('scene-3');
    });

    it('restricts search to current_scene scope', () => {
      const results = searchProject('stranger', mockProject, {
        scope: 'current_scene',
        activeSceneId: 'scene-1',
      });
      expect(results).toHaveLength(1);
      expect(results[0].sceneId).toBe('scene-1');
      expect(results[0].sceneTitle).toBe('The Tavern');
    });

    it('finds multiple occurrences within a single scene', () => {
      const repeatChapter: TextNode[] = [
        {
          id: 'scene-multi',
          title: 'Echo Chamber',
          content: '<p>Echo here. Another echo there. And the final echo sounded loud.</p>',
          type: 'scene',
        },
      ];

      const results = searchProject('echo', repeatChapter, { scope: 'global' });
      expect(results).toHaveLength(3);
      results.forEach((r) => {
        expect(r.sceneId).toBe('scene-multi');
        expect(r.snippet.toLowerCase()).toContain('echo');
      });
    });
  });
});
