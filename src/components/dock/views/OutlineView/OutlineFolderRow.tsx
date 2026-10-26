import React, { memo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FilePlus, FolderPlus, Trash2 } from 'lucide-react';
import { TextNode } from '../../../../types/project';

interface OutlineFolderRowProps {
  node: TextNode;
  wordCount: number;
  isCollapsed: boolean;
  isRenaming: boolean;
  renameValue: string;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  showMetrics: boolean;
  chaptersCount: number;
  onToggleCollapse: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRenameChange: (val: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onAddScene: () => void;
  onAddFolder: () => void;
  onDelete?: () => void;
}

export const OutlineFolderRow = memo(function OutlineFolderRow({
  node,
  wordCount,
  isCollapsed,
  isRenaming,
  renameValue,
  renameInputRef,
  showMetrics,
  chaptersCount,
  onToggleCollapse,
  onContextMenu,
  onRenameChange,
  onCommitRename,
  onCancelRename,
  onAddScene,
  onAddFolder,
  onDelete,
}: OutlineFolderRowProps) {
  return (
    <div
      onContextMenu={onContextMenu}
      className="group flex items-center justify-between px-2 py-1.5 rounded-sm transition text-xs border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700/80"
    >
      <div
        onClick={onToggleCollapse}
        className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
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
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onCommitRename();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  onCancelRename();
                }
              }}
              onBlur={onCommitRename}
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
          onClick={onAddScene}
          title={`Add Scene inside "${node.title}"`}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-800 rounded-xs text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
        >
          <FilePlus className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={onAddFolder}
          title={`Add Subfolder inside "${node.title}"`}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-800 rounded-xs text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
        >
          <FolderPlus className="w-3 h-3" />
        </button>

        {onDelete && chaptersCount > 1 && (
          <button
            type="button"
            onClick={onDelete}
            title="Delete folder"
            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-0.5 transition cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
});
