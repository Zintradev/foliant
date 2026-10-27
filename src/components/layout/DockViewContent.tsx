import React, { memo, lazy, Suspense } from 'react';
import { TabId, CharacterNodePosition } from '../../types/dock';
import { FoliantProject, FoliantChapter } from '../../types/project';
import { AppSettings } from '../../types/settings';
import { SaveStatus } from '../../hooks/useProjectPersistence';
import OutlineView from '../dock/views/OutlineView';
import StorylineView from '../dock/views/StorylineView';
import SceneInspector from '../dock/views/SceneInspector';
import ProjectStatsView from '../dock/views/ProjectStatsView';
import ContextPanel from '../context/ContextPanel';
import MoodboardBlock from '../context/MoodboardBlock';
import CharactersView from '../dock/views/CharactersView';
import WorldbuildingView from '../dock/views/WorldbuildingView';
import SearchView from '../dock/views/SearchView';

const TimelineView = lazy(() => import('../dock/views/TimelineView'));
const RelationshipGraphView = lazy(() => import('../dock/views/RelationshipGraphView'));

export interface DockViewContentProps {
  tabId: TabId;
  isExpanded?: boolean;
  project: FoliantProject;
  setProject: React.Dispatch<React.SetStateAction<FoliantProject>>;
  activeChapterId: string;
  setActiveChapterId: (id: string) => void;
  activeChapter?: FoliantChapter;
  appSettings: AppSettings;
  timelineFilters: { storyline: string; character: string };
  setTimelineFilters: React.Dispatch<React.SetStateAction<{ storyline: string; character: string }>>;
  setIsDirty: (dirty: boolean) => void;
  setEditorSaveStatus: (status: SaveStatus) => void;
  onSelectSearchResult: (sceneId: string, searchTerm: string) => void;
  handleAddChapter: (type?: 'folder' | 'scene', parentId?: string | null) => void;
  handleDeleteChapter: (id: string) => Promise<void>;
  handleUpdateChapter: (id: string, updates: Partial<FoliantChapter>) => void;
  handleUpdateStorylines: (storylines: FoliantProject['storylines']) => void;
  handleUpdateCharacters: (characters: FoliantProject['characters']) => void;
  handleAddCharacter: (char: FoliantProject['characters'][0]) => void;
  handleUpdateRelationships: (relationships: FoliantProject['relationships']) => void;
  handleUpdateJunctions: (junctions: FoliantProject['junctions']) => void;
  handleUpdateCharacterPositions: (
    positionsOrUpdater: CharacterNodePosition[] | ((prev: CharacterNodePosition[]) => CharacterNodePosition[])
  ) => void;
  handleUpdateWorldItems: (items: FoliantProject['worldItems']) => void;
  handleUpdateContextBlocks: (blocks: FoliantProject['contextBlocks']) => void;
}

export const DockViewContent = memo(function DockViewContent({
  tabId,
  isExpanded = false,
  project,
  setProject,
  activeChapterId,
  setActiveChapterId,
  activeChapter,
  appSettings,
  timelineFilters,
  setTimelineFilters,
  setIsDirty,
  setEditorSaveStatus,
  onSelectSearchResult,
  handleAddChapter,
  handleDeleteChapter,
  handleUpdateChapter,
  handleUpdateStorylines,
  handleUpdateCharacters,
  handleAddCharacter,
  handleUpdateRelationships,
  handleUpdateJunctions,
  handleUpdateCharacterPositions,
  handleUpdateWorldItems,
  handleUpdateContextBlocks,
}: DockViewContentProps) {
  const persistViewFilters = Boolean(appSettings.preferences?.persistViewFilters);

  switch (tabId) {
    case 'outline':
      return (
        <OutlineView
          chapters={project.chapters}
          activeChapterId={activeChapterId}
          onSelectChapter={setActiveChapterId}
          onAddChapter={handleAddChapter}
          onDeleteChapter={handleDeleteChapter}
          onUpdateChapter={handleUpdateChapter}
          isExpanded={isExpanded}
          storylines={project.storylines}
          onDirtyChange={setIsDirty}
        />
      );
    case 'storyline':
      return (
        <StorylineView
          storylines={project.storylines}
          chapters={project.chapters}
          worldItems={project.worldItems}
          onChange={handleUpdateStorylines}
          onSelectChapter={setActiveChapterId}
          colorSettings={appSettings}
          isExpanded={isExpanded}
          onDirtyChange={setIsDirty}
        />
      );
    case 'timeline':
      return (
        <Suspense
          fallback={
            <div className="flex-1 h-full w-full flex items-center justify-center text-xs text-zinc-500 font-mono">
              Loading Timeline...
            </div>
          }
        >
          <TimelineView
            chapters={project.chapters}
            storylines={project.storylines}
            characters={project.characters}
            activeChapterId={activeChapterId}
            onSelectChapter={setActiveChapterId}
            onUpdateChapter={handleUpdateChapter}
            onUpdateStorylines={handleUpdateStorylines}
            onUpdateCharacters={handleUpdateCharacters}
            isExpanded={isExpanded}
            timelineDropMode={appSettings.preferences?.timelineDropMode}
            appSettings={appSettings}
            timelineFilters={persistViewFilters ? timelineFilters : undefined}
            setTimelineFilters={persistViewFilters ? setTimelineFilters : undefined}
            selectedStorylineFilter={persistViewFilters ? timelineFilters.storyline : undefined}
            onStorylineFilterChange={
              persistViewFilters
                ? (id) => setTimelineFilters((f) => ({ ...f, storyline: id }))
                : undefined
            }
            selectedCharacterFilter={persistViewFilters ? timelineFilters.character : undefined}
            onCharacterFilterChange={
              persistViewFilters
                ? (id) => setTimelineFilters((f) => ({ ...f, character: id }))
                : undefined
            }
          />
        </Suspense>
      );
    case 'relationships':
      return (
        <Suspense
          fallback={
            <div className="flex-1 h-full w-full flex items-center justify-center text-xs text-zinc-500 font-mono">
              Loading Graph...
            </div>
          }
        >
          <RelationshipGraphView
            characters={project.characters}
            relationships={project.relationships}
            junctions={project.junctions}
            storylines={project.storylines}
            characterPositions={project.characterPositions}
            onUpdateRelationships={handleUpdateRelationships}
            onUpdateCharacters={handleUpdateCharacters}
            onUpdateJunctions={handleUpdateJunctions}
            onUpdateCharacterPositions={handleUpdateCharacterPositions}
            onAddCharacter={handleAddCharacter}
            isExpanded={isExpanded}
          />
        </Suspense>
      );
    case 'inspector':
      return (
        <SceneInspector
          activeNodeId={activeChapterId}
          activeNode={activeChapter}
          chapters={project.chapters}
          characters={project.characters}
          worldItems={project.worldItems}
          storylines={project.storylines}
          onUpdateNode={handleUpdateChapter}
          onSelectChapter={setActiveChapterId}
        />
      );
    case 'stats':
      return (
        <ProjectStatsView
          chapters={project.chapters}
          storylines={project.storylines}
          activeChapterId={activeChapterId}
          onSelectChapter={setActiveChapterId}
          onUpdateChapter={handleUpdateChapter}
          targetWordCount={project.targetWords ?? 80000}
          onUpdateTargetWordCount={(newTarget) => {
            setProject((prev) => ({
              ...prev,
              lastModified: Date.now(),
              targetWords: newTarget,
            }));
          }}
          isExpanded={isExpanded}
        />
      );
    case 'context':
      return (
        <ContextPanel
          blocks={project.contextBlocks}
          onChange={handleUpdateContextBlocks}
          onStartEditing={() => setEditorSaveStatus('saving')}
        />
      );
    case 'moodboard':
      return (
        <div className="p-3">
          <MoodboardBlock collapsible={false} />
        </div>
      );
    case 'characters':
      return (
        <CharactersView
          characters={project.characters}
          onChange={handleUpdateCharacters}
          colorSettings={appSettings}
          isExpanded={isExpanded}
          saveMode={appSettings.preferences?.saveMode || 'auto'}
          onDirtyChange={setIsDirty}
        />
      );
    case 'worldbuilding':
      return (
        <WorldbuildingView
          items={project.worldItems}
          onChange={handleUpdateWorldItems}
          worldDropMode={appSettings.preferences?.worldDropMode}
          isExpanded={isExpanded}
          saveMode={appSettings.preferences?.saveMode || 'auto'}
          onDirtyChange={setIsDirty}
        />
      );
    case 'search':
      return (
        <SearchView
          project={project}
          activeSceneId={activeChapterId}
          onSelectResult={onSelectSearchResult}
          isExpanded={isExpanded}
        />
      );
    default:
      return null;
  }
});

DockViewContent.displayName = 'DockViewContent';
