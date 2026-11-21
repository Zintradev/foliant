import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Check, X, Pipette, ChevronDown, ChevronRight, ChevronLeft, GripVertical } from 'lucide-react';
import { DarkColorPicker } from '../../../common/DarkColorPicker';
import { useTranslation } from '../../../../i18n/translations';
import { TextNode } from '../../../../types/project';
import { AppColorSettings, COLOR_SWATCHES } from '../../../../types/settings';
import { StorylineItem, StorylineColor, StorylineField, WorldItem, CharacterItem } from './types';
import { STORYLINE_COLORS, COLOR_CLASSES } from './constants';
import { CollapsibleStorylineDescription } from './CollapsibleStorylineDescription';
import { StorylineModularFieldsSection } from './StorylineModularFieldsSection';
import { StorylineLinkedChaptersSection } from './StorylineLinkedChaptersSection';
import { StorylineLinkedCharactersSection } from './StorylineLinkedCharactersSection';
import { StorylineLinkedWorldSection } from './StorylineLinkedWorldSection';
import { useTouchLongPressReorder } from '../../../common/useTouchLongPressReorder';

interface StorylineCardProps {
  storyline: StorylineItem;
  colorSettings?: AppColorSettings;
  validChapters: TextNode[];
  worldItems: WorldItem[];
  characters?: CharacterItem[];
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
  onLinkCharacter?: (storylineId: string, characterId: string) => void;
  onUnlinkCharacter?: (storylineId: string, characterId: string) => void;
  onLinkWorldItem: (storylineId: string, worldItemId: string) => void;
  onUnlinkWorldItem: (storylineId: string, worldItemId: string) => void;
  index?: number;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent, storyline: StorylineItem) => void;
  onDragEnter?: (e: React.DragEvent, storyline: StorylineItem) => void;
  onDragOver?: (e: React.DragEvent, storyline: StorylineItem) => void;
  onDrop?: (e: React.DragEvent, targetStoryline: StorylineItem) => void;
  onDragEnd?: () => void;
  onTouchDragStart?: (id: string, index: number) => void;
  onTouchDragMove?: (clientY: number, clientX: number) => void;
  onTouchDragEnd?: () => void;
  onTouchDragCancel?: () => void;
  storylinesDropMode?: 'shift' | 'swap' | 'arrows';
  onMoveStoryline?: (index: number, direction: 'up' | 'down') => void;
  totalStorylines?: number;
  translateX?: number;
  rowTranslateY?: number;
  isShiftMode?: boolean;
  isDraggingAny?: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
}

export const StorylineCard = React.memo(function StorylineCard({
  storyline,
  colorSettings,
  validChapters,
  worldItems,
  characters = [],
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
  onLinkCharacter,
  onUnlinkCharacter,
  onLinkWorldItem,
  onUnlinkWorldItem,
  index,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragEnd,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
  onTouchDragCancel,
  storylinesDropMode = 'shift',
  onMoveStoryline,
  totalStorylines,
  translateX = 0,
  rowTranslateY = 0,
  isShiftMode: _isShiftMode = false,
  isDraggingAny = false,
  cardRef,
}: StorylineCardProps) {
  const { t } = useTranslation();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
    try {
      const raw = localStorage.getItem(`foliant_storyline_expanded_${storyline.id}`);
      return raw !== null ? Boolean(JSON.parse(raw)) : false;
    } catch {
      return false;
    }
  });

  const { isTouchDragging, isHolding, touchDragProps } = useTouchLongPressReorder({
    id: storyline.id,
    index: index ?? 0,
    onStart: (id, idx) => onTouchDragStart?.(id, idx),
    onMove: (clientY, clientX) => onTouchDragMove?.(clientY, clientX),
    onEnd: () => onTouchDragEnd?.(),
    onCancel: () => onTouchDragCancel?.(),
    delayMs: 500,
    moveThreshold: 10,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(`foliant_storyline_expanded_${storyline.id}`, JSON.stringify(isCardExpanded));
    } catch {
      // Non-fatal if localStorage write fails
    }
  }, [isCardExpanded, storyline.id]);

  const isCustomHex = storyline.color?.startsWith('#');
  const customKey = colorSettings?.storylines[storyline.color] ?? storyline.color;
  const dotClass = !isCustomHex
    ? (COLOR_SWATCHES[customKey]?.dotBg ?? COLOR_CLASSES[storyline.color as keyof typeof COLOR_CLASSES]?.dot ?? 'bg-emerald-500')
    : '';

  return (
    <div
      ref={cardRef}
      data-storyline-id={storyline.id}
      draggable={!isEditing && storylinesDropMode !== 'arrows'}
      onDragStart={(e) => onDragStart?.(e, storyline)}
      onDragEnter={(e) => onDragEnter?.(e, storyline)}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver?.(e, storyline);
      }}
      onDrop={(e) => onDrop?.(e, storyline)}
      onDragEnd={onDragEnd}
      {...touchDragProps}
      style={{
        transform:
          translateX || rowTranslateY
            ? `translate3d(${translateX}px, ${rowTranslateY}px, 0)`
            : undefined,
        transition:
          isDragging && storylinesDropMode === 'shift'
            ? undefined
            : isDraggingAny
            ? 'transform 220ms cubic-bezier(0.2, 0.9, 0.25, 1)'
            : undefined,
        willChange: isDraggingAny ? 'transform' : undefined,
      }}
      className={`group relative border rounded-sm transition-colors duration-150 overflow-hidden select-none ${
        isDraggingAny ? '[&_*]:pointer-events-none' : 'transition-all duration-200'
      } ${
        isHolding
          ? 'scale-[1.02] shadow-xl border-zinc-650 ring-1 ring-zinc-500/30'
          : isDragging || isTouchDragging
          ? 'opacity-30 border border-dashed border-emerald-500/70 bg-zinc-900/40 shadow-xl z-20 touch-none'
          : isDragOver
          ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-950/20 shadow-xl scale-[1.02] z-30'
          : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-zinc-700/80'
      }`}
    >
      {isDragOver && !isDragging && !isTouchDragging && storylinesDropMode === 'swap' && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/30 backdrop-blur-[1px] pointer-events-none z-20">
          <span className="text-[10px] font-mono font-medium text-emerald-300 bg-zinc-900/90 px-2 py-0.5 rounded-xs border border-emerald-500 shadow-lg pointer-events-none">
            {t('swap', 'Intercambiar')}
          </span>
        </div>
      )}
      {/* Storyline Header / Edit Mode */}
      {isEditing ? (
        <div className="space-y-2.5 p-2.5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              {t('edit')} {t('storyline')}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSaveEdit(storyline.id)}
                title={t('save')}
                disabled={!editTitle.trim()}
                className="p-1 rounded-sm bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition cursor-pointer"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={onCancelEdit}
                title={t('cancelEdit')}
                className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
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
            spellCheck={false}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
            autoFocus
          />

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500">{t('color')}:</span>
              {STORYLINE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onEditColorChange(c);
                    setShowColorPicker(false);
                  }}
                  className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                    COLOR_CLASSES[c].dot
                  } ${
                    editColor === c
                      ? 'scale-125 ring-1 ring-zinc-300 ring-offset-1 ring-offset-zinc-900'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}

              <button
                type="button"
                onClick={() => setShowColorPicker((prev) => !prev)}
                title={t('customColor', 'Color personalizado')}
                className={`w-3.5 h-3.5 rounded-full border border-zinc-600 bg-zinc-900 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition cursor-pointer ${
                  editColor?.startsWith('#')
                    ? 'scale-125 ring-1 ring-zinc-300 ring-offset-1 ring-offset-zinc-900 border-zinc-300'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={editColor?.startsWith('#') ? { backgroundColor: editColor } : undefined}
              >
                <Pipette className={`w-2 h-2 ${editColor?.startsWith('#') ? 'text-white drop-shadow' : ''}`} />
              </button>
            </div>

            {showColorPicker && (
              <div className="pt-1">
                <DarkColorPicker
                  standalone
                  color={editColor?.startsWith('#') ? editColor : '#10b981'}
                  onChange={(hex) => onEditColorChange(hex)}
                  onClose={() => setShowColorPicker(false)}
                />
              </div>
            )}
          </div>

          <textarea
            value={editDescription}
            onChange={(e) => onEditDescriptionChange(e.target.value)}
            placeholder={t('storylineGoalPlaceholder')}
            rows={2}
            spellCheck={false}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans"
          />
        </div>
      ) : (
        <div
          onClick={() => setIsCardExpanded((prev) => !prev)}
          className="p-2.5 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-zinc-850/50 transition"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {storylinesDropMode !== 'arrows' && (
              <div
                title={t('dragToReorder', 'Arrastra para reordenar')}
                className="p-0.5 text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing shrink-0 select-none"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            )}
            <button
              type="button"
              data-tour-id="storylines-expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsCardExpanded((prev) => !prev);
              }}
              className="p-0.5 text-zinc-500 hover:text-zinc-200 transition cursor-pointer shrink-0"
              title={isCardExpanded ? 'Colapsar trama' : 'Expandir trama'}
            >
              {isCardExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {storylinesDropMode === 'arrows' && onMoveStoryline && index !== undefined && (
              <div
                className="flex items-center gap-0.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMoveStoryline(index, 'up')}
                  title={t('moveLeft', 'Mover a la izquierda')}
                  className="p-0.5 hover:bg-zinc-800 rounded-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition touch-manipulation cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={totalStorylines !== undefined ? index >= totalStorylines - 1 : false}
                  onClick={() => onMoveStoryline(index, 'down')}
                  title={t('moveRight', 'Mover a la derecha')}
                  className="p-0.5 hover:bg-zinc-800 rounded-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition touch-manipulation cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`}
              style={isCustomHex ? { backgroundColor: storyline.color } : undefined}
            />
            <h3
              className="text-xs font-semibold text-zinc-100 truncate select-none"
            >
              {storyline.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onStartEdit(storyline)}
              className="p-1 rounded-sm text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
              title={t('edit')}
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDeleteStoryline(storyline.id)}
              className="p-1 rounded-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
              title={t('deleteStoryline')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Collapsed Description Preview (visible when collapsed, with height limit) */}
      {!isCardExpanded && !isEditing && storyline.description && (
        <div className="px-3 pb-2.5 -mt-0.5 pointer-events-none">
          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed font-sans max-h-8 overflow-hidden text-ellipsis">
            {storyline.description}
          </p>
        </div>
      )}

      {/* Detail sections only visible when card is expanded or being edited */}
      {(isCardExpanded || isEditing) && (
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/40 space-y-3">
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

          {/* Linked Characters Section */}
          {onLinkCharacter && onUnlinkCharacter && (
            <StorylineLinkedCharactersSection
              storylineId={storyline.id}
              linkedCharacterIds={storyline.linkedCharacterIds}
              characters={characters}
              onLinkCharacter={onLinkCharacter}
              onUnlinkCharacter={onUnlinkCharacter}
            />
          )}

          {/* Linked World References Section */}
          <StorylineLinkedWorldSection
            storylineId={storyline.id}
            linkedWorldItemIds={storyline.linkedWorldItemIds || []}
            worldItems={worldItems}
            onLinkWorldItem={onLinkWorldItem}
            onUnlinkWorldItem={onUnlinkWorldItem}
          />
        </div>
      )}
    </div>
  );
});
