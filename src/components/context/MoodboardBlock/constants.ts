import { MoodboardSection, ReferenceImage } from './types';

export const DEFAULT_SECTIONS: MoodboardSection[] = [
  { id: 'general', name: 'General' },
  { id: 'characters', name: 'Characters' },
  { id: 'locations', name: 'Locations' },
  { id: 'atmosphere', name: 'Atmosphere' },
];

export const MOODBOARD_CACHE_KEY = 'foliant_moodboard_cache_v1';
export const MOODBOARD_SECTIONS_KEY = 'foliant_moodboard_sections_v1';

export function extractFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

export function toReferenceImage(
  absolutePath: string,
  sectionId: string = 'general',
  base64?: string
): ReferenceImage {
  return {
    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    path: absolutePath,
    src: base64 || '',
    name: extractFileName(absolutePath),
    sectionId,
    base64,
  };
}
