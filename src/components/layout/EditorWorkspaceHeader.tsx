import React, { memo } from 'react';
import { Feather, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight } from 'lucide-react';

export interface EditorWorkspaceHeaderProps {
  leftOpen: boolean;
  onToggleLeft: () => void;
  activeChapterTitle: string;
  wordCount: number;
  targetWords: number;
  rightOpen: boolean;
  onToggleRight: () => void;
  t: (key: any, defaultVal?: string) => string;
}

export const EditorWorkspaceHeader = memo(function EditorWorkspaceHeader({
  leftOpen,
  onToggleLeft,
  activeChapterTitle,
  wordCount,
  targetWords,
  rightOpen,
  onToggleRight,
  t,
}: EditorWorkspaceHeaderProps) {
  return (
    <header className="h-9 border-b border-zinc-800 flex items-center justify-between px-3 bg-zinc-900/60 select-none shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleLeft}
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
            {activeChapterTitle}
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
            {targetWords.toLocaleString()}
          </strong>
        </span>

        <button
          onClick={onToggleRight}
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
  );
});

EditorWorkspaceHeader.displayName = 'EditorWorkspaceHeader';
