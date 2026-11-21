import { memo } from 'react';
import { Search, SpellCheck2, X } from 'lucide-react';
import { WorldItem } from './types';
import { getCategoryConfig } from './constants';
import { useTranslation } from '../../../../i18n/translations';

interface WorldbuildingFiltersProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  allCategories: string[];
  items: WorldItem[];
  isFuzzy?: boolean;
  onToggleFuzzy?: (fuzzy: boolean) => void;
}

function WorldbuildingFiltersComponent({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  allCategories,
  items,
  isFuzzy = false,
  onToggleFuzzy,
}: WorldbuildingFiltersProps) {
  const { t } = useTranslation();

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'Location':
        return t('catLocation');
      case 'Faction':
        return t('catFaction');
      case 'Lore':
        return t('catLore');
      case 'Artifact':
        return t('catArtifact');
      case 'All':
        return t('all');
      default:
        return category;
    }
  };

  return (
    <div className="p-2.5 border-b border-zinc-800 bg-zinc-900/30 space-y-2 shrink-0">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
        <button
          type="button"
          onClick={() => onSelectCategory('All')}
          className={`px-2 py-0.5 rounded-xs text-[10px] font-medium transition shrink-0 cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          {t('all')} ({items.length})
        </button>
        {allCategories.map((cat) => {
          const count = items.filter((i) => i.category === cat).length;
          const config = getCategoryConfig(cat);
          const Icon = config.icon;
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-medium transition shrink-0 border cursor-pointer ${
                isSelected
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900'
              }`}
            >
              <Icon className="w-2.5 h-2.5" />
              <span>{getCategoryLabel(cat)}</span>
              <span className="text-[9px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('searchLorePlaceholder')}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-sm pl-7 pr-7 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
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
            onClick={() => onToggleFuzzy(!isFuzzy)}
            title={t('fuzzySearchTooltip', 'Enable fuzzy search to tolerate minor typos')}
            className={`flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] font-mono transition cursor-pointer border shrink-0 ${
              isFuzzy
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <SpellCheck2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export const WorldbuildingFilters = memo(WorldbuildingFiltersComponent);
