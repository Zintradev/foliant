import { useState, useRef, useCallback } from 'react';
import { CharacterItem, CharacterRelationship, GraphJunctionNode, CharacterNodePosition } from '../../../../types/dock';
import { CanvasContextMenuState, NodePosition } from './types';

interface UseGraphSelectionProps {
  characters: CharacterItem[];
  relationships: CharacterRelationship[];
  junctions: GraphJunctionNode[];
  positions: Record<string, NodePosition>;
  setPositions: React.Dispatch<React.SetStateAction<Record<string, NodePosition>>>;
  updateJunctions: (juncs: GraphJunctionNode[]) => void;
  onUpdateRelationships?: (updated: CharacterRelationship[]) => void;
  onUpdateCharacters?: (updated: CharacterItem[]) => void;
  onUpdateCharacterPositions?: (positions: CharacterNodePosition[]) => void;
  onAddCharacter?: (char: CharacterItem) => void;
  pushUndoSnapshot: () => void;
  createQuickRelationship: (sourceId: string, targetId: string) => void;
  connectingSourceId: string | null;
  setConnectingSourceId: (id: string | null) => void;
  setElasticCursor: (cur: { x: number; y: number } | null) => void;
}

export function useGraphSelection({
  characters,
  relationships,
  junctions,
  positions,
  setPositions,
  updateJunctions,
  onUpdateRelationships,
  onUpdateCharacters,
  onUpdateCharacterPositions,
  onAddCharacter,
  pushUndoSnapshot,
  createQuickRelationship,
  connectingSourceId,
  setConnectingSourceId,
  setElasticCursor,
}: UseGraphSelectionProps) {
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null);
  const [selectedJunctionId, setSelectedJunctionId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [hoveredJunctionId, setHoveredJunctionId] = useState<string | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<CanvasContextMenuState | null>(null);

  const [isCreatingChar, setIsCreatingChar] = useState(false);
  const [newCharCoords, setNewCharCoords] = useState<{ x: number; y: number }>({ x: 200, y: 150 });
  const [isCreatingRel, setIsCreatingRel] = useState(false);

  const cardPointerCoordRef = useRef<{ x: number; y: number } | null>(null);

  const handleDeleteRelationship = useCallback(
    (id: string) => {
      pushUndoSnapshot();
      onUpdateRelationships?.(relationships.filter((r) => r.id !== id));
      setSelectedRelId(null);
    },
    [pushUndoSnapshot, onUpdateRelationships, relationships]
  );

  const handleDeleteJunction = useCallback(
    (id: string) => {
      pushUndoSnapshot();
      updateJunctions(junctions.filter((j) => j.id !== id));
      onUpdateRelationships?.(relationships.filter((r) => r.sourceId !== id && r.targetId !== id));
      setSelectedJunctionId(null);
    },
    [pushUndoSnapshot, updateJunctions, junctions, onUpdateRelationships, relationships]
  );

  const handleDeleteCharacter = useCallback(
    (id: string) => {
      pushUndoSnapshot();
      onUpdateRelationships?.(relationships.filter((r) => r.sourceId !== id && r.targetId !== id));
      onUpdateCharacters?.(characters.filter((c) => c.id !== id));
      setPositions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (onUpdateCharacterPositions) {
        onUpdateCharacterPositions(
          characters
            .filter((c) => c.id !== id)
            .map((c) => ({
              characterId: c.id,
              x: positions[c.id]?.x ?? 100,
              y: positions[c.id]?.y ?? 100,
            }))
        );
      }
      setEditingCardId(null);
    },
    [pushUndoSnapshot, onUpdateRelationships, relationships, onUpdateCharacters, characters, positions, setPositions, onUpdateCharacterPositions]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedRelId) handleDeleteRelationship(selectedRelId);
    else if (selectedJunctionId) handleDeleteJunction(selectedJunctionId);
    else if (editingCardId) handleDeleteCharacter(editingCardId);
  }, [selectedRelId, selectedJunctionId, editingCardId, handleDeleteRelationship, handleDeleteJunction, handleDeleteCharacter]);

  const handleCardClick = (e: React.MouseEvent, charId: string) => {
    e.stopPropagation();
    if (connectingSourceId) {
      if (connectingSourceId !== charId) createQuickRelationship(connectingSourceId, charId);
      setConnectingSourceId(null);
      setElasticCursor(null);
      return;
    }
    setEditingCardId(charId);
    setSelectedRelId(null);
    setSelectedJunctionId(null);
  };

  const handleCardMouseUp = (e: React.MouseEvent, charId: string) => {
    if (e.button !== 0 || !cardPointerCoordRef.current) return;
    const delta = Math.hypot(e.clientX - cardPointerCoordRef.current.x, e.clientY - cardPointerCoordRef.current.y);
    cardPointerCoordRef.current = null;
    if (delta > 3) return;
    handleCardClick(e, charId);
  };

  const handleReassignCardCharacter = (oldCharId: string, newCharId: string) => {
    if (oldCharId === newCharId) return;
    pushUndoSnapshot();
    setPositions((prev) => {
      const next = { ...prev };
      if (next[oldCharId]) {
        next[newCharId] = next[oldCharId];
        delete next[oldCharId];
      }
      return next;
    });
    onUpdateRelationships?.(
      relationships.map((r) => {
        let s = r.sourceId;
        let t = r.targetId;
        if (s === oldCharId) s = newCharId;
        if (t === oldCharId) t = newCharId;
        return { ...r, sourceId: s, targetId: t };
      })
    );
    setEditingCardId(newCharId);
  };

  const handleCreateChar = (newChar: CharacterItem, coords: { x: number; y: number }) => {
    pushUndoSnapshot();
    if (onAddCharacter) onAddCharacter(newChar);
    else onUpdateCharacters?.([...characters, newChar]);
    const placedPos = { x: coords.x - 80, y: coords.y - 42 };
    setPositions((prev) => ({ ...prev, [newChar.id]: placedPos }));
    if (onUpdateCharacterPositions) {
      onUpdateCharacterPositions([
        ...characters.map((c) => ({
          characterId: c.id,
          x: positions[c.id]?.x ?? 100,
          y: positions[c.id]?.y ?? 100,
        })),
        { characterId: newChar.id, x: placedPos.x, y: placedPos.y },
      ]);
    }
    setIsCreatingChar(false);
  };

  const handleCreateRel = (newRel: CharacterRelationship) => {
    pushUndoSnapshot();
    onUpdateRelationships?.([...relationships, newRel]);
    setIsCreatingRel(false);
  };

  return {
    selectedRelId,
    selectedJunctionId,
    editingCardId,
    hoveredJunctionId,
    canvasContextMenu,
    isCreatingChar,
    newCharCoords,
    isCreatingRel,
    cardPointerCoordRef,
    setSelectedRelId,
    setSelectedJunctionId,
    setEditingCardId,
    setHoveredJunctionId,
    setCanvasContextMenu,
    setIsCreatingChar,
    setNewCharCoords,
    setIsCreatingRel,
    handleDeleteRelationship,
    handleDeleteJunction,
    handleDeleteCharacter,
    handleDeleteSelected,
    handleCardClick,
    handleCardMouseUp,
    handleReassignCardCharacter,
    handleCreateChar,
    handleCreateRel,
  };
}
