import { memo } from 'react';
import { PanelLeftClose, PanelLeft, PanelRightClose, PanelRight } from 'lucide-react';

function SquareInsideSquareIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  );
}

export interface EditorWorkspaceHeaderProps {
  leftOpen: boolean;
  onToggleLeft: () => void;
  activeChapterTitle: string;
  wordCount: number;
  targetWords: number;
  rightOpen: boolean;
  onToggleRight: () => void;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
  showHeaderChapterInfo?: boolean;
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
  isFocusMode = false,
  onToggleFocus,
  showHeaderChapterInfo = false,
  t,
}: EditorWorkspaceHeaderProps) {
  return (
    <header className="h-9 border-b border-zinc-800 flex items-center justify-between px-2 sm:px-3 bg-zinc-900 select-none shrink-0 z-30 overflow-hidden">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <button
          onClick={onToggleLeft}
          title={leftOpen ? t('collapseLeftDock') : t('expandLeftDock')}
          aria-label={leftOpen ? t('collapseLeftDock') : t('expandLeftDock')}
          className={`p-1.5 md:p-1 rounded-sm transition cursor-pointer flex items-center justify-center touch-manipulation min-w-[32px] min-h-[32px] md:min-w-0 md:min-h-0 ${
            leftOpen
              ? 'bg-zinc-800 text-white border border-zinc-700/60 shadow-xs'
              : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
          }`}
        >
          {leftOpen ? (
            <PanelLeftClose className="w-4 h-4 md:w-3.5 md:h-3.5" />
          ) : (
            <PanelLeft className="w-4 h-4 md:w-3.5 md:h-3.5" />
          )}
        </button>

        {showHeaderChapterInfo && (
          <div className="flex items-center gap-1.5 text-zinc-400 min-w-0">
            <span className="text-xs font-medium text-zinc-200 truncate max-w-[120px] sm:max-w-xs md:max-w-sm">
              {activeChapterTitle}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 text-xs text-zinc-400 shrink-0">
        {showHeaderChapterInfo && (
          <>
            <span className="whitespace-nowrap">
              {t('words')}: <strong className="text-zinc-200 font-mono">{wordCount}</strong>
            </span>
            <span className="whitespace-nowrap hidden sm:inline">
              {t('target')}:{' '}
              <strong className="text-zinc-200 font-mono">
                {targetWords.toLocaleString()}
              </strong>
            </span>
          </>
        )}

        {onToggleFocus && (
          <button
            onClick={onToggleFocus}
            title={isFocusMode ? t('exitFocusMode', 'Salir de Concentración') : t('focusMode', 'Concentración')}
            className="flex items-center gap-1 px-2 py-1 md:py-0.5 rounded-xs text-[11px] font-medium bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 transition cursor-pointer touch-manipulation"
          >
            <SquareInsideSquareIcon className="w-3 h-3 text-zinc-300 shrink-0 ui-decorative-icon" />
            <span className="hidden sm:inline">{isFocusMode ? t('exitFocusMode', 'Exit Focus') : t('focusMode', 'Focus')}</span>
          </button>
        )}

        <button
          onClick={onToggleRight}
          title={rightOpen ? t('collapseRightDock') : t('expandRightDock')}
          aria-label={rightOpen ? t('collapseRightDock') : t('expandRightDock')}
          className={`p-1.5 md:p-1 rounded-sm transition cursor-pointer flex items-center justify-center touch-manipulation min-w-[32px] min-h-[32px] md:min-w-0 md:min-h-0 ${
            rightOpen
              ? 'bg-zinc-800 text-white border border-zinc-700/60 shadow-xs'
              : 'hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
          }`}
        >
          {rightOpen ? (
            <PanelRightClose className="w-4 h-4 md:w-3.5 md:h-3.5" />
          ) : (
            <PanelRight className="w-4 h-4 md:w-3.5 md:h-3.5" />
          )}
        </button>
      </div>
    </header>
  );
});

EditorWorkspaceHeader.displayName = 'EditorWorkspaceHeader';
