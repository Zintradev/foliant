import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useProjectPersistence,
  extractFileName,
  LAST_FOLIANT_PROJECT_KEY,
} from './useProjectPersistence';
import { FoliantProject, createEmptyProject } from '../types/project';
import { open, save } from '@tauri-apps/plugin-dialog';
import { exists } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  exists: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('useProjectPersistence (Single .foliant Bundle Architecture)', () => {
  let mockProject: FoliantProject;
  let onProjectLoaded: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exists).mockResolvedValue(true);
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = { invoke: vi.fn() };
    mockProject = {
      ...createEmptyProject('proj-1', 'The Cipher Mystery'),
      lastModified: 1000,
      chapters: [
        {
          id: 'scene-1',
          title: 'Opening Scene',
          content: '# Chapter 1\nIt was a dark and stormy night.',
          type: 'scene',
        },
        {
          id: 'folder-1',
          title: 'Act I',
          content: '',
          type: 'folder',
        },
      ],
    };
    onProjectLoaded = vi.fn();
  });

  it('extracts .foliant file name correctly across Windows and POSIX paths', () => {
    expect(extractFileName('C:\\Novels\\mystery.foliant')).toBe('mystery.foliant');
    expect(extractFileName('C:\\Novels\\mystery.foliant\\')).toBe('mystery.foliant');
    expect(extractFileName('/home/user/books/draft.foliant')).toBe('draft.foliant');
    expect(extractFileName(null)).toBeNull();
  });

  it('initializes with null path and unsaved status for new projects', () => {
    const { result } = renderHook(() =>
      useProjectPersistence({
        project: mockProject,
        onProjectLoaded,
      })
    );

    expect(result.current.currentFilePath).toBeNull();
    expect(result.current.fileName).toBeNull();
    expect(result.current.saveStatus).toBe('unsaved');
    expect(result.current.syncStatus).toBe('unsaved');
    expect(result.current.error).toBeNull();
  });

  it('performs saveProjectAs successfully prompting for .foliant file and calling save_project_bundle', async () => {
    vi.mocked(save).mockResolvedValue('C:\\Novels\\cipher.foliant');
    vi.mocked(invoke).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useProjectPersistence({
        project: mockProject,
        onProjectLoaded,
      })
    );

    let success = false;
    await act(async () => {
      success = await result.current.saveProjectAs();
    });

    expect(success).toBe(true);
    expect(save).toHaveBeenCalledWith({
      title: 'Save Foliant Project As',
      defaultPath: 'The Cipher Mystery.foliant',
      filters: [{ name: 'Foliant Project', extensions: ['foliant'] }],
    });

    // Verify backend Tauri save_project_bundle invoked with file path and project
    // Note: Project title is synchronized with the chosen filename ('cipher.foliant' -> 'cipher')
    expect(invoke).toHaveBeenCalledWith('save_project_bundle', {
      filePath: 'C:\\Novels\\cipher.foliant',
      project: expect.objectContaining({
        title: 'cipher',
      }),
    });

    expect(result.current.currentFilePath).toBe('C:\\Novels\\cipher.foliant');
    expect(result.current.fileName).toBe('cipher.foliant');
    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.syncStatus).toBe('saved');
    expect(onProjectLoaded).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'cipher',
        chapters: expect.arrayContaining([
          expect.objectContaining({
            id: 'scene-1',
            content: '# Chapter 1\nIt was a dark and stormy night.',
          }),
        ]),
      })
    );
  });

  it('handles user cancellation in saveProjectAs silently without error', async () => {
    vi.mocked(save).mockResolvedValue(null);

    const { result } = renderHook(() =>
      useProjectPersistence({
        project: mockProject,
        onProjectLoaded,
      })
    );

    let success = true;
    await act(async () => {
      success = await result.current.saveProjectAs();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.currentFilePath).toBeNull();
    expect(result.current.syncStatus).toBe('unsaved');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('delegates saveProject to direct bundle write when currentFilePath is already known', async () => {
    vi.mocked(save).mockResolvedValue('C:\\Novels\\cipher.foliant');
    vi.mocked(invoke).mockResolvedValue(undefined);

    let activeProject = { ...mockProject };
    const { result, rerender } = renderHook(
      (props: { project: FoliantProject }) =>
        useProjectPersistence({
          project: props.project,
          onProjectLoaded: (loaded) => {
            activeProject = loaded;
          },
        }),
      { initialProps: { project: mockProject } }
    );

    await act(async () => {
      await result.current.saveProjectAs();
    });

    // Update active project with loaded state (title is synchronized to 'cipher')
    rerender({ project: activeProject });

    vi.clearAllMocks();

    let saveSuccess = false;
    await act(async () => {
      saveSuccess = await result.current.saveProject();
    });

    expect(saveSuccess).toBe(true);
    expect(save).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(invoke).toHaveBeenCalledWith('save_project_bundle', {
      filePath: 'C:\\Novels\\cipher.foliant',
      project: expect.objectContaining({
        title: 'cipher',
      }),
    });
    expect(localStorage.getItem(LAST_FOLIANT_PROJECT_KEY)).toBe('C:\\Novels\\cipher.foliant');
  });

  it('prompts saveProjectAs with updated title when project.title changes after initial save', async () => {
    vi.mocked(save).mockResolvedValue('C:\\Novels\\cipher.foliant');
    vi.mocked(invoke).mockResolvedValue(undefined);

    let activeProject = { ...mockProject, title: 'cipher' };
    const { result, rerender } = renderHook(
      (props: { project: FoliantProject }) =>
        useProjectPersistence({
          project: props.project,
          onProjectLoaded: (loaded) => {
            activeProject = loaded;
          },
        }),
      { initialProps: { project: activeProject } }
    );

    await act(async () => {
      await result.current.saveProjectAs();
    });

    vi.clearAllMocks();

    // User modifies title in novel details section
    activeProject = { ...activeProject, title: 'cipher_revised' };
    rerender({ project: activeProject });
    vi.mocked(save).mockResolvedValue('C:\\Novels\\cipher_revised.foliant');

    let saveSuccess = false;
    await act(async () => {
      saveSuccess = await result.current.saveProject();
    });

    expect(saveSuccess).toBe(true);
    // save dialog is invoked proposing the new title as defaultPath
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Save Foliant Project As',
        defaultPath: 'C:\\Novels\\cipher_revised.foliant',
      })
    );
    expect(result.current.currentFilePath).toBe('C:\\Novels\\cipher_revised.foliant');
  });

  it('redirects saveProject to saveProjectAs when file was deleted externally from disk', async () => {
    vi.mocked(save).mockResolvedValue('C:\\Novels\\cipher.foliant');
    vi.mocked(invoke).mockResolvedValue(undefined);

    let activeProject = { ...mockProject };
    const { result, rerender } = renderHook(
      (props: { project: FoliantProject }) =>
        useProjectPersistence({
          project: props.project,
          onProjectLoaded: (loaded) => {
            activeProject = loaded;
          },
        }),
      { initialProps: { project: mockProject } }
    );

    // Initial save to establish currentFilePath
    await act(async () => {
      await result.current.saveProjectAs();
    });
    rerender({ project: activeProject });

    vi.clearAllMocks();

    // Simulate external deletion: file no longer exists on disk
    vi.mocked(exists).mockResolvedValue(false);
    vi.mocked(save).mockResolvedValue('C:\\Novels\\cipher_recovered.foliant');

    let saveSuccess = false;
    await act(async () => {
      saveSuccess = await result.current.saveProject();
    });

    expect(saveSuccess).toBe(true);
    // save dialog must be prompted because original file was deleted
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Save Foliant Project As',
        defaultPath: 'C:\\Novels\\cipher.foliant',
      })
    );
    expect(result.current.currentFilePath).toBe('C:\\Novels\\cipher_recovered.foliant');
    expect(localStorage.getItem(LAST_FOLIANT_PROJECT_KEY)).toBe('C:\\Novels\\cipher_recovered.foliant');
  });

  it('clears LAST_FOLIANT_PROJECT_KEY in localStorage when newProject is called', async () => {
    localStorage.setItem(LAST_FOLIANT_PROJECT_KEY, 'C:\\Novels\\previous.foliant');

    const { result } = renderHook(() =>
      useProjectPersistence({
        project: mockProject,
        onProjectLoaded,
      })
    );

    await act(async () => {
      result.current.newProject('Brand New Story');
    });

    expect(localStorage.getItem(LAST_FOLIANT_PROJECT_KEY)).toBeNull();
    expect(result.current.currentFilePath).toBeNull();
  });

  it('handles write failure gracefully and sets syncStatus to unsaved', async () => {
    vi.mocked(save).mockResolvedValue('C:\\Novels\\cipher.foliant');
    vi.mocked(invoke).mockRejectedValue(new Error('EACCES: permission denied'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useProjectPersistence({
        project: mockProject,
        onProjectLoaded,
      })
    );

    let success = true;
    await act(async () => {
      success = await result.current.saveProjectAs();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('EACCES: permission denied');
    expect(result.current.syncStatus).toBe('unsaved');
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('opens and loads a single .foliant compressed project bundle correctly', async () => {
    const loadedData: FoliantProject = {
      id: 'opened-1',
      title: 'Echoes of the Void',
      lastModified: 2000,
      targetWords: 50000,
      chapters: [
        {
          id: 'scene-101',
          title: 'Prologue',
          content: 'In the beginning, there was silence.',
          type: 'scene',
        },
      ],
      storylines: [],
      characters: [],
      relationships: [],
      junctions: [],
      worldItems: [],
      contextBlocks: [],
    };

    vi.mocked(open).mockResolvedValue('C:\\Novels\\echoes.foliant');
    vi.mocked(invoke).mockResolvedValue(loadedData);

    const { result } = renderHook(() =>
      useProjectPersistence({
        project: mockProject,
        onProjectLoaded,
      })
    );

    let openSuccess = false;
    await act(async () => {
      openSuccess = await result.current.openProject();
    });

    expect(openSuccess).toBe(true);
    expect(open).toHaveBeenCalledWith({
      title: 'Open Foliant Project',
      multiple: false,
      directory: false,
      defaultPath: undefined,
      filters: [{ name: 'Foliant Project', extensions: ['foliant'] }],
    });
    expect(invoke).toHaveBeenCalledWith('load_project_bundle', {
      filePath: 'C:\\Novels\\echoes.foliant',
    });
    expect(onProjectLoaded).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'opened-1',
        title: 'echoes',
        chapters: [
          expect.objectContaining({
            id: 'scene-101',
            content: 'In the beginning, there was silence.',
          }),
        ],
      })
    );
    expect(result.current.currentFilePath).toBe('C:\\Novels\\echoes.foliant');
    expect(result.current.fileName).toBe('echoes.foliant');
    expect(result.current.saveStatus).toBe('saved');
  });

  it('handles corrupted .foliant file error when opening', async () => {
    vi.mocked(open).mockResolvedValue('C:\\Novels\\bad.foliant');
    vi.mocked(invoke).mockRejectedValue(
      new Error("Corrupted or invalid Foliant project archive 'bad.foliant': zip error")
    );

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useProjectPersistence({
        project: mockProject,
        onProjectLoaded,
      })
    );

    let openSuccess = false;
    await act(async () => {
      openSuccess = await result.current.openProject();
    });

    expect(openSuccess).toBe(false);
    expect(result.current.error).toContain('Corrupted or invalid Foliant project archive');
    expect(onProjectLoaded).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('in web mode (no Tauri IPC), saveProject saves strictly to sessionStorage for the session', async () => {
    delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    sessionStorage.clear();

    const { result } = renderHook(() =>
      useProjectPersistence({
        project: mockProject,
        onProjectLoaded,
      })
    );

    let success = false;
    await act(async () => {
      success = await result.current.saveProject();
    });

    expect(success).toBe(true);
    expect(result.current.saveStatus).toBe('saved');
    const stored = sessionStorage.getItem('foliant_session_project');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).title).toBe('The Cipher Mystery');
  });

  it('in web mode, saveProjectAs downloads the file locally and updates sessionStorage', async () => {
    delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    sessionStorage.clear();

    const { result } = renderHook(() =>
      useProjectPersistence({
        project: mockProject,
        onProjectLoaded,
      })
    );

    let success = false;
    await act(async () => {
      success = await result.current.saveProjectAs();
    });

    expect(success).toBe(true);
    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.currentFilePath).toContain('.foliant');
    const stored = sessionStorage.getItem('foliant_session_project');
    expect(stored).not.toBeNull();
  });
});
