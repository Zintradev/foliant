import React, { useState } from 'react';
import { ZoomIn, Trash2, ImageOff } from 'lucide-react';
import { ReferenceImage } from './types';

interface MoodboardThumbnailCardProps {
  image: ReferenceImage;
  onPreview: (img: ReferenceImage) => void;
  onDelete: (img: ReferenceImage) => void;
  onDragStart: (e: React.DragEvent, img: ReferenceImage) => void;
  onDragEnter: (e: React.DragEvent, img: ReferenceImage) => void;
  onDragOver: (e: React.DragEvent, img: ReferenceImage) => void;
  onDragLeave?: (e: React.DragEvent, img: ReferenceImage) => void;
  onDrop: (e: React.DragEvent, targetImg: ReferenceImage) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  dragOverPosition?: 'before' | 'after';
  anyDragging?: boolean;
  cardRef?: (el: HTMLElement | null) => void;
}

export const MoodboardThumbnailCard = React.memo(function MoodboardThumbnailCard({
  image,
  onPreview,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver: _isDragOver,
  dragOverPosition: _dragOverPosition = 'after',
  anyDragging: _anyDragging,
  cardRef,
}: MoodboardThumbnailCardProps) {
  const [loadError, setLoadError] = useState(false);
  const displaySrc = image.base64 || image.src;

  return (
    <div
      ref={cardRef}
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
      className={`break-inside-avoid mb-4 group relative rounded-sm overflow-hidden select-none transition-all duration-200 ${
        isDragging
          ? 'opacity-30 scale-[0.98] border-2 border-dashed border-emerald-500/80 bg-emerald-950/20 ring-2 ring-emerald-500/40 shadow-xl z-20'
          : 'border border-zinc-800 bg-zinc-900 hover:border-zinc-650 hover:shadow-lg shadow-xs cursor-grab active:cursor-grabbing'
      }`}
    >
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/40 backdrop-blur-[1px] pointer-events-none z-20">
          <span className="text-[10px] font-mono font-medium text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded-xs border border-emerald-500/60 shadow-lg pointer-events-none">
            Drop Here
          </span>
        </div>
      )}
      {loadError && !image.base64 ? (
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
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onPreview(image);
          }}
          className="p-1.5 rounded-sm bg-zinc-900/90 text-zinc-200 border border-zinc-700/60 shadow-xs pointer-events-none"
          title="Zoom image"
        >
          <ZoomIn className="w-3.5 h-3.5 pointer-events-none" />
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(image);
          }}
          className="p-1.5 rounded-sm bg-zinc-900/90 text-zinc-300 border border-zinc-700/60 shadow-xs pointer-events-none"
          title="Delete image"
        >
          <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
        </button>
      </div>

      {/* Image Name Tooltip Tag */}
      <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-zinc-950/85 backdrop-blur-xs text-[9px] text-zinc-300 font-mono flex items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="truncate pointer-events-none">{image.name}</span>
      </div>
    </div>
  );
});
