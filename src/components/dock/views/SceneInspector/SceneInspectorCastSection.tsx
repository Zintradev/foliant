import React, { memo } from 'react';
import { Users, User, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { CharacterItem } from '../../../../types/dock';
import { useTranslation, getRoleLabel } from '../../../../i18n/translations';

interface SceneInspectorCastSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  povCharacterId?: string;
  characters: CharacterItem[];
  sortedCharacters: CharacterItem[];
  attachedCharacterIds: string[];
  onPovChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onToggleCharacter: (charId: string) => void;
}

function SceneInspectorCastSection({
  isOpen,
  onToggle,
  povCharacterId,
  characters,
  sortedCharacters,
  attachedCharacterIds,
  onPovChange,
  onToggleCharacter,
}: SceneInspectorCastSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="p-3">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left group cursor-pointer"
      >
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5 group-hover:text-zinc-200 transition">
          <Users className="w-3 h-3 text-zinc-400" />
          {t('castInScene')} ({attachedCharacterIds.length})
        </span>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {/* POV Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-1">
              <User className="w-2.5 h-2.5 text-zinc-400" />
              {t('povCharacter')}
            </label>
            <select
              value={povCharacterId || ''}
              onChange={onPovChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 cursor-pointer font-sans"
            >
              <option value="">{t('noneSelect')}</option>
              {characters.map((char, idx) => (
                <option key={`pov-opt-${char.id || idx}`} value={char.id}>
                  {char.name} ({getRoleLabel(char.role, t)})
                </option>
              ))}
            </select>
          </div>

          {/* Attached Cast List with Collapsible Summary */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-zinc-400 font-mono uppercase tracking-wider block">
              {t('charactersInScene')}
            </span>
            {characters.length === 0 ? (
              <p className="text-[11px] text-zinc-600 italic">{t('noCharactersYet')}</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto p-1 bg-zinc-900/30 border border-zinc-850 rounded-sm">
                {sortedCharacters.map((char, idx) => {
                  const isAttached = attachedCharacterIds.includes(char.id);
                  const isPov = povCharacterId === char.id;

                  return (
                    <div
                      key={`cast-item-${char.id || idx}`}
                      className={`rounded-sm border p-2 text-xs transition ${
                        isAttached
                          ? 'bg-zinc-900 border-zinc-750 text-zinc-200'
                          : 'bg-zinc-950/60 border-zinc-850 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleCharacter(char.id)}
                          className="flex items-center gap-1.5 cursor-pointer min-w-0 text-left flex-1"
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                              isAttached
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-zinc-900 border-zinc-750 text-transparent'
                            }`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="font-medium truncate">{char.name}</span>
                          {char.role && (
                            <span className="text-[10px] font-mono text-zinc-500 truncate">
                              · {getRoleLabel(char.role, t)}
                            </span>
                          )}
                        </button>

                        {isPov && (
                          <span className="text-[9px] font-mono px-1 rounded-xs bg-blue-800 text-blue-100 font-bold shrink-0">
                            POV
                          </span>
                        )}
                      </div>

                      {/* Collapsible Character Summary */}
                      {char.summary && (
                        <details className="mt-1.5 group/summary">
                          <summary className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 cursor-pointer list-none flex items-center gap-1 select-none">
                            <ChevronRight className="w-2.5 h-2.5 transition-transform group-open/summary:rotate-90" />
                            <span>{t('viewBioSummary')}</span>
                          </summary>
                          <div className="mt-1 pl-3.5 text-[11px] text-zinc-400 font-sans leading-relaxed border-l border-zinc-800">
                            {char.summary}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(SceneInspectorCastSection);
