import { useState, useRef, useCallback, useEffect } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import {
  Plus,
  Trash2,
  X,
  ZoomIn,
  ImageOff,
  Loader2,
  UploadCloud,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface ReferenceImage {
  /** Absolute path on disk returned by the Rust backend */
  path: string;
  /** Tauri asset URL safe for <img> tag inside the webview */
  src: string;
  /** Extracted filename for display and backend identification */
  name: string;
}

interface MoodboardBlockProps {
  /** Optional custom title for the section header */
  title?: string;
  /** Whether the block can be collapsed (defaults to true) */
  collapsible?: boolean;
  /** Initial collapsed state (defaults to false) */
  defaultCollapsed?: boolean;
  /** Whether the moodboard is being viewed in an expanded modal view */
  isExpanded?: boolean;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/** Extracts the base filename from any OS-specific file path. */
function extractFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

/** Converts an absolute file path to a ReferenceImage record. */
function toReferenceImage(absolutePath: string): ReferenceImage {
  return {
    path: absolutePath,
    src: convertFileSrc(absolutePath),
    name: extractFileName(absolutePath),
  };
}

// ---------------------------------------------------------------------------
// Minimalist Lightbox Component
// ---------------------------------------------------------------------------

interface LightboxProps {
  image: ReferenceImage;
  onClose: () => void;
}

function Lightbox({ image, onClose }: LightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Lightbox Topbar */}
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
        <button
          onClick={onClose}
          className="p-1.5 rounded-sm hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
          aria-label="Close preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Enlarged Image Display */}
      <div
        className="relative max-w-4xl max-h-[82vh] w-full px-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.src}
          alt={image.name}
          className="max-h-[80vh] w-auto max-w-full object-contain rounded-sm border border-zinc-800 shadow-2xl transition-transform"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image Thumbnail Card Component
// ---------------------------------------------------------------------------

interface ThumbnailCardProps {
  image: ReferenceImage;
  onPreview: (img: ReferenceImage) => void;
  onDelete: (img: ReferenceImage) => void;
}

function ThumbnailCard({ image, onPreview, onDelete }: ThumbnailCardProps) {
  const [loadError, setLoadError] = useState(false);

  return (
    <div
      className="group relative aspect-square rounded-sm overflow-hidden border border-zinc-800 bg-zinc-900 cursor-pointer transition-colors hover:border-zinc-700"
      onClick={() => onPreview(image)}
    >
      {loadError ? (
        <div className="flex flex-col items-center justify-center w-full h-full gap-1 p-2 text-zinc-600 select-none">
          <ImageOff className="w-5 h-5 text-zinc-600" />
          <span className="text-[10px] text-center truncate w-full">
            {image.name}
          </span>
        </div>
      ) : (
        <img
          src={image.src}
          alt={image.name}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          onError={() => setLoadError(true)}
          loading="lazy"
        />
      )}

      {/* Floating Action Overlay on Hover */}
      <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(image);
          }}
          className="p-1.5 rounded-sm bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition shadow-xs"
          title="Zoom image"
          aria-label="Zoom image"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(image);
          }}
          className="p-1.5 rounded-sm bg-zinc-900/90 hover:bg-rose-950/90 text-zinc-300 hover:text-rose-400 border border-zinc-700/60 hover:border-rose-800/80 transition shadow-xs"
          title="Delete image"
          aria-label="Delete image"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Image Name Tooltip Tag */}
      <div className="absolute bottom-0 inset-x-0 px-1.5 py-0.5 bg-zinc-950/85 backdrop-blur-xs text-[9px] text-zinc-300 font-mono truncate opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {image.name}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MoodboardBlock Main Component
// ---------------------------------------------------------------------------

export default function MoodboardBlock({
  title = 'Moodboard',
  collapsible = true,
  defaultCollapsed = false,
  isExpanded = false,
}: MoodboardBlockProps) {
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [activeLightbox, setActiveLightbox] = useState<ReferenceImage | null>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Load Images via Tauri IPC
  // ---------------------------------------------------------------------------
  const fetchImages = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const paths = await invoke<string[]>('list_reference_images');
      setImages(paths.map(toReferenceImage));
    } catch (err) {
      console.error('Failed to load reference images:', err);
      setErrorMessage(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // ---------------------------------------------------------------------------
  // Upload Processing (Native Path or Base64 Fallback)
  // ---------------------------------------------------------------------------
  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setErrorMessage(null);

    try {
      // In Tauri desktop webview, File objects expose the OS-level path property
      const nativePath: string | undefined = (file as unknown as { path?: string }).path;
      let savedPath: string;

      if (nativePath) {
        // Fast path: Copy file directly via Rust backend
        savedPath = await invoke<string>('save_reference_image', {
          sourcePath: nativePath,
          fileName: file.name,
        });
      } else {
        // Web fallback: Read as base64 data URL and save
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        savedPath = await invoke<string>('save_reference_image_base64', {
          fileName: file.name,
          dataBase64: base64Data,
        });
      }

      setImages((prev) => {
        if (prev.some((img) => img.path === savedPath)) {
          return prev;
        }
        return [...prev, toReferenceImage(savedPath)];
      });
    } catch (err) {
      console.error('Failed to upload image:', err);
      setErrorMessage(String(err));
    } finally {
      setUploading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // File Input Handler
  // ---------------------------------------------------------------------------
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
    // Reset input so the user can re-upload an identical filename if desired
    e.target.value = '';
  };

  // ---------------------------------------------------------------------------
  // Drag and Drop Handlers
  // ---------------------------------------------------------------------------
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        await uploadFile(file);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Delete Handler
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Lightbox Modal */}
      {activeLightbox && (
        <Lightbox
          image={activeLightbox}
          onClose={() => setActiveLightbox(null)}
        />
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/avif"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Main Block Container */}
      <div
        className={`border border-zinc-800 rounded-sm overflow-hidden bg-zinc-950 transition-colors ${
          isDragging ? 'border-zinc-500 bg-zinc-900/40' : ''
        }`}
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
                className="text-zinc-500 hover:text-zinc-300 transition shrink-0"
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
              {title}
            </span>

            {images.length > 0 && (
              <span className="text-[10px] font-mono text-zinc-500 ml-1">
                ({images.length})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition disabled:opacity-50"
            title="Add Image"
            aria-label="Add Image"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Block Body */}
        {!collapsed && (
          <div className="p-2.5 space-y-2 bg-zinc-950">
            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-sm bg-rose-950/50 border border-rose-900/80 text-[10px] text-rose-300">
                <span className="flex-1 leading-snug">{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="hover:text-rose-100 shrink-0"
                  aria-label="Dismiss error"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Thumbnail Grid / State Displays */}
            {loading ? (
              <div className="flex items-center justify-center py-6 text-zinc-600">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : images.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-1.5 py-6 px-3 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-sm bg-zinc-900/20 cursor-pointer transition text-zinc-500 hover:text-zinc-400 text-center"
              >
                <UploadCloud className="w-5 h-5" />
                <span className="text-[11px] font-medium text-zinc-300">Drop images here</span>
                <span className="text-[9px] text-zinc-500">or click to browse files</span>
              </div>
            ) : (
              <div
                className={
                  isExpanded
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3'
                    : 'grid grid-cols-2 gap-1.5'
                }
              >
                {images.map((image) => (
                  <ThumbnailCard
                    key={image.path}
                    image={image}
                    onPreview={setActiveLightbox}
                    onDelete={handleDeleteImage}
                  />
                ))}
              </div>
            )}

            {/* "+ Add Image" Action Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded-sm text-[11px] font-medium text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                  <span>Adding Image...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Image</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
