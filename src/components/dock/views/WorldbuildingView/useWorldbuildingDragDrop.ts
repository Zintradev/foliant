import { useState, useRef } from 'react';
import { WorldItem } from './types';

interface UseWorldbuildingDragDropOptions {
  items: WorldItem[];
  filteredItems: WorldItem[];
  worldDropMode: 'shift' | 'swap';
  onChange: (items: WorldItem[]) => void;
}

export function useWorldbuildingDragDrop({
  items,
  filteredItems,
  worldDropMode,
  onChange,
}: UseWorldbuildingDragDropOptions) {
  const isShiftMode = worldDropMode === 'shift';
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [shiftTargetIndex, setShiftTargetIndex] = useState<number | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const listContainerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, id: string, index: number) => {
    setDraggedItemId(id);
    setShiftTargetIndex(index);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleContainerDragEnter = (e: React.DragEvent) => {
    if (!draggedItemId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    if (!draggedItemId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isShiftMode) return;
    if (e.clientX === 0 && e.clientY === 0) return;
    if (!listContainerRef.current) return;

    const containerRect = listContainerRef.current.getBoundingClientRect();
    if (containerRect.height === 0) return;

    const relativeY =
      e.clientY - containerRect.top + listContainerRef.current.scrollTop;

    let accumulatedY = 0;
    let targetSlot = filteredItems.length - 1;
    for (let i = 0; i < filteredItems.length; i++) {
      const itemEl = itemRefs.current.get(filteredItems[i].id);
      const h = itemEl?.offsetHeight || 58;
      if (relativeY < accumulatedY + h) {
        targetSlot = i;
        break;
      }
      accumulatedY += h;
    }

    targetSlot = Math.max(0, Math.min(filteredItems.length - 1, targetSlot));
    if (shiftTargetIndex !== targetSlot) {
      setShiftTargetIndex(targetSlot);
    }
  };

  const handleItemDragOver = (
    e: React.DragEvent,
    id: string,
    index?: number
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (worldDropMode === 'swap') {
      if (dragOverItemId !== id) {
        setDragOverItemId(id);
      }
    } else {
      const containerRect = listContainerRef.current?.getBoundingClientRect();
      if (!containerRect || containerRect.height === 0) {
        if (index !== undefined && shiftTargetIndex !== index) {
          setShiftTargetIndex(index);
        }
      }
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    targetId?: string,
    targetIndex?: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = draggedItemId || e.dataTransfer.getData('text/plain');

    if (sourceId) {
      const sourceIdx = items.findIndex((i) => i.id === sourceId);
      if (sourceIdx !== -1) {
        if (worldDropMode === 'swap') {
          const effectiveTargetId = dragOverItemId || targetId;
          if (effectiveTargetId) {
            const targetIdx = items.findIndex((i) => i.id === effectiveTargetId);
            if (targetIdx !== -1 && sourceIdx !== targetIdx) {
              const next = [...items];
              const temp = next[sourceIdx];
              next[sourceIdx] = next[targetIdx];
              next[targetIdx] = temp;
              onChange(next);
            }
          }
        } else {
          const effectiveTargetSlot =
            shiftTargetIndex !== null
              ? shiftTargetIndex
              : targetIndex !== undefined && targetIndex !== -1
              ? targetIndex
              : targetId
              ? filteredItems.findIndex((i) => i.id === targetId)
              : -1;

          if (
            effectiveTargetSlot >= 0 &&
            effectiveTargetSlot < filteredItems.length
          ) {
            const targetItem = filteredItems[effectiveTargetSlot];
            if (targetItem) {
              const finalTargetIdx = items.findIndex(
                (i) => i.id === targetItem.id
              );
              if (finalTargetIdx !== -1 && sourceIdx !== finalTargetIdx) {
                const next = [...items];
                const [moved] = next.splice(sourceIdx, 1);
                next.splice(finalTargetIdx, 0, moved);
                onChange(next);
              }
            }
          }
        }
      }
    }

    setDraggedItemId(null);
    setDragOverItemId(null);
    setShiftTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
    setShiftTargetIndex(null);
  };

  return {
    isShiftMode,
    draggedItemId,
    dragOverItemId,
    shiftTargetIndex,
    itemRefs,
    listContainerRef,
    handleDragStart,
    handleContainerDragEnter,
    handleContainerDragOver,
    handleItemDragOver,
    handleDrop,
    handleDragEnd,
  };
}
