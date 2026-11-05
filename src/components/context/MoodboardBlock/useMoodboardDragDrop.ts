import { useState, useMemo, useRef } from 'react';
import { ReferenceImage } from './types';

interface UseMoodboardDragDropOptions {
  images: ReferenceImage[];
  commitImages: (updated: ReferenceImage[]) => void;
  uploadFile: (file: File, targetSectionId: string) => Promise<void>;
  visualsDropMode?: 'shift' | 'swap';
}

export function useMoodboardDragDrop({
  images,
  commitImages,
  uploadFile,
  visualsDropMode = 'shift',
}: UseMoodboardDragDropOptions) {
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after'>('after');
  const [activeOrder, setActiveOrder] = useState<ReferenceImage[] | null>(null);

  const dragItemIndex = useRef<number | null>(null);
  const dragNode = useRef<HTMLElement | null>(null);
  const startCardRectRef = useRef<DOMRect | null>(null);
  const lastDragOverTimeRef = useRef(0);
  const lastSwapTimeRef = useRef(0);

  const previewImages = useMemo(() => {
    if (!draggedImageId) return images;

    if (visualsDropMode === 'swap') {
      if (!dragOverImageId) return images;
      const sourceIdx = images.findIndex((img) => img.id === draggedImageId);
      const targetIdx = images.findIndex((img) => img.id === dragOverImageId);
      if (sourceIdx === -1 || targetIdx === -1 || sourceIdx === targetIdx) return images;

      const swapped = [...images];
      const sourceItem = {
        ...images[sourceIdx],
        sectionId: dragOverSectionId || images[targetIdx].sectionId,
      };
      const targetItem = {
        ...images[targetIdx],
        sectionId: images[sourceIdx].sectionId,
      };
      swapped[sourceIdx] = targetItem;
      swapped[targetIdx] = sourceItem;
      return swapped;
    }

    // Modo Shift: utiliza el activeOrder que refleja el desplazamiento paso a paso continuo en 2D
    return activeOrder || images;
  }, [images, draggedImageId, dragOverImageId, dragOverSectionId, visualsDropMode, activeOrder]);

  // Canvas External File Upload Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('Files')) setIsCanvasDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('Files')) setIsCanvasDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCanvasDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCanvasDragging(false);

    try {
      const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        const targetSec = dragOverSectionId || 'general';
        for (const file of imageFiles) {
          await uploadFile(file, targetSec);
        }
      }
    } catch (error) {
      console.error('[D&D - MoodboardBlock - Canvas Drop Error]', error);
    }
  };

  // Image Drag Reordering Handlers
  const handleImageDragStart = (e: React.DragEvent, img: ReferenceImage) => {
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    dragNode.current = el;
    startCardRectRef.current = el.getBoundingClientRect();
    dragItemIndex.current = images.findIndex((i) => i.id === img.id);
    setActiveOrder([...images]);
    setDraggedImageId(img.id);
    setDragOverImageId(null);
    lastSwapTimeRef.current = 0;
    lastDragOverTimeRef.current = 0;

    e.dataTransfer.setData('text/plain', img.id);
    e.dataTransfer.setData('text/image-id', img.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragEnter = (e: React.DragEvent, _targetImg: ReferenceImage) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageDragOver = (e: React.DragEvent, targetImg: ReferenceImage) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedImageId) return;

    // 1. Estabilidad: Si el cursor está sobre la propia tarjeta arrastrada, no hacer nada
    if (draggedImageId === targetImg.id) return;

    // 2. Throttling reactivo (~80fps) y debounce entre swaps (~35ms)
    // para dar tiempo al DOM y animaciones FLIP a asentar la nueva posición
    const now = performance.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const isJsDom = rect.width === 0 && rect.height === 0;

    if (!isJsDom) {
      if (now - lastDragOverTimeRef.current < 12) {
        return;
      }
      if (now - lastSwapTimeRef.current < 35) {
        return;
      }
    }

    // 3. Detección de retorno al slot de origen por coordenadas (arrepentimiento espacial directo)
    const startRect = startCardRectRef.current;
    if (
      !isJsDom &&
      startRect &&
      startRect.width > 0 &&
      e.clientX >= startRect.left &&
      e.clientX <= startRect.right &&
      e.clientY >= startRect.top &&
      e.clientY <= startRect.bottom
    ) {
      lastDragOverTimeRef.current = now;
      lastSwapTimeRef.current = now;
      if (visualsDropMode === 'swap') {
        setDragOverImageId(null);
        setDragOverSectionId(null);
      } else {
        setActiveOrder([...images]);
        setDragOverImageId(null);
        setDragOverSectionId(null);
      }
      return;
    }

    // 4. Modo Swap:
    if (visualsDropMode === 'swap') {
      let swapCrossed = isJsDom;
      if (!isJsDom) {
        const midX = rect.left + rect.width / 2;
        const midY = rect.top + rect.height / 2;
        const relX = (e.clientX - rect.left) / rect.width;
        const relY = (e.clientY - rect.top) / rect.height;
        swapCrossed =
          (relX > 0.35 && relX < 0.65) ||
          (relY > 0.35 && relY < 0.65) ||
          Math.hypot(e.clientX - midX, e.clientY - midY) < Math.max(rect.width, rect.height) * 0.45;
      }

      if (!swapCrossed) return;

      lastDragOverTimeRef.current = now;
      lastSwapTimeRef.current = now;

      if (dragOverImageId === targetImg.id) {
        // Arrepentimiento: si vuelve a la tarjeta ya desplazada, restaurar orden original
        setDragOverImageId(null);
        setDragOverSectionId(null);
      } else {
        setDragOverImageId(targetImg.id);
        setDragOverSectionId(targetImg.sectionId);
      }
      return;
    }

    // 5. Modo Shift continuo en 2D con retorno dinámico paso a paso:
    const currentList = activeOrder ? [...activeOrder] : [...images];
    const dIdx = currentList.findIndex((img) => img.id === draggedImageId);
    const tIdx = currentList.findIndex((img) => img.id === targetImg.id);
    if (dIdx === -1 || tIdx === -1 || dIdx === tIdx) return;

    let shiftCrossed = isJsDom;
    if (!isJsDom) {
      const midX = rect.left + rect.width / 2;
      const midY = rect.top + rect.height / 2;
      const isTargetBefore = tIdx < dIdx;
      const isSameRow = Math.abs(e.clientY - midY) < rect.height * 0.45;

      if (isTargetBefore) {
        // Tarjeta objetivo antes en la lista (desplazamiento a la izquierda o hacia arriba)
        shiftCrossed = isSameRow ? e.clientX <= midX + 15 : e.clientY <= midY + 15;
      } else {
        // Tarjeta objetivo después en la lista (desplazamiento a la derecha o hacia abajo)
        shiftCrossed = isSameRow ? e.clientX >= midX - 15 : e.clientY >= midY - 15;
      }
    }

    if (!shiftCrossed) return;

    lastDragOverTimeRef.current = now;
    lastSwapTimeRef.current = now;
    setDragOverImageId(targetImg.id);
    setDragOverPosition(tIdx > dIdx ? 'after' : 'before');
    setDragOverSectionId(targetImg.sectionId);

    // Intercambiar secuencialmente la tarjeta arrastrada con la tarjeta objetivo sobre la que pasa
    const temp = currentList[dIdx];
    currentList[dIdx] = { ...currentList[tIdx], sectionId: targetImg.sectionId };
    currentList[tIdx] = { ...temp, sectionId: targetImg.sectionId };
    setActiveOrder(currentList);
  };

  const handleImageDragLeave = (e: React.DragEvent, _targetImg: ReferenceImage) => {
    e.stopPropagation();
  };

  const handleImageDropOnImage = (e: React.DragEvent, targetImg: ReferenceImage) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (draggedImageId) {
        commitImages(previewImages);
      } else {
        const sourceId =
          draggedImageId ||
          e.dataTransfer.getData('text/plain') ||
          e.dataTransfer.getData('text/image-id');

        if (sourceId && targetImg && sourceId !== targetImg.id) {
          const sourceIdx = images.findIndex((img) => img.id === sourceId);
          const targetIdx = images.findIndex((img) => img.id === targetImg.id);
          if (sourceIdx !== -1 && targetIdx !== -1) {
            if (visualsDropMode === 'swap') {
              const swapped = [...images];
              const sourceItem = { ...images[sourceIdx], sectionId: targetImg.sectionId };
              const targetItem = { ...images[targetIdx], sectionId: images[sourceIdx].sectionId };
              swapped[sourceIdx] = targetItem;
              swapped[targetIdx] = sourceItem;
              commitImages(swapped);
            } else {
              const draggedItem = images[sourceIdx];
              const next = images.filter((img) => img.id !== sourceId);
              const targetIdxInNext = next.findIndex((img) => img.id === targetImg.id);
              if (targetIdxInNext !== -1) {
                const insertIdx =
                  dragOverPosition === 'after' ? targetIdxInNext + 1 : targetIdxInNext;
                const updatedMoved: ReferenceImage = {
                  ...draggedItem,
                  sectionId: targetImg.sectionId,
                };
                next.splice(insertIdx, 0, updatedMoved);
                commitImages(next);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[D&D - MoodboardBlock - Drop Error]', error);
    } finally {
      dragItemIndex.current = null;
      dragNode.current = null;
      startCardRectRef.current = null;
      setDraggedImageId(null);
      setDragOverImageId(null);
      setDragOverSectionId(null);
      setDragOverPosition('after');
      setActiveOrder(null);
    }
  };

  const handleImageDragEnd = () => {
    dragItemIndex.current = null;
    dragNode.current = null;
    startCardRectRef.current = null;
    setDraggedImageId(null);
    setDragOverImageId(null);
    setDragOverSectionId(null);
    setDragOverPosition('after');
    setActiveOrder(null);
  };

  const handleSectionDrop = async (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
        for (const file of files) {
          await uploadFile(file, sectionId);
        }
        return;
      }

      const sourceId =
        draggedImageId ||
        e.dataTransfer.getData('text/plain') ||
        e.dataTransfer.getData('text/image-id');

      if (sourceId) {
        if (
          draggedImageId &&
          (dragOverImageId || activeOrder) &&
          dragOverSectionId === sectionId &&
          previewImages.some((img) => img.id === sourceId && img.sectionId === sectionId)
        ) {
          commitImages(previewImages);
        } else {
          const sourceIdx = images.findIndex((img) => img.id === sourceId);
          if (sourceIdx !== -1 && images[sourceIdx].sectionId !== sectionId) {
            commitImages(images.map((img) => (img.id === sourceId ? { ...img, sectionId } : img)));
          }
        }
      }
    } catch (error) {
      console.error('[D&D - MoodboardBlock - Section Drop Error]', error);
    } finally {
      dragItemIndex.current = null;
      dragNode.current = null;
      startCardRectRef.current = null;
      setDraggedImageId(null);
      setDragOverImageId(null);
      setDragOverSectionId(null);
      setDragOverPosition('after');
      setActiveOrder(null);
    }
  };

  return {
    isCanvasDragging,
    draggedImageId,
    dragOverSectionId,
    setDragOverSectionId,
    dragOverImageId,
    setDragOverImageId,
    dragOverPosition,
    previewImages,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleImageDragStart,
    handleImageDragEnter,
    handleImageDragOver,
    handleImageDragLeave,
    handleImageDropOnImage,
    handleImageDragEnd,
    handleSectionDrop,
  };
}
