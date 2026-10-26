import { memo } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical } from 'lucide-react';
import { DragState } from './types';
import { TAB_META } from './constants';

interface DockDragPreviewProps {
  dragState: DragState | null;
}

function DockDragPreview({ dragState }: DockDragPreviewProps) {
  if (!dragState) return null;

  const DragIcon = TAB_META[dragState.tabId]?.icon;
  const label = TAB_META[dragState.tabId]?.label || dragState.tabId;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: `${dragState.x + 10}px`,
        top: `${dragState.y + 10}px`,
        zIndex: 99999,
        pointerEvents: 'none',
      }}
      className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs font-medium shadow-lg backdrop-blur-xs"
    >
      <GripVertical className="w-3 h-3 text-zinc-400" />
      {DragIcon && <DragIcon className="w-3.5 h-3.5 text-zinc-300" />}
      <span>{label}</span>
      {dragState.hoverSide && (
        <span className="text-[9px] px-1 py-0.2 rounded-xs bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono uppercase tracking-wider ml-1">
          {dragState.hoverSide} panel {dragState.hoverStrip ? `(${dragState.hoverStrip})` : ''}
        </span>
      )}
    </div>,
    document.body
  );
}

export default memo(DockDragPreview);
