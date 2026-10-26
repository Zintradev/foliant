import { useState, useRef, useCallback } from 'react';
import {
  CharacterItem,
  CharacterRelationship,
  GraphJunctionNode,
  CharacterNodePosition,
} from '../../../../types/dock';
import { GraphSnapshot, NodePosition } from './types';

interface UseGraphHistoryProps {
  positionsRef: React.MutableRefObject<Record<string, NodePosition>>;
  relationshipsRef: React.MutableRefObject<CharacterRelationship[]>;
  junctionsRef: React.MutableRefObject<GraphJunctionNode[]>;
  charactersRef: React.MutableRefObject<CharacterItem[]>;
  setPositions: React.Dispatch<React.SetStateAction<Record<string, NodePosition>>>;
  updateJunctions: (juncs: GraphJunctionNode[]) => void;
  onUpdateCharacterPositions?: (positions: CharacterNodePosition[]) => void;
  onUpdateRelationships?: (updated: CharacterRelationship[]) => void;
  onUpdateCharacters?: (updated: CharacterItem[]) => void;
}

export function useGraphHistory({
  positionsRef,
  relationshipsRef,
  junctionsRef,
  charactersRef,
  setPositions,
  updateJunctions,
  onUpdateCharacterPositions,
  onUpdateRelationships,
  onUpdateCharacters,
}: UseGraphHistoryProps) {
  const undoStackRef = useRef<GraphSnapshot[]>([]);
  const redoStackRef = useRef<GraphSnapshot[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const takeSnapshot = useCallback((): GraphSnapshot => {
    return {
      positions: { ...positionsRef.current },
      relationships: relationshipsRef.current.map((r) => ({
        ...r,
        controlOffset: r.controlOffset ? { ...r.controlOffset } : undefined,
      })),
      junctions: junctionsRef.current.map((j) => ({ ...j })),
      characters: charactersRef.current.map((c) => ({ ...c })),
    };
  }, [positionsRef, relationshipsRef, junctionsRef, charactersRef]);

  const pushUndoSnapshot = useCallback(
    (customSnapshot?: GraphSnapshot) => {
      const snap = customSnapshot ?? takeSnapshot();
      undoStackRef.current.push(snap);
      if (undoStackRef.current.length > 50) {
        undoStackRef.current.shift();
      }
      redoStackRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
    },
    [takeSnapshot]
  );

  const applySnapshot = useCallback(
    (snap: GraphSnapshot) => {
      setPositions(snap.positions);
      if (onUpdateCharacterPositions) {
        const list: CharacterNodePosition[] = snap.characters.map((c) => ({
          characterId: c.id,
          x: snap.positions[c.id]?.x ?? 100,
          y: snap.positions[c.id]?.y ?? 100,
        }));
        onUpdateCharacterPositions(list);
      }
      if (onUpdateRelationships) {
        onUpdateRelationships(snap.relationships);
      }
      updateJunctions(snap.junctions);
      if (snap.characters && onUpdateCharacters) {
        onUpdateCharacters(snap.characters);
      }
    },
    [onUpdateCharacterPositions, onUpdateRelationships, updateJunctions, onUpdateCharacters, setPositions]
  );

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const previous = undoStackRef.current.pop()!;
    const current = takeSnapshot();
    redoStackRef.current.push(current);
    if (redoStackRef.current.length > 50) {
      redoStackRef.current.shift();
    }
    applySnapshot(previous);
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
  }, [takeSnapshot, applySnapshot]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    const current = takeSnapshot();
    undoStackRef.current.push(current);
    if (undoStackRef.current.length > 50) {
      undoStackRef.current.shift();
    }
    applySnapshot(next);
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
  }, [takeSnapshot, applySnapshot]);

  return {
    canUndo,
    canRedo,
    takeSnapshot,
    pushUndoSnapshot,
    handleUndo,
    handleRedo,
  };
}
