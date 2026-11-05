import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  executeSaveBundle,
  executeReadBundle,
  checkFileExists,
  extractProjectTitleFromPath,
  LAST_FOLIANT_PROJECT_KEY,
} from './projectPersistenceUtils';
import { isCastleOrLegacyArtifact } from '../components/context/MoodboardBlock/constants';

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
  const onProjectLoadedRef = useRef(onProjectLoaded);
  useEffect(() => {
    onProjectLoadedRef.current = onProjectLoaded;
  }, [onProjectLoaded]);

  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

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
    (_prefix: string, err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      onErrorRef.current?.(msg);
      setSyncStatus('unsaved');
      setIsSaving(false);
      return false;
    },
    []
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
        onProjectLoadedRef.current(projectToSave);
        return true;
      }

      const sanitizedTitle = (project.title || 'novel')
        .trim()
        .replace(/[/\\?%*:|"<>]/g, '-')
        .trim() || 'novel';
      const defaultFileName = `${sanitizedTitle}.foliant`;

      let defaultPath = defaultFileName;
      if (currentFilePath) {
        const lastSlash = Math.max(currentFilePath.lastIndexOf('/'), currentFilePath.lastIndexOf('\\'));
        if (lastSlash !== -1) {
          const dir = currentFilePath.substring(0, lastSlash);
          const sep = currentFilePath.includes('\\') ? '\\' : '/';
          defaultPath = `${dir}${sep}${defaultFileName}`;
        }
      }

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

      onProjectLoadedRef.current(updatedProject);
      return true;
    } catch (err: unknown) {
      return handlePersistenceError('Save Project As failed', err);
    }
  }, [project, currentFilePath, handlePersistenceError]);

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

        setLastSavedAt(now);
        setSyncStatus('saved');
        setIsSaving(false);
        onProjectLoadedRef.current(projectToSave);
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

    // If the project title was changed and differs from the current file's name,
    // prompt via saveProjectAs with the new title pre-filled.
    const currentFileTitle = extractProjectTitleFromPath(trimmedPath);
    const currentProjectTitle = (project.title || '').trim();
    if (currentProjectTitle && currentFileTitle && currentProjectTitle !== currentFileTitle) {
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

      onProjectLoadedRef.current(updatedProject);
      return true;
    } catch (err: unknown) {
      return handlePersistenceError(`Save to '${trimmedPath}' failed`, err);
    }
  }, [currentFilePath, project, saveProjectAs, handlePersistenceError]);

  const loadProject = useCallback(
    (loaded: FoliantProject, filePath: string | null = null) => {
      // 1. Reset visuals before hydrating to ensure no state bleed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('foliant-visuals-loaded', { detail: [] }));
      }

      if (filePath) {
        const fileTitle = extractProjectTitleFromPath(filePath);
        if (fileTitle) {
          loaded.title = fileTitle;
        }
      }
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

      const rawVisuals = Array.isArray(loaded.visuals) ? loaded.visuals : [];
      const visuals = rawVisuals.filter((v) => !isCastleOrLegacyArtifact(v));
      loaded.visuals = visuals;

      if (typeof window !== 'undefined' && visuals.length > 0) {
        window.dispatchEvent(new CustomEvent('foliant-visuals-loaded', { detail: visuals }));
      }

      onProjectLoadedRef.current(loaded);
    },
    []
  );

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
              loadProject(loaded, file.name);
              resolve(true);
            } catch {
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
      loadProject(loadedProject, targetPath);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      onErrorRef.current?.(msg);
      return false;
    }
  }, [currentFilePath, loadProject]);

  const saveSilently = useCallback(async (): Promise<boolean> => {
    if (!isTauriApp()) {
      const now = Date.now();
      setLastSavedAt(now);
      setSyncStatus('saved');
      return true;
    }

    const trimmedPath = currentFilePath?.trim();
    if (!trimmedPath) return false;

    try {
      const { timestamp } = await executeSaveBundle(trimmedPath, project);
      setLastSavedAt(timestamp);
      setSyncStatus('saved');
      return true;
    } catch {
      setSyncStatus('unsaved');
      return false;
    }
  }, [currentFilePath, project]);

  const newProject = useCallback(
    (title: string = 'Untitled Project') => {
      // 1. Reset state completely
      setCurrentFilePath(null);
      setLastSavedAt(null);
      setError(null);
      setSyncStatus('unsaved');
      try {
        localStorage.removeItem(LAST_FOLIANT_PROJECT_KEY);
        localStorage.removeItem('lastFoliantProject');
        localStorage.removeItem('foliant_moodboard_cache_v1');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('foliant-visuals-loaded', { detail: [] }));
        }
      } catch {
        // ignore storage errors
      }
      const fresh = createEmptyProject(undefined, title);
      onProjectLoadedRef.current(fresh);
    },
    []
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
