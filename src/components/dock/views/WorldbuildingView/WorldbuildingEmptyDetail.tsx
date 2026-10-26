import React, { memo } from 'react';
import { Compass, Plus } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';

interface WorldbuildingEmptyDetailProps {
  onCreateNew: () => void;
}

function WorldbuildingEmptyDetailComponent({ onCreateNew }: WorldbuildingEmptyDetailProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500">
      <Compass className="w-12 h-12 text-zinc-700 mb-3 opacity-60" />
      <h3 className="text-sm font-semibold text-zinc-300 mb-1">{t('noEntriesFound')}</h3>
      <p className="text-xs text-zinc-500 max-w-sm mb-4">{t('emptyStateText')}</p>
      <button
        type="button"
        onClick={onCreateNew}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-sm text-xs font-medium transition cursor-pointer border border-zinc-700/60"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{t('addWorldItem')}</span>
      </button>
    </div>
  );
}

export const WorldbuildingEmptyDetail = memo(WorldbuildingEmptyDetailComponent);
