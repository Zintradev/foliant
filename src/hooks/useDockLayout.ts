import { useState, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import { TabId, DockSide } from '../types/dock';

export interface UseDockLayoutOptions {
  isDirty?: boolean;
  persistViewFilters?: boolean;
  onPendingNavigation?: (action: () => void) => void;
  onResetFilters?: () => void;
  onOpenWriteView?: () => void;
}

export interface UseDockLayoutReturn {
  // Panel Visibility
  leftOpen: boolean;
  setLeftOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  rightOpen: boolean;
  setRightOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isBottomOpen: boolean;
  setIsBottomOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

  // Panel Dimensions
  leftWidth: number;
  rightWidth: number;
  bottomHeight: number;

  // Tabs Configuration
  leftTabs: TabId[];
  rightTabs: TabId[];
  bottomTabs: TabId[];
  activeLeftTab: TabId | null;
  activeRightTab: TabId | null;
  activeBottomTab: TabId;

  // Tab Selection
  setActiveLeftTab: (tabId: TabId | null) => void;
  setActiveRightTab: (tabId: TabId | null) => void;
  setActiveBottomTab: (tabId: TabId) => void;
  handleSelectLeftTab: (tabId: TabId) => void;
  handleSelectRightTab: (tabId: TabId) => void;

  // Dock Drag & Movement
  handleDockTab: (
    tabId: TabId,
    targetSide: DockSide,
    targetTabId?: TabId,
    insertPosition?: 'before' | 'after'
  ) => void;
  handleRemoveTab: (tabId: TabId) => void;
  handleOpenSearchTab: () => void;

  // Resizing Handlers
  handleResizeLeft: (delta: number) => void;
  handleResizeRight: (delta: number) => void;
  handleBottomSplitterMouseDown: (e: ReactMouseEvent) => void;
}

/**
 * useDockLayout:
 * Manages all multi-panel workspace docking state:
 * - Collapsible and resizable left, right, and bottom strips
 * - Active tab selection and persistent view filter resets
 * - Drag-and-drop tab docking and panel partitioning
 * - Splitter dragging with viewport constraints
 */
export function useDockLayout(options: UseDockLayoutOptions = {}): UseDockLayoutReturn {
  const {
    isDirty = false,
    persistViewFilters = false,
    onPendingNavigation,
    onResetFilters,
    onOpenWriteView,
  } = options;

  // Sidebar Visibility & Resizable Dimensions State
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState<number>(270);
  const [rightWidth, setRightWidth] = useState<number>(310);

  // Bottom Dock Panel State (Collapsible & Resizable)
  const [isBottomOpen, setIsBottomOpen] = useState<boolean>(false);
  const [bottomHeight, setBottomHeight] = useState<number>(230);
  const [bottomTabs] = useState<TabId[]>(['timeline', 'relationships']);
  const [activeBottomTab, setActiveBottomTab] = useState<TabId>('timeline');

  // Dockable Tabs State
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
      setLeftTabs((prevLeft) => {
        const nextLeft = prevLeft.filter((t) => t !== tabId);
        if (targetSide === 'left') {
          if (!targetTabId) {
            nextLeft.push(tabId);
          } else {
            const idx = nextLeft.indexOf(targetTabId);
            if (idx === -1) {
              nextLeft.push(tabId);
            } else {
              const insertIdx = insertPosition === 'before' ? idx : idx + 1;
              nextLeft.splice(insertIdx, 0, tabId);
            }
          }
        }
        return nextLeft;
      });

      setRightTabs((prevRight) => {
        const nextRight = prevRight.filter((t) => t !== tabId);
        if (targetSide === 'right') {
          if (!targetTabId) {
            nextRight.push(tabId);
          } else {
            const idx = nextRight.indexOf(targetTabId);
            if (idx === -1) {
              nextRight.push(tabId);
            } else {
              const insertIdx = insertPosition === 'before' ? idx : idx + 1;
              nextRight.splice(insertIdx, 0, tabId);
            }
          }
        }
        return nextRight;
      });

      if (targetSide === 'left') {
        setActiveLeftTab(tabId);
        setLeftOpen(true);
      } else {
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
