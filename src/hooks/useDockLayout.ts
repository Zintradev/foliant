import { useState, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import { TabId, DockSide } from '../types/dock';
import {
  UseDockLayoutOptions,
  UseDockLayoutReturn,
  insertTabIntoList,
} from './dockLayoutUtils';

export type { UseDockLayoutOptions, UseDockLayoutReturn };

export function useDockLayout(options: UseDockLayoutOptions = {}): UseDockLayoutReturn {
  const {
    isDirty = false,
    persistViewFilters = false,
    onPendingNavigation,
    onResetFilters,
    onOpenWriteView,
  } = options;

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState<number>(270);
  const [rightWidth, setRightWidth] = useState<number>(310);

  const [isBottomOpen, setIsBottomOpen] = useState<boolean>(false);
  const [bottomHeight, setBottomHeight] = useState<number>(230);
  const [bottomTabs] = useState<TabId[]>(['timeline', 'relationships']);
  const [activeBottomTab, setActiveBottomTab] = useState<TabId>('timeline');

  const [leftTabs, setLeftTabs] = useState<TabId[]>(['outline', 'search']);
  const [rightTabs, setRightTabs] = useState<TabId[]>(['inspector', 'context', 'characters']);
  const [activeLeftTab, setActiveLeftTab] = useState<TabId | null>('outline');
  const [activeRightTab, setActiveRightTab] = useState<TabId | null>('inspector');

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
      if (isDirty && tabId !== activeLeftTab) {
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
      if (isDirty && tabId !== activeRightTab) {
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
