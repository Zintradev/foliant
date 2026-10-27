import React, { memo, lazy, Suspense } from 'react';
import { FoliantProject } from '../../types/project';
import { AppSettings } from '../../types/settings';
import { ImportModalData } from '../common/ImportResultModal';
import { ExportResultModalData } from '../../hooks/useEpubExport';
import ErrorBoundary from '../common/ErrorBoundary';

const ExportSettingsModal = lazy(() => import('../export/ExportSettingsModal'));
const ExportResultModal = lazy(() => import('../export/ExportResultModal'));
const SettingsModal = lazy(() => import('../settings/SettingsModal'));
const UnsavedChangesModal = lazy(() => import('../common/UnsavedChangesModal'));
const ImportResultModal = lazy(() => import('../common/ImportResultModal'));

export interface AppModalsProps {
  // Export Settings
  isExportModalOpen: boolean;
  onCloseExportModal: () => void;
  project: FoliantProject;
  onExecuteExport: (opts: Parameters<ReturnType<typeof import('../../hooks/useEpubExport')['useEpubExport']>['executeExport']>[0]) => Promise<void>;
  isExportingEpub: boolean;

  // Export Result
  exportResultData: ExportResultModalData;
  onCloseExportResultModal: () => void;

  // App Settings
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  appSettings: AppSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<AppSettings>>;

  // Unsaved Navigation
  pendingNavigationAction: (() => void) | null;
  onCancelPendingNavigation: () => void;
  onConfirmPendingNavigation: () => void;

  // Import Result
  importModalData: ImportModalData;
  onCloseImportResult: () => void;
}

export const AppModals = memo(function AppModals({
  isExportModalOpen,
  onCloseExportModal,
  project,
  onExecuteExport,
  isExportingEpub,
  exportResultData,
  onCloseExportResultModal,
  isSettingsOpen,
  onCloseSettings,
  appSettings,
  onUpdateSettings,
  pendingNavigationAction,
  onCancelPendingNavigation,
  onConfirmPendingNavigation,
  importModalData,
  onCloseImportResult,
}: AppModalsProps) {
  return (
    <>
      {/* EPUB EXPORT SETTINGS MODAL */}
      <Suspense fallback={null}>
        <ExportSettingsModal
          isOpen={isExportModalOpen}
          onClose={onCloseExportModal}
          project={project}
          onExport={onExecuteExport}
          isExporting={isExportingEpub}
        />
      </Suspense>

      {/* EPUB EXPORT RESULT NOTIFICATION MODAL */}
      <Suspense fallback={null}>
        <ExportResultModal
          data={exportResultData}
          onClose={onCloseExportResultModal}
        />
      </Suspense>

      {/* STUDIO SETTINGS & COLOR CUSTOMIZATION MODAL */}
      <ErrorBoundary fallbackTitle="Settings Error" onReset={onCloseSettings}>
        <Suspense fallback={null}>
          {isSettingsOpen && (
            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={onCloseSettings}
              settings={appSettings}
              onUpdateSettings={onUpdateSettings}
            />
          )}
        </Suspense>
      </ErrorBoundary>

      {/* UNSAVED CHANGES NAVIGATION GUARD MODAL */}
      <Suspense fallback={null}>
        <UnsavedChangesModal
          isOpen={Boolean(pendingNavigationAction)}
          onCancel={onCancelPendingNavigation}
          onConfirm={onConfirmPendingNavigation}
        />
      </Suspense>

      {/* IMPORT RESULT NOTIFICATION MODAL */}
      <Suspense fallback={null}>
        <ImportResultModal
          data={importModalData}
          onClose={onCloseImportResult}
        />
      </Suspense>
    </>
  );
});

AppModals.displayName = 'AppModals';
