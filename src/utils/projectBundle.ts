import { invoke } from '@tauri-apps/api/core';
import { FoliantProject } from '../types/project';
import { isTauriApp } from './platform';
import { getMoodboardCacheKey, isCastleOrLegacyArtifact } from '../components/context/MoodboardBlock/constants';

/**
 * Extracts the project file name from a POSIX or Windows path.
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
export function normalizeLoadedProject(data: unknown): FoliantProject {
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
    characterPositions: Array.isArray(raw.characterPositions) ? raw.characterPositions : [],
    worldItems: Array.isArray(raw.worldItems) ? raw.worldItems : [],
    contextBlocks: Array.isArray(raw.contextBlocks)
      ? raw.contextBlocks.map((b: any) => ({
          ...b,
          folder: b.folder || undefined,
          storylineIds: Array.isArray(b.storylineIds) ? b.storylineIds : [],
          characterIds: Array.isArray(b.characterIds) ? b.characterIds : [],
          worldItemIds: Array.isArray(b.worldItemIds) ? b.worldItemIds : [],
          tags: Array.isArray(b.tags) ? b.tags : [],
        }))
      : [],
    visuals: Array.isArray(raw.visuals) ? raw.visuals : [],
  };
}

/**
 * Serializes and writes the novel into a single compressed `.foliant` bundle file.
 *
 * Calls the native Rust backend command `save_project_bundle` which creates a clean
 * ZIP archive containing `project.json` and `scenes/` without leaving legacy loose files.
 */
export async function writeProjectBundle(
  filePath: string,
  projectToSave: FoliantProject
): Promise<void> {
  let normalizedPath = filePath.trim();
  if (!normalizedPath.toLowerCase().endsWith('.foliant')) {
    normalizedPath = `${normalizedPath}.foliant`;
  }

  if (isTauriApp()) {
    let payload = { ...projectToSave };
    if (typeof localStorage !== 'undefined') {
      try {
        const stored =
          localStorage.getItem(getMoodboardCacheKey(payload.id)) ||
          localStorage.getItem('foliant_moodboard_cache_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            payload.visuals = parsed;
          }
        }
      } catch {
        // ignore cache reading error
      }
    }

    if (Array.isArray(payload.visuals)) {
      payload.visuals = payload.visuals.filter((v) => !isCastleOrLegacyArtifact(v));
    }

    await invoke('save_project_bundle', {
      filePath: normalizedPath,
      project: payload,
    });
    return;
  }

  throw new Error('Native project saving is only available in desktop environment.');
}

/**
 * Reads a single compressed `.foliant` bundle via the native Rust command `load_project_bundle`.
 *
 * Unpacks and reassembles `project.json` and scene files from `scenes/` in memory,
 * returning the complete unified FoliantProject.
 */
export async function readProjectBundle(filePath: string): Promise<FoliantProject> {
  const normalizedPath = filePath.trim();

  if (isTauriApp()) {
    const rawData = await invoke<unknown>('load_project_bundle', {
      filePath: normalizedPath,
    });
    const loaded = normalizeLoadedProject(rawData);

    if (Array.isArray(loaded.visuals)) {
      loaded.visuals = loaded.visuals.filter((v) => !isCastleOrLegacyArtifact(v));
    }

    if ((!loaded.visuals || loaded.visuals.length === 0) && typeof localStorage !== 'undefined') {
      try {
        const stored =
          localStorage.getItem(getMoodboardCacheKey(loaded.id)) ||
          localStorage.getItem('foliant_moodboard_cache_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loaded.visuals = parsed.filter((v) => !isCastleOrLegacyArtifact(v));
          }
        }
      } catch {
        // ignore
      }
    }

    if (loaded.visuals && loaded.visuals.length > 0 && typeof localStorage !== 'undefined') {
      try {
        const lightweight = loaded.visuals.map(({ id, path, name, sectionId }) => ({
          id,
          path,
          name,
          sectionId,
        }));
        localStorage.setItem(getMoodboardCacheKey(loaded.id), JSON.stringify(lightweight));
        localStorage.setItem('foliant_moodboard_cache_v1', JSON.stringify(lightweight));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('foliant-visuals-loaded', { detail: loaded.visuals }));
        }
      } catch {
        // ignore storage error
      }
    }

    return loaded;
  }

  throw new Error('Native project loading is only available in desktop environment.');
}
