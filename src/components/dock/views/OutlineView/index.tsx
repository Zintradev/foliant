import {
  BookOpen,
  ChevronsUpDown,
  Columns2,
  FilePlus,
  FolderPlus,
  LayoutList,
  Split,
} from 'lucide-react';
import React, { memo, useCallback, useState } from 'react';
import { useTranslation } from '../../../../i18n/translations';
import { TextNode } from '../../../../types/project';
import { loadSettings } from '../../../../types/settings';
import ConfirmDeleteModal from '../../../common/ConfirmDeleteModal';
import ProjectStatsView from '../ProjectStatsView';
import { OutlineContextMenu } from './OutlineContextMenu';
import { OutlineTreeNode } from './OutlineTreeNode';
import { ContextMenuState, LayoutMode, OutlineViewProps, TreeItem } from './types';
import { useOutlineFolders } from './useOutlineFolders';
import { useOutlineRename } from './useOutlineRename';
import { useOutlineTree } from './useOutlineTree';

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
              title={t('oneColumnTooltip')}
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
              title={t('twoColumnsTooltip')}
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
              title={t('splitViewTooltip')}
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
            className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          data-tour-id="outline-create-scene-btn"
          onClick={() => {
            onAddScene();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('foliant-tour-scene-created'));
            }
          }}
          title={t('newScene')}
          className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
        >
          <FilePlus className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onAddFolder}
          title={t('newFolder')}
          className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
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
  storylines?: any[];
  activeChapterId: string;
  onSelectChapter: (id: string) => void;
  onUpdateChapter?: (id: string, updates: Partial<TextNode>) => void;
}

const OutlineSplitView = memo(function OutlineSplitView({
  tree,
  renderTreeNode,
  chapters,
  storylines = [],
  activeChapterId,
  onSelectChapter,
  onUpdateChapter,
}: OutlineSplitViewProps) {
  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-1/2 border-r border-zinc-800/80 overflow-y-auto p-4 space-y-1">
        {tree.map((item) => renderTreeNode(item, true))}
      </div>
      <div className="w-1/2 overflow-y-auto p-4 bg-zinc-950/40">
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
// Main OutlineView Component
// ---------------------------------------------------------------------------

export function OutlineViewComponent({
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onDeleteChapter,
  onUpdateChapter,
  onAddFolder,
  isExpanded = false,
  storylines = [],
  onDirtyChange,
}: OutlineViewProps) {
  const { t } = useTranslation();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('1col');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [nodePendingDelete, setNodePendingDelete] = useState<TextNode | null>(null);

  const { tree, leftRoots, rightRoots } = useOutlineTree(chapters);

  const {
    renamingNodeId,
    renameValue,
    renameInputRef,
    setRenameValue,
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
  } = useOutlineFolders({ chapters, activeChapterId, onAddChapter, onAddFolder });

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  /**
   * Single entry point for deleting a node (context menu and inline scene button).
   * It always asks for confirmation first, even for empty scenes/folders.
   */
  const requestDeleteNode = useCallback((node: TextNode) => {
    const shouldConfirm = loadSettings()?.preferences?.confirmDelete?.outline ?? true;
    if (!shouldConfirm) {
      onDeleteChapter?.(node.id);
      return;
    }
    setNodePendingDelete(node);
  }, [onDeleteChapter]);

  const handleNodeContextMenu = useCallback((e: React.MouseEvent, node: TextNode) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    setContextMenu({ x, y, node });
  }, []);

  const getContextTargetParentId = useCallback((menu: ContextMenuState) => {
    return menu.node.type === 'folder' ? menu.node.id : menu.node.parentId ?? null;
  }, []);

  const handleContextNewScene = useCallback(() => {
    if (!contextMenu) return;
    const targetParentId = getContextTargetParentId(contextMenu);
    setContextMenu(null);
    handleAddSceneToParent(targetParentId);
  }, [contextMenu, getContextTargetParentId, handleAddSceneToParent]);

  const handleContextNewFolder = useCallback(() => {
    if (!contextMenu) return;
    const targetParentId = getContextTargetParentId(contextMenu);
    setContextMenu(null);
    handleAddFolderToParent(targetParentId);
  }, [contextMenu, getContextTargetParentId, handleAddFolderToParent]);

  const handleContextDelete = useCallback(() => {
    if (!contextMenu) return;
    const node = contextMenu.node;
    // Close the menu first so it never stays on screen over the modal.
    setContextMenu(null);
    requestDeleteNode(node);
  }, [contextMenu, requestDeleteNode]);

  const handleConfirmDelete = useCallback(() => {
    if (nodePendingDelete) {
      onDeleteChapter?.(nodePendingDelete.id);
      setNodePendingDelete(null);
    }
  }, [nodePendingDelete, onDeleteChapter]);

  const handleTreeNodeDelete = useCallback(
    (id: string) => {
      const node = chapters.find((c) => c.id === id);
      if (node) {
        requestDeleteNode(node);
      } else {
        onDeleteChapter?.(id);
      }
    },
    [chapters, requestDeleteNode, onDeleteChapter]
  );

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
      onDeleteChapter={handleTreeNodeDelete}
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
    handleTreeNodeDelete,
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
          <p className="text-xs font-medium text-zinc-400 max-w-xs leading-relaxed">
            {t('emptyOutlineMessage')}
          </p>
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
        onClose={closeContextMenu}
        onRename={handleStartRename}
        onNewScene={handleContextNewScene}
        onNewFolder={handleContextNewFolder}
        onDelete={handleContextDelete}
      />

      {/* Confirmation Modal on Delete */}
      <ConfirmDeleteModal
        isOpen={Boolean(nodePendingDelete)}
        onCancel={() => setNodePendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title={
          nodePendingDelete?.type === 'folder'
            ? t('deleteFolder')
            : t('deleteScene')
        }
        itemName={nodePendingDelete?.title}
        message={
          nodePendingDelete?.type === 'folder'
            ? t('confirmDeleteFolder')
            : t('confirmDeleteScene')
        }
      />

      {/* Quick Add Footer button */}
      {(!isExpanded || layoutMode !== 'split') && (
        <div className="p-2 border-t border-zinc-800 bg-zinc-950/80 flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-tour-id="outline-create-scene-btn-footer"
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