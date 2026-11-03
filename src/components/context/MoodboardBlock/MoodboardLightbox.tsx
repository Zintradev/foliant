import { useEffect, memo } from 'react';
import { X, Trash2 } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-150 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] max-w-[92vw] flex flex-col items-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-fit max-w-full flex flex-col items-stretch">
          <div className="flex items-center justify-between w-full pb-2 px-1 gap-4">
            <span className="text-xs font-mono text-zinc-200 truncate" title={image.name}>
              {image.name}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(image);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 border border-rose-900/50 transition cursor-pointer"
                  title="Delete image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('delete')}</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-sm hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <img
            src={displaySrc}
            alt={image.name}
            className="max-h-[82vh] w-auto max-w-[88vw] object-contain rounded-sm border border-zinc-800 shadow-2xl transition-transform"
          />
        </div>
      </div>
    </div>
  );
});
