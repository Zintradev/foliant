import { useState, useMemo, useRef, useCallback, memo } from 'react';
import { GraphJunctionNode } from '../../../../types/dock';
import { RelationshipGraphViewProps } from './types';
import { useGraphZoomPan } from './useGraphZoomPan';
import { useGraphPositions } from './useGraphPositions';
import { useGraphHistory } from './useGraphHistory';
import { useGraphConnections } from './useGraphConnections';
import { useGraphShortcuts } from './useGraphShortcuts';
import { useGraphSelection } from './useGraphSelection';
import { useBoardCanvasProps } from './useBoardCanvasProps';
import { RelationshipGraphHeader } from './RelationshipGraphHeader';
import { RelationshipBoardCanvas } from './RelationshipBoardCanvas';
import { RelationshipInspectorPanel } from './RelationshipInspectorPanel';
import { JunctionInspectorPanel } from './JunctionInspectorPanel';
import { CharacterRepresentationDrawer } from './CharacterRepresentationDrawer';
import { QuickCharacterModal } from './QuickCharacterModal';
import { CreateRelationshipModal } from './CreateRelationshipModal';

function RelationshipGraphViewComponent({
  characters,
  relationships,
  storylines = [],
  junctions: propJunctions,
  characterPositions,
  onUpdateRelationships,
  onUpdateCharacters,
  onUpdateJunctions,
  onUpdateCharacterPositions,
  onAddCharacter,
  isExpanded = false,
}: RelationshipGraphViewProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);

  const [internalJunctions, setInternalJunctions] = useState<GraphJunctionNode[]>([]);
  const junctions = propJunctions ?? internalJunctions;
  const updateJunctions = useCallback(
    (newJuncs: GraphJunctionNode[]) => {
      onUpdateJunctions?.(newJuncs);
      setInternalJunctions(newJuncs);
    },
    [onUpdateJunctions]
  );

  const [filterType, setFilterType] = useState<string>('all');
  const zoomPanHook = useGraphZoomPan(boardRef);

  const relationshipsRef = useRef(relationships);
  relationshipsRef.current = relationships;
  const junctionsRef = useRef(junctions);
  junctionsRef.current = junctions;
  const charactersRef = useRef(characters);
  charactersRef.current = characters;

  const dummyPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const { canUndo, canRedo, takeSnapshot, pushUndoSnapshot, handleUndo, handleRedo } = useGraphHistory({
    positionsRef: dummyPositionsRef,
    relationshipsRef,
    junctionsRef,
    charactersRef,
    setPositions: () => {},
    updateJunctions,
    onUpdateCharacterPositions,
    onUpdateRelationships,
    onUpdateCharacters,
  });

  const selectionHook = useGraphSelection({
    characters,
    relationships,
    junctions,
    positions: dummyPositionsRef.current,
    setPositions: () => {},
    updateJunctions,
    onUpdateRelationships,
    onUpdateCharacters,
    onUpdateCharacterPositions,
    onAddCharacter,
    pushUndoSnapshot,
    createQuickRelationship: (...args) => connectionsHook.createQuickRelationship(...args),
    connectingSourceId: null,
    setConnectingSourceId: () => {},
    setElasticCursor: () => {},
  });

  const connectionsHook = useGraphConnections({
    relationships,
    junctions,
    onUpdateRelationships,
    pushUndoSnapshot,
    takeSnapshot,
    zoomRef: zoomPanHook.zoomRef,
    pan: zoomPanHook.pan,
    getNodeInfo: (id) => positionsHook.getNodeInfo(id),
    boardRef,
    setSelectedRelId: selectionHook.setSelectedRelId,
    setSelectedJunctionId: selectionHook.setSelectedJunctionId,
    setEditingCardId: selectionHook.setEditingCardId,
  });

  const positionsHook = useGraphPositions({
    characters,
    junctions,
    characterPositions,
    onUpdateCharacterPositions,
    updateJunctions,
    pushUndoSnapshot,
    takeSnapshot,
    zoomRef: zoomPanHook.zoomRef,
    connectingSourceId: connectionsHook.connectingSourceId,
    createQuickRelationship: connectionsHook.createQuickRelationship,
    setConnectingSourceId: connectionsHook.setConnectingSourceId,
    setElasticCursor: connectionsHook.setElasticCursor,
  });
  dummyPositionsRef.current = positionsHook.positions;

  useGraphShortcuts({
    handleUndo,
    handleRedo,
    handleDeleteSelected: selectionHook.handleDeleteSelected,
    onEscape: () => {
      connectionsHook.setConnectingSourceId(null);
      connectionsHook.setElasticCursor(null);
      selectionHook.setSelectedRelId(null);
      selectionHook.setSelectedJunctionId(null);
      selectionHook.setCanvasContextMenu(null);
      selectionHook.setEditingCardId(null);
    },
    selectedRelId: selectionHook.selectedRelId,
    selectedJunctionId: selectionHook.selectedJunctionId,
    editingCardId: selectionHook.editingCardId,
  });

  const getNodeLabel = (id: string): string => {
    const char = characters.find((c) => c.id === id);
    if (char) return char.name;
    const junc = junctions.find((j) => j.id === id);
    return junc?.label || 'Union Node';
  };

  const visibleRelationships = useMemo(() => {
    if (filterType === 'all') return relationships;
    return relationships.filter((r) => (r.color || 'blue') === filterType);
  }, [relationships, filterType]);

  const boardCanvasProps = useBoardCanvasProps({
    boardRef,
    characters,
    junctions,
    storylines,
    visibleRelationships,
    updateJunctions,
    pushUndoSnapshot,
    zoomPanHook,
    positionsHook,
    connectionsHook,
    selectionHook,
  });

  const selectedRel = relationships.find((r) => r.id === selectionHook.selectedRelId);
  const editingCharacter = characters.find((c) => c.id === selectionHook.editingCardId);
  const selectedJunction = junctions.find((j) => j.id === selectionHook.selectedJunctionId);
  const connectingSourceChar = characters.find((c) => c.id === connectionsHook.connectingSourceId);
  const connectingSourceJunc = junctions.find((j) => j.id === connectionsHook.connectingSourceId);
  const connectingSourceName = connectingSourceChar?.name || connectingSourceJunc?.label || null;

  return (
    <div className={`flex flex-col h-full select-none overflow-hidden touch-none bg-zinc-950 font-sans relative ${isExpanded ? 'p-2' : ''}`}>
      <RelationshipGraphHeader
        isExpanded={isExpanded}
        charactersCount={characters.length}
        junctionsCount={junctions.length}
        relationshipsCount={relationships.length}
        connectingSourceName={connectingSourceName}
        filterType={filterType}
        canUndo={canUndo}
        canRedo={canRedo}
        canConnect={characters.length >= 2}
        onFilterChange={setFilterType}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetLayout={() => {
          positionsHook.resetLayout();
          zoomPanHook.handleResetViewport();
        }}
        onCancelConnecting={() => {
          connectionsHook.setConnectingSourceId(null);
          connectionsHook.setElasticCursor(null);
        }}
        onOpenConnectModal={() => selectionHook.setIsCreatingRel(true)}
        onHeaderClick={() => {
          selectionHook.setEditingCardId(null);
          selectionHook.setSelectedRelId(null);
          selectionHook.setSelectedJunctionId(null);
        }}
      />

      <RelationshipBoardCanvas {...boardCanvasProps} />

      {selectedRel && (
        <RelationshipInspectorPanel
          selectedRel={selectedRel}
          sourceLabel={getNodeLabel(selectedRel.sourceId)}
          targetLabel={getNodeLabel(selectedRel.targetId)}
          onClose={() => selectionHook.setSelectedRelId(null)}
          onUpdateRel={(updated) => {
            pushUndoSnapshot();
            onUpdateRelationships?.(relationships.map((r) => (r.id === updated.id ? updated : r)));
          }}
          onDeleteRel={selectionHook.handleDeleteRelationship}
          onResetCurve={(id) => {
            pushUndoSnapshot();
            onUpdateRelationships?.(relationships.map((r) => (r.id === id ? { ...r, controlOffset: undefined, labelT: undefined } : r)));
          }}
        />
      )}

      {selectedJunction && (
        <JunctionInspectorPanel
          junction={selectedJunction}
          storylines={storylines}
          onClose={() => selectionHook.setSelectedJunctionId(null)}
          onUpdateJunction={(updated) => {
            pushUndoSnapshot();
            updateJunctions(junctions.map((j) => (j.id === updated.id ? updated : j)));
          }}
          onDeleteJunction={selectionHook.handleDeleteJunction}
        />
      )}

      {editingCharacter && (
        <CharacterRepresentationDrawer
          editingCharacter={editingCharacter}
          characters={characters}
          onClose={() => selectionHook.setEditingCardId(null)}
          onReassign={selectionHook.handleReassignCardCharacter}
          onDeleteCharacter={selectionHook.handleDeleteCharacter}
        />
      )}

      {selectionHook.isCreatingChar && (
        <QuickCharacterModal
          coords={selectionHook.newCharCoords}
          onClose={() => selectionHook.setIsCreatingChar(false)}
          onSubmit={selectionHook.handleCreateChar}
        />
      )}

      {selectionHook.isCreatingRel && (
        <CreateRelationshipModal
          characters={characters}
          junctions={junctions}
          onClose={() => selectionHook.setIsCreatingRel(false)}
          onSubmit={selectionHook.handleCreateRel}
        />
      )}
    </div>
  );
}

export default memo(RelationshipGraphViewComponent);
