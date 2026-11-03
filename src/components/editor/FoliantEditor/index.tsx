import { useState, useEffect, useRef, memo, lazy, Suspense } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { useTranslation } from '../../../i18n/translations';
import { EditorFontFamily } from '../../../types/settings';
import { FoliantEditorProps } from './types';
import { CustomUnderline, FontSize } from './extensions';
import EditorStyles from './EditorStyles';
import EditorToolbar from './EditorToolbar';
import { useEditorPersistence } from './useEditorPersistence';
import { useEditorSearchJump } from './useEditorSearchJump';

const WordSymbolModal = lazy(() => import('../WordSymbolModal'));

function FoliantEditorComponent({
  chapterId,
  content,
  onChange,
  onStatusChange,
  indentFirstLine = true,
  fontFamily = 'serif',
  searchTerm,
  isAutoSave = true,
  autoSaveInterval,
  hideToolbar = false,
  title,
  onTitleChange,
  wordCount: _wordCount,
  targetWords: _targetWords,
  externalToolbar = false,
  onEditorReady,
}: FoliantEditorProps) {
  const { t } = useTranslation();
  const [localFont, setLocalFont] = useState<EditorFontFamily>(fontFamily);
  const [isSymbolsModalOpen, setIsSymbolsModalOpen] = useState(false);

  // Sync prop changes into local font state
  useEffect(() => {
    if (fontFamily) {
      setLocalFont(fontFamily);
    }
  }, [fontFamily]);

  // Hook reference for onUpdate callback to access persistence
  const updateHandlerRef = useRef<((ed: any) => void) | null>(null);

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
          'w-full min-h-[450px] bg-transparent leading-relaxed text-base focus:outline-none outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      updateHandlerRef.current?.(ed);
    },
  });

  const { handleEditorUpdate } = useEditorPersistence({
    chapterId,
    content,
    onChange,
    onStatusChange,
    editor,
    isAutoSave,
    autoSaveInterval,
  });

  updateHandlerRef.current = handleEditorUpdate;

  useEffect(() => {
    onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  useEditorSearchJump({
    editor,
    chapterId,
    searchTerm,
  });

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
      <EditorStyles />

      {/* Formatting Toolbar at the top of the editor view (if not hosted externally) */}
      {!externalToolbar && !hideToolbar && (
        <div className="mb-4">
          <EditorToolbar
            editor={editor}
            currentFont={activeFontFamily}
            onFontChange={setLocalFont}
            onOpenSymbols={() => setIsSymbolsModalOpen(true)}
          />
        </div>
      )}

      {/* Editable Scene Title on Paper */}
      <div className="mb-4">
        <input
          type="text"
          value={title ?? ''}
          onChange={(e) => onTitleChange?.(e.target.value)}
          placeholder={t("sceneTitlePlaceholder", "Scene title...")}
          aria-label="Scene Title"
          className="w-full text-3xl font-serif font-bold bg-transparent border-b border-current/20 pb-2 text-inherit focus:outline-none placeholder:opacity-40 transition"
        />
      </div>

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
