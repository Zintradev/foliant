import { useEffect, useRef } from 'react';

export interface UseGlobalShortcutsOptions {
  onSave: () => unknown;
  onSaveAs: () => unknown;
  onOpen: () => unknown;
  onSearch: () => unknown;
}

/**
 * useGlobalShortcuts:
 * Listens for system-wide keyboard shortcuts in the Foliant studio:
 * - Ctrl/Cmd + S: Save project
 * - Ctrl/Cmd + Shift + S: Save project as...
 * - Ctrl/Cmd + O: Open project
 * - Ctrl/Cmd + Shift + F: Quick-jump to search tab
 *
 * Keeps fresh callback references internally to avoid re-attaching event listeners.
 */
export function useGlobalShortcuts({
  onSave,
  onSaveAs,
  onOpen,
  onSearch,
}: UseGlobalShortcutsOptions): void {
  const callbacksRef = useRef({ onSave, onSaveAs, onOpen, onSearch });

  useEffect(() => {
    callbacksRef.current = { onSave, onSaveAs, onOpen, onSearch };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (!isModifier) return;

      const key = e.key.toLowerCase();

      // Ctrl/Cmd + Shift + S: Save As
      if (e.shiftKey && key === 's') {
        e.preventDefault();
        callbacksRef.current.onSaveAs();
        return;
      }

      // Ctrl/Cmd + S: Save
      if (!e.shiftKey && key === 's') {
        e.preventDefault();
        callbacksRef.current.onSave();
        return;
      }

      // Ctrl/Cmd + Shift + F: Search Tab
      if (e.shiftKey && key === 'f') {
        e.preventDefault();
        callbacksRef.current.onSearch();
        return;
      }

      // Ctrl/Cmd + O: Open Project
      if (!e.shiftKey && key === 'o') {
        e.preventDefault();
        callbacksRef.current.onOpen();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
