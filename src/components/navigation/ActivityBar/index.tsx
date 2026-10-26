import React, { useState, useRef, useEffect, memo } from 'react';
import { Menu, Feather } from 'lucide-react';
import { MainViewId } from '../../../types/navigation';
import { Language } from '../../../types/settings';
import { useTranslation } from '../../../i18n/translations';
import FileMenuDropdown from '../FileMenuDropdown';
import { SaveStatus } from '../../editor/FoliantEditor';
import { NAV_ITEMS } from './navItems';

export interface ActivityBarProps {
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

const ActivityBarNavList = memo(function ActivityBarNavList({
  activeView,
  onSelectView,
  translate,
}: {
  activeView: MainViewId;
  onSelectView: (view: MainViewId) => void;
  translate: (key: any, defaultVal: string) => string;
}) {
  return (
    <nav className="flex flex-col items-center gap-1 w-full px-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        const itemLabel = translate(item.labelKey, item.defaultLabel);
        const itemTooltip = translate(item.tooltipKey, item.defaultTooltip);

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
  );
});

const ActivityBarFooter = memo(function ActivityBarFooter({
  isAutoSave = true,
  saveStatus = 'idle',
  translate,
}: {
  isAutoSave?: boolean;
  saveStatus?: SaveStatus;
  translate: (key: any, defaultVal: string) => string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-full pt-2 pb-1">
      {isAutoSave && (
        <span
          className="flex items-center justify-center p-1 cursor-default transition"
          title={
            saveStatus === 'saving' || saveStatus === 'unsaved'
              ? translate('saving', 'Saving...')
              : translate('saved', 'Saved')
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
  );
});

export const ActivityBar = memo(function ActivityBar({
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
      aria-label="Main Navigation ActivityBar"
    >
      <div className="flex flex-col items-center gap-2.5 w-full relative">
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

          {isFileMenuOpen && (
            <FileMenuDropdown
              onClose={() => setIsFileMenuOpen(false)}
              onNewProject={onNewProject}
              onOpenProject={onOpenProject}
              onSaveProject={onSaveProject}
              onSaveProjectAs={onSaveProjectAs}
              onImportManuskript={onImportManuskript}
              onExportEpub={onExportEpub}
              onOpenSearch={onOpenSearch}
              onOpenSettings={onOpenSettings}
              language={language}
            />
          )}
        </div>

        <button
          onClick={() => onSelectView('write')}
          title="Foliant Workspace Studio"
          aria-label="Foliant Workspace Studio"
          className="p-2 rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-100 hover:text-white hover:border-zinc-700 transition"
        >
          <Feather className="w-4 h-4 text-zinc-200" />
          <span className="sr-only">Foliant</span>
        </button>

        <div className="w-6 h-[1px] bg-zinc-800" />

        <ActivityBarNavList
          activeView={activeView}
          onSelectView={onSelectView}
          translate={t}
        />
      </div>

      <ActivityBarFooter
        isAutoSave={isAutoSave}
        saveStatus={saveStatus}
        translate={t}
      />
    </aside>
  );
});

export default ActivityBar;
