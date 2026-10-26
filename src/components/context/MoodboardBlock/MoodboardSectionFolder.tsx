import React from 'react';
import { ChevronRight, Folder } from 'lucide-react';
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
  emptyMessage: string;
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
  emptyMessage,
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
}: MoodboardSectionFolderProps) {
  return (
    <div
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
        className={`inline-flex w-max items-center gap-1.5 px-2.5 py-1 rounded-sm bg-zinc-900/90 hover:bg-zinc-855 border cursor-pointer select-none transition group ${
          isDragOver
            ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-950/40 text-emerald-200'
            : isActive
            ? 'border-zinc-700 bg-zinc-850 text-zinc-100'
            : 'border-zinc-800 hover:border-zinc-700 text-zinc-300'
        }`}
        title="Click to select folder and toggle collapse"
      >
        <ChevronRight
          className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform duration-200 ${
            isCollapsed ? '' : 'rotate-90'
          }`}
        />
        <Folder className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" />
        <span className="text-xs font-medium text-zinc-200">{sectionLabel}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.2 rounded-xs">
          {images.length}
        </span>
      </div>

      {/* Pinterest Masonry Grid when not collapsed */}
      {!isCollapsed && (
        <div
          className="min-h-[48px] rounded-sm transition-all"
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
            <div className="border border-dashed border-zinc-800/80 rounded-sm py-4 px-3 text-center text-zinc-600 text-xs font-mono select-none">
              {emptyMessage}
            </div>
          ) : (
            <div
              className={
                isExpanded
                  ? 'columns-2 sm:columns-3 md:columns-4 lg:columns-6 gap-4 space-y-4'
                  : 'columns-2 md:columns-4 gap-4 space-y-4'
              }
            >
              {images.map((image) => (
                <MoodboardThumbnailCard
                  key={image.id || image.path}
                  image={image}
                  cardRef={(el) => registerCard(image.id, el)}
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
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
