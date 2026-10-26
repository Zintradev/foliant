import React, { useRef, useEffect, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { DockSide, TabId } from '../../../types/dock';
import { useTranslation } from '../../../i18n/translations';
import { ALL_TAB_IDS, TAB_META, TAB_TRANSLATION_KEYS } from './constants';

interface DockModulePickerModalProps {
  isOpen: boolean;
  side: DockSide;
  moduleMenuStrip: 'top' | 'bottom';
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  tabs: TabId[];
  topTabs: TabId[];
  bottomTabs: TabId[];
  isSplit: boolean;
  isDirty?: boolean;
  onClose: () => void;
  onRequestTabChange?: (tabId: TabId) => void;
  onRemoveTab: (tabId: TabId) => void;
  onDockTab: (tabId: TabId, targetSide: DockSide) => void;
  setSplitTabIds: React.Dispatch<React.SetStateAction<Set<TabId>>>;
  setActiveTopTab: (tabId: TabId) => void;
  setActiveBottomTab: (tabId: TabId) => void;
}

function DockModulePickerModal({
  isOpen,
  side,
  moduleMenuStrip,
  buttonRef,
  tabs,
  topTabs,
  bottomTabs,
  isSplit,
  isDirty = false,
  onClose,
  onRequestTabChange,
  onRemoveTab,
  onDockTab,
  setSplitTabIds,
  setActiveTopTab,
  setActiveBottomTab,
}: DockModulePickerModalProps) {
  const { t } = useTranslation();
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const portalMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updateMenuPosition = () => {
      const buttonEl = buttonRef.current;
      if (buttonEl) {
        const rect = buttonEl.getBoundingClientRect();
        const menuWidth = 224; // w-56
        let left = side === 'right' ? rect.right - menuWidth : rect.left;
        if (left < 8) left = 8;
        if (left + menuWidth > window.innerWidth - 8) {
          left = window.innerWidth - menuWidth - 8;
        }
        setMenuPosition({
          top: rect.bottom + 4,
          left,
        });
      }
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, side, buttonRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const currentButton = buttonRef.current;

      if (
        currentButton &&
        !currentButton.contains(target) &&
        portalMenuRef.current &&
        !portalMenuRef.current.contains(target)
      ) {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen, buttonRef, onClose]);

  if (!isOpen || !menuPosition) return null;

  const handleItemClick = (id: TabId, isVisibleInStrip: boolean, isVisibleInPanel: boolean) => {
    if (isDirty) {
      if (onRequestTabChange) {
        onRequestTabChange(id);
        return;
      }
      const proceed = window.confirm(
        t(
          'unsavedChangesConfirm',
          'You have unsaved edits. Are you sure you want to switch tabs? Changes will be lost.'
        )
      );
      if (!proceed) return;
    }

    if (isSplit) {
      if (moduleMenuStrip === 'bottom') {
        if (isVisibleInStrip) {
          // Remove from bottom strip and panel
          setSplitTabIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          onRemoveTab(id);
        } else {
          // Add or move to bottom strip
          setSplitTabIds((prev) => new Set([...prev, id]));
          if (!isVisibleInPanel) {
            onDockTab(id, side);
          }
          setActiveBottomTab(id);
        }
      } else {
        if (isVisibleInStrip) {
          // Remove from top strip and panel
          onRemoveTab(id);
        } else {
          // Add or move to top strip
          setSplitTabIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          if (!isVisibleInPanel) {
            onDockTab(id, side);
          }
          setActiveTopTab(id);
        }
      }
    } else {
      if (isVisibleInPanel) {
        onRemoveTab(id);
      } else {
        onDockTab(id, side);
      }
    }

    onClose();
  };

  const activeStripTabs = moduleMenuStrip === 'bottom' ? bottomTabs : topTabs;

  return createPortal(
    <div
      ref={portalMenuRef}
      style={{
        position: 'absolute',
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
      }}
      className="w-56 bg-zinc-900 border border-zinc-800 rounded-sm shadow-2xl p-1 z-[99999] animate-in fade-in zoom-in-95 duration-75 select-none"
    >
      <div className="px-2 py-1 text-[10px] font-mono text-zinc-500 border-b border-zinc-800 mb-1 tracking-widest">
        {t('modulesToggleTitle', 'MODULES — CLICK TO TOGGLE')}
      </div>
      {ALL_TAB_IDS.map((id) => {
        const meta = TAB_META[id];
        const Icon = meta.icon;
        const isVisibleInStrip = activeStripTabs.includes(id);
        const isVisibleInPanel = tabs.includes(id);

        const itemLabel = TAB_TRANSLATION_KEYS[id]
          ? t(TAB_TRANSLATION_KEYS[id].labelKey, meta.label)
          : meta.label;

        return (
          <button
            key={id}
            onClick={() => handleItemClick(id, isVisibleInStrip, isVisibleInPanel)}
            title={
              isVisibleInStrip
                ? `${t('hide')} ${itemLabel}`
                : `${t('show')} ${itemLabel}`
            }
            className={`flex items-center justify-between w-full px-2 py-1.5 rounded-sm text-xs text-left transition group cursor-pointer ${
              isVisibleInStrip
                ? 'bg-zinc-800/70 text-zinc-100'
                : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isVisibleInStrip
                    ? 'text-zinc-200'
                    : 'text-zinc-500 group-hover:text-zinc-400'
                }`}
              />
              <span className={isVisibleInStrip ? 'font-medium' : ''}>{itemLabel}</span>
            </div>
            {isVisibleInStrip ? (
              <Check className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            ) : (
              <span className="text-[10px] text-zinc-600 font-mono">+</span>
            )}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

export default memo(DockModulePickerModal);
