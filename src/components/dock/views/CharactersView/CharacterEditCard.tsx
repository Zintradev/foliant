import { memo } from 'react';
import { Check, X, ChevronUp, User, Camera } from 'lucide-react';
import { CharacterItem, CharacterCustomField, CharacterTag } from './types';
import { CharacterTagsEditor } from './CharacterTagsEditor';
import { CharacterCustomFieldsEditor } from './CharacterCustomFieldsEditor';
import { useTranslation } from '../../../../i18n/translations';

interface CharacterEditCardProps {
  charId: string;
  charName: string;
  saveMode: 'auto' | 'manual';
  name: string;
  role: CharacterItem['role'];
  summary: string;
  avatarUrl?: string;
  tags: CharacterTag[];
  fields: CharacterCustomField[];
  onNameChange: (val: string) => void;
  onRoleChange: (val: CharacterItem['role']) => void;
  onSummaryChange: (val: string) => void;
  onAvatarChange: (val: string) => void;
  onAddTag: (label: string, color: string) => void;
  onRemoveTag: (tagId: string) => void;
  onAddField: (label: string) => void;
  onUpdateField: (fieldId: string, updates: Partial<CharacterCustomField>) => void;
  onDeleteField: (fieldId: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export const CharacterEditCard = memo(function CharacterEditCard({
  charName,
  saveMode,
  name,
  role,
  summary,
  avatarUrl,
  tags,
  fields,
  onNameChange,
  onRoleChange,
  onSummaryChange,
  onAvatarChange,
  onAddTag,
  onRemoveTag,
  onAddField,
  onUpdateField,
  onDeleteField,
  onSave,
  onCancel,
  onClose,
}: CharacterEditCardProps) {
  const { t } = useTranslation();

  return (
    <div className="border border-zinc-700 bg-zinc-900/90 rounded-sm p-3 space-y-3 shadow-lg animate-in fade-in duration-100">
      {/* Edit Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
          {t('edit')} - {charName}
        </span>
        <div className="flex items-center gap-1">
          {saveMode === 'manual' ? (
            <>
              <button
                type="button"
                onClick={onSave}
                disabled={!name.trim()}
                className="p-1 rounded-sm bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition cursor-pointer"
                title={t('save')}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                title={t('cancelEdit')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
              title={t('close')}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Avatar & Name/Role Block */}
      <div className="flex items-center gap-3">
        <label
          className="w-12 h-12 rounded-sm bg-zinc-950 border border-zinc-750 hover:border-zinc-500 overflow-hidden flex items-center justify-center text-zinc-300 font-bold text-sm shrink-0 font-mono cursor-pointer transition relative group/avatar shadow-xs"
          title="Upload character portrait"
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  onAvatarChange(result);
                };
                reader.readAsDataURL(file);
              }
              e.target.value = '';
            }}
          />
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform group-hover/avatar:scale-105"
            />
          ) : name ? (
            name.charAt(0).toUpperCase()
          ) : (
            <User className="w-5 h-5 text-zinc-400" />
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity text-white">
            <Camera className="w-4 h-4" />
          </div>
        </label>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t('characterNamePlaceholder')}
            className="bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
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
                const val = e.target.value === '__custom__' ? 'Mentor' : e.target.value;
                onRoleChange(val);
              }}
              className="bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
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
      </div>

      {/* Summary */}
      <textarea
        value={summary}
        onChange={(e) => onSummaryChange(e.target.value)}
        placeholder={t('characterSummaryPlaceholder')}
        rows={2}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans leading-relaxed transition-all duration-200 focus:min-h-[150px]"
      />

      {/* Custom Color Tags Section */}
      <CharacterTagsEditor
        tags={tags}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
      />

      {/* Modular Custom Fields Section */}
      <CharacterCustomFieldsEditor
        fields={fields}
        onAddField={onAddField}
        onUpdateField={onUpdateField}
        onDeleteField={onDeleteField}
      />
    </div>
  );
});
