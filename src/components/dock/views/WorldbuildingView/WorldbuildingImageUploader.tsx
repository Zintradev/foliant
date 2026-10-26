import React, { memo } from 'react';
import { Camera } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';

interface WorldbuildingImageUploaderProps {
  imageUrl?: string;
  avatarUrl?: string;
  title: string;
  onUpdateImage: (base64: string | undefined) => void;
}

function WorldbuildingImageUploaderComponent({
  imageUrl,
  avatarUrl,
  title,
  onUpdateImage,
}: WorldbuildingImageUploaderProps) {
  const { t } = useTranslation();
  const currentImage = imageUrl || avatarUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        onUpdateImage(base64);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-2 pt-3 border-t border-zinc-850">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
          <Camera className="w-3 h-3 text-zinc-500" />
          {t('attachedImage')}
        </label>
        {currentImage && (
          <button
            type="button"
            onClick={() => onUpdateImage(undefined)}
            className="text-[10px] font-mono text-zinc-500 hover:text-rose-400 transition cursor-pointer"
          >
            {t('removeImage')}
          </button>
        )}
      </div>

      {currentImage ? (
        <div className="relative group rounded-sm overflow-hidden border border-zinc-800 bg-zinc-950 flex flex-col items-center">
          <img
            src={currentImage}
            alt={title}
            className="w-full max-h-96 object-contain rounded-sm"
          />
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-md px-2 py-1 rounded-sm border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
            <label className="text-[11px] font-mono text-zinc-200 hover:text-white cursor-pointer flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              <span>{t('changeImage')}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-6 border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 hover:bg-zinc-900/60 rounded-sm cursor-pointer transition text-zinc-400 hover:text-zinc-200">
          <Camera className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-xs font-medium">{t('attachImage')}</span>
          <span className="text-[10px] text-zinc-600 mt-0.5">PNG, JPG, WEBP</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}
    </div>
  );
}

export const WorldbuildingImageUploader = memo(WorldbuildingImageUploaderComponent);
