import React, { useState, useCallback, useEffect } from 'react';
import { AppSettings } from '../../../../types/settings';

const STORAGE_KEY_SCENE_WIDTHS = 'foliant_timeline_manual_scene_widths';
const STORAGE_KEY_PLOT_HEIGHTS = 'foliant_timeline_manual_plot_heights';
const STORAGE_KEY_SCENE_HEADER_HEIGHT = 'foliant_timeline_scene_header_height';
const SESSION_KEY_SCENE_HEADER_HEIGHT = 'foliant_timeline_scene_header_height_session';

interface UseTimelineStorylineHeightsParams {
  zoomX: number;
  zoomY: number;
  zoomYRef: React.MutableRefObject<number>;
  appSettings?: AppSettings;
  effectiveAppSettings?: AppSettings;
}

export function useTimelineStorylineHeights({
  zoomX,
  zoomY,
  zoomYRef,
  appSettings,
  effectiveAppSettings,
}: UseTimelineStorylineHeightsParams) {
  const preserveWidth = Boolean(
    appSettings?.preferences?.preserveManualSceneWidth ??
    effectiveAppSettings?.preferences?.preserveManualSceneWidth
  );
  const preserveHeight = Boolean(
    appSettings?.preferences?.preserveManualPlotHeight ??
    effectiveAppSettings?.preferences?.preserveManualPlotHeight
  );

  const [collapsedStorylines, setCollapsedStorylines] = useState<Record<string, boolean>>({});
  const [manualSceneWidths, setManualSceneWidths] = useState<Record<string, number>>(() => {
    if (preserveWidth) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_SCENE_WIDTHS);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });
  const [plotHeights, setPlotHeights] = useState<Record<string, number>>(() => {
    if (preserveHeight) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_PLOT_HEIGHTS);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  // Sync manualSceneWidths to localStorage when preserveWidth is active
  useEffect(() => {
    if (preserveWidth) {
      if (Object.keys(manualSceneWidths).length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY_SCENE_WIDTHS, JSON.stringify(manualSceneWidths));
        } catch {
          // ignore
        }
      }
    }
  }, [preserveWidth, manualSceneWidths]);

  // Sync plotHeights to localStorage when preserveHeight is active
  useEffect(() => {
    if (preserveHeight) {
      if (Object.keys(plotHeights).length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY_PLOT_HEIGHTS, JSON.stringify(plotHeights));
        } catch {
          // ignore
        }
      }
    }
  }, [preserveHeight, plotHeights]);

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
    try {
      localStorage.removeItem(STORAGE_KEY_SCENE_WIDTHS);
    } catch {
      // ignore
    }
  }, []);

  const clearManualPlotHeights = useCallback(() => {
    setPlotHeights((prev) => (Object.keys(prev).length > 0 ? {} : prev));
    setSceneHeaderHeight(140);
    try {
      localStorage.removeItem(STORAGE_KEY_PLOT_HEIGHTS);
      localStorage.removeItem(STORAGE_KEY_SCENE_HEADER_HEIGHT);
      sessionStorage.removeItem(SESSION_KEY_SCENE_HEADER_HEIGHT);
    } catch {
      // ignore
    }
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

  const [sceneHeaderHeight, setSceneHeaderHeight] = useState<number>(() => {
    if (preserveHeight) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_SCENE_HEADER_HEIGHT);
        if (saved) {
          const val = Number(saved);
          if (!isNaN(val) && val >= 65 && val <= 300) return val;
        }
      } catch {
        // ignore
      }
    }
    try {
      const savedSession = sessionStorage.getItem(SESSION_KEY_SCENE_HEADER_HEIGHT);
      if (savedSession) {
        const val = Number(savedSession);
        if (!isNaN(val) && val >= 65 && val <= 300) return val;
      }
    } catch {
      // ignore
    }
    return 140;
  });

  // Sync sceneHeaderHeight to localStorage (if preserveHeight) and sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY_SCENE_HEADER_HEIGHT, String(sceneHeaderHeight));
    } catch {
      // ignore
    }
    if (preserveHeight) {
      try {
        localStorage.setItem(STORAGE_KEY_SCENE_HEADER_HEIGHT, String(sceneHeaderHeight));
      } catch {
        // ignore
      }
    }
  }, [preserveHeight, sceneHeaderHeight]);

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
