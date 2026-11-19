import { useState, useRef, useEffect, useCallback } from 'react';
import { PanOffset } from './types';
import { MIN_ZOOM, MAX_ZOOM } from './constants';

export function useGraphZoomPan(boardRef: React.RefObject<HTMLDivElement | null>) {
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<PanOffset>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  const zoomRef = useRef<number>(zoom);
  zoomRef.current = zoom;
  const panRef = useRef<PanOffset>(pan);
  panRef.current = pan;

  const panStartRef = useRef<{
    startX: number;
    startY: number;
    initPanX: number;
    initPanY: number;
  } | null>(null);

  // Spacebar Hand-Grab Modifier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;

      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse Wheel & Pinch-to-zoom
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const isPinch = e.ctrlKey;
      if (isPinch || !e.shiftKey) {
        let normalizedDelta = e.deltaY;
        if (e.deltaMode === 1) {
          // Line mode (standard Windows mouse wheel)
          normalizedDelta = e.deltaY * 28;
        } else if (e.deltaMode === 2) {
          // Page mode
          normalizedDelta = e.deltaY * 350;
        }

        const zoomFactor = isPinch
          ? Math.exp(-normalizedDelta * 0.01)
          : Math.exp(-normalizedDelta * 0.0025);

        const rect = el.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const currentZoom = zoomRef.current;
        const currentPan = panRef.current;

        const newZoom = Math.min(Math.max(currentZoom * zoomFactor, MIN_ZOOM), MAX_ZOOM);
        const scaleChange = newZoom / currentZoom;

        const newPanX = cursorX - (cursorX - currentPan.x) * scaleChange;
        const newPanY = cursorY - (cursorY - currentPan.y) * scaleChange;

        zoomRef.current = newZoom;
        panRef.current = { x: newPanX, y: newPanY };

        setZoom(newZoom);
        setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
      }
    };

    const handleGesture = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('gesturestart', handleGesture);
    el.addEventListener('gesturechange', handleGesture);
    el.addEventListener('gestureend', handleGesture);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('gesturestart', handleGesture);
      el.removeEventListener('gesturechange', handleGesture);
      el.removeEventListener('gestureend', handleGesture);
    };
  }, [boardRef]);

  // Canvas Pan Dragging & Multi-touch Pinch-to-zoom
  const activePointersRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const pinchStartRef = useRef<{
    initDist: number;
    initZoom: number;
    initPan: PanOffset;
    centerClientX: number;
    centerClientY: number;
  } | null>(null);

  useEffect(() => {
    if (!isPanning && activePointersRef.current.size === 0) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
      }

      // Multi-touch pinch-to-zoom (2 or more touch/stylus pointers)
      if (activePointersRef.current.size >= 2) {
        const pointers = Array.from(activePointersRef.current.values());
        const p1 = pointers[0];
        const p2 = pointers[1];
        const currentDist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
        const currentCenterX = (p1.clientX + p2.clientX) / 2;
        const currentCenterY = (p1.clientY + p2.clientY) / 2;

        if (!pinchStartRef.current) {
          pinchStartRef.current = {
            initDist: currentDist,
            initZoom: zoomRef.current,
            initPan: { ...panRef.current },
            centerClientX: currentCenterX,
            centerClientY: currentCenterY,
          };
          return;
        }

        const { initDist, initZoom, initPan, centerClientX, centerClientY } = pinchStartRef.current;
        if (initDist <= 0) return;

        const scale = currentDist / initDist;
        const targetZoom = Math.min(Math.max(initZoom * scale, MIN_ZOOM), MAX_ZOOM);

        const el = boardRef.current;
        const rect = el ? el.getBoundingClientRect() : { left: 0, top: 0 };
        const centerRelX = centerClientX - rect.left;
        const centerRelY = centerClientY - rect.top;

        const scaleRatio = targetZoom / initZoom;
        const newPanX =
          centerRelX - (centerRelX - initPan.x) * scaleRatio + (currentCenterX - centerClientX);
        const newPanY =
          centerRelY - (centerRelY - initPan.y) * scaleRatio + (currentCenterY - centerClientY);

        zoomRef.current = targetZoom;
        panRef.current = { x: newPanX, y: newPanY };

        setZoom(targetZoom);
        setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
        return;
      }

      // Single pointer drag (touch, pen, or mouse pointer)
      if (panStartRef.current) {
        const dx = e.clientX - panStartRef.current.startX;
        const dy = e.clientY - panStartRef.current.startY;
        const newPan = {
          x: Math.round(panStartRef.current.initPanX + dx),
          y: Math.round(panStartRef.current.initPanY + dy),
        };
        panRef.current = newPan;
        setPan(newPan);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      activePointersRef.current.delete(e.pointerId);

      if (activePointersRef.current.size === 1) {
        // Drop from pinch to single-pointer pan: reset pan start anchor to current pointer
        pinchStartRef.current = null;
        const [remaining] = Array.from(activePointersRef.current.values());
        panStartRef.current = {
          startX: remaining.clientX,
          startY: remaining.clientY,
          initPanX: panRef.current.x,
          initPanY: panRef.current.y,
        };
      } else if (activePointersRef.current.size === 0) {
        pinchStartRef.current = null;
        panStartRef.current = null;
        setIsPanning(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (activePointersRef.current.size === 0 && panStartRef.current) {
        const dx = e.clientX - panStartRef.current.startX;
        const dy = e.clientY - panStartRef.current.startY;
        const newPan = {
          x: Math.round(panStartRef.current.initPanX + dx),
          y: Math.round(panStartRef.current.initPanY + dy),
        };
        panRef.current = newPan;
        setPan(newPan);
      }
    };

    const handleMouseUp = () => {
      if (activePointersRef.current.size === 0) {
        setIsPanning(false);
        panStartRef.current = null;
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, boardRef]);

  const startPan = useCallback(
    (clientX: number, clientY: number, pointerId?: number) => {
      if (pointerId !== undefined) {
        activePointersRef.current.set(pointerId, { clientX, clientY });
      }
      setIsPanning(true);
      panStartRef.current = {
        startX: clientX,
        startY: clientY,
        initPanX: panRef.current.x,
        initPanY: panRef.current.y,
      };

      if (activePointersRef.current.size >= 2) {
        const pointers = Array.from(activePointersRef.current.values());
        const p1 = pointers[0];
        const p2 = pointers[1];
        pinchStartRef.current = {
          initDist: Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY),
          initZoom: zoomRef.current,
          initPan: { ...panRef.current },
          centerClientX: (p1.clientX + p2.clientX) / 2,
          centerClientY: (p1.clientY + p2.clientY) / 2,
        };
      }
    },
    []
  );

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => {
      const next = Math.min(MAX_ZOOM, Math.round((prev + 0.15) * 100) / 100);
      zoomRef.current = next;
      return next;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(MIN_ZOOM, Math.round((prev - 0.15) * 100) / 100);
      zoomRef.current = next;
      return next;
    });
  }, []);

  const handleResetViewport = useCallback(() => {
    zoomRef.current = 1.0;
    panRef.current = { x: 0, y: 0 };
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  return {
    zoom,
    pan,
    zoomRef,
    panRef,
    isPanning,
    isSpacePressed,
    setZoom,
    setPan,
    startPan,
    handleZoomIn,
    handleZoomOut,
    handleResetViewport,
  };
}
