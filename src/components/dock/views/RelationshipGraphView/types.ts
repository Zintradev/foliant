import {
  CharacterItem,
  CharacterRelationship,
  GraphJunctionNode,
  StorylineItem,
  CharacterNodePosition,
} from '../../../../types/dock';

export interface RelationshipGraphViewProps {
  characters: CharacterItem[];
  relationships: CharacterRelationship[];
  storylines?: StorylineItem[];
  junctions?: GraphJunctionNode[];
  characterPositions?: CharacterNodePosition[];
  onUpdateRelationships?: (updated: CharacterRelationship[]) => void;
  onUpdateCharacters?: (updated: CharacterItem[]) => void;
  onUpdateJunctions?: (updated: GraphJunctionNode[]) => void;
  onUpdateCharacterPositions?: (positions: CharacterNodePosition[]) => void;
  onAddCharacter?: (char: CharacterItem) => void;
  isExpanded?: boolean;
}

export interface GraphSnapshot {
  positions: Record<string, NodePosition>;
  relationships: CharacterRelationship[];
  junctions: GraphJunctionNode[];
  characters: CharacterItem[];
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface PanOffset {
  x: number;
  y: number;
}

export interface CanvasContextMenuState {
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
}

export interface NodeInfo {
  cx: number;
  cy: number;
  isJunction: boolean;
}
