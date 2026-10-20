import {
  TimelineMarker,
  StorylineItem,
  CharacterItem,
  CharacterRelationship,
  GraphJunctionNode,
  WorldItem,
} from './dock';

export type ChapterStatus =
  | 'Not Started'
  | 'In Progress'
  | 'First Draft'
  | 'Revised'
  | 'Completed';

export interface TextNode {
  id: string;
  title: string;
  content: string;
  synopsis?: string;
  type: 'folder' | 'scene';
  parentId?: string | null;
  targetWords?: number; // Optional specific target for this node
  status?: ChapterStatus;
  attachedCharacterIds?: string[];
  markers?: TimelineMarker[];
}

/** A single modular block inside the context panel. */
export interface ContextBlock {
  id: string;
  /** Display title, editable by the user. */
  title: string;
  /** 'text' = freeform textarea; 'list' = line-separated item list */
  type: 'text' | 'list';
  /** Raw content stored as a string (list items joined by '\n'). */
  content: string;
}

/**
 * FoliantProject represents the root persistent domain payload of a novel.
 * Invariant: Contains strictly normalized domain entities (JSON-serializable).
 * Volatile UI state (active tabs, zoom, pan, modal visibility, activeChapterId)
 * is kept strictly separate to ensure clean disk I/O and forward compatibility.
 */
export interface FoliantProject {
  id: string;
  title: string;
  lastModified: number;
  targetWords?: number;
  chapters: TextNode[];
  storylines: StorylineItem[];
  characters: CharacterItem[];
  relationships: CharacterRelationship[];
  junctions: GraphJunctionNode[];
  worldItems: WorldItem[];
  contextBlocks: ContextBlock[];
}

/**
 * Factory helper for a pristine, blank project payload.
 */
export function createEmptyProject(
  id: string = `project-${Date.now()}`,
  title: string = 'Untitled Manuscript'
): FoliantProject {
  return {
    id,
    title,
    lastModified: Date.now(),
    targetWords: 80000,
    chapters: [],
    storylines: [],
    characters: [],
    relationships: [],
    junctions: [],
    worldItems: [],
    contextBlocks: [],
  };
}
