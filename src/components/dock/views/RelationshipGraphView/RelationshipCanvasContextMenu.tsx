import { memo } from 'react';
import { Users, GitCommit } from 'lucide-react';
import { CanvasContextMenuState } from './types';
import { useTranslation } from '../../../../i18n/translations';

interface RelationshipCanvasContextMenuProps {
  contextMenu: CanvasContextMenuState;
  onAddCharacter: (coords: { x: number; y: number }) => void;
  onAddUnionNode: (x: number, y: number) => void;
}

export const RelationshipCanvasContextMenu = memo(function RelationshipCanvasContextMenu({
  contextMenu,
  onAddCharacter,
  onAddUnionNode,
}: RelationshipCanvasContextMenuProps) {
  const { t } = useTranslation();

  return (
    <div
      className="context-menu-box absolute z-50 w-44 rounded-sm bg-zinc-950 border border-zinc-800 shadow-2xl py-1 text-xs select-none"
      style={{
        left: `${contextMenu.screenX}px`,
        top: `${contextMenu.screenY}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2 py-0.5 text-[8px] font-mono text-zinc-500 uppercase border-b border-zinc-850 mb-0.5">
        {t('canvasActions')}
      </div>
      <button
        type="button"
        onClick={() => onAddCharacter({ x: contextMenu.worldX, y: contextMenu.worldY })}
        className="w-full text-left px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center gap-1.5 cursor-pointer"
      >
        <Users className="w-3 h-3 text-zinc-400" />
        <span>{t('addCharacter')}</span>
      </button>
      <button
        type="button"
        onClick={() => onAddUnionNode(contextMenu.worldX, contextMenu.worldY)}
        className="w-full text-left px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center gap-1.5 cursor-pointer"
      >
        <GitCommit className="w-3 h-3 text-emerald-400" />
        <span>{t('addUnionNode')}</span>
      </button>
    </div>
  );
});
