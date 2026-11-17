import { useEffect, useRef, useCallback, type UIEvent, type RefObject } from 'react';
import { SceneScrollMode } from '../types/settings';

export const SCENE_SCROLL_STORAGE_PREFIX = 'foliant_scene_scroll_';

export function getSceneScrollStorageKey(chapterId?: string): string {
  return chapterId ? `${SCENE_SCROLL_STORAGE_PREFIX}${chapterId}` : '';
}

export function getSavedSceneScroll(chapterId?: string): number | null {
  if (!chapterId || typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(getSceneScrollStorageKey(chapterId));
    if (raw !== null) {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
  } catch {
    // Non-fatal if localStorage read fails
  }
  return null;
}

export interface UseSceneScrollPersistenceOptions {
  chapterId?: string;
  sceneScrollMode?: SceneScrollMode;
}

export interface UseSceneScrollPersistenceReturn {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  handleScroll: (e: UIEvent<HTMLDivElement>) => void;
  restoreScroll: () => void;
}

export function useSceneScrollPersistence({
  chapterId,
  sceneScrollMode = 'remember',
}: UseSceneScrollPersistenceOptions): UseSceneScrollPersistenceReturn {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isRestoringRef = useRef<boolean>(false);
  const hasPendingSaveRef = useRef<boolean>(false);
  const pendingSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const activeChapterIdRef = useRef<string | undefined>(chapterId);

  // Keep activeChapterIdRef up to date
  useEffect(() => {
    activeChapterIdRef.current = chapterId;
  }, [chapterId]);

  const flushPendingSave = useCallback(() => {
    if (pendingSaveTimeoutRef.current) {
      clearTimeout(pendingSaveTimeoutRef.current);
      pendingSaveTimeoutRef.current = null;
    }
    if (!hasPendingSaveRef.current) return;
    hasPendingSaveRef.current = false;

    const targetId = activeChapterIdRef.current;
    if (!targetId || typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const key = getSceneScrollStorageKey(targetId);
      localStorage.setItem(key, String(Math.round(lastScrollTopRef.current)));
    } catch {
      // Non-fatal if localStorage write fails
    }
  }, []);

  const restoreScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !chapterId) return;

    isRestoringRef.current = true;

    if (sceneScrollMode === 'bottom') {
      const targetScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      container.scrollTop = targetScroll;
      lastScrollTopRef.current = targetScroll;
    } else {
      const saved = getSavedSceneScroll(chapterId);
      const targetScroll = typeof saved === 'number' ? saved : 0;
      container.scrollTop = targetScroll;
      lastScrollTopRef.current = targetScroll;
    }

    // Schedule clearing of the restoring flag so immediate scroll events fired by setting scrollTop don't overwrite
    const timer = setTimeout(() => {
      isRestoringRef.current = false;
    }, 50);

    return () => clearTimeout(timer);
  }, [chapterId, sceneScrollMode]);

  // Restore scroll position whenever chapterId or sceneScrollMode changes
  useEffect(() => {
    if (!chapterId) return;

    // Flush any pending save for previous chapter
    flushPendingSave();

    // Reset last known scroll position to current saved or 0
    if (sceneScrollMode === 'remember') {
      lastScrollTopRef.current = getSavedSceneScroll(chapterId) ?? 0;
    }

    const cleanupRestore = restoreScroll();

    // Use requestAnimationFrame to ensure DOM has computed layout
    const rafId = requestAnimationFrame(() => {
      restoreScroll();
    });

    return () => {
      cancelAnimationFrame(rafId);
      cleanupRestore?.();
      flushPendingSave();
    };
  }, [chapterId, sceneScrollMode, restoreScroll, flushPendingSave]);

  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      if (isRestoringRef.current) return;
      const targetId = activeChapterIdRef.current;
      if (!targetId) return;

      const scrollTop = e.currentTarget.scrollTop;
      lastScrollTopRef.current = scrollTop;
      hasPendingSaveRef.current = true;

      if (pendingSaveTimeoutRef.current) {
        clearTimeout(pendingSaveTimeoutRef.current);
      }

      pendingSaveTimeoutRef.current = setTimeout(() => {
        hasPendingSaveRef.current = false;
        pendingSaveTimeoutRef.current = null;
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
        try {
          const key = getSceneScrollStorageKey(targetId);
          localStorage.setItem(key, String(Math.round(scrollTop)));
        } catch {
          // Non-fatal if localStorage write fails
        }
      }, 100);
    },
    []
  );

  return {
    scrollContainerRef,
    handleScroll,
    restoreScroll,
  };
}
