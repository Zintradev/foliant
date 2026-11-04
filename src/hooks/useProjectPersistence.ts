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
  promptOpenProjectFile,
  promptSaveProjectFile,
  promptSelectDirectory,
  executeSaveBundle,
  executeReadBundle,
  checkFileExists,
  LAST_FOLIANT_PROJECT_KEY,
} from './projectPersistenceUtils';

export {
  extractFileName,
  writeProjectBundle,
  readProjectBundle,
  normalizeLoadedProject,
  checkFileExists,
  LAST_FOLIANT_PROJECT_KEY,
};

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
        const fileNameToSave = `${safeTitle}.foliant`;

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

      const defaultFileName = project.title
        ? `${project.title.replace(/[/\\?%*:|"<>]/g, '-')}.foliant`
        : 'novel.foliant';
      const defaultPath = currentFilePath || defaultFileName;

      const targetPath = await promptSaveProjectFile(
        'Save Foliant Project As',
        defaultPath
      );

      if (!targetPath) {
        setIsSaving(false);
        setSyncStatus(currentFilePath ? 'idle' : 'unsaved');
        return false;
      }

      const { updatedProject, timestamp } = await executeSaveBundle(targetPath, project);

      setCurrentFilePath(targetPath);
      setLastSavedAt(timestamp);
      setSyncStatus('saved');
      setIsSaving(false);
      try {
        localStorage.setItem(LAST_FOLIANT_PROJECT_KEY, targetPath);
      } catch {
        // ignore storage errors
      }

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

    const trimmedPath = currentFilePath?.trim();
    if (!trimmedPath) {
      return saveProjectAs();
    }

    // Edge case 1: Validate if the file still exists on the filesystem.
    // If the file was deleted or moved externally, redirect to Save As.
    const fileExists = await checkFileExists(trimmedPath);
    if (!fileExists) {
      return saveProjectAs();
    }

    try {
      setIsSaving(true);
      setSyncStatus('saving');
      setError(null);

      const { updatedProject, timestamp } = await executeSaveBundle(trimmedPath, project);

      setLastSavedAt(timestamp);
      setSyncStatus('saved');
      setIsSaving(false);
      try {
        localStorage.setItem(LAST_FOLIANT_PROJECT_KEY, trimmedPath);
      } catch {
        // ignore storage errors
      }

      onProjectLoaded(updatedProject);
      return true;
    } catch (err: unknown) {
      return handlePersistenceError(`Save to '${trimmedPath}' failed`, err);
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

      const targetPath = await promptOpenProjectFile(
        'Open Foliant Project',
        currentFilePath
      );
      if (!targetPath) return false;

      const loadedProject = await executeReadBundle(targetPath);

      onProjectLoaded(loadedProject);
      setCurrentFilePath(targetPath);
      setLastSavedAt(loadedProject.lastModified);
      setSyncStatus('saved');
      try {
        localStorage.setItem(LAST_FOLIANT_PROJECT_KEY, targetPath);
      } catch {
        // ignore storage errors
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Foliant Persistence] Open Project failed:', err);
      setError(msg);
      onError?.(msg);
      return false;
    }
  }, [currentFilePath, onProjectLoaded, onError]);

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

    const trimmedPath = currentFilePath?.trim();
    if (!trimmedPath) return false;

    try {
      const { timestamp } = await executeSaveBundle(trimmedPath, project);
      setLastSavedAt(timestamp);
      setSyncStatus('saved');
      return true;
    } catch (err: unknown) {
      console.error(`[Foliant Persistence] Silent write to '${trimmedPath}' failed:`, err);
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
      try {
        localStorage.removeItem(LAST_FOLIANT_PROJECT_KEY);
      } catch {
        // ignore storage errors
      }
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
      if (filePath) {
        try {
          localStorage.setItem(LAST_FOLIANT_PROJECT_KEY, filePath);
        } catch {
          // ignore storage errors
        }
      }
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
