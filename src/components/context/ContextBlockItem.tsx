import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  GripVertical,
  Pencil,
  Check,
  Folder,
  Tag,
  Plus,
  X,
  User,
  GitMerge,
  Globe,
  FileText,
  List,
} from 'lucide-react';
import { ContextBlock } from '../../types/project';
import { StorylineItem, CharacterItem, WorldItem } from '../../types/dock';
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
  storylines?: StorylineItem[];
  characters?: CharacterItem[];
  worldItems?: WorldItem[];
  availableFolders?: string[];
  onAddFolder?: (folderName: string) => void;
  isLineView?: boolean;
  isShiftMode?: boolean;
  isDraggingAny?: boolean;
  rowTranslateY?: number;
  setElementRef?: (el: HTMLDivElement | null) => void;
}

const STORYLINE_COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  emerald: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/60', dot: 'bg-emerald-400' },
  purple: { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-800/60', dot: 'bg-purple-400' },
  amber: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/60', dot: 'bg-amber-400' },
  blue: { bg: 'bg-blue-950/40', text: 'text-blue-300', border: 'border-blue-800/60', dot: 'bg-blue-400' },
  rose: { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-800/60', dot: 'bg-rose-400' },
  cyan: { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-800/60', dot: 'bg-cyan-400' },
};

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
  storylines = [],
  characters = [],
  worldItems = [],
  availableFolders = [],
  onAddFolder,
  isLineView = false,
  isShiftMode = true,
  isDraggingAny = false,
  rowTranslateY = 0,
  setElementRef,
}: ContextBlockItemProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(isNewBlock);
  const [localContent, setLocalContent] = useState(block.content);
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [isFolderPopoverOpen, setIsFolderPopoverOpen] = useState(false);
  const [newCustomTagInput, setNewCustomTagInput] = useState('');
  const [newFolderInput, setNewFolderInput] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagPopoverRef = useRef<HTMLDivElement>(null);
  const folderPopoverRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef(block);
  blockRef.current = block;

  // Sync if external content updates
  useEffect(() => {
    setLocalContent(block.content);
  }, [block.content]);

  // Auto-focus when switching to edit content or new block
  useEffect(() => {
    if ((isNewBlock || isEditingContent) && textareaRef.current) {
      textareaRef.current.focus();
      if (isNewBlock) onClearFocus?.();
    }
  }, [isNewBlock, isEditingContent, onClearFocus]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Click outside to close popovers
  useEffect(() => {
    if (!isTagPopoverOpen && !isFolderPopoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (tagPopoverRef.current && !tagPopoverRef.current.contains(e.target as Node)) {
        setIsTagPopoverOpen(false);
      }
      if (folderPopoverRef.current && !folderPopoverRef.current.contains(e.target as Node)) {
        setIsFolderPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTagPopoverOpen, isFolderPopoverOpen]);

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

  const handleFinishEditing = () => {
    commitContent(localContent);
    setIsEditingContent(false);
  };

  // Folder assignment
  const handleAssignFolder = (folderName?: string) => {
    onUpdate({ ...block, folder: folderName ? folderName.trim() : undefined });
    setIsFolderPopoverOpen(false);
  };

  const handleCreateAndAssignFolder = () => {
    const trimmed = newFolderInput.trim();
    if (!trimmed) return;
    onAddFolder?.(trimmed);
    handleAssignFolder(trimmed);
    setNewFolderInput('');
  };

  // Tag toggling
  const handleToggleStoryline = (storylineId: string) => {
    const current = block.storylineIds || [];
    const updated = current.includes(storylineId)
      ? current.filter((id) => id !== storylineId)
      : [...current, storylineId];
    onUpdate({ ...block, storylineIds: updated });
  };

  const handleToggleCharacter = (charId: string) => {
    const current = block.characterIds || [];
    const updated = current.includes(charId)
      ? current.filter((id) => id !== charId)
      : [...current, charId];
    onUpdate({ ...block, characterIds: updated });
  };

  const handleToggleWorldItem = (worldId: string) => {
    const current = block.worldItemIds || [];
    const updated = current.includes(worldId)
      ? current.filter((id) => id !== worldId)
      : [...current, worldId];
    onUpdate({ ...block, worldItemIds: updated });
  };

  const handleAddCustomTag = () => {
    const trimmed = newCustomTagInput.trim().replace(/^#+/, '');
    if (!trimmed) return;
    const current = block.tags || [];
    if (!current.includes(trimmed)) {
      onUpdate({ ...block, tags: [...current, trimmed] });
    }
    setNewCustomTagInput('');
  };

  const handleRemoveCustomTag = (tagToRemove: string) => {
    const current = block.tags || [];
    onUpdate({ ...block, tags: current.filter((t) => t !== tagToRemove) });
  };

  const listItems = block.type === 'list'
    ? localContent.split('\n').filter((l) => l.trim().length > 0)
    : [];

  const attachedStorylines = (block.storylineIds || [])
    .map((id) => storylines.find((s) => s.id === id))
    .filter(Boolean) as StorylineItem[];

  const attachedCharacters = (block.characterIds || [])
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean) as CharacterItem[];

  const attachedWorldItems = (block.worldItemIds || [])
    .map((id) => worldItems.find((w) => w.id === id))
    .filter(Boolean) as WorldItem[];

  const customTags = block.tags || [];
  const hasMetadata = Boolean(
    block.folder ||
    attachedStorylines.length > 0 ||
    attachedCharacters.length > 0 ||
    attachedWorldItems.length > 0 ||
    customTags.length > 0
  );

  return (
    <div
      ref={setElementRef}
      onDragEnter={(e) => {
        if (isDraggingAny) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        transform: rowTranslateY ? `translate3d(0, ${rowTranslateY}px, 0)` : undefined,
        transition:
          isDragging && isShiftMode
            ? undefined
            : rowTranslateY !== undefined
            ? 'transform 220ms cubic-bezier(0.2, 0.9, 0.25, 1)'
            : undefined,
        willChange: rowTranslateY !== undefined ? 'transform' : undefined,
      }}
      className={`border rounded-sm overflow-visible bg-zinc-950 transition-all duration-200 shadow-xs w-full select-none ${
        isDraggingAny ? '[&_*]:pointer-events-none' : ''
      } ${
        isDragging
          ? 'opacity-35 bg-zinc-900/40 border-dashed border-zinc-750 z-30'
          : !isShiftMode && isDragOver
          ? 'border-2 border-emerald-500 bg-emerald-950/25 ring-2 ring-emerald-500/50 scale-[1.01] shadow-md shadow-black/50 z-20'
          : isShiftMode && isDragOver
          ? 'border-emerald-500 bg-emerald-950/15 ring-2 ring-emerald-500/40 z-20'
          : isLineView
          ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/90'
          : 'border-zinc-800 hover:border-zinc-700/80'
      }`}
    >
      {/* Block header with Drag and Drop handle */}
      <div
        draggable={!editingTitle}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', block.id);
          e.dataTransfer.effectAllowed = 'move';
          onDragStart?.();
        }}
        onDragEnd={onDragEnd}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900/75 border-b border-zinc-800/80 group select-none transition"
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
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Note Type Icon */}
        <span className="text-zinc-500 shrink-0">
          {block.type === 'list' ? (
            <List className="w-3.5 h-3.5 text-emerald-400/80" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </span>

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
            className="flex-1 bg-zinc-900 text-zinc-100 text-[11px] font-semibold px-1.5 py-0.5 rounded-sm outline-none border border-zinc-700 focus:border-zinc-500 transition font-mono"
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

        {/* Outline / Line View inline badges in header for quick scanning */}
        {isLineView && hasMetadata && (
          <div className="hidden sm:flex items-center gap-1 shrink-0 max-w-[45%] overflow-hidden">
            {block.folder && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-950/40 text-amber-300 border border-amber-800/40 shrink-0">
                <Folder className="w-2.5 h-2.5 text-amber-400" />
                <span className="truncate max-w-[80px]">{block.folder}</span>
              </span>
            )}
            {attachedStorylines.slice(0, 1).map((st) => (
              <span
                key={st.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-medium bg-purple-950/40 text-purple-300 border border-purple-800/40 shrink-0"
              >
                <GitMerge className="w-2.5 h-2.5 text-purple-400" />
                <span className="truncate max-w-[80px]">{st.title}</span>
              </span>
            ))}
            {attachedWorldItems.slice(0, 1).map((wi) => (
              <span
                key={wi.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-medium bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 shrink-0"
              >
                <Globe className="w-2.5 h-2.5 text-cyan-400" />
                <span className="truncate max-w-[80px]">{wi.title}</span>
              </span>
            ))}
            {attachedCharacters.slice(0, 1).map((ch) => (
              <span
                key={ch.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-medium bg-blue-950/40 text-blue-300 border border-blue-800/40 shrink-0"
              >
                <User className="w-2.5 h-2.5 text-blue-400" />
                <span className="truncate max-w-[80px]">{ch.name}</span>
              </span>
            ))}
            {customTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400 shrink-0"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action icons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Edit / Done Toggle */}
          <button
            type="button"
            onClick={() => (isEditingContent ? handleFinishEditing() : setIsEditingContent(true))}
            title={isEditingContent ? t('doneEditing') : t('editNoteContent')}
            className={`p-1 rounded-xs transition cursor-pointer ${
              isEditingContent
                ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {isEditingContent ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3 h-3" />}
          </button>

          {/* Folder Popover trigger */}
          <div className="relative" ref={folderPopoverRef}>
            <button
              type="button"
              onClick={() => setIsFolderPopoverOpen((prev) => !prev)}
              title={block.folder ? `${t('noteFolders')}: ${block.folder}` : t('selectFolder')}
              className={`p-1 rounded-xs transition cursor-pointer ${
                block.folder
                  ? 'text-amber-400 hover:text-amber-300 bg-amber-950/30'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Folder className="w-3 h-3" />
            </button>

            {isFolderPopoverOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-zinc-900 border border-zinc-750 rounded-md shadow-xl z-50 p-2 text-xs space-y-2 animate-in fade-in duration-100">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  {t('selectFolder')}
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  <button
                    type="button"
                    onClick={() => handleAssignFolder(undefined)}
                    className={`w-full text-left px-2 py-1 rounded text-[11px] transition flex items-center justify-between cursor-pointer ${
                      !block.folder ? 'bg-zinc-800 text-amber-300 font-medium' : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                    }`}
                  >
                    <span>{t('noFolder')}</span>
                    {!block.folder && <Check className="w-3 h-3 text-amber-400" />}
                  </button>
                  {availableFolders.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleAssignFolder(f)}
                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition flex items-center justify-between cursor-pointer truncate ${
                        block.folder === f ? 'bg-zinc-800 text-amber-300 font-medium' : 'text-zinc-300 hover:bg-zinc-850 hover:text-zinc-100'
                      }`}
                    >
                      <span className="truncate">{f}</span>
                      {block.folder === f && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="pt-2 border-t border-zinc-800 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newFolderInput}
                    onChange={(e) => setNewFolderInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateAndAssignFolder();
                    }}
                    placeholder={t('folderNamePlaceholder')}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-[11px] text-zinc-200 outline-none focus:border-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={handleCreateAndAssignFolder}
                    className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tags & Links Popover trigger (Storylines, Characters, World Items, Custom) */}
          <div className="relative" ref={tagPopoverRef}>
            <button
              type="button"
              onClick={() => setIsTagPopoverOpen((prev) => !prev)}
              title={t('noteTags')}
              className={`p-1 rounded-xs transition cursor-pointer ${
                attachedStorylines.length > 0 ||
                attachedCharacters.length > 0 ||
                attachedWorldItems.length > 0 ||
                customTags.length > 0
                  ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/30'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Tag className="w-3 h-3" />
            </button>

            {isTagPopoverOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-zinc-900 border border-zinc-750 rounded-md shadow-xl z-50 p-2.5 text-xs space-y-3 animate-in fade-in duration-100 max-h-84 overflow-y-auto">
                {/* Storylines */}
                <div>
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1">
                    <GitMerge className="w-3 h-3 text-purple-400" />
                    <span>{t('storylineTags')}</span>
                  </div>
                  {storylines.length === 0 ? (
                    <span className="text-[10px] text-zinc-600 italic block">{t('noPlotThreadsAvailable')}</span>
                  ) : (
                    <div className="space-y-1">
                      {storylines.map((st) => {
                        const isAttached = (block.storylineIds || []).includes(st.id);
                        const col = STORYLINE_COLOR_MAP[st.color] || STORYLINE_COLOR_MAP.emerald;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleToggleStoryline(st.id)}
                            className={`w-full text-left px-2 py-1 rounded text-[11px] transition flex items-center justify-between cursor-pointer ${
                              isAttached ? `${col.bg} ${col.text} border ${col.border}` : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full ${col.dot} shrink-0`} />
                              <span className="truncate">{st.title}</span>
                            </span>
                            {isAttached && <Check className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* World & Lore Items */}
                <div className="pt-2 border-t border-zinc-800">
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    <span>{t('worldItemTags')}</span>
                  </div>
                  {worldItems.length === 0 ? (
                    <span className="text-[10px] text-zinc-600 italic block">{t('noWorldItemsAvailable')}</span>
                  ) : (
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {worldItems.map((wi) => {
                        const isAttached = (block.worldItemIds || []).includes(wi.id);
                        return (
                          <button
                            key={wi.id}
                            type="button"
                            onClick={() => handleToggleWorldItem(wi.id)}
                            className={`w-full text-left px-2 py-1 rounded text-[11px] transition flex items-center justify-between cursor-pointer ${
                              isAttached
                                ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/60'
                                : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 uppercase font-mono">{wi.category}</span>
                              <span className="truncate">{wi.title}</span>
                            </span>
                            {isAttached && <Check className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Characters */}
                <div className="pt-2 border-t border-zinc-800">
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-400" />
                    <span>{t('characterTags')}</span>
                  </div>
                  {characters.length === 0 ? (
                    <span className="text-[10px] text-zinc-600 italic block">{t('noCharactersAvailable')}</span>
                  ) : (
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {characters.map((ch) => {
                        const isAttached = (block.characterIds || []).includes(ch.id);
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => handleToggleCharacter(ch.id)}
                            className={`w-full text-left px-2 py-1 rounded text-[11px] transition flex items-center justify-between cursor-pointer ${
                              isAttached
                                ? 'bg-blue-950/40 text-blue-300 border border-blue-800/60'
                                : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                            }`}
                          >
                            <span className="truncate">{ch.name}</span>
                            {isAttached && <Check className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Custom Tags */}
                <div className="pt-2 border-t border-zinc-800">
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-emerald-400" />
                    <span>{t('customTags')}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-1.5">
                    <input
                      type="text"
                      value={newCustomTagInput}
                      onChange={(e) => setNewCustomTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCustomTag();
                      }}
                      placeholder={t('customTagPlaceholder')}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-[11px] text-zinc-200 outline-none focus:border-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {customTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {customTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomTag(tag)}
                            className="hover:text-rose-400 cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Delete button */}
          <button
            type="button"
            onClick={() => onDelete(block.id)}
            title={t('removeBlock')}
            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition shrink-0 p-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Metadata Pill Bar (Folder, Storylines, World Items, Characters, Tags) */}
      {!collapsed && hasMetadata && (
        <div className="px-3 pt-2 pb-1 bg-zinc-950 flex flex-wrap items-center gap-1 border-b border-zinc-900">
          {block.folder && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-950/40 text-amber-300/90 border border-amber-800/50">
              <Folder className="w-2.5 h-2.5 text-amber-400" />
              <span>{block.folder}</span>
              <button
                type="button"
                onClick={() => handleAssignFolder(undefined)}
                className="hover:text-rose-400 cursor-pointer ml-0.5"
                title={t('removeBlock')}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {attachedStorylines.map((st) => {
            const col = STORYLINE_COLOR_MAP[st.color] || STORYLINE_COLOR_MAP.emerald;
            return (
              <span
                key={st.id}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${col.bg} ${col.text} border ${col.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${col.dot} shrink-0`} />
                <span className="truncate max-w-[130px]">{st.title}</span>
                <button
                  type="button"
                  onClick={() => handleToggleStoryline(st.id)}
                  className="hover:text-rose-400 cursor-pointer ml-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}

          {attachedWorldItems.map((wi) => (
            <span
              key={wi.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-950/50 text-cyan-300 border border-cyan-800/50"
            >
              <Globe className="w-2.5 h-2.5 text-cyan-400" />
              <span className="truncate max-w-[130px]">{wi.title}</span>
              <button
                type="button"
                onClick={() => handleToggleWorldItem(wi.id)}
                className="hover:text-rose-400 cursor-pointer ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          {attachedCharacters.map((ch) => (
            <span
              key={ch.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-950/50 text-blue-300 border border-blue-800/50"
            >
              <User className="w-2.5 h-2.5 text-blue-400" />
              <span className="truncate max-w-[130px]">{ch.name}</span>
              <button
                type="button"
                onClick={() => handleToggleCharacter(ch.id)}
                className="hover:text-rose-400 cursor-pointer ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          {customTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-900 text-zinc-300 border border-zinc-800"
            >
              <span className="text-emerald-400">#</span>
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveCustomTag(tag)}
                className="hover:text-rose-400 cursor-pointer ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Block body */}
      {!collapsed && (
        <div className="px-3 pb-3 pt-2 bg-zinc-950 w-full">
          {block.type === 'text' ? (
            /* NON-LIST (TEXT) NOTE: */
            /* In edit mode, the writing box expands generously (min-h-[260px]) so the author can write comfortably. */
            /* In view mode, the writing box disappears completely; content renders directly on the card without box. */
            isEditingContent ? (
              <div className="space-y-2 animate-in fade-in duration-100 w-full">
                <textarea
                  ref={textareaRef}
                  value={localContent}
                  onChange={(e) => handleContentChange(e.currentTarget.value)}
                  onBlur={handleFinishEditing}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      handleFinishEditing();
                    }
                  }}
                  placeholder={t('contextNotesPlaceholder')}
                  rows={10}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 rounded-sm p-3 text-xs text-zinc-100 min-h-[260px] sm:min-h-[300px] max-h-[650px] resize-y focus:outline-none transition font-sans leading-relaxed placeholder:text-zinc-600 shadow-inner"
                />
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {t('saveShortcutsHint')}
                  </span>
                  <button
                    type="button"
                    onClick={handleFinishEditing}
                    className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('doneEditing')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingContent(true)}
                title={t('clickToEditNote')}
                className="group/note cursor-pointer min-h-[42px] p-2.5 rounded-sm border border-transparent hover:border-zinc-800 hover:bg-zinc-900/40 transition text-xs font-sans leading-relaxed select-text w-full"
              >
                {localContent.trim() ? (
                  <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {localContent}
                  </p>
                ) : (
                  <span className="text-zinc-600 italic flex items-center gap-1.5">
                    <Pencil className="w-3 h-3 text-zinc-600 group-hover/note:text-zinc-400 transition" />
                    <span>{t('clickToEditNote')}</span>
                  </span>
                )}
              </div>
            )
          ) : (
            /* LIST NOTE: */
            /* In edit mode, the writing box expands generously for editing bullet lines. */
            /* In view mode, only formatted bullet items are seen. */
            isEditingContent ? (
              <div className="space-y-2 animate-in fade-in duration-100 w-full">
                <textarea
                  ref={textareaRef}
                  value={localContent}
                  onChange={(e) => handleContentChange(e.currentTarget.value)}
                  onBlur={handleFinishEditing}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      handleFinishEditing();
                    }
                  }}
                  placeholder={t('oneItemPerLine')}
                  rows={10}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 rounded-sm p-3 text-xs text-zinc-100 min-h-[260px] sm:min-h-[300px] max-h-[650px] resize-y focus:outline-none transition font-sans leading-relaxed placeholder:text-zinc-600 shadow-inner"
                />
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {t('saveShortcutsHint')}
                  </span>
                  <button
                    type="button"
                    onClick={handleFinishEditing}
                    className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('doneEditing')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingContent(true)}
                title={t('clickToEditNote')}
                className="group/list cursor-pointer min-h-[42px] p-2.5 rounded-sm border border-transparent hover:border-zinc-800 hover:bg-zinc-900/40 transition text-xs font-sans select-text w-full"
              >
                {listItems.length > 0 ? (
                  <ul className="space-y-1.5">
                    {listItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-zinc-200 leading-snug">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="select-text">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-zinc-600 italic flex items-center gap-1.5">
                    <Plus className="w-3 h-3 text-zinc-600 group-hover/list:text-zinc-400 transition" />
                    <span>{t('emptyListClickToEdit')}</span>
                  </span>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default memo(ContextBlockItemComponent);
