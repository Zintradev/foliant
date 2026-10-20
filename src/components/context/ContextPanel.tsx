import { useState, useRef, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { ContextBlock } from '../../types/project';

interface ContextPanelProps {
  blocks: ContextBlock[];
  onChange: (blocks: ContextBlock[]) => void;
  isExpanded?: boolean;
}

// ---------------------------------------------------------------------------
// Individual block component
// ---------------------------------------------------------------------------

interface BlockProps {
  block: ContextBlock;
  onUpdate: (updated: ContextBlock) => void;
  onDelete: (id: string) => void;
}

function ContextBlockItem({ block, onUpdate, onDelete }: BlockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Commit the edited title on blur or Enter
  const commitTitle = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && trimmed !== block.title) {
        onUpdate({ ...block, title: trimmed });
      }
      setEditingTitle(false);
    },
    [block, onUpdate],
  );

  const handleTitleDoubleClick = () => {
    setEditingTitle(true);
    // Focus the input after React renders it
    setTimeout(() => titleInputRef.current?.select(), 0);
  };

  const handleContentChange = (value: string) => {
    onUpdate({ ...block, content: value });
  };

  return (
    <div className="border border-zinc-800 rounded-sm overflow-hidden bg-zinc-950">
      {/* Block header */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 bg-zinc-900/60 border-b border-zinc-800/80 group">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-zinc-500 hover:text-zinc-300 transition shrink-0"
          aria-label={collapsed ? 'Expand block' : 'Collapse block'}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Editable title */}
        {editingTitle ? (
          <input
            ref={titleInputRef}
            defaultValue={block.title}
            autoFocus
            onBlur={(e) => commitTitle(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle(e.currentTarget.value);
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            className="flex-1 bg-zinc-900 text-zinc-100 text-[11px] font-semibold px-1.5 py-0.5 rounded-sm outline-none border border-zinc-700 focus:border-zinc-500 transition"
          />
        ) : (
          <span
            onDoubleClick={handleTitleDoubleClick}
            title="Double-click to rename"
            className="flex-1 text-[11px] font-semibold text-zinc-200 uppercase tracking-wider cursor-text select-none truncate font-mono"
          >
            {block.title}
          </span>
        )}

        {/* Delete button — visible on hover */}
        <button
          onClick={() => onDelete(block.id)}
          title="Remove block"
          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition shrink-0 p-0.5"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Block body */}
      {!collapsed && (
        <div className="px-2.5 pb-2.5 pt-2 bg-zinc-950">
          {block.type === 'text' ? (
            <textarea
              value={block.content}
              onChange={(e) => handleContentChange(e.currentTarget.value)}
              placeholder="Write section notes, scene background, or character observations..."
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-sm p-2 text-[11px] text-zinc-300 resize-none focus:outline-none focus:border-zinc-600 transition font-sans leading-relaxed placeholder:text-zinc-600"
            />
          ) : (
            // List type: each non-empty line is rendered as a bullet
            <div>
              <textarea
                value={block.content}
                onChange={(e) => handleContentChange(e.currentTarget.value)}
                placeholder="One item per line..."
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-sm p-2 text-[11px] text-zinc-300 resize-none focus:outline-none focus:border-zinc-600 transition font-sans leading-relaxed placeholder:text-zinc-600"
              />
              {block.content.trim() && (
                <ul className="mt-1.5 space-y-0.5">
                  {block.content
                    .split('\n')
                    .filter((line) => line.trim())
                    .map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-[11px] text-zinc-400"
                      >
                        <span className="mt-1 w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                        <span>{item.trim()}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel component
// ---------------------------------------------------------------------------

let nextId = 100; // simple incrementing ID for new blocks
const generateId = () => `block-${++nextId}`;

export default function ContextPanel({
  blocks,
  onChange,
  isExpanded = false,
}: ContextPanelProps) {
  const handleUpdate = useCallback(
    (updated: ContextBlock) => {
      onChange(blocks.map((b) => (b.id === updated.id ? updated : b)));
    },
    [blocks, onChange],
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChange(blocks.filter((b) => b.id !== id));
    },
    [blocks, onChange],
  );

  const addBlock = (type: ContextBlock['type']) => {
    const label = type === 'list' ? 'New List' : 'New Section';
    onChange([
      ...blocks,
      { id: generateId(), title: label, type, content: '' },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 select-none">
      {/* Block list */}
      <div className="flex-1 overflow-y-auto p-3">
        {blocks.length === 0 ? (
          <p className="text-[11px] text-zinc-600 italic text-center mt-8">
            No sections yet. Add one below.
          </p>
        ) : (
          <div
            className={
              isExpanded
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5'
                : 'space-y-2'
            }
          >
            {blocks.map((block) => (
              <ContextBlockItem
                key={block.id}
                block={block}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer — add block actions */}
      <div className="shrink-0 border-t border-zinc-800 p-2.5 flex flex-col gap-1.5 bg-zinc-950/80">
        <button
          onClick={() => addBlock('text')}
          className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded-sm text-[11px] font-medium text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Text Section
        </button>
        <button
          onClick={() => addBlock('list')}
          className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded-sm text-[11px] font-medium text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add List Section
        </button>
      </div>
    </div>
  );
}
