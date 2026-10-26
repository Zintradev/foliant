import React, { useState, useMemo, useCallback } from 'react';
import { TextNode } from '../../../../types/project';
import { StorylineItem } from '../../../../types/dock';
import { TimelineFilters } from './types';

interface UseTimelineFiltersParams {
  scenes: TextNode[];
  storylines: StorylineItem[];
  timelineFilters?: TimelineFilters;
  setTimelineFilters?:
    | React.Dispatch<React.SetStateAction<TimelineFilters>>
    | ((filters: TimelineFilters) => void);
  propStorylineFilter?: string;
  propOnStorylineFilterChange?: (id: string) => void;
  propCharacterFilter?: string;
  propOnCharacterFilterChange?: (id: string) => void;
}

export function useTimelineFilters({
  scenes,
  storylines,
  timelineFilters,
  setTimelineFilters,
  propStorylineFilter,
  propOnStorylineFilterChange,
  propCharacterFilter,
  propOnCharacterFilterChange,
}: UseTimelineFiltersParams) {
  const [internalStorylineFilter, setInternalStorylineFilter] = useState<string>('all');
  const [internalCharacterFilter, setInternalCharacterFilter] = useState<string>('all');

  const selectedStorylineFilter =
    timelineFilters?.storyline !== undefined
      ? timelineFilters.storyline
      : propStorylineFilter !== undefined
      ? propStorylineFilter
      : internalStorylineFilter;

  const selectedCharacterFilter =
    timelineFilters?.character !== undefined
      ? timelineFilters.character
      : propCharacterFilter !== undefined
      ? propCharacterFilter
      : internalCharacterFilter;

  const setSelectedStorylineFilter = useCallback(
    (id: string) => {
      if (setTimelineFilters) {
        setTimelineFilters({
          storyline: id,
          character: selectedCharacterFilter,
        });
      } else if (propOnStorylineFilterChange) {
        propOnStorylineFilterChange(id);
      }
      setInternalStorylineFilter(id);
    },
    [setTimelineFilters, propOnStorylineFilterChange, selectedCharacterFilter]
  );

  const setSelectedCharacterFilter = useCallback(
    (id: string) => {
      if (setTimelineFilters) {
        setTimelineFilters({
          storyline: selectedStorylineFilter,
          character: id,
        });
      } else if (propOnCharacterFilterChange) {
        propOnCharacterFilterChange(id);
      }
      setInternalCharacterFilter(id);
    },
    [setTimelineFilters, propOnCharacterFilterChange, selectedStorylineFilter]
  );

  const participatingScenesSet = useMemo(() => {
    if (selectedStorylineFilter === 'all' && selectedCharacterFilter === 'all') {
      return null;
    }
    const set = new Set<string>();
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      let matchesStoryline = true;
      if (selectedStorylineFilter !== 'all') {
        const hasLegacyLink = storylines
          .filter((s) => s.id === selectedStorylineFilter)
          .some((s) => s.linkedChapterIds?.includes(scene.id));
        const hasPlotState = scene.plotStates?.some(
          (p) => p.storylineId === selectedStorylineFilter
        );
        matchesStoryline = Boolean(hasLegacyLink || hasPlotState);
      }

      let matchesCharacter = true;
      if (selectedCharacterFilter !== 'all') {
        matchesCharacter = Boolean((scene.attachedCharacterIds || []).includes(selectedCharacterFilter));
      }

      if (matchesStoryline && matchesCharacter) {
        set.add(scene.id);
      }
    }
    return set;
  }, [scenes, selectedStorylineFilter, selectedCharacterFilter, storylines]);

  return {
    selectedStorylineFilter,
    selectedCharacterFilter,
    setSelectedStorylineFilter,
    setSelectedCharacterFilter,
    participatingScenesSet,
  };
}
