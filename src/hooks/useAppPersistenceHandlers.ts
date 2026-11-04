import { useState, useCallback } from 'react';
import { isTauriApp } from '../utils/platform';
import { SaveStatus } from './useProjectPersistence';
import { importManuskriptProject } from '../utils/importManuskript';
import { ImportModalData } from '../components/common/ImportResultModal';
import { FoliantProject } from '../types/project';

export interface UseAppPersistenceHandlersOptions {
  currentFilePath: string | null;
  saveProject: () => Promise<boolean>;
  saveProjectAs: () => Promise<boolean>;
  saveSilently: () => Promise<boolean>;
  newProject: (title?: string) => void;
  loadProject: (project: FoliantProject, bundlePath: string | null) => void;
  setActiveChapterId: (id: string) => void;
  setIsDirty?: (dirty: boolean) => void;
  onSaveSuccess?: () => void;
}

export function useAppPersistenceHandlers({
  currentFilePath,
  saveProject,
  saveProjectAs,
  saveSilently,
  newProject,
  loadProject,
  setActiveChapterId,
  setIsDirty,
  onSaveSuccess,
}: UseAppPersistenceHandlersOptions) {
  const [editorSaveStatus, setEditorSaveStatus] = useState<SaveStatus>('saved');
  const [importModalData, setImportModalData] = useState<ImportModalData>(null);
  const [isNewProjectConfirmOpen, setIsNewProjectConfirmOpen] = useState(false);

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('foliant-flush-editor'));
    }
    setEditorSaveStatus('saving');
    const success = await saveProject();
    if (success) {
      setEditorSaveStatus('saved');
      setIsDirty?.(false);
      onSaveSuccess?.();
    } else {
      setEditorSaveStatus('unsaved');
    }
  }, [saveProject, setIsDirty, onSaveSuccess]);

  const handleManualSaveAs = useCallback(async () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('foliant-flush-editor'));
    }
    setEditorSaveStatus('saving');
    const success = await saveProjectAs();
    if (success) {
      setEditorSaveStatus('saved');
      setIsDirty?.(false);
      onSaveSuccess?.();
    } else {
      setEditorSaveStatus('unsaved');
    }
  }, [saveProjectAs, setIsDirty, onSaveSuccess]);

  const handleNewProject = useCallback(() => {
    setIsNewProjectConfirmOpen(true);
  }, []);

  const handleConfirmNewProject = useCallback(() => {
    newProject('Untitled Project');
    setActiveChapterId('');
    setIsDirty?.(false);
    setIsNewProjectConfirmOpen(false);
  }, [newProject, setActiveChapterId, setIsDirty]);

  const handleCancelNewProject = useCallback(() => {
    setIsNewProjectConfirmOpen(false);
  }, []);

  const handleImportManuskript = useCallback(async () => {
    if (!isTauriApp()) {
      setImportModalData({
        type: 'error',
        message:
          'La importación de proyectos Manuskript por carpetas nativas solo está disponible en la versión de escritorio de Foliant.',
      });
      return;
    }

    try {
      const result = await importManuskriptProject();
      if (!result) return;
      loadProject(result.project, result.bundlePath);
      setIsDirty?.(false);
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
    isNewProjectConfirmOpen,
    handleConfirmNewProject,
    handleCancelNewProject,
    handleImportManuskript,
  };
}
