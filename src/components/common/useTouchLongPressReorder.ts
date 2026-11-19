import React, { useRef, useCallback, useEffect, useState } from 'react';

export interface UseTouchLongPressReorderOptions {
  id: string;
  index: number;
  onStart: (id: string, index: number) => void;
  onMove: (clientY: number, clientX: number) => void;
  onEnd: () => void;
  onCancel?: () => void;
  delayMs?: number; // default: 500ms (0.5 seconds)
  moveThreshold?: number; // default: 10px
}

function findScrollContainers(el: HTMLElement | null): HTMLElement[] {
  const containers: HTMLElement[] = [];
  if (typeof window === 'undefined' || typeof document === 'undefined') return containers;

  let curr = el?.parentElement;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    try {
      const style = window.getComputedStyle(curr);
      const overflowY = style.overflowY;
      const overflow = style.overflow;
      if (
        overflowY === 'auto' ||
        overflowY === 'scroll' ||
        overflow === 'auto' ||
        overflow === 'scroll'
      ) {
        if (!containers.includes(curr)) {
          containers.push(curr);
        }
      }
    } catch {
      // fallback
    }
    curr = curr.parentElement;
  }

  // Also query nearest common scrollable class names if none found
  if (containers.length === 0 && el) {
    const parentContainer = el.closest(
      '.overflow-y-auto, .overflow-auto, [data-scroll-container]'
    ) as HTMLElement | null;
    if (parentContainer && !containers.includes(parentContainer)) {
      containers.push(parentContainer);
    }
  }

  // Always include document.scrollingElement, document.documentElement, or body
  const docScroll =
    (document.scrollingElement as HTMLElement) || document.documentElement || document.body;
  if (docScroll && !containers.includes(docScroll)) {
    containers.push(docScroll);
  }

  return containers;
}

export function useTouchLongPressReorder({
  id,
  index,
  onStart,
  onMove,
  onEnd,
  onCancel,
  delayMs = 500,
  moveThreshold = 10,
}: UseTouchLongPressReorderOptions) {
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [isHolding, setIsHolding] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const isHoldingRef = useRef(false);
  const didJustDragRef = useRef(false);
  const cloneRef = useRef<HTMLElement | null>(null);
  const targetElRef = useRef<HTMLElement | null>(null);
  const grabOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cleanupListenersRef = useRef<(() => void) | null>(null);

  const scrollContainersRef = useRef<HTMLElement[]>([]);
  const scrollContainerPaddingsRef = useRef<Array<{ el: HTMLElement; prevPadding: string }>>([]);
  const autoScrollSpeedRef = useRef<number>(0);
  const autoScrollRafRef = useRef<number | null>(null);
  const lastPointerCoordsRef = useRef<{ x: number; y: number } | null>(null);

  // Keep references to latest callbacks and params to prevent stale closures
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const idRef = useRef(id);
  idRef.current = id;
  const indexRef = useRef(index);
  indexRef.current = index;

  const stopAutoScroll = useCallback(() => {
    autoScrollSpeedRef.current = 0;
    if (autoScrollRafRef.current !== null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  const autoScrollStep = useCallback(() => {
    if (!isDraggingRef.current || autoScrollSpeedRef.current === 0) {
      if (autoScrollRafRef.current !== null) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
      return;
    }

    const speed = autoScrollSpeedRef.current;
    let anyScrolled = false;

    // Try scrolling each collected scroll container from innermost to outermost
    for (const container of scrollContainersRef.current) {
      if (!container) continue;
      const isDoc =
        typeof document !== 'undefined' &&
        (container === document.documentElement ||
          container === document.body ||
          container === document.scrollingElement);

      if (isDoc && typeof window !== 'undefined') {
        const prevScrollY = window.scrollY || document.documentElement.scrollTop;
        window.scrollBy({ top: speed, behavior: 'auto' });
        const newScrollY = window.scrollY || document.documentElement.scrollTop;
        if (newScrollY !== prevScrollY) {
          anyScrolled = true;
          break;
        }
      } else if (container.scrollTop !== undefined) {
        const prevScrollTop = container.scrollTop;
        container.scrollTop += speed;
        if (container.scrollTop !== prevScrollTop) {
          anyScrolled = true;
          break;
        }
      }
    }

    if (!anyScrolled && typeof window !== 'undefined') {
      window.scrollBy({ top: speed, behavior: 'auto' });
    }

    // Re-evaluate drop target under the stationary finger as content scrolls beneath it
    if (lastPointerCoordsRef.current) {
      onMoveRef.current(lastPointerCoordsRef.current.y, lastPointerCoordsRef.current.x);
    }

    autoScrollRafRef.current = requestAnimationFrame(autoScrollStep);
  }, []);

  const updateAutoScroll = useCallback(
    (clientY: number) => {
      if (!isDraggingRef.current || typeof window === 'undefined') {
        stopAutoScroll();
        return;
      }

      const winHeight = window.innerHeight;
      const edgeThreshold = 140; // 140px zone near window / container edge (triggers sooner)

      let speed = 0;

      // 1. Direct window/viewport bottom edge:
      if (clientY >= winHeight - edgeThreshold) {
        const intensity = Math.min(
          1,
          Math.max(0, (clientY - (winHeight - edgeThreshold)) / edgeThreshold)
        );
        speed = Math.round(5 + intensity * 12); // 5px to 17px per frame (~300px - 1020px / sec)
      } else if (clientY <= edgeThreshold) {
        // Direct window/viewport top edge:
        const intensity = Math.min(1, Math.max(0, (edgeThreshold - clientY) / edgeThreshold));
        speed = -Math.round(5 + intensity * 12);
      } else {
        // 2. Also check if finger is near the bottom/top edge of the primary scroll container:
        const primaryContainer = scrollContainersRef.current[0];
        if (
          primaryContainer &&
          primaryContainer !== document.body &&
          primaryContainer !== document.documentElement
        ) {
          try {
            const rect = primaryContainer.getBoundingClientRect();
            // Container bottom edge
            if (clientY >= rect.bottom - edgeThreshold && clientY <= rect.bottom + 35) {
              const intensity = Math.min(
                1,
                Math.max(0, (clientY - (rect.bottom - edgeThreshold)) / edgeThreshold)
              );
              speed = Math.round(5 + intensity * 12);
            } else if (clientY <= rect.top + edgeThreshold && clientY >= rect.top - 35) {
              // Container top edge
              const intensity = Math.min(
                1,
                Math.max(0, (rect.top + edgeThreshold - clientY) / edgeThreshold)
              );
              speed = -Math.round(5 + intensity * 12);
            }
          } catch {
            // ignore
          }
        }
      }

      if (speed !== 0) {
        autoScrollSpeedRef.current = speed;
        if (autoScrollRafRef.current === null) {
          autoScrollRafRef.current = requestAnimationFrame(autoScrollStep);
        }
      } else {
        stopAutoScroll();
      }
    },
    [autoScrollStep, stopAutoScroll]
  );

  const cleanup = useCallback(() => {
    stopAutoScroll();
    if (scrollContainerPaddingsRef.current.length > 0) {
      for (const { el, prevPadding } of scrollContainerPaddingsRef.current) {
        try {
          el.style.paddingBottom = prevPadding;
        } catch {
          // ignore
        }
      }
      scrollContainerPaddingsRef.current = [];
    }
    scrollContainersRef.current = [];
    lastPointerCoordsRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (cloneRef.current) {
      cloneRef.current.remove();
      cloneRef.current = null;
    }
    startPosRef.current = null;
    isDraggingRef.current = false;
    isHoldingRef.current = false;
    setIsHolding(false);
    setIsTouchDragging(false);
    if (cleanupListenersRef.current) {
      cleanupListenersRef.current();
      cleanupListenersRef.current = null;
    }
  }, [stopAutoScroll]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startHoldTimer = useCallback(
    (clientX: number, clientY: number) => {
      startPosRef.current = { x: clientX, y: clientY };
      isHoldingRef.current = true;
      setIsHolding(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        isDraggingRef.current = true;
        isHoldingRef.current = false;
        setIsHolding(false);
        setIsTouchDragging(true);

        // Capture all scrollable ancestors for auto-scrolling
        scrollContainersRef.current = findScrollContainers(targetElRef.current);

        // Add generous bottom overscroll padding to scrollable containers during drag
        // so that the user can scroll until the absolute bottom item/tab is 100% visible!
        scrollContainerPaddingsRef.current = [];
        for (const c of scrollContainersRef.current) {
          if (c && c !== document.body && c !== document.documentElement) {
            try {
              scrollContainerPaddingsRef.current.push({
                el: c,
                prevPadding: c.style.paddingBottom,
              });
              const currentPadding =
                typeof window !== 'undefined'
                  ? parseFloat(window.getComputedStyle(c).paddingBottom) || 0
                  : 0;
              c.style.paddingBottom = `${currentPadding + 180}px`;
            } catch {
              // ignore
            }
          }
        }

        // Lock document body gestures while dragging so the screen doesn't move uncontrollably
        const prevBodyTouchAction =
          typeof document !== 'undefined' ? document.body.style.touchAction : '';
        const prevBodyUserSelect =
          typeof document !== 'undefined' ? document.body.style.userSelect : '';
        if (typeof document !== 'undefined') {
          document.body.style.touchAction = 'none';
          document.body.style.userSelect = 'none';
        }

        // Trigger haptic vibration if supported on tablet
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(50);
          } catch {
            // non-fatal
          }
        }

        // Create floating drag preview clone for tablet touch dragging
        const targetEl = targetElRef.current;
        if (targetEl && typeof document !== 'undefined') {
          const rect = targetEl.getBoundingClientRect();
          const grabX = startPosRef.current ? startPosRef.current.x - rect.left : rect.width / 2;
          const grabY = startPosRef.current ? startPosRef.current.y - rect.top : rect.height / 2;
          grabOffsetRef.current = { x: grabX, y: grabY };

          try {
            const clone = targetEl.cloneNode(true) as HTMLElement;
            clone.removeAttribute('id');
            clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));

            clone.style.position = 'fixed';
            clone.style.left = '0px';
            clone.style.top = '0px';
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            clone.style.margin = '0';
            clone.style.boxSizing = 'border-box';
            clone.style.zIndex = '99999';
            clone.style.pointerEvents = 'none';
            clone.style.userSelect = 'none';
            (clone.style as any).webkitUserSelect = 'none';
            clone.style.opacity = '0.94';
            clone.style.boxShadow =
              '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.1)';
            clone.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0) scale(1.03)`;
            clone.style.transition =
              'transform 0.04s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.15s ease';
            clone.style.willChange = 'transform';

            document.body.appendChild(clone);
            cloneRef.current = clone;
          } catch {
            // non-fatal clone fallback
          }
        }

        onStartRef.current(idRef.current, indexRef.current);

        // Listen on window and document during active drag with non-passive touchmove to prevent screen scrolling
        const handleWindowTouchMove = (ev: TouchEvent) => {
          if (ev.cancelable) {
            ev.preventDefault();
          }
          if (ev.touches.length > 0) {
            const touch = ev.touches[0];
            lastPointerCoordsRef.current = { x: touch.clientX, y: touch.clientY };
            if (cloneRef.current) {
              const x = touch.clientX - grabOffsetRef.current.x;
              const y = touch.clientY - grabOffsetRef.current.y;
              cloneRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.03)`;
            }
            onMoveRef.current(touch.clientY, touch.clientX);
            updateAutoScroll(touch.clientY);
          }
        };

        const handleWindowPointerMove = (ev: PointerEvent) => {
          if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
            if (ev.cancelable) {
              ev.preventDefault();
            }
            lastPointerCoordsRef.current = { x: ev.clientX, y: ev.clientY };
            if (cloneRef.current) {
              const x = ev.clientX - grabOffsetRef.current.x;
              const y = ev.clientY - grabOffsetRef.current.y;
              cloneRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.03)`;
            }
            onMoveRef.current(ev.clientY, ev.clientX);
            updateAutoScroll(ev.clientY);
          }
        };

        const handleWindowTouchEnd = () => {
          stopAutoScroll();
          didJustDragRef.current = true;
          setTimeout(() => {
            didJustDragRef.current = false;
          }, 150);
          onEndRef.current();
          cleanup();
        };

        const handleWindowPointerUp = (ev: PointerEvent) => {
          if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
            stopAutoScroll();
            didJustDragRef.current = true;
            setTimeout(() => {
              didJustDragRef.current = false;
            }, 150);
            onEndRef.current();
            cleanup();
          }
        };

        const handleWindowCancel = () => {
          stopAutoScroll();
          if (onCancelRef.current) onCancelRef.current();
          else onEndRef.current();
          cleanup();
        };

        window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
        window.addEventListener('touchend', handleWindowTouchEnd);
        window.addEventListener('touchcancel', handleWindowCancel);
        window.addEventListener('pointermove', handleWindowPointerMove);
        window.addEventListener('pointerup', handleWindowPointerUp);
        window.addEventListener('pointercancel', handleWindowCancel);
        if (typeof document !== 'undefined') {
          document.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
        }

        cleanupListenersRef.current = () => {
          stopAutoScroll();
          window.removeEventListener('touchmove', handleWindowTouchMove);
          window.removeEventListener('touchend', handleWindowTouchEnd);
          window.removeEventListener('touchcancel', handleWindowCancel);
          window.removeEventListener('pointermove', handleWindowPointerMove);
          window.removeEventListener('pointerup', handleWindowPointerUp);
          window.removeEventListener('pointercancel', handleWindowCancel);
          if (typeof document !== 'undefined') {
            document.removeEventListener('touchmove', handleWindowTouchMove);
            document.body.style.touchAction = prevBodyTouchAction;
            document.body.style.userSelect = prevBodyUserSelect;
          }
        };
      }, delayMs);
    },
    [delayMs, cleanup, updateAutoScroll, stopAutoScroll]
  );

  const checkMoveCancel = useCallback((clientX: number, clientY: number) => {
    if (timerRef.current && startPosRef.current) {
      const dx = Math.abs(clientX - startPosRef.current.x);
      const dy = Math.abs(clientY - startPosRef.current.y);
      if (Math.hypot(dx, dy) > moveThreshold) {
        // User moved finger > threshold before 1.5s: normal screen scroll! Cancel drag timer!
        clearTimeout(timerRef.current);
        timerRef.current = null;
        startPosRef.current = null;
        isHoldingRef.current = false;
        setIsHolding(false);
      }
    }
  }, [moveThreshold]);

  // Touch Events (primary for mobile / tablet web)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      targetElRef.current = e.currentTarget as HTMLElement;
      const touch = e.touches[0];
      startHoldTimer(touch.clientX, touch.clientY);
    }
  }, [startHoldTimer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDraggingRef.current) {
      if (e.cancelable) {
        e.preventDefault();
      }
      if (e.touches.length > 0) {
        onMoveRef.current(e.touches[0].clientY, e.touches[0].clientX);
      }
    } else if (e.touches.length > 0) {
      checkMoveCancel(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [checkMoveCancel]);

  const handleTouchEnd = useCallback(() => {
    if (timerRef.current && !isDraggingRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      startPosRef.current = null;
      isHoldingRef.current = false;
      setIsHolding(false);
    }
  }, []);

  // Pointer Events (supports stylus/touch while strictly ignoring mouse)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // STRICT: mouse returns immediately, 0 delay, 100% native HTML5 drag
    if (e.pointerType === 'mouse' || e.button !== 0) return;
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      targetElRef.current = e.currentTarget as HTMLElement;
      startHoldTimer(e.clientX, e.clientY);
    }
  }, [startHoldTimer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    if (isDraggingRef.current) {
      onMoveRef.current(e.clientY, e.clientX);
    } else {
      checkMoveCancel(e.clientX, e.clientY);
    }
  }, [checkMoveCancel]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    if (timerRef.current && !isDraggingRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      startPosRef.current = null;
      isHoldingRef.current = false;
      setIsHolding(false);
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Prevent default context menu during touch hold or drag so 1.5s long press isn't killed
    if (isHoldingRef.current || isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    isTouchDragging,
    isHolding,
    touchDragProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onContextMenu: handleContextMenu,
      onClickCapture: (e: React.MouseEvent) => {
        if (didJustDragRef.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      },
      style: ({
        WebkitTouchCallout: 'none',
        ...(isTouchDragging
          ? { touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }
          : {}),
      }) as React.CSSProperties,
    },
  };
}
