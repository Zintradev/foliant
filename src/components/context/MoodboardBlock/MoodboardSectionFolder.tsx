import React from 'react';
import { ChevronRight, ChevronLeft, Folder, Trash2 } from 'lucide-react';
import { MoodboardSection, ReferenceImage } from './types';
import { MoodboardThumbnailCard } from './MoodboardThumbnailCard';

interface MoodboardSectionFolderProps {
  section: MoodboardSection;
  sectionLabel: string;
  images: ReferenceImage[];
  isExpanded?: boolean;
  isActive: boolean;
  isCollapsed: boolean;
  isDragOver: boolean;
  draggedImageId: string | null;
  dragOverImageId: string | null;
  dragOverPosition: 'before' | 'after';
  onDeleteFolder?: (section: MoodboardSection) => void;
  onSelect: () => void;
  onToggleCollapse: () => void;
  onSectionDrop: (e: React.DragEvent, sectionId: string) => void;
  onSectionDragEnter: (e: React.DragEvent, sectionId: string) => void;
  onSectionDragOver: (e: React.DragEvent, sectionId: string) => void;
  onSectionDragLeave: (e: React.DragEvent, sectionId: string) => void;
  registerCard: (id: string, el: HTMLElement | null) => void;
  onPreview: (img: ReferenceImage) => void;
  onDeleteImage: (img: ReferenceImage) => void;
  onImageDragStart: (e: React.DragEvent, img: ReferenceImage) => void;
  onImageDragEnter: (e: React.DragEvent, targetImg: ReferenceImage) => void;
  onImageDragOver: (e: React.DragEvent, targetImg: ReferenceImage) => void;
  onImageDragLeave: (e: React.DragEvent, targetImg: ReferenceImage) => void;
  onImageDropOnImage: (e: React.DragEvent, targetImg: ReferenceImage) => void;
  onImageDragEnd: () => void;
  onTouchImageDragStart?: (id: string, index: number) => void;
  onTouchImageDragMove?: (clientY: number, clientX: number) => void;
  onTouchImageDragEnd?: () => void;
  onTouchImageDragCancel?: () => void;
  onMoveImage?: (id: string, direction: 'prev' | 'next') => void;
}

export const MoodboardSectionFolder = React.memo(function MoodboardSectionFolder({
  section,
  sectionLabel,
  images,
  isExpanded = false,
  isActive,
  isCollapsed,
  isDragOver,
  draggedImageId,
  dragOverImageId,
  dragOverPosition,
  onDeleteFolder,
  onSelect,
  onToggleCollapse,
  onSectionDrop,
  onSectionDragEnter,
  onSectionDragOver,
  onSectionDragLeave,
  registerCard,
  onPreview,
  onDeleteImage,
  onImageDragStart,
  onImageDragEnter,
  onImageDragOver,
  onImageDragLeave,
  onImageDropOnImage,
  onImageDragEnd,
  onTouchImageDragStart,
  onTouchImageDragMove,
  onTouchImageDragEnd,
  onTouchImageDragCancel,
  onMoveImage,
}: MoodboardSectionFolderProps) {
  return (
    <div
      data-section-id={section.id}
      className="space-y-3"
      onDragEnter={(e) => {
        e.preventDefault();
        onSectionDragEnter(e, section.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onSectionDragOver(e, section.id);
      }}
      onDragLeave={(e) => onSectionDragLeave(e, section.id)}
      onDrop={(e) => onSectionDrop(e, section.id)}
    >
      {/* Compact Folder Header: inline-flex w-max */}
            <div className="flex items-center gap-2">
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            onSelect();
            onToggleCollapse();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect();
              onToggleCollapse();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSectionDragEnter(e, section.id);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            onSectionDragOver(e, section.id);
          }}
          onDrop={(e) => onSectionDrop(e, section.id)}
          className={`inline-flex w-max items-center gap-1.5 px-2.5 py-1 rounded-sm bg-zinc-900/90 hover:bg-zinc-850 border cursor-pointer select-none transition group ${
            isDragOver
              ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-950/40 text-emerald-200'
              : isActive
              ? 'border-zinc-700 bg-zinc-850 text-zinc-100'
              : 'border-zinc-800 hover:border-zinc-700 text-zinc-300'
          }`}
          title="Click to select folder and toggle collapse"
        >
          <ChevronRight
            className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform duration-200 pointer-events-none ${
              isCollapsed ? '' : 'rotate-90'
            }`}
          />
          <Folder className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 pointer-events-none" />
          <span className="text-xs font-medium text-zinc-200 pointer-events-none">{sectionLabel}</span>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.2 rounded-xs pointer-events-none">
            {images.length}
          </span>
        </div>

        {onDeleteFolder && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(section);
            }}
            title={sectionLabel ? `Delete ${sectionLabel}` : 'Delete folder'}
            className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-sm transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Pinterest Masonry Grid when not collapsed */}
      {!isCollapsed && (
        <div
          data-section-id={section.id}
          className={`min-h-[48px] rounded-sm transition-colors duration-150 ${
            isDragOver && draggedImageId
              ? 'border-2 border-dashed border-zinc-650 bg-zinc-900/50 p-2'
              : ''
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            onSectionDragEnter(e, section.id);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            onSectionDragOver(e, section.id);
          }}
          onDrop={(e) => onSectionDrop(e, section.id)}
        >
          {images.length === 0 ? (
            isDragOver && draggedImageId ? (
              <div className="py-6 text-center text-xs text-zinc-400 font-mono">
                {sectionLabel}
              </div>
            ) : null
          ) : (
            <div
              className={
                isExpanded
                  ? 'columns-2 sm:columns-3 md:columns-4 lg:columns-6 gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 items-start'
                  : 'columns-2 md:columns-4 gap-4 grid grid-cols-2 md:grid-cols-4 items-start'
              }
            >
              {images.map((image, idx) => (
                <div key={image.id || image.path} className="relative group/mcard flex flex-col">
                  <MoodboardThumbnailCard
                    image={image}
                    index={idx}
                    registerCard={registerCard}
                    isDragging={draggedImageId === image.id}
                    isDragOver={dragOverImageId === image.id && draggedImageId !== image.id}
                    dragOverPosition={dragOverPosition}
                    anyDragging={Boolean(draggedImageId)}
                    onPreview={onPreview}
                    onDelete={onDeleteImage}
                    onDragStart={onImageDragStart}
                    onDragEnter={onImageDragEnter}
                    onDragOver={onImageDragOver}
                    onDragLeave={onImageDragLeave}
                    onDrop={onImageDropOnImage}
                    onDragEnd={onImageDragEnd}
                    onTouchDragStart={onTouchImageDragStart}
                    onTouchDragMove={onTouchImageDragMove}
                    onTouchDragEnd={onTouchImageDragEnd}
                    onTouchDragCancel={onTouchImageDragCancel}
                  />
                  {onMoveImage && images.length > 1 && (
                    <div className="flex items-center justify-center gap-1 -mt-2 mb-3 opacity-60 sm:opacity-0 sm:group-hover/mcard:opacity-100 hover:!opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveImage(image.id, 'prev');
                        }}
                        title="Mover antes"
                        className="px-1.5 py-0.5 rounded-xs bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition touch-manipulation cursor-pointer"
                      >
                        <ChevronLeft className="w-3 h-3 inline" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveImage(image.id, 'next');
                        }}
                        title="Mover después"
                        className="px-1.5 py-0.5 rounded-xs bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition touch-manipulation cursor-pointer"
                      >
                        <ChevronRight className="w-3 h-3 inline" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
