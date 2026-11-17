import { useState, useRef, useCallback } from 'react';
import { CharacterItem, CharacterRelationship, GraphJunctionNode, CharacterNodePosition } from '../../../../types/dock';
import { CanvasContextMenuState, NodePosition, SelectionTool, SelectionBox, SelectionLasso } from './types';

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
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  const [selectionTool, setSelectionTool] = useState<SelectionTool>('pointer');
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [selectionLasso, setSelectionLasso] = useState<SelectionLasso | null>(null);

  const [hoveredJunctionId, setHoveredJunctionId] = useState<string | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<CanvasContextMenuState | null>(null);

  const [isCreatingChar, setIsCreatingChar] = useState(false);
  const [newCharCoords, setNewCharCoords] = useState<{ x: number; y: number }>({ x: 200, y: 150 });
  const [isCreatingRel, setIsCreatingRel] = useState(false);

  const cardPointerCoordRef = useRef<{ x: number; y: number } | null>(null);

  const clipboardRef = useRef<{
    characters: CharacterItem[];
    junctions: GraphJunctionNode[];
    positions: Record<string, NodePosition>;
    relationships: CharacterRelationship[];
  } | null>(null);
  const [canPaste, setCanPaste] = useState(false);

  const toggleNodeSelection = useCallback((id: string) => {
    setSelectedNodeIds((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter((item) => item !== id);
      } else {
        next = [...prev, id];
      }

      if (next.length === 1) {
        if (characters.some((c) => c.id === next[0])) {
          setEditingCardId(next[0]);
          setSelectedJunctionId(null);
        } else if (junctions.some((j) => j.id === next[0])) {
          setSelectedJunctionId(next[0]);
          setEditingCardId(null);
        }
      } else {
        setEditingCardId(null);
        setSelectedJunctionId(null);
      }
      setSelectedRelId(null);
      return next;
    });
  }, [characters, junctions]);

  const selectSingleNode = useCallback((id: string) => {
    setSelectedNodeIds([id]);
    if (characters.some((c) => c.id === id)) {
      setEditingCardId(id);
      setSelectedJunctionId(null);
    } else if (junctions.some((j) => j.id === id)) {
      setSelectedJunctionId(id);
      setEditingCardId(null);
    }
    setSelectedRelId(null);
  }, [characters, junctions]);

  const clearSelection = useCallback(() => {
    setSelectedNodeIds([]);
    setEditingCardId(null);
    setSelectedJunctionId(null);
    setSelectedRelId(null);
  }, []);

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
      setSelectedNodeIds((prev) => prev.filter((item) => item !== id));
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
      setSelectedNodeIds((prev) => prev.filter((item) => item !== id));
    },
    [pushUndoSnapshot, onUpdateRelationships, relationships, onUpdateCharacters, characters, positions, setPositions, onUpdateCharacterPositions]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedRelId) {
      handleDeleteRelationship(selectedRelId);
      return;
    }

    if (selectedNodeIds.length > 0) {
      pushUndoSnapshot();
      const nodeSet = new Set(selectedNodeIds);

      // Eliminar relaciones conectadas a cualquiera de los nodos seleccionados
      onUpdateRelationships?.(
        relationships.filter((r) => !nodeSet.has(r.sourceId) && !nodeSet.has(r.targetId))
      );

      // Eliminar personajes seleccionados
      const remainingChars = characters.filter((c) => !nodeSet.has(c.id));
      onUpdateCharacters?.(remainingChars);

      // Eliminar junctions seleccionados
      const remainingJuncs = junctions.filter((j) => !nodeSet.has(j.id));
      updateJunctions(remainingJuncs);

      // Eliminar posiciones
      setPositions((prev) => {
        const next = { ...prev };
        for (const id of selectedNodeIds) {
          delete next[id];
        }
        return next;
      });

      if (onUpdateCharacterPositions) {
        onUpdateCharacterPositions(
          remainingChars.map((c) => ({
            characterId: c.id,
            x: positions[c.id]?.x ?? 100,
            y: positions[c.id]?.y ?? 100,
          }))
        );
      }

      setSelectedNodeIds([]);
      setEditingCardId(null);
      setSelectedJunctionId(null);
      return;
    }

    if (selectedJunctionId) handleDeleteJunction(selectedJunctionId);
    else if (editingCardId) handleDeleteCharacter(editingCardId);
  }, [
    selectedRelId,
    selectedNodeIds,
    selectedJunctionId,
    editingCardId,
    handleDeleteRelationship,
    handleDeleteJunction,
    handleDeleteCharacter,
    pushUndoSnapshot,
    onUpdateRelationships,
    relationships,
    characters,
    onUpdateCharacters,
    junctions,
    updateJunctions,
    setPositions,
    onUpdateCharacterPositions,
    positions,
  ]);

  const handleCopy = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    const selectedSet = new Set(selectedNodeIds);

    const copiedChars = characters.filter((c) => selectedSet.has(c.id));
    const copiedJuncs = junctions.filter((j) => selectedSet.has(j.id));

    // Regla: Las relaciones solo se mantendrán si se copian ambos elementos relacionados.
    // Si solo se seleccionó uno de los elementos relacionados, la relación desaparecerá.
    const copiedRels = relationships.filter(
      (r) => selectedSet.has(r.sourceId) && selectedSet.has(r.targetId)
    );

    const copiedPos: Record<string, NodePosition> = {};
    for (const id of selectedNodeIds) {
      if (positions[id]) {
        copiedPos[id] = { ...positions[id] };
      }
    }

    clipboardRef.current = {
      characters: copiedChars,
      junctions: copiedJuncs,
      positions: copiedPos,
      relationships: copiedRels,
    };
    setCanPaste(true);
  }, [selectedNodeIds, characters, junctions, relationships, positions]);

  const handlePaste = useCallback(() => {
    if (!clipboardRef.current) return;
    const clip = clipboardRef.current;
    if (clip.characters.length === 0 && clip.junctions.length === 0) return;

    pushUndoSnapshot();

    const idMap: Record<string, string> = {};
    const newPositions: Record<string, NodePosition> = { ...positions };
    const offset = 40;

    // 1. Clonar personajes
    const newChars: CharacterItem[] = clip.characters.map((char) => {
      const newId = `char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      idMap[char.id] = newId;
      const oldPos = clip.positions[char.id] || { x: 100, y: 100 };
      newPositions[newId] = { x: oldPos.x + offset, y: oldPos.y + offset };
      return {
        ...char,
        id: newId,
        name: `${char.name} (Copy)`,
      };
    });

    // 2. Clonar junctions
    const newJuncs: GraphJunctionNode[] = clip.junctions.map((junc) => {
      const newId = `junction-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      idMap[junc.id] = newId;
      const oldPos = clip.positions[junc.id] || { x: junc.x, y: junc.y };
      newPositions[newId] = { x: oldPos.x + offset, y: oldPos.y + offset };
      return {
        ...junc,
        id: newId,
        x: oldPos.x + offset,
        y: oldPos.y + offset,
      };
    });

    // 3. Clonar relaciones SOLO si ambos extremos fueron copiados juntos
    const newRels: CharacterRelationship[] = [];
    for (const rel of clip.relationships) {
      const mappedSource = idMap[rel.sourceId];
      const mappedTarget = idMap[rel.targetId];
      if (mappedSource && mappedTarget) {
        newRels.push({
          ...rel,
          id: `rel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sourceId: mappedSource,
          targetId: mappedTarget,
        });
      }
    }

    if (newChars.length > 0) {
      onUpdateCharacters?.([...characters, ...newChars]);
    }
    if (newJuncs.length > 0) {
      updateJunctions([...junctions, ...newJuncs]);
    }
    if (newRels.length > 0) {
      onUpdateRelationships?.([...relationships, ...newRels]);
    }

    setPositions(newPositions);
    if (onUpdateCharacterPositions) {
      const allCharacters = [...characters, ...newChars];
      onUpdateCharacterPositions(
        allCharacters.map((c) => ({
          characterId: c.id,
          x: newPositions[c.id]?.x ?? 100,
          y: newPositions[c.id]?.y ?? 100,
        }))
      );
    }

    const newIds = Object.values(idMap);
    setSelectedNodeIds(newIds);
    if (newIds.length === 1 && newChars.length === 1) {
      setEditingCardId(newChars[0].id);
    } else {
      setEditingCardId(null);
    }
    setSelectedRelId(null);
    setSelectedJunctionId(null);

    // Incrementar offset en clip.positions para sucesivos pegados
    for (const oldId of Object.keys(clip.positions)) {
      clip.positions[oldId].x += offset;
      clip.positions[oldId].y += offset;
    }
  }, [
    characters,
    junctions,
    relationships,
    positions,
    pushUndoSnapshot,
    onUpdateCharacters,
    updateJunctions,
    onUpdateRelationships,
    setPositions,
    onUpdateCharacterPositions,
  ]);

  const handleCardClick = (e: React.MouseEvent, charId: string) => {
    e.stopPropagation();
    if (connectingSourceId) {
      if (connectingSourceId !== charId) createQuickRelationship(connectingSourceId, charId);
      setConnectingSourceId(null);
      setElasticCursor(null);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      toggleNodeSelection(charId);
      return;
    }

    selectSingleNode(charId);
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
    setSelectedNodeIds((prev) => prev.map((id) => (id === oldCharId ? newCharId : id)));
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
    selectedNodeIds,
    selectionTool,
    selectionBox,
    selectionLasso,
    hoveredJunctionId,
    canvasContextMenu,
    isCreatingChar,
    newCharCoords,
    isCreatingRel,
    cardPointerCoordRef,
    canCopy: selectedNodeIds.length > 0,
    canPaste,
    setSelectedRelId,
    setSelectedJunctionId,
    setEditingCardId,
    setSelectedNodeIds,
    setSelectionTool,
    setSelectionBox,
    setSelectionLasso,
    toggleNodeSelection,
    selectSingleNode,
    clearSelection,
    setHoveredJunctionId,
    setCanvasContextMenu,
    setIsCreatingChar,
    setNewCharCoords,
    setIsCreatingRel,
    handleDeleteRelationship,
    handleDeleteJunction,
    handleDeleteCharacter,
    handleDeleteSelected,
    handleCopy,
    handlePaste,
    handleCardClick,
    handleCardMouseUp,
    handleReassignCardCharacter,
    handleCreateChar,
    handleCreateRel,
  };
}
