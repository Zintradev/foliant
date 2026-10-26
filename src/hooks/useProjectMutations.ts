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
  confirmChapterDeletion,
  deleteChapterFromList,
} from './projectMutationUtils';

export interface UseProjectMutationsOptions {
  project: FoliantProject;
  setProject: Dispatch<SetStateAction<FoliantProject>>;
  activeChapterId: string;
  setActiveChapterId: (id: string) => void;
  deleteChapterDialogTitle?: string;
}

export interface UseProjectMutationsReturn {
  handleContentChange: (newContent: string, targetChapterId?: string) => void;
  handleAddChapter: (type?: 'folder' | 'scene', parentId?: string | null) => void;
  handleDeleteChapter: (id: string) => Promise<void>;
  handleUpdateChapter: (id: string, updates: Partial<TextNode>) => void;
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
}

/**
 * useProjectMutations:
 * Centralizes all domain state mutations (chapters, storylines, characters, lore, notes)
 * on the novel's FoliantProject payload, ensuring lastModified is consistently refreshed.
 */
export function useProjectMutations({
  project,
  setProject,
  activeChapterId,
  setActiveChapterId,
  deleteChapterDialogTitle = 'Delete Section',
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
        const newChapter = createDefaultChapter(type, count, parentId);
        if (!isFolder) {
          setActiveChapterId(newChapter.id);
        }
        return {
          ...prev,
          lastModified: Date.now(),
          chapters: [...prev.chapters, newChapter],
        };
      });
    },
    [setActiveChapterId, setProject]
  );

  const handleDeleteChapter = useCallback(
    async (id: string) => {
      const chapterToDelete = project.chapters.find((c) => c.id === id);
      const chapterTitle = chapterToDelete?.title || 'this section';

      const confirmed = await confirmChapterDeletion(chapterTitle, deleteChapterDialogTitle);
      if (!confirmed) return;

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
    [activeChapterId, deleteChapterDialogTitle, project.chapters, setActiveChapterId, setProject]
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

  return {
    handleContentChange,
    handleAddChapter,
    handleDeleteChapter,
    handleUpdateChapter,
    handleUpdateStorylines,
    handleUpdateCharacters,
    handleAddCharacter,
    handleUpdateRelationships,
    handleUpdateJunctions,
    handleUpdateCharacterPositions,
    handleUpdateWorldItems,
    handleUpdateContextBlocks,
  };
}
