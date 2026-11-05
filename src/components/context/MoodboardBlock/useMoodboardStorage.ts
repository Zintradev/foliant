import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { isTauriApp } from '../../../utils/platform';
import { ProjectVisualItem } from '../../../types/project';
import {
  ReferenceImage,
  MoodboardSection,
} from './types';
import {
  DEFAULT_SECTIONS,
  normalizeAssetPath,
  extractFileName,
  toReferenceImage,
  isCastleOrLegacyArtifact,
  generateStableImageId,
} from './constants';

function mapVisualsToReferenceImages(visuals?: ProjectVisualItem[]): ReferenceImage[] {
  if (!Array.isArray(visuals) || visuals.length === 0) return [];
  const clean = visuals.filter((c) => !isCastleOrLegacyArtifact(c));
  return clean.map((c) => {
    const normalized = normalizeAssetPath(c.path);
    const id = c.id || generateStableImageId(c.path);
    return {
      id,
      path: c.path,
      src: isTauriApp() && normalized ? convertFileSrc(normalized) : c.src || normalized || '',
      name: c.name || extractFileName(c.path),
      sectionId: c.sectionId || 'general',
      base64: c.base64,
    };
  });
}

export function useMoodboardStorage(
  projectId?: string,
  projectFilePath?: string | null,
  onUpdateVisuals?: (visuals: Array<{ id: string; path: string; name: string; sectionId: string; base64?: string }>) => void,
  initialVisuals?: ProjectVisualItem[]
) {
  const onUpdateVisualsRef = useRef(onUpdateVisuals);
  useEffect(() => {
    onUpdateVisualsRef.current = onUpdateVisuals;
  }, [onUpdateVisuals]);

  const fetchGenRef = useRef(0);

  // One-time automatic purge of any legacy moodboard caches from localStorage
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith('foliant_moodboard_') ||
              key === 'foliant_moodboard_cache_v1' ||
              key === 'foliant_moodboard_sections_v1')
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch {
      // ignore
    }
  }, []);

  // Visuals live strictly in RAM and in the .foliant file
  const [images, setImages] = useState<ReferenceImage[]>(() =>
    mapVisualsToReferenceImages(initialVisuals)
  );
  const [sections, setSections] = useState<MoodboardSection[]>(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Re-initialize state strictly when the active project ID changes
  const prevProjectIdRef = useRef(projectId);
  useEffect(() => {
    if (prevProjectIdRef.current !== projectId) {
      prevProjectIdRef.current = projectId;
      // Strict reset: empty out completely before adopting new project visuals
      const next = mapVisualsToReferenceImages(initialVisuals);
      setImages(next);
      setSections(DEFAULT_SECTIONS);
      setErrorMessage(null);
    }
  }, [projectId, initialVisuals]);

  // Sync if parent updates initialVisuals from project state
  useEffect(() => {
    const nextImages = mapVisualsToReferenceImages(initialVisuals);
    setImages((prev) => {
      if (
        prev.length === nextImages.length &&
        prev.every(
          (item, i) =>
            item.id === nextImages[i]?.id &&
            item.path === nextImages[i]?.path &&
            item.sectionId === nextImages[i]?.sectionId &&
            item.name === nextImages[i]?.name
        )
      ) {
        return prev;
      }
      return nextImages;
    });
  }, [initialVisuals]);

  const commitImages = useCallback((updated: ReferenceImage[]) => {
    setImages(updated);
    const serializable = updated.map(({ id, path, name, sectionId, base64 }) => ({
      id,
      path,
      name,
      sectionId,
      base64,
    }));
    onUpdateVisualsRef.current?.(serializable);
  }, []);

  const fetchImages = useCallback(async () => {
    const currentGen = ++fetchGenRef.current;
    if (!isTauriApp()) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const paths = await invoke<string[]>('list_reference_images', {
        projectPath: projectFilePath || null,
        projectId: projectId || null,
      });
      const safePaths = (Array.isArray(paths) ? paths : []).filter(
        (p) => !isCastleOrLegacyArtifact({ path: p })
      );

      if (fetchGenRef.current !== currentGen) {
        return;
      }

      // Reconcile: ONLY reconcile paths for images already in project state.
      // Do NOT invent rogue files from disk into an empty or unsaved project!
      setImages((prev) => {
        if (prev.length === 0) {
          return prev;
        }
        const reconciled: ReferenceImage[] = prev.map((img) => {
          const normCached = normalizeAssetPath(img.path).toLowerCase();
          const diskMatch = safePaths.find(
            (p) =>
              normalizeAssetPath(p).toLowerCase() === normCached ||
              extractFileName(p) === img.name
          );
          const effectivePath = diskMatch || img.path;
          const normalized = normalizeAssetPath(effectivePath);
          return {
            ...img,
            path: effectivePath,
            src: convertFileSrc(normalized),
            name: img.name || extractFileName(effectivePath),
          };
        });

        if (
          prev.length === reconciled.length &&
          prev.every(
            (item, i) =>
              item.path === reconciled[i]?.path &&
              item.sectionId === reconciled[i]?.sectionId &&
              item.id === reconciled[i]?.id &&
              item.src === reconciled[i]?.src
          )
        ) {
          return prev;
        }
        return reconciled;
      });
    } catch (err) {
      if (fetchGenRef.current !== currentGen) return;
      setErrorMessage(String(err));
    } finally {
      setLoading(false);
    }
  }, [projectFilePath, projectId]);

  useEffect(() => {
    void fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    const handleVisualsLoaded = (event: Event) => {
      const customEvent = event as CustomEvent<ReferenceImage[]>;
      if (Array.isArray(customEvent.detail)) {
        const cleanDetail = customEvent.detail.filter((c) => !isCastleOrLegacyArtifact(c));
        if (cleanDetail.length === 0) {
          // Strict reset when project visuals are empty
          setImages([]);
          return;
        }
        const mapped: ReferenceImage[] = cleanDetail.map((c) => {
          const normalized = normalizeAssetPath(c.path);
          const id = c.id || generateStableImageId(c.path);
          return {
            id,
            path: c.path,
            src: isTauriApp() && normalized ? convertFileSrc(normalized) : c.src || normalized || '',
            name: c.name || extractFileName(c.path),
            sectionId: c.sectionId || 'general',
            base64: c.base64,
          };
        });
        setImages((prev) => {
          if (
            prev.length === mapped.length &&
            prev.every(
              (item, i) =>
                item.path === mapped[i]?.path &&
                item.sectionId === mapped[i]?.sectionId &&
                item.id === mapped[i]?.id
            )
          ) {
            return prev;
          }
          return mapped;
        });
      }
    };

    window.addEventListener('foliant-visuals-loaded', handleVisualsLoaded);
    return () => {
      window.removeEventListener('foliant-visuals-loaded', handleVisualsLoaded);
    };
  }, []);

  const uploadFile = useCallback(
    async (file: File, targetSectionId: string = 'general') => {
      setUploading(true);
      setErrorMessage(null);

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject(reader.error);
          };
          reader.readAsDataURL(file);
        });

        let savedPath: string = file.name;
        if (isTauriApp()) {
          try {
            savedPath = await invoke<string>('save_reference_image_base64', {
              fileName: file.name,
              dataBase64: base64Data,
              projectPath: projectFilePath || null,
              projectId: projectId || null,
            });
          } catch {
            savedPath = file.name;
          }
        }

        const newImg = toReferenceImage(savedPath, targetSectionId, base64Data);

        setImages((prev) => {
          if (
            prev.some(
              (img) => (img.path === savedPath || img.id === newImg.id) && img.name === file.name
            )
          ) {
            return prev;
          }
          const updated = [...prev, newImg];
          const serializable = updated.map(({ id, path, name, sectionId, base64 }) => ({
            id,
            path,
            name,
            sectionId,
            base64,
          }));
          onUpdateVisualsRef.current?.(serializable);
          return updated;
        });
      } catch (err) {
        setErrorMessage(String(err));
      } finally {
        setUploading(false);
      }
    },
    [projectFilePath, projectId]
  );

  const handleDeleteImage = useCallback(
    async (image: ReferenceImage) => {
      setErrorMessage(null);
      try {
        if (isTauriApp()) {
          await invoke('delete_reference_image', {
            fileName: image.name,
            projectPath: projectFilePath || null,
            projectId: projectId || null,
          });
        }
        setImages((prev) => {
          const updated = prev.filter((item) => item.path !== image.path && item.id !== image.id);
          const serializable = updated.map(({ id, path, name, sectionId, base64 }) => ({
            id,
            path,
            name,
            sectionId,
            base64,
          }));
          onUpdateVisualsRef.current?.(serializable);
          return updated;
        });
      } catch (err) {
        setErrorMessage(String(err));
      }
    },
    [projectFilePath, projectId]
  );

  const handleAddSection = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newSection: MoodboardSection = {
      id: `sec-${Date.now()}`,
      name: trimmed,
    };
    setSections((prev) => [...prev, newSection]);
  }, []);

  const handleDeleteSection = useCallback(
    async (sectionId: string) => {
      // 1. Remove the section
      setSections((prev) => prev.filter((s) => s.id !== sectionId));

      // 2. Identify all images inside the section to delete physically
      const imagesToDelete = images.filter((img) => (img.sectionId || 'general') === sectionId);
      if (isTauriApp()) {
        for (const img of imagesToDelete) {
          try {
            await invoke('delete_reference_image', {
              fileName: img.name,
              projectPath: projectFilePath || null,
              projectId: projectId || null,
            });
          } catch {
            // non-fatal physical deletion failure
          }
        }
      }

      // 3. Remove all images in the deleted folder from state immediately
      const remaining = images.filter((img) => (img.sectionId || 'general') !== sectionId);
      setImages(remaining);

      // 4. Notify project
      const serializable = remaining.map(({ id, path, name, sectionId, base64 }) => ({
        id,
        path,
        name,
        sectionId,
        base64,
      }));
      onUpdateVisualsRef.current?.(serializable);
    },
    [images, projectFilePath, projectId]
  );

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
    handleDeleteSection,
  };
}
