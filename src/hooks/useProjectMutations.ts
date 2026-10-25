import { useCallback, Dispatch, SetStateAction } from 'react';
import { ask } from '@tauri-apps/plugin-dialog';
import { FoliantProject, TextNode, ContextBlock } from '../types/project';
import {
  CharacterItem,
  CharacterRelationship,
  GraphJunctionNode,
  StorylineItem,
  WorldItem,
} from '../types/dock';

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
        const newChapter: TextNode = {
          id: `${type}-${Date.now()}`,
          title: isFolder ? `Folder ${count}: New Section` : `Chapter ${count}: Untitled`,
          content: '',
          synopsis: isFolder ? 'Section overview notes...' : 'Scene outline notes...',
          type,
          parentId,
          targetWords: isFolder ? 5000 : 2500,
          status: 'In Progress',
          attachedCharacterIds: [],
        };
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

  /**
   * Deletes a chapter node with cascading descendant resolution.
   *
   * ### Tree Pruning Decision:
   * When deleting a folder, all descendant children and subfolders are computed recursively
   * and purged in a single atomic state update to prevent orphan records with invalid `parentId` pointers.
   * If the currently active scene is among the deleted nodes, focus gracefully falls back to the first
   * available scene in the remaining manuscript.
   */
  const handleDeleteChapter = useCallback(
    async (id: string) => {
      const chapterToDelete = project.chapters.find((c) => c.id === id);
      const chapterTitle = chapterToDelete?.title || 'this section';

      let confirmed = false;
      try {
        confirmed = await ask(
          `Are you sure you want to delete "${chapterTitle}"? This action cannot be undone.`,
          { title: deleteChapterDialogTitle, kind: 'warning' }
        );
      } catch {
        if (typeof window !== 'undefined') {
          confirmed = window.confirm(
            `Are you sure you want to delete "${chapterTitle}"? This action cannot be undone.`
          );
        }
      }

      if (!confirmed) return;

      setProject((prev) => {
        if (prev.chapters.length <= 1) return prev;
        const getDescendantIds = (parentId: string): string[] => {
          const children = prev.chapters.filter((c) => c.parentId === parentId);
          return children.flatMap((c) => [c.id, ...getDescendantIds(c.id)]);
        };

        const idsToDelete = new Set([id, ...getDescendantIds(id)]);
        const filtered = prev.chapters.filter((c) => !idsToDelete.has(c.id));

        if (idsToDelete.has(activeChapterId)) {
          const nextActive = filtered.find((c) => c.type === 'scene') ?? filtered[0];
          setActiveChapterId(nextActive?.id ?? '');
        }
        return {
          ...prev,
          lastModified: Date.now(),
          chapters: filtered,
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
        storylines:
          typeof storylinesOrUpdater === 'function'
            ? storylinesOrUpdater(prev.storylines)
            : storylinesOrUpdater,
      }));
    },
    [setProject]
  );

  const handleUpdateCharacters = useCallback(
    (charactersOrUpdater: CharacterItem[] | ((prev: CharacterItem[]) => CharacterItem[])) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        characters:
          typeof charactersOrUpdater === 'function'
            ? charactersOrUpdater(prev.characters)
            : charactersOrUpdater,
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
        relationships:
          typeof relationshipsOrUpdater === 'function'
            ? relationshipsOrUpdater(prev.relationships)
            : relationshipsOrUpdater,
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
        junctions:
          typeof junctionsOrUpdater === 'function'
            ? junctionsOrUpdater(prev.junctions)
            : junctionsOrUpdater,
      }));
    },
    [setProject]
  );

  const handleUpdateWorldItems = useCallback(
    (worldItemsOrUpdater: WorldItem[] | ((prev: WorldItem[]) => WorldItem[])) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        worldItems:
          typeof worldItemsOrUpdater === 'function'
            ? worldItemsOrUpdater(prev.worldItems)
            : worldItemsOrUpdater,
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
        contextBlocks:
          typeof contextBlocksOrUpdater === 'function'
            ? contextBlocksOrUpdater(prev.contextBlocks)
            : contextBlocksOrUpdater,
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
    handleUpdateWorldItems,
    handleUpdateContextBlocks,
  };
}
