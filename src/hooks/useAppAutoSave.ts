import { useEffect, useRef, useCallback } from 'react';
import { FoliantProject } from '../types/project';
import { SaveStatus } from './useProjectPersistence';

export const IDLE_PAUSE_MS = 1000;

export interface UseAppAutoSaveOptions {
  project: FoliantProject;
  isAutoSave: boolean;
  autoSaveInterval?: number; // In seconds
  currentFilePath: string | null;
  saveSilently: (snapshot?: FoliantProject) => Promise<boolean>;
  setEditorSaveStatus: (status: SaveStatus) => void;
  setIsDirty?: (dirty: boolean) => void;
  lastSavedAt?: number | null;
  idlePauseMs?: number; // Optional override for idle threshold (defaults to 1000ms)
}

export interface UseAppAutoSaveReturn {
  resetAutoSaveTimer: () => void;
}

export function useAppAutoSave({
  project,
  isAutoSave,
  autoSaveInterval,
  currentFilePath,
  saveSilently,
  setEditorSaveStatus,
  setIsDirty,
  lastSavedAt,
  idlePauseMs = IDLE_PAUSE_MS,
}: UseAppAutoSaveOptions): UseAppAutoSaveReturn {
  const isInitialMountRef = useRef(true);
  const prevProjectRef = useRef(project);
  const projectRef = useRef(project);
  projectRef.current = project;

  const isDirtyRef = useRef(false);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const lastSavedAtRef = useRef(lastSavedAt);
  lastSavedAtRef.current = lastSavedAt;

  const intervalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  // Maintain fresh refs for callbacks inside async closures
  const currentFilePathRef = useRef(currentFilePath);
  currentFilePathRef.current = currentFilePath;
  const saveSilentlyRef = useRef(saveSilently);
  saveSilentlyRef.current = saveSilently;
  const setEditorSaveStatusRef = useRef(setEditorSaveStatus);
  setEditorSaveStatusRef.current = setEditorSaveStatus;
  const setIsDirtyRef = useRef(setIsDirty);
  setIsDirtyRef.current = setIsDirty;

  const scheduleIntervalTimerRef = useRef<() => void>(() => {});
  const executeSaveSnapshotRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const clearAllTimers = useCallback(() => {
    if (intervalTimerRef.current) {
      clearTimeout(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }
    if (idleWaitTimerRef.current) {
      clearTimeout(idleWaitTimerRef.current);
      idleWaitTimerRef.current = null;
    }
  }, []);

  const scheduleIntervalTimer = useCallback(() => {
    if (intervalTimerRef.current) {
      clearTimeout(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }

    if (!isAutoSave) return;

    const intervalSec = autoSaveInterval != null ? Math.max(1, autoSaveInterval) : 300;
    const intervalMs = intervalSec * 1000;

    intervalTimerRef.current = setTimeout(() => {
      // Evaluate if auto-save should execute
      const hasUnsavedChanges =
        isDirtyRef.current ||
        (lastSavedAtRef.current !== null &&
          lastSavedAtRef.current !== undefined &&
          projectRef.current.lastModified > lastSavedAtRef.current);

      if (!hasUnsavedChanges) {
        // No modifications pending; continue the fixed interval loop
        scheduleIntervalTimerRef.current();
        return;
      }

      // Interval elapsed and changes are pending.
      // If currently modifying, wait until idlePauseMs (1 second) of inactivity has elapsed.
      const checkAndSaveWhenIdle = () => {
        const timeSinceLastEdit = Date.now() - lastActivityTimeRef.current;
        if (timeSinceLastEdit < idlePauseMs) {
          const remaining = Math.max(50, idlePauseMs - timeSinceLastEdit);
          idleWaitTimerRef.current = setTimeout(checkAndSaveWhenIdle, remaining);
        } else {
          void executeSaveSnapshotRef.current();
        }
      };

      checkAndSaveWhenIdle();
    }, intervalMs);
  }, [isAutoSave, autoSaveInterval, idlePauseMs]);

  useEffect(() => {
    scheduleIntervalTimerRef.current = scheduleIntervalTimer;
  }, [scheduleIntervalTimer]);

  const executeSaveSnapshot = useCallback(async () => {
    if (idleWaitTimerRef.current) {
      clearTimeout(idleWaitTimerRef.current);
      idleWaitTimerRef.current = null;
    }

    if (isSavingRef.current) {
      scheduleIntervalTimer();
      return;
    }

    const path = currentFilePathRef.current;
    if (!path) {
      // Unnamed project without destination path; keep status unsaved so close guard warns user
      setEditorSaveStatusRef.current('unsaved');
      scheduleIntervalTimer();
      return;
    }

    // 1. Flush active editor synchronously and capture the fresh content
    const flushDetail: { chapterId?: string; content?: string } = {};
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('foliant-flush-editor', { detail: flushDetail }));
    }

    // 2. Capture a deep-cloned snapshot incorporating flushed editor content
    let snapshot: FoliantProject = JSON.parse(JSON.stringify(projectRef.current));
    if (flushDetail.chapterId && flushDetail.content !== undefined) {
      snapshot = {
        ...snapshot,
        lastModified: Date.now(),
        chapters: snapshot.chapters.map((ch: any) =>
          ch.id === flushDetail.chapterId ? { ...ch, content: flushDetail.content } : ch
        ),
      };
    }
    const snapshotModified = snapshot.lastModified;

    try {
      isSavingRef.current = true;
      setEditorSaveStatusRef.current('saving');
      const success = await saveSilentlyRef.current(snapshot);
      if (success) {
        // If further modifications occurred while writing to disk, maintain 'unsaved' status
        if (projectRef.current.lastModified > snapshotModified) {
          setEditorSaveStatusRef.current('unsaved');
          setIsDirtyRef.current?.(true);
          isDirtyRef.current = true;
        } else {
          setEditorSaveStatusRef.current('saved');
          setIsDirtyRef.current?.(false);
          isDirtyRef.current = false;
        }
      } else {
        setEditorSaveStatusRef.current('unsaved');
      }
    } catch {
      setEditorSaveStatusRef.current('unsaved');
    } finally {
      isSavingRef.current = false;
      // Restart the fixed interval countdown after save completes
      scheduleIntervalTimer();
    }
  }, [scheduleIntervalTimer]);

  useEffect(() => {
    executeSaveSnapshotRef.current = executeSaveSnapshot;
  }, [executeSaveSnapshot]);

  const recordActivity = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    isDirtyRef.current = true;
    setEditorSaveStatusRef.current('unsaved');
    setIsDirtyRef.current?.(true);
  }, []);

  // Global listener for active keystrokes and typing inputs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleInput = () => {
      recordActivity();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (['v', 'x', 'z', 'y', 'V', 'X', 'Z', 'Y'].includes(e.key)) {
          recordActivity();
        }
        return;
      }
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter') {
        recordActivity();
      }
    };

    window.addEventListener('input', handleInput, { capture: true, passive: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: true });

    return () => {
      window.removeEventListener('input', handleInput, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [recordActivity]);

  const resetAutoSaveTimer = useCallback(() => {
    clearAllTimers();
    isDirtyRef.current = false;
    prevProjectRef.current = projectRef.current;
    if (isAutoSave) {
      scheduleIntervalTimer();
    }
  }, [clearAllTimers, isAutoSave, scheduleIntervalTimer]);

  // Start the fixed interval timer on mount or when autoSave settings change
  useEffect(() => {
    if (!isAutoSave) {
      clearAllTimers();
      return;
    }
    scheduleIntervalTimer();
    return () => {
      clearAllTimers();
    };
  }, [isAutoSave, autoSaveInterval, scheduleIntervalTimer, clearAllTimers]);

  // Synchronize state with project updates
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevProjectRef.current = project;
      return;
    }

    // Clean project synced with disk
    if (lastSavedAt !== null && lastSavedAt !== undefined && project.lastModified <= lastSavedAt) {
      setEditorSaveStatus('saved');
      setIsDirty?.(false);
      isDirtyRef.current = false;
      prevProjectRef.current = project;
      return;
    }

    if (prevProjectRef.current === project) {
      return;
    }
    prevProjectRef.current = project;
    recordActivity();
  }, [project, lastSavedAt, setEditorSaveStatus, setIsDirty, recordActivity]);

  return { resetAutoSaveTimer };
}
