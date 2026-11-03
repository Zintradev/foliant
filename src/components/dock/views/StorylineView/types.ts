import { TextNode } from '../../../../types/project';
import { StorylineItem, StorylineColor, StorylineField, WorldItem, CharacterItem } from '../../../../types/dock';
import { AppColorSettings } from '../../../../types/settings';

export interface StorylineViewProps {
  storylines: StorylineItem[];
  chapters: TextNode[];
  worldItems?: WorldItem[];
  characters?: CharacterItem[];
  onChange: (storylines: StorylineItem[]) => void;
  onSelectChapter?: (chapterId: string) => void;
  colorSettings?: AppColorSettings;
  isExpanded?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

export type ViewMode = 'threads' | 'chapters';

export type { StorylineItem, StorylineColor, StorylineField, WorldItem, CharacterItem };
