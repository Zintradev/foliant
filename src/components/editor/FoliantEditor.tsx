import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { invoke } from '@tauri-apps/api/core';

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

interface FoliantEditorProps {
  content: string;
  onChange?: (content: string) => void;
  onStatusChange?: (status: SaveStatus) => void;
}

export default function FoliantEditor({
  content,
  onChange,
  onStatusChange,
}: FoliantEditorProps) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);

  // Keep callback ref updated across renders
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

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
      const text = editor.getHTML();

      if (onChange) {
        onChange(text);
      }

      // Mark as unsaved immediately when the user types
      onStatusChangeRef.current?.('unsaved');

      // Clear existing debounce and idle timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      // Native 1-second debounce
      debounceTimerRef.current = setTimeout(async () => {
        // Change status to saving when the save routine begins
        onStatusChangeRef.current?.('saving');

        try {
          await invoke('save_chapter_file', {
            path: '../test-chapter.md',
            content: text,
          });

          // Change status to saved when writing to Rust completes successfully
          onStatusChangeRef.current?.('saved');

          // Return to idle after 2 seconds
          idleTimerRef.current = setTimeout(() => {
            onStatusChangeRef.current?.('idle');
          }, 2000);
        } catch (error) {
          console.error('Failed to auto-save chapter:', error);
          onStatusChangeRef.current?.('unsaved');
        }
      }, 1000);
    },
  });

  // Keep editor content in sync when the active chapter content changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Clean up all active timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full">
      <EditorContent editor={editor} />
    </div>
  );
}
