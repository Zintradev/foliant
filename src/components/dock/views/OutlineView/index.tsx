import React, { useState, memo, useCallback } from 'react';
import {
  BookOpen,
  FilePlus,
  FolderPlus,
  LayoutList,
  Columns2,
  Split,
  ChevronsUpDown,
} from 'lucide-react';
import { TextNode } from '../../../../types/project';
import { OutlineViewProps, LayoutMode, ContextMenuState, TreeItem } from './types';
import { useOutlineTree } from './useOutlineTree';
import { useOutlineRename } from './useOutlineRename';
import { useOutlineFolders } from './useOutlineFolders';
import { OutlineTreeNode } from './OutlineTreeNode';
import { OutlineContextMenu } from './OutlineContextMenu';
import ProjectStatsView from '../ProjectStatsView';
import { useTranslation } from '../../../../i18n/translations';

// ---------------------------------------------------------------------------
// Cohesive Inlined Presentational Subcomponents
// ---------------------------------------------------------------------------

interface OutlineHeaderProps {
  isExpanded: boolean;
  layoutMode: LayoutMode;
  folderCount: number;
  isAllCollapsed: boolean;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onToggleExpandAll: () => void;
  onAddScene: () => void;
  onAddFolder: () => void;
}

const OutlineHeader = memo(function OutlineHeader({
  isExpanded,
  layoutMode,
  folderCount,
  isAllCollapsed,
  onLayoutModeChange,
  onToggleExpandAll,
  onAddScene,
  onAddFolder,
}: OutlineHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
          {t('projectOutline')}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {isExpanded && (
          <div className="flex items-center p-0.5 rounded-sm bg-zinc-950 border border-zinc-800 mr-1.5">
            <button
              type="button"
              onClick={() => onLayoutModeChange('1col')}
              title="1 Column View (Centered Tree)"
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono transition cursor-pointer ${
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
              onClick={() => onLayoutModeChange('2col')}
              title="2 Columns View (Widescreen Tree)"
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono transition cursor-pointer ${
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
              onClick={() => onLayoutModeChange('split')}
              title="Split View (Outline + Stats)"
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono transition cursor-pointer ${
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
            type="button"
            onClick={onToggleExpandAll}
            title={isAllCollapsed ? t('expandAllFolders') : t('collapseAllFolders')}
            className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onAddScene}
          title={t('addNewScene')}
          className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-white transition cursor-pointer"
          aria-label={t('addNewScene')}
        >
          <FilePlus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onAddFolder}
          title={t('addNewFolder')}
          className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-white transition cursor-pointer"
          aria-label={t('addNewFolder')}
        >
          <FolderPlus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

interface OutlineSplitViewProps {
  tree: TreeItem[];
  renderTreeNode: (item: TreeItem, showMetrics: boolean) => React.ReactNode;
  chapters: TextNode[];
  storylines?: OutlineViewProps['storylines'];
  activeChapterId: string;
  onSelectChapter: (id: string) => void;
  onUpdateChapter?: (id: string, updates: Partial<TextNode>) => void;
}

const OutlineSplitView = memo(function OutlineSplitView({
  tree,
  renderTreeNode,
  chapters,
  storylines,
  activeChapterId,
  onSelectChapter,
  onUpdateChapter,
}: OutlineSplitViewProps) {
  const { t } = useTranslation();

  return (
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
        <ProjectStatsView
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
  );
});

// ---------------------------------------------------------------------------
// Main Orchestrator
// ---------------------------------------------------------------------------

export function OutlineViewComponent({
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

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('1col');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const { tree, leftRoots, rightRoots } = useOutlineTree(chapters);
  const {
    renamingNodeId,
    renameValue,
    setRenameValue,
    renameInputRef,
    handleStartRename,
    handleCommitRename,
    handleCancelRename,
  } = useOutlineRename({ onUpdateChapter, onDirtyChange });

  const {
    collapsedFolderIds,
    handleToggleFolder,
    handleToggleExpandAll,
    handleAddSceneToParent,
    handleAddFolderToParent,
  } = useOutlineFolders({ chapters, onAddChapter, onAddFolder });

  const handleNodeContextMenu = useCallback((e: React.MouseEvent, node: TextNode) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 160;
    const menuHeight = 150;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight);

    setContextMenu({ x, y, node });
  }, []);

  const handleContextNewScene = useCallback(() => {
    if (!contextMenu) return;
    const targetParentId =
      contextMenu.node.type === 'folder'
        ? contextMenu.node.id
        : contextMenu.node.parentId ?? null;
    handleAddSceneToParent(targetParentId);
  }, [contextMenu, handleAddSceneToParent]);

  const handleContextNewFolder = useCallback(() => {
    if (!contextMenu) return;
    const targetParentId =
      contextMenu.node.type === 'folder'
        ? contextMenu.node.id
        : contextMenu.node.parentId ?? null;
    handleAddFolderToParent(targetParentId);
  }, [contextMenu, handleAddFolderToParent]);

  const handleContextDelete = useCallback(() => {
    if (!contextMenu) return;
    onDeleteChapter?.(contextMenu.node.id);
  }, [contextMenu, onDeleteChapter]);

  const renderTreeNode = useCallback((item: TreeItem, showMetrics: boolean) => (
    <OutlineTreeNode
      key={item.node.id}
      item={item}
      activeChapterId={activeChapterId}
      collapsedFolderIds={collapsedFolderIds}
      renamingNodeId={renamingNodeId}
      renameValue={renameValue}
      renameInputRef={renameInputRef}
      showMetrics={showMetrics}
      chaptersCount={chapters.length}
      onSelectChapter={onSelectChapter}
      onToggleFolder={handleToggleFolder}
      onNodeContextMenu={handleNodeContextMenu}
      onRenameChange={setRenameValue}
      onCommitRename={handleCommitRename}
      onCancelRename={handleCancelRename}
      onAddSceneToParent={handleAddSceneToParent}
      onAddFolderToParent={handleAddFolderToParent}
      onDeleteChapter={onDeleteChapter}
    />
  ), [
    activeChapterId,
    collapsedFolderIds,
    renamingNodeId,
    renameValue,
    renameInputRef,
    chapters.length,
    onSelectChapter,
    handleToggleFolder,
    handleNodeContextMenu,
    setRenameValue,
    handleCommitRename,
    handleCancelRename,
    handleAddSceneToParent,
    handleAddFolderToParent,
    onDeleteChapter,
  ]);

  const folderCount = chapters.filter((c) => c.type === 'folder').length;

  return (
    <div className="flex flex-col h-full select-none bg-zinc-950 font-sans relative overflow-hidden">
      <OutlineHeader
        isExpanded={isExpanded}
        layoutMode={layoutMode}
        folderCount={folderCount}
        isAllCollapsed={collapsedFolderIds.size > 0}
        onLayoutModeChange={setLayoutMode}
        onToggleExpandAll={handleToggleExpandAll}
        onAddScene={() => handleAddSceneToParent(null)}
        onAddFolder={() => handleAddFolderToParent(null)}
      />

      {/* Main Content Area */}
      {tree.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 gap-2">
          <BookOpen className="w-8 h-8 text-zinc-600" />
          <p className="text-xs font-medium text-zinc-400">{t('noOutlineElements')}</p>
        </div>
      ) : isExpanded ? (
        layoutMode === '1col' ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-1">
              {tree.map((item) => renderTreeNode(item, true))}
            </div>
          </div>
        ) : layoutMode === '2col' ? (
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
          <OutlineSplitView
            tree={tree}
            renderTreeNode={renderTreeNode}
            chapters={chapters}
            storylines={storylines}
            activeChapterId={activeChapterId}
            onSelectChapter={onSelectChapter}
            onUpdateChapter={onUpdateChapter}
          />
        )
      ) : (
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {tree.map((item) => renderTreeNode(item, false))}
        </div>
      )}

      <OutlineContextMenu
        contextMenu={contextMenu}
        chaptersCount={chapters.length}
        onClose={() => setContextMenu(null)}
        onRename={handleStartRename}
        onNewScene={handleContextNewScene}
        onNewFolder={handleContextNewFolder}
        onDelete={handleContextDelete}
      />

      {/* Quick Add Footer button */}
      {(!isExpanded || layoutMode !== 'split') && (
        <div className="p-2 border-t border-zinc-800 bg-zinc-950/80 flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleAddSceneToParent(null)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-sm text-[11px] font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>{t('newScene')}</span>
          </button>
          <button
            type="button"
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
