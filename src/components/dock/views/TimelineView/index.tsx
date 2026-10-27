import { useState, useMemo, useRef, memo, useCallback } from 'react';
import { loadSettings } from '../../../../types/settings';
import { TimelineViewProps } from './types';
import { useTimelineZoom } from './useTimelineZoom';
import { useTimelineFilters } from './useTimelineFilters';
import { useTimelineStorylineHeights } from './useTimelineStorylineHeights';
import { useTimelineDragDrop } from './useTimelineDragDrop';
import { useTimelineMarkers } from './useTimelineMarkers';
import { useTimelineDataMaps } from './useTimelineDataMaps';
import { useTimelinePopovers } from './useTimelinePopovers';
import { TimelineHeader } from './TimelineHeader';
import { TimelineSubwayMapView } from './TimelineSubwayMapView';
import { TimelineLanesView } from './TimelineLanesView';
import { TimelinePopoversOverlay } from './TimelinePopoversOverlay';

function TimelineViewComponent({
  chapters,
  storylines,
  characters,
  activeChapterId,
  onSelectChapter,
  onUpdateChapter,
  onUpdateStorylines,
  timelineDropMode = 'shift',
  selectedStorylineFilter: propStorylineFilter,
  onStorylineFilterChange: propOnStorylineFilterChange,
  selectedCharacterFilter: propCharacterFilter,
  onCharacterFilterChange: propOnCharacterFilterChange,
  timelineFilters,
  setTimelineFilters,
  appSettings,
}: TimelineViewProps) {
  const effectiveAppSettings = appSettings || loadSettings();
  const scenes = useMemo(() => chapters.filter((c) => c.type === 'scene'), [chapters]);

  const [layoutMode, setLayoutMode] = useState<'subway' | 'lanes'>('subway');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const toggleFolder = useCallback((folderId: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  }, []);

  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const swimlanesContainerRef = useRef<HTMLDivElement | null>(null);

  const clearManualSceneWidthsRef = useRef<() => void>(() => {});
  const clearManualPlotHeightsRef = useRef<() => void>(() => {});
  const zoomHook = useTimelineZoom({
    timelineContainerRef,
    appSettings,
    effectiveAppSettings,
    onClearManualWidths: () => clearManualSceneWidthsRef.current(),
    onClearManualHeights: () => clearManualPlotHeightsRef.current(),
  });

  const heightsHook = useTimelineStorylineHeights({
    zoomX: zoomHook.zoomX,
    zoomY: zoomHook.zoomY,
    zoomYRef: zoomHook.zoomYRef,
  });
  clearManualSceneWidthsRef.current = heightsHook.clearManualSceneWidths;
  clearManualPlotHeightsRef.current = heightsHook.clearManualPlotHeights;

  const filtersHook = useTimelineFilters({
    scenes,
    storylines,
    timelineFilters,
    setTimelineFilters,
    propStorylineFilter,
    propOnStorylineFilterChange,
    propCharacterFilter,
    propOnCharacterFilterChange,
  });

  const dragDropHook = useTimelineDragDrop({
    storylines,
    timelineDropMode,
    getRowHeight: heightsHook.getRowHeight,
    onUpdateStorylines,
    swimlanesContainerRef,
    timelineContainerRef,
  });

  const markersHook = useTimelineMarkers({
    chapters,
    onUpdateChapter,
  });

  const dataMapsHook = useTimelineDataMaps({
    chapters,
    scenes,
    storylines,
    characters,
    onUpdateChapter,
    onUpdateStorylines,
  });

  const popoversHook = useTimelinePopovers({
    chapters,
    storylines,
    characters,
    onUpdateChapter,
    onUpdateStorylines,
    onCloseMarkerPopover: () => markersHook.setActiveMarkerPopover(null),
  });

  const handleToggleAttachDropdown = useCallback((sId: string, type: 'character' | 'storyline') => {
    popoversHook.setOpenAttachDropdown((prev) =>
      prev?.sceneId === sId && prev?.type === type ? null : { sceneId: sId, type }
    );
  }, [popoversHook]);

  return (
    <div className="flex flex-col h-full select-none overflow-hidden bg-zinc-950 font-sans relative">
      <TimelineHeader
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        zoomX={zoomHook.zoomX}
        zoomY={zoomHook.zoomY}
        sliderXRef={zoomHook.sliderXRef}
        sliderYRef={zoomHook.sliderYRef}
        percentXRef={zoomHook.percentXRef}
        percentYRef={zoomHook.percentYRef}
        onZoomXChange={zoomHook.handleZoomXChange}
        onZoomYChange={zoomHook.handleZoomYChange}
        storylines={storylines}
        characters={characters}
        selectedStorylineFilter={filtersHook.selectedStorylineFilter}
        selectedCharacterFilter={filtersHook.selectedCharacterFilter}
        onStorylineFilterChange={filtersHook.setSelectedStorylineFilter}
        onCharacterFilterChange={filtersHook.setSelectedCharacterFilter}
      />

      {layoutMode === 'subway' ? (
        <TimelineSubwayMapView
          timelineContainerRef={timelineContainerRef}
          swimlanesContainerRef={swimlanesContainerRef}
          timelineColumns={dataMapsHook.timelineColumns}
          storylines={storylines}
          characters={characters}
          activeChapterId={activeChapterId}
          participatingScenesSet={filtersHook.participatingScenesSet}
          sceneWordCountMap={dataMapsHook.sceneWordCountMap}
          sceneAttachedStorylinesMap={dataMapsHook.sceneAttachedStorylinesMap}
          characterMap={dataMapsHook.characterMap}
          stationMap={dataMapsHook.stationMap}
          storylineSpanMap={dataMapsHook.storylineSpanMap}
          collapsedStorylines={heightsHook.collapsedStorylines}
          draggedStorylineId={dragDropHook.draggedStorylineId}
          dragOverPlotId={dragDropHook.dragOverPlotId}
          shiftTargetIndex={dragDropHook.shiftTargetIndex}
          timelineDropMode={timelineDropMode}
          openAttachDropdown={popoversHook.openAttachDropdown}
          sceneHeaderHeight={heightsHook.sceneHeaderHeight}
          getSceneWidth={heightsHook.getSceneWidth}
          getRowHeight={heightsHook.getRowHeight}
          manualSceneWidths={heightsHook.manualSceneWidths}
          plotHeights={heightsHook.plotHeights}
          onSelectScene={onSelectChapter}
          onSceneResizeStart={heightsHook.handleSceneResizeStart}
          onSceneHeaderResizeStart={heightsHook.handleSceneHeaderResizeStart}
          onPlotResizeStart={heightsHook.handlePlotResizeStart}
          onToggleStorylineCollapse={heightsHook.toggleStorylineCollapse}
          onAddMarker={markersHook.handleAddMarker}
          onOpenMarkerModal={(sId, mId) => markersHook.setActiveMarkerPopover({ sceneId: sId, markerId: mId })}
          onOpenEntityPopover={popoversHook.handleOpenMarkerPopover}
          onToggleAttachDropdown={handleToggleAttachDropdown}
          onAttachStoryline={popoversHook.handleAttachStoryline}
          onAttachCharacter={popoversHook.handleAttachCharacter}
          onStorylineDragStart={dragDropHook.handleStorylineDragStart}
          onStorylineDragEnter={dragDropHook.handleStorylineDragEnter}
          onSwimlanesDragOver={dragDropHook.handleSwimlanesDragOver}
          onStorylineDragOver={dragDropHook.handleStorylineDragOver}
          onStorylineDragLeave={dragDropHook.handleStorylineDragLeave}
          onStorylineDrop={dragDropHook.handleStorylineDrop}
          onStorylineDragEnd={dragDropHook.handleStorylineDragEnd}
          registerTrack={dragDropHook.registerTrack}
        />
      ) : (
        <TimelineLanesView
          chapterGroups={dataMapsHook.chapterGroups}
          collapsedFolders={collapsedFolders}
          activeChapterId={activeChapterId}
          participatingScenesSet={filtersHook.participatingScenesSet}
          sceneWordCountMap={dataMapsHook.sceneWordCountMap}
          sceneAttachedStorylinesMap={dataMapsHook.sceneAttachedStorylinesMap}
          characterMap={dataMapsHook.characterMap}
          storylines={storylines}
          characters={characters}
          openAttachDropdown={popoversHook.openAttachDropdown}
          onToggleFolder={toggleFolder}
          onSelectScene={onSelectChapter}
          onAddMarker={markersHook.handleAddMarker}
          onOpenMarkerModal={(sId, mId) => markersHook.setActiveMarkerPopover({ sceneId: sId, markerId: mId })}
          onOpenEntityPopover={popoversHook.handleOpenMarkerPopover}
          onToggleAttachDropdown={handleToggleAttachDropdown}
          onAttachStoryline={popoversHook.handleAttachStoryline}
          onAttachCharacter={popoversHook.handleAttachCharacter}
        />
      )}

      <TimelinePopoversOverlay
        chapters={chapters}
        storylines={storylines}
        characters={characters}
        activeMarkerPopover={markersHook.activeMarkerPopover}
        markerPopoverRef={popoversHook.markerPopoverRef}
        onCloseMarkerPopover={() => markersHook.setActiveMarkerPopover(null)}
        onUpdateMarker={markersHook.handleUpdateMarker}
        onDeleteMarker={markersHook.handleDeleteMarker}
        activePopover={popoversHook.activePopover}
        popoverRef={popoversHook.popoverRef}
        onCloseEntityPopover={() => popoversHook.setActivePopover(null)}
        onDetachStoryline={popoversHook.handleDetachStoryline}
        onDetachCharacter={popoversHook.handleDetachCharacter}
      />
    </div>
  );
}

export default memo(TimelineViewComponent);
