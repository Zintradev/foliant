import { useCallback, Dispatch, SetStateAction } from 'react';
import { FoliantProject, TextNode, ContextBlock } from '../types/project';
import {
  CharacterItem,
  CharacterRelationship,
  GraphJunctionNode,
  CharacterNodePosition,
  StorylineItem,
  WorldItem,
} from '../types/dock';
import {
  resolveEntityUpdate,
  createDefaultChapter,
  deleteChapterFromList,
} from './projectMutationUtils';

export interface UseProjectMutationsOptions {
  project?: FoliantProject;
  setProject: Dispatch<SetStateAction<FoliantProject>>;
  activeChapterId: string;
  setActiveChapterId: (id: string) => void;
  deleteChapterDialogTitle?: string;
  language?: string;
}

export interface UseProjectMutationsReturn {
  handleContentChange: (newContent: string, targetChapterId?: string) => void;
  handleAddChapter: (type?: 'folder' | 'scene', parentId?: string | null) => void;
  handleDeleteChapter: (id: string) => Promise<void>;
  handleUpdateChapter: (id: string, updates: Partial<TextNode>) => void;
  handleReorderChapters: (sourceId: string, direction: 'up' | 'down') => void;
  handleUpdateStorylines: (
    storylinesOrUpdater: StorylineItem[] | ((prev: StorylineItem[]) => StorylineItem[])
  ) => void;
  handleUpdateCharacters: (
    charactersOrUpdater: CharacterItem[] | ((prev: CharacterItem[]) => CharacterItem[])
  ) => void;
  handleAddCharacter: (newChar: CharacterItem) => void;
  handleUpdateRelationships: (
    relationshipsOrUpdater:
      | CharacterRelationship[]
      | ((prev: CharacterRelationship[]) => CharacterRelationship[])
  ) => void;
  handleUpdateJunctions: (
    junctionsOrUpdater:
      | GraphJunctionNode[]
      | ((prev: GraphJunctionNode[]) => GraphJunctionNode[])
  ) => void;
  handleUpdateCharacterPositions: (
    positionsOrUpdater:
      | CharacterNodePosition[]
      | ((prev: CharacterNodePosition[]) => CharacterNodePosition[])
  ) => void;
  handleUpdateWorldItems: (
    worldItemsOrUpdater: WorldItem[] | ((prev: WorldItem[]) => WorldItem[])
  ) => void;
  handleUpdateContextBlocks: (
    contextBlocksOrUpdater:
      | ContextBlock[]
      | ((prev: ContextBlock[]) => ContextBlock[])
  ) => void;
  handleUpdateCustomStatuses: (statuses: string[]) => void;
  handleRenameCustomStatus: (oldName: string, newName: string) => void;
}

/**
 * useProjectMutations:
 * Centralizes all domain state mutations (chapters, storylines, characters, lore, notes)
 * on the novel's FoliantProject payload, ensuring lastModified is consistently refreshed.
 */
export function useProjectMutations({
  setProject,
  activeChapterId,
  setActiveChapterId,
  language = 'en',
}: UseProjectMutationsOptions): UseProjectMutationsReturn {
  const handleContentChange = useCallback(
    (newContent: string, targetChapterId?: string) => {
      const chapterIdToUpdate = targetChapterId || activeChapterId;
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        chapters: prev.chapters.map((ch) =>
          ch.id === chapterIdToUpdate ? { ...ch, content: newContent } : ch
        ),
      }));
    },
    [activeChapterId, setProject]
  );

  const handleAddChapter = useCallback(
    (type: 'folder' | 'scene' = 'scene', parentId: string | null = null) => {
      const isFolder = type === 'folder';
      setProject((prev) => {
        const count = prev.chapters.filter((c) => c.type === type).length + 1;
        const newChapter = createDefaultChapter(type, count, parentId, language);
        if (!isFolder) {
          setActiveChapterId(newChapter.id);
        }
        return {
          ...prev,
          lastModified: Date.now(),
          chapters: [...prev.chapters, newChapter],
        };
      });
      if (!isFolder && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('foliant-tour-scene-created'));
      }
    },
    [language, setActiveChapterId, setProject]
  );

  const handleDeleteChapter = useCallback(
    async (id: string) => {
      setProject((prev) => {
        const { updatedChapters, nextActiveId } = deleteChapterFromList(
          prev.chapters,
          id,
          activeChapterId
        );
        if (nextActiveId !== undefined) {
          setActiveChapterId(nextActiveId);
        }
        return {
          ...prev,
          lastModified: Date.now(),
          chapters: updatedChapters,
        };
      });
    },
    [activeChapterId, setActiveChapterId, setProject]
  );

  const handleUpdateChapter = useCallback(
    (id: string, updates: Partial<TextNode>) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        chapters: prev.chapters.map((ch) => (ch.id === id ? { ...ch, ...updates } : ch)),
      }));
    },
    [setProject]
  );

  const handleReorderChapters = useCallback(
    (sourceId: string, direction: 'up' | 'down') => {
      setProject((prev) => {
        const source = prev.chapters.find((c) => c.id === sourceId);
        if (!source) return prev;

        const siblings = prev.chapters.filter(
          (c) => (c.parentId ?? null) === (source.parentId ?? null)
        );
        const siblingIdx = siblings.findIndex((c) => c.id === sourceId);
        if (siblingIdx === -1) return prev;

        const targetSiblingIdx = direction === 'up' ? siblingIdx - 1 : siblingIdx + 1;
        if (targetSiblingIdx < 0 || targetSiblingIdx >= siblings.length) return prev;

        const target = siblings[targetSiblingIdx];
        const sourceGlobalIdx = prev.chapters.findIndex((c) => c.id === source.id);

        const nextChapters = [...prev.chapters];
        const [removed] = nextChapters.splice(sourceGlobalIdx, 1);
        const newTargetIdx = nextChapters.findIndex((c) => c.id === target.id);
        const insertAt = direction === 'up' ? newTargetIdx : newTargetIdx + 1;
        nextChapters.splice(insertAt, 0, removed);

        return {
          ...prev,
          lastModified: Date.now(),
          chapters: nextChapters,
        };
      });
    },
    [setProject]
  );

  const handleUpdateStorylines = useCallback(
    (storylinesOrUpdater: StorylineItem[] | ((prev: StorylineItem[]) => StorylineItem[])) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        storylines: resolveEntityUpdate(prev.storylines, storylinesOrUpdater),
      }));
    },
    [setProject]
  );

  const handleUpdateCharacters = useCallback(
    (charactersOrUpdater: CharacterItem[] | ((prev: CharacterItem[]) => CharacterItem[])) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        characters: resolveEntityUpdate(prev.characters, charactersOrUpdater),
      }));
    },
    [setProject]
  );

  const handleAddCharacter = useCallback(
    (newChar: CharacterItem) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        characters: [...prev.characters, newChar],
      }));
    },
    [setProject]
  );

  const handleUpdateRelationships = useCallback(
    (
      relationshipsOrUpdater:
        | CharacterRelationship[]
        | ((prev: CharacterRelationship[]) => CharacterRelationship[])
    ) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        relationships: resolveEntityUpdate(prev.relationships, relationshipsOrUpdater),
      }));
    },
    [setProject]
  );

  const handleUpdateJunctions = useCallback(
    (
      junctionsOrUpdater:
        | GraphJunctionNode[]
        | ((prev: GraphJunctionNode[]) => GraphJunctionNode[])
    ) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        junctions: resolveEntityUpdate(prev.junctions, junctionsOrUpdater),
      }));
    },
    [setProject]
  );

  const handleUpdateCharacterPositions = useCallback(
    (
      positionsOrUpdater:
        | CharacterNodePosition[]
        | ((prev: CharacterNodePosition[]) => CharacterNodePosition[])
    ) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        characterPositions: resolveEntityUpdate(prev.characterPositions || [], positionsOrUpdater),
      }));
    },
    [setProject]
  );

  const handleUpdateWorldItems = useCallback(
    (worldItemsOrUpdater: WorldItem[] | ((prev: WorldItem[]) => WorldItem[])) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        worldItems: resolveEntityUpdate(prev.worldItems, worldItemsOrUpdater),
      }));
    },
    [setProject]
  );

  const handleUpdateContextBlocks = useCallback(
    (
      contextBlocksOrUpdater:
        | ContextBlock[]
        | ((prev: ContextBlock[]) => ContextBlock[])
    ) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        contextBlocks: resolveEntityUpdate(prev.contextBlocks, contextBlocksOrUpdater),
      }));
    },
    [setProject]
  );

  const handleUpdateCustomStatuses = useCallback(
    (statuses: string[]) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        customStatuses: statuses,
      }));
    },
    [setProject]
  );

  const handleRenameCustomStatus = useCallback(
    (oldName: string, newName: string) => {
      setProject((prev) => {
        const nextStatuses = (prev.customStatuses || []).map((s) => (s === oldName ? newName : s));
        const nextChapters = prev.chapters.map((ch) =>
          ch.status === oldName ? { ...ch, status: newName as any } : ch
        );
        return {
          ...prev,
          lastModified: Date.now(),
          customStatuses: nextStatuses,
          chapters: nextChapters,
        };
      });
    },
    [setProject]
  );

  return {
    handleContentChange,
    handleAddChapter,
    handleDeleteChapter,
    handleUpdateChapter,
    handleReorderChapters,
    handleUpdateStorylines,
    handleUpdateCharacters,
    handleAddCharacter,
    handleUpdateRelationships,
    handleUpdateJunctions,
    handleUpdateCharacterPositions,
    handleUpdateWorldItems,
    handleUpdateContextBlocks,
    handleUpdateCustomStatuses,
    handleRenameCustomStatus,
  };
}
