import { open, save } from '@tauri-apps/plugin-dialog';
import { exists } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { isTauriApp } from '../utils/platform';
import { FoliantProject } from '../types/project';
import {
  writeProjectBundle,
  readProjectBundle,
} from '../utils/projectBundle';

export const FOLIANT_DIALOG_FILTERS = [
  { name: 'Foliant Project', extensions: ['foliant'] },
];

export const LAST_FOLIANT_PROJECT_KEY = 'lastFoliantProject';

/**
 * Checks whether a file exists on disk.
 * Uses `@tauri-apps/plugin-fs` `exists`, falling back to native Rust `check_file_exists`.
 */
export async function checkFileExists(path: string | null | undefined): Promise<boolean> {
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return false;
  }
  if (!isTauriApp()) {
    return false;
  }
  const cleanPath = path.trim();
  try {
    return await exists(cleanPath);
  } catch {
    try {
      return await invoke<boolean>('check_file_exists', { filePath: cleanPath });
    } catch {
      return false;
    }
  }
}

/**
 * Prompts user for a .foliant project file to open using native dialog.
 * Filters strictly for `.foliant` archives and removes folder selection.
 */
export async function promptOpenProjectFile(
  title: string = 'Open Foliant Project',
  defaultPath?: string | null
): Promise<string | null> {
  if (!isTauriApp()) {
    return null;
  }
  const selected = await open({
    directory: false,
    multiple: false,
    title,
    defaultPath: defaultPath || undefined,
    filters: FOLIANT_DIALOG_FILTERS,
  });

  if (!selected) return null;

  const rawPath = Array.isArray(selected) ? selected[0] : selected;
  if (!rawPath || typeof rawPath !== 'string' || rawPath.trim() === '') {
    return null;
  }

  return rawPath.trim();
}

/**
 * Prompts user for destination path to save a .foliant project file using native dialog.
 */
export async function promptSaveProjectFile(
  title: string = 'Save Foliant Project As',
  defaultPath?: string | null
): Promise<string | null> {
  if (!isTauriApp()) {
    return null;
  }
  const selected = await save({
    title,
    defaultPath: defaultPath || undefined,
    filters: FOLIANT_DIALOG_FILTERS,
  });

  if (!selected) return null;

  const rawPath = Array.isArray(selected) ? selected[0] : selected;
  if (!rawPath || typeof rawPath !== 'string' || rawPath.trim() === '') {
    return null;
  }

  let finalPath = rawPath.trim();
  if (!finalPath.toLowerCase().endsWith('.foliant')) {
    finalPath = `${finalPath}.foliant`;
  }
  return finalPath;
}

/**
 * Writes the project bundle to the given .foliant file with updated timestamp.
 */
export async function executeSaveBundle(
  filePath: string,
  project: FoliantProject
): Promise<{ updatedProject: FoliantProject; timestamp: number }> {
  const now = Date.now();
  const projectToSave: FoliantProject = {
    ...project,
    lastModified: now,
  };

  await writeProjectBundle(filePath, projectToSave);
  return { updatedProject: projectToSave, timestamp: now };
}

/**
 * Reads the project bundle from the specified .foliant file.
 */
export async function executeReadBundle(
  filePath: string
): Promise<FoliantProject> {
  return readProjectBundle(filePath);
}
