import React, { useState, useRef } from 'react';
import { StorylineItem } from '../../../../types/dock';
import { useFlipAnimation } from '../../../common/useFlipAnimation';

interface UseTimelineDragDropParams {
  storylines: StorylineItem[];
  timelineDropMode: 'shift' | 'swap';
  getRowHeight: (id: string) => number;
  onUpdateStorylines?: (updated: StorylineItem[]) => void;
  swimlanesContainerRef: React.RefObject<HTMLDivElement | null>;
  timelineContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function useTimelineDragDrop({
  storylines,
  timelineDropMode,
  getRowHeight,
  onUpdateStorylines,
  swimlanesContainerRef,
  timelineContainerRef,
}: UseTimelineDragDropParams) {
  const dragStorylineIndex = useRef<number | null>(null);
  const dragStorylineNode = useRef<HTMLElement | null>(null);
  const [draggedStorylineId, setDraggedStorylineId] = useState<string | null>(null);
  const [dragOverPlotId, setDragOverPlotId] = useState<string | null>(null);
  const [shiftTargetIndex, setShiftTargetIndex] = useState<number | null>(null);

  const registerTrack = useFlipAnimation(Boolean(draggedStorylineId), draggedStorylineId);

  const handleStorylineDragStart = (e: React.DragEvent, index: number, id: string) => {
    e.stopPropagation();
    dragStorylineIndex.current = index;
    dragStorylineNode.current = e.currentTarget as HTMLElement;
    setDraggedStorylineId(id);
    setShiftTargetIndex(index);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStorylineDragEnter = (e: React.DragEvent, _targetIndex: number, targetId: string) => {
    e.preventDefault();
    if (timelineDropMode === 'swap') {
      if (draggedStorylineId && draggedStorylineId !== targetId && dragOverPlotId !== targetId) {
        setDragOverPlotId(targetId);
      }
    }
  };

  const handleSwimlanesDragOver = (e: React.DragEvent) => {
    if (!draggedStorylineId || timelineDropMode !== 'shift') return;
    if (e.clientX === 0 && e.clientY === 0) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!swimlanesContainerRef.current) return;

    const rect = swimlanesContainerRef.current.getBoundingClientRect();
    if (rect.height === 0) return;
    const relativeY = e.clientY - rect.top;

    let accumulatedY = 0;
    let targetSlot = storylines.length - 1;
    for (let i = 0; i < storylines.length; i++) {
      const h = getRowHeight(storylines[i].id);
      if (relativeY < accumulatedY + h) {
        targetSlot = i;
        break;
      }
      accumulatedY += h;
    }

    targetSlot = Math.max(0, Math.min(storylines.length - 1, targetSlot));
    if (shiftTargetIndex !== targetSlot) {
      setShiftTargetIndex(targetSlot);
    }
  };

  const handleStorylineDragOver = (e: React.DragEvent, targetId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (timelineDropMode === 'swap') {
      e.stopPropagation();
      if (targetId && draggedStorylineId && draggedStorylineId !== targetId) {
        if (dragOverPlotId !== targetId) {
          setDragOverPlotId(targetId);
        }
      }
    } else {
      handleSwimlanesDragOver(e);
    }
  };

  const handleStorylineDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    if (!e.relatedTarget || !timelineContainerRef.current?.contains(e.relatedTarget as Node)) {
      setDragOverPlotId(null);
    }
  };

  const handleStorylineDrop = (e: React.DragEvent, targetIndex?: number, targetId?: string) => {
    e.preventDefault();
    e.stopPropagation();

    const payload = e.dataTransfer?.getData?.('text/plain') ?? '';
    try {
      const sourceId = payload || draggedStorylineId;

      if (sourceId && onUpdateStorylines) {
        if (timelineDropMode === 'swap') {
          const effectiveTargetId = dragOverPlotId || targetId;
          if (effectiveTargetId && sourceId !== effectiveTargetId) {
            const sourceIdx = storylines.findIndex((s) => s.id === sourceId);
            const targetIdx = storylines.findIndex((s) => s.id === effectiveTargetId);
            if (sourceIdx !== -1 && targetIdx !== -1) {
              const next = [...storylines];
              const temp = next[sourceIdx];
              next[sourceIdx] = next[targetIdx];
              next[targetIdx] = temp;
              onUpdateStorylines(next);
            }
          }
        } else {
          const sourceIdx = storylines.findIndex((s) => s.id === sourceId);
          const finalTargetIdx =
            shiftTargetIndex !== null
              ? shiftTargetIndex
              : targetIndex !== undefined && targetIndex !== -1
              ? targetIndex
              : dragOverPlotId || targetId
              ? storylines.findIndex((s) => s.id === (dragOverPlotId || targetId))
              : -1;

          if (sourceIdx !== -1 && finalTargetIdx !== -1 && sourceIdx !== finalTargetIdx) {
            const next = storylines.filter((s) => s.id !== sourceId);
            next.splice(finalTargetIdx, 0, storylines[sourceIdx]);
            onUpdateStorylines(next);
          }
        }
      }
    } catch (error) {
      console.error('Error reordering storyline:', error);
    } finally {
      dragStorylineIndex.current = null;
      dragStorylineNode.current = null;
      setDraggedStorylineId(null);
      setDragOverPlotId(null);
      setShiftTargetIndex(null);
    }
  };

  const handleStorylineDragEnd = () => {
    dragStorylineIndex.current = null;
    dragStorylineNode.current = null;
    setDraggedStorylineId(null);
    setDragOverPlotId(null);
    setShiftTargetIndex(null);
  };

  return {
    draggedStorylineId,
    dragOverPlotId,
    shiftTargetIndex,
    registerTrack,
    handleStorylineDragStart,
    handleStorylineDragEnter,
    handleSwimlanesDragOver,
    handleStorylineDragOver,
    handleStorylineDragLeave,
    handleStorylineDrop,
    handleStorylineDragEnd,
  };
}
