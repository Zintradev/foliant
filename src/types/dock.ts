// ---------------------------------------------------------------------------
// Dockable Tab System Types
// ---------------------------------------------------------------------------

export type DockSide = 'left' | 'right';

export type TabId =
  | 'inspector'
  | 'outline'
  | 'storyline'
  | 'timeline'
  | 'relationships'
  | 'stats'
  | 'context'
  | 'moodboard'
  | 'characters'
  | 'worldbuilding'
  | 'search';

export const ALL_SYSTEM_TABS: readonly TabId[] = [
  'inspector',
  'outline',
  'storyline',
  'timeline',
  'relationships',
  'stats',
  'context',
  'moodboard',
  'characters',
  'worldbuilding',
  'search',
] as const;

export interface TabConfig {
  id: TabId;
  label: string;
  iconName: string;
  description?: string;
}

export interface CharacterCustomField {
  id: string;
  label: string; // e.g. "Motivation", "Backstory", "Appearance" or custom
  value: string;
}

export interface CharacterTag {
  id: string;
  label: string;
  color: string; // Theme key or hex color
}

export type CharacterPresetRole = 'Protagonist' | 'Antagonist' | 'Supporting' | 'Minor';
export type CharacterRole = CharacterPresetRole | string;

export interface CharacterItem {
  id: string;
  name: string;
  role: CharacterRole;
  summary: string;
  avatarUrl?: string;
  notes?: string;
  tags?: CharacterTag[];
  fields?: CharacterCustomField[];
}

export type Character = CharacterItem;

export type RelationshipType =
  | 'Alliance'
  | 'Enmity'
  | 'Family'
  | 'Romance'
  | 'Debt'
  | 'Mentor'
  | 'Rival'
  | 'Custom';

export type LineStrokeStyle = 'solid' | 'dashed' | 'dotted';
export type RelationshipColor = 'zinc' | 'emerald' | 'rose' | 'amber' | 'blue' | 'purple' | 'cyan';
export type RelationshipDirection = 'bidirectional' | 'directed' | 'reverse' | 'none';

export interface GraphJunctionNode {
  id: string;
  label?: string; // e.g. "Marriage", "Union", "Branch"
  x: number;
  y: number;
  storylineId?: string;
}

export interface CharacterRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type?: RelationshipType;
  label?: string;
  style?: LineStrokeStyle;
  color?: RelationshipColor;
  customColor?: string;
  direction?: RelationshipDirection;
  notes?: string;
  controlOffset?: { x: number; y: number };
  labelT?: number;
}

export interface CharacterNodePosition {
  characterId: string;
  x: number;
  y: number;
}

export type StorylineColor = 'emerald' | 'purple' | 'amber' | 'blue' | 'rose' | 'cyan';

export interface StorylineField {
  id: string;
  label: string;
  value: string;
}

export interface StorylineItem {
  id: string;
  title: string;
  color: StorylineColor;
  description: string;
  linkedChapterIds: string[];
  fields?: StorylineField[];
  linkedWorldItemIds?: string[];
}

export type Storyline = StorylineItem;

// ---------------------------------------------------------------------------
// Timeline Key Event Marker / Narrative Alert Types
// ---------------------------------------------------------------------------

export type TimelineMarkerIcon = 'alert' | 'star' | 'flag' | 'skull' | 'custom';
export type TimelineMarkerColor = 'rose' | 'amber' | 'emerald' | 'cyan' | 'purple' | 'zinc';

export interface TimelineMarker {
  id: string;
  title: string;
  description?: string;
  icon: TimelineMarkerIcon;
  color: TimelineMarkerColor;
}

// ---------------------------------------------------------------------------
// Worldbuilding & Lore Types
// ---------------------------------------------------------------------------

export type WorldCategory = 'Location' | 'Faction' | 'Lore' | 'Artifact' | string;

export interface WorldCustomField {
  id: string;
  label: string;
  value: string;
}

export interface WorldItem {
  id: string;
  title: string;
  category: WorldCategory;
  summary: string;
  description: string;
  tags?: string[];
  imageUrl?: string;
  imagePath?: string;
  avatarUrl?: string;
  fields?: WorldCustomField[];
}
