import React, { memo } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import { WorldItem } from './types';
import { getCategoryConfig } from './constants';
import { useTranslation } from '../../../../i18n/translations';

interface WorldbuildingListItemProps {
  item: WorldItem;
  index: number;
  isSelected: boolean;
  isDraggingThis: boolean;
  isDragOverThis: boolean;
  isShiftMode: boolean;
  isDraggingAny: boolean;
  shiftTargetIndex: number | null;
  sourceIndex: number;
  rowTranslateY: number;
  setElementRef: (el: HTMLDivElement | null) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, id: string, index: number) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, id: string, index: number) => void;
  onDrop: (e: React.DragEvent, id: string, index: number) => void;
  onDragEnd: () => void;
}

function WorldbuildingListItemComponent({
  item,
  index,
  isSelected,
  isDraggingThis,
  isDragOverThis,
  isShiftMode,
  isDraggingAny,
  shiftTargetIndex,
  sourceIndex,
  rowTranslateY,
  setElementRef,
  onSelect,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragEnd,
}: WorldbuildingListItemProps) {
  const { t } = useTranslation();
  const config = getCategoryConfig(item.category);

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'Location':
        return t('catLocation');
      case 'Faction':
        return t('catFaction');
      case 'Lore':
        return t('catLore');
      case 'Artifact':
        return t('catArtifact');
      default:
        return category;
    }
  };

  return (
    <div
      ref={setElementRef}
      draggable={true}
      onDragStart={(e) => onDragStart(e, item.id, index)}
      onDragEnter={onDragEnter}
      onDragOver={(e) => onDragOver(e, item.id, index)}
      onDrop={(e) => onDrop(e, item.id, index)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(item.id)}
      style={{
        transform: rowTranslateY ? `translate3d(0, ${rowTranslateY}px, 0)` : undefined,
        transition:
          isDraggingAny && isShiftMode
            ? 'transform 220ms cubic-bezier(0.2, 0.9, 0.25, 1)'
            : undefined,
        willChange: isDraggingAny && isShiftMode ? 'transform' : undefined,
      }}
      className={`group px-3 py-2.5 rounded-sm cursor-pointer transition-colors duration-150 flex flex-col gap-1 border select-none ${
        isDraggingAny ? '[&_*]:pointer-events-none' : ''
      } ${
        isDraggingThis
          ? 'opacity-40 bg-zinc-900/40 border-dashed border-zinc-700/80 z-30'
          : !isShiftMode && isDragOverThis
          ? 'border-2 border-cyan-500 bg-cyan-950/30 shadow-md shadow-black/50 z-20'
          : isShiftMode && isDraggingThis && shiftTargetIndex !== null && shiftTargetIndex !== sourceIndex
          ? 'border-cyan-500 bg-cyan-950/30 shadow-lg shadow-black/60 z-30'
          : isSelected
          ? 'bg-zinc-850/90 border-zinc-700/80 shadow-xs'
          : 'border-transparent hover:bg-zinc-900/60 hover:border-zinc-800/50'
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition shrink-0 cursor-grab active:cursor-grabbing" />
          {item.imageUrl || item.avatarUrl ? (
            <div className="w-5 h-5 rounded-xs overflow-hidden border border-zinc-800 shrink-0 bg-zinc-950">
              <img
                src={item.imageUrl || item.avatarUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={`w-2 h-2 rounded-full ${config.dot} shrink-0`} />
          )}
          <span className="text-xs font-semibold text-zinc-100 truncate">
            {item.title || 'Untitled'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs border uppercase tracking-wider ${config.badge}`}
          >
            {getCategoryLabel(item.category)}
          </span>
          <button
            type="button"
            onClick={(e) => onDelete(item.id, e)}
            title="Delete item"
            className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-rose-400 transition rounded-xs cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {item.summary && (
        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
          {item.summary}
        </p>
      )}
    </div>
  );
}

export const WorldbuildingListItem = memo(WorldbuildingListItemComponent);
