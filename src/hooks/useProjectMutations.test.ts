import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectMutations } from './useProjectMutations';
import { FoliantProject, ContextBlock } from '../types/project';
import {
  CharacterItem,
  CharacterRelationship,
  GraphJunctionNode,
  StorylineItem,
  WorldItem,
} from '../types/dock';

// Mock @tauri-apps/plugin-dialog
vi.mock('@tauri-apps/plugin-dialog', () => ({
  ask: vi.fn(),
}));

import { ask } from '@tauri-apps/plugin-dialog';

const createMockProject = (): FoliantProject => ({
  id: 'test-project',
  title: 'Test Novel',
  targetWords: 80000,
  lastModified: 1000,
  chapters: [
    {
      id: 'folder-1',
      title: 'Act 1',
      content: '',
      synopsis: 'First Act notes',
      type: 'folder',
      parentId: null,
      targetWords: 5000,
      status: 'In Progress',
    },
    {
      id: 'scene-1',
      title: 'Scene 1: Introduction',
      content: 'Scene 1 text',
      synopsis: 'Intro scene',
      type: 'scene',
      parentId: 'folder-1',
      targetWords: 2500,
      status: 'First Draft',
    },
    {
      id: 'scene-2',
      title: 'Scene 2: Inciting Incident',
      content: 'Scene 2 text',
      synopsis: 'Inciting incident',
      type: 'scene',
      parentId: 'folder-1',
      targetWords: 2500,
      status: 'In Progress',
    },
    {
      id: 'scene-3',
      title: 'Scene 3: Standalone',
      content: 'Scene 3 text',
      synopsis: 'Standalone scene',
      type: 'scene',
      parentId: null,
      targetWords: 2500,
      status: 'Not Started',
    },
  ],
  characters: [
    {
      id: 'char-1',
      name: 'Elena',
      role: 'Protagonist',
      summary: 'Lead character',
      tags: [],
      fields: [],
    },
  ],
  relationships: [],
  junctions: [],
  storylines: [
    {
      id: 'story-1',
      title: 'Main Plot',
      color: 'emerald',
      description: 'The core journey',
      linkedChapterIds: ['scene-1'],
      fields: [],
    },
  ],
  worldItems: [
    {
      id: 'world-1',
      title: 'Capital City',
      category: 'Location',
      summary: 'Main metropolis',
      description: 'Dense urban center',
    },
  ],
  contextBlocks: [
    {
      id: 'block-1',
      title: 'Novel Theme',
      content: 'Redemption and hope',
      type: 'text',
    },
  ],
});

describe('useProjectMutations Hook', () => {
  let project: FoliantProject;
  let setProject: React.Dispatch<React.SetStateAction<FoliantProject>>;
  let activeChapterId: string;
  let setActiveChapterId: (id: string) => void;

  beforeEach(() => {
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = { invoke: vi.fn() };
    project = createMockProject();
    activeChapterId = 'scene-1';
    setActiveChapterId = vi.fn((id: string) => {
      activeChapterId = id;
    });
    setProject = vi.fn((action: React.SetStateAction<FoliantProject>) => {
      project = typeof action === 'function' ? action(project) : action;
    });
    vi.clearAllMocks();
  });

  it('handleContentChange updates active chapter content and sets fresh lastModified timestamp', () => {
    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId: 'scene-1',
        setActiveChapterId,
      })
    );

    const initialModified = project.lastModified;

    act(() => {
      result.current.handleContentChange('Updated content for scene 1');
    });

    const updatedScene = project.chapters.find((c) => c.id === 'scene-1');
    expect(updatedScene?.content).toBe('Updated content for scene 1');
    expect(project.lastModified).toBeGreaterThanOrEqual(initialModified);
  });

  it('handleContentChange updates a specific targetChapterId when provided', () => {
    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId: 'scene-1',
        setActiveChapterId,
      })
    );

    act(() => {
      result.current.handleContentChange('Updated content for scene 2', 'scene-2');
    });

    const scene2 = project.chapters.find((c) => c.id === 'scene-2');
    const scene1 = project.chapters.find((c) => c.id === 'scene-1');
    expect(scene2?.content).toBe('Updated content for scene 2');
    expect(scene1?.content).toBe('Scene 1 text');
  });

  it('handleAddChapter adds a new scene and automatically activates it', () => {
    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId,
        setActiveChapterId,
      })
    );

    act(() => {
      result.current.handleAddChapter('scene', 'folder-1');
    });

    expect(project.chapters.length).toBe(5);
    const newScene = project.chapters[project.chapters.length - 1];
    expect(newScene.type).toBe('scene');
    expect(newScene.parentId).toBe('folder-1');
    expect(newScene.targetWords).toBe(2500);
    expect(setActiveChapterId).toHaveBeenCalledWith(newScene.id);
  });

  it('handleAddChapter adds a folder with default folder metadata without activating it', () => {
    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId,
        setActiveChapterId,
      })
    );

    act(() => {
      result.current.handleAddChapter('folder', null);
    });

    expect(project.chapters.length).toBe(5);
    const newFolder = project.chapters[project.chapters.length - 1];
    expect(newFolder.type).toBe('folder');
    expect(newFolder.targetWords).toBe(5000);
    expect(newFolder.parentId).toBeNull();
    // Folders do not set active chapter
    expect(setActiveChapterId).not.toHaveBeenCalled();
  });

  it('handleDeleteChapter aborts if confirmation is rejected via ask dialog', async () => {
    vi.mocked(ask).mockResolvedValueOnce(false);

    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId: 'scene-2',
        setActiveChapterId,
      })
    );

    await act(async () => {
      await result.current.handleDeleteChapter('scene-2');
    });

    expect(project.chapters.some((c) => c.id === 'scene-2')).toBe(true);
  });

  it('handleDeleteChapter deletes a single scene and resets activeChapterId if it was active', async () => {
    vi.mocked(ask).mockResolvedValueOnce(true);

    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId: 'scene-1',
        setActiveChapterId,
      })
    );

    await act(async () => {
      await result.current.handleDeleteChapter('scene-1');
    });

    expect(project.chapters.some((c) => c.id === 'scene-1')).toBe(false);
    expect(setActiveChapterId).toHaveBeenCalledWith('scene-2');
  });

  it('handleDeleteChapter performs cascading deletion on folders removing all nested descendants', async () => {
    vi.mocked(ask).mockResolvedValueOnce(true);

    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId: 'scene-1',
        setActiveChapterId,
      })
    );

    await act(async () => {
      await result.current.handleDeleteChapter('folder-1');
    });

    // folder-1, scene-1, and scene-2 should all be purged
    expect(project.chapters.some((c) => c.id === 'folder-1')).toBe(false);
    expect(project.chapters.some((c) => c.id === 'scene-1')).toBe(false);
    expect(project.chapters.some((c) => c.id === 'scene-2')).toBe(false);
    // Standalone scene-3 remains
    expect(project.chapters.some((c) => c.id === 'scene-3')).toBe(true);
    expect(setActiveChapterId).toHaveBeenCalledWith('scene-3');
  });

  it('handleDeleteChapter guards against deleting the last remaining node', async () => {
    vi.mocked(ask).mockResolvedValueOnce(true);
    // Strip down to 1 chapter
    project.chapters = [project.chapters[0]];

    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId: 'folder-1',
        setActiveChapterId,
      })
    );

    await act(async () => {
      await result.current.handleDeleteChapter('folder-1');
    });

    expect(project.chapters.length).toBe(1);
  });

  it('handleDeleteChapter falls back to window.confirm when Tauri ask plugin throws', async () => {
    vi.mocked(ask).mockRejectedValueOnce(new Error('Tauri API unavailable'));
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId: 'scene-3',
        setActiveChapterId,
      })
    );

    await act(async () => {
      await result.current.handleDeleteChapter('scene-3');
    });

    expect(confirmSpy).toHaveBeenCalled();
    expect(project.chapters.some((c) => c.id === 'scene-3')).toBe(false);
    confirmSpy.mockRestore();
  });

  it('handleUpdateChapter updates partial fields on target chapter', () => {
    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId,
        setActiveChapterId,
      })
    );

    act(() => {
      result.current.handleUpdateChapter('scene-1', {
        title: 'New Scene Title',
        status: 'Completed',
        targetWords: 3500,
      });
    });

    const updated = project.chapters.find((c) => c.id === 'scene-1');
    expect(updated?.title).toBe('New Scene Title');
    expect(updated?.status).toBe('Completed');
    expect(updated?.targetWords).toBe(3500);
  });

  it('handleUpdateStorylines supports both array and functional updater', () => {
    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId,
        setActiveChapterId,
      })
    );

    // 1. Direct array
    const newStoryline: StorylineItem = {
      id: 'story-2',
      title: 'Subplot',
      color: 'purple',
      description: 'Secondary romance',
      linkedChapterIds: [],
      fields: [],
    };

    act(() => {
      result.current.handleUpdateStorylines([newStoryline]);
    });
    expect(project.storylines.length).toBe(1);
    expect(project.storylines[0].id).toBe('story-2');

    // 2. Functional updater
    act(() => {
      result.current.handleUpdateStorylines((prev) => [
        ...prev,
        { ...newStoryline, id: 'story-3', title: 'Tertiary Arc' },
      ]);
    });
    expect(project.storylines.length).toBe(2);
    expect(project.storylines[1].id).toBe('story-3');
  });

  it('handleUpdateCharacters and handleAddCharacter mutate character cast', () => {
    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId,
        setActiveChapterId,
      })
    );

    const newChar: CharacterItem = {
      id: 'char-2',
      name: 'Marcus',
      role: 'Antagonist',
      summary: 'Nemesis',
      tags: [],
      fields: [],
    };

    act(() => {
      result.current.handleAddCharacter(newChar);
    });
    expect(project.characters.length).toBe(2);
    expect(project.characters[1].name).toBe('Marcus');

    // Functional updater update
    act(() => {
      result.current.handleUpdateCharacters((prev) =>
        prev.map((c) => (c.id === 'char-2' ? { ...c, summary: 'Updated nemesis' } : c))
      );
    });
    expect(project.characters.find((c) => c.id === 'char-2')?.summary).toBe('Updated nemesis');
  });

  it('handleUpdateRelationships updates character relationships', () => {
    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId,
        setActiveChapterId,
      })
    );

    const rel: CharacterRelationship = {
      id: 'rel-1',
      sourceId: 'char-1',
      targetId: 'char-2',
      type: 'Rival',
      color: 'rose',
      direction: 'bidirectional',
    };

    act(() => {
      result.current.handleUpdateRelationships([rel]);
    });
    expect(project.relationships.length).toBe(1);
    expect(project.relationships[0].type).toBe('Rival');

    act(() => {
      result.current.handleUpdateRelationships((prev) => [
        ...prev,
        { ...rel, id: 'rel-2', type: 'Alliance' },
      ]);
    });
    expect(project.relationships.length).toBe(2);
  });

  it('handleUpdateJunctions updates graph junction nodes', () => {
    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId,
        setActiveChapterId,
      })
    );

    const junction: GraphJunctionNode = {
      id: 'junc-1',
      label: 'The Alliance',
      x: 100,
      y: 200,
    };

    act(() => {
      result.current.handleUpdateJunctions([junction]);
    });
    expect(project.junctions?.length).toBe(1);

    act(() => {
      result.current.handleUpdateJunctions((prev) =>
        prev.map((j) => ({ ...j, label: 'The Council' }))
      );
    });
    expect(project.junctions?.[0].label).toBe('The Council');
  });

  it('handleUpdateWorldItems updates world items encyclopedia', () => {
    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId,
        setActiveChapterId,
      })
    );

    const worldItem: WorldItem = {
      id: 'world-2',
      title: 'Crystal Orb',
      category: 'Lore',
      summary: 'Ancient relic',
      description: 'Glows in the dark',
    };

    act(() => {
      result.current.handleUpdateWorldItems([worldItem]);
    });
    expect(project.worldItems.length).toBe(1);
    expect(project.worldItems[0].title).toBe('Crystal Orb');

    act(() => {
      result.current.handleUpdateWorldItems((prev) => [
        ...prev,
        { ...worldItem, id: 'world-3', title: 'Dark Citadel' },
      ]);
    });
    expect(project.worldItems.length).toBe(2);
  });

  it('handleUpdateContextBlocks updates notes and context blocks', () => {
    const { result } = renderHook(() =>
      useProjectMutations({
        project,
        setProject,
        activeChapterId,
        setActiveChapterId,
      })
    );

    const block: ContextBlock = {
      id: 'block-2',
      title: 'Historical Timeline',
      content: 'Year 300: Great war',
      type: 'text',
    };

    act(() => {
      result.current.handleUpdateContextBlocks([block]);
    });
    expect(project.contextBlocks?.length).toBe(1);
    expect(project.contextBlocks?.[0].title).toBe('Historical Timeline');

    act(() => {
      result.current.handleUpdateContextBlocks((prev) => [
        ...prev,
        { ...block, id: 'block-3', title: 'Magic System' },
      ]);
    });
    expect(project.contextBlocks?.length).toBe(2);
  });
});
