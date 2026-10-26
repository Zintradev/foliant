import React, { memo } from 'react';
import { Globe, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { WorldItem } from '../../../../types/dock';
import { useTranslation } from '../../../../i18n/translations';

interface SceneInspectorWorldSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  worldItems: WorldItem[];
  sortedWorldItems: WorldItem[];
  attachedWorldItemIds: string[];
  onToggleWorldItem: (worldId: string) => void;
}

function SceneInspectorWorldSection({
  isOpen,
  onToggle,
  worldItems,
  sortedWorldItems,
  attachedWorldItemIds,
  onToggleWorldItem,
}: SceneInspectorWorldSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="p-3">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left group cursor-pointer"
      >
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5 group-hover:text-zinc-200 transition">
          <Globe className="w-3 h-3 text-zinc-400" />
          {t('worldItemsInScene')} ({attachedWorldItemIds.length})
        </span>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-2">
          {worldItems.length === 0 ? (
            <p className="text-[11px] text-zinc-600 italic">{t('noWorldEntities')}</p>
          ) : (
            <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1 bg-zinc-900/30 border border-zinc-850 rounded-sm">
              {sortedWorldItems.map((item) => {
                const isAttached = attachedWorldItemIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => onToggleWorldItem(item.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-medium transition cursor-pointer border ${
                      isAttached
                        ? 'bg-emerald-950/80 border-emerald-700/70 text-emerald-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                    }`}
                  >
                    {isAttached && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                    <span>{item.title}</span>
                    <span className="text-[9px] font-mono opacity-60">({item.category})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(SceneInspectorWorldSection);
