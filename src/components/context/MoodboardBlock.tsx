import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useFlipAnimation } from '../common/useFlipAnimation';
import { useTranslation } from '../../i18n/translations';
import {
  Plus,
  Trash2,
  X,
  ZoomIn,
  ImageOff,
  Loader2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Folder,
  FolderPlus,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface ReferenceImage {
  id: string;
  path: string;
  src: string;
  name: string;
  sectionId: string;
  base64?: string;
}

export interface MoodboardSection {
  id: string;
  name: string;
}

interface MoodboardBlockProps {
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  isExpanded?: boolean;
}

const DEFAULT_SECTIONS: MoodboardSection[] = [
  { id: 'general', name: 'General' },
  { id: 'characters', name: 'Characters' },
  { id: 'locations', name: 'Locations' },
  { id: 'atmosphere', name: 'Atmosphere' },
];

const MOODBOARD_CACHE_KEY = 'foliant_moodboard_cache_v1';
const MOODBOARD_SECTIONS_KEY = 'foliant_moodboard_sections_v1';

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function extractFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

function toReferenceImage(
  absolutePath: string,
  sectionId: string = 'general',
  base64?: string
): ReferenceImage {
  return {
    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    path: absolutePath,
    src: base64 || '',
    name: extractFileName(absolutePath),
    sectionId,
    base64,
  };
}

// ---------------------------------------------------------------------------
// Lightbox Component
// ---------------------------------------------------------------------------

interface LightboxProps {
  image: ReferenceImage;
  onClose: () => void;
  onDelete?: (img: ReferenceImage) => void;
}

function Lightbox({ image, onClose, onDelete }: LightboxProps) {
  const { t } = useTranslation();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const displaySrc = image.base64 || image.src;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between w-full max-w-4xl px-4 py-3 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 truncate">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-xs font-mono text-zinc-300 truncate max-w-md">
            {image.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={() => {
                onDelete(image);
                onClose();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 border border-rose-900/50 transition cursor-pointer"
              title="Delete image"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('delete')}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="relative max-w-4xl max-h-[82vh] w-full px-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={displaySrc}
          alt={image.name}
          className="max-h-[80vh] w-auto max-w-full object-contain rounded-sm border border-zinc-800 shadow-2xl transition-transform"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pinterest Thumbnail Card (Masonry break-inside-avoid)
// ---------------------------------------------------------------------------

interface ThumbnailCardProps {
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
  anyDragging?: boolean;
  cardRef?: (el: HTMLElement | null) => void;
}

function ThumbnailCard({
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
  isDragOver,
  anyDragging: _anyDragging,
  cardRef,
}: ThumbnailCardProps) {
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
      className={`break-inside-avoid mb-4 group relative rounded-sm overflow-hidden select-none transition-all duration-300 ${
        isDragging
          ? 'opacity-60 scale-[0.98] border-2 border-dashed border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/40 shadow-2xl shadow-emerald-950/60 z-20 animate-pulse'
          : isDragOver
          ? 'ring-2 ring-emerald-400 border-emerald-500 shadow-xl z-10 scale-[1.01]'
          : 'border border-zinc-800 bg-zinc-900 hover:border-zinc-650 hover:shadow-lg shadow-xs cursor-grab active:cursor-grabbing'
      }`}
    >
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/40 backdrop-blur-[1px] pointer-events-none z-20">
          <span className="text-[10px] font-mono font-medium text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded-xs border border-emerald-500/60 shadow-lg animate-bounce">
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
      <div
        className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1.5 pointer-events-none"
      >
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
}

// ---------------------------------------------------------------------------
// MoodboardBlock Main Component
// ---------------------------------------------------------------------------

export default function MoodboardBlock({
  title,
  collapsible = true,
  defaultCollapsed = false,
  isExpanded = false,
}: MoodboardBlockProps) {
  const { t } = useTranslation();

  const getSectionLabel = useCallback(
    (sec: MoodboardSection): string => {
      if (sec.id === 'general') return t('sectionGeneral');
      if (sec.id === 'characters') return t('sectionCharacters');
      if (sec.id === 'locations') return t('sectionLocations');
      if (sec.id === 'atmosphere') return t('sectionAtmosphere');
      return sec.name;
    },
    [t]
  );
  const [images, setImages] = useState<ReferenceImage[]>(() => {
    try {
      const stored = localStorage.getItem(MOODBOARD_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: any) => ({
            id: c.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            path: c.path,
            src: c.base64 || '',
            name: c.name || extractFileName(c.path),
            sectionId: c.sectionId || 'general',
            base64: c.base64,
          }));
        }
      }
    } catch {
      // fallback
    }
    return [];
  });
  const [sections, setSections] = useState<MoodboardSection[]>(() => {
    try {
      const stored = localStorage.getItem(MOODBOARD_SECTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_SECTIONS;
  });
  const [activeSectionId, setActiveSectionId] = useState<string>('general');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [activeLightbox, setActiveLightbox] = useState<ReferenceImage | null>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after'>('after');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Smooth FLIP Floating Layout Animation
  const registerCard = useFlipAnimation(Boolean(draggedImageId));

  const dragItemIndex = useRef<number | null>(null);
  const dragNode = useRef<HTMLElement | null>(null);

  // Sync sections to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(MOODBOARD_SECTIONS_KEY, JSON.stringify(sections));
    } catch {
      // ignore
    }
  }, [sections]);

  // Sync images metadata and Base64 to localStorage
  useEffect(() => {
    if (images.length > 0) {
      try {
        const serializable = images.map(({ id, path, name, sectionId, base64 }) => ({
          id,
          path,
          name,
          sectionId,
          base64,
        }));
        localStorage.setItem(MOODBOARD_CACHE_KEY, JSON.stringify(serializable));
      } catch {
        // ignore
      }
    }
  }, [images]);

  // New section creation drawer
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetUploadSectionRef = useRef<string>('general');

  const toggleSectionCollapse = (secId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  // ---------------------------------------------------------------------------
  // Load Images via Tauri IPC + Rehydrate from LocalStorage Cache
  // ---------------------------------------------------------------------------
  const fetchImages = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let cached: Array<{ id: string; path: string; name: string; sectionId: string; base64?: string }> = [];
      try {
        const stored = localStorage.getItem(MOODBOARD_CACHE_KEY);
        if (stored) {
          cached = JSON.parse(stored);
        }
      } catch {
        // ignore
      }

      const paths = await invoke<string[]>('list_reference_images');
      const reconciled: ReferenceImage[] = paths.map((p) => {
        const found = cached.find((c) => c.path === p);
        if (found) {
          return {
            id: found.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            path: p,
            src: found.base64 || '',
            name: found.name || extractFileName(p),
            sectionId: found.sectionId || 'general',
            base64: found.base64,
          };
        }
        return toReferenceImage(p, 'general');
      });

      setImages(reconciled);
    } catch (err) {
      console.error('Failed to load reference images:', err);
      try {
        const stored = localStorage.getItem(MOODBOARD_CACHE_KEY);
        if (stored) {
          const cached = JSON.parse(stored);
          setImages(
            cached.map((c: any) => ({
              ...c,
              src: c.base64 || '',
            }))
          );
        }
      } catch {
        // ignore
      }
      setErrorMessage(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Rehydrate images with pure Base64 src on mount to avoid Tauri asset.localhost issues
    try {
      const stored = localStorage.getItem(MOODBOARD_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setImages(
            parsed.map((c: any) => ({
              id: c.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              path: c.path,
              src: c.base64 || '',
              name: c.name || extractFileName(c.path),
              sectionId: c.sectionId || 'general',
              base64: c.base64,
            }))
          );
        }
      }
    } catch {
      // ignore
    }
    fetchImages();
  }, [fetchImages]);

  // ---------------------------------------------------------------------------
  // Upload Processing with Forced Base64 Flow (No asset.localhost dependency)
  // ---------------------------------------------------------------------------
  const uploadFile = useCallback(
    async (file: File, targetSectionId: string = 'general') => {
      setUploading(true);
      setErrorMessage(null);

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        let savedPath: string;
        try {
          savedPath = await invoke<string>('save_reference_image_base64', {
            fileName: file.name,
            dataBase64: base64Data,
          });
        } catch {
          // Fallback if backend command is unavailable
          savedPath = file.name;
        }

        const newImg = toReferenceImage(savedPath, targetSectionId, base64Data);

        setImages((prev) => {
          if (prev.some((img) => img.path === savedPath && img.name === file.name)) {
            return prev;
          }
          return [...prev, newImg];
        });
      } catch (err) {
        console.error('Failed to upload image:', err);
        setErrorMessage(String(err));
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const files = Array.from(fileList);
      const targetSec = targetUploadSectionRef.current || 'general';
      for (const file of files) {
        await uploadFile(file, targetSec);
      }
    }
    e.target.value = '';
  };

  // ---------------------------------------------------------------------------
  // Drag and Drop: Canvas External File Upload
  // ---------------------------------------------------------------------------
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[D&D - MoodboardBlock - onDragOver]', {
      target: e.target,
      currentTarget: e.currentTarget,
      draggedId: draggedImageId,
      dataTransferTypes: e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [],
      preventDefaultExecuted: true,
    });
    const types = e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [];
    if (types.includes('Files')) {
      setIsCanvasDragging(true);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[D&D - MoodboardBlock - onDragEnter]', {
      target: e.target,
      currentTarget: e.currentTarget,
      draggedId: draggedImageId,
      dataTransferTypes: e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [],
    });
    const types = e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [];
    if (types.includes('Files')) {
      setIsCanvasDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[D&D - MoodboardBlock - onDragLeave]', {
      target: e.target,
      currentTarget: e.currentTarget,
      draggedId: draggedImageId,
      dataTransferTypes: e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [],
    });
    setIsCanvasDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCanvasDragging(false);

    const payload = e.dataTransfer?.getData?.('text/plain') ?? '';
    console.log('[D&D - MoodboardBlock - onDrop]', {
      target: e.target,
      currentTarget: e.currentTarget,
      draggedId: draggedImageId,
      payload,
      dataTransferTypes: e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [],
    });

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

  // ---------------------------------------------------------------------------
  // Drag and Drop: Fluid Live Reordering & Section Moving
  // ---------------------------------------------------------------------------
  const commitImages = useCallback((updated: ReferenceImage[]) => {
    setImages(updated);
    try {
      const serializable = updated.map(({ id, path, name, sectionId, base64 }) => ({
        id,
        path,
        name,
        sectionId,
        base64,
      }));
      localStorage.setItem(MOODBOARD_CACHE_KEY, JSON.stringify(serializable));
    } catch {
      // ignore
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Drag and Drop: Fluid Live Reordering & Section Moving ("Hacer Hueco")
  // ---------------------------------------------------------------------------
  const displayImages = useMemo(() => {
    if (!draggedImageId) {
      return images;
    }

    const sourceIdx = images.findIndex((img) => img.id === draggedImageId);
    if (sourceIdx === -1) {
      return images;
    }

    const draggedItem = images[sourceIdx];

    // Priority 1: Hovering over another specific image card -> place precisely before or after it
    if (dragOverImageId && dragOverImageId !== draggedImageId) {
      const targetItem = images.find((img) => img.id === dragOverImageId);
      if (targetItem) {
        const next = images.filter((img) => img.id !== draggedImageId);
        const targetIdxInNext = next.findIndex((img) => img.id === dragOverImageId);
        if (targetIdxInNext !== -1) {
          const insertIdx = dragOverPosition === 'after' ? targetIdxInNext + 1 : targetIdxInNext;
          const updatedMoved: ReferenceImage = {
            ...draggedItem,
            sectionId: targetItem.sectionId,
          };
          next.splice(insertIdx, 0, updatedMoved);
          return next;
        }
      }
    }

    // Priority 2: Hovering over a section/folder container or header -> move to that folder
    if (dragOverSectionId && draggedItem.sectionId !== dragOverSectionId) {
      const next = images.filter((img) => img.id !== draggedImageId);
      const updatedMoved: ReferenceImage = {
        ...draggedItem,
        sectionId: dragOverSectionId,
      };
      const lastIndexInSection = next.map((img) => img.sectionId).lastIndexOf(dragOverSectionId);
      if (lastIndexInSection !== -1) {
        next.splice(lastIndexInSection + 1, 0, updatedMoved);
      } else {
        next.push(updatedMoved);
      }
      return next;
    }

    return images;
  }, [images, draggedImageId, dragOverImageId, dragOverPosition, dragOverSectionId]);

  const handleImageDragStart = (e: React.DragEvent, img: ReferenceImage) => {
    e.stopPropagation();
    dragNode.current = e.currentTarget as HTMLElement;
    setDraggedImageId(img.id);

    e.dataTransfer.setData('text/plain', img.id);
    e.dataTransfer.setData('text/image-id', img.id);
    e.dataTransfer.effectAllowed = 'move';
    console.log('[D&D - MoodboardBlock - onDragStart]', {
      target: e.target,
      currentTarget: e.currentTarget,
      draggedId: img.id,
      dataTransferTypes: e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [],
    });
  };

  const handleImageDragEnter = (e: React.DragEvent, targetImg: ReferenceImage) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[D&D - MoodboardBlock - onDragEnter]', {
      target: e.target,
      currentTarget: e.currentTarget,
      draggedId: draggedImageId,
      targetId: targetImg.id,
      dataTransferTypes: e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [],
    });
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
    const isAfter = offsetY > rect.height * 0.45;
    const newPos = isAfter ? 'after' : 'before';

    if (dragOverImageId !== targetImg.id || dragOverPosition !== newPos) {
      setDragOverImageId(targetImg.id);
      setDragOverPosition(newPos);
      setDragOverSectionId(targetImg.sectionId);
    }
  };

  const handleImageDragLeave = (e: React.DragEvent, _targetImg: ReferenceImage) => {
    e.stopPropagation();
    // Do not clear dragOverImageId on drag leave to prevent jitter oscillation when cards shift
  };

  const handleImageDropOnImage = (e: React.DragEvent, _targetImg: ReferenceImage) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('[D&D - MoodboardBlock - onDrop]', {
      target: e.target,
      currentTarget: e.currentTarget,
      draggedId: draggedImageId,
      displayImagesCount: displayImages.length,
    });

    try {
      if (draggedImageId && displayImages && displayImages.length > 0) {
        commitImages(displayImages);
      }
    } catch (error) {
      console.error('[D&D - MoodboardBlock - Drop Error]', error);
    } finally {
      dragItemIndex.current = null;
      dragNode.current = null;
      setDraggedImageId(null);
      setDragOverImageId(null);
      setDragOverSectionId(null);
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

    console.log('[D&D - MoodboardBlock - onDrop]', {
      target: e.target,
      currentTarget: e.currentTarget,
      draggedId: draggedImageId,
      sectionId,
      dataTransferTypes: e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [],
    });

    try {
      // If external files dropped on this section
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
        for (const file of files) {
          await uploadFile(file, sectionId);
        }
        return;
      }

      // Internal image dragged into this section
      if (draggedImageId && displayImages && displayImages.length > 0) {
        commitImages(displayImages);
      }
    } catch (error) {
      console.error('[D&D - MoodboardBlock - Section Drop Error]', error);
    } finally {
      dragItemIndex.current = null;
      dragNode.current = null;
      setDraggedImageId(null);
      setDragOverImageId(null);
      setDragOverSectionId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Sections Management
  // ---------------------------------------------------------------------------
  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    const newSection: MoodboardSection = {
      id: `sec-${Date.now()}`,
      name: newSectionName.trim(),
    };
    setSections((prev) => [...prev, newSection]);
    setNewSectionName('');
    setIsAddingSection(false);
  };

  const handleDeleteImage = useCallback(async (image: ReferenceImage) => {
    setErrorMessage(null);
    try {
      await invoke('delete_reference_image', { fileName: image.name });
      setImages((prev) => prev.filter((item) => item.path !== image.path));
      setActiveLightbox((current) => (current?.path === image.path ? null : current));
    } catch (err) {
      console.error('Failed to delete image:', err);
      setErrorMessage(String(err));
    }
  }, []);

  return (
    <>
      {activeLightbox && (
        <Lightbox
          image={activeLightbox}
          onClose={() => setActiveLightbox(null)}
          onDelete={handleDeleteImage}
        />
      )}

      {/* Multi-select File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/avif"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Main Block Container */}
      <div
        className={`border border-zinc-800 rounded-sm overflow-hidden bg-zinc-950 transition-colors ${
          isCanvasDragging ? 'border-zinc-500 bg-zinc-900/40' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Block Header */}
        <div className="flex items-center justify-between px-2.5 py-2 bg-zinc-900/60 border-b border-zinc-800/80 select-none">
          <div className="flex items-center gap-1.5 min-w-0">
            {collapsible && (
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                className="text-zinc-500 hover:text-zinc-300 transition shrink-0 cursor-pointer"
                aria-label={collapsed ? 'Expand moodboard' : 'Collapse moodboard'}
              >
                {collapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            <span className="text-[11px] font-semibold text-zinc-200 uppercase tracking-wider truncate font-mono">
              {title || t('visualReference')}
            </span>

            {images.length > 0 && (
              <span className="text-[10px] font-mono text-zinc-500 ml-1">
                ({images.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsAddingSection(!isAddingSection)}
              className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
              title={t('addFolderSection')}
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                targetUploadSectionRef.current = activeSectionId || 'general';
                fileInputRef.current?.click();
              }}
              disabled={uploading}
              className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
              title={`${t('addImages')} (${getSectionLabel(sections.find((s) => s.id === activeSectionId) || { id: 'general', name: 'General' })})`}
              aria-label={t('addImages')}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Section Addition Drawer */}
        {!collapsed && isAddingSection && (
          <div className="p-2 border-b border-zinc-800 bg-zinc-900/80 flex items-center gap-2">
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder={t('newSectionPlaceholder')}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSection();
                if (e.key === 'Escape') setIsAddingSection(false);
              }}
            />
            <button
              type="button"
              onClick={handleAddSection}
              disabled={!newSectionName.trim()}
              className="px-2.5 py-1 rounded-sm text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-100 disabled:opacity-40 transition cursor-pointer"
            >
              {t('add')}
            </button>
            <button
              type="button"
              onClick={() => setIsAddingSection(false)}
              className="p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Block Body: Collapsible Folders with Pinterest Masonry */}
        {!collapsed && (
          <div className="p-3 space-y-6 bg-zinc-950 min-h-[160px]">
            {errorMessage && (
              <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-sm bg-rose-950/50 border border-rose-900/80 text-[10px] text-rose-300">
                <span className="flex-1 leading-snug">{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="hover:text-rose-100 shrink-0 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-10 text-zinc-600">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              sections.map((sec) => {
                const sectionImages = displayImages.filter((img) => img.sectionId === sec.id);
                const isSectionCollapsed = !!collapsedSections[sec.id];
                const isOver = dragOverSectionId === sec.id;

                return (
                  <div
                    key={sec.id}
                    className="space-y-3"
                    onDragEnter={(e) => {
                      e.preventDefault();
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverSectionId(sec.id);
                    }}
                    onDragLeave={(e) => {
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      if (dragOverSectionId === sec.id && !dragOverImageId) setDragOverSectionId(null);
                    }}
                    onDrop={(e) => handleSectionDrop(e, sec.id)}
                  >
                    {/* Compact Folder Header: inline-flex w-max */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setActiveSectionId(sec.id);
                        toggleSectionCollapse(sec.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveSectionId(sec.id);
                          toggleSectionCollapse(sec.id);
                        }
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverSectionId(sec.id);
                        setDragOverImageId(null);
                        setCollapsedSections((prev) => ({ ...prev, [sec.id]: false }));
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverSectionId(sec.id);
                      }}
                      onDrop={(e) => handleSectionDrop(e, sec.id)}
                      className={`inline-flex w-max items-center gap-1.5 px-2.5 py-1 rounded-sm bg-zinc-900/90 hover:bg-zinc-855 border cursor-pointer select-none transition group ${
                        isOver
                          ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-950/40 text-emerald-200'
                          : activeSectionId === sec.id
                          ? 'border-zinc-700 bg-zinc-850 text-zinc-100'
                          : 'border-zinc-800 hover:border-zinc-700 text-zinc-300'
                      }`}
                      title="Click to select folder and toggle collapse"
                    >
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform duration-200 ${
                          isSectionCollapsed ? '' : 'rotate-90'
                        }`}
                      />
                      <Folder className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" />
                      <span className="text-xs font-medium text-zinc-200">{getSectionLabel(sec)}</span>
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.2 rounded-xs">
                        {sectionImages.length}
                      </span>
                    </div>

                    {/* Pinterest Masonry Grid when not collapsed (Clean space when empty) */}
                    {!isSectionCollapsed && (
                      <div
                        className="min-h-[48px] rounded-sm transition-all"
                        onDragEnter={(e) => {
                          e.preventDefault();
                          setDragOverSectionId(sec.id);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverSectionId(sec.id);
                        }}
                        onDrop={(e) => handleSectionDrop(e, sec.id)}
                      >
                        {sectionImages.length === 0 ? (
                          <div className="border border-dashed border-zinc-800/80 rounded-sm py-4 px-3 text-center text-zinc-600 text-xs font-mono select-none">
                            {t('dropImagesHereShort')}
                          </div>
                        ) : (
                          <div
                            className={
                              isExpanded
                                ? 'columns-2 sm:columns-3 md:columns-4 lg:columns-6 gap-4 space-y-4'
                                : 'columns-2 md:columns-4 gap-4 space-y-4'
                            }
                          >
                            {sectionImages.map((image) => (
                              <ThumbnailCard
                                key={image.id || image.path}
                                image={image}
                                cardRef={(el) => registerCard(image.id, el)}
                                isDragging={draggedImageId === image.id}
                                isDragOver={dragOverImageId === image.id && draggedImageId !== image.id}
                                anyDragging={Boolean(draggedImageId)}
                                onPreview={setActiveLightbox}
                                onDelete={handleDeleteImage}
                                onDragStart={handleImageDragStart}
                                onDragEnter={handleImageDragEnter}
                                onDragOver={handleImageDragOver}
                                onDragLeave={handleImageDragLeave}
                                onDrop={handleImageDropOnImage}
                                onDragEnd={handleImageDragEnd}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );
}
