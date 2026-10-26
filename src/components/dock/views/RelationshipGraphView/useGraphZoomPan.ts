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

  // Canvas Pan Dragging
  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panStartRef.current) return;
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
      setPan({
        x: Math.round(panStartRef.current.initPanX + dx),
        y: Math.round(panStartRef.current.initPanY + dy),
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  const startPan = useCallback(
    (clientX: number, clientY: number) => {
      setIsPanning(true);
      panStartRef.current = {
        startX: clientX,
        startY: clientY,
        initPanX: pan.x,
        initPanY: pan.y,
      };
    },
    [pan]
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
