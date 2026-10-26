import { useState, useEffect, useCallback, useMemo } from 'react';
import { TabId } from '../../../types/dock';

interface UseDockSplitParams {
  tabs: TabId[];
  activeTab: TabId | null;
  containerRef: React.RefObject<HTMLElement | null>;
}

export function useDockSplit({ tabs, activeTab, containerRef }: UseDockSplitParams) {
  const [isSplit, setIsSplit] = useState(false);
  const [splitRatio, setSplitRatio] = useState(0.5); // relative height of top strip (0.15 - 0.85)
  const [splitTabIds, setSplitTabIds] = useState<Set<TabId>>(new Set());
  const [activeTopTab, setActiveTopTab] = useState<TabId | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<TabId | null>(null);

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
  }, [containerRef]);

  const handleHorizontalReset = useCallback(() => {
    setSplitRatio(0.5);
  }, []);

  return {
    isSplit,
    splitRatio,
    splitTabIds,
    setSplitTabIds,
    activeTopTab,
    setActiveTopTab,
    activeBottomTab,
    setActiveBottomTab,
    topTabs,
    bottomTabs,
    currentTopTab,
    currentBottomTab,
    toggleSplit,
    handleHorizontalResize,
    handleHorizontalReset,
  };
}
