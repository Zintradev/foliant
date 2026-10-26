import { useEffect } from 'react';
import { Editor } from '@tiptap/react';

interface UseEditorSearchJumpParams {
  editor: Editor | null;
  chapterId: string;
  searchTerm?: string | null;
}

export function useEditorSearchJump({
  editor,
  chapterId,
  searchTerm,
}: UseEditorSearchJumpParams) {
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
}
