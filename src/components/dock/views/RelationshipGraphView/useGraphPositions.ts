import { useState, useRef, useEffect, useCallback } from 'react';
import {
  CharacterItem,
  GraphJunctionNode,
  CharacterNodePosition,
} from '../../../../types/dock';
import { NodePosition, NodeInfo, GraphSnapshot } from './types';
import { useNodeDrag } from './useNodeDrag';

interface UseGraphPositionsProps {
  characters: CharacterItem[];
  junctions: GraphJunctionNode[];
  characterPositions?: CharacterNodePosition[];
  onUpdateCharacterPositions?: (positions: CharacterNodePosition[]) => void;
  updateJunctions: (juncs: GraphJunctionNode[]) => void;
  pushUndoSnapshot: (customSnapshot?: GraphSnapshot) => void;
  takeSnapshot: () => GraphSnapshot;
  zoomRef: React.MutableRefObject<number>;
  connectingSourceId: string | null;
  createQuickRelationship: (sourceId: string, targetId: string) => void;
  setConnectingSourceId: (id: string | null) => void;
  setElasticCursor: (cur: { x: number; y: number } | null) => void;
}

export function useGraphPositions({
  characters,
  junctions,
  characterPositions,
  onUpdateCharacterPositions,
  updateJunctions,
  pushUndoSnapshot,
  takeSnapshot,
  zoomRef,
  connectingSourceId,
  createQuickRelationship,
  setConnectingSourceId,
  setElasticCursor,
}: UseGraphPositionsProps) {
  const [positions, setPositions] = useState<Record<string, NodePosition>>(() => {
    const init: Record<string, NodePosition> = {};
    if (characterPositions && characterPositions.length > 0) {
      characterPositions.forEach((pos) => {
        init[pos.characterId] = { x: pos.x, y: pos.y };
      });
    }
    if (junctions && junctions.length > 0) {
      junctions.forEach((junc) => {
        init[junc.id] = { x: junc.x, y: junc.y };
      });
    }
    return init;
  });

  const positionsRef = useRef<Record<string, NodePosition>>(positions);
  positionsRef.current = positions;

  // Synchronize positions if characterPositions prop changes externally
  useEffect(() => {
    if (!characterPositions || characterPositions.length === 0) return;
    setPositions((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const cp of characterPositions) {
        if (!next[cp.characterId] || next[cp.characterId].x !== cp.x || next[cp.characterId].y !== cp.y) {
          next[cp.characterId] = { x: cp.x, y: cp.y };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [characterPositions]);

  // Synchronize positions if junctions prop changes externally
  useEffect(() => {
    if (!junctions || junctions.length === 0) return;
    setPositions((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const junc of junctions) {
        if (!next[junc.id] || next[junc.id].x !== junc.x || next[junc.id].y !== junc.y) {
          next[junc.id] = { x: junc.x, y: junc.y };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [junctions]);

  // Initial circular layout if positions not yet populated
  useEffect(() => {
    setPositions((prev) => {
      let changed = false;
      const next = { ...prev };
      const centerX = 360;
      const centerY = 240;
      const radius = Math.max(160, Math.min(300, characters.length * 45));

      characters.forEach((char, index) => {
        if (!next[char.id]) {
          const angle = (index / characters.length) * 2 * Math.PI;
          next[char.id] = {
            x: Math.round(centerX + radius * Math.cos(angle) - 80),
            y: Math.round(centerY + radius * Math.sin(angle) - 40),
          };
          changed = true;
        }
      });

      junctions.forEach((junc) => {
        if (!next[junc.id]) {
          next[junc.id] = { x: junc.x, y: junc.y };
          changed = true;
        }
      });

      if (changed && onUpdateCharacterPositions) {
        const charPositionsList: CharacterNodePosition[] = characters.map((c) => ({
          characterId: c.id,
          x: next[c.id]?.x ?? 100,
          y: next[c.id]?.y ?? 100,
        }));
        onUpdateCharacterPositions(charPositionsList);
      }

      return changed ? next : prev;
    });
  }, [characters, junctions, onUpdateCharacterPositions]);

  const {
    handleNodePointerDown,
    handleNodePointerMove,
    handleNodePointerUp,
  } = useNodeDrag({
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
  });

  const resetLayout = useCallback(() => {
    if (!characters.length && !junctions.length) return;
    pushUndoSnapshot();
    const newPositions: Record<string, NodePosition> = {};
    const centerX = 360;
    const centerY = 240;
    const radius = Math.max(160, Math.min(300, characters.length * 45));

    characters.forEach((char, index) => {
      const angle = (index / characters.length) * 2 * Math.PI;
      newPositions[char.id] = {
        x: Math.round(centerX + radius * Math.cos(angle) - 80),
        y: Math.round(centerY + radius * Math.sin(angle) - 40),
      };
    });

    junctions.forEach((junc) => {
      newPositions[junc.id] = { x: junc.x, y: junc.y };
    });

    setPositions(newPositions);
    if (onUpdateCharacterPositions) {
      onUpdateCharacterPositions(
        characters.map((c) => ({
          characterId: c.id,
          x: newPositions[c.id].x,
          y: newPositions[c.id].y,
        }))
      );
    }
  }, [characters, junctions, onUpdateCharacterPositions, pushUndoSnapshot]);

  const getNodeInfo = useCallback(
    (id: string): NodeInfo | null => {
      const pos = positions[id];
      if (!pos) return null;
      const isJunc = junctions.some((j) => j.id === id);
      if (isJunc) {
        return {
          cx: pos.x + 14,
          cy: pos.y + 14,
          isJunction: true,
        };
      }
      return {
        cx: pos.x + 80,
        cy: pos.y + 36,
        isJunction: false,
      };
    },
    [positions, junctions]
  );

  return {
    positions,
    positionsRef,
    setPositions,
    handleNodePointerDown,
    handleNodePointerMove,
    handleNodePointerUp,
    resetLayout,
    getNodeInfo,
  };
}
