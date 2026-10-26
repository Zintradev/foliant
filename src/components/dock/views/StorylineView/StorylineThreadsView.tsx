import React from 'react';
import { GitMerge } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';
import { TextNode } from '../../../../types/project';
import { AppColorSettings } from '../../../../types/settings';
import { StorylineItem, StorylineColor, StorylineField, WorldItem } from './types';
import { StorylineCard } from './StorylineCard';

interface StorylineThreadsViewProps {
  storylines: StorylineItem[];
  colorSettings?: AppColorSettings;
  validChapters: TextNode[];
  worldItems: WorldItem[];
  isExpanded?: boolean;
  editingStorylineId: string | null;
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

export const StorylineThreadsView = React.memo(function StorylineThreadsView({
  storylines,
  colorSettings,
  validChapters,
  worldItems,
  isExpanded = false,
  editingStorylineId,
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
}: StorylineThreadsViewProps) {
  const { t } = useTranslation();

  if (storylines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500 gap-1.5">
        <GitMerge className="w-6 h-6 text-zinc-600" />
        <p className="text-xs">{t('noStorylinesYet')}</p>
        <p className="text-[10px] text-zinc-500 max-w-[200px]">
          {t('emptyStateText')}
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        isExpanded
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start'
          : 'space-y-3'
      }
    >
      {storylines.map((storyline) => (
        <StorylineCard
          key={storyline.id}
          storyline={storyline}
          colorSettings={colorSettings}
          validChapters={validChapters}
          worldItems={worldItems}
          isEditing={editingStorylineId === storyline.id}
          editTitle={editTitle}
          onEditTitleChange={onEditTitleChange}
          editDescription={editDescription}
          onEditDescriptionChange={onEditDescriptionChange}
          editColor={editColor}
          onEditColorChange={onEditColorChange}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onStartEdit={onStartEdit}
          onDeleteStoryline={onDeleteStoryline}
          onAddField={onAddField}
          onUpdateField={onUpdateField}
          onDeleteField={onDeleteField}
          onMoveField={onMoveField}
          onSelectChapter={onSelectChapter}
          onLinkChapter={onLinkChapter}
          onUnlinkChapter={onUnlinkChapter}
          onLinkWorldItem={onLinkWorldItem}
          onUnlinkWorldItem={onUnlinkWorldItem}
        />
      ))}
    </div>
  );
});
