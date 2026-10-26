import React from 'react';
import { DockSide, TabId } from '../../../types/dock';
import { Language } from '../../../types/settings';

export interface DockContainerProps {
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

export interface DragState {
  tabId: TabId;
  x: number;
  y: number;
  hoverSide: DockSide | null;
  hoverStrip?: 'top' | 'bottom';
}
