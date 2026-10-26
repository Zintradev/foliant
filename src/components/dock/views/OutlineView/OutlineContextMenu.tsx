import { useEffect, useRef, memo } from 'react';
import { Pencil, FilePlus, FolderPlus, Trash2 } from 'lucide-react';
import { ContextMenuState } from './types';
import { TextNode } from '../../../../types/project';
import { useTranslation } from '../../../../i18n/translations';

interface OutlineContextMenuProps {
  contextMenu: ContextMenuState | null;
  chaptersCount: number;
  onClose: () => void;
  onRename: (node: TextNode) => void;
  onNewScene: () => void;
  onNewFolder: () => void;
  onDelete: () => void;
}

export const OutlineContextMenu = memo(function OutlineContextMenu({
  contextMenu,
  chaptersCount,
  onClose,
  onRename,
  onNewScene,
  onNewFolder,
  onDelete,
}: OutlineContextMenuProps) {
  const { t } = useTranslation();
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
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

  return (
    <div
      ref={contextMenuRef}
      style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
      className="fixed z-50 min-w-[150px] bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl py-1 text-xs text-zinc-300 font-sans animate-in fade-in zoom-in-95 duration-75 select-none"
    >
      <div className="px-2.5 py-1 text-[10px] font-mono text-zinc-500 border-b border-zinc-850 truncate max-w-[170px]">
        {contextMenu.node.title || 'Selected item'}
      </div>

      <button
        type="button"
        onClick={() => {
          onRename(contextMenu.node);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-zinc-850 hover:text-white transition cursor-pointer"
      >
        <Pencil className="w-3.5 h-3.5 text-zinc-400" />
        <span>{t('renameNode')}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onNewScene();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-zinc-850 hover:text-white transition cursor-pointer"
      >
        <FilePlus className="w-3.5 h-3.5 text-zinc-400" />
        <span>{t('newScene')}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onNewFolder();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-zinc-850 hover:text-white transition cursor-pointer"
      >
        <FolderPlus className="w-3.5 h-3.5 text-zinc-400" />
        <span>{t('newFolder')}</span>
      </button>

      {chaptersCount > 1 && (
        <>
          <div className="h-px bg-zinc-850 my-0.5" />
          <button
            type="button"
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-zinc-850 text-rose-400 hover:text-rose-300 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('delete')}</span>
          </button>
        </>
      )}
    </div>
  );
});
