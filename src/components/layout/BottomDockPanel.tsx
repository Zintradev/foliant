import React, { memo } from 'react';
import { Clock, ChevronDown, Maximize2 } from 'lucide-react';
import { TabId } from '../../types/dock';
import { TAB_META, TAB_TRANSLATION_KEYS } from '../dock/DockContainer';

export interface BottomDockPanelProps {
  isBottomOpen: boolean;
  bottomHeight: number;
  bottomTabs: TabId[];
  activeBottomTab: TabId;
  onSelectBottomTab: (tab: TabId) => void;
  onCloseBottom: () => void;
  onMaximizeBottom: () => void;
  onSplitterMouseDown: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  t: (key: any, defaultVal?: string) => string;
}

export const BottomDockPanel = memo(function BottomDockPanel({
  isBottomOpen,
  bottomHeight,
  bottomTabs,
  activeBottomTab,
  onSelectBottomTab,
  onCloseBottom,
  onMaximizeBottom,
  onSplitterMouseDown,
  children,
  t,
}: BottomDockPanelProps) {
  if (!isBottomOpen) return null;

  return (
    <>
      {/* Bottom Dock Panel Resizer Splitter */}
      <div
        onMouseDown={onSplitterMouseDown}
        className="h-1 bg-zinc-800 hover:bg-zinc-600 transition-colors cursor-row-resize shrink-0 z-20 flex items-center justify-center group"
        title="Drag to resize bottom panel"
      >
        <div className="w-8 h-0.5 rounded-full bg-zinc-600 group-hover:bg-zinc-400 transition" />
      </div>

      {/* Collapsible & Resizable Bottom Dock Panel */}
      <div
        style={{ height: `${bottomHeight}px` }}
        className="bg-zinc-950 border-t border-zinc-800 flex flex-col shrink-0 min-h-[140px] max-h-[70vh] relative z-10"
      >
        {/* Bottom Panel Header */}
        <div className="h-8 border-b border-zinc-800 bg-zinc-900/80 px-2.5 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-1">
            {bottomTabs.map((tab) => {
              const meta = TAB_META[tab] || { label: tab, icon: Clock };
              const Icon = meta.icon;
              const isActive = activeBottomTab === tab;
              const tabLabel = TAB_TRANSLATION_KEYS[tab]
                ? t(TAB_TRANSLATION_KEYS[tab].labelKey, meta.label)
                : meta.label;

              return (
                <button
                  key={tab}
                  onClick={() => onSelectBottomTab(tab)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xs transition ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tabLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onMaximizeBottom}
              title={t('openFullscreen')}
              className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xs transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onCloseBottom}
              title={t('collapsePanel')}
              className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xs transition"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Panel Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
});

BottomDockPanel.displayName = 'BottomDockPanel';
