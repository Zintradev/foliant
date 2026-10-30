import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useProjectPersistence,
  extractFileName,
} from './useProjectPersistence';
import { FoliantProject, createEmptyProject } from '../types/project';
import { open } from '@tauri-apps/plugin-dialog';
import { mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  mkdir: vi.fn(),
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
}));

describe('useProjectPersistence (Folder Bundle Architecture)', () => {
  let mockProject: FoliantProject;
  let onProjectLoaded: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('extracts folder bundle name correctly across Windows and POSIX paths', () => {
    expect(extractFileName('C:\\Novels\\mystery.foliant')).toBe('mystery.foliant');
    expect(extractFileName('C:\\Novels\\mystery.foliant\\')).toBe('mystery.foliant');
    expect(extractFileName('/home/user/books/draft.foliant/')).toBe('draft.foliant');
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

  it('performs saveProjectAs successfully creating folder bundle and scene files', async () => {
    vi.mocked(open).mockResolvedValue('C:\\Novels\\cipher.foliant');
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeTextFile).mockResolvedValue(undefined);

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
    expect(open).toHaveBeenCalledWith({
      directory: true,
      multiple: false,
      title: 'Select Foliant Project Directory',
      defaultPath: undefined,
    });

    // Verify directories created
    expect(mkdir).toHaveBeenCalledWith('C:/Novels/cipher.foliant', { recursive: true });
    expect(mkdir).toHaveBeenCalledWith('C:/Novels/cipher.foliant/scenes', { recursive: true });

    // Verify scene file written
    expect(writeTextFile).toHaveBeenCalledWith(
      'C:/Novels/cipher.foliant/scenes/scene-1.md',
      '# Chapter 1\nIt was a dark and stormy night.'
    );

    // Verify project.json written with stripped scene content
    const projectJsonCalls = vi.mocked(writeTextFile).mock.calls.filter(([path]) =>
      String(path).endsWith('project.json')
    );
    expect(projectJsonCalls).toHaveLength(1);
    const parsedWrittenMetadata = JSON.parse(projectJsonCalls[0][1] as string);
    expect(parsedWrittenMetadata.title).toBe('The Cipher Mystery');
    const writtenScene = parsedWrittenMetadata.chapters.find((c: { id: string }) => c.id === 'scene-1');
    expect(writtenScene.content).toBe('');

    expect(result.current.currentFilePath).toBe('C:\\Novels\\cipher.foliant');
    expect(result.current.fileName).toBe('cipher.foliant');
    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.syncStatus).toBe('saved');
    expect(onProjectLoaded).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'The Cipher Mystery',
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
    vi.mocked(open).mockResolvedValue(null);

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
    expect(writeTextFile).not.toHaveBeenCalled();
    expect(mkdir).not.toHaveBeenCalled();
  });

  it('delegates saveProject to direct bundle write when currentFilePath is already known', async () => {
    vi.mocked(open).mockResolvedValue('C:\\Novels\\cipher.foliant');
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeTextFile).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useProjectPersistence({
        project: mockProject,
        onProjectLoaded,
      })
    );

    await act(async () => {
      await result.current.saveProjectAs();
    });

    vi.clearAllMocks();

    let saveSuccess = false;
    await act(async () => {
      saveSuccess = await result.current.saveProject();
    });

    expect(saveSuccess).toBe(true);
    expect(open).not.toHaveBeenCalled();
    expect(writeTextFile).toHaveBeenCalledWith(
      'C:/Novels/cipher.foliant/scenes/scene-1.md',
      expect.any(String)
    );
  });

  it('handles write failure gracefully and sets syncStatus to unsaved', async () => {
    vi.mocked(open).mockResolvedValue('C:\\Novels\\cipher.foliant');
    vi.mocked(mkdir).mockRejectedValue(new Error('EACCES: permission denied'));
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

  it('opens and reassembles a modular project folder bundle correctly', async () => {
    const serializedMetadata: FoliantProject = {
      id: 'opened-1',
      title: 'Echoes of the Void',
      lastModified: 2000,
      targetWords: 50000,
      chapters: [
        {
          id: 'scene-101',
          title: 'Prologue',
          content: '',
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
    vi.mocked(readTextFile).mockImplementation(async (path: string | URL) => {
      const p = String(path);
      if (p.endsWith('project.json')) {
        return JSON.stringify(serializedMetadata);
      }
      if (p.endsWith('scene-101.md')) {
        return 'In the beginning, there was silence.';
      }
      throw new Error(`File not found: ${p}`);
    });

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
      title: 'Open Foliant Project Directory',
      multiple: false,
      directory: true,
    });
    expect(onProjectLoaded).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'opened-1',
        title: 'Echoes of the Void',
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

  it('safely tolerates missing scene files when opening, falling back to empty string', async () => {
    const serializedMetadata: FoliantProject = {
      id: 'opened-2',
      title: 'Missing Scene Novel',
      lastModified: 3000,
      chapters: [
        {
          id: 'scene-missing',
          title: 'Lost Chapter',
          content: '',
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

    vi.mocked(open).mockResolvedValue('C:\\Novels\\missing.foliant');
    vi.mocked(readTextFile).mockImplementation(async (path: string | URL) => {
      const p = String(path);
      if (p.endsWith('project.json')) {
        return JSON.stringify(serializedMetadata);
      }
      throw new Error('File not found');
    });

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

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
    expect(onProjectLoaded).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'opened-2',
        chapters: [
          expect.objectContaining({
            id: 'scene-missing',
            content: '',
          }),
        ],
      })
    );
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
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
    expect(result.current.currentFilePath).toContain('.foliant.json');
    const stored = sessionStorage.getItem('foliant_session_project');
    expect(stored).not.toBeNull();
  });
});
