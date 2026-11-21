import { memo } from 'react';
import { Pencil, Trash2, ChevronRight, ChevronDown, ChevronUp, User, GripVertical } from 'lucide-react';
import { CharacterItem, CharacterCustomField, CharacterTag } from './types';
import {
  AppColorSettings,
  COLOR_SWATCHES,
  DEFAULT_COLOR_SETTINGS,
  DropMode,
} from '../../../../types/settings';
import { CharacterTagBadge } from './CharacterTagBadge';
import { useTranslation, getRoleLabel } from '../../../../i18n/translations';
import { useTouchLongPressReorder } from '../../../common/useTouchLongPressReorder';

const CharacterRoleBadge = memo(function CharacterRoleBadge({
  role,
  colorSettings,
}: {
  role: CharacterItem['role'];
  colorSettings?: AppColorSettings;
}) {
  const { t } = useTranslation();
  const roleKey = role ?? 'Minor';
  const colorKey =
    colorSettings?.roles[roleKey] ??
    DEFAULT_COLOR_SETTINGS.roles[roleKey] ??
    'zinc';
  const swatch = COLOR_SWATCHES[colorKey] ?? COLOR_SWATCHES.zinc;

  return (
    <span
      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-xs border ${swatch.badgeBg} ${swatch.badgeBorder} ${swatch.badgeText}`}
    >
      {getRoleLabel(role, t)}
    </span>
  );
});

interface CharacterDisplayCardProps {
  char: CharacterItem;
  isCardOpen: boolean;
  isExpandedView?: boolean;
  colorSettings?: AppColorSettings;
  onToggleExpand: () => void;
  onPortraitClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  index?: number;
  totalCharacters?: number;
  charactersDropMode?: DropMode;
  onMoveCharacter?: (index: number, direction: 'up' | 'down') => void;
  onDragStart?: (e: React.DragEvent, char: CharacterItem) => void;
  onDragEnter?: (e: React.DragEvent, char: CharacterItem) => void;
  onDragOver?: (e: React.DragEvent, char: CharacterItem) => void;
  onDrop?: (e: React.DragEvent, targetChar: CharacterItem) => void;
  onDragEnd?: () => void;
  onTouchDragStart?: (id: string, index: number) => void;
  onTouchDragMove?: (clientY: number, clientX: number) => void;
  onTouchDragEnd?: () => void;
  onTouchDragCancel?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  isDraggingAny?: boolean;
  translateX?: number;
  rowTranslateY?: number;
  isShiftMode?: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
}

export const CharacterDisplayCard = memo(function CharacterDisplayCard({
  char,
  isCardOpen,
  isExpandedView = false,
  colorSettings,
  onToggleExpand,
  onPortraitClick,
  onEdit,
  onDelete,
  index,
  totalCharacters,
  charactersDropMode = 'shift',
  onMoveCharacter,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragEnd,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
  onTouchDragCancel,
  isDragging = false,
  isDragOver = false,
  isDraggingAny = false,
  translateX = 0,
  rowTranslateY = 0,
  isShiftMode: _isShiftMode = false,
  cardRef,
}: CharacterDisplayCardProps) {
  const { t } = useTranslation();
  const tags = char.tags || [];
  const fields = char.fields || [];
  const isCustomHex = char.nameColor?.startsWith('#');
  const nameSwatch = !isCustomHex && char.nameColor ? COLOR_SWATCHES[char.nameColor] : undefined;

  const { isTouchDragging, isHolding, touchDragProps } = useTouchLongPressReorder({
    id: char.id,
    index: index ?? 0,
    onStart: (id, idx) => onTouchDragStart?.(id, idx),
    onMove: (clientY, clientX) => onTouchDragMove?.(clientY, clientX),
    onEnd: () => onTouchDragEnd?.(),
    onCancel: () => onTouchDragCancel?.(),
    delayMs: 500,
    moveThreshold: 10,
  });

  return (
    <div
      ref={cardRef}
      data-character-id={char.id}
      draggable={charactersDropMode !== 'arrows'}
      onDragStart={(e) => onDragStart?.(e, char)}
      onDragEnter={(e) => onDragEnter?.(e, char)}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver?.(e, char);
      }}
      onDrop={(e) => onDrop?.(e, char)}
      onDragEnd={onDragEnd}
      {...touchDragProps}
      style={{
        transform:
          translateX || rowTranslateY
            ? `translate3d(${translateX}px, ${rowTranslateY}px, 0)`
            : undefined,
        transition:
          isDragging && charactersDropMode === 'shift'
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
          : 'border-zinc-855 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700'
      }`}
    >
      {isDragOver && !isDragging && !isTouchDragging && charactersDropMode === 'swap' && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/30 backdrop-blur-[1px] pointer-events-none z-20">
          <span className="text-[10px] font-mono font-medium text-emerald-300 bg-zinc-900/90 px-2 py-0.5 rounded-xs border border-emerald-500 shadow-lg pointer-events-none">
            {t('swap', 'Intercambiar')}
          </span>
        </div>
      )}
      {/* Collapsed Header Bar (Always visible) */}
      <div
        onClick={onToggleExpand}
        className="p-2.5 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-zinc-850/50 transition"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {charactersDropMode !== 'arrows' && (
            <div
              title={t('dragToReorder', 'Arrastra para reordenar')}
              className="p-0.5 text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing shrink-0 select-none"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}

          {charactersDropMode === 'arrows' && onMoveCharacter && index !== undefined && (
            <div
              className="flex items-center gap-0.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onMoveCharacter(index, 'up')}
                title={t('moveUp', 'Mover arriba')}
                className="p-0.5 hover:bg-zinc-800 rounded-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition touch-manipulation cursor-pointer"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                disabled={totalCharacters !== undefined ? index >= totalCharacters - 1 : false}
                onClick={() => onMoveCharacter(index, 'down')}
                title={t('moveDown', 'Mover abajo')}
                className="p-0.5 hover:bg-zinc-800 rounded-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition touch-manipulation cursor-pointer"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Avatar / Profile Image with Lightbox click */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (char.avatarUrl) {
                onPortraitClick();
              }
            }}
            className={`w-7 h-7 rounded-xs bg-zinc-850 border border-zinc-750 overflow-hidden flex items-center justify-center text-zinc-300 font-bold text-[10px] shrink-0 font-mono transition relative shadow-xs select-none ${
              char.avatarUrl ? 'cursor-pointer hover:border-zinc-400 hover:ring-1 hover:ring-zinc-400/40' : ''
            }`}
            title={char.avatarUrl ? 'Click to view portrait' : char.name}
          >
            {char.avatarUrl ? (
              <img
                src={char.avatarUrl}
                alt={char.name}
                className="w-full h-full object-cover transition-transform hover:scale-105"
              />
            ) : char.name ? (
              char.name.charAt(0).toUpperCase()
            ) : (
              <User className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </div>

          <div className="min-w-0">
            {nameSwatch ? (
              <span
                className={`inline-block max-w-full text-xs font-semibold truncate align-middle px-1.5 py-0.5 rounded-xs border ${nameSwatch.badgeBg} ${nameSwatch.badgeBorder} ${nameSwatch.badgeText}`}
              >
                {char.name}
              </span>
            ) : isCustomHex && char.nameColor ? (
              <span
                className="inline-block max-w-full text-xs font-semibold truncate align-middle px-1.5 py-0.5 rounded-xs border"
                style={{
                  backgroundColor: `${char.nameColor}20`,
                  borderColor: `${char.nameColor}60`,
                  color: char.nameColor,
                }}
              >
                {char.name}
              </span>
            ) : (
              <span className="text-xs font-semibold text-zinc-100 truncate block">
                {char.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {(isExpandedView || isCardOpen) && (
            <CharacterRoleBadge role={char.role} colorSettings={colorSettings} />
          )}

          <button
            type="button"
            onClick={onEdit}
            title={t('editCharacterProfile')}
            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-xs transition cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            title={t('deleteCharacter')}
            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-xs transition cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            title={isCardOpen ? 'Collapse card' : 'Expand card'}
            aria-label={isCardOpen ? 'Collapse card' : 'Expand card'}
            className="text-zinc-500 ml-0.5 hover:text-zinc-300 transition p-0.5 cursor-pointer"
          >
            {isCardOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsed Description Preview (visible when collapsed, with height limit) */}
      {!isCardOpen && char.summary && (
        <div className="px-3 pb-2.5 -mt-0.5 pointer-events-none">
          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed font-sans max-h-8 overflow-hidden text-ellipsis">
            {char.summary}
          </p>
        </div>
      )}

      {/* Expanded Details Body */}
      {isCardOpen && (
        <div className="px-3 pb-3 pt-1 border-t border-zinc-850 bg-zinc-950/40 text-xs space-y-2">
          {char.summary && (
            <p className="text-zinc-300 italic text-[11px] leading-relaxed">
              {char.summary}
            </p>
          )}

          {char.notes && (
            <p className="text-zinc-400 text-[11px] whitespace-pre-wrap leading-relaxed">
              {char.notes}
            </p>
          )}

          {/* Tags preview */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {tags.map((tag: CharacterTag) => (
                <CharacterTagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}

          {/* Custom Fields list */}
          {fields.length > 0 && (
            <div className="pt-2 border-t border-zinc-850/80 space-y-1">
              {fields.map((f: CharacterCustomField) => (
                <div key={f.id} className="flex items-baseline justify-between gap-2 text-[10px] font-mono">
                  <span className="text-zinc-500">{f.label}:</span>
                  <span className="text-zinc-300 truncate max-w-[60%]">{f.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
