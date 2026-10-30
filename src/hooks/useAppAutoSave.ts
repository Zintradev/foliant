import { useEffect, useRef } from 'react';
import { FoliantProject } from '../types/project';
import { SaveStatus } from './useProjectPersistence';

interface UseAppAutoSaveOptions {
  project: FoliantProject;
  isAutoSave: boolean;
  autoSaveInterval?: number;
  currentFilePath: string | null;
  saveSilently: () => Promise<boolean>;
  setEditorSaveStatus: (status: SaveStatus) => void;
}

export function useAppAutoSave({
  project,
  isAutoSave,
  autoSaveInterval,
  currentFilePath,
  saveSilently,
  setEditorSaveStatus,
}: UseAppAutoSaveOptions) {
  const isInitialMountRef = useRef(true);
  const prevProjectRef = useRef(project);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
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

    setEditorSaveStatus('saving');

    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

    const intervalMs = autoSaveInterval != null ? Math.max(300, autoSaveInterval * 1000) : 600;

    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (currentFilePath) {
        await saveSilently();
      }
      setEditorSaveStatus('saved');
    }, intervalMs);

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [project, isAutoSave, autoSaveInterval, currentFilePath, saveSilently, setEditorSaveStatus]);
}
