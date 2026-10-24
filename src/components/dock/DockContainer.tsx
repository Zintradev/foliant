import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Check,
  Sliders,
  Menu,
  Search,
  Rows2,
  X,
} from 'lucide-react';
import { DockSide, TabId, ALL_SYSTEM_TABS } from '../../types/dock';
import { Language } from '../../types/settings';
import { useTranslation, TranslationKey } from '../../i18n/translations';

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
  isDirty?: boolean;
  language?: Language;
  onRequestTabChange?: (tabId: TabId) => void;
}

export const TAB_TRANSLATION_KEYS: Record<TabId, { labelKey: TranslationKey; shortLabelKey: TranslationKey }> = {
  inspector: { labelKey: 'dockInspector', shortLabelKey: 'dockInspectorShort' },
  outline: { labelKey: 'dockOutline', shortLabelKey: 'dockOutlineShort' },
  timeline: { labelKey: 'dockTimeline', shortLabelKey: 'dockTimelineShort' },
  relationships: { labelKey: 'dockGraph', shortLabelKey: 'dockGraphShort' },
  storyline: { labelKey: 'dockStories', shortLabelKey: 'dockStoriesShort' },
  stats: { labelKey: 'dockStats', shortLabelKey: 'dockStatsShort' },
  context: { labelKey: 'dockNotes', shortLabelKey: 'dockNotesShort' },
  characters: { labelKey: 'dockCast', shortLabelKey: 'dockCastShort' },
  worldbuilding: { labelKey: 'dockWorld', shortLabelKey: 'dockWorldShort' },
  moodboard: { labelKey: 'dockVisuals', shortLabelKey: 'dockVisualsShort' },
  search: { labelKey: 'search', shortLabelKey: 'search' },
};

interface DragState {
  tabId: TabId;
  x: number;
  y: number;
  hoverSide: DockSide | null;
  hoverStrip?: 'top' | 'bottom';
}

export const TAB_META: Record<
  TabId,
  { label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }
> = {
  inspector: { label: 'Scene Inspector', shortLabel: 'Inspector', icon: Sliders },
  outline: { label: 'Outline', shortLabel: 'Outline', icon: BookOpen },
  timeline: { label: 'Timeline', shortLabel: 'Timeline', icon: Clock },
  relationships: { label: 'Relationships', shortLabel: 'Graph', icon: Network },
  storyline: { label: 'Storylines', shortLabel: 'Storylines', icon: GitMerge },
  stats: { label: 'Stats & Hierarchy', shortLabel: 'Stats', icon: BarChart3 },
  context: { label: 'Notes & Context', shortLabel: 'Notes', icon: BookMarked },
  characters: { label: 'Characters', shortLabel: 'Cast', icon: Users },
  worldbuilding: { label: 'Worldbuilding & Lore', shortLabel: 'World', icon: Globe },
  moodboard: { label: 'Moodboard', shortLabel: 'Moodboard', icon: ImageIcon },
  search: { label: 'Search', shortLabel: 'Search', icon: Search },
};

// Re-export canonical tab list for consumers that need it
export const ALL_TAB_IDS = ALL_SYSTEM_TABS;

/**
 * Resizable horizontal splitter handle between the top and bottom dock strips
 */
function HorizontalSplitter({
  onResize,
  onReset,
  label = 'Resize strips',
}: {
  onResize: (deltaY: number) => void;
  onReset?: () => void;
  label?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const onResizeRef = useRef(onResize);

  useEffect(() => {
    onResizeRef.current = onResize;
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startYRef.current;
      startYRef.current = moveEvent.clientY;
      onResizeRef.current(delta);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={label}
      onPointerDown={handlePointerDown}
      onDoubleClick={onReset}
      className={`group relative h-1.5 shrink-0 cursor-row-resize select-none transition-colors z-20 flex items-center justify-center ${
        isDragging ? 'bg-zinc-800' : 'bg-zinc-900/90 hover:bg-zinc-800'
      }`}
      title={`${label} (Double-click to balance)`}
    >
      <div
        className={`h-[1px] w-full transition-colors ${
          isDragging ? 'bg-zinc-400' : 'bg-zinc-800 group-hover:bg-zinc-600'
        }`}
      />
      <div className="absolute w-8 h-1 rounded-full bg-zinc-700/60 group-hover:bg-zinc-400 transition" />
    </div>
  );
}

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
  isDirty = false,
  language = 'en',
  onRequestTabChange,
}: DockContainerProps) {
  const { t } = useTranslation(language);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Subdivided Dual-Strip State
  const [isSplit, setIsSplit] = useState(false);
  const [splitRatio, setSplitRatio] = useState(0.5); // relative height of top strip (0.15 - 0.85)
  const [splitTabIds, setSplitTabIds] = useState<Set<TabId>>(new Set());
  const [activeTopTab, setActiveTopTab] = useState<TabId | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<TabId | null>(null);

  const containerRef = useRef<HTMLElement | null>(null);

  // Module Picker State
  const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false);
  const [moduleMenuStrip, setModuleMenuStrip] = useState<'top' | 'bottom'>('top');
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const activeListenersRef = useRef<{ cleanup: () => void } | null>(null);
  const topMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const bottomMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const portalMenuRef = useRef<HTMLDivElement | null>(null);

  // Keep splitTabIds synchronized with currently present tabs
  useEffect(() => {
    setSplitTabIds((prev) => {
      const filtered = new Set([...prev].filter((id) => tabs.includes(id)));
      if (filtered.size !== prev.size) {
        return filtered;
      }
      return prev;
    });
  }, [tabs]);

  // Derive partitioned tabs for top and bottom strips
  const topTabs = useMemo(() => {
    if (!isSplit) return tabs;
    return tabs.filter((t) => !splitTabIds.has(t));
  }, [tabs, isSplit, splitTabIds]);

  const bottomTabs = useMemo(() => {
    if (!isSplit) return [];
    return tabs.filter((t) => splitTabIds.has(t));
  }, [tabs, isSplit, splitTabIds]);

  // Determine currently active tab for each strip
  const currentTopTab = useMemo(() => {
    if (!isSplit) {
      return activeTab && tabs.includes(activeTab) ? activeTab : tabs[0] || null;
    }
    return activeTopTab && topTabs.includes(activeTopTab) ? activeTopTab : topTabs[0] || null;
  }, [isSplit, activeTab, tabs, activeTopTab, topTabs]);

  const currentBottomTab = useMemo(() => {
    if (!isSplit) return null;
    return activeBottomTab && bottomTabs.includes(activeBottomTab)
      ? activeBottomTab
      : bottomTabs[0] || null;
  }, [isSplit, activeBottomTab, bottomTabs]);

  // Toggle Subdivided Dual Strip
  const toggleSplit = useCallback(() => {
    setIsSplit((prev) => {
      if (!prev) {
        // Splitting into two strips:
        if (tabs.length >= 2) {
          const bottomSet = new Set(tabs.slice(1));
          setSplitTabIds(bottomSet);
          setActiveTopTab(tabs[0]);
          setActiveBottomTab(tabs[1]);
        } else if (tabs.length === 1) {
          setSplitTabIds(new Set());
          setActiveTopTab(tabs[0]);
          setActiveBottomTab(null);
        } else {
          setSplitTabIds(new Set());
          setActiveTopTab(null);
          setActiveBottomTab(null);
        }
        return true;
      } else {
        // Merging back into single strip:
        setSplitTabIds(new Set());
        return false;
      }
    });
  }, [tabs]);

  // Horizontal splitter resizing
  const handleHorizontalResize = useCallback((deltaY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.height <= 0) return;
    setSplitRatio((prev) => {
      const next = prev + deltaY / rect.height;
      return Math.min(0.85, Math.max(0.15, next));
    });
  }, []);

  const handleHorizontalReset = useCallback(() => {
    setSplitRatio(0.5);
  }, []);

  // Clean up any dangling global listeners on unmount
  useEffect(() => {
    return () => {
      activeListenersRef.current?.cleanup();
    };
  }, []);

  // Update floating portal menu position via getBoundingClientRect
  useEffect(() => {
    if (!isModuleMenuOpen) return;

    const updateMenuPosition = () => {
      const buttonEl =
        moduleMenuStrip === 'bottom' ? bottomMenuButtonRef.current : topMenuButtonRef.current;

      if (buttonEl) {
        const rect = buttonEl.getBoundingClientRect();
        const menuWidth = 224; // w-56
        let left = side === 'right' ? rect.right - menuWidth : rect.left;
        if (left < 8) left = 8;
        if (left + menuWidth > window.innerWidth - 8) {
          left = window.innerWidth - menuWidth - 8;
        }
        setMenuPosition({
          top: rect.bottom + 4,
          left,
        });
      }
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isModuleMenuOpen, side, moduleMenuStrip]);

  // Close module menu when clicking outside
  useEffect(() => {
    if (!isModuleMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const currentButton =
        moduleMenuStrip === 'bottom' ? bottomMenuButtonRef.current : topMenuButtonRef.current;

      if (
        currentButton &&
        !currentButton.contains(target) &&
        portalMenuRef.current &&
        !portalMenuRef.current.contains(target)
      ) {
        setIsModuleMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isModuleMenuOpen, moduleMenuStrip]);

  // Pointer-Driven Tab Drag & Drop System
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    tabId: TabId,
    strip: 'top' | 'bottom' = 'top'
  ) => {
    if (e.button !== 0) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;

    const clearDragDomAttributes = () => {
      document.querySelectorAll('[data-dock-side]').forEach((node) => {
        node.removeAttribute('data-drag-over');
      });
      document.querySelectorAll('[data-dock-strip]').forEach((node) => {
        node.removeAttribute('data-strip-drag-over');
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
        const targetStripEl = elementUnderPointer?.closest(
          '[data-dock-strip]'
        ) as HTMLElement | null;
        const targetStrip =
          (targetStripEl?.dataset.dockStrip as 'top' | 'bottom') || undefined;
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

        document.querySelectorAll('[data-dock-strip]').forEach((node) => {
          if (node === targetStripEl) {
            node.setAttribute('data-strip-drag-over', 'true');
          } else {
            node.removeAttribute('data-strip-drag-over');
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
          hoverStrip: targetStrip,
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
          const targetStripEl = elementUnderPointer?.closest(
            '[data-dock-strip]'
          ) as HTMLElement | null;
          const targetStrip =
            (targetStripEl?.dataset.dockStrip as 'top' | 'bottom') || 'top';
          const targetTabEl = elementUnderPointer?.closest(
            '[data-dock-tab-id]'
          ) as HTMLElement | null;
          const targetTabId = targetTabEl?.dataset.dockTabId as TabId | undefined;

          if (isDirty) {
            const proceed = window.confirm(
              'You have unsaved edits. Are you sure you want to switch tabs? Changes will be lost.'
            );
            if (!proceed) {
              setDragState(null);
              return;
            }
          }

          if (targetSide === side && isSplit) {
            // Reposition between top and bottom strips within the same dock
            if (targetStrip === 'bottom') {
              setSplitTabIds((prev) => new Set([...prev, tabId]));
              setActiveBottomTab(tabId);
            } else {
              setSplitTabIds((prev) => {
                const next = new Set(prev);
                next.delete(tabId);
                return next;
              });
              setActiveTopTab(tabId);
            }

            if (targetTabId && targetTabId !== tabId) {
              const rect = targetTabEl!.getBoundingClientRect();
              const isBefore = upEvent.clientX < rect.left + rect.width / 2;
              onDockTab(tabId, targetSide, targetTabId, isBefore ? 'before' : 'after');
            }
          } else {
            // Dropped onto opposite dock or unsplit dock
            setSplitTabIds((prev) => {
              const next = new Set(prev);
              next.delete(tabId);
              return next;
            });

            if (targetTabId && targetTabId !== tabId) {
              const rect = targetTabEl!.getBoundingClientRect();
              const isBefore = upEvent.clientX < rect.left + rect.width / 2;
              onDockTab(tabId, targetSide, targetTabId, isBefore ? 'before' : 'after');
            } else {
              onDockTab(tabId, targetSide);
            }
          }
        }

        setDragState(null);
      } else {
        // Regular Click Selection
        const activeCurrent = strip === 'bottom' ? currentBottomTab : currentTopTab;
        if (tabId !== activeCurrent && isDirty) {
          if (onRequestTabChange) {
            onRequestTabChange(tabId);
            return;
          }
          const proceed = window.confirm(
            'You have unsaved edits. Are you sure you want to switch tabs? Changes will be lost.'
          );
          if (!proceed) return;
        }

        if (strip === 'bottom') {
          setActiveBottomTab(tabId);
        } else {
          setActiveTopTab(tabId);
          onSelectTab(tabId);
        }
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

  const CloseIcon = side === 'left' ? PanelLeftClose : PanelRightClose;

  // Helper renderer for a strip's tab bar
  const renderStripTabBar = (
    strip: 'top' | 'bottom',
    stripTabs: TabId[],
    activeStripTab: TabId | null
  ) => {
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
                onPointerDown={(e) => handlePointerDown(e, tabId, strip)}
                title={`${tabLabel} — ${t('dragToDockOrReorder', 'Drag to dock or reorder')}`}
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
                <span className="truncate max-w-[85px] pointer-events-none">{tabShort}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-0.5 pb-1 shrink-0 relative">
          {/* Subdivide Dual-Strip Button (Only in Top Strip header) */}
          {strip === 'top' && (
            <button
              onClick={toggleSplit}
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
            ref={strip === 'bottom' ? bottomMenuButtonRef : topMenuButtonRef}
            onClick={() => {
              setModuleMenuStrip(strip);
              setIsModuleMenuOpen(!isModuleMenuOpen || moduleMenuStrip !== strip);
            }}
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
              onClick={toggleSplit}
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
  };

  if (!isOpen) return null;

  return (
    <>
      <aside
        ref={containerRef}
        data-dock-side={side}
        style={width ? { width: `${width}px` } : undefined}
        className={`shrink-0 border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden transition-[width] duration-75 select-none relative ${
          side === 'left' ? 'border-r' : 'border-l'
        } data-[drag-over=true]:bg-zinc-900/95`}
      >
        {!isSplit ? (
          /* ================= SINGLE FULL STRIP MODE ================= */
          <div className="flex flex-col h-full w-full overflow-hidden" data-dock-strip="top">
            {renderStripTabBar('top', topTabs, currentTopTab)}
            <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950">
              {currentTopTab ? (
                renderView(currentTopTab)
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
          </div>
        ) : (
          /* ================= DUAL SUBDIVIDED STRIPS MODE ================= */
          <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Top Strip */}
            <div
              data-dock-strip="top"
              style={{ height: `${splitRatio * 100}%` }}
              className="flex flex-col overflow-hidden min-h-[100px]"
            >
              {renderStripTabBar('top', topTabs, currentTopTab)}
              <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950">
                {currentTopTab ? (
                  renderView(currentTopTab)
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center text-zinc-500 gap-1.5">
                    <PlusCircle className="w-5 h-5 text-zinc-600" />
                    <p className="text-xs font-medium text-zinc-300">Empty Top Strip</p>
                    <p className="text-[10px] text-zinc-500 max-w-[150px] leading-relaxed">
                      Click + above or drag tabs here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Splitter Handle */}
            <HorizontalSplitter
              onResize={handleHorizontalResize}
              onReset={handleHorizontalReset}
              label={t('resizeStrips', 'Resize panel strips')}
            />

            {/* Bottom Strip */}
            <div
              data-dock-strip="bottom"
              className="flex-1 flex flex-col overflow-hidden min-h-[100px]"
            >
              {renderStripTabBar('bottom', bottomTabs, currentBottomTab)}
              <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950">
                {currentBottomTab ? (
                  renderView(currentBottomTab)
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center text-zinc-500 gap-1.5">
                    <PlusCircle className="w-5 h-5 text-zinc-600" />
                    <p className="text-xs font-medium text-zinc-300">Empty Bottom Strip</p>
                    <p className="text-[10px] text-zinc-500 max-w-[150px] leading-relaxed">
                      Click + above or drag tabs here to view side by side.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Portal Module Toggle Picker */}
        {isModuleMenuOpen &&
          menuPosition &&
          createPortal(
            <div
              ref={portalMenuRef}
              style={{
                position: 'absolute',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
              className="w-56 bg-zinc-900 border border-zinc-800 rounded-sm shadow-2xl p-1 z-[99999] animate-in fade-in zoom-in-95 duration-75 select-none"
            >
              <div className="px-2 py-1 text-[10px] font-mono text-zinc-500 border-b border-zinc-800 mb-1 tracking-widest">
                {t('modulesToggleTitle', 'MODULES — CLICK TO TOGGLE')}
              </div>
              {ALL_TAB_IDS.map((id) => {
                const meta = TAB_META[id];
                const Icon = meta.icon;
                const activeStripTabs = moduleMenuStrip === 'bottom' ? bottomTabs : topTabs;
                const isVisibleInStrip = activeStripTabs.includes(id);
                const isVisibleInPanel = tabs.includes(id);

                const itemLabel = TAB_TRANSLATION_KEYS[id]
                  ? t(TAB_TRANSLATION_KEYS[id].labelKey, meta.label)
                  : meta.label;

                return (
                  <button
                    key={id}
                    onClick={() => {
                      if (isDirty) {
                        if (onRequestTabChange) {
                          onRequestTabChange(id);
                          return;
                        }
                        const proceed = window.confirm(
                          t(
                            'unsavedChangesConfirm',
                            'You have unsaved edits. Are you sure you want to switch tabs? Changes will be lost.'
                          )
                        );
                        if (!proceed) return;
                      }

                      if (isSplit) {
                        if (moduleMenuStrip === 'bottom') {
                          if (isVisibleInStrip) {
                            // Remove from bottom strip and panel
                            setSplitTabIds((prev) => {
                              const next = new Set(prev);
                              next.delete(id);
                              return next;
                            });
                            onRemoveTab(id);
                          } else {
                            // Add or move to bottom strip
                            setSplitTabIds((prev) => new Set([...prev, id]));
                            if (!isVisibleInPanel) {
                              onDockTab(id, side);
                            }
                            setActiveBottomTab(id);
                          }
                        } else {
                          if (isVisibleInStrip) {
                            // Remove from top strip and panel
                            onRemoveTab(id);
                          } else {
                            // Add or move to top strip
                            setSplitTabIds((prev) => {
                              const next = new Set(prev);
                              next.delete(id);
                              return next;
                            });
                            if (!isVisibleInPanel) {
                              onDockTab(id, side);
                            }
                            setActiveTopTab(id);
                          }
                        }
                      } else {
                        if (isVisibleInPanel) {
                          onRemoveTab(id);
                        } else {
                          onDockTab(id, side);
                        }
                      }

                      setIsModuleMenuOpen(false);
                    }}
                    title={
                      isVisibleInStrip
                        ? `${t('hide')} ${itemLabel}`
                        : `${t('show')} ${itemLabel}`
                    }
                    className={`flex items-center justify-between w-full px-2 py-1.5 rounded-sm text-xs text-left transition group cursor-pointer ${
                      isVisibleInStrip
                        ? 'bg-zinc-800/70 text-zinc-100'
                        : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isVisibleInStrip
                            ? 'text-zinc-200'
                            : 'text-zinc-500 group-hover:text-zinc-400'
                        }`}
                      />
                      <span className={isVisibleInStrip ? 'font-medium' : ''}>{itemLabel}</span>
                    </div>
                    {isVisibleInStrip ? (
                      <Check className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-zinc-600 font-mono">+</span>
                    )}
                  </button>
                );
              })}
            </div>,
            document.body
          )}
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
                {dragState.hoverSide} panel {dragState.hoverStrip ? `(${dragState.hoverStrip})` : ''}
              </span>
            )}
          </div>,
          document.body
        )}
    </>
  );
}