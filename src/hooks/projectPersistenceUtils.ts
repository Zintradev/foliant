import { open } from '@tauri-apps/plugin-dialog';
import { isTauriApp } from '../utils/platform';
import { FoliantProject } from '../types/project';
import {
  writeProjectBundle,
  readProjectBundle,
} from '../utils/projectBundle';

/**
 * Prompts user for a directory path using native dialog.
 * Returns sanitized trimmed path or null if aborted.
 */
export async function promptSelectDirectory(
  title: string,
  defaultPath?: string | null
): Promise<string | null> {
  if (!isTauriApp()) {
    return null;
  }
  const selected = await open({
    directory: true,
    multiple: false,
    title,
    defaultPath: defaultPath || undefined,
  });

  if (!selected) return null;

  const rawPath = Array.isArray(selected) ? selected[0] : selected;
  if (!rawPath || typeof rawPath !== 'string' || rawPath.trim() === '') {
    return null;
  }

  const targetDirectory = rawPath.trim().replace(/[/\\]+$/, '');
  return targetDirectory || null;
}

/**
 * Writes the project bundle to the given directory with updated timestamp.
 */
export async function executeSaveBundle(
  directory: string,
  project: FoliantProject
): Promise<{ updatedProject: FoliantProject; timestamp: number }> {
  const now = Date.now();
  const projectToSave: FoliantProject = {
    ...project,
    lastModified: now,
  };

  await writeProjectBundle(directory, projectToSave);
  return { updatedProject: projectToSave, timestamp: now };
}

/**
 * Reads the project bundle from the specified directory.
 */
export async function executeReadBundle(
  directory: string
): Promise<FoliantProject> {
  return readProjectBundle(directory);
}
