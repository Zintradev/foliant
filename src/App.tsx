import React, { useState, useCallback, useEffect } from 'react';
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
import { TextNode, ContextBlock, FoliantProject } from './types/project';
import { useProjectPersistence, SaveStatus } from './hooks/useProjectPersistence';
import { ask } from '@tauri-apps/plugin-dialog';
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
import DockContainer, { TAB_META } from './components/dock/DockContainer';
import OutlineView from './components/dock/views/OutlineView';
import StorylineView from './components/dock/views/StorylineView';
import ManuscriptStatsView from './components/dock/views/ManuscriptStatsView';
import CharactersView from './components/dock/views/CharactersView';
import WorldbuildingView from './components/dock/views/WorldbuildingView';
import TimelineView from './components/dock/views/TimelineView';
import RelationshipGraphView from './components/dock/views/RelationshipGraphView';
import Splitter from './components/common/Splitter';
import ActivityBar from './components/navigation/ActivityBar';
import SettingsModal from './components/settings/SettingsModal';
import { AppColorSettings, loadColorSettings } from './types/settings';

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
    fileName,
    error: persistenceError,
    saveProject,
    saveProjectAs,
    saveSilently,
    openProject,
    newProject,
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
  const [editorSaveStatus, setEditorSaveStatus] = useState<SaveStatus>('idle');

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
      setTimeout(() => setEditorSaveStatus('idle'), 2000);
    } else {
      setEditorSaveStatus('unsaved');
    }
  }, [saveProject]);

  const handleManualSaveAs = useCallback(async () => {
    setEditorSaveStatus('saving');
    const success = await saveProjectAs();
    if (success) {
      setEditorSaveStatus('saved');
      setTimeout(() => setEditorSaveStatus('idle'), 2000);
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

  // Sidebar Visibility & Resizable Dimensions State
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState<number>(270);
  const [rightWidth, setRightWidth] = useState<number>(310);

  // Bottom Dock Panel State (Collapsible & Resizable)
  const [isBottomOpen, setIsBottomOpen] = useState<boolean>(true);
  const [bottomHeight, setBottomHeight] = useState<number>(230);
  const [bottomTabs] = useState<TabId[]>(['timeline', 'relationships']);
  const [activeBottomTab, setActiveBottomTab] = useState<TabId>('timeline');

  // Dockable Tabs State
  const [leftTabs, setLeftTabs] = useState<TabId[]>(['outline']);
  const [rightTabs, setRightTabs] = useState<TabId[]>(['context', 'characters']);
  const [activeLeftTab, setActiveLeftTab] = useState<TabId | null>('outline');
  const [activeRightTab, setActiveRightTab] = useState<TabId | null>('context');

  // Settings & Tag Customization State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [colorSettings, setColorSettings] = useState<AppColorSettings>(loadColorSettings);

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
    (id: string) => {
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
    [activeChapterId]
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
            />
          );
        case 'storyline':
          return (
            <StorylineView
              storylines={project.storylines}
              chapters={project.chapters}
              onChange={handleUpdateStorylines}
              onSelectChapter={setActiveChapterId}
              colorSettings={colorSettings}
              isExpanded={isExpanded}
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
        case 'stats':
          return (
            <ManuscriptStatsView
              chapters={project.chapters}
              storylines={project.storylines}
              activeChapterId={activeChapterId}
              onSelectChapter={setActiveChapterId}
              onUpdateChapter={handleUpdateChapter}
              targetWordCount={project.targetWords ?? 80000}
              isExpanded={isExpanded}
            />
          );
        case 'context':
          return (
            <ContextPanel
              blocks={project.contextBlocks}
              onChange={handleUpdateContextBlocks}
            />
          );
        case 'moodboard':
          return (
            <div className="p-3">
              <MoodboardBlock
                title="Visual Reference"
                collapsible={false}
              />
            </div>
          );
        case 'characters':
          return (
            <CharactersView
              characters={project.characters}
              onChange={handleUpdateCharacters}
              colorSettings={colorSettings}
              isExpanded={isExpanded}
            />
          );
        case 'worldbuilding':
          return (
            <WorldbuildingView
              items={project.worldItems}
              onChange={handleUpdateWorldItems}
            />
          );
        default:
          return null;
      }
    },
    [
      project,
      activeChapterId,
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
      colorSettings,
    ]
  );

  // ---------------------------------------------------------------------------
  // Editor Metrics
  // ---------------------------------------------------------------------------
  const wordCount = activeChapter?.content.trim()
    ? activeChapter.content.trim().split(/\s+/).length
    : 0;


  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-200 select-none font-sans">
      {/* 0. PERMANENT ACTIVITY BAR */}
      <ActivityBar
        activeView={activeMainView}
        onSelectView={setActiveMainView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewProject={handleNewProject}
        onOpenProject={openProject}
        onSaveProject={handleManualSave}
        onSaveProjectAs={handleManualSaveAs}
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
          onSelectTab={setActiveLeftTab}
          onDockTab={handleDockTab}
          onRemoveTab={handleRemoveTab}
          renderView={renderDockView}
          width={leftWidth}
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
                title={leftOpen ? 'Collapse Left Dock' : 'Expand Left Dock'}
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
                  {activeChapter?.title ?? 'No chapter selected'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span>
                Words: <strong className="text-zinc-200 font-mono">{wordCount}</strong>
              </span>
              <span>
                Target:{' '}
                <strong className="text-zinc-200 font-mono">
                  {(project.targetWords ?? 80000).toLocaleString()}
                </strong>
              </span>

              <button
                onClick={() => setRightOpen(!rightOpen)}
                title={rightOpen ? 'Collapse Right Dock' : 'Expand Right Dock'}
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
              <span className="truncate mr-2">Disk Error: {persistenceError}</span>
              <button
                onClick={clearPersistenceError}
                className="text-[10px] font-mono hover:text-white px-1.5 py-0.5 rounded-xs bg-rose-900/60 hover:bg-rose-850 transition"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Central Scrollable Editor Surface */}
          <div className="flex-1 overflow-y-auto px-8 py-10 flex justify-center min-h-0">
            <div className="w-full max-w-2xl bg-zinc-950 focus:outline-none">
              <h1 className="text-3xl font-serif font-bold text-zinc-100 mb-6 pb-2 border-b border-zinc-800">
                {activeChapter?.title ?? 'Untitled'}
              </h1>
              <FoliantEditor
                chapterId={activeChapterId}
                content={activeChapter?.content ?? ''}
                onChange={handleContentChange}
                onStatusChange={handleEditorStatusChange}
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
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveMainView(activeBottomTab as MainViewId)}
                    title="Open Timeline in Fullscreen"
                    className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xs transition"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsBottomOpen(false)}
                    title="Collapse Bottom Panel"
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
                title="Open Timeline panel"
              >
                <Clock className="w-3 h-3 text-zinc-400" />
                <span className="font-sans font-medium">Timeline</span>
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
                title="Open Relationship Board"
              >
                <Network className="w-3 h-3 text-zinc-400" />
                <span className="font-sans font-medium">Relationships</span>
              </button>

              <button
                onClick={() => setIsBottomOpen((prev) => !prev)}
                className="p-0.5 text-zinc-500 hover:text-zinc-300 ml-0.5"
                title={isBottomOpen ? 'Collapse Bottom Panel' : 'Expand Bottom Panel'}
              >
                {isBottomOpen ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />}
              </button>

              <span className="text-zinc-800 ml-1">|</span>
              <span
                className="text-[10px] text-zinc-400 truncate max-w-xs flex items-center gap-1.5"
                title={currentFilePath || 'Unsaved Project'}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    editorSaveStatus === 'saved'
                      ? 'bg-emerald-400'
                      : editorSaveStatus === 'saving'
                      ? 'bg-amber-400 animate-pulse'
                      : editorSaveStatus === 'unsaved'
                      ? 'bg-amber-500'
                      : 'bg-zinc-600'
                  }`}
                />
                <span className="text-zinc-300 font-sans font-medium">
                  {fileName || 'Unsaved Project'}
                </span>
              </span>
              <span className="text-zinc-800 ml-1">|</span>
              <span className="text-[10px] text-zinc-500 truncate max-w-xs">
                {activeChapter?.title || 'No chapter'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[10px]">
              <span>{wordCount.toLocaleString()} words</span>
              <span>Target: {(project.targetWords ?? 80000).toLocaleString()}</span>
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
          onSelectTab={setActiveRightTab}
          onDockTab={handleDockTab}
          onRemoveTab={handleRemoveTab}
          renderView={renderDockView}
          width={rightWidth}
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
        settings={colorSettings}
        onUpdateSettings={setColorSettings}
      />
    </div>
  );
}
