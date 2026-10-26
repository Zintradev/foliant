import { memo } from 'react';
import { X, Trash2 } from 'lucide-react';
import { CharacterItem } from '../../../../types/dock';
import { useTranslation, getRoleLabel } from '../../../../i18n/translations';

interface CharacterRepresentationDrawerProps {
  editingCharacter: CharacterItem;
  characters: CharacterItem[];
  onClose: () => void;
  onReassign: (oldId: string, newId: string) => void;
  onDeleteCharacter: (id: string) => void;
}

function CharacterRepresentationDrawerComponent({
  editingCharacter,
  characters,
  onClose,
  onReassign,
  onDeleteCharacter,
}: CharacterRepresentationDrawerProps) {
  const { t } = useTranslation();

  return (
    <div
      className="absolute top-0 right-0 h-full w-80 bg-zinc-950 border-l border-zinc-800 shadow-2xl p-3 z-50 overflow-y-auto select-none"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 border-b border-zinc-850 mb-3">
        <span className="font-semibold text-zinc-100 text-xs font-mono">
          Graph Node Representation
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-200 transition p-0.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3.5">
        {/* Linked Character Dropdown Selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-zinc-400 uppercase">
            Linked Character (From Project Cast)
          </label>
          <select
            value={editingCharacter.id}
            onChange={(e) => onReassign(editingCharacter.id, e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({getRoleLabel(c.role, t)})
              </option>
            ))}
          </select>
        </div>

        {/* Read-Only Cast Information Card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xs p-2.5 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
            <span className="font-semibold text-zinc-100">{editingCharacter.name}</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400 uppercase">
              {getRoleLabel(editingCharacter.role, t)}
            </span>
          </div>

          {editingCharacter.tags && editingCharacter.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {editingCharacter.tags.map((tg) => (
                <span
                  key={tg.id}
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400"
                >
                  {tg.label}
                </span>
              ))}
            </div>
          )}

          <div className="text-[11px] text-zinc-400 leading-relaxed">
            {editingCharacter.summary || t('noSummaryCharacter')}
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-850 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDeleteCharacter(editingCharacter.id)}
            className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-xs hover:bg-zinc-900 transition cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>{t('delete')}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xs text-[10px] font-mono transition cursor-pointer"
          >
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  );
}

export const CharacterRepresentationDrawer = memo(CharacterRepresentationDrawerComponent);
