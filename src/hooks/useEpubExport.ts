import { useState, useCallback } from 'react';
import { FoliantProject } from '../types/project';
import {
  exportProjectToEpub,
  EpubExportOptions,
  ExportEpubSuccessResult,
} from '../utils/exportEpub';

export type ExportResultModalData =
  | ({ type: 'success' } & ExportEpubSuccessResult)
  | { type: 'error'; message: string }
  | null;

export interface UseEpubExportReturn {
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  isExportingEpub: boolean;
  exportResultData: ExportResultModalData;
  setExportResultData: (data: ExportResultModalData) => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  closeResultModal: () => void;
  executeExport: (options: EpubExportOptions) => Promise<void>;
}

/**
 * useEpubExport:
 * Encapsulates modal lifecycle, asynchronous progress, error handling,
 * and result notification for EPUB generation.
 */
export function useEpubExport(project: FoliantProject): UseEpubExportReturn {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExportingEpub, setIsExportingEpub] = useState(false);
  const [exportResultData, setExportResultData] = useState<ExportResultModalData>(null);

  const openExportModal = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  const closeExportModal = useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

  const closeResultModal = useCallback(() => {
    setExportResultData(null);
  }, []);

  const executeExport = useCallback(
    async (options: EpubExportOptions) => {
      setIsExportingEpub(true);
      try {
        const result = await exportProjectToEpub(project, options);
        if (result) {
          setIsExportModalOpen(false);
          setExportResultData({
            type: 'success',
            ...result,
          });
        }
      } catch (err: unknown) {
        console.error('[Foliant] EPUB export failed:', err);
        const msg = err instanceof Error ? err.message : String(err);
        setExportResultData({
          type: 'error',
          message: msg,
        });
      } finally {
        setIsExportingEpub(false);
      }
    },
    [project]
  );

  return {
    isExportModalOpen,
    setIsExportModalOpen,
    isExportingEpub,
    exportResultData,
    setExportResultData,
    openExportModal,
    closeExportModal,
    closeResultModal,
    executeExport,
  };
}
