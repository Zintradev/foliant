import { memo } from 'react';
import { Plus, Search, SpellCheck2, X } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';
import { ViewMode } from './types';

interface StorylineHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  storylinesCount: number;
  chaptersCount: number;
  onToggleAdd: () => void;
  isSearchOpen?: boolean;
  onToggleSearch?: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  isFuzzy?: boolean;
  onToggleFuzzy?: () => void;
}

export const StorylineHeader = memo(function StorylineHeader({
  viewMode,
  onViewModeChange,
  storylinesCount,
  chaptersCount,
  onToggleAdd,
  isSearchOpen = false,
  onToggleSearch,
  searchQuery = '',
  onSearchQueryChange,
  isFuzzy = false,
  onToggleFuzzy,
}: StorylineHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col border-b border-zinc-800 bg-zinc-900/50">
      <div className="flex items-center justify-between px-3 py-2">
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

        <div className="flex items-center gap-1">
          {onToggleSearch && (
            <button
              type="button"
              onClick={onToggleSearch}
              title={t('searchStorylines', 'Buscar tramas...')}
              aria-label={t('searchStorylines', 'Buscar tramas...')}
              className={`p-1 rounded-sm transition cursor-pointer ${
                isSearchOpen || searchQuery
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onToggleAdd}
            title={t('addStoryline')}
            data-tour-id="storylines-add-btn"
            className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-white transition cursor-pointer"
            aria-label={t('addStoryline')}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isSearchOpen && (
        <div className="px-3 pb-2 pt-0.5 flex items-center gap-1.5 animate-in fade-in duration-100">
          <div className="relative flex-1 flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange?.(e.target.value)}
              placeholder={t('searchStorylines', 'Buscar tramas...')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-sm pl-7 pr-7 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-sans"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange?.('')}
                className="absolute right-2 text-zinc-500 hover:text-zinc-300 p-0.5"
                title={t('clear', 'Limpiar')}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {onToggleFuzzy && (
            <button
              type="button"
              role="switch"
              aria-checked={isFuzzy}
              onClick={onToggleFuzzy}
              title={t('fuzzySearchTooltip', 'Enable fuzzy search to tolerate minor typos')}
              className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] font-mono transition cursor-pointer border shrink-0 ${
                isFuzzy
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SpellCheck2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
});
