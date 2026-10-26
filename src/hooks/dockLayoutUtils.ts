import { TabId, DockSide } from '../types/dock';
import { type MouseEvent as ReactMouseEvent } from 'react';

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

export function insertTabIntoList(
  tabs: TabId[],
  tabId: TabId,
  targetTabId?: TabId,
  insertPosition: 'before' | 'after' = 'after'
): TabId[] {
  const next = tabs.filter((t) => t !== tabId);
  if (!targetTabId) {
    next.push(tabId);
  } else {
    const idx = next.indexOf(targetTabId);
    if (idx === -1) {
      next.push(tabId);
    } else {
      const insertIdx = insertPosition === 'before' ? idx : idx + 1;
      next.splice(insertIdx, 0, tabId);
    }
  }
  return next;
}
