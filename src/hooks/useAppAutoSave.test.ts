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

    // Mutate project
    const mutated = { ...project, title: 'Updated Title', lastModified: Date.now() };
    rerender({ proj: mutated });

    expect(setEditorSaveStatus).toHaveBeenCalledWith('unsaved');
    expect(saveSilently).not.toHaveBeenCalled();

    // Advance timer past interval (1000ms)
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
});

