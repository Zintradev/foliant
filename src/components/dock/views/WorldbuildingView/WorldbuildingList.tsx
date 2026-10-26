import React, { memo } from 'react';
import { Compass } from 'lucide-react';
import { WorldItem } from './types';
import { WorldbuildingListItem } from './WorldbuildingListItem';
import { useTranslation } from '../../../../i18n/translations';

interface WorldbuildingListProps {
  filteredItems: WorldItem[];
  selectedId: string | null;
  draggedItemId: string | null;
  dragOverItemId: string | null;
  isShiftMode: boolean;
  shiftTargetIndex: number | null;
  itemRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  listContainerRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (id: string) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
  onCreateNew: () => void;
  onDragStart: (e: React.DragEvent, id: string, index: number) => void;
  onContainerDragEnter: (e: React.DragEvent) => void;
  onContainerDragOver: (e: React.DragEvent) => void;
  onItemDragOver: (e: React.DragEvent, id: string, index: number) => void;
  onDrop: (e: React.DragEvent, targetId?: string, targetIndex?: number) => void;
  onDragEnd: () => void;
}

function WorldbuildingListComponent({
  filteredItems,
  selectedId,
  draggedItemId,
  dragOverItemId,
  isShiftMode,
  shiftTargetIndex,
  itemRefs,
  listContainerRef,
  onSelect,
  onDelete,
  onCreateNew,
  onDragStart,
  onContainerDragEnter,
  onContainerDragOver,
  onItemDragOver,
  onDrop,
  onDragEnd,
}: WorldbuildingListProps) {
  const { t } = useTranslation();

  const isDraggingAny = draggedItemId !== null;
  const sourceIndex = draggedItemId
    ? filteredItems.findIndex((i) => i.id === draggedItemId)
    : -1;
  const draggedEl = draggedItemId ? itemRefs.current.get(draggedItemId) : null;
  const draggedHeight = draggedEl?.offsetHeight || 50;

  let draggedTargetOffset = 0;
  if (isShiftMode && isDraggingAny && sourceIndex !== -1 && shiftTargetIndex !== null) {
    if (sourceIndex < shiftTargetIndex) {
      for (let i = sourceIndex + 1; i <= shiftTargetIndex; i++) {
        const el = itemRefs.current.get(filteredItems[i]?.id);
        draggedTargetOffset += el?.offsetHeight || draggedHeight;
      }
    } else if (sourceIndex > shiftTargetIndex) {
      for (let i = shiftTargetIndex; i < sourceIndex; i++) {
        const el = itemRefs.current.get(filteredItems[i]?.id);
        draggedTargetOffset -= el?.offsetHeight || draggedHeight;
      }
    }
  }

  return (
    <div
      ref={listContainerRef}
      onDragEnter={onContainerDragEnter}
      onDragOver={onContainerDragOver}
      onDrop={(e) => onDrop(e)}
      className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 p-1"
    >
      {filteredItems.length === 0 ? (
        <div className="py-12 px-4 text-center text-zinc-500 text-xs">
          <Compass className="w-8 h-8 text-zinc-700 mx-auto mb-2 opacity-50" />
          <p>{t('noLoreYet')}</p>
          <button
            type="button"
            onClick={onCreateNew}
            className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
          >
            {t('addWorldItem')}
          </button>
        </div>
      ) : (
        filteredItems.map((item, index) => {
          let rowTranslateY = 0;
          if (isShiftMode && isDraggingAny && sourceIndex !== -1 && shiftTargetIndex !== null) {
            if (index === sourceIndex) {
              rowTranslateY = draggedTargetOffset;
            } else if (sourceIndex < shiftTargetIndex && index > sourceIndex && index <= shiftTargetIndex) {
              rowTranslateY = -draggedHeight;
            } else if (sourceIndex > shiftTargetIndex && index >= shiftTargetIndex && index < sourceIndex) {
              rowTranslateY = draggedHeight;
            }
          }

          return (
            <WorldbuildingListItem
              key={item.id}
              item={item}
              index={index}
              isSelected={item.id === selectedId}
              isDraggingThis={draggedItemId === item.id}
              isDragOverThis={dragOverItemId === item.id && draggedItemId !== item.id}
              isShiftMode={isShiftMode}
              isDraggingAny={isDraggingAny}
              shiftTargetIndex={shiftTargetIndex}
              sourceIndex={sourceIndex}
              rowTranslateY={rowTranslateY}
              setElementRef={(el) => {
                if (el) itemRefs.current.set(item.id, el);
                else itemRefs.current.delete(item.id);
              }}
              onSelect={onSelect}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDragEnter={(e) => {
                if (draggedItemId) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }
              }}
              onDragOver={onItemDragOver}
              onDrop={(e) => {
                e.stopPropagation();
                onDrop(e, item.id, index);
              }}
              onDragEnd={onDragEnd}
            />
          );
        })
      )}
    </div>
  );
}

export const WorldbuildingList = memo(WorldbuildingListComponent);
