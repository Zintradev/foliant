import React from 'react';
import { TextNode } from '../../../../types/project';
import {
  StorylineItem,
  CharacterItem,
} from '../../../../types/dock';
import { AppSettings } from '../../../../types/settings';

export interface TimelineFilters {
  storyline: string;
  character: string;
}

export interface TimelineViewProps {
  chapters: TextNode[];
  storylines: StorylineItem[];
  characters: CharacterItem[];
  activeChapterId: string;
  onSelectChapter: (id: string) => void;
  onUpdateChapter?: (id: string, updates: Partial<TextNode>) => void;
  onUpdateStorylines?: (updated: StorylineItem[]) => void;
  onUpdateCharacters?: (updated: CharacterItem[]) => void;
  isExpanded?: boolean;
  timelineDropMode?: 'shift' | 'swap';
  selectedStorylineFilter?: string;
  onStorylineFilterChange?: (id: string) => void;
  selectedCharacterFilter?: string;
  onCharacterFilterChange?: (id: string) => void;
  timelineFilters?: TimelineFilters;
  setTimelineFilters?:
    | React.Dispatch<React.SetStateAction<TimelineFilters>>
    | ((filters: TimelineFilters) => void);
  appSettings?: AppSettings;
}

export interface ActivePopover {
  type: 'storyline' | 'character';
  itemId: string;
  sceneId: string;
  x: number;
  y: number;
}

export interface ActiveMarkerPopoverState {
  sceneId: string;
  markerId: string;
}

export interface ChapterGroup {
  folder: TextNode | null;
  scenes: TextNode[];
  totalWords: number;
}

export type TimelineColumnItem = {
  type: 'scene';
  scene: TextNode;
  originalIndex: number;
};
