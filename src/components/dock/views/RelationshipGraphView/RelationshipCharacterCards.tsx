import React, { memo } from 'react';
import { Pencil } from 'lucide-react';
import { CharacterItem } from '../../../../types/dock';
import { NodePosition } from './types';
import { useTranslation, getRoleLabel } from '../../../../i18n/translations';

interface RelationshipCharacterCardsProps {
  characters: CharacterItem[];
  positions: Record<string, NodePosition>;
  editingCardId: string | null;
  connectingSourceId: string | null;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, id: string) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>, id: string) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent, id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onClick: (e: React.MouseEvent, id: string) => void;
  onDoubleClick: (e: React.MouseEvent, id: string) => void;
  onOpenEditModal: (id: string) => void;
}

function RelationshipCharacterCardsComponent({
  characters,
  positions,
  editingCardId,
  connectingSourceId,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onMouseDown,
  onMouseUp,
  onContextMenu,
  onClick,
  onDoubleClick,
  onOpenEditModal,
}: RelationshipCharacterCardsProps) {
  const { t } = useTranslation();
  const isDrawingConnection = Boolean(connectingSourceId);

  return (
    <>
      {characters.map((char) => {
        const pos = positions[char.id] || { x: 100, y: 100 };
        const isConnectingSource = connectingSourceId === char.id;
        const isSelected = editingCardId === char.id;

        return (
          <div
            key={char.id}
            style={{
              position: 'absolute',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              width: '160px',
              height: '72px',
            }}
            onPointerDown={(e) => onPointerDown(e, char.id)}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => onPointerUp(e, char.id)}
            onMouseDown={onMouseDown}
            onMouseUp={(e) => onMouseUp(e, char.id)}
            onContextMenu={(e) => onContextMenu(e, char.id)}
            onClick={(e) => onClick(e, char.id)}
            onDoubleClick={(e) => onDoubleClick(e, char.id)}
            className={`character-card h-[72px] rounded-sm border p-2 bg-zinc-900/95 shadow-lg select-none transition-shadow ${
              isDrawingConnection
                ? isConnectingSource
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'
                : 'cursor-move'
            } flex flex-col justify-between z-20 ${
              isConnectingSource
                ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-blue-950/50'
                : isSelected
                ? 'border-zinc-300 ring-1 ring-zinc-300/40 bg-zinc-900'
                : 'border-zinc-800 hover:border-zinc-600'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-1 pb-1 border-b border-zinc-800/80 mb-1">
              <span className="text-[10px] font-mono px-1 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400 uppercase tracking-wider truncate max-w-[110px]">
                {getRoleLabel(char.role, t)}
              </span>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEditModal(char.id);
                }}
                title={`Edit "${char.name}" representation`}
                className="p-0.5 text-zinc-500 hover:text-zinc-200 rounded-xs transition cursor-pointer shrink-0"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Name */}
            <h4 className="text-xs font-semibold text-zinc-200 truncate" title={char.name}>
              {char.name}
            </h4>

            {/* Summary or Category Tags from Cast */}
            {char.tags && char.tags.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-0.5">
                {char.tags.slice(0, 2).map((tg) => (
                  <span
                    key={tg.id}
                    className="text-[8px] font-mono px-1 rounded-xs bg-zinc-950 border border-zinc-850 text-zinc-400"
                  >
                    {tg.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[9px] text-zinc-500 truncate mt-0.5">
                {char.summary || 'No summary'}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}

export const RelationshipCharacterCards = memo(RelationshipCharacterCardsComponent);
