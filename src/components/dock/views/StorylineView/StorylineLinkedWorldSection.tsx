import React from 'react';
import { Globe, Link2, X, ChevronDown } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';
import { WorldItem } from './types';

interface StorylineLinkedWorldSectionProps {
  storylineId: string;
  linkedWorldItemIds: string[];
  worldItems: WorldItem[];
  onLinkWorldItem: (storylineId: string, worldItemId: string) => void;
  onUnlinkWorldItem: (storylineId: string, worldItemId: string) => void;
}

export const StorylineLinkedWorldSection = React.memo(
  function StorylineLinkedWorldSection({
    storylineId,
    linkedWorldItemIds,
    worldItems,
    onLinkWorldItem,
    onUnlinkWorldItem,
  }: StorylineLinkedWorldSectionProps) {
    const { t } = useTranslation();
    const unlinkedWorld = worldItems.filter(
      (w) => !linkedWorldItemIds.includes(w.id)
    );

    return (
      <div className="pt-2 border-t border-zinc-850 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1 uppercase tracking-wider">
            <Globe className="w-2.5 h-2.5 text-zinc-500" />
            {t('linkedWorldReferences')} ({linkedWorldItemIds.length})
          </span>
        </div>

        {/* Linked World Badges */}
        {linkedWorldItemIds.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {linkedWorldItemIds.map((worldId) => {
              const item = worldItems.find((w) => w.id === worldId);
              return (
                <span
                  key={worldId}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] border border-emerald-900/60 bg-emerald-950/40 text-emerald-300"
                >
                  <span className="truncate max-w-[130px]">
                    {item?.title || worldId}
                  </span>
                  {item?.category && (
                    <span className="text-[9px] opacity-60 font-mono">
                      ({item.category})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onUnlinkWorldItem(storylineId, worldId)}
                    className="hover:text-red-400 text-zinc-500 ml-0.5 transition cursor-pointer"
                    title={t('unlinkWorldEntity')}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-[10px] text-zinc-500 italic">
            {t('noWorldEntitiesLinkedYet')}
          </p>
        )}

        {/* Dropdown to Link World Items */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <Link2 className="w-3 h-3 text-zinc-500 shrink-0" />
          {unlinkedWorld.length > 0 ? (
            <div className="relative flex-1">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onLinkWorldItem(storylineId, e.target.value);
                  }
                }}
                className="w-full appearance-none bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-sm px-2 py-1 pr-6 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer transition"
              >
                <option value="" disabled>
                  {t('linkWorldEntity')}
                </option>
                {unlinkedWorld.map((w) => (
                  <option
                    key={w.id}
                    value={w.id}
                    className="bg-zinc-950 text-zinc-200"
                  >
                    {w.title} ({w.category})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-2.5 h-2.5 text-zinc-500 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          ) : (
            <span className="text-[10px] text-zinc-600 italic">
              {worldItems.length === 0
                ? t('noWorldEntities')
                : t('allWorldEntitiesLinked')}
            </span>
          )}
        </div>
      </div>
    );
  }
);
