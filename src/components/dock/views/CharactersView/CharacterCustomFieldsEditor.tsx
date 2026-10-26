import { memo } from 'react';
import { Layers, X } from 'lucide-react';
import { CharacterCustomField } from './types';
import { useTranslation } from '../../../../i18n/translations';

interface CharacterCustomFieldsEditorProps {
  fields: CharacterCustomField[];
  onAddField: (label: string) => void;
  onUpdateField: (fieldId: string, updates: Partial<CharacterCustomField>) => void;
  onDeleteField: (fieldId: string) => void;
}

export const CharacterCustomFieldsEditor = memo(function CharacterCustomFieldsEditor({
  fields,
  onAddField,
  onUpdateField,
  onDeleteField,
}: CharacterCustomFieldsEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 pt-2 border-t border-zinc-800/80">
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
        <span className="flex items-center gap-1">
          <Layers className="w-2.5 h-2.5 text-zinc-500" />
          {t('customFields')} ({fields.length})
        </span>
      </div>

      {/* Quick Insert Preset Buttons */}
      <div className="flex flex-wrap gap-1">
        {[
          { key: 'Motivation', label: t('fieldMotivation') },
          { key: 'Backstory', label: t('fieldBackstory') },
          { key: 'Internal Conflict', label: t('fieldInternalConflict') },
          { key: 'Appearance', label: t('fieldAppearance') },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onAddField(label)}
            className="px-1.5 py-0.5 rounded-xs text-[10px] bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          >
            + {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onAddField(t('customFields'))}
          className="px-1.5 py-0.5 rounded-xs text-[10px] bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition font-medium cursor-pointer"
        >
          + {t('addField')}
        </button>
      </div>

      {/* Fields Form List */}
      {fields.length > 0 && (
        <div className="space-y-2 pt-1">
          {fields.map((field) => (
            <div
              key={field.id}
              className="bg-zinc-950/80 border border-zinc-800/90 rounded-sm p-2 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-1.5">
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) =>
                    onUpdateField(field.id, {
                      label: e.target.value,
                    })
                  }
                  placeholder={t('fieldLabelPlaceholder')}
                  className="bg-transparent hover:bg-zinc-900 focus:bg-zinc-900 px-1 py-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300 focus:text-white border border-transparent focus:border-zinc-700 rounded-xs focus:outline-none transition-colors max-w-[150px]"
                />
                <button
                  type="button"
                  onClick={() => onDeleteField(field.id)}
                  className="p-0.5 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                  title="Delete field"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <textarea
                value={field.value}
                onChange={(e) =>
                  onUpdateField(field.id, {
                    value: e.target.value,
                  })
                }
                placeholder={`Enter ${field.label.toLowerCase()} details...`}
                rows={2}
                className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xs px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans leading-relaxed transition-all duration-200 focus:min-h-[150px]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
