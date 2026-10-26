import { useMemo } from 'react';
import { CharacterItem, WorldItem, StorylineItem } from '../../../../types/dock';
import { ScenePlotState } from '../../../../types/project';

interface UseSceneInspectorSortParams {
  storylines: StorylineItem[];
  currentPlotStates: ScenePlotState[];
  characters: CharacterItem[];
  attachedCharacterIds: string[];
  worldItems: WorldItem[];
  attachedWorldItemIds: string[];
}

export function useSceneInspectorSort({
  storylines,
  currentPlotStates,
  characters,
  attachedCharacterIds,
  worldItems,
  attachedWorldItemIds,
}: UseSceneInspectorSortParams) {
  // Stable sort: selected/attached items float to top, and upon deselection return to original index
  const sortedStorylines = useMemo(() => {
    return [...storylines].sort((a, b) => {
      const aAttached = currentPlotStates.some((p) => p.storylineId === a.id);
      const bAttached = currentPlotStates.some((p) => p.storylineId === b.id);
      if (aAttached && !bAttached) return -1;
      if (!aAttached && bAttached) return 1;
      return storylines.indexOf(a) - storylines.indexOf(b);
    });
  }, [storylines, currentPlotStates]);

  const sortedCharacters = useMemo(() => {
    return [...characters].sort((a, b) => {
      const aAttached = attachedCharacterIds.includes(a.id);
      const bAttached = attachedCharacterIds.includes(b.id);
      if (aAttached && !bAttached) return -1;
      if (!aAttached && bAttached) return 1;
      return characters.indexOf(a) - characters.indexOf(b);
    });
  }, [characters, attachedCharacterIds]);

  const sortedWorldItems = useMemo(() => {
    return [...worldItems].sort((a, b) => {
      const aAttached = attachedWorldItemIds.includes(a.id);
      const bAttached = attachedWorldItemIds.includes(b.id);
      if (aAttached && !bAttached) return -1;
      if (!aAttached && bAttached) return 1;
      return worldItems.indexOf(a) - worldItems.indexOf(b);
    });
  }, [worldItems, attachedWorldItemIds]);

  return {
    sortedStorylines,
    sortedCharacters,
    sortedWorldItems,
  };
}
