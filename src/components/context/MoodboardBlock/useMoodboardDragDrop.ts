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

  const dragItemIndex = useRef<number | null>(null);
  const dragNode = useRef<HTMLElement | null>(null);
  const lastDragOverTimeRef = useRef(0);

  const previewImages = useMemo(() => {
    if (!draggedImageId || !dragOverImageId) return images;
    const sourceIdx = images.findIndex((img) => img.id === draggedImageId);
    if (sourceIdx === -1) return images;

    const targetIdx = images.findIndex((img) => img.id === dragOverImageId);
    if (targetIdx === -1 || sourceIdx === targetIdx) return images;

    if (visualsDropMode === 'swap') {
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

    const draggedItem = images[sourceIdx];
    const listWithoutDragged = images.filter((img) => img.id !== draggedImageId);
    const targetIdxInNext = listWithoutDragged.findIndex((img) => img.id === dragOverImageId);
    if (targetIdxInNext === -1) return images;

    const insertIdx = dragOverPosition === 'after' ? targetIdxInNext + 1 : targetIdxInNext;
    const targetSec =
      dragOverSectionId || listWithoutDragged[targetIdxInNext]?.sectionId || draggedItem.sectionId;
    const updatedMoved: ReferenceImage = {
      ...draggedItem,
      sectionId: targetSec,
    };

    const reordered = [...listWithoutDragged];
    reordered.splice(insertIdx, 0, updatedMoved);
    return reordered;
  }, [images, draggedImageId, dragOverImageId, dragOverPosition, dragOverSectionId, visualsDropMode]);

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
      console.log(`[MoodboardDragDrop] Dropped ${files.length} file(s) onto canvas`);
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        const targetSec = dragOverSectionId || 'general';
        console.log(`[MoodboardDragDrop] Processing ${imageFiles.length} image file(s) into section "${targetSec}"`);
        for (const file of imageFiles) {
          console.log(`[MoodboardDragDrop] Uploading dropped image: "${file.name}"`);
          await uploadFile(file, targetSec);
        }
      } else {
        console.warn('[MoodboardDragDrop] Dropped files contained no image MIME types:', files.map(f => `${f.name} (${f.type})`));
      }
    } catch (error) {
      console.error('[D&D - MoodboardBlock - Canvas Drop Error]', error);
    }
  };

  // Image Drag Reordering Handlers
  const handleImageDragStart = (e: React.DragEvent, img: ReferenceImage) => {
    e.stopPropagation();
    dragNode.current = e.currentTarget as HTMLElement;
    setDraggedImageId(img.id);

    e.dataTransfer.setData('text/plain', img.id);
    e.dataTransfer.setData('text/image-id', img.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragEnter = (e: React.DragEvent, targetImg: ReferenceImage) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedImageId && draggedImageId !== targetImg.id) {
      setDragOverImageId(targetImg.id);
      setDragOverSectionId(targetImg.sectionId);
    }
  };

  const handleImageDragOver = (e: React.DragEvent, targetImg: ReferenceImage) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedImageId || draggedImageId === targetImg.id) return;

    // Throttle dragover state changes to ~30fps (32ms) to let DOM and FLIP animations settle
    const now = performance.now();
    if (now - lastDragOverTimeRef.current < 32) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;

    // Hysteresis deadband: prevent rapid oscillation at the 50% boundary.
    // If we are already hovering this specific target card:
    // - Stay 'before' until pointer moves past 65% of the card height
    // - Stay 'after' until pointer moves above 35% of the card height
    let newPos: 'before' | 'after' = dragOverPosition;
    if (dragOverImageId === targetImg.id) {
      if (dragOverPosition === 'before' && offsetY > rect.height * 0.65) {
        newPos = 'after';
      } else if (dragOverPosition === 'after' && offsetY < rect.height * 0.35) {
        newPos = 'before';
      }
    } else {
      newPos = offsetY > rect.height * 0.5 ? 'after' : 'before';
    }

    if (dragOverImageId !== targetImg.id || dragOverPosition !== newPos) {
      lastDragOverTimeRef.current = now;
      setDragOverImageId(targetImg.id);
      setDragOverPosition(newPos);
      setDragOverSectionId(targetImg.sectionId);
    }
  };

  const handleImageDragLeave = (e: React.DragEvent, _targetImg: ReferenceImage) => {
    e.stopPropagation();
  };

  const handleImageDropOnImage = (e: React.DragEvent, targetImg: ReferenceImage) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (draggedImageId && dragOverImageId) {
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
      setDraggedImageId(null);
      setDragOverImageId(null);
      setDragOverSectionId(null);
      setDragOverPosition('after');
    }
  };

  const handleImageDragEnd = () => {
    dragItemIndex.current = null;
    dragNode.current = null;
    setDraggedImageId(null);
    setDragOverImageId(null);
    setDragOverSectionId(null);
    setDragOverPosition('after');
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
          dragOverImageId &&
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
      setDraggedImageId(null);
      setDragOverImageId(null);
      setDragOverSectionId(null);
      setDragOverPosition('after');
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
