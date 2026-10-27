import { useState, useMemo, memo } from 'react';
import { WorldbuildingViewProps, WorldItem } from './types';
import { DEFAULT_CATEGORIES } from './constants';
import { useWorldbuildingDragDrop } from './useWorldbuildingDragDrop';
import { useWorldbuildingDraft } from './useWorldbuildingDraft';
import { WorldbuildingSidebarHeader } from './WorldbuildingSidebarHeader';
import { WorldbuildingFilters } from './WorldbuildingFilters';
import { WorldbuildingList } from './WorldbuildingList';
import { WorldbuildingDetailHeader } from './WorldbuildingDetailHeader';
import { WorldbuildingDetailEditor } from './WorldbuildingDetailEditor';
import { WorldbuildingEmptyDetail } from './WorldbuildingEmptyDetail';

export function WorldbuildingViewComponent({
  items,
  onChange,
  worldDropMode = 'shift',
  isExpanded = false,
  saveMode = 'auto',
  onDirtyChange,
}: WorldbuildingViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(() => items[0]?.id ?? null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const allCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [items]);

  const activeItem = useMemo(() => {
    return items.find((i) => i.id === selectedId) || null;
  }, [items, selectedId]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [items, selectedCategory, searchQuery]);

  const handleUpdateActive = (updates: Partial<WorldItem>) => {
    if (!activeItem) return;
    onChange(
      items.map((item) => (item.id === activeItem.id ? { ...item, ...updates } : item))
    );
  };

  const {
    draftTitle,
    draftCategory,
    draftSummary,
    draftDescription,
    hasPendingChanges,
    setDraftTitle,
    setDraftCategory,
    setDraftSummary,
    setDraftDescription,
    handleSaveDraft,
    handleDiscardDraft,
  } = useWorldbuildingDraft({
    activeItem,
    onDirtyChange,
    onUpdateActive: handleUpdateActive,
  });

  const {
    isShiftMode,
    draggedItemId,
    dragOverItemId,
    shiftTargetIndex,
    itemRefs,
    listContainerRef,
    handleDragStart,
    handleContainerDragEnter,
    handleContainerDragOver,
    handleItemDragOver,
    handleDrop,
    handleDragEnd,
  } = useWorldbuildingDragDrop({
    items,
    filteredItems,
    worldDropMode,
    onChange,
  });

  const handleCreateNew = () => {
    const newItem: WorldItem = {
      id: `world-${Date.now()}`,
      title: 'New World Entity',
      category: selectedCategory === 'All' ? 'Location' : selectedCategory,
      summary: '',
      description: '',
    };
    onChange([newItem, ...items]);
    setSelectedId(newItem.id);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const remaining = items.filter((item) => item.id !== id);
    onChange(remaining);
    if (selectedId === id) {
      setSelectedId(remaining[0]?.id ?? null);
    }
  };

  return (
    <div className="flex h-full w-full select-none bg-zinc-950 overflow-hidden font-sans text-zinc-200">
      <div
        className={`${
          activeItem && !isExpanded ? 'hidden md:flex' : 'flex'
        } w-full md:w-72 lg:w-80 flex-col border-r border-zinc-800 bg-zinc-950/80 shrink-0 h-full`}
      >
        <WorldbuildingSidebarHeader
          itemCount={items.length}
          onCreateNew={handleCreateNew}
        />
        <WorldbuildingFilters
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          allCategories={allCategories}
          items={items}
        />
        <WorldbuildingList
          filteredItems={filteredItems}
          selectedId={selectedId}
          draggedItemId={draggedItemId}
          dragOverItemId={dragOverItemId}
          isShiftMode={isShiftMode}
          shiftTargetIndex={shiftTargetIndex}
          itemRefs={itemRefs}
          listContainerRef={listContainerRef}
          onSelect={setSelectedId}
          onDelete={handleDelete}
          onCreateNew={handleCreateNew}
          onDragStart={handleDragStart}
          onContainerDragEnter={handleContainerDragEnter}
          onContainerDragOver={handleContainerDragOver}
          onItemDragOver={handleItemDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      </div>

      <div
        className={`${
          !activeItem ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col h-full bg-zinc-950 overflow-y-auto min-w-0`}
      >
        {activeItem ? (
          <div className="flex flex-col h-full">
            <WorldbuildingDetailHeader
              category={activeItem.category}
              saveMode={saveMode}
              hasPendingChanges={hasPendingChanges}
              onBack={() => setSelectedId(null)}
              onDiscardDraft={handleDiscardDraft}
              onSaveDraft={handleSaveDraft}
              onDelete={(e) => handleDelete(activeItem.id, e)}
            />
            <WorldbuildingDetailEditor
              item={activeItem}
              saveMode={saveMode}
              draftTitle={draftTitle}
              draftCategory={draftCategory}
              draftSummary={draftSummary}
              draftDescription={draftDescription}
              onDraftTitleChange={setDraftTitle}
              onDraftCategoryChange={setDraftCategory}
              onDraftSummaryChange={setDraftSummary}
              onDraftDescriptionChange={setDraftDescription}
              onUpdateActive={handleUpdateActive}
            />
          </div>
        ) : (
          <WorldbuildingEmptyDetail onCreateNew={handleCreateNew} />
        )}
      </div>
    </div>
  );
}

export default memo(WorldbuildingViewComponent);
