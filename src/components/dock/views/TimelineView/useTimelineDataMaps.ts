import { useMemo } from 'react';
import { TextNode, PlotStatus } from '../../../../types/project';
import { StorylineItem, CharacterItem } from '../../../../types/dock';
import { ChapterGroup, TimelineColumnItem } from './types';
import { countWords } from '../../../../utils/textMetrics';

interface UseTimelineDataMapsParams {
  chapters: TextNode[];
  scenes: TextNode[];
  storylines: StorylineItem[];
  characters: CharacterItem[];
  onUpdateChapter?: (id: string, updates: Partial<TextNode>) => void;
  onUpdateStorylines?: (updated: StorylineItem[]) => void;
}

export function useTimelineDataMaps({
  chapters,
  scenes,
  storylines,
  characters,
  onUpdateChapter,
  onUpdateStorylines,
}: UseTimelineDataMapsParams) {
  const sceneAttachedStorylinesMap = useMemo(() => {
    const map = new Map<string, { storyline: StorylineItem; status: PlotStatus }[]>();
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const scenePlotStates = scene.plotStates || [];
      const results: { storyline: StorylineItem; status: PlotStatus }[] = [];

      for (let j = 0; j < storylines.length; j++) {
        const s = storylines[j];
        const plotState = scenePlotStates.find((p) => p.storylineId === s.id);
        const isLinkedLegacy = s.linkedChapterIds?.includes(scene.id);
        if (plotState) {
          results.push({ storyline: s, status: plotState.status });
        } else if (isLinkedLegacy) {
          results.push({ storyline: s, status: 'Active' });
        }
      }
      map.set(scene.id, results);
    }
    return map;
  }, [scenes, storylines]);

  const sceneWordCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < scenes.length; i++) {
      map.set(scenes[i].id, countWords(scenes[i].content || ''));
    }
    return map;
  }, [scenes]);

  const characterMap = useMemo(() => {
    const map = new Map<string, CharacterItem>();
    for (let i = 0; i < characters.length; i++) {
      map.set(characters[i].id, characters[i]);
    }
    return map;
  }, [characters]);

  const timelineColumns = useMemo<TimelineColumnItem[]>(() => {
    return scenes.map((scene, originalIndex) => ({
      type: 'scene',
      scene,
      originalIndex,
    }));
  }, [scenes]);

  const { storylineSpanMap, stationMap } = useMemo(() => {
    const spans = new Map<string, { firstActiveIdx: number; lastActiveIdx: number; count: number }>();
    const stations = new Map<string, {
      plotState: { storylineId: string; status: PlotStatus } | undefined;
      isLinkedLegacy: boolean;
      isStationActive: boolean;
      currentStatus: PlotStatus;
    }>();

    storylines.forEach((st) => {
      const activeIndices: number[] = [];
      scenes.forEach((sc, idx) => {
        const plotState = sc.plotStates?.find((p) => p.storylineId === st.id);
        const isLinkedLegacy = Boolean(st.linkedChapterIds?.includes(sc.id));
        const isStationActive = Boolean(plotState || isLinkedLegacy);
        const currentStatus: PlotStatus = plotState?.status || 'Active';

        stations.set(`${st.id}:${sc.id}`, {
          plotState,
          isLinkedLegacy,
          isStationActive,
          currentStatus,
        });

        if (isStationActive) activeIndices.push(idx);
      });

      spans.set(st.id, {
        firstActiveIdx: activeIndices.length > 0 ? activeIndices[0] : -1,
        lastActiveIdx: activeIndices.length > 0 ? activeIndices[activeIndices.length - 1] : -1,
        count: activeIndices.length,
      });
    });

    return { storylineSpanMap: spans, stationMap: stations };
  }, [storylines, scenes]);

  const chapterGroups = useMemo<ChapterGroup[]>(() => {
    const folders = chapters.filter((c) => c.type === 'folder');
    const groups: ChapterGroup[] = [];
    const scenesByParent = new Map<string | null, TextNode[]>();

    scenes.forEach((scene) => {
      const pid = scene.parentId || null;
      if (!scenesByParent.has(pid)) scenesByParent.set(pid, []);
      scenesByParent.get(pid)!.push(scene);
    });

    folders.forEach((folder) => {
      const folderScenes = scenesByParent.get(folder.id) || [];
      const totalWords = folderScenes.reduce((acc, s) => acc + countWords(s.content), 0);
      groups.push({ folder, scenes: folderScenes, totalWords });
    });

    const rootScenes = scenesByParent.get(null) || [];
    if (rootScenes.length > 0) {
      const totalWords = rootScenes.reduce((acc, s) => acc + countWords(s.content), 0);
      groups.push({ folder: null, scenes: rootScenes, totalWords });
    }

    return groups;
  }, [chapters, scenes]);

  const handleToggleStationStatus = (sceneId: string, storylineId: string) => {
    const scene = chapters.find((c) => c.id === sceneId);
    if (!scene || !onUpdateChapter) return;

    const currentPlotStates = scene.plotStates || [];
    const existing = currentPlotStates.find((p) => p.storylineId === storylineId);

    if (!existing) {
      onUpdateChapter(sceneId, {
        plotStates: [...currentPlotStates, { storylineId, status: 'Active' }],
      });
      if (onUpdateStorylines) {
        onUpdateStorylines(
          storylines.map((s) => {
            if (s.id === storylineId && !s.linkedChapterIds?.includes(sceneId)) {
              return { ...s, linkedChapterIds: [...(s.linkedChapterIds || []), sceneId] };
            }
            return s;
          })
        );
      }
    } else if (existing.status === 'Active') {
      onUpdateChapter(sceneId, {
        plotStates: currentPlotStates.map((p) =>
          p.storylineId === storylineId ? { ...p, status: 'Dormant' as PlotStatus } : p
        ),
      });
    } else if (existing.status === 'Dormant') {
      onUpdateChapter(sceneId, {
        plotStates: currentPlotStates.map((p) =>
          p.storylineId === storylineId ? { ...p, status: 'Resolved' as PlotStatus } : p
        ),
      });
    } else {
      // Resolved -> Detach
      onUpdateChapter(sceneId, {
        plotStates: currentPlotStates.filter((p) => p.storylineId !== storylineId),
      });
      if (onUpdateStorylines) {
        onUpdateStorylines(
          storylines.map((s) => {
            if (s.id === storylineId) {
              return { ...s, linkedChapterIds: (s.linkedChapterIds || []).filter((id) => id !== sceneId) };
            }
            return s;
          })
        );
      }
    }
  };

  return {
    sceneAttachedStorylinesMap,
    sceneWordCountMap,
    characterMap,
    timelineColumns,
    storylineSpanMap,
    stationMap,
    chapterGroups,
    handleToggleStationStatus,
  };
}
