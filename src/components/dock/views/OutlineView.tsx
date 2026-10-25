import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import {
  FilePlus,
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Trash2,
  Target,
  Pencil,
  LayoutList,
  Columns2,
  Split,
  ChevronsUpDown,
} from 'lucide-react';
import { TextNode } from '../../../types/project';
import { StorylineItem } from '../../../types/dock';
import ManuscriptStatsView from './ManuscriptStatsView';
import { useTranslation } from '../../../i18n/translations';
import { countWords } from '../../../utils/textMetrics';

type LayoutMode = '1col' | '2col' | 'split';

interface OutlineViewProps {
  chapters: TextNode[];
  activeChapterId: string;
  onSelectChapter: (id: string) => void;
  onAddChapter: (type?: 'folder' | 'scene', parentId?: string | null) => void;
  onAddFolder?: (parentId?: string | null) => void;
  onDeleteChapter?: (id: string) => void;
  onUpdateChapter?: (id: string, updates: Partial<TextNode>) => void;
  isExpanded?: boolean;
  storylines?: StorylineItem[];
  onDirtyChange?: (isDirty: boolean) => void;
}

interface TreeItem {
  node: TextNode;
  children: TreeItem[];
  depth: number;
  wordCount: number;
}

interface ContextMenuState {
  x: number;
  y: number;
  node: TextNode;
}

function OutlineViewComponent({
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onAddFolder,
  onDeleteChapter,
  onUpdateChapter,
  isExpanded = false,
  storylines = [],
  onDirtyChange,
}: OutlineViewProps) {
  const { t } = useTranslation();

  // Folder collapsed state
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());

  // Layout mode for expanded screen
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('1col');

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  // Inline rename state
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const isDirty = renamingNodeId !== null;
    onDirtyChange?.(isDirty);
    return () => {
      onDirtyChange?.(false);
    };
  }, [renamingNodeId, onDirtyChange]);

  // ---------------------------------------------------------------------------
  // Auto-focus and select text when renaming begins
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (renamingNodeId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingNodeId]);

  // ---------------------------------------------------------------------------
  // Dismiss context menu on outside click or Escape key
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  // ---------------------------------------------------------------------------
  // Folder Toggle & Add Handlers
  // ---------------------------------------------------------------------------
  const handleToggleFolder = (folderId: string) => {
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleToggleExpandAll = () => {
    if (collapsedFolderIds.size > 0) {
      setCollapsedFolderIds(new Set());
    } else {
      const folderIds = chapters.filter((c) => c.type === 'folder').map((c) => c.id);
      setCollapsedFolderIds(new Set(folderIds));
    }
  };

  const handleAddSceneToParent = (parentId: string | null = null) => {
    onAddChapter('scene', parentId);
    if (parentId && collapsedFolderIds.has(parentId)) {
      setCollapsedFolderIds((prev) => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
    }
  };

  const handleAddFolderToParent = (parentId: string | null = null) => {
    if (onAddFolder) {
      onAddFolder(parentId);
    } else {
      onAddChapter('folder', parentId);
    }
    if (parentId && collapsedFolderIds.has(parentId)) {
      setCollapsedFolderIds((prev) => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Context Menu Actions
  // ---------------------------------------------------------------------------
  const handleNodeContextMenu = (e: React.MouseEvent, node: TextNode) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 160;
    const menuHeight = 150;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight);

    setContextMenu({ x, y, node });
  };

  const handleStartRename = (node: TextNode) => {
    setRenamingNodeId(node.id);
    setRenameValue(node.title);
    setContextMenu(null);
  };

  const handleCommitRename = (nodeId: string) => {
    if (renamingNodeId === nodeId) {
      const trimmed = renameValue.trim();
      if (trimmed && onUpdateChapter) {
        onUpdateChapter(nodeId, { title: trimmed });
      }
      setRenamingNodeId(null);
    }
  };

  const handleCancelRename = () => {
    setRenamingNodeId(null);
  };

  const handleContextNewScene = () => {
    if (!contextMenu) return;
    const targetParentId =
      contextMenu.node.type === 'folder'
        ? contextMenu.node.id
        : contextMenu.node.parentId ?? null;
    handleAddSceneToParent(targetParentId);
    setContextMenu(null);
  };

  const handleContextNewFolder = () => {
    if (!contextMenu) return;
    const targetParentId =
      contextMenu.node.type === 'folder'
        ? contextMenu.node.id
        : contextMenu.node.parentId ?? null;
    handleAddFolderToParent(targetParentId);
    setContextMenu(null);
  };

  const handleContextDelete = () => {
    if (!contextMenu) return;
    if (onDeleteChapter) {
      onDeleteChapter(contextMenu.node.id);
    }
    setContextMenu(null);
  };

  // ---------------------------------------------------------------------------
  // Build Hierarchical Tree & Aggregate Word Counts
  // ---------------------------------------------------------------------------
  const { tree } = useMemo(() => {
    const nodeMap = new Map<string, TreeItem>();
    const roots: TreeItem[] = [];

    chapters.forEach((node) => {
      nodeMap.set(node.id, {
        node,
        children: [],
        depth: 0,
        wordCount: 0,
      });
    });

    chapters.forEach((node) => {
      const item = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!;
        parent.children.push(item);
      } else {
        roots.push(item);
      }
    });

    let totalProjectWords = 0;
    const processTree = (item: TreeItem, currentDepth: number): number => {
      item.depth = currentDepth;
      if (item.node.type === 'scene') {
        const w = countWords(item.node.content);
        item.wordCount = w;
        totalProjectWords += w;
        return w;
      }

      let subtotal = 0;
      for (const child of item.children) {
        subtotal += processTree(child, currentDepth + 1);
      }
      item.wordCount = subtotal;
      return subtotal;
    };

    roots.forEach((root) => processTree(root, 0));

    return { tree: roots, totalWords: totalProjectWords };
  }, [chapters]);

  const folderCount = chapters.filter((c) => c.type === 'folder').length;

  // ---------------------------------------------------------------------------
  // Recursive Tree Node Renderer
  // ---------------------------------------------------------------------------
  const renderTreeNode = (item: TreeItem, showMetrics: boolean) => {
    const { node, children, wordCount } = item;
    const isFolder = node.type === 'folder';
    const isActive = !isFolder && node.id === activeChapterId;
    const isCollapsed = isFolder && collapsedFolderIds.has(node.id);
    const isRenaming = renamingNodeId === node.id;
    const targetWords = node.targetWords || 0;
    const progress = targetWords > 0 ? Math.min((wordCount / targetWords) * 100, 100) : 0;

    return (
      <div key={node.id} className="w-full">
        {isFolder ? (
          // Folder Row
          <div
            onContextMenu={(e) => handleNodeContextMenu(e, node)}
            className="group flex items-center justify-between px-2 py-1.5 rounded-sm transition text-xs border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700/80"
          >
            <div
              onClick={() => handleToggleFolder(node.id)}
              className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFolder(node.id);
                }}
                className="p-0.5 text-zinc-500 hover:text-zinc-200 transition"
                title={isCollapsed ? 'Expand folder' : 'Collapse folder'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>

              {isCollapsed ? (
                <Folder className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
              ) : (
                <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}

              {isRenaming ? (
                <div
                  className="w-full flex-1 min-w-0 mr-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCommitRename(node.id);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelRename();
                      }
                    }}
                    onBlur={() => handleCommitRename(node.id)}
                    className="w-full bg-zinc-950 border border-zinc-600 rounded-xs px-1.5 py-0.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-400 font-sans"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="truncate flex-1 min-w-0 pr-1">
                  <span className="font-medium text-zinc-200 text-xs truncate block">
                    {node.title || 'Untitled Folder'}
                  </span>
                  {showMetrics && node.synopsis && (
                    <span className="text-[10px] text-zinc-500 truncate block font-normal">
                      {node.synopsis}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions & Metrics */}
            <div className="flex items-center gap-1.5 ml-2 shrink-0">
              {showMetrics && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  {wordCount.toLocaleString()} w
                </span>
              )}

              {/* Quick Add Buttons */}
              <button
                type="button"
                onClick={() => handleAddSceneToParent(node.id)}
                title={`Add Scene inside "${node.title}"`}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-800 rounded-xs text-zinc-500 hover:text-zinc-200 transition"
              >
                <FilePlus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleAddFolderToParent(node.id)}
                title={`Add Subfolder inside "${node.title}"`}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-800 rounded-xs text-zinc-500 hover:text-zinc-200 transition"
              >
                <FolderPlus className="w-3 h-3" />
              </button>

              {onDeleteChapter && chapters.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteChapter(node.id)}
                  title="Delete folder"
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-0.5 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ) : (
          // Scene Row
          <div
            onContextMenu={(e) => handleNodeContextMenu(e, node)}
            onClick={() => onSelectChapter(node.id)}
            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-sm cursor-pointer transition text-xs ${
              isActive
                ? 'bg-zinc-900 text-zinc-100 font-medium border-l-2 border-zinc-200 shadow-xs'
                : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <BookOpen
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-400'
                }`}
              />

              {isRenaming ? (
                <div
                  className="w-full flex-1 min-w-0 mr-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCommitRename(node.id);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelRename();
                      }
                    }}
                    onBlur={() => handleCommitRename(node.id)}
                    className="w-full bg-zinc-950 border border-zinc-600 rounded-xs px-1.5 py-0.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-400 font-sans"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="truncate flex-1 min-w-0 pr-1">
                  <div className="truncate font-sans leading-tight">
                    {node.title || 'Untitled Scene'}
                  </div>
                  {showMetrics && node.synopsis && (
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5 font-normal">
                      {node.synopsis}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metrics & Action: word count completely removed when showMetrics is false */}
            <div className="flex items-center gap-1.5 ml-2 shrink-0">
              {showMetrics && (
                <>
                  {targetWords > 0 && (
                    <div className="hidden group-hover:flex items-center gap-1 text-[9px] text-zinc-500 font-mono">
                      <Target className="w-2.5 h-2.5 text-zinc-500" />
                      <span>{Math.round(progress)}%</span>
                    </div>
                  )}
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {wordCount.toLocaleString()} w
                  </span>
                </>
              )}

              {onDeleteChapter && chapters.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChapter(node.id);
                  }}
                  title="Delete scene"
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-0.5 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Child Scenes / Subfolders directly underneath parent folder */}
        {isFolder && !isCollapsed && children.length > 0 && (
          <div className="ml-3 pl-2.5 border-l border-zinc-800/80 space-y-0.5 mt-0.5">
            {children.map((child) => renderTreeNode(child, showMetrics))}
          </div>
        )}
      </div>
    );
  };

  // Split root trees evenly for 2-column widescreen view
  const { leftRoots, rightRoots } = useMemo(() => {
    const mid = Math.ceil(tree.length / 2);
    return {
      leftRoots: tree.slice(0, mid),
      rightRoots: tree.slice(mid),
    };
  }, [tree]);

  return (
    <div className="flex flex-col h-full select-none bg-zinc-950 font-sans relative overflow-hidden">
      {/* View Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
            {t('projectOutline')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Header Layout Selector for Large / Expanded View */}
          {isExpanded && (
            <div className="flex items-center p-0.5 rounded-sm bg-zinc-950 border border-zinc-800 mr-1.5">
              <button
                type="button"
                onClick={() => setLayoutMode('1col')}
                title="1 Column View (Centered Tree)"
                className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono transition ${
                  layoutMode === '1col'
                    ? 'bg-zinc-800 text-zinc-100 font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutList className="w-3 h-3" />
                <span>{t('oneColumn')}</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('2col')}
                title="2 Columns View (Widescreen Tree)"
                className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono transition ${
                  layoutMode === '2col'
                    ? 'bg-zinc-800 text-zinc-100 font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Columns2 className="w-3 h-3" />
                <span>{t('twoColumns')}</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('split')}
                title="Split View (Outline + Stats)"
                className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono transition ${
                  layoutMode === 'split'
                    ? 'bg-zinc-800 text-zinc-100 font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Split className="w-3 h-3" />
                <span>{t('splitView')}</span>
              </button>
            </div>
          )}

          {folderCount > 0 && (
            <button
              onClick={handleToggleExpandAll}
              title={collapsedFolderIds.size > 0 ? t('expandAllFolders') : t('collapseAllFolders')}
              className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-white transition"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => handleAddSceneToParent(null)}
            title={t('addNewScene')}
            className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-white transition"
            aria-label={t('addNewScene')}
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleAddFolderToParent(null)}
            title={t('addNewFolder')}
            className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-white transition"
            aria-label={t('addNewFolder')}
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {tree.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 gap-2">
          <BookOpen className="w-8 h-8 text-zinc-600" />
          <p className="text-xs font-medium text-zinc-400">{t('noOutlineElements')}</p>
        </div>
      ) : isExpanded ? (
        /* EXPANDED / LARGE VIEW WITH 3 MODES */
        layoutMode === '1col' ? (
          // 1 Column: Centered, spacious vertical tree
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-1">
              {tree.map((item) => renderTreeNode(item, true))}
            </div>
          </div>
        ) : layoutMode === '2col' ? (
          // 2 Columns: Widescreen layout with two vertical tree columns
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-1 p-3 rounded-sm border border-zinc-850/80 bg-zinc-900/20">
                {leftRoots.map((item) => renderTreeNode(item, true))}
              </div>
              <div className="space-y-1 p-3 rounded-sm border border-zinc-850/80 bg-zinc-900/20">
                {rightRoots.map((item) => renderTreeNode(item, true))}
              </div>
            </div>
          </div>
        ) : (
          // Split View: Left complete Outline, Right synchronized Stats
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-zinc-800">
            <div className="w-full md:w-1/2 flex flex-col overflow-hidden bg-zinc-950">
              <div className="px-3 py-1.5 border-b border-zinc-850 bg-zinc-900/30 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                {t('outlineStructure')}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {tree.map((item) => renderTreeNode(item, true))}
              </div>
            </div>
            <div className="w-full md:w-1/2 flex flex-col overflow-hidden bg-zinc-950">
              <ManuscriptStatsView
                chapters={chapters}
                storylines={storylines}
                activeChapterId={activeChapterId}
                onSelectChapter={onSelectChapter}
                onUpdateChapter={onUpdateChapter}
                targetWordCount={80000}
                isExpanded={false}
              />
            </div>
          </div>
        )
      ) : (
        /* SIDEBAR COMPACT VIEW: Clean Tree with NO word counts, full width for titles */
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {tree.map((item) => renderTreeNode(item, false))}
        </div>
      )}

      {/* Floating Right-Click Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 min-w-[150px] bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl py-1 text-xs text-zinc-300 font-sans animate-in fade-in zoom-in-95 duration-75 select-none"
        >
          <div className="px-2.5 py-1 text-[10px] font-mono text-zinc-500 border-b border-zinc-850 truncate max-w-[170px]">
            {contextMenu.node.title || 'Selected item'}
          </div>

          <button
            onClick={() => handleStartRename(contextMenu.node)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-zinc-850 hover:text-white transition cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('renameNode')}</span>
          </button>

          <button
            onClick={handleContextNewScene}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-zinc-850 hover:text-white transition cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('newScene')}</span>
          </button>

          <button
            onClick={handleContextNewFolder}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-zinc-850 hover:text-white transition cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('newFolder')}</span>
          </button>

          {onDeleteChapter && chapters.length > 1 && (
            <>
              <div className="h-px bg-zinc-850 my-0.5" />
              <button
                onClick={handleContextDelete}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-zinc-850 text-rose-400 hover:text-rose-300 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('delete')}</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Quick Add Footer button (in compact or 1col/2col modes) */}
      {(!isExpanded || layoutMode !== 'split') && (
        <div className="p-2 border-t border-zinc-800 bg-zinc-950/80 flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => handleAddSceneToParent(null)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-sm text-[11px] font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>{t('newScene')}</span>
          </button>
          <button
            onClick={() => handleAddFolderToParent(null)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-sm text-[11px] font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{t('newFolder')}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(OutlineViewComponent);
