import React, { useState, useRef, useEffect } from 'react';
import {
  Feather,
  BookOpen,
  GitMerge,
  BarChart3,
  BookMarked,
  Users,
  Globe,
  Image as ImageIcon,
  Settings,
  Clock,
  Network,
  FolderOpen,
  Save,
  Menu,
  FilePlus,
  FileText,
  FolderInput,
  BookUp,
  Search,
} from 'lucide-react';
import { MainViewId } from '../../types/navigation';
import { Language } from '../../types/settings';
import { useTranslation, TranslationKey } from '../../i18n/translations';
import { SaveStatus } from '../editor/FoliantEditor';

interface ActivityBarProps {
  activeView: MainViewId;
  onSelectView: (view: MainViewId) => void;
  language?: Language;
  saveStatus?: SaveStatus;
  isAutoSave?: boolean;
  onOpenSettings?: () => void;
  onNewProject?: () => void;
  onOpenProject?: () => void;
  onSaveProject?: () => void;
  onSaveProjectAs?: () => void;
  onImportManuskript?: () => void;
  onExportEpub?: () => void;
  onOpenSearch?: () => void;
}

interface NavItem {
  id: MainViewId;
  labelKey: TranslationKey;
  tooltipKey: TranslationKey;
  defaultLabel: string;
  defaultTooltip: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'write',
    labelKey: 'actWrite',
    tooltipKey: 'actWriteTooltip',
    defaultLabel: 'Editor',
    defaultTooltip: 'Writing Workspace & Chapters',
    icon: Feather,
  },
  {
    id: 'outline',
    labelKey: 'actOutline',
    tooltipKey: 'actOutlineTooltip',
    defaultLabel: 'Outline',
    defaultTooltip: 'Project Structure & Outline',
    icon: BookOpen,
  },
  {
    id: 'search',
    labelKey: 'search',
    tooltipKey: 'search',
    defaultLabel: 'Search',
    defaultTooltip: 'Search Manuscript (Ctrl+Shift+F)',
    icon: Search,
  },
  {
    id: 'timeline',
    labelKey: 'actTimeline',
    tooltipKey: 'actTimelineTooltip',
    defaultLabel: 'Timeline',
    defaultTooltip: 'Chronological Scene Timeline',
    icon: Clock,
  },
  {
    id: 'relationships',
    labelKey: 'actGraph',
    tooltipKey: 'actGraphTooltip',
    defaultLabel: 'Graph',
    defaultTooltip: 'Character Relationship Graph',
    icon: Network,
  },
  {
    id: 'storyline',
    labelKey: 'actStories',
    tooltipKey: 'actStoriesTooltip',
    defaultLabel: 'Stories',
    defaultTooltip: 'Storylines & Narrative Threads',
    icon: GitMerge,
  },
  {
    id: 'stats',
    labelKey: 'actStats',
    tooltipKey: 'actStatsTooltip',
    defaultLabel: 'Stats',
    defaultTooltip: 'Project Analytics & Target Tracking',
    icon: BarChart3,
  },
  {
    id: 'context',
    labelKey: 'actNotes',
    tooltipKey: 'actNotesTooltip',
    defaultLabel: 'Notes',
    defaultTooltip: 'Notes & Reference Context',
    icon: BookMarked,
  },
  {
    id: 'characters',
    labelKey: 'actCast',
    tooltipKey: 'actCastTooltip',
    defaultLabel: 'Cast',
    defaultTooltip: 'Characters & Entities',
    icon: Users,
  },
  {
    id: 'worldbuilding',
    labelKey: 'actWorld',
    tooltipKey: 'actWorldTooltip',
    defaultLabel: 'World',
    defaultTooltip: 'Worldbuilding & Lore',
    icon: Globe,
  },
  {
    id: 'moodboard',
    labelKey: 'actVisuals',
    tooltipKey: 'actVisualsTooltip',
    defaultLabel: 'Visuals',
    defaultTooltip: 'Visual Moodboard',
    icon: ImageIcon,
  },
];

export default function ActivityBar({
  activeView,
  onSelectView,
  language = 'en',
  saveStatus = 'idle',
  isAutoSave = true,
  onOpenSettings,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onSaveProjectAs,
  onImportManuskript,
  onExportEpub,
  onOpenSearch,
}: ActivityBarProps) {
  const { t } = useTranslation(language);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFileMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsFileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFileMenuOpen]);

  return (
    <aside
      className={`w-14 shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between items-center py-2.5 select-none relative ${
        isFileMenuOpen ? 'z-[70]' : 'z-40'
      }`}
      aria-label="Main Navigation Activity Bar"
    >
      {/* Top: File Menu + brand logo + all navigation items */}
      <div className="flex flex-col items-center gap-2.5 w-full relative">
        {/* Main Hamburger / File Menu Button */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setIsFileMenuOpen((prev) => !prev)}
            title="File Menu"
            aria-label="File Menu"
            className={`p-1.5 rounded-sm transition ${
              isFileMenuOpen
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {isFileMenuOpen && (
            <div className="absolute left-12 top-0 z-[80] min-w-[210px] bg-zinc-900 border border-zinc-800 rounded-md shadow-2xl py-1.5 text-xs text-zinc-300 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-mono tracking-wider text-zinc-500 uppercase border-b border-zinc-800/80 mb-1">
                {t('foliantProject', 'Foliant Project')}
              </div>

              {onNewProject && (
                <button
                  onClick={() => {
                    setIsFileMenuOpen(false);
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
                    setIsFileMenuOpen(false);
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
                    setIsFileMenuOpen(false);
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
                    setIsFileMenuOpen(false);
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
                    setIsFileMenuOpen(false);
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
                    setIsFileMenuOpen(false);
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
                    setIsFileMenuOpen(false);
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
                    setIsFileMenuOpen(false);
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
            </div>
          )}
        </div>

        {/* Foliant brand button — always returns to the editor */}
        <button
          onClick={() => onSelectView('write')}
          title="Foliant Workspace Studio"
          aria-label="Foliant Workspace Studio"
          className="p-2 rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-100 hover:text-white hover:border-zinc-700 transition"
        >
          <Feather className="w-4 h-4 text-zinc-200" />
          <span className="sr-only">Foliant</span>
        </button>

        {/* Divider */}
        <div className="w-6 h-[1px] bg-zinc-800" />

        {/* Navigation items */}
        <nav className="flex flex-col items-center gap-1 w-full px-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const itemLabel = t(item.labelKey, item.defaultLabel);
            const itemTooltip = t(item.tooltipKey, item.defaultTooltip);

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                title={itemTooltip}
                className={`relative group flex flex-col items-center justify-center w-full py-2 rounded-sm transition text-[10px] font-medium cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-zinc-100 border-l-2 border-zinc-200'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-l-2 border-transparent'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 mb-1 ${
                    isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                <span className="leading-none tracking-tight text-[9px]">{itemLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: auto-save indicator & version info */}
      <div className="flex flex-col items-center gap-1.5 w-full pt-2 pb-1">
        {isAutoSave && (
          <span
            className="flex items-center justify-center p-1 cursor-default transition"
            title={
              saveStatus === 'saving' || saveStatus === 'unsaved'
                ? t('saving', 'Saving...')
                : t('saved', 'Saved')
            }
          >
            <span
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                saveStatus === 'saving' || saveStatus === 'unsaved'
                  ? 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                  : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
              }`}
            />
          </span>
        )}
        <span className="text-[8px] font-mono text-zinc-600">v0.1</span>
      </div>
    </aside>
  );
}
