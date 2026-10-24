import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { TextNode, ContextBlock, FoliantProject } from './types/project';
import { useProjectPersistence, SaveStatus } from './hooks/useProjectPersistence';
import { ask, message } from '@tauri-apps/plugin-dialog';
import { importManuskriptProject } from './utils/importManuskript';
import { exportProjectToEpub } from './utils/exportEpub';
import {
  TabId,
  CharacterItem,
  DockSide,
  StorylineItem,
  WorldItem,
  CharacterRelationship,
  GraphJunctionNode,
} from './types/dock';
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
import TimelineView from './components/dock/views/TimelineView';
import RelationshipGraphView from './components/dock/views/RelationshipGraphView';
import SceneInspector from './components/dock/views/SceneInspector';
import Splitter from './components/common/Splitter';
import ActivityBar from './components/navigation/ActivityBar';
import SettingsModal from './components/settings/SettingsModal';
import SearchView from './components/dock/views/SearchView';
import { AppSettings, loadSettings } from './types/settings';
import { applyTheme } from './theme/themeEngine';
import { useTranslation, LanguageProvider } from './i18n/translations';

import { DEFAULT_PROJECT } from './data/mockProject';

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

  const [importModalData, setImportModalData] = useState<
    | { type: 'success'; title: string; sceneCount: number; charCount: number; worldCount: number }
    | { type: 'error'; message: string }
    | null
  >(null);

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

  const handleExportEpub = useCallback(async () => {
    try {
      await exportProjectToEpub(project);
    } catch (err: unknown) {
      console.error('[Foliant] EPUB export failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      await message(`Failed to export EPUB:\n${msg}`, {
        title: 'Export Error',
        kind: 'error',
      });
    }
  }, [project]);

  // ---------------------------------------------------------------------------
  // Global Keyboard Shortcuts (Ctrl/Cmd+S, Ctrl/Cmd+Shift+S, Ctrl/Cmd+O)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (!isModifier) return;

      const key = e.key.toLowerCase();

      // Ctrl/Cmd + Shift + S: Save As
      if (e.shiftKey && key === 's') {
        e.preventDefault();
        handleManualSaveAs();
        return;
      }

      // Ctrl/Cmd + S: Save
      if (!e.shiftKey && key === 's') {
        e.preventDefault();
        handleManualSave();
        return;
      }

      // Ctrl/Cmd + Shift + F: Open Search Tab
      if (e.shiftKey && key === 'f') {
        e.preventDefault();
        handleOpenSearchTabRef.current?.();
        return;
      }

      // Ctrl/Cmd + O: Open
      if (!e.shiftKey && key === 'o') {
        e.preventDefault();
        openProject();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave, handleManualSaveAs, openProject]);

  // ===========================================================================
  // 2. VOLATILE UI STATE (Non-persisted workspace / view navigation)
  // Main view, selected chapters, panel dimensions, dock tabs, modal visibility.
  // ===========================================================================
  const [activeMainView, setActiveMainView] = useState<MainViewId>('write');
  const [activeSearchTerm, setActiveSearchTerm] = useState<string | null>(null);

  // Sidebar Visibility & Resizable Dimensions State
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState<number>(270);
  const [rightWidth, setRightWidth] = useState<number>(310);

  // Bottom Dock Panel State (Collapsible & Resizable)
  const [isBottomOpen, setIsBottomOpen] = useState<boolean>(false);
  const [bottomHeight, setBottomHeight] = useState<number>(230);
  const [bottomTabs] = useState<TabId[]>(['timeline', 'relationships']);
  const [activeBottomTab, setActiveBottomTab] = useState<TabId>('timeline');

  // Dockable Tabs State
  const [leftTabs, setLeftTabs] = useState<TabId[]>(['outline', 'search']);
  const [rightTabs, setRightTabs] = useState<TabId[]>(['inspector', 'context', 'characters']);
  const [activeLeftTab, setActiveLeftTab] = useState<TabId | null>('outline');
  const [activeRightTab, setActiveRightTab] = useState<TabId | null>('inspector');

  const handleOpenSearchTab = useCallback(() => {
    if (rightTabs.includes('search')) {
      setActiveRightTab('search');
      setRightOpen(true);
    } else {
      setLeftTabs((prev) => (prev.includes('search') ? prev : [...prev, 'search']));
      setActiveLeftTab('search');
      setLeftOpen(true);
    }
    setActiveMainView('write');
  }, [rightTabs]);

  const handleOpenSearchTabRef = useRef(handleOpenSearchTab);
  handleOpenSearchTabRef.current = handleOpenSearchTab;
  const [isDirty, setIsDirty] = useState(false);

  // Settings & Preferences State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(loadSettings);
  const currentLanguage = appSettings.preferences?.language || 'en';
  const { t } = useTranslation(currentLanguage);

  // Dynamic Theme Engine: Injects CSS variables onto document.documentElement (:root)
  useEffect(() => {
    const themeMode = appSettings.preferences?.themeMode || 'dark';
    const customTheme = appSettings.preferences?.customTheme;
    applyTheme(themeMode, customTheme);
  }, [appSettings.preferences?.themeMode, appSettings.preferences?.customTheme]);

  // Reactive Auto-Save Effect for changes across all panels (characters, world, storylines, outline, etc.)
  const isAutoSave = (appSettings.preferences?.saveMode || 'auto') === 'auto';
  const isInitialMountRef = useRef(true);
  const prevProjectRef = useRef(project);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Lifted View Filter States (Persisted across tabs if appSettings.preferences.persistViewFilters is true)
  const [timelineFilters, setTimelineFilters] = useState<{ storyline: string; character: string }>({
    storyline: 'all',
    character: 'all',
  });

  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);

  const handleSelectLeftTab = useCallback(
    (tabId: TabId) => {
      if (isDirty && tabId !== activeLeftTab) {
        setPendingNavigationAction(() => () => {
          if (!appSettings.preferences?.persistViewFilters) {
            setTimelineFilters({ storyline: 'all', character: 'all' });
          }
          setActiveLeftTab(tabId);
        });
        return;
      }
      if (!appSettings.preferences?.persistViewFilters) {
        setTimelineFilters({ storyline: 'all', character: 'all' });
      }
      setActiveLeftTab(tabId);
    },
    [isDirty, activeLeftTab, appSettings.preferences?.persistViewFilters]
  );

  const handleSelectRightTab = useCallback(
    (tabId: TabId) => {
      if (isDirty && tabId !== activeRightTab) {
        setPendingNavigationAction(() => () => {
          if (!appSettings.preferences?.persistViewFilters) {
            setTimelineFilters({ storyline: 'all', character: 'all' });
          }
          setActiveRightTab(tabId);
        });
        return;
      }
      if (!appSettings.preferences?.persistViewFilters) {
        setTimelineFilters({ storyline: 'all', character: 'all' });
      }
      setActiveRightTab(tabId);
    },
    [isDirty, activeRightTab, appSettings.preferences?.persistViewFilters]
  );

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

  // ---------------------------------------------------------------------------
  // Global Omnisearch Result Navigation Handler
  // ---------------------------------------------------------------------------
  const handleSelectSearchResult = useCallback(
    (sceneId: string, searchTerm: string) => {
      setActiveMainView('write');
      setActiveChapterId(sceneId);
      setActiveSearchTerm(searchTerm);
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Active Chapter Lookup (Derived from normalized project chapters)
  // ---------------------------------------------------------------------------
  const activeChapter = project.chapters.find((ch) => ch.id === activeChapterId);

  // ---------------------------------------------------------------------------
  // Domain Mutation Handlers (Update FoliantProject & Refresh lastModified)
  // ---------------------------------------------------------------------------
  const handleContentChange = useCallback((newContent: string, targetChapterId?: string) => {
    const chapterIdToUpdate = targetChapterId || activeChapterId;
    setProject((prev) => ({
      ...prev,
      lastModified: Date.now(),
      chapters: prev.chapters.map((ch) =>
        ch.id === chapterIdToUpdate ? { ...ch, content: newContent } : ch
      ),
    }));
  }, [activeChapterId]);

  const handleAddChapter = useCallback(
    (type: 'folder' | 'scene' = 'scene', parentId: string | null = null) => {
      const isFolder = type === 'folder';
      setProject((prev) => {
        const count = prev.chapters.filter((c) => c.type === type).length + 1;
        const newChapter: TextNode = {
          id: `${type}-${Date.now()}`,
          title: isFolder ? `Folder ${count}: New Section` : `Chapter ${count}: Untitled`,
          content: '',
          synopsis: isFolder ? 'Section overview notes...' : 'Scene outline notes...',
          type,
          parentId,
          targetWords: isFolder ? 5000 : 2500,
          status: 'In Progress',
          attachedCharacterIds: [],
        };
        if (!isFolder) {
          setActiveChapterId(newChapter.id);
        }
        return {
          ...prev,
          lastModified: Date.now(),
          chapters: [...prev.chapters, newChapter],
        };
      });
    },
    []
  );

  const handleDeleteChapter = useCallback(
    async (id: string) => {
      const chapterToDelete = project.chapters.find((c) => c.id === id);
      const chapterTitle = chapterToDelete?.title || 'this section';

      let confirmed = false;
      try {
        confirmed = await ask(
          `Are you sure you want to delete "${chapterTitle}"? This action cannot be undone.`,
          { title: t('deleteChapter'), kind: 'warning' }
        );
      } catch {
        if (typeof window !== 'undefined') {
          confirmed = window.confirm(
            `Are you sure you want to delete "${chapterTitle}"? This action cannot be undone.`
          );
        }
      }

      if (!confirmed) return;

      setProject((prev) => {
        if (prev.chapters.length <= 1) return prev;
        const getDescendantIds = (parentId: string): string[] => {
          const children = prev.chapters.filter((c) => c.parentId === parentId);
          return children.flatMap((c) => [c.id, ...getDescendantIds(c.id)]);
        };

        const idsToDelete = new Set([id, ...getDescendantIds(id)]);
        const filtered = prev.chapters.filter((c) => !idsToDelete.has(c.id));

        if (idsToDelete.has(activeChapterId)) {
          const nextActive = filtered.find((c) => c.type === 'scene') ?? filtered[0];
          setActiveChapterId(nextActive?.id ?? '');
        }
        return {
          ...prev,
          lastModified: Date.now(),
          chapters: filtered,
        };
      });
    },
    [activeChapterId, project.chapters]
  );

  const handleUpdateChapter = useCallback((id: string, updates: Partial<TextNode>) => {
    setProject((prev) => ({
      ...prev,
      lastModified: Date.now(),
      chapters: prev.chapters.map((ch) => (ch.id === id ? { ...ch, ...updates } : ch)),
    }));
  }, []);

  const handleUpdateStorylines = useCallback(
    (storylinesOrUpdater: StorylineItem[] | ((prev: StorylineItem[]) => StorylineItem[])) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        storylines:
          typeof storylinesOrUpdater === 'function'
            ? storylinesOrUpdater(prev.storylines)
            : storylinesOrUpdater,
      }));
    },
    []
  );

  const handleUpdateCharacters = useCallback(
    (charactersOrUpdater: CharacterItem[] | ((prev: CharacterItem[]) => CharacterItem[])) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        characters:
          typeof charactersOrUpdater === 'function'
            ? charactersOrUpdater(prev.characters)
            : charactersOrUpdater,
      }));
    },
    []
  );

  const handleAddCharacter = useCallback((newChar: CharacterItem) => {
    setProject((prev) => ({
      ...prev,
      lastModified: Date.now(),
      characters: [...prev.characters, newChar],
    }));
  }, []);

  const handleUpdateRelationships = useCallback(
    (relationshipsOrUpdater: CharacterRelationship[] | ((prev: CharacterRelationship[]) => CharacterRelationship[])) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        relationships:
          typeof relationshipsOrUpdater === 'function'
            ? relationshipsOrUpdater(prev.relationships)
            : relationshipsOrUpdater,
      }));
    },
    []
  );

  const handleUpdateJunctions = useCallback(
    (junctionsOrUpdater: GraphJunctionNode[] | ((prev: GraphJunctionNode[]) => GraphJunctionNode[])) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        junctions:
          typeof junctionsOrUpdater === 'function'
            ? junctionsOrUpdater(prev.junctions)
            : junctionsOrUpdater,
      }));
    },
    []
  );

  const handleUpdateWorldItems = useCallback(
    (worldItemsOrUpdater: WorldItem[] | ((prev: WorldItem[]) => WorldItem[])) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        worldItems:
          typeof worldItemsOrUpdater === 'function'
            ? worldItemsOrUpdater(prev.worldItems)
            : worldItemsOrUpdater,
      }));
    },
    []
  );

  const handleUpdateContextBlocks = useCallback(
    (contextBlocksOrUpdater: ContextBlock[] | ((prev: ContextBlock[]) => ContextBlock[])) => {
      setProject((prev) => ({
        ...prev,
        lastModified: Date.now(),
        contextBlocks:
          typeof contextBlocksOrUpdater === 'function'
            ? contextBlocksOrUpdater(prev.contextBlocks)
            : contextBlocksOrUpdater,
      }));
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Splitter Resizing Handlers
  // ---------------------------------------------------------------------------
  const handleResizeLeft = useCallback((delta: number) => {
    setLeftWidth((w) => Math.max(180, Math.min(600, w + delta)));
  }, []);

  const handleResizeRight = useCallback((delta: number) => {
    setRightWidth((w) => Math.max(220, Math.min(600, w - delta)));
  }, []);

  // Bottom Splitter Vertical Resizing Handler
  const handleBottomSplitterMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startHeight = bottomHeight;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = startY - moveEvent.clientY;
        const newHeight = Math.max(140, Math.min(window.innerHeight * 0.7, startHeight + deltaY));
        setBottomHeight(newHeight);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [bottomHeight]
  );

  // ---------------------------------------------------------------------------
  // Dock Drag & Tab Movement
  // ---------------------------------------------------------------------------
  const handleDockTab = useCallback(
    (
      tabId: TabId,
      targetSide: DockSide,
      targetTabId?: TabId,
      insertPosition: 'before' | 'after' = 'after'
    ) => {
      setLeftTabs((prevLeft) => {
        const nextLeft = prevLeft.filter((t) => t !== tabId);
        if (targetSide === 'left') {
          if (!targetTabId) {
            nextLeft.push(tabId);
          } else {
            const idx = nextLeft.indexOf(targetTabId);
            if (idx === -1) {
              nextLeft.push(tabId);
            } else {
              const insertIdx = insertPosition === 'before' ? idx : idx + 1;
              nextLeft.splice(insertIdx, 0, tabId);
            }
          }
        }
        return nextLeft;
      });

      setRightTabs((prevRight) => {
        const nextRight = prevRight.filter((t) => t !== tabId);
        if (targetSide === 'right') {
          if (!targetTabId) {
            nextRight.push(tabId);
          } else {
            const idx = nextRight.indexOf(targetTabId);
            if (idx === -1) {
              nextRight.push(tabId);
            } else {
              const insertIdx = insertPosition === 'before' ? idx : idx + 1;
              nextRight.splice(insertIdx, 0, tabId);
            }
          }
        }
        return nextRight;
      });

      if (targetSide === 'left') {
        setActiveLeftTab(tabId);
        setLeftOpen(true);
      } else {
        setActiveRightTab(tabId);
        setRightOpen(true);
      }
    },
    []
  );

  const handleRemoveTab = useCallback(
    (tabId: TabId) => {
      setLeftTabs((prev) => {
        const next = prev.filter((t) => t !== tabId);
        if (activeLeftTab === tabId) {
          setActiveLeftTab(next[0] ?? null);
        }
        return next;
      });
      setRightTabs((prev) => {
        const next = prev.filter((t) => t !== tabId);
        if (activeRightTab === tabId) {
          setActiveRightTab(next[0] ?? null);
        }
        return next;
      });
    },
    [activeLeftTab, activeRightTab]
  );

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
          );
        case 'relationships':
          return (
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
  // Editor Metrics
  // ---------------------------------------------------------------------------
  const wordCount = activeChapter?.content.trim()
    ? activeChapter.content.trim().split(/\s+/).length
    : 0;


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
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewProject={handleNewProject}
        onOpenProject={openProject}
        onSaveProject={handleManualSave}
        onSaveProjectAs={handleManualSaveAs}
        onImportManuskript={handleImportManuskript}
        onExportEpub={handleExportEpub}
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
          onToggleOpen={() => setLeftOpen(false)}
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
            onReset={() => setLeftWidth(270)}
            label="Resize left panel"
          />
        )}

        {/* Center Canvas Area: Editor + Bottom Dock Panel */}
        <main className="flex-1 flex flex-col bg-zinc-950 min-w-0 overflow-hidden relative">
          {/* Editor Header */}
          <header className="h-9 border-b border-zinc-800 flex items-center justify-between px-3 bg-zinc-900/60 select-none shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLeftOpen(!leftOpen)}
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
                onClick={() => setRightOpen(!rightOpen)}
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
                    onClick={() => setIsBottomOpen(false)}
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
          <footer className="h-6 bg-zinc-950 border-t border-zinc-850 px-3 flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0 select-none">
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
                onClick={() => setIsBottomOpen((prev) => !prev)}
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
            onReset={() => setRightWidth(310)}
            label="Resize right panel"
          />
        )}

        {/* Right Browser-Style Dockable Panel */}
        <DockContainer
          side="right"
          isOpen={rightOpen}
          onToggleOpen={() => setRightOpen(false)}
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

      {/* 5. STUDIO SETTINGS & COLOR CUSTOMIZATION MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appSettings}
        onUpdateSettings={setAppSettings}
      />

      {/* 6. UNSAVED CHANGES NAVIGATION GUARD MODAL */}
      {pendingNavigationAction && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-750 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 font-sans animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-amber-950/60 border border-amber-800/80 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-100">
                  {t('unsavedChangesTitle')}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {t('unsavedChangesMessage')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setPendingNavigationAction(null)}
                className="px-3.5 py-1.5 rounded-sm text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
              >
                {t('keepEditing')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = pendingNavigationAction;
                  setPendingNavigationAction(null);
                  setIsDirty(false);
                  action?.();
                }}
                className="px-3.5 py-1.5 rounded-sm text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition cursor-pointer"
              >
                {t('discardAndSwitch')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. IMPORT RESULT NOTIFICATION MODAL */}
      {importModalData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-750 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 font-sans animate-in fade-in zoom-in-95 duration-150">
            {importModalData.type === 'success' ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {t('importSuccessTitle')}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {t('importSuccessDesc')}
                    </p>
                    <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-300">
                        {importModalData.sceneCount} {t('scenesCountLabel')}
                      </span>
                      <span className="px-2 py-0.5 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-300">
                        {importModalData.charCount} {t('charactersCountLabel')}
                      </span>
                      <span className="px-2 py-0.5 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-300">
                        {importModalData.worldCount} {t('dockWorldShort')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setImportModalData(null)}
                    className="px-4 py-1.5 rounded-sm text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
                  >
                    {t('accept')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-rose-950/60 border border-rose-800/80 text-rose-400 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Import Error
                    </h3>
                    <p className="text-xs text-rose-300 leading-relaxed whitespace-pre-wrap">
                      {importModalData.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setImportModalData(null)}
                    className="px-4 py-1.5 rounded-sm text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
                  >
                    {t('close')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </LanguageProvider>
  );
}
