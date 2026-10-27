import { useState, memo } from 'react';
import { WorldItem, WorldCustomField } from './types';
import { DEFAULT_CATEGORIES } from './constants';
import { WorldbuildingCustomFieldsSection } from './WorldbuildingCustomFieldsSection';
import { WorldbuildingImageUploader } from './WorldbuildingImageUploader';
import { useTranslation } from '../../../../i18n/translations';

interface WorldbuildingDetailEditorProps {
  item: WorldItem;
  saveMode: 'auto' | 'manual';
  draftTitle: string;
  draftCategory: string;
  draftSummary: string;
  draftDescription: string;
  onDraftTitleChange: (val: string) => void;
  onDraftCategoryChange: (val: string) => void;
  onDraftSummaryChange: (val: string) => void;
  onDraftDescriptionChange: (val: string) => void;
  onUpdateActive: (updates: Partial<WorldItem>) => void;
}

function WorldbuildingDetailEditorComponent({
  item,
  saveMode,
  draftTitle,
  draftCategory,
  draftSummary,
  draftDescription,
  onDraftTitleChange,
  onDraftCategoryChange,
  onDraftSummaryChange,
  onDraftDescriptionChange,
  onUpdateActive,
}: WorldbuildingDetailEditorProps) {
  const { t } = useTranslation();
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const currentCategory = saveMode === 'manual' ? draftCategory : item.category;
  const currentTitle = saveMode === 'manual' ? draftTitle : item.title;
  const currentSummary = saveMode === 'manual' ? draftSummary : item.summary;
  const currentDescription = saveMode === 'manual' ? draftDescription : item.description;

  const handleAddField = (presetLabel?: string) => {
    const newField: WorldCustomField = {
      id: `world-field-${Date.now()}`,
      label: presetLabel || 'Custom Field',
      value: '',
    };
    onUpdateActive({ fields: [...(item.fields || []), newField] });
  };

  const handleUpdateField = (fieldId: string, updates: Partial<WorldCustomField>) => {
    const updated = (item.fields || []).map((f) =>
      f.id === fieldId ? { ...f, ...updates } : f
    );
    onUpdateActive({ fields: updated });
  };

  const handleDeleteField = (fieldId: string) => {
    const updated = (item.fields || []).filter((f) => f.id !== fieldId);
    onUpdateActive({ fields: updated });
  };

  return (
    <div className="flex-1 p-6 space-y-5 max-w-3xl">
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          {t('name')}
        </label>
        <input
          type="text"
          value={currentTitle}
          onChange={(e) => {
            if (saveMode === 'manual') onDraftTitleChange(e.target.value);
            else onUpdateActive({ title: e.target.value });
          }}
          placeholder={t('itemNamePlaceholder')}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-sm px-3 py-2 text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          {t('categorySelect')}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={DEFAULT_CATEGORIES.includes(currentCategory) ? currentCategory : '__custom__'}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setIsCustomCategory(true);
              } else {
                setIsCustomCategory(false);
                if (saveMode === 'manual') onDraftCategoryChange(e.target.value);
                else onUpdateActive({ category: e.target.value });
              }
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-sm px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
          >
            <option value="Location">{t('catLocation')}</option>
            <option value="Faction">{t('catFaction')}</option>
            <option value="Lore">{t('catLore')}</option>
            <option value="Artifact">{t('catArtifact')}</option>
            {!DEFAULT_CATEGORIES.includes(currentCategory) && (
              <option value="__custom__">
                {currentCategory} ({t('customBadge')})
              </option>
            )}
            <option value="__custom__">+ {t('addCustomCategory')}...</option>
          </select>

          {(isCustomCategory || !DEFAULT_CATEGORIES.includes(currentCategory)) && (
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                value={currentCategory}
                onChange={(e) => {
                  if (saveMode === 'manual') onDraftCategoryChange(e.target.value);
                  else onUpdateActive({ category: e.target.value });
                }}
                placeholder={t('customCategoryPlaceholder')}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-sm px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          {t('summary')}
        </label>
        <textarea
          value={currentSummary}
          onChange={(e) => {
            if (saveMode === 'manual') onDraftSummaryChange(e.target.value);
            else onUpdateActive({ summary: e.target.value });
          }}
          rows={2}
          placeholder={t('itemSummaryPlaceholder')}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-sm p-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition leading-relaxed resize-y"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          {t('description')}
        </label>
        <textarea
          value={currentDescription}
          onChange={(e) => {
            if (saveMode === 'manual') onDraftDescriptionChange(e.target.value);
            else onUpdateActive({ description: e.target.value });
          }}
          rows={10}
          placeholder={t('itemDescriptionPlaceholder')}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-sm p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition leading-relaxed resize-y font-sans min-h-[180px]"
        />
      </div>

      <WorldbuildingCustomFieldsSection
        fields={item.fields || []}
        onAddField={handleAddField}
        onUpdateField={handleUpdateField}
        onDeleteField={handleDeleteField}
      />

      <WorldbuildingImageUploader
        imageUrl={item.imageUrl}
        avatarUrl={item.avatarUrl}
        title={item.title}
        onUpdateImage={(base64) =>
          onUpdateActive({ imageUrl: base64, avatarUrl: base64, imagePath: undefined })
        }
      />
    </div>
  );
}

export const WorldbuildingDetailEditor = memo(WorldbuildingDetailEditorComponent);
