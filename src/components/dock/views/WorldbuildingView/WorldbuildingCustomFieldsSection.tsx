import { memo } from 'react';
import { Layers, X } from 'lucide-react';
import { WorldCustomField } from './types';
import { useTranslation } from '../../../../i18n/translations';

interface WorldbuildingCustomFieldsSectionProps {
  fields: WorldCustomField[];
  onAddField: (label?: string) => void;
  onUpdateField: (fieldId: string, updates: Partial<WorldCustomField>) => void;
  onDeleteField: (fieldId: string) => void;
}

const PRESET_FIELDS = [
  { key: 'History', label: 'History' },
  { key: 'Inhabitants', label: 'Inhabitants' },
  { key: 'Rules & Magic', label: 'Rules & Magic' },
  { key: 'Climate', label: 'Climate' },
];

function WorldbuildingCustomFieldsSectionComponent({
  fields,
  onAddField,
  onUpdateField,
  onDeleteField,
}: WorldbuildingCustomFieldsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 pt-3 border-t border-zinc-850">
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-zinc-500" />
          {t('customFields')} ({fields.length})
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {PRESET_FIELDS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onAddField(label)}
            className="px-2 py-0.5 rounded-xs text-[10px] bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          >
            + {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onAddField(t('customFields'))}
          className="px-2 py-0.5 rounded-xs text-[10px] bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white transition font-medium cursor-pointer"
        >
          + {t('addField')}
        </button>
      </div>

      {fields.length > 0 && (
        <div className="space-y-2.5 pt-1">
          {fields.map((field) => (
            <div
              key={field.id}
              className="bg-zinc-900/60 border border-zinc-800 rounded-sm p-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-1.5">
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) =>
                    onUpdateField(field.id, { label: e.target.value })
                  }
                  placeholder={t('fieldLabelPlaceholder')}
                  className="bg-zinc-950/80 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider text-zinc-200 focus:text-white border border-zinc-800 focus:border-zinc-700 rounded-xs focus:outline-none transition-colors max-w-[200px]"
                />
                <button
                  type="button"
                  onClick={() => onDeleteField(field.id)}
                  className="p-1 text-zinc-500 hover:text-rose-400 transition rounded-xs hover:bg-zinc-800 cursor-pointer"
                  title="Delete field"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={field.value}
                onChange={(e) =>
                  onUpdateField(field.id, { value: e.target.value })
                }
                placeholder={`Enter ${field.label.toLowerCase()} details...`}
                rows={2}
                className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xs px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-y font-sans leading-relaxed"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const WorldbuildingCustomFieldsSection = memo(WorldbuildingCustomFieldsSectionComponent);
