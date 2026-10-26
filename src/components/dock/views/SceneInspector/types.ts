import { TextNode } from '../../../../types/project';
import { CharacterItem, WorldItem, StorylineItem } from '../../../../types/dock';

export interface SceneInspectorProps {
  activeNodeId: string;
  activeNode?: TextNode;
  chapters?: TextNode[];
  characters?: CharacterItem[];
  worldItems?: WorldItem[];
  storylines?: StorylineItem[];
  onUpdateNode: (id: string, updates: Partial<TextNode>) => void;
  onSelectChapter?: (id: string) => void;
}

export type SceneInspectorAccordionKey = 'goal' | 'synopsis' | 'plots' | 'cast' | 'world';
