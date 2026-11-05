import { useState, useCallback, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import { TabId, DockSide } from '../types/dock';
import {
  UseDockLayoutOptions,
  UseDockLayoutReturn,
  insertTabIntoList,
} from './dockLayoutUtils';

export type { UseDockLayoutOptions, UseDockLayoutReturn };

export const DOCK_LAYOUT_STORAGE_KEY = 'foliant_dock_panels_state_v1';

interface StoredDockState {
  leftOpen?: boolean;
  rightOpen?: boolean;
  isBottomOpen?: boolean;
  leftWidth?: number;
  rightWidth?: number;
  bottomHeight?: number;
  leftTabs?: TabId[];
  rightTabs?: TabId[];
  activeLeftTab?: TabId | null;
  activeRightTab?: TabId | null;
  activeBottomTab?: TabId;
}

function loadStoredDockState(): StoredDockState | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DOCK_LAYOUT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useDockLayout(options: UseDockLayoutOptions = {}): UseDockLayoutReturn {
  const {
    isDirty = false,
    persistViewFilters = false,
    onPendingNavigation,
    onResetFilters,
    onOpenWriteView,
  } = options;

  const stored = loadStoredDockState();

  const [leftOpen, setLeftOpen] = useState<boolean>(() =>
    typeof stored?.leftOpen === 'boolean' ? stored.leftOpen : true
  );
  const [rightOpen, setRightOpen] = useState<boolean>(() =>
    typeof stored?.rightOpen === 'boolean' ? stored.rightOpen : false
  );
  const [leftWidth, setLeftWidth] = useState<number>(() =>
    typeof stored?.leftWidth === 'number' ? stored.leftWidth : 270
  );
  const [rightWidth, setRightWidth] = useState<number>(() =>
    typeof stored?.rightWidth === 'number' ? stored.rightWidth : 310
  );

  const [isBottomOpen, setIsBottomOpen] = useState<boolean>(() =>
    typeof stored?.isBottomOpen === 'boolean' ? stored.isBottomOpen : false
  );
  const [bottomHeight, setBottomHeight] = useState<number>(() =>
    typeof stored?.bottomHeight === 'number' ? stored.bottomHeight : 230
  );
  const [bottomTabs] = useState<TabId[]>(['timeline', 'relationships']);
  const [activeBottomTab, setActiveBottomTab] = useState<TabId>(() =>
    stored?.activeBottomTab && ['timeline', 'relationships'].includes(stored.activeBottomTab)
      ? stored.activeBottomTab
      : 'timeline'
  );

  const [leftTabs, setLeftTabs] = useState<TabId[]>(() =>
    Array.isArray(stored?.leftTabs) && stored.leftTabs.length > 0
      ? stored.leftTabs
      : ['outline', 'search']
  );
  const [rightTabs, setRightTabs] = useState<TabId[]>(() =>
    Array.isArray(stored?.rightTabs) && stored.rightTabs.length > 0
      ? stored.rightTabs
      : ['inspector', 'context', 'characters']
  );
  const [activeLeftTab, setActiveLeftTab] = useState<TabId | null>(() =>
    stored && stored.activeLeftTab !== undefined ? stored.activeLeftTab : 'outline'
  );
  const [activeRightTab, setActiveRightTab] = useState<TabId | null>(() =>
    stored && stored.activeRightTab !== undefined ? stored.activeRightTab : 'inspector'
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const stateToStore: StoredDockState = {
        leftOpen,
        rightOpen,
        isBottomOpen,
        leftWidth,
        rightWidth,
        bottomHeight,
        leftTabs,
        rightTabs,
        activeLeftTab,
        activeRightTab,
        activeBottomTab,
      };
      localStorage.setItem(DOCK_LAYOUT_STORAGE_KEY, JSON.stringify(stateToStore));
    } catch {
      // Non-fatal if localStorage is unavailable
    }
  }, [
    leftOpen,
    rightOpen,
    isBottomOpen,
    leftWidth,
    rightWidth,
    bottomHeight,
    leftTabs,
    rightTabs,
    activeLeftTab,
    activeRightTab,
    activeBottomTab,
  ]);

  // Ensure latest layout state is flushed to localStorage upon closing/exiting the app
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleExit = () => {
      try {
        const stateToStore: StoredDockState = {
          leftOpen,
          rightOpen,
          isBottomOpen,
          leftWidth,
          rightWidth,
          bottomHeight,
          leftTabs,
          rightTabs,
          activeLeftTab,
          activeRightTab,
          activeBottomTab,
        };
        localStorage.setItem(DOCK_LAYOUT_STORAGE_KEY, JSON.stringify(stateToStore));
      } catch {
        // Non-fatal if localStorage is unavailable
      }
    };

    window.addEventListener('beforeunload', handleExit);
    return () => {
      window.removeEventListener('beforeunload', handleExit);
    };
  }, [
    leftOpen,
    rightOpen,
    isBottomOpen,
    leftWidth,
    rightWidth,
    bottomHeight,
    leftTabs,
    rightTabs,
    activeLeftTab,
    activeRightTab,
    activeBottomTab,
  ]);

  const handleOpenSearchTab = useCallback(() => {
    if (rightTabs.includes('search')) {
      setActiveRightTab('search');
      setRightOpen(true);
    } else {
      setLeftTabs((prev) => (prev.includes('search') ? prev : [...prev, 'search']));
      setActiveLeftTab('search');
      setLeftOpen(true);
    }
    onOpenWriteView?.();
  }, [rightTabs, onOpenWriteView]);

  const handleSelectLeftTab = useCallback(
    (tabId: TabId) => {
      if (isDirty && tabId !== activeLeftTab && activeLeftTab !== 'moodboard') {
        onPendingNavigation?.(() => {
          if (!persistViewFilters) {
            onResetFilters?.();
          }
          setActiveLeftTab(tabId);
        });
        return;
      }
      if (!persistViewFilters) {
        onResetFilters?.();
      }
      setActiveLeftTab(tabId);
    },
    [isDirty, activeLeftTab, persistViewFilters, onPendingNavigation, onResetFilters]
  );

  const handleSelectRightTab = useCallback(
    (tabId: TabId) => {
      if (isDirty && tabId !== activeRightTab && activeRightTab !== 'moodboard') {
        onPendingNavigation?.(() => {
          if (!persistViewFilters) {
            onResetFilters?.();
          }
          setActiveRightTab(tabId);
        });
        return;
      }
      if (!persistViewFilters) {
        onResetFilters?.();
      }
      setActiveRightTab(tabId);
    },
    [isDirty, activeRightTab, persistViewFilters, onPendingNavigation, onResetFilters]
  );

  const handleResizeLeft = useCallback((delta: number) => {
    setLeftWidth((w) => Math.max(180, Math.min(600, w + delta)));
  }, []);

  const handleResizeRight = useCallback((delta: number) => {
    setRightWidth((w) => Math.max(220, Math.min(600, w - delta)));
  }, []);

  const handleBottomSplitterMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startHeight = bottomHeight;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = startY - moveEvent.clientY;
        const newHeight = Math.max(140, Math.min(window.innerHeight * 0.7, startHeight + deltaY));
        setBottomHeight(newHeight);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [bottomHeight]
  );

  const handleDockTab = useCallback(
    (
      tabId: TabId,
      targetSide: DockSide,
      targetTabId?: TabId,
      insertPosition: 'before' | 'after' = 'after'
    ) => {
      if (targetSide === 'left') {
        setLeftTabs((prev) => insertTabIntoList(prev, tabId, targetTabId, insertPosition));
        setRightTabs((prev) => prev.filter((t) => t !== tabId));
        setActiveLeftTab(tabId);
        setLeftOpen(true);
      } else {
        setRightTabs((prev) => insertTabIntoList(prev, tabId, targetTabId, insertPosition));
        setLeftTabs((prev) => prev.filter((t) => t !== tabId));
        setActiveRightTab(tabId);
        setRightOpen(true);
      }
    },
    []
  );

  const handleRemoveTab = useCallback(
    (tabId: TabId) => {
      setLeftTabs((prev) => {
        const next = prev.filter((t) => t !== tabId);
        if (activeLeftTab === tabId) {
          setActiveLeftTab(next[0] ?? null);
        }
        return next;
      });
      setRightTabs((prev) => {
        const next = prev.filter((t) => t !== tabId);
        if (activeRightTab === tabId) {
          setActiveRightTab(next[0] ?? null);
        }
        return next;
      });
    },
    [activeLeftTab, activeRightTab]
  );

  return {
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
    isBottomOpen,
    setIsBottomOpen,
    leftWidth,
    rightWidth,
    bottomHeight,
    leftTabs,
    rightTabs,
    bottomTabs,
    activeLeftTab,
    activeRightTab,
    activeBottomTab,
    setActiveLeftTab,
    setActiveRightTab,
    setActiveBottomTab,
    handleSelectLeftTab,
    handleSelectRightTab,
    handleDockTab,
    handleRemoveTab,
    handleOpenSearchTab,
    handleResizeLeft,
    handleResizeRight,
    handleBottomSplitterMouseDown,
  };
}
