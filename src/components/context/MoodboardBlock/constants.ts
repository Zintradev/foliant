import { convertFileSrc } from '@tauri-apps/api/core';
import { isTauriApp } from '../../../utils/platform';
import { MoodboardSection, ReferenceImage } from './types';

export const DEFAULT_SECTIONS: MoodboardSection[] = [
  { id: 'general', name: 'General' },
  { id: 'characters', name: 'Characters' },
  { id: 'locations', name: 'Locations' },
  { id: 'atmosphere', name: 'Atmosphere' },
];

export const MOODBOARD_CACHE_KEY = 'foliant_moodboard_cache_v1';
export const MOODBOARD_SECTIONS_KEY = 'foliant_moodboard_sections_v1';

export function getMoodboardCacheKey(projectId?: string | null): string {
  if (projectId && projectId.trim()) {
    return `foliant_moodboard_${projectId.trim()}`;
  }
  return MOODBOARD_CACHE_KEY;
}

export function getMoodboardSectionsKey(projectId?: string | null): string {
  if (projectId && projectId.trim()) {
    return `foliant_moodboard_sections_${projectId.trim()}`;
  }
  return MOODBOARD_SECTIONS_KEY;
}

export function normalizeAssetPath(filePath: string): string {
  if (!filePath) return '';
  return filePath.replace(/\\/g, '/');
}

export function extractFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

export function isCastleOrLegacyArtifact(item: { name?: string; path?: string }): boolean {
  const name = (item.name || '').toLowerCase().trim();
  const path = (item.path || '').toLowerCase().replace(/\\/g, '/');
  return (
    name === 'castle.jpg' ||
    name === 'web-castle.jpg' ||
    path.endsWith('/castle.jpg') ||
    path.endsWith('/web-castle.jpg')
  );
}

export function generateStableImageId(pathOrName: string): string {
  let hash = 0;
  for (let i = 0; i < pathOrName.length; i++) {
    hash = (hash << 5) - hash + pathOrName.charCodeAt(i);
    hash |= 0;
  }
  return `img-${Math.abs(hash)}`;
}

export function toReferenceImage(
  absolutePath: string,
  sectionId: string = 'general',
  base64?: string
): ReferenceImage {
  const normalized = normalizeAssetPath(absolutePath);
  const displaySrc = isTauriApp() && normalized ? convertFileSrc(normalized) : normalized;

  return {
    id: generateStableImageId(absolutePath),
    path: absolutePath,
    src: displaySrc,
    name: extractFileName(absolutePath),
    sectionId,
    base64,
  };
}
