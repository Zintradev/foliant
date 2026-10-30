import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { isTauriApp } from '../../../utils/platform';
import {
  ReferenceImage,
  MoodboardSection,
  CachedReferenceImage,
} from './types';
import {
  DEFAULT_SECTIONS,
  MOODBOARD_CACHE_KEY,
  MOODBOARD_SECTIONS_KEY,
  extractFileName,
  toReferenceImage,
} from './constants';

export function useMoodboardStorage() {
  const [images, setImages] = useState<ReferenceImage[]>(() => {
    try {
      const stored = localStorage.getItem(MOODBOARD_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: CachedReferenceImage) => ({
            id: c.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            path: c.path,
            src: c.base64 || '',
            name: c.name || extractFileName(c.path),
            sectionId: c.sectionId || 'general',
            base64: c.base64,
          }));
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [sections, setSections] = useState<MoodboardSection[]>(() => {
    try {
      const stored = localStorage.getItem(MOODBOARD_SECTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_SECTIONS;
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync sections to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(MOODBOARD_SECTIONS_KEY, JSON.stringify(sections));
    } catch {
      // ignore
    }
  }, [sections]);

  // Sync images to localStorage
  useEffect(() => {
    if (images.length > 0) {
      try {
        const serializable = images.map(({ id, path, name, sectionId, base64 }) => ({
          id,
          path,
          name,
          sectionId,
          base64,
        }));
        localStorage.setItem(MOODBOARD_CACHE_KEY, JSON.stringify(serializable));
      } catch {
        // ignore
      }
    }
  }, [images]);

  const commitImages = useCallback((updated: ReferenceImage[]) => {
    setImages(updated);
    try {
      const serializable = updated.map(({ id, path, name, sectionId, base64 }) => ({
        id,
        path,
        name,
        sectionId,
        base64,
      }));
      localStorage.setItem(MOODBOARD_CACHE_KEY, JSON.stringify(serializable));
    } catch {
      // ignore
    }
  }, []);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let cached: Array<{ id: string; path: string; name: string; sectionId: string; base64?: string }> = [];
      try {
        const stored = localStorage.getItem(MOODBOARD_CACHE_KEY);
        if (stored) cached = JSON.parse(stored);
      } catch {
        // ignore
      }

      // If running in a web browser without Tauri native IPC, use cache exclusively
      if (!isTauriApp()) {
        const reconciled: ReferenceImage[] = (Array.isArray(cached) ? cached : []).map((c) => ({
          id: c.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          path: c.path || c.name || `web-img-${Date.now()}`,
          src: c.base64 || '',
          name: c.name || extractFileName(c.path || 'image'),
          sectionId: c.sectionId || 'general',
          base64: c.base64,
        }));
        setImages(reconciled);
        return;
      }

      const paths = await invoke<string[]>('list_reference_images');
      const safePaths = Array.isArray(paths) ? paths : [];
      const reconciled: ReferenceImage[] = safePaths.map((p) => {
        const found = cached.find((c) => c.path === p);
        if (found) {
          return {
            id: found.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            path: p,
            src: found.base64 || '',
            name: found.name || extractFileName(p),
            sectionId: found.sectionId || 'general',
            base64: found.base64,
          };
        }
        return toReferenceImage(p, 'general');
      });

      setImages(reconciled);
    } catch (err) {
      console.error('Failed to load reference images:', err);
      try {
        const stored = localStorage.getItem(MOODBOARD_CACHE_KEY);
        if (stored) {
          const cached = JSON.parse(stored);
          setImages(
            cached.map((c: CachedReferenceImage) => ({
              ...c,
              src: c.base64 || '',
            }))
          );
        }
      } catch {
        // ignore
      }
      setErrorMessage(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const uploadFile = useCallback(
    async (file: File, targetSectionId: string = 'general') => {
      setUploading(true);
      setErrorMessage(null);

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        let savedPath: string = file.name;
        if (isTauriApp()) {
          try {
            savedPath = await invoke<string>('save_reference_image_base64', {
              fileName: file.name,
              dataBase64: base64Data,
            });
          } catch {
            savedPath = file.name;
          }
        }

        const newImg = toReferenceImage(savedPath, targetSectionId, base64Data);

        setImages((prev) => {
          if (prev.some((img) => img.path === savedPath && img.name === file.name)) {
            return prev;
          }
          const updated = [...prev, newImg];
          try {
            localStorage.setItem(MOODBOARD_CACHE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
      } catch (err) {
        console.error('Failed to upload image:', err);
        setErrorMessage(String(err));
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const handleDeleteImage = useCallback(async (image: ReferenceImage) => {
    setErrorMessage(null);
    try {
      if (isTauriApp()) {
        await invoke('delete_reference_image', { fileName: image.name });
      }
      setImages((prev) => {
        const updated = prev.filter((item) => item.path !== image.path);
        try {
          localStorage.setItem(MOODBOARD_CACHE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to delete image:', err);
      setErrorMessage(String(err));
    }
  }, []);

  const handleAddSection = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newSection: MoodboardSection = {
      id: `sec-${Date.now()}`,
      name: trimmed,
    };
    setSections((prev) => [...prev, newSection]);
  }, []);

  return {
    images,
    setImages,
    commitImages,
    sections,
    loading,
    uploading,
    errorMessage,
    setErrorMessage,
    fetchImages,
    uploadFile,
    handleDeleteImage,
    handleAddSection,
  };
}
