import { useEffect, useRef, useCallback, useState, memo, lazy, Suspense } from 'react';
import { useEditor, EditorContent, Editor, Mark } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Quote,
  Minus,
  Omega,
  ChevronDown,
  Pipette,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { EditorFontFamily } from '../../types/settings';

const WordSymbolModal = lazy(() => import('./WordSymbolModal'));
const DarkColorPicker = lazy(() =>
  import('../common/DarkColorPicker').then((m) => ({ default: m.DarkColorPicker }))
);

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
}

// ---------------------------------------------------------------------------
// Tiptap Extensions: Custom Colored Underline & Font Size Mark
// ---------------------------------------------------------------------------
const CustomUnderline = Underline.extend({
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (el) => el.style.textDecorationColor || null,
        renderHTML: (attrs) => {
          if (!attrs.color) return {};
          return {
            style: `text-decoration: underline; text-decoration-color: ${attrs.color};`,
          };
        },
      },
    };
  },
});

const FontSize = Mark.create({
  name: 'fontSize',

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.size) return {};
          return {
            style: `font-size: ${attributes.size}; line-height: 1.35;`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return el.style.fontSize ? {} : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

// Color palettes for Underline & Highlight
const UNDERLINE_COLORS = [
  { hex: '#ef4444', name: 'Coral Red' },
  { hex: '#f59e0b', name: 'Amber Orange' },
  { hex: '#eab308', name: 'Bright Yellow' },
  { hex: '#10b981', name: 'Emerald Green' },
  { hex: '#06b6d4', name: 'Cyan Blue' },
  { hex: '#8b5cf6', name: 'Purple' },
  { hex: '#ffffff', name: 'White' },
];

const HIGHLIGHT_COLORS = [
  { hex: '#fef08a', name: 'Yellow' },
  { hex: '#a7f3d0', name: 'Emerald' },
  { hex: '#a5f3fc', name: 'Cyan' },
  { hex: '#fbcfe8', name: 'Rose' },
  { hex: '#fed7aa', name: 'Orange' },
  { hex: '#e9d5ff', name: 'Lavender' },
];

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton = memo(function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-xs transition flex items-center justify-center cursor-pointer select-none ${
        disabled
          ? 'opacity-30 cursor-not-allowed text-zinc-500'
          : isActive
          ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-xs'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/80 border border-transparent'
      }`}
    >
      {children}
    </button>
  );
});

interface EditorToolbarProps {
  editor: Editor | null;
  onOpenSymbols: () => void;
  currentFont: EditorFontFamily;
  onFontChange: (font: EditorFontFamily) => void;
}

const EditorToolbar = memo(function EditorToolbar({
  editor,
  onOpenSymbols,
  currentFont,
  onFontChange,
}: EditorToolbarProps) {
  const isEditorReady = !!editor && !editor.isDestroyed;

  // Underline and Highlight color state
  const [underlineColor, setUnderlineColor] = useState('#ef4444');
  const [highlightColor, setHighlightColor] = useState('#fef08a');
  const [isUnderlinePickerOpen, setIsUnderlinePickerOpen] = useState(false);
  const [isHighlightPickerOpen, setIsHighlightPickerOpen] = useState(false);
  const [isUnderlineCustomOpen, setIsUnderlineCustomOpen] = useState(false);
  const [isHighlightCustomOpen, setIsHighlightCustomOpen] = useState(false);

  const underlineColorRef = useRef<HTMLDivElement>(null);
  const highlightColorRef = useRef<HTMLDivElement>(null);

  // Close color popovers on outside click or escape
  useEffect(() => {
    if (!isUnderlinePickerOpen && !isHighlightPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (underlineColorRef.current && !underlineColorRef.current.contains(target)) {
        setIsUnderlinePickerOpen(false);
        setIsUnderlineCustomOpen(false);
      }
      if (highlightColorRef.current && !highlightColorRef.current.contains(target)) {
        setIsHighlightPickerOpen(false);
        setIsHighlightCustomOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUnderlinePickerOpen(false);
        setIsUnderlineCustomOpen(false);
        setIsHighlightPickerOpen(false);
        setIsHighlightCustomOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUnderlinePickerOpen, isHighlightPickerOpen]);

  // Current font size at cursor
  const activeFontSize = (editor?.getAttributes('fontSize')?.size as string) || '16px';

  const handleFontSizeChange = (size: string) => {
    if (!editor || editor.isDestroyed) return;
    if (size === '16px') {
      editor.chain().focus().unsetMark('fontSize').run();
    } else {
      editor.chain().focus().setMark('fontSize', { size }).run();
    }
  };

  return (
    <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-xs border-b border-zinc-800 pb-2 pt-0.5 mb-6 flex items-center flex-nowrap gap-1 select-none overflow-visible">
      {/* Font Family Quick Selector */}
      <div className="flex items-center shrink-0 mr-0.5">
        <select
          value={currentFont}
          onChange={(e) => onFontChange(e.target.value as EditorFontFamily)}
          className="h-6.5 bg-zinc-900 border border-zinc-800 text-[11px] rounded-xs px-1.5 py-0.5 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 focus:outline-none focus:border-zinc-600 cursor-pointer transition shrink-0"
          title="Font Family"
        >
          <option value="serif">Georgia</option>
          <option value="garamond">Garamond</option>
          <option value="sans">Inter</option>
          <option value="humanist">Verdana</option>
          <option value="mono">Courier</option>
          <option value="bookman">Bookman</option>
        </select>
      </div>

      {/* Font Size Selector (replaces rigid H1/H2) */}
      <div className="flex items-center shrink-0">
        <select
          value={activeFontSize}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className="h-6.5 bg-zinc-900 border border-zinc-800 text-[11px] rounded-xs px-1.5 py-0.5 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 focus:outline-none focus:border-zinc-600 cursor-pointer transition shrink-0"
          title="Font Size (px)"
        >
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
          <option value="28px">28</option>
          <option value="32px">32</option>
        </select>
      </div>

      <div className="w-px h-3.5 bg-zinc-850 shrink-0 mx-0.5" />

      {/* Text Styles */}
      <ToolbarButton
        title="Bold (Ctrl+B)"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive('bold')}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarButton
        title="Italic (Ctrl+I)"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive('italic')}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolbarButton>

      {/* Underline Split / Dropdown Button */}
      <div className="relative flex items-center shrink-0" ref={underlineColorRef}>
        <button
          type="button"
          disabled={!isEditorReady}
          title={`Underline (Ctrl+U) - Current Color: ${underlineColor}`}
          onClick={() => {
            if (!isEditorReady) return;
            if (editor.isActive('underline')) {
              editor.chain().focus().unsetMark('underline').run();
            } else {
              editor.chain().focus().setMark('underline', { color: underlineColor }).run();
            }
          }}
          className={`h-7 px-1.5 rounded-l-xs transition flex flex-col items-center justify-center cursor-pointer select-none ${
            !isEditorReady
              ? 'opacity-30 cursor-not-allowed text-zinc-500'
              : isEditorReady && editor.isActive('underline')
              ? 'bg-zinc-800 text-zinc-100 border-l border-t border-b border-zinc-700/80 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/80 border border-transparent'
          }`}
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
          <span
            className="w-3.5 h-0.5 mt-0.5 rounded-full"
            style={{ backgroundColor: underlineColor }}
          />
        </button>
        <button
          type="button"
          disabled={!isEditorReady}
          title="Underline Color Palette"
          onClick={() => setIsUnderlinePickerOpen((prev) => !prev)}
          className={`h-7 px-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-r-xs border-r border-t border-b border-zinc-800/80 cursor-pointer flex items-center justify-center transition ${
            isUnderlinePickerOpen ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : ''
          }`}
        >
          <ChevronDown className="w-2.5 h-2.5" />
        </button>

        {/* Underline Color Dropdown Panel */}
        {isUnderlinePickerOpen && (
          <div className="absolute left-0 top-full mt-1.5 p-2.5 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl z-50 w-52 space-y-2.5 select-none ring-1 ring-black/80 backdrop-blur-md">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Underline Color</span>
              <span className="w-2.5 h-2.5 rounded-full border border-zinc-700" style={{ backgroundColor: underlineColor }} />
            </div>
            <div className="grid grid-cols-7 gap-1">
              {UNDERLINE_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => {
                    setUnderlineColor(c.hex);
                    setIsUnderlinePickerOpen(false);
                    setIsUnderlineCustomOpen(false);
                    editor?.chain().focus().setMark('underline', { color: c.hex }).run();
                  }}
                  className={`w-5.5 h-5.5 rounded-xs border transition hover:scale-115 flex items-center justify-center cursor-pointer ${
                    underlineColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'border-white scale-110 shadow-xs ring-1 ring-zinc-400'
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[10px]">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Pipette className="w-3 h-3 text-zinc-400" />
                <span className="font-mono text-[10px] uppercase tracking-wider">Custom</span>
              </div>
              <button
                type="button"
                onClick={() => setIsUnderlineCustomOpen((prev) => !prev)}
                className={`relative flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-zinc-950 border transition cursor-pointer group shadow-inner ${
                  isUnderlineCustomOpen ? 'border-zinc-500 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'
                }`}
                title="Pick exact custom color"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-zinc-700/80 shadow-xs shrink-0"
                  style={{ backgroundColor: underlineColor }}
                />
                <span className="font-mono text-[10px] text-zinc-300 group-hover:text-white uppercase">
                  {underlineColor}
                </span>
              </button>
            </div>

            {/* In-App Exact Dark Color Picker Popover */}
            {isUnderlineCustomOpen && (
              <Suspense fallback={null}>
                <DarkColorPicker
                  color={underlineColor}
                  title="Exact Underline Color"
                  onChange={(hex) => {
                    setUnderlineColor(hex);
                    editor?.chain().focus().setMark('underline', { color: hex }).run();
                  }}
                  onClose={() => setIsUnderlineCustomOpen(false)}
                />
              </Suspense>
            )}
          </div>
        )}
      </div>

      <ToolbarButton
        title="Strikethrough"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive('strike')}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarButton>

      {/* Highlighter Split / Dropdown Button */}
      <div className="relative flex items-center shrink-0" ref={highlightColorRef}>
        <button
          type="button"
          disabled={!isEditorReady}
          title={`Highlight - Current Color: ${highlightColor}`}
          onClick={() => {
            if (!isEditorReady) return;
            if (editor.isActive('highlight')) {
              editor.chain().focus().unsetHighlight().run();
            } else {
              editor.chain().focus().setHighlight({ color: highlightColor }).run();
            }
          }}
          className={`h-7 px-1.5 rounded-l-xs transition flex flex-col items-center justify-center cursor-pointer select-none ${
            !isEditorReady
              ? 'opacity-30 cursor-not-allowed text-zinc-500'
              : isEditorReady && editor.isActive('highlight')
              ? 'bg-zinc-800 text-zinc-100 border-l border-t border-b border-zinc-700/80 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/80 border border-transparent'
          }`}
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span
            className="w-3.5 h-0.5 mt-0.5 rounded-full"
            style={{ backgroundColor: highlightColor }}
          />
        </button>
        <button
          type="button"
          disabled={!isEditorReady}
          title="Highlight Color Palette"
          onClick={() => {
            setIsHighlightPickerOpen((prev) => {
              if (prev) setIsHighlightCustomOpen(false);
              return !prev;
            });
          }}
          className={`h-7 px-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850/80 rounded-r-xs border-r border-t border-b border-zinc-800/80 cursor-pointer flex items-center justify-center transition ${
            isHighlightPickerOpen ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : ''
          }`}
        >
          <ChevronDown className="w-2.5 h-2.5" />
        </button>

        {/* Highlight Color Dropdown Panel */}
        {isHighlightPickerOpen && (
          <div className="absolute left-0 top-full mt-1.5 p-2.5 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl z-50 w-52 space-y-2.5 select-none ring-1 ring-black/80 backdrop-blur-md">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Highlight Color</span>
              <span className="w-2.5 h-2.5 rounded-full border border-zinc-700" style={{ backgroundColor: highlightColor }} />
            </div>
            <div className="grid grid-cols-6 gap-1">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => {
                    setHighlightColor(c.hex);
                    setIsHighlightPickerOpen(false);
                    setIsHighlightCustomOpen(false);
                    editor?.chain().focus().setHighlight({ color: c.hex }).run();
                  }}
                  className={`w-6 h-5.5 rounded-xs border transition hover:scale-115 flex items-center justify-center cursor-pointer ${
                    highlightColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'border-white scale-110 shadow-xs ring-1 ring-zinc-400'
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setIsHighlightPickerOpen(false);
                  setIsHighlightCustomOpen(false);
                  editor?.chain().focus().unsetHighlight().run();
                }}
                className="px-1.5 py-0.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-850/80 rounded-xs text-[10px] font-mono transition cursor-pointer"
              >
                No Color
              </button>
              <button
                type="button"
                onClick={() => setIsHighlightCustomOpen((prev) => !prev)}
                className={`relative flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-zinc-950 border transition cursor-pointer group shadow-inner ${
                  isHighlightCustomOpen ? 'border-zinc-500 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'
                }`}
                title="Pick exact custom color"
              >
                <Pipette className="w-3 h-3 text-zinc-400" />
                <span
                  className="w-2.5 h-2.5 rounded-full border border-zinc-700/80 shadow-xs shrink-0"
                  style={{ backgroundColor: highlightColor }}
                />
                <span className="font-mono text-[10px] text-zinc-300 group-hover:text-white uppercase">
                  {highlightColor}
                </span>
              </button>
            </div>

            {/* In-App Exact Dark Color Picker Popover */}
            {isHighlightCustomOpen && (
              <Suspense fallback={null}>
                <DarkColorPicker
                  color={highlightColor}
                  title="Exact Highlight Color"
                  onChange={(hex) => {
                    setHighlightColor(hex);
                    editor?.chain().focus().setHighlight({ color: hex }).run();
                  }}
                  onClose={() => setIsHighlightCustomOpen(false)}
                />
              </Suspense>
            )}
          </div>
        )}
      </div>

      <div className="w-px h-3.5 bg-zinc-850 shrink-0 mx-0.5" />

      {/* Text Alignment */}
      <ToolbarButton
        title="Align Left"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive({ textAlign: 'left' })}
        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarButton
        title="Align Center"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive({ textAlign: 'center' })}
        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarButton
        title="Align Justify"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
      >
        <AlignJustify className="w-3.5 h-3.5" />
      </ToolbarButton>

      <div className="w-px h-3.5 bg-zinc-850 shrink-0 mx-0.5" />

      {/* Blockquote */}
      <ToolbarButton
        title="Blockquote"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive('blockquote')}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="w-3.5 h-3.5" />
      </ToolbarButton>

      {/* Horizontal Divider / Rule */}
      <ToolbarButton
        title="Horizontal Separator (Markdown ---)"
        disabled={!isEditorReady}
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="w-3.5 h-3.5" />
      </ToolbarButton>

      <div className="w-px h-3.5 bg-zinc-850 shrink-0 mx-0.5" />

      {/* Writer's Symbols Palette (Icon Only) */}
      <ToolbarButton
        title="Insert Symbol (Word Palette)"
        disabled={!isEditorReady}
        onClick={onOpenSymbols}
      >
        <Omega className="w-3.5 h-3.5 text-emerald-400" />
      </ToolbarButton>
    </div>
  );
});

function FoliantEditorComponent({
  chapterId,
  content,
  onChange,
  onStatusChange,
  indentFirstLine = true,
  fontFamily = 'serif',
  searchTerm,
}: FoliantEditorProps) {
  const [localFont, setLocalFont] = useState<EditorFontFamily>(fontFamily);
  const [isSymbolsModalOpen, setIsSymbolsModalOpen] = useState(false);

  // Sync prop changes into local font state
  useEffect(() => {
    if (fontFamily) {
      setLocalFont(fontFamily);
    }
  }, [fontFamily]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable callback refs — always reflect the latest prop values without
  // triggering re-renders or acting as effect dependencies.
  const onStatusChangeRef = useRef(onStatusChange);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onChangeRef.current = onChange;
  });

  // Non-reactive snapshot of the latest incoming content prop.
  const incomingContentRef = useRef<string>(content);
  incomingContentRef.current = content;

  // Tracks which chapter is currently loaded inside the active editor instance.
  const activeChapterIdRef = useRef<string>(chapterId);

  // Tracks whether there are uncommitted keystrokes for the active chapter.
  const isDirtyRef = useRef<boolean>(false);

  // ---------------------------------------------------------------------------
  // Independent Disk Save Routine
  // ---------------------------------------------------------------------------
  const executeSave = useCallback(
    async (targetChapterId: string, contentToSave: string) => {
      const isCurrentActive = targetChapterId === activeChapterIdRef.current;

      if (isCurrentActive) {
        onStatusChangeRef.current?.('saving');
      }

      try {
        await invoke('save_chapter_file', {
          path: `../${targetChapterId}.md`,
          content: contentToSave,
        });

        // Notify parent state of confirmed written content for this specific chapter
        onChangeRef.current?.(contentToSave, targetChapterId);

        if (isCurrentActive) {
          isDirtyRef.current = false;
          onStatusChangeRef.current?.('saved');
        }
      } catch (error) {
        console.error(`Failed to auto-save chapter [${targetChapterId}]:`, error);
        if (isCurrentActive) {
          onStatusChangeRef.current?.('unsaved');
        }
      }
    },
    []
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
      }),
      CustomUnderline,
      Highlight.configure({
        multicolor: true,
      }),
      FontSize,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'justify'],
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'w-full min-h-[450px] bg-transparent text-zinc-300 leading-relaxed text-base focus:outline-none outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      // Mark local chapter as dirty and signal saving state immediately.
      isDirtyRef.current = true;
      onStatusChangeRef.current?.('saving');

      // Reset debounce window on every keystroke.
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      // Auto-save after 1 second of inactivity.
      debounceTimerRef.current = setTimeout(() => {
        if (editor.isDestroyed) return;
        const freshContent = editor.getHTML();
        executeSave(activeChapterIdRef.current, freshContent);
      }, 1000);
    },
  });

  // ---------------------------------------------------------------------------
  // Chapter Switch Effect: Non-blocking Background Flush
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (chapterId === activeChapterIdRef.current) return;

    const previousChapterId = activeChapterIdRef.current;
    const wasDirty = isDirtyRef.current;
    const previousContent = editor.getHTML();

    // Clear debounce timers so the previous chapter's timer doesn't fire later.
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    // Switch chapter reference and reset dirty state for new chapter.
    activeChapterIdRef.current = chapterId;
    isDirtyRef.current = false;

    // If there were pending edits for the previous chapter, launch a background save
    // for that chapter's file without blocking the editor or chapter switch.
    if (wasDirty) {
      executeSave(previousChapterId, previousContent);
    }

    onStatusChangeRef.current?.('saved');

    // Load new chapter content smoothly without emitting an update event.
    editor.commands.setContent(incomingContentRef.current, { emitUpdate: false });
  }, [chapterId, editor, executeSave]);

  // Clean up timers on unmount, flushing any unsaved work if needed.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      if (isDirtyRef.current && editor && !editor.isDestroyed) {
        const lastContent = editor.getHTML();
        invoke('save_chapter_file', {
          path: `../${activeChapterIdRef.current}.md`,
          content: lastContent,
        }).catch((err) => console.error('Unmount background save error:', err));
      }
    };
  }, [editor]);

  // ---------------------------------------------------------------------------
  // Jump to and visually highlight searched term upon loading/navigating
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!editor || editor.isDestroyed || !searchTerm || !searchTerm.trim()) return;

    const term = searchTerm.trim().toLowerCase();

    // Defer slightly to ensure ProseMirror document has rendered
    const timer = setTimeout(() => {
      if (editor.isDestroyed) return;

      let targetPos: { from: number; to: number } | null = null;
      editor.state.doc.descendants((node, pos) => {
        if (targetPos) return false;
        if (node.isText && node.text) {
          const idx = node.text.toLowerCase().indexOf(term);
          if (idx !== -1) {
            targetPos = {
              from: pos + idx,
              to: pos + idx + term.length,
            };
            return false;
          }
        }
      });

      if (targetPos) {
        editor
          .chain()
          .focus()
          .setTextSelection(targetPos)
          .scrollIntoView()
          .run();
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [editor, chapterId, searchTerm]);

  const handleInsertSymbolFromModal = (symbolChar: string) => {
    if (!editor || editor.isDestroyed) return;
    editor.chain().focus().insertContent(symbolChar).run();
  };

  const activeFontFamily = localFont || 'serif';
  const indentClass = indentFirstLine ? 'foliant-indent-first-line' : '';

  return (
    <div
      className={`w-full foliant-editor-wrapper foliant-font-${activeFontFamily} ${indentClass}`}
    >
      <style>{`
        /* Core Editor Typography & Layout */
        .foliant-editor-wrapper .tiptap {
          outline: none;
          min-height: 450px;
          line-height: 1.8;
        }

        /* High-Contrast Bold with Letter-Spacing Compensation */
        .foliant-editor-wrapper .tiptap strong,
        .foliant-editor-wrapper .tiptap b {
          font-weight: 700;
          color: #ffffff !important;
          letter-spacing: -0.015em;
          text-shadow: 0 0 1px rgba(255, 255, 255, 0.4);
        }

        /* Crisp Italic */
        .foliant-editor-wrapper .tiptap em,
        .foliant-editor-wrapper .tiptap i {
          font-style: italic;
          color: #f4f4f5;
        }

        /* Font Family Definitions */
        .foliant-font-serif .tiptap {
          font-family: Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
        }
        .foliant-font-garamond .tiptap {
          font-family: Garamond, 'EB Garamond', 'Baskerville', 'Times New Roman', serif;
        }
        .foliant-font-sans .tiptap {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .foliant-font-humanist .tiptap {
          font-family: Verdana, Geneva, Tahoma, 'Trebuchet MS', sans-serif;
        }
        .foliant-font-mono .tiptap {
          font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
        }
        .foliant-font-bookman .tiptap {
          font-family: 'Book Antiqua', 'Bookman Old Style', 'Century Schoolbook', Georgia, serif;
        }

        /* Paragraphs & Headings */
        .foliant-editor-wrapper .tiptap p {
          margin-bottom: 0.75rem;
        }
        .foliant-editor-wrapper .tiptap h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #f4f4f5;
          line-height: 1.25;
        }
        .foliant-editor-wrapper .tiptap h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: #e4e4e7;
          line-height: 1.3;
        }
        .foliant-editor-wrapper .tiptap blockquote {
          border-left: 3px solid #52525b;
          padding-left: 1rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
          color: #a1a1aa;
          font-style: italic;
        }
        /* Horizontal Rule / Markdown Divider */
        .foliant-editor-wrapper .tiptap hr {
          border: none;
          border-top: 1px solid rgba(161, 161, 170, 0.28);
          margin: 1.75rem 0;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        .foliant-editor-wrapper .tiptap hr:hover,
        .foliant-editor-wrapper .tiptap hr.ProseMirror-selectednode {
          border-top-color: rgba(161, 161, 170, 0.6);
        }
        .foliant-editor-wrapper .tiptap mark {
          padding: 0.1rem 0.25rem;
          border-radius: 0.125rem;
        }

        /* First-Line Indentation Rules */
        .foliant-indent-first-line .tiptap p {
          text-indent: 1.5rem;
          margin-bottom: 0.25rem;
        }
        .foliant-indent-first-line .tiptap h1,
        .foliant-indent-first-line .tiptap h2,
        .foliant-indent-first-line .tiptap h3,
        .foliant-indent-first-line .tiptap blockquote,
        .foliant-indent-first-line .tiptap blockquote p,
        .foliant-indent-first-line .tiptap ul p,
        .foliant-indent-first-line .tiptap ol p {
          text-indent: 0 !important;
        }
        .foliant-indent-first-line .tiptap p[style*="text-align: center"] {
          text-indent: 0 !important;
        }
      `}</style>

      <EditorToolbar
        editor={editor}
        currentFont={activeFontFamily}
        onFontChange={setLocalFont}
        onOpenSymbols={() => setIsSymbolsModalOpen(true)}
      />

      <EditorContent editor={editor} />

      {/* Microsoft Word-like Comprehensive Symbols Modal */}
      <Suspense fallback={null}>
        <WordSymbolModal
          isOpen={isSymbolsModalOpen}
          onClose={() => setIsSymbolsModalOpen(false)}
          onInsertSymbol={handleInsertSymbolFromModal}
        />
      </Suspense>
    </div>
  );
}

export default memo(FoliantEditorComponent);
