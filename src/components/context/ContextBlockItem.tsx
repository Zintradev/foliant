import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { ContextBlock } from '../../types/project';
import { useTranslation } from '../../i18n/translations';

export interface ContextBlockItemProps {
  block: ContextBlock;
  onUpdate: (updated: ContextBlock) => void;
  onDelete: (id: string) => void;
  isNewBlock?: boolean;
  onClearFocus?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onStartEditing?: () => void;
}

function ContextBlockItemComponent({
  block,
  onUpdate,
  onDelete,
  isNewBlock = false,
  onClearFocus,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onStartEditing,
}: ContextBlockItemProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [localContent, setLocalContent] = useState(block.content);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockRef = useRef(block);
  blockRef.current = block;

  // Sync if external content updates (e.g. project load or external reset)
  useEffect(() => {
    setLocalContent(block.content);
  }, [block.content]);

  // Auto-focus textarea when note is newly created
  useEffect(() => {
    if (isNewBlock && textareaRef.current) {
      textareaRef.current.focus();
      onClearFocus?.();
    }
  }, [isNewBlock, onClearFocus]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const commitContent = useCallback(
    (newContent: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (newContent !== blockRef.current.content) {
        onUpdate({ ...blockRef.current, content: newContent });
      }
    },
    [onUpdate]
  );

  // Commit the edited title on blur or Enter
  const commitTitle = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && trimmed !== block.title) {
        onUpdate({ ...block, title: trimmed });
      }
      setEditingTitle(false);
    },
    [block, onUpdate]
  );

  const handleTitleDoubleClick = () => {
    setEditingTitle(true);
    // Focus the input after React renders it
    setTimeout(() => titleInputRef.current?.select(), 0);
  };

  const handleContentChange = (value: string) => {
    onStartEditing?.();
    setLocalContent(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      commitContent(value);
    }, 400);
  };

  const handleTextareaBlur = () => {
    commitContent(localContent);
  };

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`border rounded-sm overflow-hidden bg-zinc-950 transition-all ${
        isDragOver
          ? 'border-blue-500 ring-2 ring-blue-500/50 bg-zinc-900/40'
          : 'border-zinc-800'
      }`}
    >
      {/* Block header with Drag and Drop handle */}
      <div
        draggable={!editingTitle}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', block.id);
          onDragStart?.();
        }}
        onDragEnd={onDragEnd}
        className={`flex items-center gap-1.5 px-2.5 py-2 bg-zinc-900/60 border-b border-zinc-800/80 group select-none cursor-grab active:cursor-grabbing transition ${
          isDragging ? 'opacity-30' : ''
        }`}
      >
        <GripVertical className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition shrink-0 cursor-grab active:cursor-grabbing" />

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed((c) => !c);
          }}
          className="text-zinc-500 hover:text-zinc-300 transition shrink-0 cursor-pointer p-0.5"
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
            title={t('doubleClickToRename')}
            className="flex-1 text-[11px] font-semibold text-zinc-200 uppercase tracking-wider cursor-text select-none truncate font-mono"
          >
            {block.title}
          </span>
        )}

        {/* Delete button — visible on hover */}
        <button
          type="button"
          onClick={() => onDelete(block.id)}
          title={t('removeBlock')}
          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition shrink-0 p-0.5 cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Block body */}
      {!collapsed && (
        <div className="px-2.5 pb-2.5 pt-2 bg-zinc-950">
          {block.type === 'text' ? (
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={(e) => handleContentChange(e.currentTarget.value)}
              onBlur={handleTextareaBlur}
              placeholder={t('contextNotesPlaceholder')}
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-sm p-2 text-[11px] text-zinc-300 resize-none focus:outline-none focus:border-zinc-600 transition font-sans leading-relaxed placeholder:text-zinc-600"
            />
          ) : (
            <div>
              <textarea
                ref={textareaRef}
                value={localContent}
                onChange={(e) => handleContentChange(e.currentTarget.value)}
                onBlur={handleTextareaBlur}
                placeholder={t('oneItemPerLine')}
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-sm p-2 text-[11px] text-zinc-300 resize-none focus:outline-none focus:border-zinc-600 transition font-sans leading-relaxed placeholder:text-zinc-600"
              />
              {localContent.trim() && (
                <ul className="mt-1.5 space-y-0.5">
                  {localContent
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

export default memo(ContextBlockItemComponent);
