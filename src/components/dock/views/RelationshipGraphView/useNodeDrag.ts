import { useRef } from 'react';
import { CharacterItem, GraphJunctionNode, CharacterNodePosition } from '../../../../types/dock';
import { NodePosition, GraphSnapshot } from './types';
import { DRAG_THRESHOLD } from './constants';
import { resolveNodeSeparation } from './geometry';

interface UseNodeDragProps {
  characters: CharacterItem[];
  junctions: GraphJunctionNode[];
  positions: Record<string, NodePosition>;
  selectedNodeIds?: string[];
  setSelectedNodeIds?: React.Dispatch<React.SetStateAction<string[]>>;
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
  selectedNodeIds = [],
  setSelectedNodeIds,
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
    isDragging: boolean;
    initialPositions: Record<string, NodePosition>;
    movingNodeIds: string[];
    lastDx: number;
    lastDy: number;
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

    snapshotBeforeDragRef.current = takeSnapshot();

    // Determinar qué nodos se van a mover juntos
    let movingIds: string[];
    if (selectedNodeIds.includes(nodeId)) {
      movingIds = selectedNodeIds;
    } else {
      if (e.ctrlKey || e.metaKey) {
        movingIds = [...selectedNodeIds, nodeId];
        setSelectedNodeIds?.(movingIds);
      } else {
        movingIds = [nodeId];
        setSelectedNodeIds?.([nodeId]);
      }
    }

    const initialPositions: Record<string, NodePosition> = {};
    for (const id of movingIds) {
      const pos = positions[id] || { x: 100, y: 100 };
      initialPositions[id] = { ...pos };
    }

    dragNodeRef.current = {
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      isDragging: false,
      initialPositions,
      movingNodeIds: movingIds,
      lastDx: 0,
      lastDy: 0,
    };
  };

  const handleNodePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragNodeRef.current) return;
    e.stopPropagation();

    const { startX, startY, isDragging, initialPositions, movingNodeIds, nodeId } = dragNodeRef.current;
    const moveDist = Math.hypot(e.clientX - startX, e.clientY - startY);

    if (!isDragging && moveDist < DRAG_THRESHOLD) {
      return;
    }

    dragNodeRef.current.isDragging = true;
    const currentZoom = zoomRef.current || 1.0;
    const dx = Math.round((e.clientX - startX) / currentZoom);
    const dy = Math.round((e.clientY - startY) / currentZoom);

    // Si solo se mueve 1 nodo, aplicamos separación suave con otros nodos no seleccionados
    if (movingNodeIds.length === 1) {
      const init = initialPositions[nodeId] || { x: 100, y: 100 };
      let nextX = init.x + dx;
      let nextY = init.y + dy;

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

      dragNodeRef.current.lastDx = nextX - init.x;
      dragNodeRef.current.lastDy = nextY - init.y;

      setPositions((prev) => ({
        ...prev,
        [nodeId]: { x: nextX, y: nextY },
      }));
    } else {
      // Si se mueven varios nodos a la vez, se desplazan juntos en bloque con el mismo dx y dy
      dragNodeRef.current.lastDx = dx;
      dragNodeRef.current.lastDy = dy;

      setPositions((prev) => {
        const next = { ...prev };
        for (const id of movingNodeIds) {
          const init = initialPositions[id] || { x: 100, y: 100 };
          next[id] = { x: init.x + dx, y: init.y + dy };
        }
        return next;
      });
    }
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

      const { initialPositions, movingNodeIds, lastDx, lastDy } = dragInfo;

      // Actualizar junctions movidos
      const movedJuncs = junctions.filter((j) => movingNodeIds.includes(j.id));
      if (movedJuncs.length > 0) {
        updateJunctions(
          junctions.map((j) => {
            if (movingNodeIds.includes(j.id)) {
              const init = initialPositions[j.id] || { x: j.x, y: j.y };
              return { ...j, x: init.x + lastDx, y: init.y + lastDy };
            }
            return j;
          })
        );
      }

      // Actualizar characters movidos
      if (onUpdateCharacterPositions) {
        const updatedList: CharacterNodePosition[] = characters.map((c) => {
          if (movingNodeIds.includes(c.id)) {
            const init = initialPositions[c.id] || { x: positions[c.id]?.x ?? 100, y: positions[c.id]?.y ?? 100 };
            return {
              characterId: c.id,
              x: init.x + lastDx,
              y: init.y + lastDy,
            };
          }
          return {
            characterId: c.id,
            x: positions[c.id]?.x ?? 100,
            y: positions[c.id]?.y ?? 100,
          };
        });
        onUpdateCharacterPositions(updatedList);
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
