import { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { invoke } from '@tauri-apps/api/core';

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

interface FoliantEditorProps {
  /** Stable ID of the chapter being displayed. Changing this ID triggers a content reload. */
  chapterId: string;
  /** Initial content for the chapter. Only consumed on mount or when chapterId changes. */
  content: string;
  /** Called once after a disk write confirms saved content, with target chapter ID. */
  onChange?: (content: string, chapterId: string) => void;
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

          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
          idleTimerRef.current = setTimeout(() => {
            if (targetChapterId === activeChapterIdRef.current) {
              onStatusChangeRef.current?.('idle');
            }
          }, 2000);
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
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class:
          'w-full min-h-[450px] bg-transparent text-zinc-300 font-serif leading-relaxed text-base focus:outline-none outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      // Mark local chapter as dirty and signal unsaved state immediately.
      isDirtyRef.current = true;
      onStatusChangeRef.current?.('unsaved');

      // Reset debounce window on every keystroke.
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      // Auto-save after 3 seconds of inactivity.
      debounceTimerRef.current = setTimeout(() => {
        if (editor.isDestroyed) return;
        const freshContent = editor.getHTML();
        executeSave(activeChapterIdRef.current, freshContent);
      }, 3000);
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

    onStatusChangeRef.current?.('idle');

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

  return (
    <div className="w-full">
      <EditorContent editor={editor} />
    </div>
  );
}
