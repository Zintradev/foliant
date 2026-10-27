import { memo } from 'react';
import { StorylineItem, CharacterItem } from '../../../../types/dock';
import { STORYLINE_COLOR_MAP } from './constants';
import { useTranslation } from '../../../../i18n/translations';

interface TimelineAttachDropdownProps {
  type: 'character' | 'storyline';
  sceneId: string;
  storylines: StorylineItem[];
  characters: CharacterItem[];
  onAttachStoryline: (sceneId: string, storylineId: string) => void;
  onAttachCharacter: (sceneId: string, characterId: string) => void;
}

function TimelineAttachDropdownComponent({
  type,
  sceneId,
  storylines,
  characters,
  onAttachStoryline,
  onAttachCharacter,
}: TimelineAttachDropdownProps) {
  const { t } = useTranslation();

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="attach-dropdown-menu absolute bottom-full left-2 mb-1 z-50 w-48 bg-zinc-950 border border-zinc-800 rounded-xs shadow-xl p-1 text-xs"
    >
      <div className="px-1.5 py-0.5 text-[8px] font-mono text-zinc-500 uppercase border-b border-zinc-850 mb-1">
        {type === 'storyline' ? t('attachStoryline') : t('attachCharacter')}
      </div>
      <div className="max-h-40 overflow-y-auto space-y-0.5">
        {type === 'storyline' &&
          storylines.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => onAttachStoryline(sceneId, st.id)}
              className="w-full text-left px-1.5 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900 rounded-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STORYLINE_COLOR_MAP[st.color]?.dot || 'bg-zinc-400'}`} />
              <span className="truncate">{st.title}</span>
            </button>
          ))}
        {type === 'character' &&
          characters.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => onAttachCharacter(sceneId, ch.id)}
              className="w-full text-left px-1.5 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900 rounded-xs truncate cursor-pointer"
            >
              {ch.name}
            </button>
          ))}
      </div>
    </div>
  );
}

export const TimelineAttachDropdown = memo(TimelineAttachDropdownComponent);
