import React, { memo, lazy, Suspense } from 'react';
import { FoliantProject } from '../../types/project';
import { AppSettings } from '../../types/settings';
import { ImportModalData } from '../common/ImportResultModal';
import { ExportResultModalData } from '../../hooks/useEpubExport';
import { useTranslation } from '../../i18n/translations';
import ErrorBoundary from '../common/ErrorBoundary';

const ExportSettingsModal = lazy(() => import('../export/ExportSettingsModal'));
const ExportResultModal = lazy(() => import('../export/ExportResultModal'));
const SettingsModal = lazy(() => import('../settings/SettingsModal'));
const UnsavedChangesModal = lazy(() => import('../common/UnsavedChangesModal'));
const ImportResultModal = lazy(() => import('../common/ImportResultModal'));
const HelpGuideModal = lazy(() => import('../help/HelpGuideModal'));
const GuidedTour = lazy(() => import('../help/GuidedTour'));
import { FileText, BookOpen } from 'lucide-react';
import FirstRunPromptModal from '../common/FirstRunPromptModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

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

  // Unsaved Close
  isCloseConfirmOpen?: boolean;
  onCancelCloseConfirm?: () => void;
  onConfirmClose?: () => void;

  // Import Result
  importModalData: ImportModalData;
  onCloseImportResult: () => void;

  // Help & Guide / Tour
  isHelpGuideOpen?: boolean;
  onCloseHelpGuide?: () => void;
  onStartGuidedTour?: () => void;
  isGuidedTourActive?: boolean;
  onCloseGuidedTour?: () => void;
  onSelectMainView?: (view: import('../../types/navigation').MainViewId) => void;
  activeMainView?: import('../../types/navigation').MainViewId;
  onLoadDemoProject?: () => void;
  isFirstRunPromptOpen?: boolean;
  onLoadDemoFirstRun?: () => void;
  onStartEmptyFirstRun?: () => void;
  onHighlightViewChange?: (view: import('../../types/navigation').MainViewId | null) => void;
  isNewProjectConfirmOpen?: boolean;
  onConfirmNewProject?: () => void;
  onCancelNewProject?: () => void;
  isLoadDemoConfirmOpen?: boolean;
  onConfirmLoadDemo?: () => void;
  onCancelLoadDemo?: () => void;
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
  isCloseConfirmOpen = false,
  onCancelCloseConfirm,
  onConfirmClose,
  importModalData,
  onCloseImportResult,
  isHelpGuideOpen = false,
  onCloseHelpGuide,
  onStartGuidedTour,
  isGuidedTourActive = false,
  onCloseGuidedTour,
  onSelectMainView,
  activeMainView,
  onLoadDemoProject,
  isFirstRunPromptOpen = false,
  onLoadDemoFirstRun,
  onStartEmptyFirstRun,
  onHighlightViewChange,
  isNewProjectConfirmOpen = false,
  onConfirmNewProject,
  onCancelNewProject,
  isLoadDemoConfirmOpen = false,
  onConfirmLoadDemo,
  onCancelLoadDemo,
}: AppModalsProps) {
  const { t } = useTranslation(appSettings.preferences?.language || 'en');

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

      {/* UNSAVED CHANGES CLOSE MODAL */}
      <Suspense fallback={null}>
        <UnsavedChangesModal
          isOpen={isCloseConfirmOpen}
          onCancel={onCancelCloseConfirm || (() => {})}
          onConfirm={onConfirmClose || (() => {})}
          title={t('unsavedCloseTitle', 'Cambios sin guardar')}
          message={t(
            'unsavedCloseMessage',
            'Tienes cambios en tu proyecto que aún no se han guardado. ¿Estás seguro de que deseas salir sin guardar? Las modificaciones no guardadas se perderán.'
          )}
          cancelText={t('keepEditing', 'Permanecer aquí')}
          confirmText={t('discardAndExit', 'Descartar y Salir')}
        />
      </Suspense>

      {/* IMPORT RESULT NOTIFICATION MODAL */}
      <Suspense fallback={null}>
        <ImportResultModal
          data={importModalData}
          onClose={onCloseImportResult}
        />
      </Suspense>

      {/* HELP & GUIDE MODAL */}
      <Suspense fallback={null}>
        {isHelpGuideOpen && (
          <HelpGuideModal
            isOpen={isHelpGuideOpen}
            onClose={onCloseHelpGuide || (() => {})}
            onStartTour={onStartGuidedTour || (() => {})}
            language={appSettings.preferences?.language || 'en'}
            onLoadDemoProject={onLoadDemoProject}
          />
        )}
      </Suspense>

      {/* NEW PROJECT CONFIRMATION MODAL */}
      {isNewProjectConfirmOpen && (
        <ConfirmDeleteModal
          isOpen={isNewProjectConfirmOpen}
          title={t('newProject', 'Nuevo Proyecto')}
          message={t(
            'newProjectConfirm',
            '¿Seguro que deseas iniciar un nuevo proyecto? Se borrarán todos los cambios sin guardar en el espacio de trabajo actual.'
          )}
          confirmText={t('newProject', 'Nuevo Proyecto')}
          cancelText={t('cancel', 'Cancelar')}
          onConfirm={onConfirmNewProject || (() => {})}
          onCancel={onCancelNewProject || (() => {})}
          icon={<FileText className="w-5 h-5 text-amber-400" />}
          iconBgClass="p-2.5 rounded-full bg-amber-950/70 border border-amber-800/80 text-amber-400 shrink-0"
        />
      )}

      {/* LOAD DEMO CONFIRMATION MODAL */}
      {isLoadDemoConfirmOpen && (
        <ConfirmDeleteModal
          isOpen={isLoadDemoConfirmOpen}
          title={t('confirmLoadDemoTitle', 'Load Example Project')}
          message={t(
            'confirmLoadDemoMessage',
            'Are you sure you want to load the example project? Any unsaved changes in your current project will be discarded.'
          )}
          confirmText={t('loadDemoProject', 'Load example project')}
          cancelText={t('cancel', 'Cancel')}
          onConfirm={onConfirmLoadDemo || (() => {})}
          onCancel={onCancelLoadDemo || (() => {})}
          icon={<BookOpen className="w-5 h-5 text-emerald-400" />}
          iconBgClass="p-2.5 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-emerald-400 shrink-0"
        />
      )}

      {/* FIRST RUN PROMPT MODAL */}
      {isFirstRunPromptOpen && (
          <FirstRunPromptModal
            isOpen={isFirstRunPromptOpen}
            onLoadDemo={onLoadDemoFirstRun || (() => {})}
            onStartEmpty={onStartEmptyFirstRun || (() => {})}
          />
        )}

      {/* INTERACTIVE GUIDED TOUR */}
      <Suspense fallback={null}>
        {isGuidedTourActive && (
          <GuidedTour
            isOpen={isGuidedTourActive}
            onClose={onCloseGuidedTour || (() => {})}
            language={appSettings.preferences?.language || 'en'}
            onSelectView={onSelectMainView}
            activeMainView={activeMainView}
            onLoadDemoProject={onLoadDemoProject}
            onHighlightViewChange={onHighlightViewChange}
            isSettingsOpen={isSettingsOpen}
            chapters={project.chapters}
            characters={project.characters}
            storylines={project.storylines}
          />
        )}
      </Suspense>
    </>
  );
});

AppModals.displayName = 'AppModals';
