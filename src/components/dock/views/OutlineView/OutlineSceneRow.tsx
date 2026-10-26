import React, { memo } from 'react';
import { BookOpen, Target, Trash2 } from 'lucide-react';
import { TextNode } from '../../../../types/project';

interface OutlineSceneRowProps {
  node: TextNode;
  isActive: boolean;
  isRenaming: boolean;
  renameValue: string;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  showMetrics: boolean;
  wordCount: number;
  chaptersCount: number;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRenameChange: (val: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onDelete?: () => void;
}

export const OutlineSceneRow = memo(function OutlineSceneRow({
  node,
  isActive,
  isRenaming,
  renameValue,
  renameInputRef,
  showMetrics,
  wordCount,
  chaptersCount,
  onSelect,
  onContextMenu,
  onRenameChange,
  onCommitRename,
  onCancelRename,
  onDelete,
}: OutlineSceneRowProps) {
  const targetWords = node.targetWords || 0;
  const progress = targetWords > 0 ? Math.min((wordCount / targetWords) * 100, 100) : 0;

  return (
    <div
      onContextMenu={onContextMenu}
      onClick={onSelect}
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

      {/* Metrics & Action */}
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

        {onDelete && chaptersCount > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete scene"
            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-0.5 transition cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
});
