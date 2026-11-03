import React from 'react';
import { Users, Link2, X, ChevronDown } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';
import { CharacterItem } from '../../../../types/dock';

interface StorylineLinkedCharactersSectionProps {
  storylineId: string;
  linkedCharacterIds?: string[];
  characters: CharacterItem[];
  onLinkCharacter: (storylineId: string, characterId: string) => void;
  onUnlinkCharacter: (storylineId: string, characterId: string) => void;
}

export const StorylineLinkedCharactersSection = React.memo(
  function StorylineLinkedCharactersSection({
    storylineId,
    linkedCharacterIds = [],
    characters = [],
    onLinkCharacter,
    onUnlinkCharacter,
  }: StorylineLinkedCharactersSectionProps) {
    const { t } = useTranslation();
    const unlinkedCharacters = characters.filter(
      (char) => !linkedCharacterIds.includes(char.id)
    );

    return (
      <div className="pt-2 border-t border-zinc-850 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1 uppercase tracking-wider">
            <Users className="w-2.5 h-2.5 text-zinc-500" />
            {t('linkedCharacters', 'Personajes Vinculados')} ({linkedCharacterIds.length})
          </span>
        </div>

        {/* Linked Character Badges */}
        {linkedCharacterIds.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {linkedCharacterIds.map((charId) => {
              const char = characters.find((c) => c.id === charId);
              return (
                <span
                  key={charId}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] border border-zinc-750 bg-zinc-855 text-zinc-300"
                  title={char?.name ?? charId}
                >
                  <span className="truncate max-w-[130px]">
                    {char?.name || charId}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUnlinkCharacter(storylineId, charId)}
                    className="hover:text-red-400 text-zinc-500 ml-0.5 transition cursor-pointer"
                    title={t('unlinkCharacter', 'Unlink character')}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-[10px] text-zinc-500 italic">
            {t('noCharactersLinkedYet', 'Sin personajes vinculados aún.')}
          </p>
        )}

        {/* Dropdown Selector to Link Characters */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <Link2 className="w-3 h-3 text-zinc-500 shrink-0" />
          {unlinkedCharacters.length > 0 ? (
            <div className="relative flex-1">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onLinkCharacter(storylineId, e.target.value);
                  }
                }}
                className="w-full appearance-none bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-sm px-2 py-1 pr-6 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer transition"
              >
                <option value="" disabled>
                  {t('linkToCharacter', '+ Vincular personaje...')}
                </option>
                {unlinkedCharacters.map((char) => (
                  <option
                    key={char.id}
                    value={char.id}
                    className="bg-zinc-950 text-zinc-200"
                  >
                    {char.name || 'Untitled Character'}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-2.5 h-2.5 text-zinc-500 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          ) : (
            <span className="text-[10px] text-zinc-600 italic">
              {characters.length === 0
                ? t('noCharactersYet', 'No hay personajes creados')
                : t('allCharactersLinked', 'Todos los personajes vinculados')}
            </span>
          )}
        </div>
      </div>
    );
  }
);

