import React, { memo } from 'react';
import { Plus, Check } from 'lucide-react';
import { TextNode, PlotStatus } from '../../../../types/project';
import { StorylineItem, CharacterItem } from '../../../../types/dock';
import { STORYLINE_COLOR_MAP, MARKER_COLOR_CONFIG, renderMarkerIcon } from './constants';
import { TimelineAttachDropdown } from './TimelineAttachDropdown';
import { useTranslation } from '../../../../i18n/translations';

interface TimelineLanesSceneCardProps {
  scene: TextNode;
  isActive: boolean;
  isDimmed: boolean;
  wordCount: number;
  attachedStorylines: { storyline: StorylineItem; status: PlotStatus }[];
  characterMap: Map<string, CharacterItem>;
  storylines: StorylineItem[];
  characters: CharacterItem[];
  openAttachDropdown: { sceneId: string; type: 'character' | 'storyline' } | null;
  onSelectScene: (id: string) => void;
  onAddMarker: (sceneId: string) => void;
  onOpenMarkerModal: (sceneId: string, markerId: string) => void;
  onOpenEntityPopover: (e: React.MouseEvent, type: 'storyline' | 'character', id: string, sceneId: string) => void;
  onToggleAttachDropdown: (sceneId: string, type: 'character' | 'storyline') => void;
  onAttachStoryline: (sceneId: string, storylineId: string) => void;
  onAttachCharacter: (sceneId: string, characterId: string) => void;
}

function TimelineLanesSceneCardComponent({
  scene,
  isActive,
  isDimmed,
  wordCount,
  attachedStorylines,
  characterMap,
  storylines,
  characters,
  openAttachDropdown,
  onSelectScene,
  onAddMarker,
  onOpenMarkerModal,
  onOpenEntityPopover,
  onToggleAttachDropdown,
  onAttachStoryline,
  onAttachCharacter,
}: TimelineLanesSceneCardProps) {
  const { t } = useTranslation();
  const isDropdownOpen = openAttachDropdown?.sceneId === scene.id;

  return (
    <div
      onClick={() => onSelectScene(scene.id)}
      className={`min-w-[240px] max-w-[280px] rounded-xs border p-2.5 bg-zinc-900/80 shadow-md transition-all cursor-pointer flex flex-col justify-between shrink-0 relative ${
        isActive
          ? 'border-zinc-400 ring-1 ring-zinc-400/40 bg-zinc-900'
          : 'border-zinc-800 hover:border-zinc-650 hover:bg-zinc-900/95'
      } ${isDimmed ? 'opacity-35' : ''}`}
    >
      <div className="space-y-1.5">
        {/* Title and Word Count Header */}
        <div className="flex items-center justify-between gap-1 pb-1 border-b border-zinc-800/80">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-mono px-1 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400 shrink-0">
              {scene.status || 'Draft'}
            </span>
            <h4 className="text-xs font-semibold text-zinc-200 truncate" title={scene.title}>
              {scene.title}
            </h4>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 shrink-0">
            {wordCount}w
          </span>
        </div>

        {/* Synopsis */}
        {scene.synopsis && (
          <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
            {scene.synopsis}
          </p>
        )}

        {/* Attached Storylines */}
        <div className="flex flex-wrap gap-1 pt-1">
          {attachedStorylines.map(({ storyline: st, status: currentStatus }) => {
            const theme = STORYLINE_COLOR_MAP[st.color] || STORYLINE_COLOR_MAP.emerald;
            const isDormant = currentStatus === 'Dormant';
            const isResolved = currentStatus === 'Resolved';
            let stateClasses = `${theme.bg} ${theme.border} ${theme.text}`;
            if (isDormant) stateClasses = `${theme.bg} ${theme.border} ${theme.text} opacity-50 border-dashed`;
            else if (isResolved) stateClasses = `${theme.bg} ${theme.border} ${theme.text} opacity-60`;

            return (
              <button
                key={`lane-st-${st.id}`}
                type="button"
                onClick={(e) => onOpenEntityPopover(e, 'storyline', st.id, scene.id)}
                className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs border text-[9px] font-mono truncate max-w-[170px] cursor-pointer hover:brightness-110 transition ${stateClasses}`}
                title={`${st.title} (${currentStatus})`}
              >
                {isResolved ? (
                  <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} ${isDormant ? 'opacity-50' : ''}`} />
                )}
                <span className={`truncate ${isResolved ? 'line-through' : ''}`}>
                  {st.title}
                </span>
                {isDormant && <span className="text-[8px] opacity-75 font-sans lowercase">(Dormant)</span>}
                {isResolved && <span className="text-[8px] opacity-75 font-sans lowercase">(Resolved)</span>}
              </button>
            );
          })}
        </div>

        {/* Attached Characters */}
        {scene.attachedCharacterIds && scene.attachedCharacterIds.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {scene.attachedCharacterIds.map((cid) => {
              const char = characterMap.get(cid);
              if (!char) return null;
              return (
                <button
                  key={`lane-char-${char.id}`}
                  type="button"
                  onClick={(e) => onOpenEntityPopover(e, 'character', char.id, scene.id)}
                  className="px-1.5 py-0.5 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white text-[9px] font-mono truncate max-w-[85px] cursor-pointer"
                >
                  {char.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Markers */}
        {scene.markers && scene.markers.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-zinc-850/60">
            {scene.markers.map((m) => {
              const conf = MARKER_COLOR_CONFIG[m.color] || MARKER_COLOR_CONFIG.rose;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMarkerModal(scene.id, m.id);
                  }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs border text-[9px] font-mono transition cursor-pointer ${conf.badgeBg} ${conf.badgeBorder} ${conf.badgeText} ${conf.badgeHoverBg}`}
                >
                  {renderMarkerIcon(m.icon, 'w-2.5 h-2.5')}
                  <span className="truncate max-w-[70px]">{m.title}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Card Footer Actions */}
        <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-zinc-850/60 overflow-hidden">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddMarker(scene.id);
            }}
            className="flex items-center gap-0.5 px-1 py-0.5 rounded-xs border border-zinc-850 hover:border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300 text-[8px] font-mono transition cursor-pointer max-w-full"
            title="Add key event milestone or alert to this scene"
          >
            <Plus className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{t('alert')}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleAttachDropdown(scene.id, 'storyline');
            }}
            className="flex items-center gap-0.5 px-1 py-0.5 rounded-xs border border-zinc-850 hover:border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300 text-[8px] font-mono transition cursor-pointer max-w-full"
            title="Attach plot thread to scene"
          >
            <Plus className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{t('dockStoriesShort')}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleAttachDropdown(scene.id, 'character');
            }}
            className="flex items-center gap-0.5 px-1 py-0.5 rounded-xs border border-zinc-850 hover:border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300 text-[8px] font-mono transition cursor-pointer max-w-full"
            title="Attach character to scene"
          >
            <Plus className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{t('dockCastShort')}</span>
          </button>
        </div>
      </div>

      {isDropdownOpen && (
        <TimelineAttachDropdown
          type={openAttachDropdown.type}
          sceneId={scene.id}
          storylines={storylines}
          characters={characters}
          onAttachStoryline={onAttachStoryline}
          onAttachCharacter={onAttachCharacter}
        />
      )}
    </div>
  );
}

export const TimelineLanesSceneCard = memo(TimelineLanesSceneCardComponent);
