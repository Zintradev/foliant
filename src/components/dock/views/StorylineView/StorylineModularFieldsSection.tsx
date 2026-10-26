import React, { useCallback } from 'react';
import { Layers, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';
import { StorylineField } from './types';
import { PRESET_FIELDS } from './constants';

interface StorylineModularFieldsSectionProps {
  storylineId: string;
  fields: StorylineField[];
  onAddField: (storylineId: string, label: string) => void;
  onUpdateField: (
    storylineId: string,
    fieldId: string,
    updates: Partial<StorylineField>
  ) => void;
  onDeleteField: (storylineId: string, fieldId: string) => void;
  onMoveField: (
    storylineId: string,
    fieldIndex: number,
    direction: 'up' | 'down'
  ) => void;
}

export const StorylineModularFieldsSection = React.memo(
  function StorylineModularFieldsSection({
    storylineId,
    fields,
    onAddField,
    onUpdateField,
    onDeleteField,
    onMoveField,
  }: StorylineModularFieldsSectionProps) {
    const { t } = useTranslation();

    const getPresetFieldLabel = useCallback(
      (preset: typeof PRESET_FIELDS[number]): string => {
        switch (preset) {
          case 'Motivation':
            return t('fieldMotivation');
          case 'Beginning':
            return t('presetBeginning');
          case 'Turning Point':
            return t('presetTurningPoint');
          case 'Resolution':
            return t('presetResolution');
          default:
            return preset;
        }
      },
      [t]
    );

    return (
      <div className="space-y-2 pt-2 border-t border-zinc-850">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
          <span className="flex items-center gap-1 uppercase tracking-wider text-zinc-400">
            <Layers className="w-2.5 h-2.5 text-zinc-500" />
            {t('modularFields')} ({fields.length})
          </span>
        </div>

        {/* Quick-Insert Preset Buttons & Custom Field */}
        <div className="flex flex-wrap items-center gap-1">
          {PRESET_FIELDS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onAddField(storylineId, getPresetFieldLabel(preset))}
              className="px-1.5 py-0.5 rounded-xs text-[10px] bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              title={`Add ${getPresetFieldLabel(preset)} block`}
            >
              + {getPresetFieldLabel(preset)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onAddField(storylineId, t('customField'))}
            className="px-1.5 py-0.5 rounded-xs text-[10px] bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition font-medium cursor-pointer"
            title={t('addCustomModularField')}
          >
            + {t('customField')}
          </button>
        </div>

        {/* Modular Fields List */}
        {fields.length > 0 && (
          <div className="space-y-2 pt-1">
            {fields.map((field, fIdx) => (
              <div
                key={field.id}
                className="group/field bg-zinc-950/80 border border-zinc-800/90 hover:border-zinc-700 rounded-sm p-2 space-y-1.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) =>
                      onUpdateField(storylineId, field.id, {
                        label: e.target.value,
                      })
                    }
                    placeholder={t('fieldLabelPlaceholder')}
                    className="bg-transparent hover:bg-zinc-900 focus:bg-zinc-900 px-1 py-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300 focus:text-white border border-transparent focus:border-zinc-700 rounded-xs focus:outline-none transition-colors max-w-[160px]"
                  />

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={fIdx === 0}
                      onClick={() => onMoveField(storylineId, fIdx, 'up')}
                      className="p-0.5 rounded-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition"
                      title="Move up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={fIdx === fields.length - 1}
                      onClick={() => onMoveField(storylineId, fIdx, 'down')}
                      className="p-0.5 rounded-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition"
                      title="Move down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteField(storylineId, field.id)}
                      className="p-0.5 rounded-xs text-zinc-500 hover:text-red-400 transition"
                      title="Delete field"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={field.value}
                  onChange={(e) =>
                    onUpdateField(storylineId, field.id, {
                      value: e.target.value,
                    })
                  }
                  placeholder={`Enter ${field.label.toLowerCase()} details...`}
                  rows={2}
                  className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xs px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans leading-relaxed"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
