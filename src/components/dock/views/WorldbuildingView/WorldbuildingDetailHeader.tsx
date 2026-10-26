import React, { memo } from 'react';
import { ArrowLeft, Check, Trash2, X } from 'lucide-react';
import { getCategoryConfig } from './constants';
import { useTranslation } from '../../../../i18n/translations';

interface WorldbuildingDetailHeaderProps {
  category: string;
  saveMode: 'auto' | 'manual';
  hasPendingChanges: boolean;
  onBack: () => void;
  onDiscardDraft: () => void;
  onSaveDraft: () => void;
  onDelete: (e?: React.MouseEvent) => void;
}

function WorldbuildingDetailHeaderComponent({
  category,
  saveMode,
  hasPendingChanges,
  onBack,
  onDiscardDraft,
  onSaveDraft,
  onDelete,
}: WorldbuildingDetailHeaderProps) {
  const { t } = useTranslation();
  const config = getCategoryConfig(category);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/40 shrink-0">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="md:hidden p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-sm cursor-pointer"
          title="Back to list"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            {t('worldEntityEditor')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {saveMode === 'manual' && (
          <div className="flex items-center gap-1.5 mr-1">
            {hasPendingChanges && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-950/40 border border-amber-900/60 px-2 py-0.5 rounded-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {t('unconfirmedEdits')}
              </span>
            )}
            <button
              type="button"
              onClick={onDiscardDraft}
              disabled={!hasPendingChanges}
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 rounded-sm transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              title={t('discardChanges')}
            >
              <X className="w-3 h-3" />
              <span className="font-mono text-[10px]">{t('discard')}</span>
            </button>
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={!hasPendingChanges}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm shadow-xs transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              title={t('saveChanges')}
            >
              <Check className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px]">{t('save')}</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onDelete}
          title={t('deleteWorldItem')}
          className="flex items-center gap-1 px-2 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 rounded-sm transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px]">{t('delete')}</span>
        </button>
      </div>
    </div>
  );
}

export const WorldbuildingDetailHeader = memo(WorldbuildingDetailHeaderComponent);
