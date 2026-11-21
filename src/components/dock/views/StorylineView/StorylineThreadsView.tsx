import React from 'react';
import { GitMerge } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';
import { TextNode } from '../../../../types/project';
import { AppColorSettings } from '../../../../types/settings';
import { StorylineItem, StorylineColor, StorylineField, WorldItem, CharacterItem } from './types';
import { StorylineCard } from './StorylineCard';
import { useStorylinesDragDrop } from './useStorylinesDragDrop';

interface StorylineThreadsViewProps {
  storylines: StorylineItem[];
  allStorylines?: StorylineItem[];
  onChange?: (storylines: StorylineItem[]) => void;
  colorSettings?: AppColorSettings;
  validChapters: TextNode[];
  worldItems: WorldItem[];
  characters?: CharacterItem[];
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
  onReorderStorylines?: (sourceIndex: number, targetIndex: number) => void;
  onMoveStoryline?: (index: number, direction: 'up' | 'down') => void;
  storylinesDropMode?: 'shift' | 'swap' | 'arrows';
  onSelectChapter?: (chapterId: string) => void;
  onLinkChapter: (storylineId: string, chapterId: string) => void;
  onUnlinkChapter: (storylineId: string, chapterId: string) => void;
  onLinkCharacter?: (storylineId: string, characterId: string) => void;
  onUnlinkCharacter?: (storylineId: string, characterId: string) => void;
  onLinkWorldItem: (storylineId: string, worldItemId: string) => void;
  onUnlinkWorldItem: (storylineId: string, worldItemId: string) => void;
}

export const StorylineThreadsView = React.memo(function StorylineThreadsView({
  storylines,
  allStorylines,
  onChange,
  colorSettings,
  validChapters,
  worldItems,
  characters = [],
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
  onReorderStorylines,
  onMoveStoryline,
  storylinesDropMode = 'shift',
  onSelectChapter,
  onLinkChapter,
  onUnlinkChapter,
  onLinkCharacter,
  onUnlinkCharacter,
  onLinkWorldItem,
  onUnlinkWorldItem,
}: StorylineThreadsViewProps) {
  const { t } = useTranslation();

  const effectiveAllStorylines = allStorylines || storylines;

  const {
    containerRef,
    draggedStorylineId,
    dragOverStorylineId,
    registerCard,
    getCardOffset,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleContainerDragEnter,
    handleContainerDragOver,
    handleDrop,
    handleContainerDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  } = useStorylinesDragDrop({
    storylines: effectiveAllStorylines,
    filteredStorylines: storylines,
    storylinesDropMode,
    onChange: (next) => {
      if (onChange) {
        onChange(next);
      } else if (onReorderStorylines && draggedStorylineId) {
        const src = effectiveAllStorylines.findIndex((s) => s.id === draggedStorylineId);
        const tgt = next.findIndex((s) => s.id === draggedStorylineId);
        if (src !== -1 && tgt !== -1) {
          onReorderStorylines(src, tgt);
        }
      }
    },
    isExpanded,
  });

  const isDraggingAny = draggedStorylineId !== null;

  if (storylines.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500 gap-1.5">
          <GitMerge className="w-6 h-6 text-zinc-600" />
          <p className="text-xs">{t('noStorylinesYet')}</p>
          <p className="text-[10px] text-zinc-500 max-w-[200px]">
            {t('emptyStateText')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onDragEnter={handleContainerDragEnter}
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
      className={`flex-1 overflow-y-auto p-2 ${isDraggingAny ? 'touch-none' : ''}`}
    >
      <div
        className={
          isExpanded
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start'
            : 'space-y-2'
        }
      >
        {storylines.map((storyline, idx) => {
          const offset = getCardOffset(idx);
          return (
            <StorylineCard
              key={storyline.id}
              index={idx}
              cardRef={(el) => registerCard(storyline.id, el)}
              translateX={offset.x}
              rowTranslateY={offset.y}
              isShiftMode={storylinesDropMode === 'shift'}
              isDraggingAny={isDraggingAny}
              isDragging={draggedStorylineId === storyline.id}
              isDragOver={dragOverStorylineId === storyline.id && draggedStorylineId !== storyline.id}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragOver={(e) => handleDragOver(e, storyline, idx)}
              onDrop={(e) => handleDrop(e, storyline, idx)}
              onDragEnd={handleDragEnd}
              onTouchDragStart={handleTouchStart}
              onTouchDragMove={handleTouchMove}
              onTouchDragEnd={handleTouchEnd}
              onTouchDragCancel={handleTouchCancel}
              storylinesDropMode={storylinesDropMode}
              onMoveStoryline={onMoveStoryline}
              totalStorylines={storylines.length}
              storyline={storyline}
              colorSettings={colorSettings}
              validChapters={validChapters}
              worldItems={worldItems}
              characters={characters}
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
              onLinkCharacter={onLinkCharacter}
              onUnlinkCharacter={onUnlinkCharacter}
              onLinkWorldItem={onLinkWorldItem}
              onUnlinkWorldItem={onUnlinkWorldItem}
            />
          );
        })}
      </div>
    </div>
  );
});
