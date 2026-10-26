import { useState, useEffect, useRef, memo, lazy, Suspense } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
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
}: FoliantEditorProps) {
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
          'w-full min-h-[450px] bg-transparent text-zinc-300 leading-relaxed text-base focus:outline-none outline-none',
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
  });

  updateHandlerRef.current = handleEditorUpdate;

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
