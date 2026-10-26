import React, { memo } from 'react';
import { Clock, Network, ChevronDown, ChevronUp } from 'lucide-react';
import { TabId } from '../../types/dock';
import { TAB_TRANSLATION_KEYS } from '../dock/DockContainer';
import { SaveStatus } from '../../hooks/useProjectPersistence';

export interface EditorStatusBarProps {
  isBottomOpen: boolean;
  activeBottomTab: TabId;
  onOpenTimelineBottom: () => void;
  onOpenRelationshipsBottom: () => void;
  onToggleBottom: () => void;
  editorSaveStatus: SaveStatus;
  activeChapterTitle: string;
  wordCount: number;
  targetWords: number;
  t: (key: any, defaultVal?: string) => string;
}

export const EditorStatusBar = memo(function EditorStatusBar({
  isBottomOpen,
  activeBottomTab,
  onOpenTimelineBottom,
  onOpenRelationshipsBottom,
  onToggleBottom,
  editorSaveStatus,
  activeChapterTitle,
  wordCount,
  targetWords,
  t,
}: EditorStatusBarProps) {
  const timelineLabel = TAB_TRANSLATION_KEYS.timeline
    ? t(TAB_TRANSLATION_KEYS.timeline.labelKey, 'Timeline')
    : 'Timeline';

  const relationshipsLabel = TAB_TRANSLATION_KEYS.relationships
    ? t(TAB_TRANSLATION_KEYS.relationships.labelKey, 'Relationships')
    : 'Relationships';

  const isSavingOrUnsaved = editorSaveStatus === 'saving' || editorSaveStatus === 'unsaved';

  return (
    <footer className="h-6 bg-zinc-950 border-t border-zinc-855 px-3 flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0 select-none">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenTimelineBottom}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs transition text-[10px] font-mono ${
            isBottomOpen && activeBottomTab === 'timeline'
              ? 'bg-zinc-850 text-zinc-200 border border-zinc-750'
              : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
          title={timelineLabel}
        >
          <Clock className="w-3 h-3 text-zinc-400" />
          <span className="font-sans font-medium">{timelineLabel}</span>
        </button>
        <button
          onClick={onOpenRelationshipsBottom}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs transition text-[10px] font-mono ${
            isBottomOpen && activeBottomTab === 'relationships'
              ? 'bg-zinc-850 text-zinc-200 border border-zinc-750'
              : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
          title={relationshipsLabel}
        >
          <Network className="w-3 h-3 text-zinc-400" />
          <span className="font-sans font-medium">{relationshipsLabel}</span>
        </button>

        <button
          onClick={onToggleBottom}
          className="p-0.5 text-zinc-500 hover:text-zinc-300 ml-0.5"
          title={isBottomOpen ? t('collapsePanel') : t('expandPanel')}
        >
          {isBottomOpen ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />}
        </button>

        <span className="text-zinc-800 ml-1">|</span>
        <span
          className="flex items-center px-1"
          title={isSavingOrUnsaved ? t('saving') : t('saved')}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSavingOrUnsaved
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-400'
            }`}
          />
        </span>
        <span className="text-zinc-800 ml-1">|</span>
        <span className="text-[10px] text-zinc-500 truncate max-w-xs">
          {activeChapterTitle}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[10px]">
        <span>{wordCount.toLocaleString()} {t('words').toLowerCase()}</span>
        <span>{t('target')}: {targetWords.toLocaleString()}</span>
      </div>
    </footer>
  );
});

EditorStatusBar.displayName = 'EditorStatusBar';
