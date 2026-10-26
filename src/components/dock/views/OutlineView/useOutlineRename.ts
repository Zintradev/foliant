import { useState, useEffect, useRef, useCallback } from 'react';
import { TextNode } from '../../../../types/project';

interface UseOutlineRenameProps {
  onUpdateChapter?: (id: string, updates: Partial<TextNode>) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function useOutlineRename({
  onUpdateChapter,
  onDirtyChange,
}: UseOutlineRenameProps) {
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const isDirty = renamingNodeId !== null;
    onDirtyChange?.(isDirty);
    return () => {
      onDirtyChange?.(false);
    };
  }, [renamingNodeId, onDirtyChange]);

  useEffect(() => {
    if (renamingNodeId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingNodeId]);

  const handleStartRename = useCallback((node: TextNode) => {
    setRenamingNodeId(node.id);
    setRenameValue(node.title);
  }, []);

  const handleCommitRename = useCallback((nodeId: string) => {
    if (renamingNodeId === nodeId) {
      const trimmed = renameValue.trim();
      if (trimmed && onUpdateChapter) {
        onUpdateChapter(nodeId, { title: trimmed });
      }
      setRenamingNodeId(null);
    }
  }, [renamingNodeId, renameValue, onUpdateChapter]);

  const handleCancelRename = useCallback(() => {
    setRenamingNodeId(null);
  }, []);

  return {
    renamingNodeId,
    renameValue,
    setRenameValue,
    renameInputRef,
    handleStartRename,
    handleCommitRename,
    handleCancelRename,
  };
}
