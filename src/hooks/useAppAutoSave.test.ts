import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppAutoSave } from './useAppAutoSave';
import { createEmptyProject, FoliantProject } from '../types/project';

describe('useAppAutoSave', () => {
  let project: FoliantProject;
  const saveSilently = vi.fn().mockResolvedValue(true);
  const setEditorSaveStatus = vi.fn();
  const setIsDirty = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    project = createEmptyProject('proj-1', 'Initial Project');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers auto-save after the interval and clears isDirty', async () => {
    const { rerender } = renderHook(
      ({ proj }) =>
        useAppAutoSave({
          project: proj,
          isAutoSave: true,
          autoSaveInterval: 1, // 1 second
          currentFilePath: 'C:\\test.foliant',
          saveSilently,
          setEditorSaveStatus,
          setIsDirty,
        }),
      { initialProps: { proj: project } }
    );

    // Initial render does not trigger auto-save
    expect(saveSilently).not.toHaveBeenCalled();

    // Mutate project at t=0
    const mutated = { ...project, title: 'Updated Title', lastModified: Date.now() };
    rerender({ proj: mutated });

    expect(setEditorSaveStatus).toHaveBeenCalledWith('unsaved');
    expect(saveSilently).not.toHaveBeenCalled();

    // Advance timer past interval (1000ms) and idle threshold (1000ms)
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    expect(setEditorSaveStatus).toHaveBeenCalledWith('saving');
    expect(saveSilently).toHaveBeenCalledTimes(1);
    expect(setEditorSaveStatus).toHaveBeenCalledWith('saved');
    expect(setIsDirty).toHaveBeenCalledWith(false);
  });

  it('resets timer when resetAutoSaveTimer is called, preventing redundant auto-saves', async () => {
    const { result, rerender } = renderHook(
      ({ proj }) =>
        useAppAutoSave({
          project: proj,
          isAutoSave: true,
          autoSaveInterval: 1,
          currentFilePath: 'C:\\test.foliant',
          saveSilently,
          setEditorSaveStatus,
          setIsDirty,
        }),
      { initialProps: { proj: project } }
    );

    const mutated = { ...project, title: 'Updated Title', lastModified: Date.now() };
    rerender({ proj: mutated });

    // Call resetAutoSaveTimer as would happen on manual save
    act(() => {
      result.current.resetAutoSaveTimer();
    });

    // Advance timers
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // saveSilently should NOT have been called because timer was reset
    expect(saveSilently).not.toHaveBeenCalled();
  });

  it('keeps status as saved and cancels auto-save when manual save completes even if isAutoSave is active', async () => {
    let lastSavedAt: number | null = 1000;
    project = { ...project, lastModified: 1000 };

    const { rerender } = renderHook(
      ({ proj, savedAt }) =>
        useAppAutoSave({
          project: proj,
          isAutoSave: true,
          autoSaveInterval: 1,
          currentFilePath: 'C:\\test.foliant',
          saveSilently,
          setEditorSaveStatus,
          setIsDirty,
          lastSavedAt: savedAt,
        }),
      { initialProps: { proj: project, savedAt: lastSavedAt } }
    );

    // 1. User edits project (lastModified increases)
    const dirtyProject = { ...project, title: 'Unsaved Edit', lastModified: 2000 };
    rerender({ proj: dirtyProject, savedAt: lastSavedAt });
    expect(setEditorSaveStatus).toHaveBeenCalledWith('unsaved');

    // 2. User manually saves project (manual save writes to disk at timestamp 3000)
    const savedTimestamp = 3000;
    const cleanSavedProject = { ...dirtyProject, lastModified: savedTimestamp };
    lastSavedAt = savedTimestamp;

    // React re-renders with fresh saved project and updated lastSavedAt
    rerender({ proj: cleanSavedProject, savedAt: lastSavedAt });

    // Status MUST be 'saved' (green indicator) and isDirty must be false
    expect(setEditorSaveStatus).toHaveBeenLastCalledWith('saved');
    expect(setIsDirty).toHaveBeenCalledWith(false);

    // 3. Fast-forward past autoSaveInterval to verify no auto-save overrides 'saved'
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(saveSilently).not.toHaveBeenCalled();
    expect(setEditorSaveStatus).toHaveBeenLastCalledWith('saved');
  });

  it('maintains a fixed interval and does not reset countdown on consecutive keystrokes, waiting for idle pause if typing continues past interval', async () => {
    const { rerender } = renderHook(
      ({ proj }) =>
        useAppAutoSave({
          project: proj,
          isAutoSave: true,
          autoSaveInterval: 2, // 2 seconds
          idlePauseMs: 500, // 500ms pause threshold
          currentFilePath: 'C:\\test.foliant',
          saveSilently,
          setEditorSaveStatus,
          setIsDirty,
        }),
      { initialProps: { proj: project } }
    );

    // Initial edit at t=0
    const edit1 = { ...project, title: 'Edit 1', lastModified: 100 };
    rerender({ proj: edit1 });

    // Advance 600ms (t=600ms) and type Edit 2
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    const edit2 = { ...edit1, title: 'Edit 2', lastModified: 200 };
    rerender({ proj: edit2 });

    // Advance 600ms (t=1200ms) and type Edit 3
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    const edit3 = { ...edit2, title: 'Edit 3', lastModified: 300 };
    rerender({ proj: edit3 });

    // Save should NOT have been called yet at t=1200ms (interval is 2000ms)
    expect(saveSilently).not.toHaveBeenCalled();

    // Advance 850ms (reaching t=2050ms > 2000ms interval, and > 500ms since Edit 3 at 1200ms)
    await act(async () => {
      vi.advanceTimersByTime(850);
    });

    // Save was triggered once the fixed interval elapsed and user was idle for idlePauseMs
    expect(saveSilently).toHaveBeenCalledTimes(1);
    expect(saveSilently).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Edit 3', lastModified: 300 })
    );
  });

  it('does NOT save while user is actively typing even after interval elapses, and saves as soon as user stops modifying', async () => {
    const { rerender } = renderHook(
      ({ proj }) =>
        useAppAutoSave({
          project: proj,
          isAutoSave: true,
          autoSaveInterval: 2, // 2 seconds
          idlePauseMs: 500, // 500ms pause required after last modification
          currentFilePath: 'C:\\test.foliant',
          saveSilently,
          setEditorSaveStatus,
          setIsDirty,
        }),
      { initialProps: { proj: project } }
    );

    // t = 0: Initial modification
    const edit0 = { ...project, title: 'Initial', lastModified: 10 };
    rerender({ proj: edit0 });

    // t = 1000ms: User is writing
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    const edit1 = { ...edit0, title: 'Writing 1', lastModified: 20 };
    rerender({ proj: edit1 });

    // t = 1900ms: User keeps writing right before the 2s interval mark
    await act(async () => {
      vi.advanceTimersByTime(900);
    });
    const edit2 = { ...edit1, title: 'Writing 2', lastModified: 30 };
    rerender({ proj: edit2 });

    // t = 2100ms: The 2-second interval has elapsed! But user is actively writing
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    // Even though interval passed, save MUST NOT execute while writing
    expect(saveSilently).not.toHaveBeenCalled();

    // t = 2300ms: User makes another modification past the interval
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    const edit3 = { ...edit2, title: 'Writing 3 past interval', lastModified: 40 };
    rerender({ proj: edit3 });

    // Still not saved!
    expect(saveSilently).not.toHaveBeenCalled();

    // Now user stops modifying. Advance by 500ms (idlePauseMs)
    await act(async () => {
      vi.advanceTimersByTime(550);
    });

    // The moment the user stops modifying, auto-save performs!
    expect(saveSilently).toHaveBeenCalledTimes(1);
    expect(saveSilently).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Writing 3 past interval', lastModified: 40 })
    );
  });

  it('keeps status as unsaved and schedules next interval if user edits during active save', async () => {
    let resolveSavePromise: (value: boolean) => void = () => {};
    saveSilently.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSavePromise = resolve;
        })
    );

    const { rerender } = renderHook(
      ({ proj }) =>
        useAppAutoSave({
          project: proj,
          isAutoSave: true,
          autoSaveInterval: 1, // 1 second
          currentFilePath: 'C:\\test.foliant',
          saveSilently,
          setEditorSaveStatus,
          setIsDirty,
        }),
      { initialProps: { proj: project } }
    );

    // Initial edit at t=0
    const edit1 = { ...project, title: 'Snapshot content', lastModified: 100 };
    rerender({ proj: edit1 });

    // Fire auto-save at 1000ms
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    // Save is currently in flight
    expect(saveSilently).toHaveBeenCalledTimes(1);
    expect(setEditorSaveStatus).toHaveBeenCalledWith('saving');

    // While save is in flight, user types new content
    const editWhileSaving = { ...edit1, title: 'Typed while saving', lastModified: 500 };
    rerender({ proj: editWhileSaving });

    // Disk write completes with the earlier snapshot
    await act(async () => {
      resolveSavePromise(true);
    });

    // Status MUST remain 'unsaved' because changes occurred during save
    expect(setEditorSaveStatus).toHaveBeenLastCalledWith('unsaved');
    expect(setIsDirty).toHaveBeenLastCalledWith(true);
  });

  it('captures flushed editor content inside the save snapshot without waiting for React re-render', async () => {
    project = {
      ...project,
      chapters: [{ id: 'ch-1', title: 'Chapter 1', content: 'Old content', type: 'scene' as const }],
    };

    window.addEventListener('foliant-flush-editor', (e: Event) => {
      const customEv = e as CustomEvent<{ chapterId?: string; content?: string }>;
      if (customEv.detail) {
        customEv.detail.chapterId = 'ch-1';
        customEv.detail.content = '<p>Fresh flushed editor content</p>';
      }
    });

    renderHook(
      ({ proj }) =>
        useAppAutoSave({
          project: proj,
          isAutoSave: true,
          autoSaveInterval: 1,
          idlePauseMs: 200,
          currentFilePath: 'C:\\test.foliant',
          saveSilently,
          setEditorSaveStatus,
          setIsDirty,
        }),
      { initialProps: { proj: project } }
    );

    // Simulate keydown event on window to mark unsaved
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

    // Advance timers past 1s interval + 200ms idle
    await act(async () => {
      vi.advanceTimersByTime(1300);
    });

    expect(saveSilently).toHaveBeenCalledTimes(1);
    expect(saveSilently).toHaveBeenCalledWith(
      expect.objectContaining({
        chapters: [
          expect.objectContaining({
            id: 'ch-1',
            content: '<p>Fresh flushed editor content</p>',
          }),
        ],
      })
    );
  });
});
