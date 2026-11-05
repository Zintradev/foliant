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

export const LAST_FOLIANT_PROJECT_KEY = 'lastOpenedProjectPath';

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
 * Extracts a clean project title from a file path by taking the base name
 * and stripping any known extension (.foliant, .json).
 */
export function extractProjectTitleFromPath(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') return '';
  const normalized = filePath.replace(/\\/g, '/');
  const fileName = normalized.split('/').pop() || '';
  const baseName = fileName.replace(/\.(foliant|json)$/i, '').trim();
  return baseName;
}

/**
 * Writes the project bundle to the given .foliant file with updated timestamp.
 * Synchronizes the internal project title with the saved file's base name.
 */
export async function executeSaveBundle(
  filePath: string,
  project: FoliantProject
): Promise<{ updatedProject: FoliantProject; timestamp: number }> {
  const now = Date.now();
  const fileTitle = extractProjectTitleFromPath(filePath);
  const projectToSave: FoliantProject = {
    ...project,
    title: fileTitle || project.title,
    lastModified: now,
  };

  await writeProjectBundle(filePath, projectToSave);
  return { updatedProject: projectToSave, timestamp: now };
}

/**
 * Reads the project bundle from the specified .foliant file.
 * Synchronizes the internal project title with the opened file's base name.
 */
export async function executeReadBundle(
  filePath: string
): Promise<FoliantProject> {
  const loaded = await readProjectBundle(filePath);
  const fileTitle = extractProjectTitleFromPath(filePath);
  if (fileTitle) {
    loaded.title = fileTitle;
  }
  return loaded;
}
