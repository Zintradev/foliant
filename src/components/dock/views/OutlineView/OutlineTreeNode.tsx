import React, { memo } from 'react';
import { TreeItem } from './types';
import { TextNode } from '../../../../types/project';
import { OutlineFolderRow } from './OutlineFolderRow';
import { OutlineSceneRow } from './OutlineSceneRow';

interface OutlineTreeNodeProps {
  item: TreeItem;
  activeChapterId: string;
  collapsedFolderIds: Set<string>;
  renamingNodeId: string | null;
  renameValue: string;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  showMetrics: boolean;
  chaptersCount: number;
  onSelectChapter: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onNodeContextMenu: (e: React.MouseEvent, node: TextNode) => void;
  onRenameChange: (val: string) => void;
  onCommitRename: (id: string) => void;
  onCancelRename: () => void;
  onAddSceneToParent: (parentId: string | null) => void;
  onAddFolderToParent: (parentId: string | null) => void;
  onDeleteChapter?: (id: string) => void;
}

export const OutlineTreeNode = memo(function OutlineTreeNode({
  item,
  activeChapterId,
  collapsedFolderIds,
  renamingNodeId,
  renameValue,
  renameInputRef,
  showMetrics,
  chaptersCount,
  onSelectChapter,
  onToggleFolder,
  onNodeContextMenu,
  onRenameChange,
  onCommitRename,
  onCancelRename,
  onAddSceneToParent,
  onAddFolderToParent,
  onDeleteChapter,
}: OutlineTreeNodeProps) {
  const { node, children, wordCount } = item;
  const isFolder = node.type === 'folder';
  const isActive = !isFolder && node.id === activeChapterId;
  const isCollapsed = isFolder && collapsedFolderIds.has(node.id);
  const isRenaming = renamingNodeId === node.id;

  return (
    <div className="w-full">
      {isFolder ? (
        <OutlineFolderRow
          node={node}
          wordCount={wordCount}
          isCollapsed={isCollapsed}
          isRenaming={isRenaming}
          renameValue={renameValue}
          renameInputRef={renameInputRef}
          showMetrics={showMetrics}
          chaptersCount={chaptersCount}
          onToggleCollapse={() => onToggleFolder(node.id)}
          onContextMenu={(e) => onNodeContextMenu(e, node)}
          onRenameChange={onRenameChange}
          onCommitRename={() => onCommitRename(node.id)}
          onCancelRename={onCancelRename}
          onAddScene={() => onAddSceneToParent(node.id)}
          onAddFolder={() => onAddFolderToParent(node.id)}
          onDelete={onDeleteChapter ? () => onDeleteChapter(node.id) : undefined}
        />
      ) : (
        <OutlineSceneRow
          node={node}
          isActive={isActive}
          isRenaming={isRenaming}
          renameValue={renameValue}
          renameInputRef={renameInputRef}
          showMetrics={showMetrics}
          wordCount={wordCount}
          chaptersCount={chaptersCount}
          onSelect={() => onSelectChapter(node.id)}
          onContextMenu={(e) => onNodeContextMenu(e, node)}
          onRenameChange={onRenameChange}
          onCommitRename={() => onCommitRename(node.id)}
          onCancelRename={onCancelRename}
          onDelete={onDeleteChapter ? () => onDeleteChapter(node.id) : undefined}
        />
      )}

      {isFolder && !isCollapsed && children.length > 0 && (
        <div className="ml-3 pl-2.5 border-l border-zinc-800/80 space-y-0.5 mt-0.5">
          {children.map((child) => (
            <OutlineTreeNode
              key={child.node.id}
              item={child}
              activeChapterId={activeChapterId}
              collapsedFolderIds={collapsedFolderIds}
              renamingNodeId={renamingNodeId}
              renameValue={renameValue}
              renameInputRef={renameInputRef}
              showMetrics={showMetrics}
              chaptersCount={chaptersCount}
              onSelectChapter={onSelectChapter}
              onToggleFolder={onToggleFolder}
              onNodeContextMenu={onNodeContextMenu}
              onRenameChange={onRenameChange}
              onCommitRename={onCommitRename}
              onCancelRename={onCancelRename}
              onAddSceneToParent={onAddSceneToParent}
              onAddFolderToParent={onAddFolderToParent}
              onDeleteChapter={onDeleteChapter}
            />
          ))}
        </div>
      )}
    </div>
  );
});
