import React, { memo } from 'react';
import {
  FileText,
  User,
  Building2,
  Languages,
  Smartphone,
  ListTree,
} from 'lucide-react';
import { ExportProfile } from '../../../utils/exportEpub';
import { useTranslation } from '../../../i18n/translations';
import ExportCoverUploader from './ExportCoverUploader';

interface ExportMetadataTabProps {
  title: string;
  author: string;
  publisher: string;
  language: string;
  profile: ExportProfile;
  includeVisualToc: boolean;
  coverBase64: string | null;
  coverFileName: string | null;
  isDragging: boolean;
  isExporting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onTitleChange: (val: string) => void;
  onAuthorChange: (val: string) => void;
  onPublisherChange: (val: string) => void;
  onLanguageChange: (val: string) => void;
  onProfileChange: (val: ExportProfile) => void;
  onIncludeVisualTocChange: (val: boolean) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDropFile: (file: File) => void;
  onRemoveCover: (e: React.MouseEvent) => void;
  setIsDragging: (val: boolean) => void;
}

function ExportMetadataTab({
  title,
  author,
  publisher,
  language,
  profile,
  includeVisualToc,
  coverBase64,
  coverFileName,
  isDragging,
  isExporting,
  fileInputRef,
  onTitleChange,
  onAuthorChange,
  onPublisherChange,
  onLanguageChange,
  onProfileChange,
  onIncludeVisualTocChange,
  onFileInputChange,
  onDropFile,
  onRemoveCover,
  setIsDragging,
}: ExportMetadataTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 animate-in fade-in duration-100">
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            {t('bookTitle')}
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. The Chronicles of Foliant"
            disabled={isExporting}
            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            {t('authorName')}
          </label>
          <input
            type="text"
            required
            value={author}
            onChange={(e) => onAuthorChange(e.target.value)}
            placeholder="e.g. Jane Doe"
            disabled={isExporting}
            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>

        <div>
          <label className="flex items-center justify-between text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              {t('publisherYear')}
            </span>
            <span className="text-[11px] font-normal text-zinc-500">
              {t('optional')}
            </span>
          </label>
          <input
            type="text"
            value={publisher}
            onChange={(e) => onPublisherChange(e.target.value)}
            placeholder="e.g. Acme Publishing · 2026"
            disabled={isExporting}
            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            {t('bookLanguage')}
          </label>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            disabled={isExporting}
            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-zinc-100 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
          >
            <option value="es">Español (es)</option>
            <option value="en">English (en)</option>
            <option value="fr">Français (fr)</option>
            <option value="de">Deutsch (de)</option>
            <option value="it">Italiano (it)</option>
            <option value="pt">Português (pt)</option>
            <option value="ca">Català (ca)</option>
            <option value="gl">Galego (gl)</option>
            <option value="eu">Euskara (eu)</option>
          </select>
          <p className="mt-1 text-[11px] text-zinc-400">
            {t('hyphenationNote')}
          </p>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            {t('readingTarget')}
          </label>
          <select
            value={profile}
            onChange={(e) => onProfileChange(e.target.value as ExportProfile)}
            disabled={isExporting}
            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-zinc-100 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
          >
            <option value="standard">{t('profileStandard')}</option>
            <option value="amazon">{t('profileAmazon')}</option>
          </select>
          <p className="mt-1 text-[11px] text-zinc-400">
            {profile === 'amazon'
              ? t('profileAmazonDesc')
              : t('profileStandardDesc')}
          </p>
        </div>

        {/* Visual Table of Contents Toggle */}
        <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-750/80">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeVisualToc}
              onChange={(e) => onIncludeVisualTocChange(e.target.checked)}
              disabled={isExporting}
              className="w-4 h-4 mt-0.5 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-1 cursor-pointer accent-emerald-500 transition shrink-0"
            />
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <ListTree className="w-3.5 h-3.5 text-emerald-400" />
                {t('includeVisualToc')}
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {t('visualTocDesc')}
              </p>
            </div>
          </label>
        </div>
      </div>

      <ExportCoverUploader
        coverBase64={coverBase64}
        coverFileName={coverFileName}
        isDragging={isDragging}
        isExporting={isExporting}
        fileInputRef={fileInputRef}
        onFileInputChange={onFileInputChange}
        onDropFile={onDropFile}
        onRemoveCover={onRemoveCover}
        setIsDragging={setIsDragging}
      />
    </div>
  );
}

export default memo(ExportMetadataTab);
