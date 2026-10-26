import { useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { invoke } from '@tauri-apps/api/core';
import { SaveStatus } from './types';

interface UseEditorPersistenceParams {
  chapterId: string;
  content: string;
  onChange?: (content: string, chapterId: string) => void;
  onStatusChange?: (status: SaveStatus) => void;
  editor: Editor | null;
}

export function useEditorPersistence({
  chapterId,
  content,
  onChange,
  onStatusChange,
  editor,
}: UseEditorPersistenceParams) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable callback refs
  const onStatusChangeRef = useRef(onStatusChange);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onChangeRef.current = onChange;
  });

  // Non-reactive snapshot of incoming content prop
  const incomingContentRef = useRef<string>(content);
  incomingContentRef.current = content;

  // Active chapter and dirty flag
  const activeChapterIdRef = useRef<string>(chapterId);
  const isDirtyRef = useRef<boolean>(false);

  // Independent Disk Save Routine
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

  const handleEditorUpdate = useCallback(
    (ed: Editor) => {
      isDirtyRef.current = true;
      onStatusChangeRef.current?.('saving');

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        if (ed.isDestroyed) return;
        const freshContent = ed.getHTML();
        executeSave(activeChapterIdRef.current, freshContent);
      }, 1000);
    },
    [executeSave]
  );

  // Chapter Switch Effect: Non-blocking Background Flush
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (chapterId === activeChapterIdRef.current) return;

    const previousChapterId = activeChapterIdRef.current;
    const wasDirty = isDirtyRef.current;
    const previousContent = editor.getHTML();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    activeChapterIdRef.current = chapterId;
    isDirtyRef.current = false;

    if (wasDirty) {
      executeSave(previousChapterId, previousContent);
    }

    onStatusChangeRef.current?.('saved');

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

  return {
    handleEditorUpdate,
  };
}
