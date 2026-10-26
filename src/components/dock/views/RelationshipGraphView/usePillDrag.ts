import { useState, useRef } from 'react';
import { CharacterRelationship } from '../../../../types/dock';
import { DRAG_THRESHOLD } from './constants';
import { NodeInfo, GraphSnapshot } from './types';

interface UsePillDragProps {
  relationships: CharacterRelationship[];
  onUpdateRelationships?: (updated: CharacterRelationship[]) => void;
  pushUndoSnapshot: (customSnapshot?: GraphSnapshot) => void;
  takeSnapshot: () => GraphSnapshot;
  zoomRef: React.MutableRefObject<number>;
  getNodeInfo: (id: string) => NodeInfo | null;
}

export function usePillDrag({
  relationships,
  onUpdateRelationships,
  pushUndoSnapshot,
  takeSnapshot,
  zoomRef,
  getNodeInfo,
}: UsePillDragProps) {
  const [draggingRelId, setDraggingRelId] = useState<string | null>(null);
  const snapshotBeforeDragRef = useRef<GraphSnapshot | null>(null);
  const justDraggedRelRef = useRef<boolean>(false);

  const dragRelRef = useRef<{
    relId: string;
    startX: number;
    startY: number;
    initOffsetX: number;
    initOffsetY: number;
    lastOffsetX: number;
    lastOffsetY: number;
    initT: number;
    lastT: number;
    dragMode: 'bend' | 'slide';
    isDragging: boolean;
  } | null>(null);

  const handlePillPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    rel: CharacterRelationship
  ) => {
    if (e.button !== 0 && e.button !== 2) return;
    e.stopPropagation();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const isSlideMode = e.button === 2;
    const initOffsetX = rel.controlOffset?.x ?? 0;
    const initOffsetY = rel.controlOffset?.y ?? 0;
    const initT = rel.labelT ?? 0.5;

    snapshotBeforeDragRef.current = takeSnapshot();

    dragRelRef.current = {
      relId: rel.id,
      startX: e.clientX,
      startY: e.clientY,
      initOffsetX,
      initOffsetY,
      lastOffsetX: initOffsetX,
      lastOffsetY: initOffsetY,
      initT,
      lastT: initT,
      dragMode: isSlideMode ? 'slide' : 'bend',
      isDragging: false,
    };
    justDraggedRelRef.current = false;
  };

  const handlePillPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRelRef.current) return;
    e.stopPropagation();

    const {
      relId,
      startX,
      startY,
      initOffsetX,
      initOffsetY,
      initT,
      dragMode,
      isDragging,
    } = dragRelRef.current;
    const moveDist = Math.hypot(e.clientX - startX, e.clientY - startY);

    if (!isDragging && moveDist < DRAG_THRESHOLD) {
      return;
    }

    if (!isDragging) {
      dragRelRef.current.isDragging = true;
      setDraggingRelId(relId);
      justDraggedRelRef.current = true;
    }

    const currentZoom = zoomRef.current || 1.0;

    const rel = relationships.find((r) => r.id === relId);
    if (!rel) return;
    const sourceInfo = getNodeInfo(rel.sourceId);
    const targetInfo = getNodeInfo(rel.targetId);
    if (!sourceInfo || !targetInfo) return;

    const dx = (e.clientX - startX) / currentZoom;
    const dy = (e.clientY - startY) / currentZoom;

    const chordX = targetInfo.cx - sourceInfo.cx;
    const chordY = targetInfo.cy - sourceInfo.cy;
    const chordDistSq = chordX * chordX + chordY * chordY;

    if (dragMode === 'slide') {
      if (chordDistSq > 1) {
        const deltaT = (dx * chordX + dy * chordY) / chordDistSq;
        const nextT = Math.round(Math.max(0.12, Math.min(0.88, initT + deltaT)) * 100) / 100;
        dragRelRef.current.lastT = nextT;

        if (onUpdateRelationships) {
          onUpdateRelationships(
            relationships.map((r) => (r.id === relId ? { ...r, labelT: nextT } : r))
          );
        }
      }
      return;
    }

    if (chordDistSq > 100) {
      const deltaT = (dx * chordX + dy * chordY) / chordDistSq;
      const nextT = Math.round(Math.max(0.12, Math.min(0.88, initT + deltaT)) * 100) / 100;
      const actualDeltaT = nextT - initT;
      const normDx = dx - actualDeltaT * chordX;
      const normDy = dy - actualDeltaT * chordY;
      const nextOffsetX = Math.round(initOffsetX + normDx);
      const nextOffsetY = Math.round(initOffsetY + normDy);

      dragRelRef.current.lastT = nextT;
      dragRelRef.current.lastOffsetX = nextOffsetX;
      dragRelRef.current.lastOffsetY = nextOffsetY;

      if (onUpdateRelationships) {
        onUpdateRelationships(
          relationships.map((r) =>
            r.id === relId
              ? {
                  ...r,
                  labelT: nextT,
                  controlOffset: { x: nextOffsetX, y: nextOffsetY },
                }
              : r
          )
        );
      }
    } else {
      const nextOffsetX = Math.round(initOffsetX + dx);
      const nextOffsetY = Math.round(initOffsetY + dy);

      dragRelRef.current.lastOffsetX = nextOffsetX;
      dragRelRef.current.lastOffsetY = nextOffsetY;

      if (onUpdateRelationships) {
        onUpdateRelationships(
          relationships.map((r) =>
            r.id === relId ? { ...r, controlOffset: { x: nextOffsetX, y: nextOffsetY } } : r
          )
        );
      }
    }
  };

  const handlePillPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRelRef.current) return;
    e.stopPropagation();

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const dragInfo = dragRelRef.current;
    dragRelRef.current = null;
    setDraggingRelId(null);

    if (dragInfo.isDragging) {
      if (snapshotBeforeDragRef.current) {
        pushUndoSnapshot(snapshotBeforeDragRef.current);
        snapshotBeforeDragRef.current = null;
      }
      setTimeout(() => {
        justDraggedRelRef.current = false;
      }, 50);
    } else {
      snapshotBeforeDragRef.current = null;
      justDraggedRelRef.current = false;
    }
  };

  const handlePillDoubleClick = (e: React.MouseEvent, relId: string) => {
    e.stopPropagation();
    pushUndoSnapshot();
    if (onUpdateRelationships) {
      onUpdateRelationships(
        relationships.map((r) =>
          r.id === relId ? { ...r, controlOffset: undefined, labelT: undefined } : r
        )
      );
    }
  };

  return {
    draggingRelId,
    justDraggedRelRef,
    handlePillPointerDown,
    handlePillPointerMove,
    handlePillPointerUp,
    handlePillDoubleClick,
  };
}
