import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { invoke } from '@tauri-apps/api/core';

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

interface FoliantEditorProps {
  /** Stable ID of the chapter being displayed. Changing this ID triggers a content reload. */
  chapterId: string;
  /** Initial content for the chapter. Only consumed on mount or when chapterId changes. */
  content: string;
  /** Called once after a successful disk write with the confirmed-saved HTML. */
  onChange?: (content: string) => void;
  onStatusChange?: (status: SaveStatus) => void;
}

export default function FoliantEditor({
  chapterId,
  content,
  onChange,
  onStatusChange,
}: FoliantEditorProps) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable callback refs — always reflect the latest prop values without
  // being listed as reactive dependencies anywhere.
  const onStatusChangeRef = useRef(onStatusChange);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onChangeRef.current = onChange;
  });

  // Non-reactive snapshot of the latest incoming content prop.
  // Written synchronously every render so chapter-switch code always
  // reads the freshest value without triggering re-renders.
  const incomingContentRef = useRef<string>(content);
  incomingContentRef.current = content;

  // Tracks which chapter is currently loaded inside the editor instance.
  const activeChapterIdRef = useRef<string>(chapterId);

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class:
          'w-full min-h-[450px] bg-transparent text-neutral-300 font-serif leading-relaxed text-base focus:outline-none outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      // Signal unsaved state immediately so the UI responds to the keystroke.
      onStatusChangeRef.current?.('unsaved');

      // Reset debounce window on every keystroke.
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      // Auto-save after 3 seconds of inactivity.
      //
      // IMPORTANT: We do NOT call onChange on every keystroke.
      // Doing so would push content into App.tsx state → re-render →
      // content prop changes → this component re-renders with new prop.
      // onChange is called exactly once: after Rust confirms the write,
      // so App.tsx state always reflects what is actually on disk.
      debounceTimerRef.current = setTimeout(async () => {
        if (editor.isDestroyed) return;

        // Read the editor's latest HTML at the moment of saving,
        // not the stale closure value from when the timeout was created.
        const freshContent = editor.getHTML();

        onStatusChangeRef.current?.('saving');

        try {
          await invoke('save_chapter_file', {
            path: '../test-chapter.md',
            content: freshContent,
          });

          // Handoff to parent: update stored chapter content to match
          // what was just confirmed written to disk.
          onChangeRef.current?.(freshContent);

          onStatusChangeRef.current?.('saved');

          idleTimerRef.current = setTimeout(() => {
            onStatusChangeRef.current?.('idle');
          }, 2000);
        } catch (error) {
          console.error('Failed to auto-save chapter:', error);
          onStatusChangeRef.current?.('unsaved');
        }
      }, 3000);
    },
  });

  // Reload editor content ONLY when chapterId changes (genuine chapter switch).
  //
  // `content` is intentionally NOT in the dependency array. App.tsx echoes
  // the content prop back after every onChange call, which would re-trigger
  // this effect and overwrite the editor mid-session. We read the latest
  // content via incomingContentRef to avoid that dependency entirely.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (chapterId === activeChapterIdRef.current) return;

    // --- Genuine chapter switch ---
    activeChapterIdRef.current = chapterId;

    // Discard any pending auto-save from the previous chapter.
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    onStatusChangeRef.current?.('idle');

    // Inject the new chapter's content without firing onUpdate,
    // so the auto-save debounce is not triggered.
    editor.commands.setContent(incomingContentRef.current, { emitUpdate: false });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, editor]);
  // ^ `content` deliberately omitted — see comment above.

  // Tear down timers when the editor unmounts.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return (
    <div className="w-full">
      <EditorContent editor={editor} />
    </div>
  );
}
