import { TextNode } from '../../../../types/project';
import { StorylineItem } from '../../../../types/dock';

export type LayoutMode = 'details' | 'main' | 'split' | '1col' | '2col';

export interface OutlineViewProps {
  chapters: TextNode[];
  activeChapterId: string;
  onSelectChapter: (id: string) => void;
  onAddChapter: (type?: 'folder' | 'scene', parentId?: string | null) => void;
  onAddFolder?: (parentId?: string | null) => void;
  onDeleteChapter?: (id: string) => void;
  onUpdateChapter?: (id: string, updates: Partial<TextNode>) => void;
  isExpanded?: boolean;
  storylines?: StorylineItem[];
  onDirtyChange?: (isDirty: boolean) => void;
  projectTitle?: string;
  projectAuthor?: string;
  projectSynopsis?: string;
  projectCover?: string;
  projectCoverFileName?: string;
  currentFilePath?: string | null;
  onUpdateProjectMetadata?: (updates: {
    title?: string;
    author?: string;
    synopsis?: string;
    cover?: string;
    coverFileName?: string;
  }) => void;
}

export interface TreeItem {
  node: TextNode;
  children: TreeItem[];
  depth: number;
  wordCount: number;
}

export interface ContextMenuState {
  x: number;
  y: number;
  node: TextNode;
}
