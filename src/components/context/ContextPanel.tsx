import { useState, useRef, useCallback, useMemo, memo } from 'react';
import {
  Plus,
  LayoutList,
  Columns2,
  Folder,
  FolderPlus,
  Search,
  X,
} from 'lucide-react';
import { ContextBlock } from '../../types/project';
import { StorylineItem, CharacterItem, WorldItem } from '../../types/dock';
import { useTranslation } from '../../i18n/translations';
import ContextBlockItem from './ContextBlockItem';

interface ContextPanelProps {
  blocks: ContextBlock[];
  onChange: (blocks: ContextBlock[]) => void;
  isExpanded?: boolean;
  onStartEditing?: () => void;
  storylines?: StorylineItem[];
  characters?: CharacterItem[];
  worldItems?: WorldItem[];
  notesDropMode?: 'shift' | 'swap';
}

let nextId = 100;
const generateId = () => `block-${++nextId}`;

function ContextPanelComponent({
  blocks,
  onChange,
  isExpanded = false,
  onStartEditing,
  storylines = [],
  characters = [],
  worldItems = [],
  notesDropMode = 'shift',
}: ContextPanelProps) {
  const { t } = useTranslation();
  const [layoutCols, setLayoutCols] = useState<1 | 2>(1);
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [shiftTargetIndex, setShiftTargetIndex] = useState<number | null>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const listContainerRef = useRef<HTMLDivElement>(null);
  const initialRects = useRef<
    { id: string; left: number; right: number; top: number; bottom: number; centerX: number; centerY: number }[]
  >([]);
  const isShiftMode = notesDropMode === 'shift';
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');
  const [customFolderList, setCustomFolderList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // Derive unique folders from all blocks and created folders
  const allFolders = useMemo(() => {
    const fromBlocks = blocks
      .map((b) => b.folder)
      .filter((f): f is string => Boolean(f && f.trim().length > 0));
    return Array.from(new Set([...fromBlocks, ...customFolderList]));
  }, [blocks, customFolderList]);

  // Derive all available tags across all blocks for quick filtering
  const allAvailableTags = useMemo(() => {
    const tags = new Set<string>();
    blocks.forEach((b) => {
      (b.tags || []).forEach((tag) => tags.add(`#${tag}`));
      (b.storylineIds || []).forEach((id) => {
        const found = storylines.find((s) => s.id === id);
        if (found) tags.add(`storyline:${found.id}:${found.title}`);
      });
      (b.characterIds || []).forEach((id) => {
        const found = characters.find((c) => c.id === id);
        if (found) tags.add(`character:${found.id}:${found.name}`);
      });
      (b.worldItemIds || []).forEach((id) => {
        const found = worldItems.find((w) => w.id === id);
        if (found) tags.add(`world:${found.id}:${found.title}`);
      });
    });
    return Array.from(tags);
  }, [blocks, storylines, characters, worldItems]);

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

  const handleAddFolder = useCallback((folderName: string) => {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    setCustomFolderList((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  }, []);

  const handleCreateFolderSubmit = () => {
    const trimmed = newFolderNameInput.trim();
    if (trimmed) {
      handleAddFolder(trimmed);
      setSelectedFolder(trimmed);
      setNewFolderNameInput('');
      setIsCreatingFolder(false);
    }
  };

  const addBlock = (type: ContextBlock['type']) => {
    const label = type === 'list' ? t('newList') : t('newSection');
    const newId = generateId();
    setFocusBlockId(newId);
    const assignedFolder =
      selectedFolder !== 'all' && selectedFolder !== 'uncategorized'
        ? selectedFolder
        : undefined;

    onChange([
      ...blocks,
      {
        id: newId,
        title: label,
        type,
        content: '',
        folder: assignedFolder,
        storylineIds: [],
        characterIds: [],
        tags: [],
      },
    ]);
  };

  const resetDragState = useCallback(() => {
    setDraggedBlockId(null);
    setDragOverBlockId(null);
    setShiftTargetIndex(null);
    initialRects.current = [];
  }, []);

  const handleDragStart = (id: string, index: number) => {
    setDraggedBlockId(id);
    setShiftTargetIndex(index);

    if (listContainerRef.current) {
      const containerRect = listContainerRef.current.getBoundingClientRect();
      const scrollLeft = listContainerRef.current.scrollLeft;
      const scrollTop = listContainerRef.current.scrollTop;

      initialRects.current = filteredBlocks.map((b) => {
        const el = blockRefs.current.get(b.id);
        if (!el) {
          return { id: b.id, left: 0, right: 0, top: 0, bottom: 0, centerX: 0, centerY: 0 };
        }
        const r = el.getBoundingClientRect();
        const left = r.left - containerRect.left + scrollLeft;
        const top = r.top - containerRect.top + scrollTop;
        return {
          id: b.id,
          left,
          right: left + r.width,
          top,
          bottom: top + r.height,
          centerX: left + r.width / 2,
          centerY: top + r.height / 2,
        };
      });
    }
  };

  const handleContainerDragEnter = (e: React.DragEvent) => {
    if (!draggedBlockId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    if (!draggedBlockId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isShiftMode) return;
    if (e.clientX === 0 && e.clientY === 0) return;
    if (!listContainerRef.current) return;

    const containerRect = listContainerRef.current.getBoundingClientRect();
    if (containerRect.height === 0) return;

    const relativeX =
      e.clientX - containerRect.left + listContainerRef.current.scrollLeft;
    const relativeY =
      e.clientY - containerRect.top + listContainerRef.current.scrollTop;

    if (initialRects.current.length > 0) {
      let targetSlot = filteredBlocks.length - 1;

      if (layoutCols === 1) {
        // Vertical list: compare against static midY of each slot
        for (let i = 0; i < initialRects.current.length; i++) {
          if (relativeY < initialRects.current[i].centerY) {
            targetSlot = i;
            break;
          }
        }
      } else {
        // Multi-column grid: closest center
        let closestIdx = 0;
        let minDistance = Infinity;
        for (let i = 0; i < initialRects.current.length; i++) {
          const r = initialRects.current[i];
          const dist = (r.centerX - relativeX) ** 2 + (r.centerY - relativeY) ** 2;
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = i;
          }
        }
        targetSlot = closestIdx;
      }

      targetSlot = Math.max(0, Math.min(filteredBlocks.length - 1, targetSlot));
      if (shiftTargetIndex !== targetSlot) {
        setShiftTargetIndex(targetSlot);
      }
    } else {
      // Fallback
      let accumulatedY = 0;
      let targetSlot = filteredBlocks.length - 1;
      for (let i = 0; i < filteredBlocks.length; i++) {
        const blockEl = blockRefs.current.get(filteredBlocks[i].id);
        const h = (blockEl?.offsetHeight || 60) + 10;
        if (relativeY < accumulatedY + h / 2) {
          targetSlot = i;
          break;
        }
        accumulatedY += h;
      }
      targetSlot = Math.max(0, Math.min(filteredBlocks.length - 1, targetSlot));
      if (shiftTargetIndex !== targetSlot) {
        setShiftTargetIndex(targetSlot);
      }
    }
  };

  const handleDropBlock = (
    e?: React.DragEvent,
    targetId?: string,
    targetIndex?: number
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const sourceId = draggedBlockId || e?.dataTransfer?.getData('text/plain');
    if (!sourceId) {
      resetDragState();
      return;
    }

    const sourceIdx = blocks.findIndex((b) => b.id === sourceId);
    if (sourceIdx === -1) {
      resetDragState();
      return;
    }

    if (notesDropMode === 'swap') {
      const effectiveTargetId = dragOverBlockId || targetId;
      if (effectiveTargetId && effectiveTargetId !== sourceId) {
        const targetIdx = blocks.findIndex((b) => b.id === effectiveTargetId);
        if (targetIdx !== -1 && sourceIdx !== targetIdx) {
          const next = [...blocks];
          const temp = next[sourceIdx];
          next[sourceIdx] = next[targetIdx];
          next[targetIdx] = temp;
          onChange(next);
        }
      }
    } else {
      // Shift mode
      let effectiveTargetSlot = -1;
      if (shiftTargetIndex !== null && shiftTargetIndex !== sourceIdx) {
        effectiveTargetSlot = shiftTargetIndex;
      } else if (targetIndex !== undefined && targetIndex !== -1) {
        effectiveTargetSlot = targetIndex;
      } else if (targetId) {
        effectiveTargetSlot = filteredBlocks.findIndex((b) => b.id === targetId);
      } else if (shiftTargetIndex !== null) {
        effectiveTargetSlot = shiftTargetIndex;
      }

      if (
        effectiveTargetSlot >= 0 &&
        effectiveTargetSlot < filteredBlocks.length
      ) {
        const targetBlock = filteredBlocks[effectiveTargetSlot];
        if (targetBlock) {
          const finalTargetIdx = blocks.findIndex((b) => b.id === targetBlock.id);
          if (finalTargetIdx !== -1 && sourceIdx !== finalTargetIdx) {
            const next = [...blocks];
            const [moved] = next.splice(sourceIdx, 1);
            next.splice(finalTargetIdx, 0, moved);
            onChange(next);
          }
        }
      }
    }

    resetDragState();
  };

  // Filter blocks by folder, search query, and tag
  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      // Folder filter
      if (selectedFolder === 'uncategorized') {
        if (b.folder && b.folder.trim().length > 0) return false;
      } else if (selectedFolder !== 'all') {
        if (b.folder !== selectedFolder) return false;
      }

      // Tag filter
      if (filterTag) {
        if (filterTag.startsWith('#')) {
          const rawTag = filterTag.slice(1);
          if (!(b.tags || []).includes(rawTag)) return false;
        } else if (filterTag.startsWith('storyline:')) {
          const stId = filterTag.split(':')[1];
          if (!(b.storylineIds || []).includes(stId)) return false;
        } else if (filterTag.startsWith('character:')) {
          const chId = filterTag.split(':')[1];
          if (!(b.characterIds || []).includes(chId)) return false;
        } else if (filterTag.startsWith('world:')) {
          const wId = filterTag.split(':')[1];
          if (!(b.worldItemIds || []).includes(wId)) return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = b.title.toLowerCase().includes(q);
        const matchesContent = b.content.toLowerCase().includes(q);
        const matchesTags = (b.tags || []).some((tag) => tag.toLowerCase().includes(q));
        const matchesFolder = Boolean(b.folder && b.folder.toLowerCase().includes(q));
        const matchesCharacters = (b.characterIds || []).some((id) => {
          const char = characters.find((c) => c.id === id);
          return char && char.name.toLowerCase().includes(q);
        });
        const matchesStorylines = (b.storylineIds || []).some((id) => {
          const st = storylines.find((s) => s.id === id);
          return st && st.title.toLowerCase().includes(q);
        });
        const matchesWorld = (b.worldItemIds || []).some((id) => {
          const w = worldItems.find((item) => item.id === id);
          return w && w.title.toLowerCase().includes(q);
        });
        if (
          !matchesTitle &&
          !matchesContent &&
          !matchesTags &&
          !matchesFolder &&
          !matchesCharacters &&
          !matchesStorylines &&
          !matchesWorld
        )
          return false;
      }

      return true;
    });
  }, [blocks, selectedFolder, filterTag, searchQuery]);

  const uncategorizedCount = useMemo(
    () => blocks.filter((b) => !b.folder || b.folder.trim().length === 0).length,
    [blocks]
  );

  return (
    <div className="flex flex-col h-full bg-zinc-950 select-none">
      {/* Header bar with layout column mode selector */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
            {t('dockNotes')}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-750">
            {filteredBlocks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLayoutCols(1)}
            title={t('lineView')}
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

      {/* Folder Navigation & Filter Bar */}
      <div className="px-3 py-1.5 border-b border-zinc-800/80 bg-zinc-900/40 shrink-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {/* All Notes Pill */}
        <button
          type="button"
          onClick={() => setSelectedFolder('all')}
          className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
            selectedFolder === 'all'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <span>{t('allNotes')}</span>
          <span className="text-[9px] text-zinc-500 font-mono">({blocks.length})</span>
        </button>

        {/* Dynamic Folders */}
        {allFolders.map((folder) => {
          const count = blocks.filter((b) => b.folder === folder).length;
          const isActive = selectedFolder === folder;
          return (
            <button
              key={folder}
              type="button"
              onClick={() => setSelectedFolder(folder)}
              className={`shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-amber-950/40 text-amber-300 border border-amber-800/60 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <Folder className={`w-3 h-3 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
              <span className="truncate max-w-[110px]">{folder}</span>
              <span className="text-[9px] opacity-70 font-mono">({count})</span>
            </button>
          );
        })}

        {/* Uncategorized Pill (if applicable) */}
        {uncategorizedCount > 0 && (
          <button
            type="button"
            onClick={() => setSelectedFolder('uncategorized')}
            className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
              selectedFolder === 'uncategorized'
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-850'
            }`}
          >
            <span>{t('uncategorized')}</span>
            <span className="text-[9px] text-zinc-600 font-mono">({uncategorizedCount})</span>
          </button>
        )}

        {/* Create Folder Inline Input / Button */}
        {isCreatingFolder ? (
          <div className="shrink-0 flex items-center gap-1 bg-zinc-950 border border-zinc-750 rounded px-1.5 py-0.5">
            <input
              type="text"
              autoFocus
              value={newFolderNameInput}
              onChange={(e) => setNewFolderNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolderSubmit();
                if (e.key === 'Escape') setIsCreatingFolder(false);
              }}
              placeholder={t('folderNamePlaceholder')}
              className="bg-transparent text-[11px] text-zinc-200 outline-none w-24 placeholder:text-zinc-600"
            />
            <button
              type="button"
              onClick={handleCreateFolderSubmit}
              className="text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreatingFolder(true)}
            title={t('newFolder')}
            className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-850 transition cursor-pointer border border-dashed border-zinc-800"
          >
            <FolderPlus className="w-3 h-3" />
            <span>{t('newFolder')}</span>
          </button>
        )}
      </div>

      {/* Search and Tag Filter Bar */}
      <div className="px-3 py-1.5 border-b border-zinc-800/80 bg-zinc-950 flex items-center gap-2 shrink-0">
        <div className="flex-1 flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded px-2 py-1">
          <Search className="w-3 h-3 text-zinc-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search')}
            className="w-full bg-transparent text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600 font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Tag Filter Selector if tags exist */}
        {allAvailableTags.length > 0 && (
          <div className="relative shrink-0">
            <select
              value={filterTag || ''}
              onChange={(e) => setFilterTag(e.target.value ? e.target.value : null)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-medium rounded px-2 py-1 outline-none cursor-pointer focus:border-zinc-700"
            >
              <option value="">{t('filterByTag')}</option>
              {allAvailableTags.map((tagItem) => {
                const label = tagItem.startsWith('#')
                  ? tagItem
                  : tagItem.startsWith('storyline:')
                  ? `[Trama] ${tagItem.split(':')[2]}`
                  : tagItem.startsWith('world:')
                  ? `[Mundo] ${tagItem.split(':')[2]}`
                  : `[Personaje] ${tagItem.split(':')[2]}`;
                return (
                  <option key={tagItem} value={tagItem}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Block list */}
      <div
        ref={listContainerRef}
        onDragEnter={handleContainerDragEnter}
        onDragOver={handleContainerDragOver}
        onDrop={(e) => handleDropBlock(e)}
        className="flex-1 overflow-y-auto p-3"
      >
        {filteredBlocks.length === 0 ? (
          <div className="text-center mt-8 space-y-1">
            <p className="text-[11px] text-zinc-500 italic">
              {blocks.length === 0 ? t('noSectionsYet') : t('noEntriesFound')}
            </p>
            {selectedFolder !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedFolder('all')}
                className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
              >
                {t('allNotes')}
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              layoutCols === 1
                ? 'flex flex-col gap-2.5 w-full'
                : isExpanded
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5'
                : 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start'
            }
          >
            {(() => {
              const isDraggingAny = draggedBlockId !== null;
              const sourceIndex =
                isDraggingAny && draggedBlockId
                  ? filteredBlocks.findIndex((b) => b.id === draggedBlockId)
                  : -1;
              const draggedElement = draggedBlockId
                ? blockRefs.current.get(draggedBlockId)
                : null;
              const draggedHeight = (draggedElement?.offsetHeight || 60) + 10;

              let draggedTargetOffset = 0;
              if (
                layoutCols === 1 &&
                isShiftMode &&
                isDraggingAny &&
                sourceIndex !== -1 &&
                shiftTargetIndex !== null
              ) {
                if (sourceIndex < shiftTargetIndex) {
                  for (let i = sourceIndex + 1; i <= shiftTargetIndex; i++) {
                    const el = blockRefs.current.get(filteredBlocks[i]?.id);
                    draggedTargetOffset += (el?.offsetHeight || 60) + 10;
                  }
                } else if (sourceIndex > shiftTargetIndex) {
                  for (let i = shiftTargetIndex; i < sourceIndex; i++) {
                    const el = blockRefs.current.get(filteredBlocks[i]?.id);
                    draggedTargetOffset -= (el?.offsetHeight || 60) + 10;
                  }
                }
              }

              return filteredBlocks.map((block, index) => {
                let rowTranslateY = 0;
                if (
                  layoutCols === 1 &&
                  isShiftMode &&
                  isDraggingAny &&
                  sourceIndex !== -1 &&
                  shiftTargetIndex !== null
                ) {
                  if (index === sourceIndex) {
                    rowTranslateY = draggedTargetOffset;
                  } else if (
                    sourceIndex < shiftTargetIndex &&
                    index > sourceIndex &&
                    index <= shiftTargetIndex
                  ) {
                    rowTranslateY = -draggedHeight;
                  } else if (
                    sourceIndex > shiftTargetIndex &&
                    index >= shiftTargetIndex &&
                    index < sourceIndex
                  ) {
                    rowTranslateY = draggedHeight;
                  }
                }

                return (
                  <ContextBlockItem
                    key={block.id}
                    block={block}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    isNewBlock={focusBlockId === block.id}
                    onClearFocus={() => setFocusBlockId(null)}
                    isDragging={draggedBlockId === block.id}
                    isDraggingAny={isDraggingAny}
                    isDragOver={
                      notesDropMode === 'swap'
                        ? dragOverBlockId === block.id
                        : shiftTargetIndex === index && draggedBlockId !== block.id
                    }
                    isShiftMode={isShiftMode}
                    rowTranslateY={rowTranslateY}
                    setElementRef={(el) => {
                      if (el) blockRefs.current.set(block.id, el);
                      else blockRefs.current.delete(block.id);
                    }}
                    onDragStart={() => {
                      handleDragStart(block.id, index);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (notesDropMode === 'swap') {
                        if (dragOverBlockId !== block.id) setDragOverBlockId(block.id);
                      } else {
                        if (e.clientX === 0 && e.clientY === 0) {
                          if (shiftTargetIndex !== index) setShiftTargetIndex(index);
                        } else {
                          handleContainerDragOver(e);
                        }
                      }
                    }}
                    onDrop={(e) => {
                      handleDropBlock(e, block.id, index);
                    }}
                    onDragEnd={resetDragState}
                    onStartEditing={onStartEditing}
                    storylines={storylines}
                    characters={characters}
                    worldItems={worldItems}
                    availableFolders={allFolders}
                    onAddFolder={handleAddFolder}
                    isLineView={layoutCols === 1}
                  />
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Footer — add block actions */}
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
