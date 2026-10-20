import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  BookMarked,
  Image as ImageIcon,
  Users,
  GitMerge,
  BarChart3,
  Clock,
  Network,
  PanelLeftClose,
  PanelRightClose,
  GripVertical,
  PlusCircle,
  Globe,
  Plus,
  Check,
} from 'lucide-react';
import { DockSide, TabId, ALL_SYSTEM_TABS } from '../../types/dock';

interface DockContainerProps {
  side: DockSide;
  isOpen: boolean;
  onToggleOpen: () => void;
  tabs: TabId[];
  activeTab: TabId | null;
  onSelectTab: (tabId: TabId) => void;
  onDockTab: (
    tabId: TabId,
    targetSide: DockSide,
    targetTabId?: TabId,
    insertPosition?: 'before' | 'after'
  ) => void;
  renderView: (tabId: TabId) => React.ReactNode;
  width?: number;
  onRemoveTab: (tabId: TabId) => void;
}

interface DragState {
  tabId: TabId;
  x: number;
  y: number;
  hoverSide: DockSide | null;
}

export const TAB_META: Record<
  TabId,
  { label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }
> = {
  outline: { label: 'Outline', shortLabel: 'Outline', icon: BookOpen },
  timeline: { label: 'Timeline', shortLabel: 'Timeline', icon: Clock },
  relationships: { label: 'Relationships', shortLabel: 'Graph', icon: Network },
  storyline: { label: 'Storylines', shortLabel: 'Storylines', icon: GitMerge },
  stats: { label: 'Stats & Hierarchy', shortLabel: 'Stats', icon: BarChart3 },
  context: { label: 'Notes & Context', shortLabel: 'Notes', icon: BookMarked },
  characters: { label: 'Characters', shortLabel: 'Cast', icon: Users },
  worldbuilding: { label: 'Worldbuilding & Lore', shortLabel: 'World', icon: Globe },
  moodboard: { label: 'Moodboard', shortLabel: 'Moodboard', icon: ImageIcon },
};

// Re-export canonical tab list for consumers that need it
export const ALL_TAB_IDS = ALL_SYSTEM_TABS;

export default function DockContainer({
  side,
  isOpen,
  onToggleOpen,
  tabs,
  activeTab,
  onSelectTab,
  onDockTab,
  renderView,
  width,
  onRemoveTab,
}: DockContainerProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false);
  const activeListenersRef = useRef<{ cleanup: () => void } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Clean up any dangling global listeners on unmount
  useEffect(() => {
    return () => {
      activeListenersRef.current?.cleanup();
    };
  }, []);

  // Close module menu when clicking outside
  useEffect(() => {
    if (!isModuleMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsModuleMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isModuleMenuOpen]);

  if (!isOpen) return null;

  const currentTab = activeTab && tabs.includes(activeTab) ? activeTab : tabs[0] ?? null;
  const CloseIcon = side === 'left' ? PanelLeftClose : PanelRightClose;

  // ---------------------------------------------------------------------------
  // Pointer-Driven Tab Drag & Drop System
  // ---------------------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, tabId: TabId) => {
    if (e.button !== 0) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;

    const clearDragDomAttributes = () => {
      document.querySelectorAll('[data-dock-side]').forEach((node) => {
        node.removeAttribute('data-drag-over');
      });
      document.querySelectorAll('[data-dock-tab-id]').forEach((node) => {
        node.removeAttribute('data-tab-drag-target');
      });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      if (!isDragging && Math.hypot(deltaX, deltaY) > 5) {
        isDragging = true;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }

      if (isDragging) {
        const elementUnderPointer = document.elementFromPoint(
          moveEvent.clientX,
          moveEvent.clientY
        );
        const targetDock = elementUnderPointer?.closest('[data-dock-side]') as HTMLElement | null;
        const targetSide = (targetDock?.dataset.dockSide as DockSide) || null;
        const targetTabEl = elementUnderPointer?.closest(
          '[data-dock-tab-id]'
        ) as HTMLElement | null;

        document.querySelectorAll('[data-dock-side]').forEach((node) => {
          if (node === targetDock) {
            node.setAttribute('data-drag-over', 'true');
          } else {
            node.removeAttribute('data-drag-over');
          }
        });

        document.querySelectorAll('[data-dock-tab-id]').forEach((node) => {
          if (node === targetTabEl && targetTabEl.dataset.dockTabId !== tabId) {
            node.setAttribute('data-tab-drag-target', 'true');
          } else {
            node.removeAttribute('data-tab-drag-target');
          }
        });

        setDragState({
          tabId,
          x: moveEvent.clientX,
          y: moveEvent.clientY,
          hoverSide: targetSide,
        });
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      activeListenersRef.current?.cleanup();
      clearDragDomAttributes();

      if (isDragging) {
        const elementUnderPointer = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        const targetDock = elementUnderPointer?.closest('[data-dock-side]') as HTMLElement | null;

        if (targetDock) {
          const targetSide = targetDock.dataset.dockSide as DockSide;
          const targetTabEl = elementUnderPointer?.closest(
            '[data-dock-tab-id]'
          ) as HTMLElement | null;
          const targetTabId = targetTabEl?.dataset.dockTabId as TabId | undefined;

          if (targetTabId && targetTabId !== tabId) {
            const rect = targetTabEl!.getBoundingClientRect();
            const isBefore = upEvent.clientX < rect.left + rect.width / 2;
            onDockTab(tabId, targetSide, targetTabId, isBefore ? 'before' : 'after');
          } else {
            onDockTab(tabId, targetSide);
          }
        }

        setDragState(null);
      } else {
        onSelectTab(tabId);
      }
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      clearDragDomAttributes();
      activeListenersRef.current = null;
    };

    activeListenersRef.current = { cleanup };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  return (
    <>
      <aside
        data-dock-side={side}
        style={width ? { width: `${width}px` } : undefined}
        className={`shrink-0 border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden transition-[width] duration-75 select-none relative ${
          side === 'left' ? 'border-r' : 'border-l'
        } data-[drag-over=true]:bg-zinc-900/95`}
      >
        {/* Header Tabs Bar */}
        <div className="flex items-center justify-between border-b px-1 pt-1 min-h-[34px] bg-zinc-900/60 border-zinc-800">
          <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar flex-1 mr-1">
            {tabs.map((tabId) => {
              const meta = TAB_META[tabId];
              if (!meta) return null;
              const Icon = meta.icon;
              const isActive = currentTab === tabId;
              const isBeingDragged = dragState?.tabId === tabId;

              return (
                <div
                  key={tabId}
                  data-dock-tab-id={tabId}
                  onPointerDown={(e) => handlePointerDown(e, tabId)}
                  title={`${meta.label} — Drag to dock or reorder`}
                  className={`group relative flex items-center gap-1.5 px-2 py-1 rounded-t-sm text-xs transition cursor-grab active:cursor-grabbing border-b-2 select-none touch-none ${
                    isActive
                      ? 'bg-zinc-900 text-zinc-100 font-medium border-zinc-200'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border-transparent'
                  } ${
                    isBeingDragged
                      ? 'opacity-40 border-dashed border-zinc-500'
                      : ''
                  } data-[tab-drag-target=true]:border-zinc-300 data-[tab-drag-target=true]:bg-zinc-800/80`}
                >
                  <GripVertical className="w-2.5 h-2.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5" />
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  />
                  <span className="truncate max-w-[90px] pointer-events-none">{meta.shortLabel}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-0.5 pb-1 shrink-0 relative" ref={menuRef}>
            {/* Module Picker — access all project modules from this panel */}
            <button
              onClick={() => setIsModuleMenuOpen(!isModuleMenuOpen)}
              title="Add or open modules in this panel"
              className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              aria-label="Add or switch module"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Module Toggle Picker — click to show/hide each module in this panel */}
            {isModuleMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-sm shadow-xl p-1 z-40 animate-in fade-in zoom-in-95 duration-75">
                <div className="px-2 py-1 text-[10px] font-mono text-zinc-500 border-b border-zinc-800 mb-1 tracking-widest">
                  MODULES — CLICK TO TOGGLE
                </div>
                {ALL_TAB_IDS.map((id) => {
                  const meta = TAB_META[id];
                  const Icon = meta.icon;
                  // True toggle state: is this tab currently visible in this panel?
                  const isVisible = tabs.includes(id);

                  return (
                    <button
                      key={id}
                      onClick={() => {
                        if (isVisible) {
                          // TOGGLE OFF — remove from this panel entirely
                          onRemoveTab(id);
                        } else {
                          // TOGGLE ON — add to this panel (removed from opposite if needed)
                          onDockTab(id, side);
                        }
                        setIsModuleMenuOpen(false);
                      }}
                      title={isVisible ? `Hide ${meta.label} from this panel` : `Show ${meta.label} in this panel`}
                      className={`flex items-center justify-between w-full px-2 py-1.5 rounded-sm text-xs text-left transition group ${
                        isVisible
                          ? 'bg-zinc-800/70 text-zinc-100'
                          : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isVisible ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-400'
                          }`}
                        />
                        <span className={isVisible ? 'font-medium' : ''}>{meta.label}</span>
                      </div>
                      {/* Visual toggle indicator */}
                      {isVisible ? (
                        <Check className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-mono">+</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={onToggleOpen}
              title="Collapse Panel"
              className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              aria-label="Collapse Panel"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dock Content Body */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950">
          {currentTab ? (
            renderView(currentTab)
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-zinc-500 gap-2">
              <PlusCircle className="w-6 h-6 text-zinc-600" />
              <p className="text-xs font-medium text-zinc-300">Empty Panel</p>
              <p className="text-[11px] text-zinc-500 max-w-[170px] leading-relaxed">
                Click + above or drag any tab header here to dock it in this panel.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Floating Drag Preview Pill */}
      {dragState &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: `${dragState.x + 10}px`,
              top: `${dragState.y + 10}px`,
              zIndex: 99999,
              pointerEvents: 'none',
            }}
            className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs font-medium shadow-lg backdrop-blur-xs"
          >
            <GripVertical className="w-3 h-3 text-zinc-400" />
            {(() => {
              const DragIcon = TAB_META[dragState.tabId].icon;
              return <DragIcon className="w-3.5 h-3.5 text-zinc-300" />;
            })()}
            <span>{TAB_META[dragState.tabId].label}</span>
            {dragState.hoverSide && (
              <span className="text-[9px] px-1 py-0.2 rounded-xs bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono uppercase tracking-wider ml-1">
                {dragState.hoverSide} panel
              </span>
            )}
          </div>,
          document.body
        )}
    </>
  );
}