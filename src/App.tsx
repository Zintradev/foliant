import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import {
  Feather,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  Clock,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Network,
} from 'lucide-react';
import { FoliantProject } from './types/project';
import { useProjectPersistence, SaveStatus } from './hooks/useProjectPersistence';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useEpubExport } from './hooks/useEpubExport';
import { useDockLayout } from './hooks/useDockLayout';
import { useProjectMutations } from './hooks/useProjectMutations';
import { ask } from '@tauri-apps/plugin-dialog';
import { importManuskriptProject } from './utils/importManuskript';
import { ImportModalData } from './components/common/ImportResultModal';
import { TabId } from './types/dock';
import { MainViewId } from './types/navigation';
import FoliantEditor from './components/editor/FoliantEditor';
import ContextPanel from './components/context/ContextPanel';
import MoodboardBlock from './components/context/MoodboardBlock';
import DockContainer, { TAB_META, TAB_TRANSLATION_KEYS } from './components/dock/DockContainer';
import OutlineView from './components/dock/views/OutlineView';
import StorylineView from './components/dock/views/StorylineView';
import ManuscriptStatsView from './components/dock/views/ManuscriptStatsView';
import CharactersView from './components/dock/views/CharactersView';
import WorldbuildingView from './components/dock/views/WorldbuildingView';
import SceneInspector from './components/dock/views/SceneInspector';
import Splitter from './components/common/Splitter';
import ActivityBar from './components/navigation/ActivityBar';
import SearchView from './components/dock/views/SearchView';
import { AppSettings, loadSettings } from './types/settings';
import { applyTheme } from './theme/themeEngine';
import { useTranslation, LanguageProvider } from './i18n/translations';
import { countWords } from './utils/textMetrics';
import { DEFAULT_PROJECT } from './data/mockProject';

// Lazy-loaded heavy views and modals to keep initial bundle ultra-light
const TimelineView = lazy(() => import('./components/dock/views/TimelineView'));
const RelationshipGraphView = lazy(() => import('./components/dock/views/RelationshipGraphView'));
const ExportSettingsModal = lazy(() => import('./components/export/ExportSettingsModal'));
const ExportResultModal = lazy(() => import('./components/export/ExportResultModal'));
const SettingsModal = lazy(() => import('./components/settings/SettingsModal'));
const UnsavedChangesModal = lazy(() => import('./components/common/UnsavedChangesModal'));
const ImportResultModal = lazy(() => import('./components/common/ImportResultModal'));

export default function App() {
  // ===========================================================================
  // 1. PERSISTENT DOMAIN STATE & TAURI DISK PERSISTENCE (.foliant)
  // Single Source of Truth for the novel data payload.
  // ===========================================================================
  const [project, setProject] = useState<FoliantProject>(DEFAULT_PROJECT);
  const [activeChapterId, setActiveChapterId] = useState<string>(() => {
    const firstScene = DEFAULT_PROJECT.chapters.find((c) => c.type === 'scene');
    return firstScene?.id ?? '';
  });

  const {
    currentFilePath,
    error: persistenceError,
    saveProject,
    saveProjectAs,
    saveSilently,
    openProject,
    newProject,
    loadProject,
    clearError: clearPersistenceError,
  } = useProjectPersistence({
    project,
    onProjectLoaded: (loaded) => {
      setProject(loaded);
      // Auto-select first scene or chapter if current selection doesn't exist
      if (loaded.chapters.length > 0 && !loaded.chapters.some((c) => c.id === activeChapterId)) {
        const firstScene = loaded.chapters.find((c) => c.type === 'scene') ?? loaded.chapters[0];
        setActiveChapterId(firstScene.id);
      }
    },
  });

  // ---------------------------------------------------------------------------
  // Visual Save Status (Driven by editor typing/pause, backed by disk sync)
  // ---------------------------------------------------------------------------
  const [editorSaveStatus, setEditorSaveStatus] = useState<SaveStatus>('saved');

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
        newProject('Untitled Manuscript');
        setActiveChapterId('');
      }
    } catch {
      // Fallback for non-Tauri / test environments
      if (
        typeof window !== 'undefined' &&
        window.confirm(
          'Are you sure you want to start a new project? All unsaved progress in the current workspace will be cleared.'
        )
      ) {
        newProject('Untitled Manuscript');
        setActiveChapterId('');
      }
    }
  }, [newProject]);

  // ---------------------------------------------------------------------------
  // Manuskript Project Import State & Logic
  // ---------------------------------------------------------------------------
  const [importModalData, setImportModalData] = useState<ImportModalData>(null);

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
  }, [loadProject]);

  // ---------------------------------------------------------------------------
  // EPUB Export Controller Hook
  // ---------------------------------------------------------------------------
  const {
    isExportModalOpen,
    isExportingEpub,
    exportResultData,
    openExportModal,
    closeExportModal,
    closeResultModal,
    executeExport,
  } = useEpubExport(project);

  // ===========================================================================
  // 2. VOLATILE UI STATE (Non-persisted workspace / view navigation)
  // Main view, selected chapters, panel dimensions, dock tabs, modal visibility.
  // ===========================================================================
  const [activeMainView, setActiveMainView] = useState<MainViewId>('write');
  const [activeSearchTerm, setActiveSearchTerm] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);

  // Settings & Preferences State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(loadSettings);
  const currentLanguage = appSettings.preferences?.language || 'en';
  const { t } = useTranslation(currentLanguage);

  // Lifted View Filter States (Persisted across tabs if appSettings.preferences.persistViewFilters is true)
  const [timelineFilters, setTimelineFilters] = useState<{ storyline: string; character: string }>({
    storyline: 'all',
    character: 'all',
  });

  // Dynamic Theme Engine: Injects CSS variables onto document.documentElement (:root)
  useEffect(() => {
    const themeMode = appSettings.preferences?.themeMode || 'dark';
    const customTheme = appSettings.preferences?.customTheme;
    applyTheme(themeMode, customTheme);
  }, [appSettings.preferences?.themeMode, appSettings.preferences?.customTheme]);

  // ---------------------------------------------------------------------------
  // Reactive Auto-Save Effect across panels
  // ---------------------------------------------------------------------------
  const isAutoSave = (appSettings.preferences?.saveMode || 'auto') === 'auto';
  const isInitialMountRef = useRef(true);
  const prevProjectRef = useRef(project);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevProjectRef.current = project;
      return;
    }

    if (prevProjectRef.current === project) {
      return;
    }
    prevProjectRef.current = project;

    if (!isAutoSave) return;

    // Trigger visual saving status for changes across panels
    setEditorSaveStatus('saving');

    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (currentFilePath) {
        await saveSilently();
      }
      setEditorSaveStatus('saved');
    }, 600);

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [project, isAutoSave, currentFilePath, saveSilently]);

  // ---------------------------------------------------------------------------
  // Workspace Dock Layout & Multi-Panel State Hook
  // ---------------------------------------------------------------------------
  const {
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
    isBottomOpen,
    setIsBottomOpen,
    leftWidth,
    rightWidth,
    bottomHeight,
    leftTabs,
    rightTabs,
    bottomTabs,
    activeLeftTab,
    activeRightTab,
    activeBottomTab,
    setActiveBottomTab,
    handleSelectLeftTab,
    handleSelectRightTab,
    handleDockTab,
    handleRemoveTab,
    handleOpenSearchTab,
    handleResizeLeft,
    handleResizeRight,
    handleBottomSplitterMouseDown,
  } = useDockLayout({
    isDirty,
    persistViewFilters: appSettings.preferences?.persistViewFilters,
    onPendingNavigation: (action) => setPendingNavigationAction(() => action),
    onResetFilters: () => setTimelineFilters({ storyline: 'all', character: 'all' }),
    onOpenWriteView: () => setActiveMainView('write'),
  });

  // ---------------------------------------------------------------------------
  // Studio-Wide Keyboard Shortcuts Hook
  // ---------------------------------------------------------------------------
  useGlobalShortcuts({
    onSave: handleManualSave,
    onSaveAs: handleManualSaveAs,
    onOpen: openProject,
    onSearch: handleOpenSearchTab,
  });

  // ---------------------------------------------------------------------------
  // Domain Mutations Hook (Chapters, Storylines, Characters, Lore, Notes)
  // ---------------------------------------------------------------------------
  const {
    handleContentChange,
    handleAddChapter,
    handleDeleteChapter,
    handleUpdateChapter,
    handleUpdateStorylines,
    handleUpdateCharacters,
    handleAddCharacter,
    handleUpdateRelationships,
    handleUpdateJunctions,
    handleUpdateWorldItems,
    handleUpdateContextBlocks,
  } = useProjectMutations({
    project,
    setProject,
    activeChapterId,
    setActiveChapterId,
    deleteChapterDialogTitle: t('deleteChapter'),
  });

  // ---------------------------------------------------------------------------
  // View Selection & Omnisearch Handlers
  // ---------------------------------------------------------------------------
  const handleSelectMainView = useCallback(
    (view: MainViewId) => {
      if (view === 'search') {
        handleOpenSearchTab();
        return;
      }
      if (isDirty && view !== activeMainView) {
        setPendingNavigationAction(() => () => {
          if (!appSettings.preferences?.persistViewFilters) {
            setTimelineFilters({ storyline: 'all', character: 'all' });
          }
          setActiveMainView(view);
        });
        return;
      }
      if (!appSettings.preferences?.persistViewFilters) {
        setTimelineFilters({ storyline: 'all', character: 'all' });
      }
      setActiveMainView(view);
    },
    [isDirty, activeMainView, appSettings.preferences?.persistViewFilters, handleOpenSearchTab]
  );

  const handleSelectSearchResult = useCallback(
    (sceneId: string, searchTerm: string) => {
      setActiveMainView('write');
      setActiveChapterId(sceneId);
      setActiveSearchTerm(searchTerm);
    },
    []
  );

  const activeChapter = project.chapters.find((ch) => ch.id === activeChapterId);

  // ---------------------------------------------------------------------------
  // Dock View Renderer
  // ---------------------------------------------------------------------------
  const renderDockView = useCallback(
    (tabId: TabId, isExpanded: boolean = false) => {
      switch (tabId) {
        case 'outline':
          return (
            <OutlineView
              chapters={project.chapters}
              activeChapterId={activeChapterId}
              onSelectChapter={setActiveChapterId}
              onAddChapter={handleAddChapter}
              onDeleteChapter={handleDeleteChapter}
              onUpdateChapter={handleUpdateChapter}
              isExpanded={isExpanded}
              storylines={project.storylines}
              onDirtyChange={setIsDirty}
            />
          );
        case 'storyline':
          return (
            <StorylineView
              storylines={project.storylines}
              chapters={project.chapters}
              worldItems={project.worldItems}
              onChange={handleUpdateStorylines}
              onSelectChapter={setActiveChapterId}
              colorSettings={appSettings}
              isExpanded={isExpanded}
              onDirtyChange={setIsDirty}
            />
          );
        case 'timeline':
          return (
            <Suspense
              fallback={
                <div className="flex-1 h-full w-full flex items-center justify-center text-xs text-zinc-500 font-mono">
                  Loading Timeline...
                </div>
              }
            >
              <TimelineView
                chapters={project.chapters}
                storylines={project.storylines}
                characters={project.characters}
                activeChapterId={activeChapterId}
                onSelectChapter={setActiveChapterId}
                onUpdateChapter={handleUpdateChapter}
                onUpdateStorylines={handleUpdateStorylines}
                onUpdateCharacters={handleUpdateCharacters}
                isExpanded={isExpanded}
                timelineDropMode={appSettings.preferences?.timelineDropMode}
                appSettings={appSettings}
                timelineFilters={
                  appSettings.preferences?.persistViewFilters ? timelineFilters : undefined
                }
                setTimelineFilters={
                  appSettings.preferences?.persistViewFilters ? setTimelineFilters : undefined
                }
                selectedStorylineFilter={
                  appSettings.preferences?.persistViewFilters ? timelineFilters.storyline : undefined
                }
                onStorylineFilterChange={
                  appSettings.preferences?.persistViewFilters
                    ? (id) => setTimelineFilters((f) => ({ ...f, storyline: id }))
                    : undefined
                }
                selectedCharacterFilter={
                  appSettings.preferences?.persistViewFilters ? timelineFilters.character : undefined
                }
                onCharacterFilterChange={
                  appSettings.preferences?.persistViewFilters
                    ? (id) => setTimelineFilters((f) => ({ ...f, character: id }))
                    : undefined
                }
              />
            </Suspense>
          );
        case 'relationships':
          return (
            <Suspense
              fallback={
                <div className="flex-1 h-full w-full flex items-center justify-center text-xs text-zinc-500 font-mono">
                  Loading Graph...
                </div>
              }
            >
              <RelationshipGraphView
                characters={project.characters}
                relationships={project.relationships}
                junctions={project.junctions}
                storylines={project.storylines}
                onUpdateRelationships={handleUpdateRelationships}
                onUpdateCharacters={handleUpdateCharacters}
                onUpdateJunctions={handleUpdateJunctions}
                onAddCharacter={handleAddCharacter}
                isExpanded={isExpanded}
              />
            </Suspense>
          );
        case 'inspector':
          return (
            <SceneInspector
              activeNodeId={activeChapterId}
              activeNode={activeChapter}
              chapters={project.chapters}
              characters={project.characters}
              worldItems={project.worldItems}
              storylines={project.storylines}
              onUpdateNode={handleUpdateChapter}
              onSelectChapter={setActiveChapterId}
            />
          );
        case 'stats':
          return (
            <ManuscriptStatsView
              chapters={project.chapters}
              storylines={project.storylines}
              activeChapterId={activeChapterId}
              onSelectChapter={setActiveChapterId}
              onUpdateChapter={handleUpdateChapter}
              targetWordCount={project.targetWords ?? 80000}
              onUpdateTargetWordCount={(newTarget) => {
                setProject((prev) => ({
                  ...prev,
                  lastModified: Date.now(),
                  targetWords: newTarget,
                }));
              }}
              isExpanded={isExpanded}
            />
          );
        case 'context':
          return (
            <ContextPanel
              blocks={project.contextBlocks}
              onChange={handleUpdateContextBlocks}
              onStartEditing={() => setEditorSaveStatus('saving')}
            />
          );
        case 'moodboard':
          return (
            <div className="p-3">
              <MoodboardBlock
                collapsible={false}
              />
            </div>
          );
        case 'characters':
          return (
            <CharactersView
              characters={project.characters}
              onChange={handleUpdateCharacters}
              colorSettings={appSettings}
              isExpanded={isExpanded}
              saveMode={appSettings.preferences?.saveMode || 'auto'}
              onDirtyChange={setIsDirty}
            />
          );
        case 'worldbuilding':
          return (
            <WorldbuildingView
              items={project.worldItems}
              onChange={handleUpdateWorldItems}
              isExpanded={isExpanded}
              saveMode={appSettings.preferences?.saveMode || 'auto'}
              onDirtyChange={setIsDirty}
            />
          );
        case 'search':
          return (
            <SearchView
              project={project}
              activeSceneId={activeChapterId}
              onSelectResult={handleSelectSearchResult}
              isExpanded={isExpanded}
            />
          );
        default:
          return null;
      }
    },
    [
      project,
      activeChapterId,
      activeChapter,
      handleSelectSearchResult,
      handleAddChapter,
      handleDeleteChapter,
      handleUpdateChapter,
      handleUpdateStorylines,
      handleUpdateCharacters,
      handleAddCharacter,
      handleUpdateRelationships,
      handleUpdateJunctions,
      handleUpdateWorldItems,
      handleUpdateContextBlocks,
      appSettings,
      timelineFilters,
      setTimelineFilters,
    ]
  );

  // ---------------------------------------------------------------------------
  // Editor Metrics & Stable Callback References
  // ---------------------------------------------------------------------------
  const wordCount = useMemo(
    () => countWords(activeChapter?.content),
    [activeChapter?.content]
  );

  const handleCloseLeft = useCallback(() => setLeftOpen(false), [setLeftOpen]);
  const handleCloseRight = useCallback(() => setRightOpen(false), [setRightOpen]);
  const handleToggleLeft = useCallback(() => setLeftOpen((prev) => !prev), [setLeftOpen]);
  const handleToggleRight = useCallback(() => setRightOpen((prev) => !prev), [setRightOpen]);
  const handleCloseBottom = useCallback(() => setIsBottomOpen(false), [setIsBottomOpen]);
  const handleToggleBottom = useCallback(() => setIsBottomOpen((prev) => !prev), [setIsBottomOpen]);
  const handleOpenSettings = useCallback(() => setIsSettingsOpen(true), []);
  const handleCloseSettings = useCallback(() => setIsSettingsOpen(false), []);
  const handleCloseImportResult = useCallback(() => setImportModalData(null), []);
  const noop = useCallback(() => {}, []);

  return (
    <LanguageProvider language={currentLanguage}>
      <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-200 select-none font-sans">
      {/* 0. PERMANENT ACTIVITY BAR */}
      <ActivityBar
        activeView={activeMainView}
        onSelectView={handleSelectMainView}
        language={appSettings.preferences?.language || 'en'}
        saveStatus={editorSaveStatus}
        isAutoSave={isAutoSave}
        onOpenSettings={handleOpenSettings}
        onNewProject={handleNewProject}
        onOpenProject={openProject}
        onSaveProject={handleManualSave}
        onSaveProjectAs={handleManualSaveAs}
        onImportManuskript={handleImportManuskript}
        onExportEpub={openExportModal}
        onOpenSearch={handleOpenSearchTab}
      />

      {/* 1. WRITING WORKSPACE */}
      <div
        className={`flex-1 flex min-w-0 h-full ${
          activeMainView === 'write' ? 'flex' : 'hidden'
        }`}
      >
        {/* Left Browser-Style Dockable Panel */}
        <DockContainer
          side="left"
          isOpen={leftOpen}
          onToggleOpen={handleCloseLeft}
          tabs={leftTabs}
          activeTab={activeLeftTab}
          onSelectTab={handleSelectLeftTab}
          onDockTab={handleDockTab}
          onRemoveTab={handleRemoveTab}
          renderView={renderDockView}
          width={leftWidth}
          isDirty={isDirty}
          language={currentLanguage}
          onRequestTabChange={handleSelectLeftTab}
        />

        {/* Left Resizable Splitter */}
        {leftOpen && (
          <Splitter
            onResize={handleResizeLeft}
            onReset={noop}
            label="Resize left panel"
          />
        )}

        {/* Center Canvas Area: Editor + Bottom Dock Panel */}
        <main className="flex-1 flex flex-col bg-zinc-950 min-w-0 overflow-hidden relative">
          {/* Editor Header */}
          <header className="h-9 border-b border-zinc-800 flex items-center justify-between px-3 bg-zinc-900/60 select-none shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleLeft}
                title={leftOpen ? t('collapseLeftDock') : t('expandLeftDock')}
                className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-white transition"
              >
                {leftOpen ? (
                  <PanelLeftClose className="w-3.5 h-3.5" />
                ) : (
                  <PanelLeft className="w-3.5 h-3.5" />
                )}
              </button>

              <div className="flex items-center gap-1.5 text-zinc-400">
                <Feather className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-xs font-medium text-zinc-200 truncate max-w-xs">
                  {activeChapter?.title ?? t('noChapterSelected')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span>
                {t('words')}: <strong className="text-zinc-200 font-mono">{wordCount}</strong>
              </span>
              <span>
                {t('target')}:{' '}
                <strong className="text-zinc-200 font-mono">
                  {(project.targetWords ?? 80000).toLocaleString()}
                </strong>
              </span>

              <button
                onClick={handleToggleRight}
                title={rightOpen ? t('collapseRightDock') : t('expandRightDock')}
                className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-white transition cursor-pointer"
              >
                {rightOpen ? (
                  <PanelRightClose className="w-3.5 h-3.5" />
                ) : (
                  <PanelRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </header>

          {/* Dismissible Disk Error Banner */}
          {persistenceError && (
            <div className="bg-rose-950/90 border-b border-rose-800/80 px-3 py-1.5 flex items-center justify-between text-xs text-rose-200 z-30 shrink-0">
              <span className="truncate mr-2">{t('diskError')}: {persistenceError}</span>
              <button
                onClick={clearPersistenceError}
                className="text-[10px] font-mono hover:text-white px-1.5 py-0.5 rounded-xs bg-rose-900/60 hover:bg-rose-850 transition"
              >
                {t('dismiss')}
              </button>
            </div>
          )}

          {/* Central Scrollable Editor Surface */}
          <div className="flex-1 overflow-y-auto px-8 py-10 flex justify-center min-h-0">
            <div className="w-full max-w-2xl bg-zinc-950 focus:outline-none">
              <h1 className="text-3xl font-serif font-bold text-zinc-100 mb-6 pb-2 border-b border-zinc-800">
                {activeChapter?.title ?? t('untitled')}
              </h1>
              <FoliantEditor
                chapterId={activeChapterId}
                content={activeChapter?.content ?? ''}
                onChange={handleContentChange}
                onStatusChange={handleEditorStatusChange}
                indentFirstLine={appSettings.preferences?.editorIndentFirstLine}
                fontFamily={appSettings.preferences?.editorFontFamily}
                searchTerm={activeSearchTerm}
              />
            </div>
          </div>

          {/* Bottom Dock Panel Resizer Splitter */}
          {isBottomOpen && (
            <div
              onMouseDown={handleBottomSplitterMouseDown}
              className="h-1 bg-zinc-800 hover:bg-zinc-600 transition-colors cursor-row-resize shrink-0 z-20 flex items-center justify-center group"
              title="Drag to resize bottom panel"
            >
              <div className="w-8 h-0.5 rounded-full bg-zinc-600 group-hover:bg-zinc-400 transition" />
            </div>
          )}

          {/* Collapsible & Resizable Bottom Dock Panel */}
          {isBottomOpen && (
            <div
              style={{ height: `${bottomHeight}px` }}
              className="bg-zinc-950 border-t border-zinc-800 flex flex-col shrink-0 min-h-[140px] max-h-[70vh] relative z-10"
            >
              {/* Bottom Panel Header */}
              <div className="h-8 border-b border-zinc-800 bg-zinc-900/80 px-2.5 flex items-center justify-between select-none shrink-0">
                <div className="flex items-center gap-1">
                  {bottomTabs.map((tab) => {
                    const meta = TAB_META[tab] || { label: tab, icon: Clock };
                    const Icon = meta.icon;
                    const isActive = activeBottomTab === tab;
                    const tabLabel = TAB_TRANSLATION_KEYS[tab]
                      ? t(TAB_TRANSLATION_KEYS[tab].labelKey, meta.label)
                      : meta.label;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveBottomTab(tab)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xs transition ${
                          isActive
                            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tabLabel}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveMainView(activeBottomTab as MainViewId)}
                    title={t('openFullscreen')}
                    className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xs transition"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleCloseBottom}
                    title={t('collapsePanel')}
                    className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xs transition"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom Panel Content */}
              <div className="flex-1 overflow-hidden">
                {renderDockView(activeBottomTab, false)}
              </div>
            </div>
          )}

          {/* Discrete Bottom Control / Status Bar */}
          <footer className="h-6 bg-zinc-950 border-t border-zinc-855 px-3 flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0 select-none">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setActiveBottomTab('timeline');
                  setIsBottomOpen(true);
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs transition text-[10px] font-mono ${
                  isBottomOpen && activeBottomTab === 'timeline'
                    ? 'bg-zinc-850 text-zinc-200 border border-zinc-750'
                    : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
                title={TAB_TRANSLATION_KEYS.timeline ? t(TAB_TRANSLATION_KEYS.timeline.labelKey, 'Timeline') : 'Timeline'}
              >
                <Clock className="w-3 h-3 text-zinc-400" />
                <span className="font-sans font-medium">
                  {TAB_TRANSLATION_KEYS.timeline ? t(TAB_TRANSLATION_KEYS.timeline.labelKey, 'Timeline') : 'Timeline'}
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveBottomTab('relationships');
                  setIsBottomOpen(true);
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs transition text-[10px] font-mono ${
                  isBottomOpen && activeBottomTab === 'relationships'
                    ? 'bg-zinc-850 text-zinc-200 border border-zinc-750'
                    : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
                title={TAB_TRANSLATION_KEYS.relationships ? t(TAB_TRANSLATION_KEYS.relationships.labelKey, 'Relationships') : 'Relationships'}
              >
                <Network className="w-3 h-3 text-zinc-400" />
                <span className="font-sans font-medium">
                  {TAB_TRANSLATION_KEYS.relationships ? t(TAB_TRANSLATION_KEYS.relationships.labelKey, 'Relationships') : 'Relationships'}
                </span>
              </button>

              <button
                onClick={handleToggleBottom}
                className="p-0.5 text-zinc-500 hover:text-zinc-300 ml-0.5"
                title={isBottomOpen ? t('collapsePanel') : t('expandPanel')}
              >
                {isBottomOpen ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />}
              </button>

              <span className="text-zinc-800 ml-1">|</span>
              <span
                className="flex items-center px-1"
                title={
                  editorSaveStatus === 'saving' || editorSaveStatus === 'unsaved'
                    ? t('saving')
                    : t('saved')
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    editorSaveStatus === 'saving' || editorSaveStatus === 'unsaved'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-emerald-400'
                  }`}
                />
              </span>
              <span className="text-zinc-800 ml-1">|</span>
              <span className="text-[10px] text-zinc-500 truncate max-w-xs">
                {activeChapter?.title || t('noChapterSelected')}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[10px]">
              <span>{wordCount.toLocaleString()} {t('words').toLowerCase()}</span>
              <span>{t('target')}: {(project.targetWords ?? 80000).toLocaleString()}</span>
            </div>
          </footer>
        </main>

        {/* Right Resizable Splitter */}
        {rightOpen && (
          <Splitter
            onResize={handleResizeRight}
            onReset={noop}
            label="Resize right panel"
          />
        )}

        {/* Right Browser-Style Dockable Panel */}
        <DockContainer
          side="right"
          isOpen={rightOpen}
          onToggleOpen={handleCloseRight}
          tabs={rightTabs}
          activeTab={activeRightTab}
          onSelectTab={handleSelectRightTab}
          onDockTab={handleDockTab}
          onRemoveTab={handleRemoveTab}
          renderView={renderDockView}
          width={rightWidth}
          isDirty={isDirty}
          language={currentLanguage}
          onRequestTabChange={handleSelectRightTab}
        />
      </div>

      {/* 2. FULL-SURFACE MODULE VIEW
           When any module is selected from the ActivityBar, render it full-screen
           using the same dock view component, giving the user a spacious workspace. */}
      {activeMainView !== 'write' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          {renderDockView(activeMainView as import('./types/dock').TabId, true)}
        </div>
      )}

      {/* 4.5 EPUB EXPORT SETTINGS MODAL */}
      <Suspense fallback={null}>
        <ExportSettingsModal
          isOpen={isExportModalOpen}
          onClose={closeExportModal}
          project={project}
          onExport={executeExport}
          isExporting={isExportingEpub}
        />
      </Suspense>

      {/* 4.6 EPUB EXPORT RESULT NOTIFICATION MODAL */}
      <Suspense fallback={null}>
        <ExportResultModal
          data={exportResultData}
          onClose={closeResultModal}
        />
      </Suspense>

      {/* 5. STUDIO SETTINGS & COLOR CUSTOMIZATION MODAL */}
      <Suspense fallback={null}>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={handleCloseSettings}
          settings={appSettings}
          onUpdateSettings={setAppSettings}
        />
      </Suspense>

      {/* 6. UNSAVED CHANGES NAVIGATION GUARD MODAL */}
      <Suspense fallback={null}>
        <UnsavedChangesModal
          isOpen={Boolean(pendingNavigationAction)}
          onCancel={() => setPendingNavigationAction(null)}
          onConfirm={() => {
            const action = pendingNavigationAction;
            setPendingNavigationAction(null);
            setIsDirty(false);
            action?.();
          }}
        />
      </Suspense>

      {/* 7. IMPORT RESULT NOTIFICATION MODAL */}
      <Suspense fallback={null}>
        <ImportResultModal
          data={importModalData}
          onClose={handleCloseImportResult}
        />
      </Suspense>
    </div>
    </LanguageProvider>
  );
}
