import React, { memo } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';
import { PlotStatus } from '../../../../types/project';
import { StorylineItem, CharacterItem } from '../../../../types/dock';
import { ChapterGroup } from './types';
import { TimelineLanesSceneCard } from './TimelineLanesSceneCard';

export interface TimelineChapterGroupLanesProps {
  group: ChapterGroup;
  isCollapsed: boolean;
  activeChapterId: string;
  participatingScenesSet: Set<string> | null;
  sceneWordCountMap: Map<string, number>;
  sceneAttachedStorylinesMap: Map<string, { storyline: StorylineItem; status: PlotStatus }[]>;
  characterMap: Map<string, CharacterItem>;
  storylines: StorylineItem[];
  characters: CharacterItem[];
  openAttachDropdown: { sceneId: string; type: 'character' | 'storyline' } | null;
  onToggleCollapse: (folderId: string) => void;
  onSelectScene: (id: string) => void;
  onAddMarker: (sceneId: string) => void;
  onOpenMarkerModal: (sceneId: string, markerId: string) => void;
  onOpenEntityPopover: (e: React.MouseEvent, type: 'storyline' | 'character', id: string, sceneId: string) => void;
  onToggleAttachDropdown: (sceneId: string, type: 'character' | 'storyline') => void;
  onAttachStoryline: (sceneId: string, storylineId: string) => void;
  onAttachCharacter: (sceneId: string, characterId: string) => void;
}

export const TimelineChapterGroupLanes = memo(function TimelineChapterGroupLanes({
  group,
  isCollapsed,
  activeChapterId,
  participatingScenesSet,
  sceneWordCountMap,
  sceneAttachedStorylinesMap,
  characterMap,
  storylines,
  characters,
  openAttachDropdown,
  onToggleCollapse,
  onSelectScene,
  onAddMarker,
  onOpenMarkerModal,
  onOpenEntityPopover,
  onToggleAttachDropdown,
  onAttachStoryline,
  onAttachCharacter,
}: TimelineChapterGroupLanesProps) {
  const folder = group.folder;
  const folderId = folder?.id || 'root-group';
  const folderTitle = folder ? folder.title : 'Root Scenes (No Chapter)';

  if (group.scenes.length === 0) {
    return (
      <div
        key={folderId}
        className="bg-zinc-900/40 border border-zinc-800/60 rounded-xs px-2.5 py-1 flex items-center justify-between text-zinc-400 select-none"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-3.5 h-3.5 rounded-xs bg-amber-950/50 border border-amber-800/50 flex items-center justify-center text-amber-400 shrink-0">
            <Folder className="w-2 h-2" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-300 font-sans truncate">
            {folderTitle}
          </span>
          <span className="text-[9px] font-mono text-zinc-600">
            (Folder)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div key={folderId} className="rounded-xs border border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-xs">
      {/* Chapter / Folder Header */}
      <div
        onClick={() => folder && onToggleCollapse(folder.id)}
        className="flex items-center justify-between px-3 py-2 bg-zinc-900/70 border-b border-zinc-800/60 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          {folder && (
            <button
              type="button"
              className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded-xs transition"
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          <div className="w-4 h-4 rounded-xs bg-amber-950/60 border border-amber-800/60 flex items-center justify-center shrink-0">
            {folder ? <Folder className="w-2.5 h-2.5 text-amber-400" /> : <FileText className="w-2.5 h-2.5 text-zinc-400" />}
          </div>
          <span className="text-xs font-semibold text-zinc-200 truncate">
            {folder ? folder.title : 'Root Scenes'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
          <span>{group.scenes.length} scenes</span>
          <span className="text-zinc-500">•</span>
          <span>{group.totalWords} words</span>
        </div>
      </div>

      {/* Horizontal List of Scene Cards in this chapter */}
      {!isCollapsed && (
        <div className="overflow-x-auto p-2.5 flex items-stretch gap-2.5 bg-zinc-950/50">
          {group.scenes.map((scene) => {
            const isActive = activeChapterId === scene.id;
            const isDimmed = participatingScenesSet ? !participatingScenesSet.has(scene.id) : false;
            const wordCount = sceneWordCountMap.get(scene.id) || 0;
            const attachedStorylines = sceneAttachedStorylinesMap.get(scene.id) || [];

            return (
              <TimelineLanesSceneCard
                key={scene.id}
                scene={scene}
                isActive={isActive}
                isDimmed={isDimmed}
                wordCount={wordCount}
                attachedStorylines={attachedStorylines}
                characterMap={characterMap}
                storylines={storylines}
                characters={characters}
                openAttachDropdown={openAttachDropdown}
                onSelectScene={onSelectScene}
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
      )}
    </div>
  );
});

interface TimelineLanesViewProps {
  chapterGroups: ChapterGroup[];
  collapsedFolders: Record<string, boolean>;
  activeChapterId: string;
  participatingScenesSet: Set<string> | null;
  sceneWordCountMap: Map<string, number>;
  sceneAttachedStorylinesMap: Map<string, { storyline: StorylineItem; status: PlotStatus }[]>;
  characterMap: Map<string, CharacterItem>;
  storylines: StorylineItem[];
  characters: CharacterItem[];
  openAttachDropdown: { sceneId: string; type: 'character' | 'storyline' } | null;
  onToggleFolder: (id: string) => void;
  onSelectScene: (id: string) => void;
  onAddMarker: (sceneId: string) => void;
  onOpenMarkerModal: (sceneId: string, markerId: string) => void;
  onOpenEntityPopover: (e: React.MouseEvent, type: 'storyline' | 'character', id: string, sceneId: string) => void;
  onToggleAttachDropdown: (sceneId: string, type: 'character' | 'storyline') => void;
  onAttachStoryline: (sceneId: string, storylineId: string) => void;
  onAttachCharacter: (sceneId: string, characterId: string) => void;
}

function TimelineLanesViewComponent({
  chapterGroups,
  collapsedFolders,
  activeChapterId,
  participatingScenesSet,
  sceneWordCountMap,
  sceneAttachedStorylinesMap,
  characterMap,
  storylines,
  characters,
  openAttachDropdown,
  onToggleFolder,
  onSelectScene,
  onAddMarker,
  onOpenMarkerModal,
  onOpenEntityPopover,
  onToggleAttachDropdown,
  onAttachStoryline,
  onAttachCharacter,
}: TimelineLanesViewProps) {
  return (
    <div className="flex-1 overflow-auto bg-zinc-950 p-3 space-y-4">
      {chapterGroups.map((group) => {
        const folderId = group.folder?.id || 'root-group';
        const isCollapsed = Boolean(collapsedFolders[folderId]);

        return (
          <TimelineChapterGroupLanes
            key={folderId}
            group={group}
            isCollapsed={isCollapsed}
            activeChapterId={activeChapterId}
            participatingScenesSet={participatingScenesSet}
            sceneWordCountMap={sceneWordCountMap}
            sceneAttachedStorylinesMap={sceneAttachedStorylinesMap}
            characterMap={characterMap}
            storylines={storylines}
            characters={characters}
            openAttachDropdown={openAttachDropdown}
            onToggleCollapse={onToggleFolder}
            onSelectScene={onSelectScene}
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
  );
}

export const TimelineLanesView = memo(TimelineLanesViewComponent);
