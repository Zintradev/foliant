import React, { memo } from 'react';
import { Users, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  CharacterItem,
  CharacterRelationship,
  GraphJunctionNode,
  StorylineItem,
} from '../../../../types/dock';
import { NodePosition, NodeInfo, CanvasContextMenuState } from './types';
import { MIN_ZOOM, MAX_ZOOM } from './constants';
import { RelationshipSvgLayer } from './RelationshipSvgLayer';
import { RelationshipLabelPills } from './RelationshipLabelPills';
import { RelationshipJunctionNodes } from './RelationshipJunctionNodes';
import { RelationshipCharacterCards } from './RelationshipCharacterCards';
import { RelationshipCanvasContextMenu } from './RelationshipCanvasContextMenu';
import { useTranslation } from '../../../../i18n/translations';

interface RelationshipBoardCanvasProps {
  boardRef: React.RefObject<HTMLDivElement | null>;
  characters: CharacterItem[];
  junctions: GraphJunctionNode[];
  storylines: StorylineItem[];
  positions: Record<string, NodePosition>;
  visibleRelationships: CharacterRelationship[];
  selectedRelId: string | null;
  selectedJunctionId: string | null;
  editingCardId: string | null;
  hoveredJunctionId: string | null;
  connectingSourceId: string | null;
  elasticCursor: { x: number; y: number } | null;
  draggingRelId: string | null;
  canvasContextMenu: CanvasContextMenuState | null;
  zoom: number;
  pan: { x: number; y: number };
  isPanning: boolean;
  isSpacePressed: boolean;
  justDraggedRelRef: React.MutableRefObject<boolean>;
  getNodeInfo: (id: string) => NodeInfo | null;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onCanvasPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onCanvasContextMenu: (e: React.MouseEvent) => void;
  onSelectRel: (id: string) => void;
  onSelectJunction: (id: string) => void;
  onHoverJunction: (id: string | null) => void;
  onNodePointerDown: (e: React.PointerEvent<HTMLDivElement>, id: string) => void;
  onNodePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onNodePointerUp: (e: React.PointerEvent<HTMLDivElement>, id: string) => void;
  onNodeContextMenu: (e: React.MouseEvent, id: string) => void;
  onPillPointerDown: (e: React.PointerEvent<HTMLButtonElement>, rel: CharacterRelationship) => void;
  onPillPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPillPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPillDoubleClick: (e: React.MouseEvent, id: string) => void;
  onCardMouseDown: (e: React.MouseEvent) => void;
  onCardMouseUp: (e: React.MouseEvent, id: string) => void;
  onCardClick: (e: React.MouseEvent, id: string) => void;
  onCardDoubleClick: (e: React.MouseEvent, id: string) => void;
  onOpenEditModal: (id: string) => void;
  onAddCharacter: (coords: { x: number; y: number }) => void;
  onAddUnionNode: (x: number, y: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetViewport: () => void;
}

function RelationshipBoardCanvasComponent({
  boardRef,
  characters,
  junctions,
  storylines,
  positions,
  visibleRelationships,
  selectedRelId,
  selectedJunctionId,
  editingCardId,
  hoveredJunctionId,
  connectingSourceId,
  elasticCursor,
  draggingRelId,
  canvasContextMenu,
  zoom,
  pan,
  isPanning,
  isSpacePressed,
  justDraggedRelRef,
  getNodeInfo,
  onCanvasMouseDown,
  onCanvasPointerMove,
  onCanvasContextMenu,
  onSelectRel,
  onSelectJunction,
  onHoverJunction,
  onNodePointerDown,
  onNodePointerMove,
  onNodePointerUp,
  onNodeContextMenu,
  onPillPointerDown,
  onPillPointerMove,
  onPillPointerUp,
  onPillDoubleClick,
  onCardMouseDown,
  onCardMouseUp,
  onCardClick,
  onCardDoubleClick,
  onOpenEditModal,
  onAddCharacter,
  onAddUnionNode,
  onZoomIn,
  onZoomOut,
  onResetViewport,
}: RelationshipBoardCanvasProps) {
  const { t } = useTranslation();

  return (
    <div
      ref={boardRef}
      data-testid="relationship-board"
      onMouseDown={onCanvasMouseDown}
      onPointerMove={onCanvasPointerMove}
      onContextMenu={onCanvasContextMenu}
      className={`relative w-full h-full overflow-hidden select-none touch-none ${
        connectingSourceId
          ? 'cursor-crosshair'
          : isPanning || isSpacePressed
          ? 'cursor-grabbing'
          : 'cursor-grab'
      }`}
      style={{
        touchAction: 'none',
        backgroundImage: `radial-gradient(circle, #27272a 1px, transparent 1px)`,
        backgroundSize: `${Math.max(12, Math.round(24 * zoom))}px ${Math.max(12, Math.round(24 * zoom))}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {characters.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 pointer-events-none select-none">
          <Users className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-xs">{t('noCharactersInGraph')}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">{t('clickAddOrRightClick')}</p>
        </div>
      )}

      <div
        className="absolute top-0 left-0 w-[10000px] h-[10000px] pointer-events-auto"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          overflow: 'visible',
        }}
      >
        <RelationshipSvgLayer
          visibleRelationships={visibleRelationships}
          positions={positions}
          selectedRelId={selectedRelId}
          connectingSourceId={connectingSourceId}
          elasticCursor={elasticCursor}
          draggingRelId={draggingRelId}
          getNodeInfo={getNodeInfo}
          onSelectRel={onSelectRel}
        />

        <RelationshipJunctionNodes
          junctions={junctions}
          storylines={storylines}
          positions={positions}
          selectedJunctionId={selectedJunctionId}
          hoveredJunctionId={hoveredJunctionId}
          connectingSourceId={connectingSourceId}
          onPointerDown={onNodePointerDown}
          onPointerMove={onNodePointerMove}
          onPointerUp={onNodePointerUp}
          onContextMenu={onNodeContextMenu}
          onMouseEnter={(id) => onHoverJunction(id)}
          onMouseLeave={() => onHoverJunction(null)}
          onClick={(_e, id) => onSelectJunction(id)}
        />

        <RelationshipCharacterCards
          characters={characters}
          positions={positions}
          editingCardId={editingCardId}
          connectingSourceId={connectingSourceId}
          onPointerDown={onNodePointerDown}
          onPointerMove={onNodePointerMove}
          onPointerUp={onNodePointerUp}
          onMouseDown={onCardMouseDown}
          onMouseUp={onCardMouseUp}
          onContextMenu={onNodeContextMenu}
          onClick={onCardClick}
          onDoubleClick={onCardDoubleClick}
          onOpenEditModal={onOpenEditModal}
        />

        <RelationshipLabelPills
          visibleRelationships={visibleRelationships}
          positions={positions}
          selectedRelId={selectedRelId}
          draggingRelId={draggingRelId}
          justDraggedRelRef={justDraggedRelRef}
          getNodeInfo={getNodeInfo}
          onSelectRel={onSelectRel}
          onPointerDown={onPillPointerDown}
          onPointerMove={onPillPointerMove}
          onPointerUp={onPillPointerUp}
          onDoubleClick={onPillDoubleClick}
        />
      </div>

      {canvasContextMenu && (
        <RelationshipCanvasContextMenu
          contextMenu={canvasContextMenu}
          onAddCharacter={onAddCharacter}
          onAddUnionNode={onAddUnionNode}
        />
      )}

      <RelationshipZoomControls
        zoom={zoom}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetViewport={onResetViewport}
      />
    </div>
  );
}

interface RelationshipZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetViewport: () => void;
}

export const RelationshipZoomControls = memo(function RelationshipZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetViewport,
}: RelationshipZoomControlsProps) {
  const { t } = useTranslation();

  return (
    <div
      className="viewport-controls absolute bottom-3 right-3 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-xs border border-zinc-800 rounded-sm px-1.5 py-1 text-zinc-300 shadow-xl z-30"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onZoomOut}
        disabled={zoom <= MIN_ZOOM}
        title={t('zoomOut')}
        aria-label="Zoom out"
        className="p-1 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-xs transition text-zinc-400 hover:text-white cursor-pointer"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onResetViewport}
        title={t('currentZoom')}
        aria-label="Current zoom"
        className="text-[10px] font-mono px-1.5 min-w-[38px] text-center text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xs transition cursor-pointer select-none"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onClick={onZoomIn}
        disabled={zoom >= MAX_ZOOM}
        title={t('zoomIn')}
        aria-label="Zoom in"
        className="p-1 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-xs transition text-zinc-400 hover:text-white cursor-pointer"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <div className="h-3 w-px bg-zinc-800 mx-0.5" />
      <button
        type="button"
        onClick={onResetViewport}
        title={t('resetViewport')}
        aria-label="Reset viewport"
        className="p-1 hover:bg-zinc-800 rounded-xs transition text-zinc-400 hover:text-white cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});

export const RelationshipBoardCanvas = memo(RelationshipBoardCanvasComponent);

