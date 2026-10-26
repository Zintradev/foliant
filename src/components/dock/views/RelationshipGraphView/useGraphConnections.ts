import { useState, useCallback } from 'react';
import { CharacterRelationship, GraphJunctionNode } from '../../../../types/dock';
import { NodeInfo, GraphSnapshot } from './types';
import { usePillDrag } from './usePillDrag';

interface UseGraphConnectionsProps {
  relationships: CharacterRelationship[];
  junctions: GraphJunctionNode[];
  onUpdateRelationships?: (updated: CharacterRelationship[]) => void;
  pushUndoSnapshot: (customSnapshot?: GraphSnapshot) => void;
  takeSnapshot: () => GraphSnapshot;
  zoomRef: React.MutableRefObject<number>;
  pan: { x: number; y: number };
  getNodeInfo: (id: string) => NodeInfo | null;
  boardRef: React.RefObject<HTMLDivElement | null>;
  setSelectedRelId: (id: string | null) => void;
  setSelectedJunctionId: (id: string | null) => void;
  setEditingCardId: (id: string | null) => void;
}

export function useGraphConnections({
  relationships,
  junctions,
  onUpdateRelationships,
  pushUndoSnapshot,
  takeSnapshot,
  zoomRef,
  pan,
  getNodeInfo,
  boardRef,
  setSelectedRelId,
  setSelectedJunctionId,
  setEditingCardId,
}: UseGraphConnectionsProps) {
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [elasticCursor, setElasticCursor] = useState<{ x: number; y: number } | null>(null);

  const {
    draggingRelId,
    justDraggedRelRef,
    handlePillPointerDown,
    handlePillPointerMove,
    handlePillPointerUp,
    handlePillDoubleClick,
  } = usePillDrag({
    relationships,
    onUpdateRelationships,
    pushUndoSnapshot,
    takeSnapshot,
    zoomRef,
    getNodeInfo,
  });

  const createQuickRelationship = useCallback(
    (sourceId: string, targetId: string) => {
      pushUndoSnapshot();
      const isJuncSource = junctions.some((j) => j.id === sourceId);
      const isJuncTarget = junctions.some((j) => j.id === targetId);
      const defaultLabel = isJuncSource || isJuncTarget ? 'Lineage / Branch' : 'Allies';

      const newRel: CharacterRelationship = {
        id: `rel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sourceId,
        targetId,
        type: isJuncSource || isJuncTarget ? 'Family' : 'Alliance',
        label: defaultLabel,
        style: 'solid',
        color: isJuncSource || isJuncTarget ? 'emerald' : 'blue',
        direction: 'directed',
      };

      if (onUpdateRelationships) {
        onUpdateRelationships([...relationships, newRel]);
      }

      setSelectedRelId(newRel.id);
      setSelectedJunctionId(null);
      setConnectingSourceId(null);
      setElasticCursor(null);
    },
    [pushUndoSnapshot, junctions, onUpdateRelationships, relationships, setSelectedRelId, setSelectedJunctionId]
  );

  const startConnecting = (nodeId: string, clientX?: number, clientY?: number) => {
    setConnectingSourceId(nodeId);
    setSelectedRelId(null);
    setSelectedJunctionId(null);
    setEditingCardId(null);

    if (boardRef.current && clientX !== undefined && clientY !== undefined) {
      const rect = boardRef.current.getBoundingClientRect();
      const currentZoom = zoomRef.current || 1.0;
      const worldX = (clientX - rect.left - pan.x) / currentZoom;
      const worldY = (clientY - rect.top - pan.y) / currentZoom;
      setElasticCursor({ x: worldX, y: worldY });
    }
  };

  return {
    connectingSourceId,
    elasticCursor,
    draggingRelId,
    justDraggedRelRef,
    setConnectingSourceId,
    setElasticCursor,
    createQuickRelationship,
    handlePillPointerDown,
    handlePillPointerMove,
    handlePillPointerUp,
    handlePillDoubleClick,
    startConnecting,
  };
}
