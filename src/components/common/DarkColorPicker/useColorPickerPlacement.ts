import { useState, useLayoutEffect, RefObject, CSSProperties } from 'react';

export function useColorPickerPlacement(
  containerRef: RefObject<HTMLDivElement | null>,
  standalone: boolean
): CSSProperties {
  const [placementStyle, setPlacementStyle] = useState<CSSProperties>(() =>
    standalone ? { position: 'relative', opacity: 1 } : { position: 'absolute', opacity: 0 }
  );

  useLayoutEffect(() => {
    if (standalone) {
      setPlacementStyle({ position: 'relative', opacity: 1 });
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const updatePosition = () => {
      const parent = el.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const pickerRect = el.getBoundingClientRect();
      const pickerWidth = pickerRect.width || 208;
      const pickerHeight = pickerRect.height || 340;
      const margin = 8;
      const viewportPadding = 12;

      const containerEl = el.closest('main') || el.closest('.overflow-y-auto');
      const containerRect = containerEl
        ? containerEl.getBoundingClientRect()
        : { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight };

      const maxRightBoundary = Math.min(window.innerWidth - viewportPadding, containerRect.right - viewportPadding);
      const minLeftBoundary = Math.max(viewportPadding, containerRect.left + viewportPadding);
      const maxBottomBoundary = Math.min(window.innerHeight - viewportPadding, containerRect.bottom - viewportPadding);
      const minTopBoundary = Math.max(viewportPadding, containerRect.top + viewportPadding);

      const spaceRight = maxRightBoundary - parentRect.right;
      const spaceLeft = parentRect.left - minLeftBoundary;
      const spaceBottom = maxBottomBoundary - parentRect.bottom;
      const spaceTop = parentRect.top - minTopBoundary;

      const style: CSSProperties = {
        position: 'absolute',
        opacity: 1,
        transition: 'opacity 0.12s ease-out',
      };

      if (spaceRight >= pickerWidth + margin) {
        style.left = '100%';
        style.marginLeft = `${margin}px`;
      } else if (spaceLeft >= pickerWidth + margin) {
        style.right = '100%';
        style.marginRight = `${margin}px`;
      } else {
        if (spaceBottom >= pickerHeight + margin || spaceBottom >= spaceTop) {
          style.top = '100%';
          style.marginTop = `${margin}px`;
        } else {
          style.bottom = '100%';
          style.marginBottom = `${margin}px`;
        }

        if (parentRect.left + pickerWidth > maxRightBoundary) {
          style.right = '0px';
          style.left = 'auto';
        } else {
          style.left = '0px';
          style.right = 'auto';
        }
      }

      if (style.left === '100%' || style.right === '100%') {
        const bottomEdge = parentRect.top + pickerHeight;
        if (bottomEdge > maxBottomBoundary) {
          const overflowY = bottomEdge - maxBottomBoundary;
          style.top = `-${Math.max(0, overflowY)}px`;
        } else {
          style.top = '0px';
        }
      }

      setPlacementStyle(style);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [standalone, containerRef]);

  return placementStyle;
}
