import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppPersistenceHandlers } from './useAppPersistenceHandlers';

describe('useAppPersistenceHandlers', () => {
  const saveProject = vi.fn();
  const saveProjectAs = vi.fn();
  const saveSilently = vi.fn();
  const newProject = vi.fn();
  const loadProject = vi.fn();
  const setActiveChapterId = vi.fn();
  const setIsDirty = vi.fn();
  const onSaveSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handleManualSave resets isDirty to false and triggers onSaveSuccess callback upon success', async () => {
    saveProject.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useAppPersistenceHandlers({
        currentFilePath: 'C:\\novel.foliant',
        saveProject,
        saveProjectAs,
        saveSilently,
        newProject,
        loadProject,
        setActiveChapterId,
        setIsDirty,
        onSaveSuccess,
      })
    );

    await act(async () => {
      await result.current.handleManualSave();
    });

    expect(result.current.editorSaveStatus).toBe('saved');
    expect(setIsDirty).toHaveBeenCalledWith(false);
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
  });

  it('handleManualSaveAs resets isDirty to false and triggers onSaveSuccess upon success', async () => {
    saveProjectAs.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useAppPersistenceHandlers({
        currentFilePath: null,
        saveProject,
        saveProjectAs,
        saveSilently,
        newProject,
        loadProject,
        setActiveChapterId,
        setIsDirty,
        onSaveSuccess,
      })
    );

    await act(async () => {
      await result.current.handleManualSaveAs();
    });

    expect(result.current.editorSaveStatus).toBe('saved');
    expect(setIsDirty).toHaveBeenCalledWith(false);
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
  });

  it('handleManualSave sets status to unsaved when save fails', async () => {
    saveProject.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useAppPersistenceHandlers({
        currentFilePath: 'C:\\novel.foliant',
        saveProject,
        saveProjectAs,
        saveSilently,
        newProject,
        loadProject,
        setActiveChapterId,
        setIsDirty,
        onSaveSuccess,
      })
    );

    await act(async () => {
      await result.current.handleManualSave();
    });

    expect(result.current.editorSaveStatus).toBe('unsaved');
    expect(setIsDirty).not.toHaveBeenCalled();
    expect(onSaveSuccess).not.toHaveBeenCalled();
  });
});

