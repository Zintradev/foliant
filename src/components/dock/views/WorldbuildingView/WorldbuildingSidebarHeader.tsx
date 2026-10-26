import React, { memo } from 'react';
import { Globe, Plus } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';

interface WorldbuildingSidebarHeaderProps {
  itemCount: number;
  onCreateNew: () => void;
}

function WorldbuildingSidebarHeaderComponent({
  itemCount,
  onCreateNew,
}: WorldbuildingSidebarHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <Globe className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
        <span className="text-[11px] font-semibold text-zinc-200 uppercase tracking-wider font-mono truncate">
          {t('worldCodex')} ({itemCount})
        </span>
      </div>

      <button
        type="button"
        onClick={onCreateNew}
        title={t('addWorldItem')}
        className="flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition border border-zinc-700/60 cursor-pointer"
      >
        <Plus className="w-3 h-3" />
        <span>{t('add')}</span>
      </button>
    </div>
  );
}

export const WorldbuildingSidebarHeader = memo(WorldbuildingSidebarHeaderComponent);
