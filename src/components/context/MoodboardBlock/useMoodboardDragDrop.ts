import { useState, useMemo, useRef } from 'react';
import { ReferenceImage } from './types';

interface UseMoodboardDragDropOptions {
  images: ReferenceImage[];
  commitImages: (updated: ReferenceImage[]) => void;
  uploadFile: (file: File, targetSectionId: string) => Promise<void>;
}

export function useMoodboardDragDrop({
  images,
  commitImages,
  uploadFile,
}: UseMoodboardDragDropOptions) {
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after'>('after');

  const dragItemIndex = useRef<number | null>(null);
  const dragNode = useRef<HTMLElement | null>(null);

  const previewImages = useMemo(() => {
    if (!draggedImageId || !dragOverImageId) return images;
    const sourceIdx = images.findIndex((img) => img.id === draggedImageId);
    if (sourceIdx === -1) return images;

    const draggedItem = images[sourceIdx];
    const listWithoutDragged = images.filter((img) => img.id !== draggedImageId);
    const targetIdx = listWithoutDragged.findIndex((img) => img.id === dragOverImageId);
    if (targetIdx === -1) return images;

    const insertIdx = dragOverPosition === 'after' ? targetIdx + 1 : targetIdx;
    const targetSec =
      dragOverSectionId || listWithoutDragged[targetIdx]?.sectionId || draggedItem.sectionId;
    const updatedMoved: ReferenceImage = {
      ...draggedItem,
      sectionId: targetSec,
    };

    const reordered = [...listWithoutDragged];
    reordered.splice(insertIdx, 0, updatedMoved);
    return reordered;
  }, [images, draggedImageId, dragOverImageId, dragOverPosition, dragOverSectionId]);

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

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const isAfter = offsetY > rect.height * 0.5;
    const newPos = isAfter ? 'after' : 'before';

    if (dragOverImageId !== targetImg.id || dragOverPosition !== newPos) {
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
          if (sourceIdx !== -1) {
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
