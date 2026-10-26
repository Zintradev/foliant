import { useState, useCallback } from 'react';
import { ask } from '@tauri-apps/plugin-dialog';
import { SaveStatus } from './useProjectPersistence';
import { importManuskriptProject } from '../utils/importManuskript';
import { ImportModalData } from '../components/common/ImportResultModal';
import { FoliantProject } from '../types/project';

interface UseAppPersistenceHandlersOptions {
  currentFilePath: string | null;
  saveProject: () => Promise<boolean>;
  saveProjectAs: () => Promise<boolean>;
  saveSilently: () => Promise<boolean>;
  newProject: (title?: string) => void;
  loadProject: (project: FoliantProject, bundlePath: string | null) => void;
  setActiveChapterId: (id: string) => void;
}

export function useAppPersistenceHandlers({
  currentFilePath,
  saveProject,
  saveProjectAs,
  saveSilently,
  newProject,
  loadProject,
  setActiveChapterId,
}: UseAppPersistenceHandlersOptions) {
  const [editorSaveStatus, setEditorSaveStatus] = useState<SaveStatus>('saved');
  const [importModalData, setImportModalData] = useState<ImportModalData>(null);

  const handleEditorStatusChange = useCallback(
    (status: SaveStatus) => {
      setEditorSaveStatus(status);
      if (status === 'saved' && currentFilePath) {
        saveSilently();
      }
    },
    [currentFilePath, saveSilently]
  );

  const handleManualSave = useCallback(async () => {
    setEditorSaveStatus('saving');
    const success = await saveProject();
    if (success) {
      setEditorSaveStatus('saved');
    } else {
      setEditorSaveStatus('unsaved');
    }
  }, [saveProject]);

  const handleManualSaveAs = useCallback(async () => {
    setEditorSaveStatus('saving');
    const success = await saveProjectAs();
    if (success) {
      setEditorSaveStatus('saved');
    } else {
      setEditorSaveStatus('unsaved');
    }
  }, [saveProjectAs]);

  const handleNewProject = useCallback(async () => {
    try {
      const confirmed = await ask(
        'Are you sure you want to start a new project? All unsaved progress in the current workspace will be cleared.',
        { title: 'New Project', kind: 'warning' }
      );
      if (confirmed) {
        newProject('Untitled Project');
        setActiveChapterId('');
      }
    } catch {
      if (
        typeof window !== 'undefined' &&
        window.confirm(
          'Are you sure you want to start a new project? All unsaved progress in the current workspace will be cleared.'
        )
      ) {
        newProject('Untitled Project');
        setActiveChapterId('');
      }
    }
  }, [newProject, setActiveChapterId]);

  const handleImportManuskript = useCallback(async () => {
    try {
      const result = await importManuskriptProject();
      if (!result) return;
      loadProject(result.project, result.bundlePath);
      if (result.project.chapters.length > 0) {
        const firstScene =
          result.project.chapters.find((c) => c.type === 'scene') ?? result.project.chapters[0];
        setActiveChapterId(firstScene.id);
      }
      setImportModalData({
        type: 'success',
        title: result.project.title || 'Manuskript Project',
        sceneCount: result.project.chapters.length,
        charCount: result.project.characters.length,
        worldCount: result.project.worldItems.length,
      });
    } catch (err: unknown) {
      console.error('[Foliant] Manuskript import failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setImportModalData({
        type: 'error',
        message: msg,
      });
    }
  }, [loadProject, setActiveChapterId]);

  return {
    editorSaveStatus,
    setEditorSaveStatus,
    importModalData,
    setImportModalData,
    handleEditorStatusChange,
    handleManualSave,
    handleManualSaveAs,
    handleNewProject,
    handleImportManuskript,
  };
}
