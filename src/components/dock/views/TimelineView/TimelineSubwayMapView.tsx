import React, { memo } from 'react';
import { StorylineItem, CharacterItem } from '../../../../types/dock';
import { PlotStatus } from '../../../../types/project';
import { TimelineColumnItem } from './types';
import { TimelineSubwaySceneColumn } from './TimelineSubwaySceneColumn';
import { TimelineSubwayTrackRow } from './TimelineSubwayTrackRow';
import { useTranslation } from '../../../../i18n/translations';

interface TimelineSubwayMapViewProps {
  timelineContainerRef: React.RefObject<HTMLDivElement | null>;
  swimlanesContainerRef: React.RefObject<HTMLDivElement | null>;
  timelineColumns: TimelineColumnItem[];
  storylines: StorylineItem[];
  characters: CharacterItem[];
  activeChapterId: string;
  participatingScenesSet: Set<string> | null;
  sceneWordCountMap: Map<string, number>;
  sceneAttachedStorylinesMap: Map<string, { storyline: StorylineItem; status: PlotStatus }[]>;
  characterMap: Map<string, CharacterItem>;
  stationMap: Map<string, { plotState: { storylineId: string; status: PlotStatus } | undefined; isLinkedLegacy: boolean; isStationActive: boolean; currentStatus: PlotStatus }>;
  storylineSpanMap: Map<string, { firstActiveIdx: number; lastActiveIdx: number; count: number }>;
  collapsedStorylines: Record<string, boolean>;
  draggedStorylineId: string | null;
  dragOverPlotId: string | null;
  shiftTargetIndex: number | null;
  timelineDropMode: 'shift' | 'swap';
  openAttachDropdown: { sceneId: string; type: 'character' | 'storyline' } | null;
  getSceneWidth: (sceneId: string) => number;
  getRowHeight: (storylineId: string) => number;
  manualSceneWidths?: Record<string, number>;
  plotHeights?: Record<string, number>;
  onSelectScene: (id: string) => void;
  onSceneResizeStart: (e: React.PointerEvent, id: string) => void;
  onPlotResizeStart: (e: React.PointerEvent, id: string) => void;
  onToggleStorylineCollapse: (id: string) => void;
  onAddMarker: (sceneId: string) => void;
  onOpenMarkerModal: (sceneId: string, markerId: string) => void;
  onOpenEntityPopover: (e: React.MouseEvent, type: 'storyline' | 'character', id: string, sceneId: string) => void;
  onToggleAttachDropdown: (sceneId: string, type: 'character' | 'storyline') => void;
  onAttachStoryline: (sceneId: string, storylineId: string) => void;
  onAttachCharacter: (sceneId: string, characterId: string) => void;
  onToggleStationStatus: (sceneId: string, storylineId: string) => void;
  onStorylineDragStart: (e: React.DragEvent, index: number, id: string) => void;
  onStorylineDragEnter: (e: React.DragEvent, index: number, id: string) => void;
  onSwimlanesDragOver: (e: React.DragEvent) => void;
  onStorylineDragOver: (e: React.DragEvent, id: string, index?: number) => void;
  onStorylineDragLeave: (e: React.DragEvent) => void;
  onStorylineDrop: (e: React.DragEvent, index?: number, id?: string) => void;
  onStorylineDragEnd: () => void;
  registerTrack: (id: string, el: HTMLElement | null) => void;
  sceneHeaderHeight?: number;
  onSceneHeaderResizeStart?: (e: React.PointerEvent) => void;
}

function TimelineSubwayMapViewComponent(props: TimelineSubwayMapViewProps) {
  const {
    timelineContainerRef, swimlanesContainerRef, timelineColumns, storylines, characters,
    activeChapterId, participatingScenesSet, sceneWordCountMap, sceneAttachedStorylinesMap,
    characterMap, stationMap, storylineSpanMap, collapsedStorylines, draggedStorylineId,
    dragOverPlotId, shiftTargetIndex, timelineDropMode, openAttachDropdown, getSceneWidth,
    getRowHeight, manualSceneWidths, plotHeights, onSelectScene, onSceneResizeStart, onPlotResizeStart, onToggleStorylineCollapse,
    onAddMarker, onOpenMarkerModal, onOpenEntityPopover, onToggleAttachDropdown, onAttachStoryline,
    onAttachCharacter, onToggleStationStatus, onStorylineDragStart, onStorylineDragEnter,
    onSwimlanesDragOver, onStorylineDragOver, onStorylineDragLeave, onStorylineDrop,
    onStorylineDragEnd, registerTrack, sceneHeaderHeight = 140, onSceneHeaderResizeStart,
  } = props;
  const { t } = useTranslation();

  return (
    <div
      ref={timelineContainerRef}
      className="flex-1 overflow-auto bg-zinc-950 p-3 select-none"
    >
      <div className="inline-block min-w-full align-top">
        {/* Sticky Header with Scene Column Headers */}
        <div
          style={{ height: `${sceneHeaderHeight}px` }}
          className="flex sticky top-0 z-40 bg-zinc-950 border-b border-zinc-800 shadow-md relative"
        >
          <div
            style={{ height: `${sceneHeaderHeight}px` }}
            className="w-64 min-w-[16rem] sticky left-0 z-45 bg-zinc-950/95 backdrop-blur-xs border-r border-zinc-800/80 px-3 py-2 flex flex-col justify-between"
          >
            <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
              {t('storylineTracks')}
            </span>
          </div>

          <div
            style={{ height: `${sceneHeaderHeight}px` }}
            className="flex items-stretch divide-x divide-zinc-850/60"
          >
            {timelineColumns.map((col) => {
              const width = getSceneWidth(col.scene.id);
              const isActive = activeChapterId === col.scene.id;
              const isDimmed = participatingScenesSet ? !participatingScenesSet.has(col.scene.id) : false;
              const wordCount = sceneWordCountMap.get(col.scene.id) || 0;
              const attachedStorylines = sceneAttachedStorylinesMap.get(col.scene.id) || [];

              return (
                <TimelineSubwaySceneColumn
                  key={col.scene.id}
                  col={col}
                  width={width}
                  isManualWidth={Boolean(manualSceneWidths?.[col.scene.id])}
                  isActive={isActive}
                  isDimmed={isDimmed}
                  wordCount={wordCount}
                  attachedStorylines={attachedStorylines}
                  characterMap={characterMap}
                  storylines={storylines}
                  characters={characters}
                  openAttachDropdown={openAttachDropdown}
                  onSelectScene={onSelectScene}
                  onResizeStart={onSceneResizeStart}
                  onAddMarker={onAddMarker}
                  onOpenMarkerModal={onOpenMarkerModal}
                  onOpenEntityPopover={onOpenEntityPopover}
                  onToggleAttachDropdown={onToggleAttachDropdown}
                  onAttachStoryline={onAttachStoryline}
                  onAttachCharacter={onAttachCharacter}
                />
              );
            })}
          </div>

          {onSceneHeaderResizeStart && (
            <div
              onPointerDown={onSceneHeaderResizeStart}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 right-0 bottom-0 h-2 cursor-row-resize hover:bg-zinc-500/40 active:bg-zinc-400/60 transition-colors z-45 group/header-resizer flex items-center justify-center select-none"
              title="Drag to crop scene cards height"
            >
              <div className="h-0.5 w-24 bg-zinc-700/60 group-hover/header-resizer:bg-zinc-300 rounded-full" />
            </div>
          )}
        </div>

        {/* Tracks Container */}
        <div
          ref={swimlanesContainerRef}
          onDragOver={onSwimlanesDragOver}
          onDragLeave={onStorylineDragLeave}
          onDrop={(e) => onStorylineDrop(e)}
          onDragEnd={onStorylineDragEnd}
          className="relative divide-y divide-zinc-850/40"
        >
          {storylines.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs italic">
              {t('noStorylinesRegistered')}
            </div>
          ) : (
            (() => {
              const isDraggingAny = draggedStorylineId !== null;
              const isShiftMode = timelineDropMode === 'shift';
              const sourceIndex = draggedStorylineId
                ? storylines.findIndex((s) => s.id === draggedStorylineId)
                : -1;
              const getActualRowHeight = (id: string) =>
                collapsedStorylines[id] ? 34 : getRowHeight(id);
              const draggedHeight =
                sourceIndex !== -1 ? getActualRowHeight(storylines[sourceIndex].id) : 60;

              let draggedTargetOffset = 0;
              if (isShiftMode && isDraggingAny && sourceIndex !== -1 && shiftTargetIndex !== null) {
                if (sourceIndex < shiftTargetIndex) {
                  for (let i = sourceIndex + 1; i <= shiftTargetIndex; i++) {
                    draggedTargetOffset += getActualRowHeight(storylines[i].id);
                  }
                } else if (sourceIndex > shiftTargetIndex) {
                  for (let i = shiftTargetIndex; i < sourceIndex; i++) {
                    draggedTargetOffset -= getActualRowHeight(storylines[i].id);
                  }
                }
              }

              return storylines.map((st, idx) => {
                let rowTranslateY = 0;
                if (isShiftMode && isDraggingAny && sourceIndex !== -1 && shiftTargetIndex !== null) {
                  if (idx === sourceIndex) {
                    rowTranslateY = draggedTargetOffset;
                  } else if (sourceIndex < shiftTargetIndex && idx > sourceIndex && idx <= shiftTargetIndex) {
                    rowTranslateY = -draggedHeight;
                  } else if (sourceIndex > shiftTargetIndex && idx >= shiftTargetIndex && idx < sourceIndex) {
                    rowTranslateY = draggedHeight;
                  }
                }

                return (
                  <TimelineSubwayTrackRow
                    key={st.id}
                    storyline={st}
                    index={idx}
                    timelineColumns={timelineColumns}
                    rowHeight={getRowHeight(st.id)}
                    manualSceneWidths={manualSceneWidths}
                    isManualHeight={Boolean(plotHeights?.[st.id])}
                    isCollapsed={Boolean(collapsedStorylines[st.id])}
                    stationMap={stationMap}
                    storylineSpanMap={storylineSpanMap}
                    draggedStorylineId={draggedStorylineId}
                    dragOverPlotId={dragOverPlotId}
                    shiftTargetIndex={shiftTargetIndex}
                    timelineDropMode={timelineDropMode}
                    getSceneWidth={getSceneWidth}
                    onToggleCollapse={onToggleStorylineCollapse}
                    onDragStart={onStorylineDragStart}
                    onDragEnter={onStorylineDragEnter}
                    onDragOver={onStorylineDragOver}
                    onDrop={onStorylineDrop}
                    onResizeStart={onPlotResizeStart}
                    onToggleStationStatus={onToggleStationStatus}
                    onOpenEntityPopover={onOpenEntityPopover}
                    registerTrack={registerTrack}
                    rowTranslateY={rowTranslateY}
                  />
                );
              });
            })()
          )}
        </div>
      </div>
    </div>
  );
}

export const TimelineSubwayMapView = memo(TimelineSubwayMapViewComponent);
