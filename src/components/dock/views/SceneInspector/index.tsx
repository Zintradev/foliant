import React, { useMemo, useState, memo, useCallback } from 'react';
import { ChapterStatus, PlotStatus, ScenePlotState } from '../../../../types/project';
import { countWords } from '../../../../utils/textMetrics';
import { SceneInspectorProps, SceneInspectorAccordionKey } from './types';
import { useSceneInspectorSort } from './useSceneInspectorSort';
import SceneInspectorEmptyState from './SceneInspectorEmptyState';
import SceneInspectorHeader from './SceneInspectorHeader';
import SceneInspectorGoalSection from './SceneInspectorGoalSection';
import SceneInspectorSynopsisSection from './SceneInspectorSynopsisSection';
import SceneInspectorPlotsSection from './SceneInspectorPlotsSection';
import SceneInspectorCastSection from './SceneInspectorCastSection';
import SceneInspectorWorldSection from './SceneInspectorWorldSection';

export function SceneInspectorComponent({
  activeNodeId,
  activeNode,
  chapters = [],
  characters = [],
  worldItems = [],
  storylines = [],
  onUpdateNode,
}: SceneInspectorProps) {
  // Resolve node by prop or lookup from chapters
  const node = useMemo(() => {
    if (activeNode && activeNode.id === activeNodeId) return activeNode;
    return chapters.find((c) => c.id === activeNodeId) || activeNode;
  }, [activeNode, activeNodeId, chapters]);

  // Accordion state management: all sections collapsible
  const [openSections, setOpenSections] = useState<Record<SceneInspectorAccordionKey, boolean>>({
    goal: true,
    synopsis: true,
    plots: true,
    cast: true,
    world: true,
  });

  const toggleSection = useCallback((key: SceneInspectorAccordionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Attached entity IDs
  const attachedCharacterIds = node?.attachedCharacterIds || [];
  const attachedWorldItemIds = node?.attachedWorldItemIds || [];
  const currentPlotStates: ScenePlotState[] = node?.plotStates || [];

  const { sortedStorylines, sortedCharacters, sortedWorldItems } = useSceneInspectorSort({
    storylines,
    currentPlotStates,
    characters,
    attachedCharacterIds,
    worldItems,
    attachedWorldItemIds,
  });

  if (!node) {
    return <SceneInspectorEmptyState />;
  }

  const isFolder = node.type === 'folder';
  const currentWords = countWords(node.content);
  const targetWords = node.targetWords ?? (isFolder ? 5000 : 2500);
  const progressPercent = targetWords > 0 ? (currentWords / targetWords) * 100 : 0;
  const clampedProgress = Math.min(progressPercent, 100);
  const readingTimeMin = Math.max(1, Math.ceil(currentWords / 225));

  const handleSynopsisChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateNode(node.id, { synopsis: e.target.value });
  };

  const handleTargetWordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onUpdateNode(node.id, { targetWords: isNaN(val) ? 0 : Math.max(0, val) });
  };

  const handleSelectPreset = (preset: number) => {
    onUpdateNode(node.id, { targetWords: preset });
  };

  const handleStatusChange = (status: ChapterStatus) => {
    onUpdateNode(node.id, { status });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNode(node.id, { title: e.target.value });
  };

  const handlePovChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onUpdateNode(node.id, { povCharacterId: val || undefined });
  };

  const handleToggleCharacter = (charId: string) => {
    const exists = attachedCharacterIds.includes(charId);
    const updated = exists
      ? attachedCharacterIds.filter((id) => id !== charId)
      : [...attachedCharacterIds, charId];
    onUpdateNode(node.id, { attachedCharacterIds: updated });
  };

  const handleToggleWorldItem = (worldId: string) => {
    const exists = attachedWorldItemIds.includes(worldId);
    const updated = exists
      ? attachedWorldItemIds.filter((id) => id !== worldId)
      : [...attachedWorldItemIds, worldId];
    onUpdateNode(node.id, { attachedWorldItemIds: updated });
  };

  const handleTogglePlotInScene = (storylineId: string) => {
    const existing = currentPlotStates.find((p) => p.storylineId === storylineId);
    let updated: ScenePlotState[];
    if (existing) {
      updated = currentPlotStates.filter((p) => p.storylineId !== storylineId);
    } else {
      updated = [...currentPlotStates, { storylineId, status: 'Active' }];
    }
    onUpdateNode(node.id, { plotStates: updated });
  };

  const handleUpdatePlotStatus = (storylineId: string, status: PlotStatus) => {
    const existing = currentPlotStates.find((p) => p.storylineId === storylineId);
    let updated: ScenePlotState[];
    if (existing) {
      updated = currentPlotStates.map((p) =>
        p.storylineId === storylineId ? { ...p, status } : p
      );
    } else {
      updated = [...currentPlotStates, { storylineId, status }];
    }
    onUpdateNode(node.id, { plotStates: updated });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 select-none overflow-y-auto text-zinc-200 font-sans divide-y divide-zinc-850">
      <SceneInspectorHeader
        isFolder={isFolder}
        title={node.title}
        status={node.status}
        onTitleChange={handleTitleChange}
        onStatusChange={handleStatusChange}
      />

      <SceneInspectorGoalSection
        isOpen={openSections.goal}
        onToggle={() => toggleSection('goal')}
        currentWords={currentWords}
        targetWords={targetWords}
        progressPercent={progressPercent}
        clampedProgress={clampedProgress}
        readingTimeMin={readingTimeMin}
        onTargetWordsChange={handleTargetWordsChange}
        onSelectPreset={handleSelectPreset}
      />

      <SceneInspectorSynopsisSection
        isOpen={openSections.synopsis}
        onToggle={() => toggleSection('synopsis')}
        synopsis={node.synopsis ?? ''}
        onSynopsisChange={handleSynopsisChange}
      />

      <SceneInspectorPlotsSection
        isOpen={openSections.plots}
        onToggle={() => toggleSection('plots')}
        storylines={storylines}
        sortedStorylines={sortedStorylines}
        currentPlotStates={currentPlotStates}
        onTogglePlotInScene={handleTogglePlotInScene}
        onUpdatePlotStatus={handleUpdatePlotStatus}
      />

      <SceneInspectorCastSection
        isOpen={openSections.cast}
        onToggle={() => toggleSection('cast')}
        povCharacterId={node.povCharacterId}
        characters={characters}
        sortedCharacters={sortedCharacters}
        attachedCharacterIds={attachedCharacterIds}
        onPovChange={handlePovChange}
        onToggleCharacter={handleToggleCharacter}
      />

      <SceneInspectorWorldSection
        isOpen={openSections.world}
        onToggle={() => toggleSection('world')}
        worldItems={worldItems}
        sortedWorldItems={sortedWorldItems}
        attachedWorldItemIds={attachedWorldItemIds}
        onToggleWorldItem={handleToggleWorldItem}
      />
    </div>
  );
}

export default memo(SceneInspectorComponent);
