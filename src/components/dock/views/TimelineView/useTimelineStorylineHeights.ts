import React, { useState, useCallback } from 'react';

interface UseTimelineStorylineHeightsParams {
  zoomX: number;
  zoomY: number;
  zoomYRef: React.MutableRefObject<number>;
}

export function useTimelineStorylineHeights({
  zoomX,
  zoomY,
  zoomYRef,
}: UseTimelineStorylineHeightsParams) {
  const [collapsedStorylines, setCollapsedStorylines] = useState<Record<string, boolean>>({});
  const [manualSceneWidths, setManualSceneWidths] = useState<Record<string, number>>({});
  const [plotHeights, setPlotHeights] = useState<Record<string, number>>({});

  const baseSceneColWidth = Math.round(240 * zoomX);
  const baseSwimlaneRowHeight = Math.round(80 * zoomY);

  const getSceneWidth = (sceneId: string) => manualSceneWidths[sceneId] ?? baseSceneColWidth;
  const getPlotHeight = (storylineId: string) => plotHeights[storylineId] ?? baseSwimlaneRowHeight;

  const getRowHeight = useCallback(
    (stId: string) => {
      if (collapsedStorylines[stId]) return 34;
      if (plotHeights[stId]) return plotHeights[stId];
      return Math.round(60 * (zoomYRef.current || 1.0));
    },
    [collapsedStorylines, plotHeights, zoomYRef]
  );

  const toggleStorylineCollapse = (stId: string) => {
    setCollapsedStorylines((prev) => ({ ...prev, [stId]: !prev[stId] }));
  };

  const clearManualSceneWidths = useCallback(() => {
    setManualSceneWidths((prev) => (Object.keys(prev).length > 0 ? {} : prev));
  }, []);

  const clearManualPlotHeights = useCallback(() => {
    setPlotHeights((prev) => (Object.keys(prev).length > 0 ? {} : prev));
  }, []);

  const handleSceneResizeStart = (e: React.PointerEvent, sceneId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = getSceneWidth(sceneId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(140, Math.min(800, startWidth + delta));
      setManualSceneWidths((prev) => ({ ...prev, [sceneId]: newWidth }));
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const handlePlotResizeStart = (e: React.PointerEvent, storylineId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = getPlotHeight(storylineId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startY;
      const newHeight = Math.max(40, Math.min(400, startHeight + delta));
      setPlotHeights((prev) => ({ ...prev, [storylineId]: newHeight }));
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const [sceneHeaderHeight, setSceneHeaderHeight] = useState<number>(140);

  const handleSceneHeaderResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = sceneHeaderHeight;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startY;
      const newHeight = Math.max(65, Math.min(300, startHeight + delta));
      setSceneHeaderHeight(newHeight);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  return {
    collapsedStorylines,
    manualSceneWidths,
    plotHeights,
    sceneHeaderHeight,
    setSceneHeaderHeight,
    getRowHeight,
    getSceneWidth,
    getPlotHeight,
    toggleStorylineCollapse,
    clearManualSceneWidths,
    clearManualPlotHeights,
    handleSceneResizeStart,
    handlePlotResizeStart,
    handleSceneHeaderResizeStart,
  };
}
