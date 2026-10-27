import { memo } from 'react';
import { X, Users } from 'lucide-react';
import { StorylineItem, CharacterItem } from '../../../../types/dock';
import { ActivePopover } from './types';
import { STORYLINE_COLOR_MAP } from './constants';
import { useTranslation, getRoleLabel } from '../../../../i18n/translations';

interface TimelineEntityPopoverProps {
  activePopover: ActivePopover;
  popoverStoryline: StorylineItem | null | undefined;
  popoverCharacter: CharacterItem | null | undefined;
  popoverRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onDetachStoryline: (sceneId: string, storylineId: string) => void;
  onDetachCharacter: (sceneId: string, characterId: string) => void;
}

function TimelineEntityPopoverComponent({
  activePopover,
  popoverStoryline,
  popoverCharacter,
  popoverRef,
  onClose,
  onDetachStoryline,
  onDetachCharacter,
}: TimelineEntityPopoverProps) {
  const { t } = useTranslation();

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        left: `${activePopover.x}px`,
        top: `${activePopover.y}px`,
      }}
      className="z-50 w-72 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl p-3 text-xs text-zinc-300 font-sans animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {activePopover.type === 'storyline' && popoverStoryline && (() => {
        const theme =
          STORYLINE_COLOR_MAP[popoverStoryline.color] || STORYLINE_COLOR_MAP.emerald;
        return (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2 border-b border-zinc-850 pb-1.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${theme.dot} shrink-0`} />
                  <span className="font-semibold text-zinc-100 truncate">
                    {popoverStoryline.title}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mt-0.5">
                  Storyline Arc
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/50 p-2 rounded-xs border border-zinc-850/80">
              {popoverStoryline.description || 'No description provided.'}
            </div>

            <div className="pt-1.5 border-t border-zinc-850 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onDetachStoryline(activePopover.sceneId, popoverStoryline.id)
                }
                className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-xs hover:bg-zinc-900 transition cursor-pointer"
              >
                Detach from Scene
              </button>
            </div>
          </div>
        );
      })()}

      {activePopover.type === 'character' && popoverCharacter && (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2 border-b border-zinc-850 pb-1.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="font-semibold text-zinc-100 truncate">
                  {popoverCharacter.name}
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mt-0.5">
                {getRoleLabel(popoverCharacter.role, t)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/50 p-2 rounded-xs border border-zinc-850/80">
            {popoverCharacter.summary || 'No character notes recorded.'}
          </div>

          <div className="pt-1.5 border-t border-zinc-850 flex justify-end">
            <button
              type="button"
              onClick={() =>
                onDetachCharacter(activePopover.sceneId, popoverCharacter.id)
              }
              className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-xs hover:bg-zinc-900 transition cursor-pointer"
            >
              Detach from Scene
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const TimelineEntityPopover = memo(TimelineEntityPopoverComponent);
