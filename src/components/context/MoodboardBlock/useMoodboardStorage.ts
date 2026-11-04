import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { isTauriApp } from '../../../utils/platform';
import { ProjectVisualItem } from '../../../types/project';
import {
  ReferenceImage,
  MoodboardSection,
  CachedReferenceImage,
} from './types';
import {
  DEFAULT_SECTIONS,
  getMoodboardCacheKey,
  getMoodboardSectionsKey,
  normalizeAssetPath,
  extractFileName,
  toReferenceImage,
  isCastleOrLegacyArtifact,
  generateStableImageId,
} from './constants';

export function useMoodboardStorage(
  projectId?: string,
  projectFilePath?: string | null,
  onUpdateVisuals?: (visuals: Array<{ id: string; path: string; name: string; sectionId: string }>) => void,
  initialVisuals?: ProjectVisualItem[]
) {
  const onUpdateVisualsRef = useRef(onUpdateVisuals);
  useEffect(() => {
    onUpdateVisualsRef.current = onUpdateVisuals;
  }, [onUpdateVisuals]);

  const cacheKey = useMemo(() => getMoodboardCacheKey(projectId), [projectId]);
  const sectionsKey = useMemo(() => getMoodboardSectionsKey(projectId), [projectId]);
  const fetchGenRef = useRef(0);

  // One-time automatic purge of any legacy castle.jpg references from all localStorage caches
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('foliant_moodboard_') || key === 'foliant_moodboard_cache_v1')) {
            const raw = localStorage.getItem(key);
            if (raw && (raw.includes('castle.jpg') || raw.includes('web-castle.jpg'))) {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                  const cleaned = parsed.filter((item) => !isCastleOrLegacyArtifact(item));
                  localStorage.setItem(key, JSON.stringify(cleaned));
                }
              } catch {}
            }
          }
        }
      }
    } catch {}
  }, []);

  const loadInitialImages = useCallback((): ReferenceImage[] => {
    console.log(`[useMoodboardStorage:loadInitialImages] START for projectId="${projectId}", cacheKey="${cacheKey}"`);

    // 1. If parent passes initialVisuals, prioritize them
    if (Array.isArray(initialVisuals) && initialVisuals.length > 0) {
      const cleanInit = initialVisuals.filter((c) => !isCastleOrLegacyArtifact(c));
      console.log(`[useMoodboardStorage:loadInitialImages] Found ${cleanInit.length} initialVisuals from props`);
      if (cleanInit.length > 0) {
        return cleanInit.map((c) => {
          const normalized = normalizeAssetPath(c.path);
          const id = c.id || generateStableImageId(c.path);
          return {
            id,
            path: c.path,
            src: isTauriApp() && normalized ? convertFileSrc(normalized) : normalized || '',
            name: c.name || extractFileName(c.path),
            sectionId: c.sectionId || 'general',
          };
        });
      }
    }

    // 2. Try project-specific localStorage
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanList = parsed.filter((c: CachedReferenceImage) => !isCastleOrLegacyArtifact(c));
          console.log(`[useMoodboardStorage:loadInitialImages] Found ${cleanList.length} image(s) in localStorage (${cacheKey})`);
          if (cleanList.length !== parsed.length) {
            localStorage.setItem(cacheKey, JSON.stringify(cleanList));
          }
          return cleanList.map((c: CachedReferenceImage) => {
            const normalized = normalizeAssetPath(c.path);
            const id = c.id || generateStableImageId(c.path);
            return {
              id,
              path: c.path,
              src: isTauriApp() && normalized ? convertFileSrc(normalized) : normalized || '',
              name: c.name || extractFileName(c.path),
              sectionId: c.sectionId || 'general',
            };
          });
        }
      }
    } catch (e) {
      console.warn(`[useMoodboardStorage:loadInitialImages] Error reading localStorage (${cacheKey}):`, e);
    }

    // 3. Try global cache if project cache is empty
    try {
      const storedGlobal = localStorage.getItem('foliant_moodboard_cache_v1');
      if (storedGlobal) {
        const parsed = JSON.parse(storedGlobal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanList = parsed.filter((c: CachedReferenceImage) => !isCastleOrLegacyArtifact(c));
          console.log(`[useMoodboardStorage:loadInitialImages] Found ${cleanList.length} image(s) in fallback global cache (foliant_moodboard_cache_v1)`);
          return cleanList.map((c: CachedReferenceImage) => {
            const normalized = normalizeAssetPath(c.path);
            const id = c.id || generateStableImageId(c.path);
            return {
              id,
              path: c.path,
              src: isTauriApp() && normalized ? convertFileSrc(normalized) : normalized || '',
              name: c.name || extractFileName(c.path),
              sectionId: c.sectionId || 'general',
            };
          });
        }
      }
    } catch (e) {
      console.warn(`[useMoodboardStorage:loadInitialImages] Error reading fallback global cache:`, e);
    }

    console.log(`[useMoodboardStorage:loadInitialImages] No images found, returning empty array.`);
    return [];
  }, [cacheKey, initialVisuals, projectId]);

  const loadInitialSections = useCallback((): MoodboardSection[] => {
    try {
      const stored = localStorage.getItem(sectionsKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_SECTIONS;
  }, [sectionsKey]);

  const [images, setImages] = useState<ReferenceImage[]>(loadInitialImages);
  const [sections, setSections] = useState<MoodboardSection[]>(loadInitialSections);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Re-initialize state strictly when the active project ID changes
  const prevProjectIdRef = useRef(projectId);
  useEffect(() => {
    if (prevProjectIdRef.current !== projectId) {
      console.log(`[useMoodboardStorage:PROJECT_ID_CHANGED] Project ID switched from "${prevProjectIdRef.current}" to "${projectId}"`);
      prevProjectIdRef.current = projectId;
      const initial = loadInitialImages();
      console.log(`[useMoodboardStorage:PROJECT_ID_CHANGED] loadInitialImages for "${projectId}" returned ${initial.length} image(s)`);

      if (initial.length > 0) {
        console.log(`[useMoodboardStorage:PROJECT_ID_CHANGED] Applying ${initial.length} images from initial load`);
        setImages(initial);
      } else {
        setImages((prev) => {
          if (prev.length > 0) {
            console.log(
              `[useMoodboardStorage:PROJECT_ID_CHANGED] New project had 0 images in cache/props, but PRESERVING ${prev.length} image(s) from current view and migrating to cacheKey "${cacheKey}"`
            );
            try {
              const serializable = prev.map(({ id, path, name, sectionId }) => ({
                id,
                path,
                name,
                sectionId,
              }));
              localStorage.setItem(cacheKey, JSON.stringify(serializable));
            } catch (err) {
              console.error('[useMoodboardStorage:PROJECT_ID_CHANGED] Error migrating images to new cacheKey:', err);
            }
            return prev;
          }
          console.log(`[useMoodboardStorage:PROJECT_ID_CHANGED] No images in current state either, state is empty []`);
          return [];
        });
      }

      setSections(loadInitialSections());
    }
  }, [projectId, loadInitialImages, loadInitialSections, cacheKey]);

  // Sync if parent updates initialVisuals from project state
  useEffect(() => {
    if (Array.isArray(initialVisuals) && initialVisuals.length > 0) {
      const cleanInit = initialVisuals.filter((c) => !isCastleOrLegacyArtifact(c));
      console.log(`[useMoodboardStorage:initialVisuals] Received ${cleanInit.length} initialVisuals prop(s)`);
      if (cleanInit.length > 0) {
        setImages((prev) => {
          if (prev.length === 0) {
            console.log(`[useMoodboardStorage:initialVisuals] State was empty, populating ${cleanInit.length} image(s) from initialVisuals`);
            return cleanInit.map((c) => {
              const normalized = normalizeAssetPath(c.path);
              const id = c.id || generateStableImageId(c.path);
              return {
                id,
                path: c.path,
                src: isTauriApp() && normalized ? convertFileSrc(normalized) : normalized || '',
                name: c.name || extractFileName(c.path),
                sectionId: c.sectionId || 'general',
              };
            });
          }
          console.log(`[useMoodboardStorage:initialVisuals] State already has ${prev.length} image(s), retaining current state`);
          return prev;
        });
      }
    }
  }, [initialVisuals]);

  // Sync sections to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(sectionsKey, JSON.stringify(sections));
    } catch {
      // ignore
    }
  }, [sections, sectionsKey]);

  // Sync images to localStorage (saving only lightweight metadata: id, name, path, sectionId)
  useEffect(() => {
    try {
      const serializable = images.map(({ id, path, name, sectionId }) => ({
        id,
        path,
        name,
        sectionId,
      }));
      console.log(`[useMoodboardStorage:SYNC_CACHE] Syncing ${serializable.length} image(s) to localStorage key "${cacheKey}"`);
      localStorage.setItem(cacheKey, JSON.stringify(serializable));
    } catch (err) {
      console.error('[useMoodboardStorage] Failed to sync images to localStorage:', err);
    }
  }, [images, cacheKey]);

  const commitImages = useCallback((updated: ReferenceImage[]) => {
    console.log(`[useMoodboardStorage:commitImages] Committing ${updated.length} image(s)`);
    setImages(updated);
    try {
      const serializable = updated.map(({ id, path, name, sectionId }) => ({
        id,
        path,
        name,
        sectionId,
      }));
      localStorage.setItem(cacheKey, JSON.stringify(serializable));
      onUpdateVisualsRef.current?.(serializable);
    } catch (err) {
      console.error('[useMoodboardStorage.commitImages] Failed to update localStorage:', err);
    }
  }, [cacheKey]);

  const fetchImages = useCallback(async () => {
    const currentGen = ++fetchGenRef.current;
    console.log(`[useMoodboardStorage:fetchImages:START] gen=${currentGen}, projectId="${projectId}", projectFilePath="${projectFilePath}"`);
    setLoading(true);
    setErrorMessage(null);
    try {
      let cached: Array<{ id: string; path: string; name: string; sectionId: string }> = [];
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) cached = JSON.parse(stored);
      } catch {
        // ignore
      }

      if (!Array.isArray(cached) || cached.length === 0) {
        try {
          const storedGlobal = localStorage.getItem('foliant_moodboard_cache_v1');
          if (storedGlobal) cached = JSON.parse(storedGlobal);
        } catch {
          // ignore
        }
      }

      if (!Array.isArray(cached)) {
        cached = [];
      }

      // Purge castle.jpg or rogue legacy items from cached
      const cleanCached = cached.filter((c) => !isCastleOrLegacyArtifact(c));
      if (cleanCached.length !== cached.length) {
        localStorage.setItem(cacheKey, JSON.stringify(cleanCached));
        cached = cleanCached;
      }
      console.log(`[useMoodboardStorage:fetchImages] Cached images found: ${cached.length}`);

      // If running in a web browser without Tauri native IPC, use cache exclusively
      if (!isTauriApp()) {
        const reconciled: ReferenceImage[] = cached.map((c) => {
          const id = c.id || generateStableImageId(c.path);
          return {
            id,
            path: c.path || c.name || `web-img-${id}`,
            src: c.path || '',
            name: c.name || extractFileName(c.path || 'image'),
            sectionId: c.sectionId || 'general',
          };
        });
        if (fetchGenRef.current !== currentGen) return;
        setImages((prev) => {
          if (
            prev.length === reconciled.length &&
            prev.every(
              (item, i) =>
                item.path === reconciled[i]?.path &&
                item.sectionId === reconciled[i]?.sectionId &&
                item.id === reconciled[i]?.id
            )
          ) {
            return prev;
          }
          console.log(`[useMoodboardStorage:fetchImages:WEB] Updated images: ${reconciled.length}`);
          return reconciled;
        });
        return;
      }

      console.log(`[useMoodboardStorage:fetchImages] Invoking list_reference_images with projectPath="${projectFilePath}", projectId="${projectId}"`);
      const paths = await invoke<string[]>('list_reference_images', {
        projectPath: projectFilePath || null,
        projectId: projectId || null,
      });
      const safePaths = (Array.isArray(paths) ? paths : []).filter(
        (p) => !isCastleOrLegacyArtifact({ path: p })
      );
      console.log(`[useMoodboardStorage:fetchImages] Disk returned ${safePaths.length} image path(s)`);

      if (fetchGenRef.current !== currentGen) {
        console.warn(`[useMoodboardStorage:fetchImages] Stale fetch response discarded (gen ${currentGen} !== ${fetchGenRef.current})`);
        return;
      }

      // Reconcile: ONLY display images that belong to this project's cached visuals.
      // Reconcile disk paths when present; do not invent rogue files from disk into the project.
      if (cached.length > 0) {
        const reconciled: ReferenceImage[] = cached.map((c) => {
          const normCached = normalizeAssetPath(c.path).toLowerCase();
          const diskMatch = safePaths.find(
            (p) => normalizeAssetPath(p).toLowerCase() === normCached || extractFileName(p) === c.name
          );
          const effectivePath = diskMatch || c.path;
          const normalized = normalizeAssetPath(effectivePath);
          const id = c.id || generateStableImageId(effectivePath);
          return {
            id,
            path: effectivePath,
            src: convertFileSrc(normalized),
            name: c.name || extractFileName(effectivePath),
            sectionId: c.sectionId || 'general',
          };
        });
        setImages((prev) => {
          if (
            prev.length === reconciled.length &&
            prev.every(
              (item, i) =>
                item.path === reconciled[i]?.path &&
                item.sectionId === reconciled[i]?.sectionId &&
                item.id === reconciled[i]?.id
            )
          ) {
            return prev;
          }
          console.log(`[useMoodboardStorage:fetchImages] Reconciled and updated ${reconciled.length} images in state`);
          return reconciled;
        });
      } else if (safePaths.length > 0) {
        // Disk has images for this project but cache was empty: adopt disk images
        console.log(`[useMoodboardStorage:fetchImages] Cache was empty, adopting ${safePaths.length} images from disk`);
        const fromDisk: ReferenceImage[] = safePaths.map((p) => {
          const normalized = normalizeAssetPath(p);
          const id = generateStableImageId(p);
          return {
            id,
            path: p,
            src: convertFileSrc(normalized),
            name: extractFileName(p),
            sectionId: 'general',
          };
        });
        setImages(fromDisk);
      } else {
        // Neither cache nor disk found images.
        // DO NOT wipe out images if state already has images loaded (prevents race condition disappearing images!)
        console.log(`[useMoodboardStorage:fetchImages] Cache and disk both returned 0 images. Preserving current state.`);
        setImages((prev) => (prev.length > 0 ? prev : []));
      }
    } catch (err) {
      console.error('[useMoodboardStorage:fetchImages] ERROR loading reference images:', err);
      if (fetchGenRef.current !== currentGen) return;
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          const rawCached = JSON.parse(stored);
          if (Array.isArray(rawCached)) {
            const clean = rawCached.filter((c: CachedReferenceImage) => !isCastleOrLegacyArtifact(c));
            setImages(
              clean.map((c: CachedReferenceImage) => {
                const normalized = normalizeAssetPath(c.path);
                const id = c.id || generateStableImageId(c.path);
                return {
                  id,
                  path: c.path,
                  src: isTauriApp() && normalized ? convertFileSrc(normalized) : c.path || '',
                  name: c.name || extractFileName(c.path),
                  sectionId: c.sectionId || 'general',
                };
              })
            );
          }
        }
      } catch {
        // ignore
      }
      setErrorMessage(String(err));
    } finally {
      console.log(`[useMoodboardStorage:fetchImages:FINALLY] gen=${currentGen}, setting loading=false`);
      setLoading(false);
    }
  }, [cacheKey, projectFilePath, projectId]);

  useEffect(() => {
    void fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    const handleVisualsLoaded = (event: Event) => {
      const customEvent = event as CustomEvent<ReferenceImage[]>;
      if (Array.isArray(customEvent.detail)) {
        const cleanDetail = customEvent.detail.filter((c) => !isCastleOrLegacyArtifact(c));
        // If empty detail is received, do not wipe out already displayed images!
        if (cleanDetail.length === 0) {
          return;
        }
        const mapped: ReferenceImage[] = cleanDetail.map((c) => {
          const normalized = normalizeAssetPath(c.path);
          const id = c.id || generateStableImageId(c.path);
          return {
            id,
            path: c.path,
            src: isTauriApp() && normalized ? convertFileSrc(normalized) : c.path || '',
            name: c.name || extractFileName(c.path),
            sectionId: c.sectionId || 'general',
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
      console.log(`[useMoodboardStorage.uploadFile] START upload for "${file.name}" (${file.type}, ${file.size} bytes), target section: "${targetSectionId}"`);
      setUploading(true);
      setErrorMessage(null);

      try {
        console.log(`[useMoodboardStorage.uploadFile] Reading file via FileReader...`);
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            console.log(`[useMoodboardStorage.uploadFile] FileReader loaded successfully, length: ${(reader.result as string)?.length || 0}`);
            resolve(reader.result as string);
          };
          reader.onerror = (err) => {
            console.error(`[useMoodboardStorage.uploadFile] FileReader error:`, err);
            reject(reader.error);
          };
          reader.readAsDataURL(file);
        });

        let savedPath: string = file.name;
        if (isTauriApp()) {
          try {
            console.log(`[useMoodboardStorage.uploadFile] Invoking Tauri save_reference_image_base64...`);
            savedPath = await invoke<string>('save_reference_image_base64', {
              fileName: file.name,
              dataBase64: base64Data,
              projectPath: projectFilePath || null,
              projectId: projectId || null,
            });
            console.log(`[useMoodboardStorage.uploadFile] Native image saved successfully to path: "${savedPath}"`);
          } catch (invokeErr) {
            console.warn(`[useMoodboardStorage.uploadFile] Tauri invoke save_reference_image_base64 failed:`, invokeErr);
            savedPath = file.name;
          }
        } else {
          console.log(`[useMoodboardStorage.uploadFile] Web environment (non-Tauri), using filename: "${file.name}"`);
        }

        const newImg = toReferenceImage(savedPath, targetSectionId, base64Data);
        console.log(`[useMoodboardStorage.uploadFile] Created ReferenceImage:`, {
          id: newImg.id,
          name: newImg.name,
          path: newImg.path,
          sectionId: newImg.sectionId,
        });

        setImages((prev) => {
          if (prev.some((img) => (img.path === savedPath || img.id === newImg.id) && img.name === file.name)) {
            console.warn(`[useMoodboardStorage.uploadFile] Image "${file.name}" already exists in state, skipping duplicate.`);
            return prev;
          }
          const updated = [...prev, newImg];
          console.log(`[useMoodboardStorage.uploadFile] State updated: images count is now ${updated.length}`);
          try {
            const serializable = updated.map(({ id, path, name, sectionId }) => ({
              id,
              path,
              name,
              sectionId,
            }));
            localStorage.setItem(cacheKey, JSON.stringify(serializable));
            onUpdateVisualsRef.current?.(serializable);
            console.log(`[useMoodboardStorage.uploadFile] Saved ${serializable.length} lightweight item(s) to localStorage (${cacheKey})`);
          } catch (storageErr) {
            console.error(`[useMoodboardStorage.uploadFile] Failed to write cache to localStorage:`, storageErr);
          }
          return updated;
        });
        console.log(`[useMoodboardStorage.uploadFile] SUCCESS upload for "${file.name}"`);
      } catch (err) {
        console.error(`[useMoodboardStorage.uploadFile] ERROR uploading image "${file.name}":`, err);
        setErrorMessage(String(err));
      } finally {
        setUploading(false);
      }
    },
    [cacheKey, projectFilePath, projectId]
  );

  const handleDeleteImage = useCallback(async (image: ReferenceImage) => {
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
        try {
          const serializable = updated.map(({ id, path, name, sectionId }) => ({
            id,
            path,
            name,
            sectionId,
          }));
          localStorage.setItem(cacheKey, JSON.stringify(serializable));
          onUpdateVisualsRef.current?.(serializable);
        } catch {
          // ignore
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to delete image:', err);
      setErrorMessage(String(err));
    }
  }, [cacheKey, projectFilePath, projectId]);

  const handleAddSection = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newSection: MoodboardSection = {
      id: `sec-${Date.now()}`,
      name: trimmed,
    };
    setSections((prev) => [...prev, newSection]);
  }, []);

  const handleDeleteSection = useCallback(async (sectionId: string) => {
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
        } catch (err) {
          console.warn(`[useMoodboardStorage] Failed to physically delete ${img.name}:`, err);
        }
      }
    }

    // 3. Remove all images in the deleted folder from state immediately
    const remaining = images.filter((img) => (img.sectionId || 'general') !== sectionId);
    setImages(remaining);

    // 4. Update localStorage and notify project
    try {
      const serializable = remaining.map(({ id, path, name, sectionId }) => ({
        id,
        path,
        name,
        sectionId,
      }));
      localStorage.setItem(cacheKey, JSON.stringify(serializable));
      onUpdateVisualsRef.current?.(serializable);
    } catch {
      // ignore
    }
  }, [images, cacheKey, projectFilePath, projectId]);

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
