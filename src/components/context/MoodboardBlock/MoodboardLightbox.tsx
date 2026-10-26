import { useEffect, memo } from 'react';
import { Sparkles, X, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../i18n/translations';
import { ReferenceImage } from './types';

interface MoodboardLightboxProps {
  image: ReferenceImage;
  onClose: () => void;
  onDelete?: (img: ReferenceImage) => void;
}

export const MoodboardLightbox = memo(function MoodboardLightbox({
  image,
  onClose,
  onDelete,
}: MoodboardLightboxProps) {
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
});
