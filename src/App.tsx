import { useState, useCallback, useEffect, useMemo } from 'react';
import { FoliantProject } from './types/project';
import { useProjectPersistence } from './hooks/useProjectPersistence';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useEpubExport } from './hooks/useEpubExport';
import { useDockLayout } from './hooks/useDockLayout';
import { useProjectMutations } from './hooks/useProjectMutations';
import { useAppAutoSave } from './hooks/useAppAutoSave';
import { useAppPersistenceHandlers } from './hooks/useAppPersistenceHandlers';
import { useAppNavigation } from './hooks/useAppNavigation';
import { TabId } from './types/dock';
import { MainViewId } from './types/navigation';
import ActivityBar from './components/navigation/ActivityBar';
import { AppModals } from './components/layout/AppModals';
import { WritingWorkspace } from './components/layout/WritingWorkspace';
import { DockViewContent } from './components/layout/DockViewContent';
import { AppSettings, loadSettings } from './types/settings';
import { applyTheme } from './theme/themeEngine';
import { useTranslation, LanguageProvider } from './i18n/translations';
import { countWords } from './utils/textMetrics';
import { DEFAULT_PROJECT } from './data/mockProject';
import { useAppCloseGuard } from './hooks/useAppCloseGuard';
import { isTauriApp, closeDesktopApp } from './utils/platform';
import { normalizeLoadedProject } from './utils/projectBundle';

export default function App() {
  const [project, setProject] = useState<FoliantProject>(() => {
    if (!isTauriApp() && typeof sessionStorage !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('foliant_session_project');
        if (stored) {
          return normalizeLoadedProject(JSON.parse(stored));
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_PROJECT;
  });
  const [activeChapterId, setActiveChapterId] = useState<string>(() => {
    return DEFAULT_PROJECT.chapters.find((c) => c.type === 'scene')?.id ?? '';
  });

  const {
    currentFilePath, error: persistenceError, saveProject, saveProjectAs,
    saveSilently, openProject, newProject, loadProject, clearError: clearPersistenceError,
  } = useProjectPersistence({
    project,
    onProjectLoaded: (loaded) => {
      setProject(loaded);
      if (loaded.chapters.length > 0 && !loaded.chapters.some((c) => c.id === activeChapterId)) {
        const firstScene = loaded.chapters.find((c) => c.type === 'scene') ?? loaded.chapters[0];
        setActiveChapterId(firstScene.id);
      }
    },
  });

  const persistence = useAppPersistenceHandlers({
    currentFilePath, saveProject, saveProjectAs, saveSilently, newProject, loadProject, setActiveChapterId,
  });

  const epub = useEpubExport(project);
  const [activeMainView, setActiveMainView] = useState<MainViewId>('write');
  const [activeSearchTerm, setActiveSearchTerm] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpGuideOpen, setIsHelpGuideOpen] = useState(false);
  const [isGuidedTourActive, setIsGuidedTourActive] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(loadSettings);
  const currentLanguage = appSettings.preferences?.language || 'en';
  const { t } = useTranslation(currentLanguage);

  const [timelineFilters, setTimelineFilters] = useState<{ storyline: string; character: string }>({
    storyline: 'all', character: 'all',
  });

  useEffect(() => {
    applyTheme(appSettings.preferences?.themeMode || 'dark', appSettings.preferences?.customTheme);
  }, [appSettings.preferences?.themeMode, appSettings.preferences?.customTheme]);

  // Dismiss splash screen smoothly once the main application mounts
  useEffect(() => {
    const splash = document.getElementById('foliant-splash');
    if (splash) {
      splash.classList.add('splash-hidden');
      const timer = setTimeout(() => {
        splash.remove();
      }, 550);
      return () => clearTimeout(timer);
    }
  }, []);

  useAppAutoSave({
    project,
    isAutoSave: (appSettings.preferences?.saveMode || 'auto') === 'auto',
    autoSaveInterval: appSettings.preferences?.autoSaveInterval ?? 300,
    currentFilePath,
    saveSilently,
    setEditorSaveStatus: persistence.setEditorSaveStatus,
  });

  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const handleRequestCloseConfirm = useCallback(() => setIsCloseConfirmOpen(true), []);
  const handleCancelCloseConfirm = useCallback(() => setIsCloseConfirmOpen(false), []);
  const handleConfirmClose = useCallback(() => {
    setIsCloseConfirmOpen(false);
    void closeDesktopApp();
  }, []);

  useAppCloseGuard({
    hasUnsavedChanges:
      persistence.editorSaveStatus === 'unsaved' ||
      persistence.editorSaveStatus === 'saving' ||
      isDirty,
    onRequestCloseConfirm: handleRequestCloseConfirm,
    language: appSettings.preferences?.language || 'en',
  });

  const layout = useDockLayout({
    isDirty,
    persistViewFilters: appSettings.preferences?.persistViewFilters,
    onPendingNavigation: (action) => nav.setPendingNavigationAction(() => action),
    onResetFilters: () => setTimelineFilters({ storyline: 'all', character: 'all' }),
    onOpenWriteView: () => setActiveMainView('write'),
  });

  const nav = useAppNavigation({
    isDirty, setIsDirty, activeMainView, setActiveMainView,
    activeBottomTab: layout.activeBottomTab, setActiveBottomTab: layout.setActiveBottomTab,
    setIsBottomOpen: layout.setIsBottomOpen, setActiveChapterId, setActiveSearchTerm,
    persistViewFilters: Boolean(appSettings.preferences?.persistViewFilters),
    setTimelineFilters, handleOpenSearchTab: layout.handleOpenSearchTab,
  });

  const handleOpenSettings = useCallback(() => setIsSettingsOpen(true), []);
  const handleCloseSettings = useCallback(() => setIsSettingsOpen(false), []);
  const handleOpenHelpGuide = useCallback(() => setIsHelpGuideOpen(true), []);
  const handleCloseHelpGuide = useCallback(() => setIsHelpGuideOpen(false), []);
  const handleStartGuidedTour = useCallback(() => {
    setIsHelpGuideOpen(false);
    setIsGuidedTourActive(true);
  }, []);
  const handleCloseGuidedTour = useCallback(() => setIsGuidedTourActive(false), []);

  useGlobalShortcuts({
    onSave: persistence.handleManualSave,
    onSaveAs: persistence.handleManualSaveAs,
    onOpen: openProject,
    onSearch: layout.handleOpenSearchTab,
    onHelp: handleOpenHelpGuide,
  });

  const mutations = useProjectMutations({
    project, setProject, activeChapterId, setActiveChapterId,
    deleteChapterDialogTitle: t('deleteChapter'),
  });

  const activeChapter = project.chapters.find((ch) => ch.id === activeChapterId);
  const wordCount = useMemo(() => countWords(activeChapter?.content), [activeChapter?.content]);

  const handleCloseImportResult = useCallback(() => persistence.setImportModalData(null), [persistence]);

  const renderDockView = useCallback(
    (tabId: TabId, isExpanded: boolean = false) => (
      <DockViewContent
        tabId={tabId} isExpanded={isExpanded} project={project} setProject={setProject}
        activeChapterId={activeChapterId} setActiveChapterId={setActiveChapterId}
        activeChapter={activeChapter} appSettings={appSettings} timelineFilters={timelineFilters}
        setTimelineFilters={setTimelineFilters} setIsDirty={setIsDirty}
        setEditorSaveStatus={persistence.setEditorSaveStatus}
        onSelectSearchResult={nav.handleSelectSearchResult}
        handleAddChapter={mutations.handleAddChapter}
        handleDeleteChapter={mutations.handleDeleteChapter}
        handleUpdateChapter={mutations.handleUpdateChapter}
        handleUpdateStorylines={mutations.handleUpdateStorylines}
        handleUpdateCharacters={mutations.handleUpdateCharacters}
        handleAddCharacter={mutations.handleAddCharacter}
        handleUpdateRelationships={mutations.handleUpdateRelationships}
        handleUpdateJunctions={mutations.handleUpdateJunctions}
        handleUpdateCharacterPositions={mutations.handleUpdateCharacterPositions}
        handleUpdateWorldItems={mutations.handleUpdateWorldItems}
        handleUpdateContextBlocks={mutations.handleUpdateContextBlocks}
      />
    ),
    [project, activeChapterId, activeChapter, appSettings, timelineFilters, mutations, nav.handleSelectSearchResult, persistence.setEditorSaveStatus]
  );

  return (
    <LanguageProvider language={currentLanguage}>
      <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-200 select-none font-sans">
        <ActivityBar
          activeView={activeMainView}
          onSelectView={nav.handleSelectMainView}
          language={appSettings.preferences?.language || 'en'}
          saveStatus={persistence.editorSaveStatus}
          isAutoSave={(appSettings.preferences?.saveMode || 'auto') === 'auto'}
          onOpenSettings={handleOpenSettings}
          onNewProject={persistence.handleNewProject}
          onOpenProject={openProject}
          onSaveProject={persistence.handleManualSave}
          onSaveProjectAs={persistence.handleManualSaveAs}
          onImportManuskript={persistence.handleImportManuskript}
          onExportEpub={epub.openExportModal}
          onOpenSearch={layout.handleOpenSearchTab}
          onOpenHelpGuide={handleOpenHelpGuide}
        />

        <WritingWorkspace
          isVisible={activeMainView === 'write'}
          layout={layout}
          nav={nav}
          renderDockView={renderDockView}
          activeChapter={activeChapter}
          activeChapterId={activeChapterId}
          targetWords={project.targetWords ?? 80000}
          wordCount={wordCount}
          persistenceError={persistenceError}
          onClearPersistenceError={clearPersistenceError}
          onContentChange={mutations.handleContentChange}
          onEditorStatusChange={persistence.handleEditorStatusChange}
          appSettings={appSettings}
          activeSearchTerm={activeSearchTerm}
          editorSaveStatus={persistence.editorSaveStatus}
          isDirty={isDirty}
          currentLanguage={currentLanguage}
          t={t}
        />

        {activeMainView !== 'write' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
            {renderDockView(activeMainView as TabId, true)}
          </div>
        )}

        <AppModals
          isExportModalOpen={epub.isExportModalOpen}
          onCloseExportModal={epub.closeExportModal}
          project={project}
          onExecuteExport={epub.executeExport}
          isExportingEpub={epub.isExportingEpub}
          exportResultData={epub.exportResultData}
          onCloseExportResultModal={epub.closeResultModal}
          isSettingsOpen={isSettingsOpen}
          onCloseSettings={handleCloseSettings}
          appSettings={appSettings}
          onUpdateSettings={setAppSettings}
          pendingNavigationAction={nav.pendingNavigationAction}
          onCancelPendingNavigation={nav.handleCancelPendingNavigation}
          onConfirmPendingNavigation={nav.handleConfirmPendingNavigation}
          isCloseConfirmOpen={isCloseConfirmOpen}
          onCancelCloseConfirm={handleCancelCloseConfirm}
          onConfirmClose={handleConfirmClose}
          importModalData={persistence.importModalData}
          onCloseImportResult={handleCloseImportResult}
          isHelpGuideOpen={isHelpGuideOpen}
          onCloseHelpGuide={handleCloseHelpGuide}
          onStartGuidedTour={handleStartGuidedTour}
          isGuidedTourActive={isGuidedTourActive}
          onCloseGuidedTour={handleCloseGuidedTour}
          onSelectMainView={nav.handleSelectMainView}
        />
      </div>
    </LanguageProvider>
  );
}
