import {
  TimelineMarker,
  StorylineItem,
  CharacterItem,
  CharacterRelationship,
  GraphJunctionNode,
  CharacterNodePosition,
  WorldItem,
} from './dock';

export type ChapterStatus =
  | 'Not Started'
  | 'In Progress'
  | 'First Draft'
  | 'Revised'
  | 'Completed';

export type PlotStatus = 'Active' | 'Dormant' | 'Resolved';

export interface ScenePlotState {
  storylineId: string;
  status: 'Active' | 'Dormant' | 'Resolved';
}

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
  povCharacterId?: string;
  attachedWorldItemIds?: string[];
  markers?: TimelineMarker[];
  plotStates?: ScenePlotState[];
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
  characterPositions?: CharacterNodePosition[];
  worldItems: WorldItem[];
  contextBlocks: ContextBlock[];
}

/**
 * Factory helper for a pristine, blank project payload.
 */
export function createEmptyProject(
  id: string = `project-${Date.now()}`,
  title: string = 'Untitled Project'
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
    characterPositions: [],
    worldItems: [],
    contextBlocks: [],
  };
}
