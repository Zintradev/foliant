import { useState, useRef, useCallback, memo } from 'react';
import {
  Plus,
  LayoutList,
  Columns2,
} from 'lucide-react';
import { ContextBlock } from '../../types/project';
import { useTranslation } from '../../i18n/translations';
import ContextBlockItem from './ContextBlockItem';

interface ContextPanelProps {
  blocks: ContextBlock[];
  onChange: (blocks: ContextBlock[]) => void;
  isExpanded?: boolean;
  onStartEditing?: () => void;
}

// ---------------------------------------------------------------------------
// Panel component
// ---------------------------------------------------------------------------

let nextId = 100; // simple incrementing ID for new blocks
const generateId = () => `block-${++nextId}`;

function ContextPanelComponent({
  blocks,
  onChange,
  isExpanded = false,
  onStartEditing,
}: ContextPanelProps) {
  const { t } = useTranslation();
  const [layoutCols, setLayoutCols] = useState<1 | 2>(1);
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const handleUpdate = useCallback(
    (updated: ContextBlock) => {
      onChange(blocksRef.current.map((b) => (b.id === updated.id ? updated : b)));
    },
    [onChange],
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChange(blocksRef.current.filter((b) => b.id !== id));
    },
    [onChange],
  );

  const addBlock = (type: ContextBlock['type']) => {
    const label = type === 'list' ? t('newList') : t('newSection');
    const newId = generateId();
    setFocusBlockId(newId);
    onChange([
      ...blocks,
      { id: newId, title: label, type, content: '' },
    ]);
  };

  const handleDropBlock = (targetId: string) => {
    if (!draggedBlockId || draggedBlockId === targetId) {
      setDraggedBlockId(null);
      setDragOverBlockId(null);
      return;
    }
    const sourceIdx = blocks.findIndex((b) => b.id === draggedBlockId);
    const targetIdx = blocks.findIndex((b) => b.id === targetId);
    if (sourceIdx !== -1 && targetIdx !== -1) {
      const next = [...blocks];
      const [moved] = next.splice(sourceIdx, 1);
      next.splice(targetIdx, 0, moved);
      onChange(next);
    }
    setDraggedBlockId(null);
    setDragOverBlockId(null);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 select-none">
      {/* Header bar with layout column mode selector */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
          {t('dockNotes')}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLayoutCols(1)}
            title={t('oneColumn')}
            className={`p-1 rounded-xs transition cursor-pointer ${
              layoutCols === 1
                ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setLayoutCols(2)}
            title={t('twoColumns')}
            className={`p-1 rounded-xs transition cursor-pointer ${
              layoutCols === 2
                ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto p-3">
        {blocks.length === 0 ? (
          <p className="text-[11px] text-zinc-600 italic text-center mt-8">
            {t('noSectionsYet')}
          </p>
        ) : (
          <div
            className={
              isExpanded
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5'
                : layoutCols === 2
                ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start'
                : 'space-y-2'
            }
          >
            {blocks.map((block) => (
              <ContextBlockItem
                key={block.id}
                block={block}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                isNewBlock={focusBlockId === block.id}
                onClearFocus={() => setFocusBlockId(null)}
                isDragging={draggedBlockId === block.id}
                isDragOver={dragOverBlockId === block.id}
                onDragStart={() => setDraggedBlockId(block.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverBlockId !== block.id) setDragOverBlockId(block.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropBlock(block.id);
                }}
                onDragEnd={() => {
                  setDraggedBlockId(null);
                  setDragOverBlockId(null);
                }}
                onStartEditing={onStartEditing}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer — add block actions with clear hover highlight and pointer cursor */}
      <div className="shrink-0 border-t border-zinc-800 p-2.5 flex flex-col gap-1.5 bg-zinc-950/80">
        <button
          type="button"
          onClick={() => addBlock('text')}
          className="flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 rounded-sm text-[11px] font-medium text-zinc-300 hover:text-white border border-zinc-750 hover:border-zinc-500 bg-zinc-900/80 hover:bg-zinc-800 transition shadow-xs cursor-pointer active:scale-[0.99] group"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
          <span>{t('addTextSection')}</span>
        </button>
        <button
          type="button"
          onClick={() => addBlock('list')}
          className="flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 rounded-sm text-[11px] font-medium text-zinc-300 hover:text-white border border-zinc-750 hover:border-zinc-500 bg-zinc-900/80 hover:bg-zinc-800 transition shadow-xs cursor-pointer active:scale-[0.99] group"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
          <span>{t('addListSection')}</span>
        </button>
      </div>
    </div>
  );
}

export default memo(ContextPanelComponent);
