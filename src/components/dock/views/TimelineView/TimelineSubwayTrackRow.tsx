import React, { memo } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, GripVertical, Check, Circle } from 'lucide-react';
import { StorylineItem } from '../../../../types/dock';
import { PlotStatus } from '../../../../types/project';
import { TimelineColumnItem } from './types';
import { STORYLINE_COLOR_MAP } from './constants';
import { useTouchLongPressReorder } from '../../../common/useTouchLongPressReorder';

interface TimelineSubwayTrackRowProps {
  storyline: StorylineItem;
  index: number;
  timelineColumns: TimelineColumnItem[];
  rowHeight: number;
  isCollapsed: boolean;
  stationMap: Map<string, {
    plotState: { storylineId: string; status: PlotStatus } | undefined;
    isLinkedLegacy: boolean;
    isStationActive: boolean;
    currentStatus: PlotStatus;
  }>;
  storylineSpanMap: Map<string, { firstActiveIdx: number; lastActiveIdx: number; count: number }>;
  draggedStorylineId: string | null;
  dragOverPlotId: string | null;
  shiftTargetIndex: number | null;
  timelineDropMode: 'shift' | 'swap' | 'arrows';
  getSceneWidth: (sceneId: string) => number;
  manualSceneWidths?: Record<string, number>;
  isManualHeight?: boolean;
  onToggleCollapse: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number, id: string) => void;
  onDragEnter: (e: React.DragEvent, index: number, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string, index?: number) => void;
  onDrop: (e: React.DragEvent, index?: number, id?: string) => void;
  onDragEnd: () => void;
  onTouchDragStart?: (id: string, index: number) => void;
  onTouchDragMove?: (clientY: number, clientX: number) => void;
  onTouchDragEnd?: () => void;
  onTouchDragCancel?: () => void;
  onMoveStoryline?: (id: string, direction: 'up' | 'down') => void;
  isLastStoryline?: boolean;
  onResizeStart: (e: React.PointerEvent, id: string) => void;
  onOpenEntityPopover: (e: React.MouseEvent, type: 'storyline' | 'character', id: string, sceneId: string) => void;
  rowTranslateY?: number;
  sourceIndex?: number;
}

function TimelineSubwayTrackRowComponent({
  storyline,
  index,
  timelineColumns,
  rowHeight,
  isCollapsed,
  stationMap,
  storylineSpanMap,
  draggedStorylineId,
  dragOverPlotId,
  shiftTargetIndex: _shiftTargetIndex,
  timelineDropMode,
  getSceneWidth,
  manualSceneWidths,
  isManualHeight = false,
  onToggleCollapse,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragEnd,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
  onTouchDragCancel,
  onMoveStoryline,
  isLastStoryline = false,
  onResizeStart,
  onOpenEntityPopover,
  rowTranslateY = 0,
  sourceIndex: _sourceIndex = -1,
}: TimelineSubwayTrackRowProps) {
  const { isTouchDragging, isHolding, touchDragProps } = useTouchLongPressReorder({
    id: storyline.id,
    index,
    onStart: (id, idx) => onTouchDragStart?.(id, idx),
    onMove: (clientY, clientX) => onTouchDragMove?.(clientY, clientX),
    onEnd: () => onTouchDragEnd?.(),
    onCancel: () => onTouchDragCancel?.(),
    delayMs: 500,
    moveThreshold: 10,
  });

  const theme = STORYLINE_COLOR_MAP[storyline.color] || STORYLINE_COLOR_MAP.emerald;
  const isDragging = draggedStorylineId === storyline.id;
  const isDraggingAny = draggedStorylineId !== null;
  const isShiftMode = timelineDropMode === 'shift';
  const isDropTarget = timelineDropMode === 'swap' && dragOverPlotId === storyline.id && !isDragging;
  const span = storylineSpanMap.get(storyline.id);
  const rowHeightStyle = isCollapsed
    ? '34px'
    : isManualHeight
    ? `${rowHeight}px`
    : `var(--track-row-height, ${rowHeight}px)`;

  return (
    <div
      key={storyline.id}
      style={{
        height: rowHeightStyle,
        transform: rowTranslateY ? `translate3d(0, ${rowTranslateY}px, 0)` : undefined,
        transition:
          isDragging && isShiftMode
            ? undefined
            : isDraggingAny && isShiftMode
            ? 'transform 220ms cubic-bezier(0.2, 0.9, 0.25, 1)'
            : undefined,
        willChange: isDraggingAny && isShiftMode ? 'transform' : undefined,
      }}
      onDragEnter={(e) => onDragEnter(e, index, storyline.id)}
      onDragOver={(e) => onDragOver(e, storyline.id, index)}
      onDrop={(e) => onDrop(e, index, storyline.id)}
      className={`flex items-stretch border-b border-zinc-800/90 shadow-[0_1px_0_0_rgba(255,255,255,0.03)] relative group transition-colors select-none ${
        isDraggingAny ? '[&_*]:pointer-events-none' : ''
      } ${
        isHolding
          ? 'scale-[1.01] shadow-xl border-zinc-650 ring-1 ring-zinc-500/30'
          : (isDragging || isTouchDragging)
          ? 'opacity-40 bg-zinc-900/40 border-dashed border-zinc-700/80 z-30 touch-none'
          : !isShiftMode && isDropTarget
          ? 'border-2 border-cyan-500 bg-cyan-950/30 ring-2 ring-cyan-500/50 shadow-md shadow-black/50 z-20'
          : 'hover:bg-zinc-900/20'
      }`}
    >
      {/* Sticky Track Label Header (Draggable) */}
      <div
        draggable={timelineDropMode !== 'arrows'}
        onDragStart={(e) => onDragStart(e, index, storyline.id)}
        onDragEnd={onDragEnd}
        {...touchDragProps}
        style={{ height: rowHeightStyle }}
        className={`w-64 min-w-[16rem] sticky left-0 z-30 bg-zinc-950/95 backdrop-blur-md border-r border-zinc-800/90 border-b border-zinc-800/90 p-2.5 flex flex-col justify-between shrink-0 shadow-xs ${
          timelineDropMode !== 'arrows' ? 'cursor-grab active:cursor-grabbing' : ''
        } select-none transition-all duration-150 ease-out ${
          isHolding
            ? 'scale-[1.02] shadow-xl border-zinc-650'
            : (isDragging || isTouchDragging)
            ? 'opacity-40 bg-zinc-900/50 border-dashed border-zinc-700/80'
            : !isShiftMode && isDropTarget
            ? 'border-2 border-cyan-500 bg-cyan-950/30 ring-2 ring-cyan-500/50 shadow-md shadow-black/50'
            : ''
        }`}
      >
        <div className="flex items-center justify-between gap-1.5 min-w-0 pointer-events-none">
          <div className="flex items-center gap-1 min-w-0 pointer-events-none">
            {timelineDropMode !== 'arrows' && (
              <GripVertical className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition shrink-0 pointer-events-none" />
            )}
            <button
              type="button"
              tabIndex={0}
              draggable={false}
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse(storyline.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-0.5 text-zinc-500 hover:text-zinc-200 transition cursor-pointer rounded-xs hover:bg-zinc-800 shrink-0 pointer-events-auto"
              title={isCollapsed ? 'Expand storyline track' : 'Collapse storyline track'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 pointer-events-none" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 pointer-events-none" />
              )}
            </button>
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs pointer-events-none"
              style={{ backgroundColor: theme.stroke }}
            />
            <h4 className="text-xs font-semibold text-zinc-100 truncate font-sans pointer-events-none">
              {storyline.title}
            </h4>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onMoveStoryline && timelineDropMode === 'arrows' && (
              <div
                className="flex items-center gap-0.5 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:!opacity-100 transition-opacity pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMoveStoryline(storyline.id, 'up')}
                  className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition touch-manipulation cursor-pointer"
                  title="Mover arriba"
                >
                  <ChevronUp className="w-3 h-3 pointer-events-none" />
                </button>
                <button
                  type="button"
                  disabled={isLastStoryline}
                  onClick={() => onMoveStoryline(storyline.id, 'down')}
                  className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition touch-manipulation cursor-pointer"
                  title="Mover abajo"
                >
                  <ChevronDown className="w-3 h-3 pointer-events-none" />
                </button>
              </div>
            )}
          </div>
        </div>

        {!isCollapsed && storyline.description && (
          <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5 leading-relaxed pointer-events-none">
            {storyline.description}
          </p>
        )}
      </div>

      {/* Horizontal Continuous Subway Line Across Columns */}
      <div className={`flex items-stretch divide-x divide-zinc-850/40 relative ${isDragging ? 'pointer-events-none' : ''}`}>
        {timelineColumns.map((col, cIdx) => {
          const scWidth = getSceneWidth(col.scene.id);
          const isManualColWidth = Boolean(manualSceneWidths?.[col.scene.id]);
          const station = stationMap.get(`${storyline.id}:${col.scene.id}`);
          const isStationActive = station?.isStationActive;
          const currentStatus = station?.currentStatus || 'Active';

          const hasLineLeft = span && span.firstActiveIdx !== -1 && cIdx > span.firstActiveIdx && cIdx <= span.lastActiveIdx;
          const hasLineRight = span && span.lastActiveIdx !== -1 && cIdx >= span.firstActiveIdx && cIdx < span.lastActiveIdx;

          return (
            <div
              key={`cell-${storyline.id}-${col.scene.id}`}
              style={{ width: isManualColWidth ? `${scWidth}px` : `var(--scene-col-width, ${scWidth}px)` }}
              className="relative flex items-center justify-center shrink-0"
            >
              {/* Left track segment */}
              {hasLineLeft && (
                <div
                  className="absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-1 pointer-events-none"
                  style={{ backgroundColor: theme.stroke }}
                />
              )}
              {/* Right track segment */}
              {hasLineRight && (
                <div
                  className="absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-1 pointer-events-none"
                  style={{ backgroundColor: theme.stroke }}
                />
              )}

              {/* Station Dot */}
              {isStationActive ? (
                <button
                  type="button"
                  onClick={(e) => onOpenEntityPopover(e, 'storyline', storyline.id, col.scene.id)}
                  aria-label={`${storyline.title} at ${col.scene.title} (${currentStatus})`}
                  title={`${storyline.title} · ${col.scene.title} (${currentStatus})\nClick for plot details and actions`}
                  className={`relative z-20 w-6 h-6 rounded-full bg-zinc-950 border-2 flex items-center justify-center shadow-lg transition-transform hover:scale-125 cursor-pointer ${
                    currentStatus === 'Dormant'
                      ? 'opacity-60 border-dashed'
                      : currentStatus === 'Resolved'
                      ? 'opacity-70'
                      : ''
                  }`}
                  style={{ borderColor: theme.stroke }}
                >
                  {currentStatus === 'Resolved' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : currentStatus === 'Dormant' ? (
                    <Circle className="w-2 h-2 opacity-50" style={{ color: theme.stroke }} />
                  ) : (
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.stroke }} />
                  )}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Row Height Resizer */}
      {!isCollapsed && (
        <div
          onPointerDown={(e) => onResizeStart(e, storyline.id)}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 right-0 bottom-0 h-2 cursor-row-resize hover:bg-zinc-500/40 active:bg-zinc-400/60 transition-colors z-30 group/resizer flex items-center justify-center select-none"
          title="Drag to resize plot track height"
        >
          <div className="h-0.5 w-16 bg-zinc-700/60 group-hover/resizer:bg-zinc-300 rounded-full" />
        </div>
      )}
    </div>
  );
}

export const TimelineSubwayTrackRow = memo(TimelineSubwayTrackRowComponent);
