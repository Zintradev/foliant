import React, { memo } from 'react';
import {
  GripVertical,
  PanelLeftClose,
  PanelRightClose,
  Rows2,
  Menu,
  X,
} from 'lucide-react';
import { DockSide, TabId } from '../../../types/dock';
import { useTranslation } from '../../../i18n/translations';
import { TAB_META, TAB_TRANSLATION_KEYS } from './constants';
import { DragState } from './types';

interface DockStripTabBarProps {
  strip: 'top' | 'bottom';
  side: DockSide;
  stripTabs: TabId[];
  activeStripTab: TabId | null;
  dragState: DragState | null;
  isSplit: boolean;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
  onPointerDownTab: (
    e: React.PointerEvent<HTMLDivElement>,
    tabId: TabId,
    strip: 'top' | 'bottom'
  ) => void;
  onToggleSplit: () => void;
  onOpenModuleMenu: (strip: 'top' | 'bottom') => void;
  onToggleOpen: () => void;
}

function DockStripTabBar({
  strip,
  side,
  stripTabs,
  activeStripTab,
  dragState,
  isSplit,
  menuButtonRef,
  onPointerDownTab,
  onToggleSplit,
  onOpenModuleMenu,
  onToggleOpen,
}: DockStripTabBarProps) {
  const { t } = useTranslation();
  const CloseIcon = side === 'left' ? PanelLeftClose : PanelRightClose;

  return (
    <div
      data-dock-strip={strip}
      className="flex items-center justify-between border-b px-1 pt-1 min-h-[34px] bg-zinc-900/60 border-zinc-800 shrink-0"
    >
      <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar flex-1 mr-1">
        {stripTabs.map((tabId) => {
          const meta = TAB_META[tabId];
          if (!meta) return null;
          const Icon = meta.icon;
          const isActive = activeStripTab === tabId;
          const isBeingDragged = dragState?.tabId === tabId;

          const tabLabel = TAB_TRANSLATION_KEYS[tabId]
            ? t(TAB_TRANSLATION_KEYS[tabId].labelKey, meta.label)
            : meta.label;
          const tabShort = TAB_TRANSLATION_KEYS[tabId]
            ? t(TAB_TRANSLATION_KEYS[tabId].shortLabelKey, meta.shortLabel)
            : meta.shortLabel;

          return (
            <div
              key={tabId}
              data-dock-tab-id={tabId}
              data-dock-strip={strip}
              onPointerDown={(e) => onPointerDownTab(e, tabId, strip)}
              title={`${tabLabel} — ${t('dragToDockOrReorder', 'Drag to dock or reorder')}`}
              className={`group relative flex items-center gap-1.5 px-2 py-1 rounded-t-sm text-xs transition cursor-grab active:cursor-grabbing border-b-2 select-none touch-none ${
                isActive
                  ? 'bg-zinc-900 text-zinc-100 font-medium border-zinc-200'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border-transparent'
              } ${
                isBeingDragged ? 'opacity-40 border-dashed border-zinc-500' : ''
              } data-[tab-drag-target=true]:border-zinc-300 data-[tab-drag-target=true]:bg-zinc-800/80`}
            >
              <GripVertical className="w-2.5 h-2.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5" />
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
              />
              <span className="truncate max-w-[85px] pointer-events-none">{tabShort}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-0.5 pb-1 shrink-0 relative">
        {/* Subdivide Dual-Strip Button (Only in Top Strip header) */}
        {strip === 'top' && (
          <button
            onClick={onToggleSplit}
            title={
              isSplit
                ? t('unsplitPanel', 'Merge into single panel')
                : t('splitPanel', 'Subdivide panel into two strips')
            }
            aria-label={isSplit ? 'Merge panel' : 'Subdivide panel'}
            className={`p-1 rounded-sm transition cursor-pointer ${
              isSplit
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Rows2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Hamburger / Module Picker */}
        <button
          ref={menuButtonRef}
          onClick={() => onOpenModuleMenu(strip)}
          title={t('addOrSwitchModule', 'Add or open modules in this strip')}
          className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
          aria-label={t('addOrSwitchModule', 'Add or switch module')}
        >
          <Menu className="w-3.5 h-3.5" />
        </button>

        {/* Close / Collapse button */}
        {strip === 'top' ? (
          <button
            onClick={onToggleOpen}
            title={t('collapsePanel', 'Collapse Panel')}
            className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
            aria-label={t('collapsePanel', 'Collapse Panel')}
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={onToggleSplit}
            title={t('closeBottomStrip', 'Close bottom strip and merge into top')}
            className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close bottom strip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(DockStripTabBar);
