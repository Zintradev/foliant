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
} from 'lucide-react';
import { MainViewId } from '../../types/navigation';

interface ActivityBarProps {
  activeView: MainViewId;
  onSelectView: (view: MainViewId) => void;
  onOpenSettings?: () => void;
  onNewProject?: () => void;
  onOpenProject?: () => void;
  onSaveProject?: () => void;
  onSaveProjectAs?: () => void;
}

interface NavItem {
  id: MainViewId;
  label: string;
  tooltip: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'write',
    label: 'Editor',
    tooltip: 'Writing Workspace & Chapters',
    icon: Feather,
  },
  {
    id: 'outline',
    label: 'Outline',
    tooltip: 'Project Structure & Outline',
    icon: BookOpen,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    tooltip: 'Chronological Scene Timeline',
    icon: Clock,
  },
  {
    id: 'relationships',
    label: 'Graph',
    tooltip: 'Character Relationship Graph',
    icon: Network,
  },
  {
    id: 'storyline',
    label: 'Stories',
    tooltip: 'Storylines & Narrative Threads',
    icon: GitMerge,
  },
  {
    id: 'stats',
    label: 'Analytics',
    tooltip: 'Project Analytics & Target Tracking',
    icon: BarChart3,
  },
  {
    id: 'context',
    label: 'Notes',
    tooltip: 'Notes & Reference Context',
    icon: BookMarked,
  },
  {
    id: 'characters',
    label: 'Cast',
    tooltip: 'Characters & Entities',
    icon: Users,
  },
  {
    id: 'worldbuilding',
    label: 'World',
    tooltip: 'Worldbuilding & Lore',
    icon: Globe,
  },
  {
    id: 'moodboard',
    label: 'Visuals',
    tooltip: 'Visual Moodboard',
    icon: ImageIcon,
  },
];

export default function ActivityBar({
  activeView,
  onSelectView,
  onOpenSettings,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onSaveProjectAs,
}: ActivityBarProps) {
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
      className="w-14 shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between items-center py-2.5 select-none z-30"
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
            <div className="absolute left-12 top-0 z-50 min-w-[210px] bg-zinc-900 border border-zinc-800 rounded-md shadow-2xl py-1.5 text-xs text-zinc-300 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-mono tracking-wider text-zinc-500 uppercase border-b border-zinc-800/80 mb-1">
                Foliant Project
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
                    <span>New Project</span>
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
                    <span>Open Project...</span>
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
                    <span>Save</span>
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
                    <span>Save As...</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Ctrl+Shift+S</span>
                </button>
              )}

              <div className="my-1.5 h-[1px] bg-zinc-800/80" />

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
                    <span>Studio Settings</span>
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

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                title={item.tooltip}
                className={`relative group flex flex-col items-center justify-center w-full py-2 rounded-sm transition text-[10px] font-medium ${
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
                <span className="leading-none tracking-tight text-[9px]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: version info */}
      <div className="flex flex-col items-center gap-1.5 w-full pt-2">
        <span className="text-[8px] font-mono text-zinc-600">v0.1</span>
      </div>
    </aside>
  );
}
