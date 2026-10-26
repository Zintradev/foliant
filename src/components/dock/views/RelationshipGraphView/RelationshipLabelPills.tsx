import React, { memo } from 'react';
import { CharacterRelationship, RelationshipColor } from '../../../../types/dock';
import { COLOR_PALETTE } from './constants';
import { NodeInfo } from './types';

interface RelationshipLabelPillsProps {
  visibleRelationships: CharacterRelationship[];
  selectedRelId: string | null;
  draggingRelId: string | null;
  getNodeInfo: (id: string) => NodeInfo | null;
  justDraggedRelRef: React.MutableRefObject<boolean>;
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>, rel: CharacterRelationship) => void;
  onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onDoubleClick: (e: React.MouseEvent, relId: string) => void;
  onSelectRel: (id: string) => void;
}

function RelationshipLabelPillsComponent({
  visibleRelationships,
  selectedRelId,
  draggingRelId,
  getNodeInfo,
  justDraggedRelRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDoubleClick,
  onSelectRel,
}: RelationshipLabelPillsProps) {
  return (
    <>
      {visibleRelationships.map((rel) => {
        const sourceInfo = getNodeInfo(rel.sourceId);
        const targetInfo = getNodeInfo(rel.targetId);
        if (!sourceInfo || !targetInfo) return null;

        const t = rel.labelT ?? 0.5;
        const bendFactor = 4 * t * (1 - t);
        const px = Math.round(
          sourceInfo.cx +
            (targetInfo.cx - sourceInfo.cx) * t +
            (rel.controlOffset?.x ?? 0) * bendFactor
        );
        const py = Math.round(
          sourceInfo.cy +
            (targetInfo.cy - sourceInfo.cy) * t +
            (rel.controlOffset?.y ?? 0) * bendFactor
        );

        const colorKey = (rel.color || 'blue') as RelationshipColor;
        const colorMeta = COLOR_PALETTE[colorKey] || COLOR_PALETTE.blue;
        const isSelected = selectedRelId === rel.id;
        const isPillDragging = draggingRelId === rel.id;

        const isBent = Boolean(
          rel.controlOffset &&
            (Math.abs(rel.controlOffset.x) > 1 || Math.abs(rel.controlOffset.y) > 1)
        );
        const sHalfW = sourceInfo.isJunction ? 14 : 80;
        const sHalfH = sourceInfo.isJunction ? 14 : 36;
        const tHalfW = targetInfo.isJunction ? 14 : 80;
        const tHalfH = targetInfo.isJunction ? 14 : 36;

        const labelText = rel.label || 'Connected';
        const labelHalfW = Math.max(34, Math.min(55, labelText.length * 3.8 + 14));
        const labelHalfH = 11;

        // Threshold: leave a small gap of ~0.5 cm (18px) on each side
        const GAP_HALF_CM = 18;
        const touchesSource =
          Math.abs(px - sourceInfo.cx) <= (labelHalfW + sHalfW + GAP_HALF_CM) &&
          Math.abs(py - sourceInfo.cy) <= (labelHalfH + sHalfH + GAP_HALF_CM);
        const touchesTarget =
          Math.abs(px - targetInfo.cx) <= (labelHalfW + tHalfW + GAP_HALF_CM) &&
          Math.abs(py - targetInfo.cy) <= (labelHalfH + tHalfH + GAP_HALF_CM);

        const isCollapsedPill = !isBent && (touchesSource || touchesTarget);

        const dx = targetInfo.cx - sourceInfo.cx;
        const dy = targetInfo.cy - sourceInfo.cy;
        const isHorizontalContraction = Math.abs(dx) > Math.abs(dy);

        let displayPx = px;
        let displayPy = py;

        if (isCollapsedPill) {
          if (isHorizontalContraction) {
            // Encima / arriba del enlace horizontal
            displayPx = px;
            displayPy = py - 16;
          } else {
            // A la derecha del enlace vertical (contraído por arriba o abajo)
            displayPx = px + 18;
            displayPy = py;
          }
        }

        if (isCollapsedPill) {
          return (
            <button
              key={`pill-${rel.id}`}
              type="button"
              onPointerDown={(e) => onPointerDown(e, rel)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onDoubleClick={(e) => onDoubleClick(e, rel.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (justDraggedRelRef.current) return;
                onSelectRel(rel.id);
              }}
              title={`${rel.label || 'Relationship'} (Drag: slide / bend curve | Double-click: reset)`}
              style={{
                position: 'absolute',
                left: `${displayPx}px`,
                top: `${displayPy}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`relationship-pill pointer-events-auto flex items-center justify-center px-1.5 py-0.5 rounded-xs border text-[9px] font-mono transition shadow-md select-none ${
                isPillDragging ? 'cursor-grabbing scale-105 ring-1 ring-white/50' : 'cursor-grab hover:scale-105'
              } ${
                isSelected
                  ? 'bg-zinc-800 border-zinc-400 text-white ring-1 ring-zinc-300 font-bold z-40'
                  : `${colorMeta.bg} ${colorMeta.border} ${colorMeta.text} hover:border-zinc-500 z-30`
              }`}
            >
              <span className="leading-none text-[9px] tracking-widest font-bold">...</span>
            </button>
          );
        }

        return (
          <button
            key={`pill-${rel.id}`}
            type="button"
            onPointerDown={(e) => onPointerDown(e, rel)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDoubleClick={(e) => onDoubleClick(e, rel.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (justDraggedRelRef.current) return;
              onSelectRel(rel.id);
            }}
            title={`${rel.label || 'Relationship'} (Drag: slide / bend curve | Double-click: reset)`}
            style={{
              position: 'absolute',
              left: `${displayPx}px`,
              top: `${displayPy}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`relationship-pill pointer-events-auto flex items-center gap-1 px-1.5 py-0.5 rounded-xs border text-[9px] font-mono transition shadow-md hover:scale-105 select-none ${
              isPillDragging
                ? 'cursor-grabbing scale-105 ring-1 ring-white/50'
                : 'cursor-grab'
            } ${
              isSelected
                ? 'bg-zinc-800 border-zinc-400 text-white ring-1 ring-zinc-300 font-bold z-40'
                : `${colorMeta.bg} ${colorMeta.border} ${colorMeta.text} hover:border-zinc-500 z-30`
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: rel.customColor || colorMeta.stroke }}
            />
            <span className="truncate max-w-[90px]">{rel.label || 'Connected'}</span>
          </button>
        );
      })}
    </>
  );
}

export const RelationshipLabelPills = memo(RelationshipLabelPillsComponent);
