import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';
import { ViewMode } from './types';

interface StorylineHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  storylinesCount: number;
  chaptersCount: number;
  isAdding: boolean;
  onToggleAdd: () => void;
}

export const StorylineHeader = React.memo(function StorylineHeader({
  viewMode,
  onViewModeChange,
  storylinesCount,
  chaptersCount,
  isAdding,
  onToggleAdd,
}: StorylineHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-sm p-0.5">
          <button
            onClick={() => onViewModeChange('threads')}
            title={t('storylinesAndPlots')}
            className={`px-2 py-0.5 rounded-xs text-[10px] font-medium transition cursor-pointer ${
              viewMode === 'threads'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t('storyline')} ({storylinesCount})
          </button>
          <button
            onClick={() => onViewModeChange('chapters')}
            title={t('chaptersCount')}
            className={`px-2 py-0.5 rounded-xs text-[10px] font-medium transition cursor-pointer ${
              viewMode === 'chapters'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t('chaptersCount')} ({chaptersCount})
          </button>
        </div>
      </div>

      <button
        onClick={onToggleAdd}
        title={t('addStoryline')}
        className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-white transition cursor-pointer"
        aria-label={t('addStoryline')}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});
