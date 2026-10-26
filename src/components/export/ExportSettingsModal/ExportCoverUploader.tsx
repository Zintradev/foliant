import React, { memo } from 'react';
import { Image as ImageIcon, UploadCloud, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../i18n/translations';

interface ExportCoverUploaderProps {
  coverBase64: string | null;
  coverFileName: string | null;
  isDragging: boolean;
  isExporting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDropFile: (file: File) => void;
  onRemoveCover: (e: React.MouseEvent) => void;
  setIsDragging: (val: boolean) => void;
}

function ExportCoverUploader({
  coverBase64,
  coverFileName,
  isDragging,
  isExporting,
  fileInputRef,
  onFileInputChange,
  onDropFile,
  onRemoveCover,
  setIsDragging,
}: ExportCoverUploaderProps) {
  const { t } = useTranslation();

  return (
    <div>
      <label className="flex items-center justify-between text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
        <span className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          Cover Image (Portada)
        </span>
        <span className="text-[11px] font-normal text-zinc-500">
          {t('optional')}
        </span>
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileInputChange}
        disabled={isExporting}
      />

      {coverBase64 ? (
        <div className="relative flex items-center gap-4 p-3.5 rounded-lg border border-zinc-700/80 bg-zinc-900/60 group">
          <div className="relative w-20 h-28 shrink-0 rounded-md overflow-hidden bg-black/60 border border-zinc-700 shadow-md flex items-center justify-center">
            <img
              src={coverBase64}
              alt="Cover preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 rounded-sm">
                Cover Ready
              </span>
            </div>
            <p className="text-xs font-medium text-zinc-200 truncate">
              {coverFileName || 'cover-image.jpg'}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Will be generated as the first page (cover.xhtml) and declared in the OPF manifest.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExporting}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
              >
                Change image
              </button>
              <span className="text-zinc-600">•</span>
              <button
                type="button"
                onClick={onRemoveCover}
                disabled={isExporting}
                className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isExporting && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) onDropFile(file);
          }}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition select-none ${
            isDragging
              ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400'
              : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 text-zinc-400'
          }`}
        >
          <div className="p-3 rounded-full bg-zinc-850/80 border border-zinc-750 mb-2">
            <UploadCloud className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-xs font-medium text-zinc-200 text-center">
            Click or drag and drop your book cover here
          </p>
          <p className="text-[11px] text-zinc-500 mt-1 text-center">
            Supports JPEG, PNG, WEBP (Recommended: 1600 × 2560 px)
          </p>
        </div>
      )}
    </div>
  );
}

export default memo(ExportCoverUploader);
