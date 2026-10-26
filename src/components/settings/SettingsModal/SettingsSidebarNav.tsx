import React from 'react';
import { Globe, Palette, Sliders, Layers } from 'lucide-react';
import { SettingsSection } from './types';

interface SettingsSidebarNavProps {
  activeSection: SettingsSection;
  onSelectSection: (section: SettingsSection) => void;
  t: (key: string, fallback?: string) => string;
}

export const SettingsSidebarNav = React.memo(function SettingsSidebarNav({
  activeSection,
  onSelectSection,
  t,
}: SettingsSidebarNavProps) {
  return (
    <nav className="w-56 shrink-0 bg-zinc-900/40 border-r border-zinc-800 p-3 flex flex-col gap-1 overflow-y-auto">
      <button
        onClick={() => onSelectSection('general')}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition cursor-pointer text-left ${
          activeSection === 'general'
            ? 'bg-zinc-800 text-zinc-100 shadow-xs'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
        }`}
      >
        <Globe className="w-4 h-4 shrink-0 text-zinc-300" />
        <span>{t('categoryGeneral')}</span>
      </button>

      <button
        onClick={() => onSelectSection('appearance')}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition cursor-pointer text-left ${
          activeSection === 'appearance'
            ? 'bg-zinc-800 text-zinc-100 shadow-xs'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
        }`}
      >
        <Palette className="w-4 h-4 shrink-0 text-zinc-300" />
        <span>{t('categoryAppearance')}</span>
      </button>

      <button
        onClick={() => onSelectSection('editor')}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition cursor-pointer text-left ${
          activeSection === 'editor'
            ? 'bg-zinc-800 text-zinc-100 shadow-xs'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
        }`}
      >
        <Sliders className="w-4 h-4 shrink-0 text-zinc-300" />
        <span>{t('categoryEditor')}</span>
      </button>

      <button
        onClick={() => onSelectSection('taxonomy')}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition cursor-pointer text-left ${
          activeSection === 'taxonomy'
            ? 'bg-zinc-800 text-zinc-100 shadow-xs'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
        }`}
      >
        <Layers className="w-4 h-4 shrink-0 text-zinc-300" />
        <span>{t('categoryTaxonomy')}</span>
      </button>
    </nav>
  );
});
