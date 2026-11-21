import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { MainViewId } from '../../../types/navigation';
import { Language } from '../../../types/settings';
import { useTranslation } from '../../../i18n/translations';
import FileMenuDropdown from '../FileMenuDropdown';
import { SaveStatus } from '../../editor/FoliantEditor';
import { NAV_ITEMS } from './navItems';
import logoUrl from '../../../assets/logo.svg';
import { isWebPlatform } from '../../../utils/platform';

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
  onOpenHelpGuide?: () => void;
  isWeb?: boolean;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  highlightedView?: MainViewId | null;
}

const ActivityBarNavList = memo(function ActivityBarNavList({
  activeView,
  onSelectView,
  translate,
  highlightedView,
}: {
  activeView: MainViewId;
  onSelectView: (view: MainViewId) => void;
  translate: (key: any, defaultVal: string) => string;
  highlightedView?: MainViewId | null;
}) {
  return (
    <nav className="flex flex-col items-center gap-1 w-full px-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        const isHighlighted = highlightedView === item.id;
        const itemLabel = translate(item.labelKey, item.defaultLabel);
        const itemTooltip = translate(item.tooltipKey, item.defaultTooltip);

        return (
          <button
            key={item.id}
            data-testid={`activity-bar-${item.id}`}
            onClick={() => onSelectView(item.id)}
            title={itemTooltip}
            className={`activity-bar-item relative group flex flex-col items-center justify-center w-full py-2 rounded-sm transition text-[10px] font-medium cursor-pointer touch-manipulation min-h-[42px] ${isHighlighted
              ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950 animate-pulse bg-emerald-950/40 text-emerald-200'
              : isActive
                ? 'is-active bg-zinc-900 text-zinc-100 border-l-2 border-zinc-200'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-l-2 border-transparent'
              }`}
          >
            <Icon
              className={`activity-bar-icon ui-decorative-icon w-3.5 h-3.5 mb-1 ${isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
            />
            <span className="ui-nav-label leading-none tracking-tight text-[9px]">{itemLabel}</span>
          </button>
        );
      })}
    </nav>
  );
});

const ActivityBarFooter = memo(function ActivityBarFooter({
  translate,
  showLandingLink = false,
}: {
  translate: (key: any, defaultVal: string) => string;
  showLandingLink?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-full pt-2 pb-1">
      {showLandingLink && (
        <a
          href="../"
          title={translate('backToLanding', 'Volver a la portada')}
          aria-label="Volver a la portada"
          className="p-1.5 rounded-sm text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
});

export const ActivityBar = memo(function ActivityBar({
  activeView,
  onSelectView,
  language = 'en',
  saveStatus = 'idle',
  isAutoSave: _isAutoSave = true,
  onOpenSettings,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onSaveProjectAs,
  onImportManuskript,
  onExportEpub,
  onOpenSearch,
  onOpenHelpGuide,
  isWeb,
  isFocusMode: _isFocusMode = false,
  onToggleFocusMode: _onToggleFocusMode,
  highlightedView,
}: ActivityBarProps) {
  const showLandingLink = isWeb !== undefined ? isWeb : isWebPlatform();
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

  const logoAuraClasses = useMemo(() => {
    if (saveStatus === 'saving') {
      return 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.5)] animate-pulse bg-zinc-900 text-amber-300';
    }
    if (saveStatus === 'unsaved') {
      return 'border-amber-500 bg-zinc-900 text-amber-400';
    }
    if (saveStatus === 'saved') {
      return 'border-emerald-500 bg-zinc-900 text-emerald-400';
    }
    return 'border-zinc-800 bg-zinc-900 text-zinc-300';
  }, [saveStatus]);

  const logoTitle = useMemo(() => {
    if (saveStatus === 'saving') {
      return `Foliant - ${t('saving', 'Saving...')}`;
    }
    if (saveStatus === 'unsaved') {
      return `Foliant - ${t('unsaved', 'Unsaved changes')}`;
    }
    if (saveStatus === 'saved') {
      return `Foliant - ${t('saved', 'Saved')}`;
    }
    return 'Foliant';
  }, [saveStatus, t]);

  return (
    <aside
      data-tour-id="activity-bar"
      className={`w-14 shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between items-center py-2.5 select-none relative ${isFileMenuOpen ? 'z-[70]' : 'z-40'
        }`}
      aria-label="Main Navigation ActivityBar"
    >
      {/* Top Section: File Menu & Nav List */}
      <div className="flex flex-col items-center gap-2 w-full relative">
        <div ref={menuRef} className="relative w-full px-1">
          <button
            data-tour-id="activity-bar-file-menu"
            onClick={() => setIsFileMenuOpen((prev) => !prev)}
            title="File Menu"
            aria-label="File Menu"
            className={`activity-bar-menu-btn w-full py-2 px-2 rounded-sm transition cursor-pointer touch-manipulation flex items-center justify-center ${isFileMenuOpen
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
          >
            <div className="activity-bar-menu-lines flex flex-col justify-between items-center w-full max-w-[20px] h-3.5 gap-1">
              <span className="menu-line w-full h-[1.5px] bg-current rounded-xs block transition-all" />
              <span className="menu-line w-full h-[1.5px] bg-current rounded-xs block transition-all" />
              <span className="menu-line w-full h-[1.5px] bg-current rounded-xs block transition-all" />
            </div>
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
              onOpenHelpGuide={onOpenHelpGuide}
              language={language}
              isWeb={showLandingLink}
            />
          )}
        </div>

        <div className="w-full px-2">
          <div className="w-full h-[1px] bg-zinc-800" />
        </div>

        <ActivityBarNavList
          activeView={activeView}
          onSelectView={onSelectView}
          translate={t}
          highlightedView={highlightedView}
        />
      </div>

      {/* Bottom Section: Save Status & Footer */}
      <div className="flex flex-col items-center gap-2 w-full">
        <div className="w-full px-2">
          <div className="w-full h-[1px] bg-zinc-800" />
        </div>

        <div
          title={logoTitle}
          aria-label={logoTitle}
          data-testid="activity-bar-save-status"
          className={`p-1.5 rounded-sm transition-all duration-300 flex items-center justify-center select-none cursor-default border ${logoAuraClasses}`}
        >
          <img src={logoUrl} alt="Foliant" className="w-5 h-5 object-contain select-none pointer-events-none" />
          <span className="sr-only">Foliant</span>
        </div>

        <ActivityBarFooter
          translate={t}
          showLandingLink={showLandingLink}
        />
      </div>
    </aside>
  );
});

export default ActivityBar;
