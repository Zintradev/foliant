import { EditorFontFamily } from '../../../types/settings';

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

export interface FoliantEditorProps {
  /** Stable ID of the chapter being displayed. Changing this ID triggers a content reload. */
  chapterId: string;
  /** Initial content for the chapter (HTML format). Consumed on mount or chapter switch. */
  content: string;
  /** Called once after a disk write confirms saved content, with target chapter ID. */
  onChange?: (content: string, chapterId: string) => void;
  onStatusChange?: (status: SaveStatus) => void;
  /** Whether to apply automatic first-line indentation to paragraphs. Default: true. */
  indentFirstLine?: boolean;
  /** Font family for the editor content. Default: 'serif'. */
  fontFamily?: EditorFontFamily;
  /** Optional search term to jump to and highlight upon loading. */
  searchTerm?: string | null;
  /** Whether changes should be auto-saved in real-time. Default: true. */
  isAutoSave?: boolean;
  /** Inactivity interval in seconds before triggering auto-save. Default: 1 (or 2). */
  autoSaveInterval?: number;
  /** Whether to hide the formatting toolbar (e.g. in Focus Mode). Default: false. */
  hideToolbar?: boolean;
  /** Editable scene title rendered at top of the paper. */
  title?: string;
  /** Callback when scene title is edited on the paper. */
  onTitleChange?: (title: string) => void;
  /** Scene word count displayed on paper. */
  wordCount?: number;
  /** Target word count. */
  targetWords?: number;
  externalToolbar?: boolean;
  onEditorReady?: (editor: import('@tiptap/react').Editor | null) => void;
}
