import { useRef, useLayoutEffect, useCallback } from 'react';

/**
 * useFlipAnimation:
 * High-performance First-Last-Invert-Play (FLIP) layout animation hook.
 *
 * ### Performance & Architecture Rationale:
 * Animating CSS `top`, `left`, or grid dimensions causes browser layout recalculations (reflows)
 * on every animation frame, dropping frame rates below 60fps when reordering dozens of cards.
 *
 * The FLIP technique circumvents layout thrashing by:
 * 1. **First**: Remembering prior bounding rectangles in memory (`rectsRef`).
 * 2. **Last**: Capturing the newly rendered position inside `useLayoutEffect` (before visual paint).
 * 3. **Invert**: Applying an immediate `translate3d(deltaX, deltaY, 0)` transform without transitions,
 *    snapping elements visually back to their original position without re-triggering layout.
 * 4. **Play**: Gliding elements to `translate3d(0, 0, 0)` using hardware-accelerated GPU transforms
 *    and a spring-like cubic bezier curve via `requestAnimationFrame`.
 */
export function useFlipAnimation(isAnimating: boolean = true, draggedId?: string | null) {
  const rectsRef = useRef<Map<string, DOMRect>>(new Map());
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());

  const registerItem = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      elementsRef.current.set(id, el);
    } else {
      elementsRef.current.delete(id);
      rectsRef.current.delete(id);
    }
  }, []);

  useLayoutEffect(() => {
    if (!isAnimating) {
      if (rectsRef.current.size > 0) rectsRef.current.clear();
      return;
    }

    // 1. Measure current "Last" positions
    const newRects = new Map<string, DOMRect>();
    elementsRef.current.forEach((el, id) => {
      newRects.set(id, el.getBoundingClientRect());
    });

    // 2. Calculate deltas for elements that moved
    const movedElements: Array<{ el: HTMLElement; deltaX: number; deltaY: number }> = [];

    elementsRef.current.forEach((el, id) => {
      // Exclude the currently dragged item from FLIP to prevent visual snapping
      if (draggedId && id === draggedId) {
        return;
      }

      const prevRect = rectsRef.current.get(id);
      const nextRect = newRects.get(id);

      if (prevRect && nextRect) {
        const deltaX = prevRect.left - nextRect.left;
        const deltaY = prevRect.top - nextRect.top;

        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
          movedElements.push({ el, deltaX, deltaY });
        }
      }
    });

    if (movedElements.length > 0) {
      // Invert: snap immediately to previous visual location without transitions
      for (let i = 0; i < movedElements.length; i++) {
        const { el, deltaX, deltaY } = movedElements[i];
        el.style.transition = 'none';
        el.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
        el.style.willChange = 'transform';
      }

      // Single forced reflow for the entire batch to commit the inverted positions
      if (movedElements[0]?.el?.parentElement) {
        void movedElements[0].el.parentElement.offsetHeight;
      }

      // Play: glide fluidly with a spring-like flow easing curve to the new position
      requestAnimationFrame(() => {
        for (let i = 0; i < movedElements.length; i++) {
          const { el } = movedElements[i];
          el.style.transition = 'transform 300ms cubic-bezier(0.2, 0.9, 0.25, 1)';
          el.style.transform = 'translate3d(0, 0, 0)';

          const onEnd = (e: TransitionEvent) => {
            if (e.propertyName === 'transform') {
              el.style.transition = '';
              el.style.transform = '';
              el.style.willChange = '';
              el.removeEventListener('transitionend', onEnd);
            }
          };
          el.addEventListener('transitionend', onEnd, { once: true });
        }
      });
    }

    // 3. Store new positions for next render
    rectsRef.current = newRects;
  });

  return registerItem;
}
