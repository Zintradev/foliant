import { useState, useRef, useEffect } from 'react';
import { DockSide, TabId } from '../../../types/dock';
import { DragState } from './types';

interface UseDockDragAndDropParams {
  side: DockSide;
  isSplit: boolean;
  currentTopTab: TabId | null;
  currentBottomTab: TabId | null;
  isDirty?: boolean;
  onSelectTab: (tabId: TabId) => void;
  onDockTab: (
    tabId: TabId,
    targetSide: DockSide,
    targetTabId?: TabId,
    insertPosition?: 'before' | 'after'
  ) => void;
  onRequestTabChange?: (tabId: TabId) => void;
  setSplitTabIds: React.Dispatch<React.SetStateAction<Set<TabId>>>;
  setActiveTopTab: (tabId: TabId) => void;
  setActiveBottomTab: (tabId: TabId) => void;
}

export function useDockDragAndDrop({
  side,
  isSplit,
  currentTopTab,
  currentBottomTab,
  isDirty = false,
  onSelectTab,
  onDockTab,
  onRequestTabChange,
  setSplitTabIds,
  setActiveTopTab,
  setActiveBottomTab,
}: UseDockDragAndDropParams) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const activeListenersRef = useRef<{ cleanup: () => void } | null>(null);

  // Clean up any dangling global listeners on unmount
  useEffect(() => {
    return () => {
      activeListenersRef.current?.cleanup();
    };
  }, []);

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

  return {
    dragState,
    handlePointerDown,
  };
}
