import { memo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { EyeOff, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { TabId, DockSide } from '../../../types/dock';
import { useTranslation } from '../../../i18n/translations';
import { TAB_META, TAB_TRANSLATION_KEYS } from './constants';

export interface DockTabContextMenuState {
  x: number;
  y: number;
  tabId: TabId;
  strip: 'top' | 'bottom';
}

interface DockTabContextMenuProps {
  contextMenu: DockTabContextMenuState | null;
  side: DockSide;
  onClose: () => void;
  onHideTab: (tabId: TabId, strip: 'top' | 'bottom') => void;
  onToggleOpen?: () => void;
}

export const DockTabContextMenu = memo(function DockTabContextMenu({
  contextMenu,
  side,
  onClose,
  onHideTab,
  onToggleOpen,
}: DockTabContextMenuProps) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu, onClose]);

  if (!contextMenu) return null;

  const meta = TAB_META[contextMenu.tabId];
  const tabLabel = TAB_TRANSLATION_KEYS[contextMenu.tabId]
    ? t(TAB_TRANSLATION_KEYS[contextMenu.tabId].labelKey, meta?.label || contextMenu.tabId)
    : meta?.label || contextMenu.tabId;

  // Viewport bounds calculation
  const menuWidth = 190;
  const menuHeight = 90;
  const left = Math.min(contextMenu.x, window.innerWidth - menuWidth - 8);
  const top = Math.min(contextMenu.y, window.innerHeight - menuHeight - 8);

  const CloseDockIcon = side === 'left' ? PanelLeftClose : PanelRightClose;

  return createPortal(
    <div
      ref={menuRef}
      style={{ top: `${top}px`, left: `${left}px` }}
      className="fixed z-[99999] min-w-[180px] bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl py-1 text-xs text-zinc-300 font-sans animate-in fade-in zoom-in-95 duration-75 select-none"
    >
      <div className="px-2.5 py-1 text-[10px] font-mono text-zinc-500 uppercase tracking-wider border-b border-zinc-800/80 mb-0.5 truncate">
        {tabLabel}
      </div>

      <button
        type="button"
        onClick={() => {
          onHideTab(contextMenu.tabId, contextMenu.strip);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-zinc-800/80 text-zinc-300 hover:text-white transition cursor-pointer text-left"
      >
        <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
        <span>{t('hidePanel', 'Ocultar panel')}</span>
      </button>

      {onToggleOpen && (
        <button
          type="button"
          onClick={() => {
            onToggleOpen();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition cursor-pointer text-left border-t border-zinc-900"
        >
          <CloseDockIcon className="w-3.5 h-3.5 text-zinc-500" />
          <span>{t('closeSideDock', 'Cerrar panel lateral')}</span>
        </button>
      )}
    </div>,
    document.body
  );
});

export default DockTabContextMenu;

