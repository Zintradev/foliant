import React, { useRef, memo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FolderPlus,
  Plus,
  X,
} from 'lucide-react';
import { useTranslation } from '../../../i18n/translations';

interface MoodboardHeaderProps {
  title?: string;
  imagesCount: number;
  collapsible: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isAddingSection: boolean;
  onToggleAddSection: () => void;
  newSectionName: string;
  onNewSectionNameChange: (val: string) => void;
  onAddSection: () => void;
  uploading: boolean;
  activeSectionLabel: string;
  onFilesSelected: (files: File[]) => void;
}

export const MoodboardHeader = memo(function MoodboardHeader({
  title,
  imagesCount,
  collapsible,
  collapsed,
  onToggleCollapse,
  isAddingSection,
  onToggleAddSection,
  newSectionName,
  onNewSectionNameChange,
  onAddSection,
  uploading,
  activeSectionLabel,
  onFilesSelected,
}: MoodboardHeaderProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      onFilesSelected(Array.from(fileList));
    }
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/avif"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="flex items-center justify-between px-2.5 py-2 bg-zinc-900/60 border-b border-zinc-800/80 select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          {collapsible && (
            <button
              type="button"
              onClick={onToggleCollapse}
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

          {imagesCount > 0 && (
            <span className="text-[10px] font-mono text-zinc-500 ml-1">
              ({imagesCount})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleAddSection}
            className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
            title={t('addFolderSection')}
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
            title={`${t('addImages')} (${activeSectionLabel})`}
            aria-label={t('addImages')}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!collapsed && isAddingSection && (
        <div className="p-2 border-b border-zinc-800 bg-zinc-900/80 flex items-center gap-2">
          <input
            type="text"
            value={newSectionName}
            onChange={(e) => onNewSectionNameChange(e.target.value)}
            placeholder={t('newSectionPlaceholder')}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAddSection();
              if (e.key === 'Escape') onToggleAddSection();
            }}
          />
          <button
            type="button"
            onClick={onAddSection}
            disabled={!newSectionName.trim()}
            className="px-2.5 py-1 rounded-sm text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-100 disabled:opacity-40 transition cursor-pointer"
          >
            {t('add')}
          </button>
          <button
            type="button"
            onClick={onToggleAddSection}
            className="p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
});
