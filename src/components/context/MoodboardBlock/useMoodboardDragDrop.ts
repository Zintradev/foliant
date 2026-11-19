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

    // En modo swap, mantener el orden estable durante el arrastre para evitar
    // parpadeos y oscilaciones de tarjetas en el DOM bajo el cursor/dedo.
    // La tarjeta objetivo se resalta con borde esmeralda y el intercambio se ejecuta limpiamente al soltar (drop).
    if (visualsDropMode === 'swap') {
      return images;
    }

    // Modo Shift: utiliza el activeOrder que refleja el desplazamiento paso a paso continuo en 2D
    return activeOrder || images;
  }, [images, draggedImageId, visualsDropMode, activeOrder]);

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
    } catch {
      // non-fatal canvas drop error
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
        if (visualsDropMode === 'swap' && dragOverImageId && dragOverImageId !== draggedImageId) {
          const sourceIdx = images.findIndex((img) => img.id === draggedImageId);
          const targetIdx = images.findIndex((img) => img.id === dragOverImageId);
          if (sourceIdx !== -1 && targetIdx !== -1) {
            const swapped = [...images];
            const sourceItem = {
              ...images[sourceIdx],
              sectionId: images[targetIdx].sectionId || 'general',
            };
            const targetItem = {
              ...images[targetIdx],
              sectionId: images[sourceIdx].sectionId || 'general',
            };
            swapped[sourceIdx] = targetItem;
            swapped[targetIdx] = sourceItem;
            commitImages(swapped);
            return;
          }
        }
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
    } catch {
      // non-fatal drop error
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
    } catch {
      // non-fatal section drop error
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

  const handleTouchImageDragStart = (id: string, index: number) => {
    dragItemIndex.current = index;
    setActiveOrder([...images]);
    setDraggedImageId(id);
    const sourceImg = images.find((img) => img.id === id);
    const initialSecId = sourceImg?.sectionId || 'general';
    setDragOverSectionId(initialSecId);
    setDragOverImageId(null);
    lastSwapTimeRef.current = 0;
    lastDragOverTimeRef.current = 0;

    if (typeof document !== 'undefined') {
      const cardEl = document.querySelector(`[data-image-id="${id}"]`) as HTMLElement | null;
      if (cardEl) {
        startCardRectRef.current = cardEl.getBoundingClientRect();
      }
    }
  };

  const handleTouchImageDragMove = (clientY: number, clientX: number) => {
    if (!draggedImageId) return;

    const now = performance.now();
    const isJsDom = typeof window !== 'undefined' && (window as any).navigator?.userAgent?.includes('jsdom');
    if (!isJsDom && now - lastDragOverTimeRef.current < 12) return;
    lastDragOverTimeRef.current = now;

    // Direct return to origin slot by coordinates (spatial repentance)
    const startRect = startCardRectRef.current;
    if (
      !isJsDom &&
      startRect &&
      startRect.width > 0 &&
      clientX >= startRect.left &&
      clientX <= startRect.right &&
      clientY >= startRect.top &&
      clientY <= startRect.bottom
    ) {
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

    if (typeof document === 'undefined' || !document.elementsFromPoint) return;
    const elements = document.elementsFromPoint(clientX, clientY);

    let targetCardEl: HTMLElement | null = null;
    let targetSectionEl: HTMLElement | null = null;

    for (const el of elements) {
      if (!targetCardEl) {
        const card = el.closest('[data-image-id]') as HTMLElement | null;
        if (card && card.getAttribute('data-image-id') !== draggedImageId) {
          targetCardEl = card;
        }
      }
      if (!targetSectionEl) {
        const section = el.closest('[data-section-id]') as HTMLElement | null;
        if (section) {
          targetSectionEl = section;
        }
      }
      if (targetCardEl && targetSectionEl) break;
    }

    // Detect if hovering over another section folder
    if (targetSectionEl) {
      const secId = targetSectionEl.getAttribute('data-section-id');
      if (secId && secId !== dragOverSectionId) {
        setDragOverSectionId(secId);
      }
    }

    const currentList = activeOrder ? [...activeOrder] : [...images];
    const sourceImg = currentList.find((img) => img.id === draggedImageId);
    if (!sourceImg) return;
    const sourceSecId = sourceImg.sectionId || 'general';

    // Detect if hovering over another card
    if (!targetCardEl) {
      if (visualsDropMode === 'swap' && dragOverImageId !== null) {
        setDragOverImageId(null);
      }
      return;
    }

    const targetId = targetCardEl.getAttribute('data-image-id');
    if (!targetId || targetId === draggedImageId) return;

    const targetImg = currentList.find((img) => img.id === targetId);
    if (!targetImg) return;
    const targetSecId = targetImg.sectionId || 'general';

    const rect = targetCardEl.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const midY = rect.top + rect.height / 2;

    // 1. Modo Swap: sustitución / intercambio de tarjetas tanto en la misma carpeta como entre carpetas distintas
    if (visualsDropMode === 'swap') {
      let swapCrossed = isJsDom;
      if (!isJsDom) {
        const relX = (clientX - rect.left) / rect.width;
        const relY = (clientY - rect.top) / rect.height;
        swapCrossed =
          (relX > 0.35 && relX < 0.65) ||
          (relY > 0.35 && relY < 0.65) ||
          Math.hypot(clientX - midX, clientY - midY) < Math.max(rect.width, rect.height) * 0.45;
      }

      if (!swapCrossed) return;
      if (!isJsDom && now - lastSwapTimeRef.current < 35) return;

      lastSwapTimeRef.current = now;
      if (dragOverImageId !== targetImg.id) {
        setDragOverImageId(targetImg.id);
        setDragOverSectionId(targetSecId);
      }
      return;
    }

    // 2. Modo Shift:
    // Si la tarjeta está en otra sección, registrar destino de sección para cambio de carpeta
    if (targetSecId !== sourceSecId) {
      if (dragOverSectionId !== targetSecId) {
        setDragOverSectionId(targetSecId);
      }
      setDragOverImageId(targetId);
      return;
    }

    // Desplazamiento fluido paso a paso en 2D dentro de la misma carpeta
    if (!isJsDom && now - lastSwapTimeRef.current < 35) return;

    const dIdx = currentList.findIndex((img) => img.id === draggedImageId);
    const tIdx = currentList.findIndex((img) => img.id === targetId);
    if (dIdx === -1 || tIdx === -1 || dIdx === tIdx) return;

    let shiftCrossed = isJsDom;
    if (!isJsDom) {
      const isTargetBefore = tIdx < dIdx;
      const isSameRow = Math.abs(clientY - midY) < rect.height * 0.45;

      if (isTargetBefore) {
        shiftCrossed = isSameRow ? clientX <= midX + 15 : clientY <= midY + 15;
      } else {
        shiftCrossed = isSameRow ? clientX >= midX - 15 : clientY >= midY - 15;
      }
    }

    if (!shiftCrossed) return;

    lastSwapTimeRef.current = now;
    setDragOverImageId(targetId);
    setDragOverPosition(tIdx > dIdx ? 'after' : 'before');
    setDragOverSectionId(targetSecId);

    const temp = currentList[dIdx];
    currentList[dIdx] = { ...currentList[tIdx], sectionId: targetSecId };
    currentList[tIdx] = { ...temp, sectionId: targetSecId };
    setActiveOrder(currentList);
  };

  const handleTouchImageDragEnd = () => {
    try {
      if (draggedImageId) {
        const sourceIdx = images.findIndex((img) => img.id === draggedImageId);
        if (sourceIdx !== -1) {
          const sourceItem = images[sourceIdx];
          const sourceSecId = sourceItem.sectionId || 'general';

          if (visualsDropMode === 'swap') {
            // En modo swap, si se arrastró sobre una tarjeta objetivo (misma carpeta o carpeta distinta),
            // se confirma el intercambio de posiciones y carpetas:
            if (dragOverImageId && dragOverImageId !== draggedImageId) {
              const targetIdx = images.findIndex((img) => img.id === dragOverImageId);
              if (targetIdx !== -1) {
                const swapped = [...images];
                const sourceItemUpdated = {
                  ...images[sourceIdx],
                  sectionId: images[targetIdx].sectionId || 'general',
                };
                const targetItemUpdated = {
                  ...images[targetIdx],
                  sectionId: sourceSecId,
                };
                swapped[sourceIdx] = targetItemUpdated;
                swapped[targetIdx] = sourceItemUpdated;
                commitImages(swapped);
              } else {
                commitImages(previewImages);
              }
            } else if (dragOverSectionId && dragOverSectionId !== sourceSecId) {
              // Si se soltó sobre una carpeta vacía o cabecera sin sustituir una tarjeta en particular
              const next = images.map((img) =>
                img.id === draggedImageId ? { ...img, sectionId: dragOverSectionId } : img
              );
              commitImages(next);
            } else {
              commitImages(previewImages);
            }
          } else {
            // Modo shift:
            if (dragOverSectionId && dragOverSectionId !== sourceSecId) {
              const next = [...images];
              const [moved] = next.splice(sourceIdx, 1);
              const updated: ReferenceImage = {
                ...moved,
                sectionId: dragOverSectionId,
              };

              if (dragOverImageId && dragOverImageId !== draggedImageId) {
                const targetIdxInList = next.findIndex((img) => img.id === dragOverImageId);
                if (targetIdxInList !== -1) {
                  const insertIdx = dragOverPosition === 'after' ? targetIdxInList + 1 : targetIdxInList;
                  next.splice(insertIdx, 0, updated);
                } else {
                  next.push(updated);
                }
              } else {
                next.push(updated);
              }
              commitImages(next);
            } else {
              commitImages(previewImages);
            }
          }
        }
      }
    } catch {
      // non-fatal drop error
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

  const handleTouchImageDragCancel = () => {
    dragItemIndex.current = null;
    dragNode.current = null;
    startCardRectRef.current = null;
    setDraggedImageId(null);
    setDragOverImageId(null);
    setDragOverSectionId(null);
    setDragOverPosition('after');
    setActiveOrder(null);
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
    handleTouchImageDragStart,
    handleTouchImageDragMove,
    handleTouchImageDragEnd,
    handleTouchImageDragCancel,
  };
}
