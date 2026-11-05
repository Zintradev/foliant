import React, { memo, useRef, useState, useCallback } from 'react';
import {
  BookOpen,
  User,
  AlignLeft,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';

export interface NovelDetailsSectionProps {
  title: string;
  author?: string;
  synopsis?: string;
  cover?: string;
  coverFileName?: string;
  currentFilePath?: string | null;
  onUpdateMetadata?: (updates: {
    title?: string;
    author?: string;
    synopsis?: string;
    cover?: string;
    coverFileName?: string;
  }) => void;
}

export const NovelDetailsSection = memo(function NovelDetailsSection({
  title,
  author = '',
  synopsis = '',
  cover,
  coverFileName,
  onUpdateMetadata,
}: NovelDetailsSectionProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [titleTouched, setTitleTouched] = useState(false);

  // Sync title from props if changed externally
  React.useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalTitle(val);
    setTitleTouched(true);
    onUpdateMetadata?.({ title: val });
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateMetadata?.({ author: e.target.value });
  };

  const handleSynopsisChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateMetadata?.({ synopsis: e.target.value });
  };

  const handleProcessFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert(t('invalidImageAlert'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateMetadata?.({
            cover: reader.result,
            coverFileName: file.name,
          });
        }
      };
      reader.readAsDataURL(file);
    },
    [onUpdateMetadata]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // reset input so the same file can be re-selected if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateMetadata?.({
      cover: undefined,
      coverFileName: undefined,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isTitleInvalid = titleTouched && !localTitle.trim();

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Form Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Text Fields Column (Left / Main) */}
          <div className="md:col-span-7 space-y-5">
            {/* Novel Title Field (Required) */}
            <div className="space-y-1.5">
              <label
                htmlFor="novel-title-input"
                className="flex items-center justify-between text-xs font-semibold text-zinc-200 uppercase tracking-wider"
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('novelTitle', 'Nombre de la novela')}</span>
                  <span className="text-rose-400 font-bold">*</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400/90 font-normal lowercase bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  {t('required', 'Requerido')}
                </span>
              </label>

              <input
                id="novel-title-input"
                type="text"
                required
                value={localTitle}
                onChange={handleTitleChange}
                onBlur={() => setTitleTouched(true)}
                placeholder={t('novelTitlePlaceholder')}
                spellCheck={false}
                className={`w-full px-3 py-2 text-sm rounded-md bg-zinc-900 border text-zinc-100 placeholder-zinc-500 focus:outline-hidden transition ${
                  isTitleInvalid
                    ? 'border-rose-500 ring-1 ring-rose-500/40 focus:border-rose-500'
                    : 'border-zinc-750 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40'
                }`}
              />

              {isTitleInvalid ? (
                <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('novelTitleRequired', 'El nombre de la novela es obligatorio.')}</span>
                </p>
              ) : (
                <p className="text-[11px] text-zinc-500">
                  {t('novelTitleHint')}
                </p>
              )}
            </div>

            {/* Author Field (Optional) */}
            <div className="space-y-1.5">
              <label
                htmlFor="novel-author-input"
                className="flex items-center justify-between text-xs font-semibold text-zinc-300 uppercase tracking-wider"
              >
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t('author', 'Autor')}</span>
                </span>
                <span className="text-[10px] font-normal text-zinc-500 lowercase">
                  {t('optional', 'Opcional')}
                </span>
              </label>

              <input
                id="novel-author-input"
                type="text"
                value={author}
                onChange={handleAuthorChange}
                placeholder={t('novelAuthorPlaceholder')}
                spellCheck={false}
                className="w-full px-3 py-2 text-sm rounded-md bg-zinc-900 border border-zinc-750 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500/40 transition"
              />
              <p className="text-[11px] text-zinc-500">
                {t('novelAuthorHint')}
              </p>
            </div>

            {/* Synopsis Field (Optional) */}
            <div className="space-y-1.5">
              <label
                htmlFor="novel-synopsis-textarea"
                className="flex items-center justify-between text-xs font-semibold text-zinc-300 uppercase tracking-wider"
              >
                <span className="flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t('synopsis', 'Sinopsis')}</span>
                </span>
                <span className="text-[10px] font-normal text-zinc-500 lowercase">
                  {t('optional', 'Opcional')}
                </span>
              </label>

              <textarea
                id="novel-synopsis-textarea"
                rows={5}
                value={synopsis}
                onChange={handleSynopsisChange}
                placeholder={t('novelSynopsisPlaceholder')}
                spellCheck={false}
                className="w-full px-3 py-2 text-sm rounded-md bg-zinc-900 border border-zinc-750 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500/40 transition resize-y"
              />
              <p className="text-[11px] text-zinc-500">
                {t('novelSynopsisHint')}
              </p>
            </div>
          </div>

          {/* Cover Column (Right) */}
          <div className="md:col-span-5 space-y-2">
            <label className="flex items-center justify-between text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('coverImage', 'Portada')}</span>
              </span>
              <span className="text-[10px] font-normal text-zinc-500 lowercase">
                {t('optional', 'Opcional')}
              </span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {cover ? (
              <div className="p-4 rounded-lg border border-zinc-750 bg-zinc-900/60 flex flex-col items-center text-center space-y-3 group shadow-md">
                <div className="relative w-40 h-56 rounded-md overflow-hidden bg-black/60 border border-zinc-700 shadow-lg flex items-center justify-center">
                  <img
                    src={cover}
                    alt={t('novelCoverAlt')}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="w-full">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-medium">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{t('coverReady', 'Portada lista')}</span>
                  </div>
                  {coverFileName && (
                    <p className="text-[11px] text-zinc-400 truncate max-w-[200px] mx-auto mt-0.5">
                      {coverFileName}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                  >
                    {t('changeCover', 'Cambiar imagen')}
                  </button>
                  <span className="text-zinc-600">•</span>
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{t('removeCover', 'Eliminar portada')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleProcessFile(file);
                }}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition select-none min-h-[224px] ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400'
                    : 'border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/70 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="p-3 rounded-full bg-zinc-850 border border-zinc-750 mb-2">
                  <UploadCloud className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-xs font-medium text-zinc-200 text-center">
                  {t('dropCoverHere', 'Haz clic o arrastra aquí la portada de la novela')}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1 text-center">
                  {t('dropCoverHint', 'Formatos admitidos: JPEG, PNG, WEBP')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default NovelDetailsSection;

