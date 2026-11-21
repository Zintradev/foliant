import { useState, useRef } from 'react';
import { StorylineItem } from './types';
import { DropMode } from '../../../../types/settings';

interface UseStorylinesDragDropOptions {
  storylines: StorylineItem[];
  filteredStorylines: StorylineItem[];
  storylinesDropMode?: DropMode;
  onChange: (storylines: StorylineItem[]) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  isExpanded?: boolean;
}

export function useStorylinesDragDrop({
  storylines,
  filteredStorylines,
  storylinesDropMode = 'shift',
  onChange,
  onDirtyChange,
  isExpanded = false,
}: UseStorylinesDragDropOptions) {
  const [draggedStorylineId, setDraggedStorylineId] = useState<string | null>(null);
  const [dragOverStorylineId, setDragOverStorylineId] = useState<string | null>(null);
  const [shiftTargetIndex, setShiftTargetIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const initialSlotRectsRef = useRef<Array<DOMRect | null>>([]);

  const registerCard = (id: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el);
    } else {
      cardRefs.current.delete(id);
    }
  };

  const snapshotSlotRects = () => {
    initialSlotRectsRef.current = filteredStorylines.map((s) => {
      const el = cardRefs.current.get(s.id);
      return el ? el.getBoundingClientRect() : null;
    });
  };

  const updateTargetSlot = (x: number, y: number, fallbackIndex?: number) => {
    const rects = initialSlotRectsRef.current;
    if (
      !rects ||
      rects.length === 0 ||
      rects.every((r) => !r || (r.width === 0 && r.height === 0))
    ) {
      if (fallbackIndex !== undefined && shiftTargetIndex !== fallbackIndex) {
        setShiftTargetIndex(fallbackIndex);
      }
      return;
    }

    let closestSlot = 0;
    let minDistance = Infinity;

    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (!r) continue;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < minDistance) {
        minDistance = dist;
        closestSlot = i;
      }
    }

    if (shiftTargetIndex !== closestSlot) {
      setShiftTargetIndex(closestSlot);
    }
  };

  const getCardOffset = (index: number): { x: number; y: number } => {
    if (
      storylinesDropMode !== 'shift' ||
      !draggedStorylineId ||
      shiftTargetIndex === null
    ) {
      return { x: 0, y: 0 };
    }

    const sourceIndex = filteredStorylines.findIndex((s) => s.id === draggedStorylineId);
    if (sourceIndex === -1 || sourceIndex === shiftTargetIndex) {
      return { x: 0, y: 0 };
    }

    let targetSlotForIndex = index;
    if (index === sourceIndex) {
      targetSlotForIndex = shiftTargetIndex;
    } else if (sourceIndex < shiftTargetIndex) {
      if (index > sourceIndex && index <= shiftTargetIndex) {
        targetSlotForIndex = index - 1;
      }
    } else if (sourceIndex > shiftTargetIndex) {
      if (index >= shiftTargetIndex && index < sourceIndex) {
        targetSlotForIndex = index + 1;
      }
    }

    if (targetSlotForIndex === index) {
      return { x: 0, y: 0 };
    }

    const rects = initialSlotRectsRef.current;
    const origRect = rects[index];
    const destRect = rects[targetSlotForIndex];

    if (origRect && destRect && (origRect.height > 0 || origRect.width > 0)) {
      return {
        x: destRect.left - origRect.left,
        y: destRect.top - origRect.top,
      };
    }

    // Fallback if DOM rects are 0 (e.g. testing)
    const draggedEl = cardRefs.current.get(draggedStorylineId);
    const approxHeight = (draggedEl?.offsetHeight || 60) + 8;

    if (index === sourceIndex) {
      return { x: 0, y: (shiftTargetIndex - sourceIndex) * approxHeight };
    }
    if (targetSlotForIndex < index) {
      return { x: 0, y: -approxHeight };
    }
    return { x: 0, y: approxHeight };
  };

  const handleDragStart = (e: React.DragEvent, storyline: StorylineItem) => {
    e.stopPropagation();
    setDraggedStorylineId(storyline.id);
    setDragOverStorylineId(null);
    const srcIdx = filteredStorylines.findIndex((s) => s.id === storyline.id);
    setShiftTargetIndex(srcIdx);
    snapshotSlotRects();

    e.dataTransfer.setData('text/plain', storyline.id);
    e.dataTransfer.setData('text/storyline-id', storyline.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, _targetStoryline?: StorylineItem) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragOver = (
    e: React.DragEvent,
    targetStoryline: StorylineItem,
    index?: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedStorylineId) return;

    if (storylinesDropMode === 'swap') {
      if (dragOverStorylineId !== targetStoryline.id) {
        setDragOverStorylineId(targetStoryline.id);
      }
      return;
    }

    updateTargetSlot(e.clientX, e.clientY, index);
  };

  const handleContainerDragEnter = (e: React.DragEvent) => {
    if (!draggedStorylineId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    if (!draggedStorylineId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (storylinesDropMode !== 'shift') return;
    if (e.clientX === 0 && e.clientY === 0) return;

    updateTargetSlot(e.clientX, e.clientY);
  };

  const handleDrop = (
    e: React.DragEvent,
    targetStoryline?: StorylineItem,
    index?: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedStorylineId) return;

    if (storylinesDropMode === 'swap') {
      const targetId = dragOverStorylineId || targetStoryline?.id;
      if (targetId && targetId !== draggedStorylineId) {
        const srcIdx = storylines.findIndex((s) => s.id === draggedStorylineId);
        const tgtIdx = storylines.findIndex((s) => s.id === targetId);
        if (srcIdx !== -1 && tgtIdx !== -1) {
          const next = [...storylines];
          const temp = next[srcIdx];
          next[srcIdx] = next[tgtIdx];
          next[tgtIdx] = temp;
          onChange(next);
          onDirtyChange?.(true);
        }
      }
    } else {
      // Shift mode
      const srcIdx = storylines.findIndex((s) => s.id === draggedStorylineId);
      let targetId: string | undefined = undefined;

      if (shiftTargetIndex !== null && filteredStorylines[shiftTargetIndex]) {
        targetId = filteredStorylines[shiftTargetIndex].id;
      } else if (index !== undefined && filteredStorylines[index]) {
        targetId = filteredStorylines[index].id;
      } else if (targetStoryline) {
        targetId = targetStoryline.id;
      }

      if (targetId) {
        const tgtIdx = storylines.findIndex((s) => s.id === targetId);
        if (srcIdx !== -1 && tgtIdx !== -1 && srcIdx !== tgtIdx) {
          const next = [...storylines];
          const [moved] = next.splice(srcIdx, 1);
          next.splice(tgtIdx, 0, moved);
          onChange(next);
          onDirtyChange?.(true);
        }
      }
    }

    setDraggedStorylineId(null);
    setDragOverStorylineId(null);
    setShiftTargetIndex(null);
    initialSlotRectsRef.current = [];
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    handleDrop(e);
  };

  const handleDragEnd = () => {
    setDraggedStorylineId(null);
    setDragOverStorylineId(null);
    setShiftTargetIndex(null);
    initialSlotRectsRef.current = [];
  };

  const handleTouchStart = (_id: string, index: number) => {
    if (index >= 0 && index < filteredStorylines.length) {
      const item = filteredStorylines[index];
      setDraggedStorylineId(item.id);
      setShiftTargetIndex(index);
      snapshotSlotRects();
    }
  };

  const handleTouchMove = (clientY: number, clientX: number) => {
    if (!draggedStorylineId) return;
    updateTargetSlot(clientX, clientY);
  };

  const handleTouchEnd = () => {
    if (!draggedStorylineId) return;

    if (storylinesDropMode === 'swap') {
      if (dragOverStorylineId && dragOverStorylineId !== draggedStorylineId) {
        const srcIdx = storylines.findIndex((s) => s.id === draggedStorylineId);
        const tgtIdx = storylines.findIndex((s) => s.id === dragOverStorylineId);
        if (srcIdx !== -1 && tgtIdx !== -1) {
          const next = [...storylines];
          const temp = next[srcIdx];
          next[srcIdx] = next[tgtIdx];
          next[tgtIdx] = temp;
          onChange(next);
          onDirtyChange?.(true);
        }
      }
    } else {
      const srcIdx = storylines.findIndex((s) => s.id === draggedStorylineId);
      if (shiftTargetIndex !== null && filteredStorylines[shiftTargetIndex]) {
        const targetId = filteredStorylines[shiftTargetIndex].id;
        const tgtIdx = storylines.findIndex((s) => s.id === targetId);
        if (srcIdx !== -1 && tgtIdx !== -1 && srcIdx !== tgtIdx) {
          const next = [...storylines];
          const [moved] = next.splice(srcIdx, 1);
          next.splice(tgtIdx, 0, moved);
          onChange(next);
          onDirtyChange?.(true);
        }
      }
    }

    setDraggedStorylineId(null);
    setDragOverStorylineId(null);
    setShiftTargetIndex(null);
    initialSlotRectsRef.current = [];
  };

  const handleTouchCancel = () => {
    setDraggedStorylineId(null);
    setDragOverStorylineId(null);
    setShiftTargetIndex(null);
    initialSlotRectsRef.current = [];
  };

  return {
    containerRef,
    draggedStorylineId,
    dragOverStorylineId,
    shiftTargetIndex,
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
    isExpanded,
  };
}
