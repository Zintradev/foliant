import React, { memo } from 'react';
import { GitCommit } from 'lucide-react';
import { GraphJunctionNode, StorylineItem } from '../../../../types/dock';
import { STORYLINE_THEMES } from './constants';
import { NodePosition } from './types';

interface RelationshipJunctionNodesProps {
  junctions: GraphJunctionNode[];
  positions: Record<string, NodePosition>;
  selectedJunctionId: string | null;
  hoveredJunctionId: string | null;
  connectingSourceId: string | null;
  storylines: StorylineItem[];
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, id: string) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>, id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  onClick: (e: React.MouseEvent, id: string) => void;
}

function RelationshipJunctionNodesComponent({
  junctions,
  positions,
  selectedJunctionId,
  hoveredJunctionId,
  connectingSourceId,
  storylines,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: RelationshipJunctionNodesProps) {
  const isDrawingConnection = Boolean(connectingSourceId);

  return (
    <>
      {junctions.map((junc) => {
        const pos = positions[junc.id] || { x: junc.x, y: junc.y };
        const isSelected = selectedJunctionId === junc.id;
        const isConnectingSource = connectingSourceId === junc.id;
        const linkedStoryline = storylines.find((s) => s.id === junc.storylineId);
        const storylineTheme = linkedStoryline
          ? STORYLINE_THEMES[linkedStoryline.color] || STORYLINE_THEMES.blue
          : null;

        return (
          <div
            key={junc.id}
            title={`${junc.label || 'Union Node'}${
              linkedStoryline ? ` • Storyline: ${linkedStoryline.title}` : ''
            } (Right-click to link, click to connect)`}
            style={{
              position: 'absolute',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
            }}
            onPointerDown={(e) => onPointerDown(e, junc.id)}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => onPointerUp(e, junc.id)}
            onContextMenu={(e) => onContextMenu(e, junc.id)}
            onMouseEnter={() => onMouseEnter(junc.id)}
            onMouseLeave={onMouseLeave}
            onClick={(e) => onClick(e, junc.id)}
            className={`junction-node w-7 h-7 rounded-full border flex items-center justify-center ${
              isDrawingConnection
                ? isConnectingSource
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'
                : 'cursor-move'
            } shadow-md transition select-none z-20 relative ${
              isConnectingSource
                ? 'bg-blue-900 border-blue-400 ring-2 ring-blue-400 animate-pulse'
                : isSelected
                ? 'bg-emerald-900 border-emerald-400 ring-1 ring-emerald-400'
                : storylineTheme
                ? `${storylineTheme.bg} ${storylineTheme.border} ring-1 ring-white/10 hover:border-emerald-400`
                : 'bg-zinc-900 border-zinc-700 hover:border-emerald-500 hover:bg-zinc-850'
            }`}
          >
            <GitCommit
              className={`w-3.5 h-3.5 ${
                storylineTheme ? storylineTheme.text : 'text-emerald-400'
              }`}
            />

            {/* Floating Informational Tooltip on Hover */}
            {hoveredJunctionId === junc.id && !selectedJunctionId && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-xs shadow-xl text-[9px] font-mono whitespace-nowrap z-40 pointer-events-none flex items-center gap-1.5">
                <span className="text-zinc-200 font-semibold">{junc.label || 'Union Node'}</span>
                {linkedStoryline && storylineTheme && (
                  <span
                    className={`flex items-center gap-1 px-1 py-0.2 rounded-xs border text-[8px] ${storylineTheme.bg} ${storylineTheme.border} ${storylineTheme.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${storylineTheme.dot}`} />
                    <span>{linkedStoryline.title}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export const RelationshipJunctionNodes = memo(RelationshipJunctionNodesComponent);
