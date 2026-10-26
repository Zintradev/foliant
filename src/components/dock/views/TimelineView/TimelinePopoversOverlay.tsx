import React, { memo } from 'react';
import { Chapter } from '../../../../types/project';
import { Storyline, Character } from '../../../../types';
import { ActivePopover } from './types';
import { TimelineMarkerModal } from './TimelineMarkerModal';
import { TimelineEntityPopover } from './TimelineEntityPopover';

interface TimelinePopoversOverlayProps {
  chapters: Chapter[];
  storylines: Storyline[];
  characters: Character[];
  activeMarkerPopover: { sceneId: string; markerId: string } | null;
  markerPopoverRef: React.RefObject<HTMLDivElement | null>;
  onCloseMarkerPopover: () => void;
  onUpdateMarker: (sceneId: string, markerId: string, updates: any) => void;
  onDeleteMarker: (sceneId: string, markerId: string) => void;
  activePopover: ActivePopover | null;
  popoverRef: React.RefObject<HTMLDivElement | null>;
  onCloseEntityPopover: () => void;
  onDetachStoryline: (sceneId: string, storylineId: string) => void;
  onDetachCharacter: (sceneId: string, characterId: string) => void;
}

function TimelinePopoversOverlayComponent({
  chapters,
  storylines,
  characters,
  activeMarkerPopover,
  markerPopoverRef,
  onCloseMarkerPopover,
  onUpdateMarker,
  onDeleteMarker,
  activePopover,
  popoverRef,
  onCloseEntityPopover,
  onDetachStoryline,
  onDetachCharacter,
}: TimelinePopoversOverlayProps) {
  const activeMarker = activeMarkerPopover
    ? chapters
        .find((c) => c.id === activeMarkerPopover.sceneId)
        ?.markers?.find((m) => m.id === activeMarkerPopover.markerId)
    : null;

  const popoverStoryline =
    activePopover?.type === 'storyline'
      ? storylines.find((s) => s.id === activePopover.itemId)
      : null;
  const popoverCharacter =
    activePopover?.type === 'character'
      ? characters.find((c) => c.id === activePopover.itemId)
      : null;

  return (
    <>
      {activeMarker && activeMarkerPopover && (
        <TimelineMarkerModal
          marker={activeMarker}
          markerPopoverRef={markerPopoverRef}
          onClose={onCloseMarkerPopover}
          onUpdate={(updates) =>
            onUpdateMarker(activeMarkerPopover.sceneId, activeMarkerPopover.markerId, updates)
          }
          onDelete={() =>
            onDeleteMarker(activeMarkerPopover.sceneId, activeMarkerPopover.markerId)
          }
        />
      )}

      {activePopover && (
        <TimelineEntityPopover
          activePopover={activePopover}
          popoverStoryline={popoverStoryline}
          popoverCharacter={popoverCharacter}
          popoverRef={popoverRef}
          onClose={onCloseEntityPopover}
          onDetachStoryline={onDetachStoryline}
          onDetachCharacter={onDetachCharacter}
        />
      )}
    </>
  );
}

export const TimelinePopoversOverlay = memo(TimelinePopoversOverlayComponent);
