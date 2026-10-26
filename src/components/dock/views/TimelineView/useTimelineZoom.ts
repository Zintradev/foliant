import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppSettings } from '../../../../types/settings';

interface UseTimelineZoomParams {
  timelineContainerRef: React.RefObject<HTMLDivElement | null>;
  appSettings?: AppSettings;
  effectiveAppSettings?: AppSettings;
  onClearManualWidths: () => void;
  onClearManualHeights?: () => void;
}

export function useTimelineZoom({
  timelineContainerRef,
  appSettings,
  effectiveAppSettings,
  onClearManualWidths,
  onClearManualHeights,
}: UseTimelineZoomParams) {
  const [zoomX, setZoomX] = useState<number>(1.0);
  const [zoomY, setZoomY] = useState<number>(1.0);

  const sliderXRef = useRef<HTMLInputElement | null>(null);
  const sliderYRef = useRef<HTMLInputElement | null>(null);
  const percentXRef = useRef<HTMLInputElement | null>(null);
  const percentYRef = useRef<HTMLInputElement | null>(null);

  const zoomXRef = useRef<number>(zoomX);
  const zoomYRef = useRef<number>(zoomY);
  const committedZoomXRef = useRef<number>(zoomX);
  const committedZoomYRef = useRef<number>(zoomY);
  const wheelCommitTimeoutRef = useRef<number | null>(null);
  // 60FPS Fluid Zoom updating CSS layout variables directly without geometric distortion
  const handleZoomXLive = useCallback(
    (newVal: number) => {
      const clamped = Math.min(2.5, Math.max(0.4, Math.round(newVal * 100) / 100));
      zoomXRef.current = clamped;
      if (timelineContainerRef.current) {
        timelineContainerRef.current.style.setProperty(
          '--scene-col-width',
          `${Math.round(240 * clamped)}px`
        );
        timelineContainerRef.current.style.setProperty('--zoom-level', String(clamped));
      }
      if (percentXRef.current && document.activeElement !== percentXRef.current) {
        percentXRef.current.value = `${Math.round(clamped * 100)}%`;
      }
      if (sliderXRef.current && Number(sliderXRef.current.value) !== clamped) {
        sliderXRef.current.value = String(clamped);
      }
    },
    [timelineContainerRef]
  );

  const handleZoomXCommit = useCallback(
    (newVal: number) => {
      const clamped = Math.min(2.5, Math.max(0.4, Math.round(newVal * 100) / 100));
      zoomXRef.current = clamped;
      committedZoomXRef.current = clamped;
      if (timelineContainerRef.current) {
        timelineContainerRef.current.style.setProperty(
          '--scene-col-width',
          `${Math.round(240 * clamped)}px`
        );
        timelineContainerRef.current.style.setProperty('--zoom-level', String(clamped));
      }
      if (percentXRef.current && document.activeElement !== percentXRef.current) {
        percentXRef.current.value = `${Math.round(clamped * 100)}%`;
      }
      if (sliderXRef.current && Number(sliderXRef.current.value) !== clamped) {
        sliderXRef.current.value = String(clamped);
      }
      setZoomX(clamped);
      const preserve = appSettings
        ? appSettings.preferences?.preserveManualSceneWidth
        : effectiveAppSettings?.preferences?.preserveManualSceneWidth;
      if (!preserve) {
        onClearManualWidths();
      }
    },
    [appSettings, effectiveAppSettings, onClearManualWidths, timelineContainerRef]
  );

  const handleZoomXChange = useCallback(
    (newVal: number, isLiveOnly: boolean = false) => {
      if (isLiveOnly) {
        handleZoomXLive(newVal);
      } else {
        handleZoomXCommit(newVal);
      }
    },
    [handleZoomXLive, handleZoomXCommit]
  );

  const handleZoomYLive = useCallback(
    (newVal: number) => {
      const clamped = Math.min(2.5, Math.max(0.5, Math.round(newVal * 100) / 100));
      zoomYRef.current = clamped;
      if (timelineContainerRef.current) {
        timelineContainerRef.current.style.setProperty(
          '--track-row-height',
          `${Math.round(60 * clamped)}px`
        );
      }
      if (percentYRef.current && document.activeElement !== percentYRef.current) {
        percentYRef.current.value = `${Math.round(clamped * 100)}%`;
      }
      if (sliderYRef.current && Number(sliderYRef.current.value) !== clamped) {
        sliderYRef.current.value = String(clamped);
      }
    },
    [timelineContainerRef]
  );

  const handleZoomYCommit = useCallback(
    (newVal: number) => {
      const clamped = Math.min(2.5, Math.max(0.5, Math.round(newVal * 100) / 100));
      zoomYRef.current = clamped;
      committedZoomYRef.current = clamped;
      if (timelineContainerRef.current) {
        timelineContainerRef.current.style.setProperty(
          '--track-row-height',
          `${Math.round(60 * clamped)}px`
        );
      }
      if (percentYRef.current && document.activeElement !== percentYRef.current) {
        percentYRef.current.value = `${Math.round(clamped * 100)}%`;
      }
      if (sliderYRef.current && Number(sliderYRef.current.value) !== clamped) {
        sliderYRef.current.value = String(clamped);
      }
      setZoomY(clamped);
      const preserve = appSettings
        ? appSettings.preferences?.preserveManualPlotHeight
        : effectiveAppSettings?.preferences?.preserveManualPlotHeight;
      if (!preserve) {
        onClearManualHeights?.();
      }
    },
    [appSettings, effectiveAppSettings, onClearManualHeights, timelineContainerRef]
  );

  const handleZoomYChange = useCallback(
    (newVal: number, isLiveOnly: boolean = false) => {
      if (isLiveOnly) {
        handleZoomYLive(newVal);
      } else {
        handleZoomYCommit(newVal);
      }
    },
    [handleZoomYLive, handleZoomYCommit]
  );

  // 60FPS Smooth Ctrl+Wheel with GPU Transform and debounced React state consolidation
  useEffect(() => {
    const el = timelineContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY;
        const step =
          Math.abs(delta) >= 30
            ? (delta > 0 ? -0.1 : 0.1)
            : -delta * 0.003;

        if (e.shiftKey) {
          const nextY = Math.min(2.5, Math.max(0.5, Math.round((zoomYRef.current + step) * 100) / 100));
          handleZoomYLive(nextY);
        } else {
          const nextX = Math.min(2.5, Math.max(0.4, Math.round((zoomXRef.current + step) * 100) / 100));
          handleZoomXLive(nextX);
        }

        // Debounce commit to React state to prevent layout thrashing while scrolling
        if (wheelCommitTimeoutRef.current !== null) {
          window.clearTimeout(wheelCommitTimeoutRef.current);
        }
        wheelCommitTimeoutRef.current = window.setTimeout(() => {
          wheelCommitTimeoutRef.current = null;
          handleZoomXCommit(zoomXRef.current);
          handleZoomYCommit(zoomYRef.current);
        }, 120);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelCommitTimeoutRef.current !== null) {
        window.clearTimeout(wheelCommitTimeoutRef.current);
      }
    };
  }, [handleZoomXLive, handleZoomXCommit, handleZoomYLive, handleZoomYCommit, timelineContainerRef]);



  useEffect(() => {
    zoomXRef.current = zoomX;
    committedZoomXRef.current = zoomX;
    if (sliderXRef.current) sliderXRef.current.value = String(zoomX);
    if (percentXRef.current && document.activeElement !== percentXRef.current) {
      percentXRef.current.value = `${Math.round(zoomX * 100)}%`;
    }
    if (timelineContainerRef.current) {
      timelineContainerRef.current.style.setProperty(
        '--scene-col-width',
        `${Math.round(240 * zoomX)}px`
      );
      timelineContainerRef.current.style.setProperty('--zoom-level', String(zoomX));
    }
  }, [zoomX, timelineContainerRef]);

  useEffect(() => {
    zoomYRef.current = zoomY;
    committedZoomYRef.current = zoomY;
    if (sliderYRef.current) sliderYRef.current.value = String(zoomY);
    if (percentYRef.current && document.activeElement !== percentYRef.current) {
      percentYRef.current.value = `${Math.round(zoomY * 100)}%`;
    }
    if (timelineContainerRef.current) {
      timelineContainerRef.current.style.setProperty(
        '--track-row-height',
        `${Math.round(60 * zoomY)}px`
      );
    }
  }, [zoomY, timelineContainerRef]);

  return {
    zoomX,
    zoomY,
    zoomXRef,
    zoomYRef,
    sliderXRef,
    sliderYRef,
    percentXRef,
    percentYRef,
    handleZoomXChange,
    handleZoomYChange,
  };
}
