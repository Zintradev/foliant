import { useEffect } from 'react';

interface UseGraphShortcutsProps {
  handleUndo: () => void;
  handleRedo: () => void;
  handleDeleteSelected: () => void;
  handleCopy?: () => void;
  handlePaste?: () => void;
  onEscape: () => void;
  selectedRelId: string | null;
  selectedJunctionId: string | null;
  editingCardId: string | null;
  selectedNodeIds?: string[];
}

export function useGraphShortcuts({
  handleUndo,
  handleRedo,
  handleDeleteSelected,
  handleCopy,
  handlePaste,
  onEscape,
  selectedRelId,
  selectedJunctionId,
  editingCardId,
  selectedNodeIds = [],
}: UseGraphShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        onEscape();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedRelId || selectedJunctionId || editingCardId || selectedNodeIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
          return;
        }
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (isCtrlOrMeta && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
        } else if (key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (key === 'c') {
          if (selectedNodeIds.length > 0) {
            e.preventDefault();
            handleCopy?.();
          }
        } else if (key === 'v') {
          e.preventDefault();
          handlePaste?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    handleUndo,
    handleRedo,
    handleDeleteSelected,
    handleCopy,
    handlePaste,
    onEscape,
    selectedRelId,
    selectedJunctionId,
    editingCardId,
    selectedNodeIds,
  ]);
}
