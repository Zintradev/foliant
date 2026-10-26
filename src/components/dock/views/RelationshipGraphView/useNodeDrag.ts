import { useRef } from 'react';
import { CharacterItem, GraphJunctionNode, CharacterNodePosition } from '../../../../types/dock';
import { NodePosition, GraphSnapshot } from './types';
import { DRAG_THRESHOLD } from './constants';
import { resolveNodeSeparation } from './geometry';

interface UseNodeDragProps {
  characters: CharacterItem[];
  junctions: GraphJunctionNode[];
  positions: Record<string, NodePosition>;
  setPositions: React.Dispatch<React.SetStateAction<Record<string, NodePosition>>>;
  updateJunctions: (juncs: GraphJunctionNode[]) => void;
  onUpdateCharacterPositions?: (positions: CharacterNodePosition[]) => void;
  pushUndoSnapshot: (customSnapshot?: GraphSnapshot) => void;
  takeSnapshot: () => GraphSnapshot;
  zoomRef: React.MutableRefObject<number>;
  connectingSourceId: string | null;
  createQuickRelationship: (sourceId: string, targetId: string) => void;
  setConnectingSourceId: (id: string | null) => void;
  setElasticCursor: (cur: { x: number; y: number } | null) => void;
}

export function useNodeDrag({
  characters,
  junctions,
  positions,
  setPositions,
  updateJunctions,
  onUpdateCharacterPositions,
  pushUndoSnapshot,
  takeSnapshot,
  zoomRef,
  connectingSourceId,
  createQuickRelationship,
  setConnectingSourceId,
  setElasticCursor,
}: UseNodeDragProps) {
  const dragNodeRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    lastX: number;
    lastY: number;
    isDragging: boolean;
  } | null>(null);

  const snapshotBeforeDragRef = useRef<GraphSnapshot | null>(null);

  const handleNodePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    nodeId: string
  ) => {
    if (e.button !== 0) return;

    if (connectingSourceId) {
      if (connectingSourceId !== nodeId) {
        createQuickRelationship(connectingSourceId, nodeId);
      }
      setConnectingSourceId(null);
      setElasticCursor(null);
      return;
    }

    e.stopPropagation();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const currentPos = positions[nodeId] || { x: 100, y: 100 };
    snapshotBeforeDragRef.current = takeSnapshot();
    dragNodeRef.current = {
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      initX: currentPos.x,
      initY: currentPos.y,
      lastX: currentPos.x,
      lastY: currentPos.y,
      isDragging: false,
    };
  };

  const handleNodePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragNodeRef.current) return;
    e.stopPropagation();

    const { nodeId, startX, startY, initX, initY, isDragging } = dragNodeRef.current;
    const moveDist = Math.hypot(e.clientX - startX, e.clientY - startY);

    if (!isDragging && moveDist < DRAG_THRESHOLD) {
      return;
    }

    dragNodeRef.current.isDragging = true;
    const currentZoom = zoomRef.current || 1.0;
    const dx = (e.clientX - startX) / currentZoom;
    const dy = (e.clientY - startY) / currentZoom;

    let nextX = Math.round(initX + dx);
    let nextY = Math.round(initY + dy);

    const isJunction = junctions.some((j) => j.id === nodeId);
    const otherNodes: Array<{ id: string; isJunction: boolean }> = [
      ...characters.filter((c) => c.id !== nodeId).map((c) => ({ id: c.id, isJunction: false })),
      ...junctions.filter((j) => j.id !== nodeId).map((j) => ({ id: j.id, isJunction: true })),
    ];

    for (const other of otherNodes) {
      const oPos = positions[other.id];
      if (!oPos) continue;

      const resolved = resolveNodeSeparation(
        nextX,
        nextY,
        isJunction,
        oPos.x,
        oPos.y,
        other.isJunction
      );
      nextX = resolved.x;
      nextY = resolved.y;
    }

    dragNodeRef.current.lastX = nextX;
    dragNodeRef.current.lastY = nextY;

    setPositions((prev) => ({
      ...prev,
      [nodeId]: { x: nextX, y: nextY },
    }));
  };

  const handleNodePointerUp = (e: React.PointerEvent<HTMLDivElement>, nodeId: string) => {
    if (!dragNodeRef.current) return;
    e.stopPropagation();

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const dragInfo = dragNodeRef.current;
    dragNodeRef.current = null;

    if (connectingSourceId && !dragInfo.isDragging && connectingSourceId !== nodeId) {
      createQuickRelationship(connectingSourceId, nodeId);
      setConnectingSourceId(null);
      setElasticCursor(null);
      snapshotBeforeDragRef.current = null;
      return;
    }

    if (dragInfo.isDragging) {
      if (snapshotBeforeDragRef.current) {
        pushUndoSnapshot(snapshotBeforeDragRef.current);
        snapshotBeforeDragRef.current = null;
      }

      if (junctions.some((j) => j.id === dragInfo.nodeId)) {
        updateJunctions(
          junctions.map((j) =>
            j.id === dragInfo.nodeId ? { ...j, x: dragInfo.lastX, y: dragInfo.lastY } : j
          )
        );
      } else {
        if (onUpdateCharacterPositions) {
          const updatedList: CharacterNodePosition[] = characters.map((c) => ({
            characterId: c.id,
            x: c.id === dragInfo.nodeId ? dragInfo.lastX : (positions[c.id]?.x ?? 100),
            y: c.id === dragInfo.nodeId ? dragInfo.lastY : (positions[c.id]?.y ?? 100),
          }));
          onUpdateCharacterPositions(updatedList);
        }
      }
    } else {
      snapshotBeforeDragRef.current = null;
    }
  };

  return {
    handleNodePointerDown,
    handleNodePointerMove,
    handleNodePointerUp,
  };
}
