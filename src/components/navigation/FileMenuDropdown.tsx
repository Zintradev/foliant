import {
  FolderOpen,
  Save,
  FilePlus,
  FileText,
  FolderInput,
  BookUp,
  Search,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { useTranslation } from '../../i18n/translations';
import { Language } from '../../types/settings';

export interface FileMenuDropdownProps {
  onClose: () => void;
  onNewProject?: () => void;
  onOpenProject?: () => void;
  onSaveProject?: () => void;
  onSaveProjectAs?: () => void;
  onImportManuskript?: () => void;
  onExportEpub?: () => void;
  onOpenSearch?: () => void;
  onOpenSettings?: () => void;
  language?: Language;
}

export default function FileMenuDropdown({
  onClose,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onSaveProjectAs,
  onImportManuskript,
  onExportEpub,
  onOpenSearch,
  onOpenSettings,
  language = 'en',
}: FileMenuDropdownProps) {
  const { t } = useTranslation(language);

  return (
    <div className="absolute left-12 top-0 z-[80] min-w-[210px] bg-zinc-900 border border-zinc-800 rounded-md shadow-2xl py-1.5 text-xs text-zinc-300 animate-in fade-in zoom-in-95 duration-100">
      <div className="px-3 py-1 text-[10px] font-mono tracking-wider text-zinc-500 uppercase border-b border-zinc-800/80 mb-1">
        {t('foliantProject', 'Foliant Project')}
      </div>

      {onNewProject && (
        <button
          onClick={() => {
            onClose();
            onNewProject();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800 hover:text-white transition text-left cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FilePlus className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('newProject', 'New Project')}</span>
          </span>
        </button>
      )}

      {onOpenProject && (
        <button
          onClick={() => {
            onClose();
            onOpenProject();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800 hover:text-white transition text-left cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('openProject', 'Open Project...')}</span>
          </span>
          <span className="text-[10px] font-mono text-zinc-500">Ctrl+O</span>
        </button>
      )}

      {onSaveProject && (
        <button
          onClick={() => {
            onClose();
            onSaveProject();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800 hover:text-white transition text-left cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Save className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('saveProject', 'Save')}</span>
          </span>
          <span className="text-[10px] font-mono text-zinc-500">Ctrl+S</span>
        </button>
      )}

      {onSaveProjectAs && (
        <button
          onClick={() => {
            onClose();
            onSaveProjectAs();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800 hover:text-white transition text-left cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('saveProjectAs', 'Save As...')}</span>
          </span>
          <span className="text-[10px] font-mono text-zinc-500">Ctrl+Shift+S</span>
        </button>
      )}

      <div className="my-1.5 h-[1px] bg-zinc-800/80" />

      <div className="px-3 py-1 text-[10px] font-mono tracking-wider text-zinc-500 uppercase border-b border-zinc-800/80 mb-1">
        {t('dataTransfer', 'Data Transfer')}
      </div>

      {onImportManuskript && (
        <button
          onClick={() => {
            onClose();
            onImportManuskript();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800 hover:text-white transition text-left cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FolderInput className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('importManuskript', 'Import Manuskript Project...')}</span>
          </span>
        </button>
      )}

      {onExportEpub && (
        <button
          onClick={() => {
            onClose();
            onExportEpub();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800 hover:text-white transition text-left cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <BookUp className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('exportEpub', 'Export to EPUB...')}</span>
          </span>
        </button>
      )}

      <div className="my-1.5 h-[1px] bg-zinc-800/80" />

      {onOpenSearch && (
        <button
          onClick={() => {
            onClose();
            onOpenSearch();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800 hover:text-white transition text-left cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('search', 'Search')}</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+F</span>
        </button>
      )}

      {onOpenSettings && (
        <button
          onClick={() => {
            onClose();
            onOpenSettings();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800 hover:text-white transition text-left cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('studioSettings', 'Studio Settings')}</span>
          </span>
        </button>
      )}

      <div className="my-1.5 h-[1px] bg-zinc-800/80" />

      <a
        href="../"
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800 hover:text-white transition text-left cursor-pointer group text-zinc-300 no-underline"
        title={t('backToLanding', 'Volver a la portada')}
      >
        <span className="flex items-center gap-2">
          <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition" />
          <span>{t('backToLanding', 'Volver a la portada')}</span>
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">Web</span>
      </a>
    </div>
  );
}
