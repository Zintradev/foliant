import { memo } from 'react';
import { CharacterItem } from './types';
import { useTranslation } from '../../../../i18n/translations';

interface CharacterAddDrawerProps {
  name: string;
  role: CharacterItem['role'];
  summary: string;
  onNameChange: (val: string) => void;
  onRoleChange: (val: CharacterItem['role']) => void;
  onSummaryChange: (val: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export const CharacterAddDrawer = memo(function CharacterAddDrawer({
  name,
  role,
  summary,
  onNameChange,
  onRoleChange,
  onSummaryChange,
  onCancel,
  onSubmit,
}: CharacterAddDrawerProps) {
  const { t } = useTranslation();

  return (
    <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/90 space-y-2.5 animate-in fade-in duration-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          placeholder={t('characterNamePlaceholder')}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          autoFocus
        />
        <div className="flex items-center gap-1.5">
          <select
            value={
              ['Protagonist', 'Antagonist', 'Supporting', 'Minor'].includes(role)
                ? role
                : '__custom__'
            }
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                onRoleChange('Mentor');
              } else {
                onRoleChange(e.target.value);
              }
            }}
            className="bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
          >
            <option value="Protagonist">{t('roleProtagonist')}</option>
            <option value="Antagonist">{t('roleAntagonist')}</option>
            <option value="Supporting">{t('roleSupporting')}</option>
            <option value="Minor">{t('roleMinor')}</option>
            <option value="__custom__">{t('roleCustom')}</option>
          </select>
          {!['Protagonist', 'Antagonist', 'Supporting', 'Minor'].includes(role) && (
            <input
              type="text"
              value={role}
              onChange={(e) => onRoleChange(e.target.value)}
              placeholder={t('customRolePlaceholder')}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
            />
          )}
        </div>
      </div>
      <textarea
        placeholder={t('characterNotesPlaceholder')}
        value={summary}
        onChange={(e) => onSummaryChange(e.target.value)}
        rows={2}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans leading-relaxed transition-all duration-200 focus:min-h-[150px]"
      />
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-2.5 py-1 rounded-sm text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
        >
          {t('cancel')}
        </button>
        <button
          onClick={onSubmit}
          disabled={!name.trim()}
          className="px-3 py-1 rounded-sm text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition cursor-pointer"
        >
          {t('addCharacter')}
        </button>
      </div>
    </div>
  );
});
