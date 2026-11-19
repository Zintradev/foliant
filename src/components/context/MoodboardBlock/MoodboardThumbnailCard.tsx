import React, { useState, useMemo } from 'react';
import { ImageOff } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { isTauriApp } from '../../../utils/platform';
import { normalizeAssetPath } from './constants';
import { ReferenceImage } from './types';
import { useTouchLongPressReorder } from '../../common/useTouchLongPressReorder';

interface MoodboardThumbnailCardProps {
  image: ReferenceImage;
  index: number;
  onPreview: (img: ReferenceImage) => void;
  onDelete?: (img: ReferenceImage) => void;
  onDragStart: (e: React.DragEvent, img: ReferenceImage) => void;
  onDragEnter: (e: React.DragEvent, img: ReferenceImage) => void;
  onDragOver: (e: React.DragEvent, img: ReferenceImage) => void;
  onDragLeave?: (e: React.DragEvent, img: ReferenceImage) => void;
  onDrop: (e: React.DragEvent, targetImg: ReferenceImage) => void;
  onDragEnd?: () => void;
  onTouchDragStart?: (id: string, index: number) => void;
  onTouchDragMove?: (clientY: number, clientX: number) => void;
  onTouchDragEnd?: () => void;
  onTouchDragCancel?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  dragOverPosition?: 'before' | 'after';
  anyDragging?: boolean;
  registerCard?: (id: string, el: HTMLElement | null) => void;
  cardRef?: (el: HTMLElement | null) => void;
}

export const MoodboardThumbnailCard = React.memo(function MoodboardThumbnailCard({
  image,
  index,
  onPreview,
  onDelete: _onDelete,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
  onTouchDragCancel,
  isDragging,
  isDragOver = false,
  dragOverPosition: _dragOverPosition = 'after',
  anyDragging,
  registerCard,
  cardRef,
}: MoodboardThumbnailCardProps) {
  const [loadError, setLoadError] = useState(false);

  const { isTouchDragging, isHolding, touchDragProps } = useTouchLongPressReorder({
    id: image.id,
    index,
    onStart: (id, idx) => onTouchDragStart?.(id, idx),
    onMove: (clientY, clientX) => onTouchDragMove?.(clientY, clientX),
    onEnd: () => onTouchDragEnd?.(),
    onCancel: () => onTouchDragCancel?.(),
    delayMs: 500,
    moveThreshold: 10,
  });

  const displaySrc = useMemo(() => {
    if (image.base64) return image.base64;
    if (image.src) return image.src;
    if (!image.path) return '';
    const normalized = normalizeAssetPath(image.path);
    return isTauriApp() && normalized ? convertFileSrc(normalized) : normalized;
  }, [image.base64, image.path, image.src]);

  const setCardElement = React.useCallback(
    (el: HTMLElement | null) => {
      if (cardRef) cardRef(el);
      if (registerCard) registerCard(image.id, el);
    },
    [cardRef, registerCard, image.id]
  );

  return (
    <div
      ref={setCardElement}
      data-image-id={image.id}
      draggable={true}
      onDragStart={(e) => onDragStart(e, image)}
      onDragEnter={(e) => onDragEnter(e, image)}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver(e, image);
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        if (onDragLeave) onDragLeave(e, image);
      }}
      onDrop={(e) => onDrop(e, image)}
      onDragEnd={(e) => {
        e.stopPropagation();
        if (onDragEnd) onDragEnd();
      }}
      onClick={() => onPreview(image)}
      {...touchDragProps}
      className={`break-inside-avoid mb-4 group relative rounded-sm overflow-hidden select-none ${
        anyDragging ? '' : 'transition-all duration-200'
      } ${
        isHolding
          ? 'scale-[1.02] shadow-xl border-zinc-650 ring-1 ring-zinc-500/30'
          : (isDragging || isTouchDragging)
          ? 'opacity-30 border border-dashed border-zinc-700 bg-zinc-900/50 shadow-xl z-20 touch-none'
          : isDragOver
          ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-950/20 shadow-xl scale-[1.02] z-30'
          : 'border border-zinc-800 bg-zinc-900 hover:border-zinc-650 hover:shadow-lg shadow-xs cursor-grab active:cursor-grabbing'
      }`}
    >
      {isDragOver && !isDragging && !isTouchDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/30 backdrop-blur-[1px] pointer-events-none z-20">
          <span className="text-[10px] font-mono font-medium text-emerald-300 bg-zinc-900/90 px-2 py-0.5 rounded-xs border border-emerald-500 shadow-lg pointer-events-none">
            Intercambiar
          </span>
        </div>
      )}
      {(isDragging || isTouchDragging) && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40 backdrop-blur-[1px] pointer-events-none z-20">
          <span className="text-[10px] font-mono font-medium text-zinc-300 bg-zinc-900/80 px-2 py-0.5 rounded-xs border border-zinc-700 shadow-lg pointer-events-none">
            Drop Here
          </span>
        </div>
      )}
      {loadError && !image.base64 && !displaySrc ? (
        <div className="flex flex-col items-center justify-center w-full min-h-[140px] gap-1 p-3 text-zinc-600 bg-zinc-950/60 pointer-events-none">
          <ImageOff className="w-5 h-5 text-zinc-600 pointer-events-none" />
          <span className="text-[10px] text-center truncate w-full text-zinc-500 pointer-events-none">
            {image.name}
          </span>
        </div>
      ) : (
        <img
          src={displaySrc || undefined}
          alt={image.name}
          loading="lazy"
          decoding="async"
          className="w-full h-auto object-cover transition-transform duration-200 group-hover:scale-[1.02] block pointer-events-none select-none"
          onError={() => {
            if (!loadError && image.base64) {
              setLoadError(true);
            }
          }}
        />
      )}

      {/* Floating Action Overlay on Hover with pointer-events-none internal elements */}
      <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1.5 pointer-events-none">
        
      </div>

      {/* Image Name Tooltip Tag */}
      <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-zinc-950/85 backdrop-blur-xs text-[9px] text-zinc-300 font-mono flex items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="truncate pointer-events-none">{image.name}</span>
      </div>
    </div>
  );
});
