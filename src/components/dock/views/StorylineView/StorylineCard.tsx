import React from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';
import { TextNode } from '../../../../types/project';
import { AppColorSettings, COLOR_SWATCHES } from '../../../../types/settings';
import { StorylineItem, StorylineColor, StorylineField, WorldItem } from './types';
import { STORYLINE_COLORS, COLOR_CLASSES } from './constants';
import { CollapsibleStorylineDescription } from './CollapsibleStorylineDescription';
import { StorylineModularFieldsSection } from './StorylineModularFieldsSection';
import { StorylineLinkedChaptersSection } from './StorylineLinkedChaptersSection';
import { StorylineLinkedWorldSection } from './StorylineLinkedWorldSection';

interface StorylineCardProps {
  storyline: StorylineItem;
  colorSettings?: AppColorSettings;
  validChapters: TextNode[];
  worldItems: WorldItem[];
  isEditing: boolean;
  editTitle: string;
  onEditTitleChange: (val: string) => void;
  editDescription: string;
  onEditDescriptionChange: (val: string) => void;
  editColor: StorylineColor;
  onEditColorChange: (c: StorylineColor) => void;
  onSaveEdit: (storylineId: string) => void;
  onCancelEdit: () => void;
  onStartEdit: (storyline: StorylineItem) => void;
  onDeleteStoryline: (id: string) => void;
  onAddField: (storylineId: string, label: string) => void;
  onUpdateField: (storylineId: string, fieldId: string, updates: Partial<StorylineField>) => void;
  onDeleteField: (storylineId: string, fieldId: string) => void;
  onMoveField: (storylineId: string, fieldIndex: number, direction: 'up' | 'down') => void;
  onSelectChapter?: (chapterId: string) => void;
  onLinkChapter: (storylineId: string, chapterId: string) => void;
  onUnlinkChapter: (storylineId: string, chapterId: string) => void;
  onLinkWorldItem: (storylineId: string, worldItemId: string) => void;
  onUnlinkWorldItem: (storylineId: string, worldItemId: string) => void;
}

export const StorylineCard = React.memo(function StorylineCard({
  storyline,
  colorSettings,
  validChapters,
  worldItems,
  isEditing,
  editTitle,
  onEditTitleChange,
  editDescription,
  onEditDescriptionChange,
  editColor,
  onEditColorChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDeleteStoryline,
  onAddField,
  onUpdateField,
  onDeleteField,
  onMoveField,
  onSelectChapter,
  onLinkChapter,
  onUnlinkChapter,
  onLinkWorldItem,
  onUnlinkWorldItem,
}: StorylineCardProps) {
  const { t } = useTranslation();

  const customKey = colorSettings?.storylines[storyline.color] ?? storyline.color;
  const dotClass =
    COLOR_SWATCHES[customKey]?.dotBg ??
    COLOR_CLASSES[storyline.color]?.dot ??
    'bg-emerald-500';

  return (
    <div className="group border border-zinc-800 rounded-sm bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-zinc-700/80 p-3 space-y-3 transition-colors">
      {/* Storyline Header / Edit Mode */}
      {isEditing ? (
        <div className="space-y-2.5 pb-2 border-b border-zinc-800 bg-zinc-950/60 p-2.5 rounded-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              {t('edit')} {t('storyline')}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSaveEdit(storyline.id)}
                title={t('save')}
                disabled={!editTitle.trim()}
                className="p-1 rounded-sm bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={onCancelEdit}
                title={t('cancelEdit')}
                className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          <input
            type="text"
            value={editTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            placeholder={t('storylineTitlePlaceholder')}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
            autoFocus
          />

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">{t('color')}:</span>
            {STORYLINE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onEditColorChange(c)}
                className={`w-3.5 h-3.5 rounded-full transition-transform ${
                  COLOR_CLASSES[c].dot
                } ${
                  editColor === c
                    ? 'scale-125 ring-1 ring-zinc-300 ring-offset-1 ring-offset-zinc-900'
                    : 'opacity-60 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          <textarea
            value={editDescription}
            onChange={(e) => onEditDescriptionChange(e.target.value)}
            placeholder={t('storylineGoalPlaceholder')}
            rows={2}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans"
          />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
            <h3 className="text-xs font-semibold text-zinc-100 truncate">
              {storyline.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onStartEdit(storyline)}
              className="p-1 rounded-sm text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
              title={t('edit')}
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDeleteStoryline(storyline.id)}
              className="p-1 rounded-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
              title={t('deleteStoryline')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Description View with Accordion Show More */}
      {!isEditing && storyline.description && (
        <CollapsibleStorylineDescription description={storyline.description} />
      )}

      {/* MODULAR FIELDS / BEATS SECTION */}
      <StorylineModularFieldsSection
        storylineId={storyline.id}
        fields={storyline.fields || []}
        onAddField={onAddField}
        onUpdateField={onUpdateField}
        onDeleteField={onDeleteField}
        onMoveField={onMoveField}
      />

      {/* Linked Chapters Section */}
      <StorylineLinkedChaptersSection
        storylineId={storyline.id}
        linkedChapterIds={storyline.linkedChapterIds}
        validChapters={validChapters}
        onSelectChapter={onSelectChapter}
        onLinkChapter={onLinkChapter}
        onUnlinkChapter={onUnlinkChapter}
      />

      {/* Linked World References Section */}
      <StorylineLinkedWorldSection
        storylineId={storyline.id}
        linkedWorldItemIds={storyline.linkedWorldItemIds || []}
        worldItems={worldItems}
        onLinkWorldItem={onLinkWorldItem}
        onUnlinkWorldItem={onUnlinkWorldItem}
      />
    </div>
  );
});
