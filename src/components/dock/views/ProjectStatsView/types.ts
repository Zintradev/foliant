import { TextNode, ChapterStatus } from '../../../../types/project';
import { StorylineItem } from '../../../../types/dock';

export interface ProjectStatsViewProps {
  chapters: TextNode[];
  storylines?: StorylineItem[];
  activeChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onUpdateChapter?: (id: string, updates: Partial<TextNode>) => void;
  targetWordCount?: number;
  onUpdateTargetWordCount?: (target: number) => void;
  isExpanded?: boolean;
}

export interface TreeStatItem {
  node: TextNode;
  children: TreeStatItem[];
  depth: number;
  currentWords: number;
  targetWords: number;
  completionPercent: number;
}

export interface ProgressStatus {
  percent: number;
  barColor: string;
  textColor: string;
  badgeText: string;
  badgeClass: string;
}

export type { TextNode, ChapterStatus, StorylineItem };
