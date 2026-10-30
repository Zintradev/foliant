import { useState, useCallback, useMemo, useEffect } from 'react';
import { FoliantProject, createEmptyProject } from '../types/project';
import { isTauriApp } from '../utils/platform';
import { downloadFileInBrowser } from '../utils/browserDownload';
import {
  extractFileName,
  writeProjectBundle,
  readProjectBundle,
  normalizeLoadedProject,
} from '../utils/projectBundle';
import {
  promptSelectDirectory,
  executeSaveBundle,
  executeReadBundle,
} from './projectPersistenceUtils';

export { extractFileName, writeProjectBundle, readProjectBundle, normalizeLoadedProject };

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'unsaved';
export type SaveStatus = SyncStatus;

export interface UseProjectPersistenceOptions {
  project: FoliantProject;
  onProjectLoaded: (loaded: FoliantProject) => void;
  onError?: (errorMessage: string) => void;
}

export interface UseProjectPersistenceReturn {
  currentFilePath: string | null;
  fileName: string | null;
  saveStatus: SaveStatus;
  syncStatus: SyncStatus;
  lastSavedAt: number | null;
  error: string | null;
  isSaving: boolean;
  saveProject: () => Promise<boolean>;
  saveProjectAs: () => Promise<boolean>;
  saveSilently: () => Promise<boolean>;
  openProject: () => Promise<boolean>;
  newProject: (title?: string) => void;
  loadProject: (loaded: FoliantProject, filePath?: string | null) => void;
  clearError: () => void;
}

/**
 * Custom hook managing native disk persistence using a modular folder bundle structure
 * via Tauri v2 plugins: @tauri-apps/plugin-dialog and @tauri-apps/plugin-fs.
 */
export function useProjectPersistence({
  project,
  onProjectLoaded,
  onError,
}: UseProjectPersistenceOptions): UseProjectPersistenceReturn {
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => {
    return currentFilePath === null ? 'unsaved' : 'idle';
  });

  const clearError = useCallback(() => setError(null), []);
  const fileName = useMemo(() => extractFileName(currentFilePath), [currentFilePath]);

  // Synchronize sync status with domain mutations when not actively writing
  useEffect(() => {
    if (isSaving) return;
    if (lastSavedAt !== null) {
      setSyncStatus(project.lastModified > lastSavedAt ? 'unsaved' : 'saved');
    } else {
      setSyncStatus(currentFilePath === null ? 'unsaved' : 'idle');
    }
  }, [project.lastModified, lastSavedAt, currentFilePath, isSaving]);

  const handlePersistenceError = useCallback(
    (prefix: string, err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Foliant Persistence] ${prefix}:`, err);
      setError(msg);
      onError?.(msg);
      setSyncStatus('unsaved');
      setIsSaving(false);
      return false;
    },
    [onError]
  );

  const saveProjectAs = useCallback(async (): Promise<boolean> => {
    try {
      setIsSaving(true);
      setSyncStatus('saving');
      setError(null);

      if (!isTauriApp()) {
        const now = Date.now();
        const projectToSave: FoliantProject = {
          ...project,
          lastModified: now,
        };
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('foliant_session_project', JSON.stringify(projectToSave));
          }
        } catch {
          // ignore session quota
        }

        const safeTitle =
          (projectToSave.title || 'project')
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'project';
        const fileNameToSave = `${safeTitle}.foliant.json`;

        downloadFileInBrowser(
          JSON.stringify(projectToSave, null, 2),
          fileNameToSave,
          'application/json'
        );

        setCurrentFilePath(fileNameToSave);
        setLastSavedAt(now);
        setSyncStatus('saved');
        setIsSaving(false);
        onProjectLoaded(projectToSave);
        return true;
      }

      const targetDirectory = await promptSelectDirectory(
        'Select Foliant Project Directory',
        currentFilePath
      );

      if (!targetDirectory) {
        setIsSaving(false);
        setSyncStatus(currentFilePath ? 'idle' : 'unsaved');
        return false;
      }

      const { updatedProject, timestamp } = await executeSaveBundle(targetDirectory, project);

      setCurrentFilePath(targetDirectory);
      setLastSavedAt(timestamp);
      setSyncStatus('saved');
      setIsSaving(false);

      onProjectLoaded(updatedProject);
      return true;
    } catch (err: unknown) {
      return handlePersistenceError('Save Project As failed', err);
    }
  }, [project, currentFilePath, onProjectLoaded, handlePersistenceError]);

  const saveProject = useCallback(async (): Promise<boolean> => {
    if (!isTauriApp()) {
      try {
        setIsSaving(true);
        setSyncStatus('saving');
        setError(null);

        const now = Date.now();
        const projectToSave: FoliantProject = {
          ...project,
          lastModified: now,
        };
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('foliant_session_project', JSON.stringify(projectToSave));
          }
        } catch {
          // ignore session quota
        }

        setLastSavedAt(now);
        setSyncStatus('saved');
        setIsSaving(false);
        onProjectLoaded(projectToSave);
        return true;
      } catch (err: unknown) {
        setIsSaving(false);
        setSyncStatus('unsaved');
        return false;
      }
    }

    const trimmedDirectory = currentFilePath?.trim().replace(/[/\\]+$/, '');
    if (!trimmedDirectory) {
      return saveProjectAs();
    }

    try {
      setIsSaving(true);
      setSyncStatus('saving');
      setError(null);

      const { updatedProject, timestamp } = await executeSaveBundle(trimmedDirectory, project);

      setLastSavedAt(timestamp);
      setSyncStatus('saved');
      setIsSaving(false);

      onProjectLoaded(updatedProject);
      return true;
    } catch (err: unknown) {
      return handlePersistenceError(`Save to '${trimmedDirectory}' failed`, err);
    }
  }, [currentFilePath, project, saveProjectAs, onProjectLoaded, handlePersistenceError]);

  const openProject = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      if (!isTauriApp()) {
        if (typeof document === 'undefined') return false;
        return new Promise<boolean>((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json,.foliant';
          input.style.display = 'none';
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) {
              resolve(false);
              return;
            }
            try {
              const text = await file.text();
              const parsed = JSON.parse(text);
              const loaded = normalizeLoadedProject(parsed);
              onProjectLoaded(loaded);
              setCurrentFilePath(file.name);
              setLastSavedAt(loaded.lastModified);
              setSyncStatus('saved');
              try {
                if (typeof sessionStorage !== 'undefined') {
                  sessionStorage.setItem('foliant_session_project', JSON.stringify(loaded));
                }
              } catch {
                // ignore
              }
              resolve(true);
            } catch (readErr) {
              console.error('Failed to parse uploaded project:', readErr);
              resolve(false);
            } finally {
              if (input.parentNode) {
                input.parentNode.removeChild(input);
              }
            }
          };
          document.body.appendChild(input);
          input.click();
        });
      }

      const targetDirectory = await promptSelectDirectory(
        'Open Foliant Project Directory'
      );
      if (!targetDirectory) return false;

      const loadedProject = await executeReadBundle(targetDirectory);

      onProjectLoaded(loadedProject);
      setCurrentFilePath(targetDirectory);
      setLastSavedAt(loadedProject.lastModified);
      setSyncStatus('saved');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Foliant Persistence] Open Project failed:', err);
      setError(msg);
      onError?.(msg);
      return false;
    }
  }, [onProjectLoaded, onError]);

  const saveSilently = useCallback(async (): Promise<boolean> => {
    if (!isTauriApp()) {
      const now = Date.now();
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('foliant_session_project', JSON.stringify({ ...project, lastModified: now }));
        }
        setLastSavedAt(now);
        setSyncStatus('saved');
        return true;
      } catch {
        return false;
      }
    }

    const trimmedDirectory = currentFilePath?.trim().replace(/[/\\]+$/, '');
    if (!trimmedDirectory) return false;

    try {
      const { timestamp } = await executeSaveBundle(trimmedDirectory, project);
      setLastSavedAt(timestamp);
      setSyncStatus('saved');
      return true;
    } catch (err: unknown) {
      console.error(`[Foliant Persistence] Silent write to '${trimmedDirectory}' failed:`, err);
      setSyncStatus('unsaved');
      return false;
    }
  }, [currentFilePath, project]);

  const newProject = useCallback(
    (title: string = 'Untitled Project') => {
      const fresh = createEmptyProject(undefined, title);
      setCurrentFilePath(null);
      setLastSavedAt(null);
      setError(null);
      setSyncStatus('unsaved');
      onProjectLoaded(fresh);
    },
    [onProjectLoaded]
  );

  const loadProject = useCallback(
    (loaded: FoliantProject, filePath: string | null = null) => {
      setCurrentFilePath(filePath);
      setLastSavedAt(filePath ? loaded.lastModified : null);
      setError(null);
      setSyncStatus(filePath ? 'saved' : 'unsaved');
      onProjectLoaded(loaded);
    },
    [onProjectLoaded]
  );

  return {
    currentFilePath,
    fileName,
    saveStatus: syncStatus,
    syncStatus,
    lastSavedAt,
    error,
    isSaving,
    saveProject,
    saveProjectAs,
    saveSilently,
    openProject,
    newProject,
    loadProject,
    clearError,
  };
}
