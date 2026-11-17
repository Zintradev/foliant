import React from 'react';
import {
  CharacterItem,
  CharacterRelationship,
  GraphJunctionNode,
  StorylineItem,
} from '../../../../types/dock';
import { useGraphZoomPan } from './useGraphZoomPan';
import { useGraphPositions } from './useGraphPositions';
import { useGraphConnections } from './useGraphConnections';
import { useGraphSelection } from './useGraphSelection';
import { isNodeInBox, isNodeInLasso } from './geometry';

interface UseBoardCanvasPropsParams {
  boardRef: React.RefObject<HTMLDivElement | null>;
  characters: CharacterItem[];
  junctions: GraphJunctionNode[];
  storylines: StorylineItem[];
  visibleRelationships: CharacterRelationship[];
  updateJunctions: (juncs: GraphJunctionNode[]) => void;
  pushUndoSnapshot: () => void;
  zoomPanHook: ReturnType<typeof useGraphZoomPan>;
  positionsHook: ReturnType<typeof useGraphPositions>;
  connectionsHook: ReturnType<typeof useGraphConnections>;
  selectionHook: ReturnType<typeof useGraphSelection>;
}

export function useBoardCanvasProps({
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
}: UseBoardCanvasPropsParams) {
  const { zoom, pan, isPanning, isSpacePressed, startPan, handleZoomIn, handleZoomOut, handleResetViewport } = zoomPanHook;

  const handleCardClick = (e: React.MouseEvent, charId: string) => {
    e.stopPropagation();
    if (connectionsHook.connectingSourceId) {
      if (connectionsHook.connectingSourceId !== charId) {
        connectionsHook.createQuickRelationship(connectionsHook.connectingSourceId, charId);
      }
      connectionsHook.setConnectingSourceId(null);
      connectionsHook.setElasticCursor(null);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      selectionHook.toggleNodeSelection(charId);
      return;
    }

    selectionHook.selectSingleNode(charId);
  };

  const handleCardMouseUp = (e: React.MouseEvent, charId: string) => {
    if (e.button !== 0 || !selectionHook.cardPointerCoordRef.current) return;
    const delta = Math.hypot(e.clientX - selectionHook.cardPointerCoordRef.current.x, e.clientY - selectionHook.cardPointerCoordRef.current.y);
    selectionHook.cardPointerCoordRef.current = null;
    if (delta > 3) return;
    handleCardClick(e, charId);
  };

  const handleFinishSelection = (e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
    if (selectionHook.selectionBox) {
      const box = selectionHook.selectionBox;
      const newlySelected: string[] = [];

      for (const char of characters) {
        const pos = positionsHook.positions[char.id] || { x: 100, y: 100 };
        if (isNodeInBox(pos, false, box)) {
          newlySelected.push(char.id);
        }
      }

      for (const junc of junctions) {
        const pos = positionsHook.positions[junc.id] || { x: junc.x, y: junc.y };
        if (isNodeInBox(pos, true, box)) {
          newlySelected.push(junc.id);
        }
      }

      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        selectionHook.setSelectedNodeIds((prev) => Array.from(new Set([...prev, ...newlySelected])));
      } else {
        selectionHook.setSelectedNodeIds(newlySelected);
      }

      if (newlySelected.length === 1 && characters.some((c) => c.id === newlySelected[0])) {
        selectionHook.setEditingCardId(newlySelected[0]);
      }

      selectionHook.setSelectionBox(null);
    } else if (selectionHook.selectionLasso) {
      const lasso = selectionHook.selectionLasso;
      const newlySelected: string[] = [];

      for (const char of characters) {
        const pos = positionsHook.positions[char.id] || { x: 100, y: 100 };
        if (isNodeInLasso(pos, false, lasso.points)) {
          newlySelected.push(char.id);
        }
      }

      for (const junc of junctions) {
        const pos = positionsHook.positions[junc.id] || { x: junc.x, y: junc.y };
        if (isNodeInLasso(pos, true, lasso.points)) {
          newlySelected.push(junc.id);
        }
      }

      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        selectionHook.setSelectedNodeIds((prev) => Array.from(new Set([...prev, ...newlySelected])));
      } else {
        selectionHook.setSelectedNodeIds(newlySelected);
      }

      if (newlySelected.length === 1 && characters.some((c) => c.id === newlySelected[0])) {
        selectionHook.setEditingCardId(newlySelected[0]);
      }

      selectionHook.setSelectionLasso(null);
    }
  };

  return {
    boardRef,
    characters,
    junctions,
    storylines,
    positions: positionsHook.positions,
    visibleRelationships,
    selectedRelId: selectionHook.selectedRelId,
    selectedJunctionId: selectionHook.selectedJunctionId,
    editingCardId: selectionHook.editingCardId,
    selectedNodeIds: selectionHook.selectedNodeIds,
    selectionTool: selectionHook.selectionTool,
    selectionBox: selectionHook.selectionBox,
    selectionLasso: selectionHook.selectionLasso,
    hoveredJunctionId: selectionHook.hoveredJunctionId,
    connectingSourceId: connectionsHook.connectingSourceId,
    elasticCursor: connectionsHook.elasticCursor,
    draggingRelId: connectionsHook.draggingRelId,
    canvasContextMenu: selectionHook.canvasContextMenu,
    zoom,
    pan,
    isPanning,
    isSpacePressed,
    justDraggedRelRef: connectionsHook.justDraggedRelRef,
    getNodeInfo: positionsHook.getNodeInfo,
    onCanvasMouseDown: (e: React.MouseEvent) => {
      if (connectionsHook.connectingSourceId) {
        connectionsHook.setConnectingSourceId(null);
        connectionsHook.setElasticCursor(null);
        return;
      }
      const target = e.target as HTMLElement;
      if (target.closest('.character-card, .junction-node, .relationship-pill, button, select, input, textarea, .viewport-controls, .context-menu-box')) return;
      selectionHook.setCanvasContextMenu(null);

      if (e.button === 1 || isSpacePressed) {
        startPan(e.clientX, e.clientY);
        return;
      }

      if (e.button === 0) {
        if (!boardRef.current) return;
        const rect = boardRef.current.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - pan.x) / zoom;
        const worldY = (e.clientY - rect.top - pan.y) / zoom;

        // Selección en cuadrado
        if (selectionHook.selectionTool === 'box' || e.shiftKey) {
          selectionHook.setSelectionBox({
            startX: worldX,
            startY: worldY,
            currentX: worldX,
            currentY: worldY,
          });
          if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            selectionHook.clearSelection();
          }
          return;
        }

        // Selección a mano alzada
        if (selectionHook.selectionTool === 'lasso') {
          selectionHook.setSelectionLasso({
            points: [{ x: worldX, y: worldY }],
          });
          if (!e.ctrlKey && !e.metaKey) {
            selectionHook.clearSelection();
          }
          return;
        }

        // Modo pointer / paneo estándar
        if (!e.ctrlKey && !e.metaKey) {
          selectionHook.clearSelection();
        }
        startPan(e.clientX, e.clientY);
      }
    },
    onCanvasPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (connectionsHook.connectingSourceId && boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        connectionsHook.setElasticCursor({ x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom });
      }

      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - pan.x) / zoom;
      const worldY = (e.clientY - rect.top - pan.y) / zoom;

      if (selectionHook.selectionBox) {
        selectionHook.setSelectionBox({
          ...selectionHook.selectionBox,
          currentX: worldX,
          currentY: worldY,
        });
      } else if (selectionHook.selectionLasso) {
        selectionHook.setSelectionLasso({
          points: [...selectionHook.selectionLasso.points, { x: worldX, y: worldY }],
        });
      }
    },
    onCanvasPointerUp: handleFinishSelection,
    onCanvasContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      selectionHook.clearSelection();
      if (connectionsHook.connectingSourceId) {
        connectionsHook.setConnectingSourceId(null);
        connectionsHook.setElasticCursor(null);
        return;
      }
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      selectionHook.setCanvasContextMenu({ screenX, screenY, worldX: Math.round((screenX - pan.x) / zoom), worldY: Math.round((screenY - pan.y) / zoom) });
    },
    onSelectRel: (id: string) => {
      selectionHook.setSelectedRelId(id);
      selectionHook.setSelectedJunctionId(null);
      selectionHook.setEditingCardId(null);
      selectionHook.setSelectedNodeIds([]);
    },
    onSelectJunction: (id: string, e?: React.MouseEvent) => {
      if (connectionsHook.connectingSourceId) {
        if (connectionsHook.connectingSourceId !== id) connectionsHook.createQuickRelationship(connectionsHook.connectingSourceId, id);
        connectionsHook.setConnectingSourceId(null);
        connectionsHook.setElasticCursor(null);
        return;
      }

      if (e && (e.ctrlKey || e.metaKey)) {
        selectionHook.toggleNodeSelection(id);
        return;
      }

      selectionHook.selectSingleNode(id);
    },
    onHoverJunction: selectionHook.setHoveredJunctionId,
    onNodePointerDown: positionsHook.handleNodePointerDown,
    onNodePointerMove: positionsHook.handleNodePointerMove,
    onNodePointerUp: positionsHook.handleNodePointerUp,
    onNodeContextMenu: (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (connectionsHook.connectingSourceId) {
        if (connectionsHook.connectingSourceId !== id) connectionsHook.createQuickRelationship(connectionsHook.connectingSourceId, id);
        connectionsHook.setConnectingSourceId(null);
        connectionsHook.setElasticCursor(null);
        return;
      }
      connectionsHook.startConnecting(id, e.clientX, e.clientY);
    },
    onPillPointerDown: connectionsHook.handlePillPointerDown,
    onPillPointerMove: connectionsHook.handlePillPointerMove,
    onPillPointerUp: connectionsHook.handlePillPointerUp,
    onPillDoubleClick: connectionsHook.handlePillDoubleClick,
    onCardMouseDown: (e: React.MouseEvent) => {
      if (e.button === 0) selectionHook.cardPointerCoordRef.current = { x: e.clientX, y: e.clientY };
    },
    onCardMouseUp: handleCardMouseUp,
    onCardClick: handleCardClick,
    onCardDoubleClick: (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      connectionsHook.startConnecting(id, e.clientX, e.clientY);
    },
    onOpenEditModal: (id: string) => {
      selectionHook.selectSingleNode(id);
    },
    onAddCharacter: (coords: { x: number; y: number }) => {
      selectionHook.setNewCharCoords(coords);
      selectionHook.setIsCreatingChar(true);
      selectionHook.setCanvasContextMenu(null);
    },
    onAddUnionNode: (x: number, y: number) => {
      pushUndoSnapshot();
      const newJunc: GraphJunctionNode = { id: `junction-${Date.now()}`, label: 'Union Node', x, y };
      updateJunctions([...junctions, newJunc]);
      positionsHook.setPositions((prev) => ({ ...prev, [newJunc.id]: { x, y } }));
      selectionHook.setCanvasContextMenu(null);
    },
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onResetViewport: handleResetViewport,
  };
}
