import { useState, useRef } from 'react';
import { CharacterItem } from './types';
import { DropMode } from '../../../../types/settings';

interface UseCharactersDragDropOptions {
  characters: CharacterItem[];
  displayedCharacters: CharacterItem[];
  charactersDropMode?: DropMode;
  onChange: (characters: CharacterItem[]) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  isExpanded?: boolean;
}

export function useCharactersDragDrop({
  characters,
  displayedCharacters,
  charactersDropMode = 'shift',
  onChange,
  onDirtyChange,
  isExpanded = false,
}: UseCharactersDragDropOptions) {
  const [draggedCharId, setDraggedCharId] = useState<string | null>(null);
  const [dragOverCharId, setDragOverCharId] = useState<string | null>(null);
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
    initialSlotRectsRef.current = displayedCharacters.map((c) => {
      const el = cardRefs.current.get(c.id);
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
      charactersDropMode !== 'shift' ||
      !draggedCharId ||
      shiftTargetIndex === null
    ) {
      return { x: 0, y: 0 };
    }

    const sourceIndex = displayedCharacters.findIndex((c) => c.id === draggedCharId);
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

    const draggedEl = cardRefs.current.get(draggedCharId);
    const approxHeight = (draggedEl?.offsetHeight || 60) + 8;

    if (index === sourceIndex) {
      return { x: 0, y: (shiftTargetIndex - sourceIndex) * approxHeight };
    }
    if (targetSlotForIndex < index) {
      return { x: 0, y: -approxHeight };
    }
    return { x: 0, y: approxHeight };
  };

  const handleDragStart = (e: React.DragEvent, char: CharacterItem) => {
    e.stopPropagation();
    setDraggedCharId(char.id);
    setDragOverCharId(null);
    const srcIdx = displayedCharacters.findIndex((c) => c.id === char.id);
    setShiftTargetIndex(srcIdx);
    snapshotSlotRects();

    e.dataTransfer.setData('text/plain', char.id);
    e.dataTransfer.setData('text/character-id', char.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, _targetChar?: CharacterItem) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragOver = (
    e: React.DragEvent,
    targetChar: CharacterItem,
    index?: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedCharId) return;

    if (charactersDropMode === 'swap') {
      if (dragOverCharId !== targetChar.id) {
        setDragOverCharId(targetChar.id);
      }
      return;
    }

    updateTargetSlot(e.clientX, e.clientY, index);
  };

  const handleContainerDragEnter = (e: React.DragEvent) => {
    if (!draggedCharId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    if (!draggedCharId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (charactersDropMode !== 'shift') return;
    if (e.clientX === 0 && e.clientY === 0) return;

    updateTargetSlot(e.clientX, e.clientY);
  };

  const handleDrop = (
    e: React.DragEvent,
    targetChar?: CharacterItem,
    index?: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedCharId) return;

    if (charactersDropMode === 'swap') {
      const targetId = dragOverCharId || targetChar?.id;
      if (targetId && targetId !== draggedCharId) {
        const srcIdx = characters.findIndex((c) => c.id === draggedCharId);
        const tgtIdx = characters.findIndex((c) => c.id === targetId);
        if (srcIdx !== -1 && tgtIdx !== -1) {
          const next = [...characters];
          const temp = next[srcIdx];
          next[srcIdx] = next[tgtIdx];
          next[tgtIdx] = temp;
          onChange(next);
          onDirtyChange?.(true);
        }
      }
    } else {
      // Shift mode
      const srcIdx = characters.findIndex((c) => c.id === draggedCharId);
      let targetId: string | undefined = undefined;

      if (shiftTargetIndex !== null && displayedCharacters[shiftTargetIndex]) {
        targetId = displayedCharacters[shiftTargetIndex].id;
      } else if (index !== undefined && displayedCharacters[index]) {
        targetId = displayedCharacters[index].id;
      } else if (targetChar) {
        targetId = targetChar.id;
      }

      if (targetId) {
        const tgtIdx = characters.findIndex((c) => c.id === targetId);
        if (srcIdx !== -1 && tgtIdx !== -1 && srcIdx !== tgtIdx) {
          const next = [...characters];
          const [moved] = next.splice(srcIdx, 1);
          next.splice(tgtIdx, 0, moved);
          onChange(next);
          onDirtyChange?.(true);
        }
      }
    }

    setDraggedCharId(null);
    setDragOverCharId(null);
    setShiftTargetIndex(null);
    initialSlotRectsRef.current = [];
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    handleDrop(e);
  };

  const handleDragEnd = () => {
    setDraggedCharId(null);
    setDragOverCharId(null);
    setShiftTargetIndex(null);
    initialSlotRectsRef.current = [];
  };

  const handleTouchStart = (_id: string, index: number) => {
    if (index >= 0 && index < displayedCharacters.length) {
      const item = displayedCharacters[index];
      setDraggedCharId(item.id);
      setShiftTargetIndex(index);
      snapshotSlotRects();
    }
  };

  const handleTouchMove = (clientY: number, clientX: number) => {
    if (!draggedCharId) return;
    updateTargetSlot(clientX, clientY);
  };

  const handleTouchEnd = () => {
    if (!draggedCharId) return;

    if (charactersDropMode === 'swap') {
      if (dragOverCharId && dragOverCharId !== draggedCharId) {
        const srcIdx = characters.findIndex((c) => c.id === draggedCharId);
        const tgtIdx = characters.findIndex((c) => c.id === dragOverCharId);
        if (srcIdx !== -1 && tgtIdx !== -1) {
          const next = [...characters];
          const temp = next[srcIdx];
          next[srcIdx] = next[tgtIdx];
          next[tgtIdx] = temp;
          onChange(next);
          onDirtyChange?.(true);
        }
      }
    } else {
      const srcIdx = characters.findIndex((c) => c.id === draggedCharId);
      if (shiftTargetIndex !== null && displayedCharacters[shiftTargetIndex]) {
        const targetId = displayedCharacters[shiftTargetIndex].id;
        const tgtIdx = characters.findIndex((c) => c.id === targetId);
        if (srcIdx !== -1 && tgtIdx !== -1 && srcIdx !== tgtIdx) {
          const next = [...characters];
          const [moved] = next.splice(srcIdx, 1);
          next.splice(tgtIdx, 0, moved);
          onChange(next);
          onDirtyChange?.(true);
        }
      }
    }

    setDraggedCharId(null);
    setDragOverCharId(null);
    setShiftTargetIndex(null);
    initialSlotRectsRef.current = [];
  };

  const handleTouchCancel = () => {
    setDraggedCharId(null);
    setDragOverCharId(null);
    setShiftTargetIndex(null);
    initialSlotRectsRef.current = [];
  };

  return {
    containerRef,
    draggedCharId,
    dragOverCharId,
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
