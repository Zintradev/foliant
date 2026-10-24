import { useState, useCallback, useMemo, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { FoliantProject, createEmptyProject } from '../types/project';

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
 * Extracts the project directory or bundle name from a POSIX or Windows path.
 */
export function extractFileName(filePath: string | null): string | null {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, '/').replace(/\/+$/, '');
  const parts = normalized.split('/');
  return parts[parts.length - 1] || null;
}

/**
 * Validates and normalizes parsed JSON metadata into a strictly typed FoliantProject.
 * Ensures backward-compatibility if optional or newly added collections are missing.
 */
function normalizeLoadedProject(data: unknown): FoliantProject {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid project file: expected a JSON object in project.json.');
  }

  const raw = data as Partial<FoliantProject>;

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `project-${Date.now()}`,
    title: typeof raw.title === 'string' && raw.title ? raw.title : 'Untitled Project',
    lastModified: typeof raw.lastModified === 'number' ? raw.lastModified : Date.now(),
    targetWords: typeof raw.targetWords === 'number' ? raw.targetWords : 80000,
    chapters: Array.isArray(raw.chapters) ? raw.chapters : [],
    storylines: Array.isArray(raw.storylines) ? raw.storylines : [],
    characters: Array.isArray(raw.characters) ? raw.characters : [],
    relationships: Array.isArray(raw.relationships) ? raw.relationships : [],
    junctions: Array.isArray(raw.junctions) ? raw.junctions : [],
    worldItems: Array.isArray(raw.worldItems) ? raw.worldItems : [],
    contextBlocks: Array.isArray(raw.contextBlocks) ? raw.contextBlocks : [],
  };
}

/**
 * Serializes and writes the Foliant project into a modular folder bundle:
 * 1. Creates the base directory and the /scenes/ subdirectory.
 * 2. Writes each scene chapter as an independent file: /scenes/${chapter.id}.md.
 * 3. Strips scene content from the in-memory chapters list and writes project.json.
 */
export async function writeProjectBundle(
  baseDirectory: string,
  projectToSave: FoliantProject
): Promise<void> {
  const normalizedBase = baseDirectory.replace(/\\/g, '/').replace(/\/+$/, '');
  const scenesDirectory = `${normalizedBase}/scenes`;

  // 1. Ensure project root directory and scenes directory exist
  await mkdir(normalizedBase, { recursive: true });
  await mkdir(scenesDirectory, { recursive: true });

  // 2. Write each scene text file individually
  for (const chapter of projectToSave.chapters) {
    if (chapter.type === 'scene') {
      const sceneFilePath = `${scenesDirectory}/${chapter.id}.md`;
      const sceneContent = typeof chapter.content === 'string' ? chapter.content : '';
      await writeTextFile(sceneFilePath, sceneContent);
    }
  }

  // 3. Prepare project.json: chapters metadata without scene content
  const metadataProject: FoliantProject = {
    ...projectToSave,
    chapters: projectToSave.chapters.map((chapter) => {
      if (chapter.type === 'scene') {
        return {
          ...chapter,
          content: '',
        };
      }
      return chapter;
    }),
  };

  const projectJsonPath = `${normalizedBase}/project.json`;
  const serializedMetadata = JSON.stringify(metadataProject, null, 2);
  await writeTextFile(projectJsonPath, serializedMetadata);
}

/**
 * Reads a modular folder bundle:
 * 1. Reads and parses project.json.
 * 2. Iterates over chapters and reads each scene's content from /scenes/${chapter.id}.md.
 * 3. Reassembles the complete FoliantProject in memory with fallback for missing scene files.
 */
export async function readProjectBundle(baseDirectory: string): Promise<FoliantProject> {
  const normalizedBase = baseDirectory.replace(/\\/g, '/').replace(/\/+$/, '');
  const projectJsonPath = `${normalizedBase}/project.json`;
  const scenesDirectory = `${normalizedBase}/scenes`;

  // 1. Read root project metadata
  const metadataContent = await readTextFile(projectJsonPath);
  const parsedData = JSON.parse(metadataContent);
  const normalizedProject = normalizeLoadedProject(parsedData);

  // 2. Reassemble scene contents from individual files
  const reassembledChapters = await Promise.all(
    normalizedProject.chapters.map(async (chapter) => {
      if (chapter.type === 'scene') {
        const sceneFilePath = `${scenesDirectory}/${chapter.id}.md`;
        try {
          const content = await readTextFile(sceneFilePath);
          return {
            ...chapter,
            content,
          };
        } catch (sceneErr: unknown) {
          console.warn(
            `[Foliant Persistence] Failed to read scene file '${sceneFilePath}'. Defaulting to empty content:`,
            sceneErr
          );
          return {
            ...chapter,
            content: '',
          };
        }
      }
      return chapter;
    })
  );

  return {
    ...normalizedProject,
    chapters: reassembledChapters,
  };
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

  /**
   * Prompts the user with a native directory picker to choose the project root folder,
   * then writes the folder bundle (project.json and /scenes/${id}.md files) to disk.
   */
  const saveProjectAs = useCallback(async (): Promise<boolean> => {
    try {
      setIsSaving(true);
      setSyncStatus('saving');
      setError(null);

      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Foliant Project Directory',
        defaultPath: currentFilePath || undefined,
      });

      // User cancelled native picker: silently abort and restore appropriate sync status
      if (!selected) {
        setIsSaving(false);
        setSyncStatus(currentFilePath ? 'idle' : 'unsaved');
        return false;
      }

      const rawPath = Array.isArray(selected) ? selected[0] : selected;
      if (!rawPath || typeof rawPath !== 'string' || rawPath.trim() === '') {
        setIsSaving(false);
        setSyncStatus(currentFilePath ? 'idle' : 'unsaved');
        return false;
      }

      const targetDirectory = rawPath.trim().replace(/[/\\]+$/, '');

      // Strict validation: targetDirectory must be a non-empty string
      if (!targetDirectory) {
        console.error('[Foliant Persistence] Invalid directory path provided for saving.');
        setError('Invalid directory path.');
        setSyncStatus('unsaved');
        setIsSaving(false);
        return false;
      }

      const now = Date.now();
      const projectToSave: FoliantProject = {
        ...project,
        lastModified: now,
      };

      try {
        await writeProjectBundle(targetDirectory, projectToSave);
      } catch (writeErr: unknown) {
        const errorMsg = writeErr instanceof Error ? writeErr.message : String(writeErr);
        console.error(
          `[Foliant Persistence] Disk write failed on directory '${targetDirectory}' (permission or I/O failure):`,
          writeErr
        );
        setError(errorMsg);
        onError?.(errorMsg);
        setSyncStatus('unsaved');
        setIsSaving(false);
        return false;
      }

      setCurrentFilePath(targetDirectory);
      setLastSavedAt(now);
      setSyncStatus('saved');
      setIsSaving(false);

      // Sync parent domain state with updated lastModified timestamp and in-memory content intact
      onProjectLoaded(projectToSave);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Foliant Persistence] Save Project As failed:', err);
      setError(msg);
      onError?.(msg);
      setSyncStatus('unsaved');
      setIsSaving(false);
      return false;
    }
  }, [project, currentFilePath, onProjectLoaded, onError]);

  /**
   * Saves directly to currentFilePath if already bound to disk,
   * otherwise delegates to saveProjectAs().
   */
  const saveProject = useCallback(async (): Promise<boolean> => {
    // If no directory path is set, safely delegate to saveProjectAs()
    if (!currentFilePath || typeof currentFilePath !== 'string' || currentFilePath.trim() === '') {
      return saveProjectAs();
    }

    const trimmedDirectory = currentFilePath.trim().replace(/[/\\]+$/, '');

    // Strict validation to ensure non-empty directory path
    if (!trimmedDirectory) {
      return saveProjectAs();
    }

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
        await writeProjectBundle(trimmedDirectory, projectToSave);
      } catch (writeErr: unknown) {
        const errorMsg = writeErr instanceof Error ? writeErr.message : String(writeErr);
        console.error(
          `[Foliant Persistence] Disk write failed on directory '${trimmedDirectory}' (permission or I/O failure):`,
          writeErr
        );
        setError(errorMsg);
        onError?.(errorMsg);
        setSyncStatus('unsaved');
        setIsSaving(false);
        return false;
      }

      setLastSavedAt(now);
      setSyncStatus('saved');
      setIsSaving(false);

      onProjectLoaded(projectToSave);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Foliant Persistence] Save to '${trimmedDirectory}' failed:`, err);
      setError(msg);
      onError?.(msg);
      setSyncStatus('unsaved');
      setIsSaving(false);
      return false;
    }
  }, [currentFilePath, project, saveProjectAs, onProjectLoaded, onError]);

  /**
   * Prompts the user with a native directory picker, reads project.json,
   * reads all scene text files, reassembles the FoliantProject, and updates application state.
   */
  const openProject = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Open Foliant Project Directory',
      });

      if (!selected) {
        return false; // User cancelled
      }

      const rawPath = Array.isArray(selected) ? selected[0] : selected;
      if (!rawPath || typeof rawPath !== 'string' || rawPath.trim() === '') {
        return false;
      }

      const targetDirectory = rawPath.trim().replace(/[/\\]+$/, '');

      let loadedProject: FoliantProject;
      try {
        loadedProject = await readProjectBundle(targetDirectory);
      } catch (readErr: unknown) {
        const errorMsg = readErr instanceof Error ? readErr.message : String(readErr);
        console.error(
          `[Foliant Persistence] Failed to read project bundle at '${targetDirectory}' (permission or read failure):`,
          readErr
        );
        setError(errorMsg);
        onError?.(errorMsg);
        return false;
      }

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

  /**
   * Silently writes the folder bundle payload to disk without setting isSaving,
   * preserving the editor's visual typing/saving animation cycle.
   */
  const saveSilently = useCallback(async (): Promise<boolean> => {
    if (!currentFilePath || typeof currentFilePath !== 'string' || currentFilePath.trim() === '') {
      return false;
    }

    const trimmedDirectory = currentFilePath.trim().replace(/[/\\]+$/, '');
    if (!trimmedDirectory) return false;

    try {
      const now = Date.now();
      const projectToSave: FoliantProject = {
        ...project,
        lastModified: now,
      };

      try {
        await writeProjectBundle(trimmedDirectory, projectToSave);
      } catch (writeErr: unknown) {
        console.error(
          `[Foliant Persistence] Silent write failed on directory '${trimmedDirectory}' (permission or I/O failure):`,
          writeErr
        );
        setSyncStatus('unsaved');
        return false;
      }

      setLastSavedAt(now);
      setSyncStatus('saved');
      return true;
    } catch (err: unknown) {
      console.error(`[Foliant Persistence] Silent write to '${trimmedDirectory}' failed:`, err);
      setSyncStatus('unsaved');
      return false;
    }
  }, [currentFilePath, project]);

  /**
   * Resets persistence state for a new project.
   */
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

  /**
   * Directly sets the current project and binds it to a directory path if provided.
   */
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
