import { useEffect, useRef, useCallback } from 'react';
import { FoliantProject } from '../types/project';
import { SaveStatus } from './useProjectPersistence';

export interface UseAppAutoSaveOptions {
  project: FoliantProject;
  isAutoSave: boolean;
  autoSaveInterval?: number;
  currentFilePath: string | null;
  saveSilently: () => Promise<boolean>;
  setEditorSaveStatus: (status: SaveStatus) => void;
  setIsDirty?: (dirty: boolean) => void;
  lastSavedAt?: number | null;
}

export interface UseAppAutoSaveReturn {
  resetAutoSaveTimer: () => void;
}

export function useAppAutoSave({
  project,
  isAutoSave,
  autoSaveInterval,
  currentFilePath,
  saveSilently,
  setEditorSaveStatus,
  setIsDirty,
  lastSavedAt,
}: UseAppAutoSaveOptions): UseAppAutoSaveReturn {
  const isInitialMountRef = useRef(true);
  const prevProjectRef = useRef(project);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAutoSaveTimer = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    prevProjectRef.current = project;
  }, [project]);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevProjectRef.current = project;
      return;
    }

    // If the project state has already been saved or loaded up to this point,
    // ensure status is 'saved' and prevent scheduling a redundant auto-save.
    if (lastSavedAt !== null && lastSavedAt !== undefined && project.lastModified <= lastSavedAt) {
      setEditorSaveStatus('saved');
      setIsDirty?.(false);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
      prevProjectRef.current = project;
      return;
    }

    if (prevProjectRef.current === project) {
      return;
    }
    prevProjectRef.current = project;

    if (!isAutoSave) {
      setEditorSaveStatus('unsaved');
      return;
    }

    setEditorSaveStatus('unsaved');

    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

    const intervalMs = autoSaveInterval != null ? Math.max(300, autoSaveInterval * 1000) : 600;

    autoSaveTimeoutRef.current = setTimeout(async () => {
      setEditorSaveStatus('saving');
      if (currentFilePath) {
        await saveSilently();
      }
      setEditorSaveStatus('saved');
      setIsDirty?.(false);
    }, intervalMs);

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [project, isAutoSave, autoSaveInterval, currentFilePath, saveSilently, setEditorSaveStatus, setIsDirty, lastSavedAt]);

  return { resetAutoSaveTimer };
}
