import React, { memo } from 'react';
import { Plus, FileText, Check } from 'lucide-react';
import { StorylineItem, CharacterItem } from '../../../../types/dock';
import { PlotStatus } from '../../../../types/project';
import { TimelineColumnItem } from './types';
import { STORYLINE_COLOR_MAP, MARKER_COLOR_CONFIG, renderMarkerIcon } from './constants';
import { TimelineAttachDropdown } from './TimelineAttachDropdown';
import { useTranslation } from '../../../../i18n/translations';

interface TimelineSubwaySceneColumnProps {
  col: TimelineColumnItem;
  width: number;
  isManualWidth?: boolean;
  isActive: boolean;
  isDimmed: boolean;
  wordCount: number;
  attachedStorylines: { storyline: StorylineItem; status: PlotStatus }[];
  characterMap: Map<string, CharacterItem>;
  storylines: StorylineItem[];
  characters: CharacterItem[];
  openAttachDropdown: { sceneId: string; type: 'character' | 'storyline' } | null;
  onSelectScene: (id: string) => void;
  onResizeStart: (e: React.PointerEvent, id: string) => void;
  onAddMarker: (sceneId: string) => void;
  onOpenMarkerModal: (sceneId: string, markerId: string) => void;
  onOpenEntityPopover: (e: React.MouseEvent, type: 'storyline' | 'character', id: string, sceneId: string) => void;
  onToggleAttachDropdown: (sceneId: string, type: 'character' | 'storyline') => void;
  onAttachStoryline: (sceneId: string, storylineId: string) => void;
  onAttachCharacter: (sceneId: string, characterId: string) => void;
}

function TimelineSubwaySceneColumnComponent({
  col,
  width,
  isManualWidth = false,
  isActive,
  isDimmed,
  wordCount,
  attachedStorylines,
  characterMap,
  storylines,
  characters,
  openAttachDropdown,
  onSelectScene,
  onResizeStart,
  onAddMarker,
  onOpenMarkerModal,
  onOpenEntityPopover,
  onToggleAttachDropdown,
  onAttachStoryline,
  onAttachCharacter,
}: TimelineSubwaySceneColumnProps) {
  const { t } = useTranslation();
  const scene = col.scene;
  const isDropdownOpen = openAttachDropdown?.sceneId === scene.id;

  return (
    <div
      onClick={() => onSelectScene(scene.id)}
      style={{ width: isManualWidth ? `${width}px` : `var(--scene-col-width, ${width}px)` }}
      className={`p-2 flex flex-col justify-between gap-1.5 shrink-0 select-none cursor-pointer relative bg-zinc-900/60 hover:bg-zinc-850/60 h-full ${
        isDropdownOpen ? 'z-40' : 'z-0'
      } ${isDimmed ? 'opacity-35' : ''}`}
    >
      <div
        style={{ contentVisibility: 'auto', contain: 'layout style paint' }}
        className={`rounded-sm border p-2 flex flex-col justify-between h-full overflow-hidden transition-colors duration-150 ${
          isActive
            ? 'border-zinc-300 ring-1 ring-zinc-300/40 bg-zinc-850 shadow-md'
            : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
        }`}
      >
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
          <div className="flex items-center justify-between gap-1 pb-1 border-b border-zinc-800/80">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400 font-bold">
                #{col.originalIndex + 1}
              </span>
              <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider truncate">
                {scene.status || 'Not Started'}
              </span>
            </div>
            <span className="text-[9px] font-mono text-zinc-500">
              {wordCount.toLocaleString()}w
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-zinc-400 shrink-0" />
              <h4 className="text-xs font-semibold text-zinc-100 truncate" title={scene.title}>
                {scene.title || 'Untitled Scene'}
              </h4>
            </div>
            {scene.synopsis && (
              <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                {scene.synopsis}
              </p>
            )}
          </div>

          {(scene.markers || []).length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {(scene.markers || []).map((marker) => {
                const conf = MARKER_COLOR_CONFIG[marker.color] || MARKER_COLOR_CONFIG.zinc;
                return (
                  <button
                    key={marker.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMarkerModal(scene.id, marker.id);
                    }}
                    className={`flex items-center gap-1 px-1.5 py-0.2 rounded-xs border text-[9px] font-mono transition cursor-pointer select-none ${conf.badgeBg} ${conf.badgeBorder} ${conf.badgeText}`}
                    title={marker.title}
                  >
                    {renderMarkerIcon(marker.icon, 'w-2 h-2 shrink-0')}
                    <span className="truncate max-w-[80px]">{marker.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {(scene.attachedCharacterIds || []).length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5 overflow-hidden">
              {(scene.attachedCharacterIds || []).map((cid) => {
                const ch = characterMap.get(cid);
                if (!ch) return null;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={(e) => onOpenEntityPopover(e, 'character', ch.id, scene.id)}
                    className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer max-w-full truncate"
                  >
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {attachedStorylines.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5 overflow-hidden">
              {attachedStorylines.map(({ storyline: st, status: currentStatus }) => {
                const theme = STORYLINE_COLOR_MAP[st.color] || STORYLINE_COLOR_MAP.emerald;
                const isDormant = currentStatus === 'Dormant';
                const isResolved = currentStatus === 'Resolved';
                let stateClasses = `${theme.bg} ${theme.border} ${theme.text}`;
                if (isDormant) stateClasses = `${theme.bg} ${theme.border} ${theme.text} opacity-50 border-dashed`;
                else if (isResolved) stateClasses = `${theme.bg} ${theme.border} ${theme.text} opacity-60`;

                return (
                  <span
                    key={`st-${st.id}`}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs border text-[9px] font-mono truncate max-w-[170px] ${stateClasses}`}
                    title={`${st.title} (${currentStatus})`}
                  >
                    {isResolved ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} ${isDormant ? 'opacity-50' : ''}`} />
                    )}
                    <span className={`truncate ${isResolved ? 'line-through' : ''}`}>{st.title}</span>
                    {isDormant && <span className="text-[8px] opacity-75 font-sans lowercase">(Dormant)</span>}
                    {isResolved && <span className="text-[8px] opacity-75 font-sans lowercase">(Resolved)</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 items-center pt-1.5 mt-1 border-t border-zinc-850/70 relative shrink-0 overflow-hidden">
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
            <span className="truncate">Alert</span>
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
            <span className="truncate">Plot</span>
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
            <span className="truncate">Cast</span>
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

      <div
        onPointerDown={(e) => onResizeStart(e, scene.id)}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-zinc-500/40 active:bg-zinc-400/60 transition-colors z-30 group flex items-center justify-center select-none"
        title="Drag to resize scene width"
      >
        <div className="w-0.5 h-6 bg-zinc-700/60 group-hover:bg-zinc-300 rounded-full" />
      </div>
    </div>
  );
}

export const TimelineSubwaySceneColumn = memo(TimelineSubwaySceneColumnComponent);
