import React, { memo } from 'react';
import { CharacterRelationship, RelationshipColor } from '../../../../types/dock';
import { COLOR_PALETTE, STROKE_STYLES } from './constants';
import { getPerimeterAnchor } from './geometry';
import { NodeInfo, NodePosition } from './types';

interface RelationshipSvgLayerProps {
  visibleRelationships: CharacterRelationship[];
  positions?: Record<string, NodePosition>;
  selectedRelId: string | null;
  draggingRelId?: string | null;
  getNodeInfo: (id: string) => NodeInfo | null;
  onSelectRel: (id: string) => void;
  connectingSourceId: string | null;
  elasticCursor: { x: number; y: number } | null;
}

function RelationshipSvgLayerComponent({
  visibleRelationships,
  selectedRelId,
  getNodeInfo,
  onSelectRel,
  connectingSourceId,
  elasticCursor,
}: RelationshipSvgLayerProps) {
  const connectingSourceInfo = connectingSourceId ? getNodeInfo(connectingSourceId) : null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible z-10"
      style={{ width: '10000px', height: '10000px', overflow: 'visible' }}
    >
      <defs>
        {/* Arrowhead markers for target (end) and source (start) */}
        {Object.entries(COLOR_PALETTE).map(([key, config]) => (
          <React.Fragment key={`markers-${key}`}>
            <marker
              id={`arrowhead-end-${key}`}
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill={config.stroke} />
            </marker>
            <marker
              id={`arrowhead-start-${key}`}
              markerWidth="8"
              markerHeight="6"
              refX="0"
              refY="3"
              orient="auto"
            >
              <polygon points="8 0, 0 3, 8 6" fill={config.stroke} />
            </marker>
          </React.Fragment>
        ))}

        {/* Dynamic arrowhead markers for custom relationship colors */}
        {visibleRelationships.map((rel) => {
          if (!rel.customColor) return null;
          return (
            <React.Fragment key={`custom-markers-${rel.id}`}>
              <marker
                id={`arrowhead-end-custom-${rel.id}`}
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill={rel.customColor} />
              </marker>
              <marker
                id={`arrowhead-start-custom-${rel.id}`}
                markerWidth="8"
                markerHeight="6"
                refX="0"
                refY="3"
                orient="auto"
              >
                <polygon points="8 0, 0 3, 8 6" fill={rel.customColor} />
              </marker>
            </React.Fragment>
          );
        })}
      </defs>

      {/* Render each relationship line */}
      {visibleRelationships.map((rel) => {
        const sourceInfo = getNodeInfo(rel.sourceId);
        const targetInfo = getNodeInfo(rel.targetId);
        if (!sourceInfo || !targetInfo) return null;

        const naturalMidX = (sourceInfo.cx + targetInfo.cx) / 2;
        const naturalMidY = (sourceInfo.cy + targetInfo.cy) / 2;
        const px = naturalMidX + (rel.controlOffset?.x ?? 0);
        const py = naturalMidY + (rel.controlOffset?.y ?? 0);
        const isBent = Boolean(
          rel.controlOffset &&
            (Math.abs(rel.controlOffset.x) > 1 || Math.abs(rel.controlOffset.y) > 1)
        );

        const sourceTargetRay = isBent ? { cx: px, cy: py } : { cx: targetInfo.cx, cy: targetInfo.cy };
        const targetSourceRay = isBent ? { cx: px, cy: py } : { cx: sourceInfo.cx, cy: sourceInfo.cy };

        const rawStart = getPerimeterAnchor(sourceTargetRay, sourceInfo, 2, 0);
        const rawEnd = getPerimeterAnchor(targetSourceRay, targetInfo, 3, 0);
        const gapDist = Math.hypot(rawEnd.x - rawStart.x, rawEnd.y - rawStart.y);

        const safeOffset = isBent
          ? Math.min(8, Math.max(0, gapDist * 0.2))
          : Math.min(6, Math.max(0, (gapDist - 12) * 0.35));

        const startAnchor = getPerimeterAnchor(sourceTargetRay, sourceInfo, 2, safeOffset);
        const endAnchor = getPerimeterAnchor(targetSourceRay, targetInfo, 3, safeOffset);

        let startX = startAnchor.x;
        let startY = startAnchor.y;
        let endX = endAnchor.x;
        let endY = endAnchor.y;

        const forwardX = targetInfo.cx - sourceInfo.cx;
        const forwardY = targetInfo.cy - sourceInfo.cy;
        const forwardDist = Math.hypot(forwardX, forwardY);
        const ufx = forwardDist > 0.001 ? forwardX / forwardDist : 1;
        const ufy = forwardDist > 0.001 ? forwardY / forwardDist : 0;

        const proj = (endX - startX) * ufx + (endY - startY) * ufy;
        if (proj < 10) {
          startX = rawStart.x;
          startY = rawStart.y;
          endX = rawEnd.x;
          endY = rawEnd.y;
        }

        const midAnchorX = (startX + endX) / 2;
        const midAnchorY = (startY + endY) / 2;
        const cx = !isBent ? midAnchorX : midAnchorX + 2 * (rel.controlOffset?.x ?? 0);
        const cy = !isBent ? midAnchorY : midAnchorY + 2 * (rel.controlOffset?.y ?? 0);

        const pathD = `M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`;
        const isSelected = selectedRelId === rel.id;
        const colorKey = (rel.color || 'blue') as RelationshipColor;
        const strokeColor = rel.customColor || COLOR_PALETTE[colorKey]?.stroke || '#3b82f6';
        const strokeConfig = STROKE_STYLES[rel.style || 'solid'];

        const isDirected = rel.direction === 'directed';
        const isReverse = rel.direction === 'reverse';
        const isBidirectional = (rel.direction || 'bidirectional') === 'bidirectional';
        const isNone = rel.direction === 'none';
        const isCloseBidirectional = isBidirectional && !isBent && gapDist < 36;

        const markerEnd =
          !isNone && !isCloseBidirectional && (isDirected || isBidirectional)
            ? (rel.customColor ? `url(#arrowhead-end-custom-${rel.id})` : `url(#arrowhead-end-${colorKey})`)
            : undefined;
        const markerStart =
          !isNone && !isCloseBidirectional && (isReverse || isBidirectional)
            ? (rel.customColor ? `url(#arrowhead-start-custom-${rel.id})` : `url(#arrowhead-start-${colorKey})`)
            : undefined;

        let rhombusPoints = '';
        if (isCloseBidirectional) {
          const ufxR = (rawEnd.x - rawStart.x) / (gapDist || 0.0001);
          const ufyR = (rawEnd.y - rawStart.y) / (gapDist || 0.0001);
          const unx = -ufyR;
          const uny = ufxR;

          const rhombusLen = Math.max(6, Math.min(gapDist, 18));
          const rhombusHalfW = Math.max(2.2, Math.min(5.5, rhombusLen * 0.3));
          const midX = (rawStart.x + rawEnd.x) / 2;
          const midY = (rawStart.y + rawEnd.y) / 2;

          const tipStartX = gapDist <= 20 ? rawStart.x : midX - ufxR * (rhombusLen / 2);
          const tipStartY = gapDist <= 20 ? rawStart.y : midY - ufyR * (rhombusLen / 2);
          const tipEndX = gapDist <= 20 ? rawEnd.x : midX + ufxR * (rhombusLen / 2);
          const tipEndY = gapDist <= 20 ? rawEnd.y : midY + ufyR * (rhombusLen / 2);

          const corner1X = midX + unx * rhombusHalfW;
          const corner1Y = midY + uny * rhombusHalfW;
          const corner2X = midX - unx * rhombusHalfW;
          const corner2Y = midY - uny * rhombusHalfW;

          rhombusPoints = `${tipStartX},${tipStartY} ${corner1X},${corner1Y} ${tipEndX},${tipEndY} ${corner2X},${corner2Y}`;
        }

        return (
          <g key={`rel-${rel.id}`}>
            <path
              d={pathD}
              fill="none"
              stroke="transparent"
              strokeWidth="18"
              className="cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRel(rel.id);
              }}
            />
            <path
              d={pathD}
              fill="none"
              stroke={isSelected ? '#ffffff' : strokeColor}
              strokeWidth={isSelected ? 2.5 : 1.75}
              strokeDasharray={strokeConfig.dash}
              strokeOpacity={isSelected ? 1 : 0.85}
              markerEnd={markerEnd}
              markerStart={markerStart}
              className="transition-all duration-75"
            />
            {isCloseBidirectional && rhombusPoints && (
              <polygon
                points={rhombusPoints}
                fill={isSelected ? '#ffffff' : strokeColor}
                stroke={isSelected ? '#ffffff' : strokeColor}
                strokeWidth={isSelected ? 1.5 : 1}
                className="transition-all duration-75 pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRel(rel.id);
                }}
              />
            )}
          </g>
        );
      })}

      {/* Elastic line while user is interactively drawing a connection */}
      {connectingSourceInfo && elasticCursor && (
        <line
          x1={connectingSourceInfo.cx}
          y1={connectingSourceInfo.cy}
          x2={elasticCursor.x}
          y2={elasticCursor.y}
          stroke="#60a5fa"
          strokeWidth="2"
          strokeDasharray="4,4"
          className="animate-pulse"
        />
      )}
    </svg>
  );
}

export const RelationshipSvgLayer = memo(RelationshipSvgLayerComponent);
