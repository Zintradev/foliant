import { Plus } from 'lucide-react';
import { memo, useMemo, useState, useCallback } from 'react';
import Fuse from 'fuse.js';
import { useTranslation } from '../../../../i18n/translations';
import ConfirmDeleteModal from '../../../common/ConfirmDeleteModal';
import { StorylineAddDrawer } from './StorylineAddDrawer';
import { StorylineChaptersView } from './StorylineChaptersView';
import { StorylineHeader } from './StorylineHeader';
import { StorylineThreadsView } from './StorylineThreadsView';
import { StorylineViewProps, ViewMode } from './types';
import { loadSettings } from '../../../../types/settings';
import { useStorylineActions } from './useStorylineActions';

export function StorylineViewComponent({
  storylines,
  chapters,
  worldItems = [],
  characters = [],
  onChange,
  onSelectChapter,
  colorSettings,
  isExpanded = false,
  onDirtyChange,
  storylinesDropMode = 'shift',
}: StorylineViewProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('threads');
  const [storylinePendingDeleteId, setStorylinePendingDeleteId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFuzzy, setIsFuzzy] = useState(false);

  const validChapters = useMemo(
    () => chapters.filter((c) => c.type !== 'folder'),
    [chapters]
  );

  const {
    isAdding,
    setIsAdding,
    newTitle,
    setNewTitle,
    newDescription,
    setNewDescription,
    newColor,
    setNewColor,
    initialChapterId,
    setInitialChapterId,
    initialCharacterId,
    setInitialCharacterId,
    editingStorylineId,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editColor,
    setEditColor,
    handleAddStoryline,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteStoryline,
    handleAddField,
    handleUpdateField,
    handleDeleteField,
    handleMoveField,
    handleLinkChapter,
    handleUnlinkChapter,
    handleLinkCharacter,
    handleUnlinkCharacter,
    handleLinkWorldItem,
    handleUnlinkWorldItem,
  } = useStorylineActions({
    storylines,
    onChange,
    onDirtyChange,
  });

  const storylinePendingDelete = storylinePendingDeleteId
    ? storylines.find((s) => s.id === storylinePendingDeleteId)
    : undefined;

  const storylineFuse = useMemo(() => {
    if (!isFuzzy) return null;
    return new Fuse(storylines, {
      keys: ['title', 'description'],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [storylines, isFuzzy]);

  const filteredStorylines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return storylines;
    if (isFuzzy && storylineFuse && q.length >= 2) {
      const results = storylineFuse.search(q);
      const ids = new Set(results.map((r) => r.item.id));
      return storylines.filter((s) => ids.has(s.id));
    }
    return storylines.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [storylines, searchQuery, isFuzzy, storylineFuse]);

  const handleMoveStoryline = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= storylines.length) return;
      const next = [...storylines];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      onChange(next);
    },
    [storylines, onChange]
  );

  const handleReorder = useCallback(
    (sourceIndex: number, targetIndex: number) => {
      if (
        sourceIndex === targetIndex ||
        sourceIndex < 0 ||
        targetIndex < 0 ||
        sourceIndex >= storylines.length ||
        targetIndex >= storylines.length
      ) {
        return;
      }
      const next = [...storylines];
      if (storylinesDropMode === 'swap') {
        const temp = next[sourceIndex];
        next[sourceIndex] = next[targetIndex];
        next[targetIndex] = temp;
      } else {
        const [moved] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, moved);
      }
      onChange(next);
    },
    [storylines, storylinesDropMode, onChange]
  );

  const handleConfirmDeleteStoryline = () => {
    if (storylinePendingDeleteId) {
      handleDeleteStoryline(storylinePendingDeleteId);
    }
    setStorylinePendingDeleteId(null);
  };

  return (
    <div className="flex flex-col h-full select-none bg-zinc-950 font-sans">
      <StorylineHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        storylinesCount={storylines.length}
        chaptersCount={validChapters.length}
        onToggleAdd={() => setIsAdding(!isAdding)}
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => {
          setIsSearchOpen((prev) => !prev);
          if (isSearchOpen) setSearchQuery('');
        }}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        isFuzzy={isFuzzy}
        onToggleFuzzy={() => setIsFuzzy((prev) => !prev)}
      />

      {isAdding && (
        <StorylineAddDrawer
          newTitle={newTitle}
          onNewTitleChange={setNewTitle}
          newDescription={newDescription}
          onNewDescriptionChange={setNewDescription}
          newColor={newColor}
          onNewColorChange={setNewColor}
          initialChapterId={initialChapterId}
          onInitialChapterIdChange={setInitialChapterId}
          initialCharacterId={initialCharacterId}
          onInitialCharacterIdChange={setInitialCharacterId}
          validChapters={validChapters}
          characters={characters}
          onCancel={() => setIsAdding(false)}
          onAdd={handleAddStoryline}
        />
      )}

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {viewMode === 'threads' && (
          <StorylineThreadsView
            storylines={filteredStorylines}
            allStorylines={storylines}
            onChange={onChange}
            colorSettings={colorSettings}
            validChapters={validChapters}
            characters={characters}
            worldItems={worldItems}
            isExpanded={isExpanded}
            editingStorylineId={editingStorylineId}
            editTitle={editTitle}
            onEditTitleChange={setEditTitle}
            editDescription={editDescription}
            onEditDescriptionChange={setEditDescription}
            editColor={editColor}
            onEditColorChange={setEditColor}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onStartEdit={handleStartEdit}
            onDeleteStoryline={(id: string) => {
              const shouldConfirm = loadSettings()?.preferences?.confirmDelete?.storylines ?? true;
              if (!shouldConfirm) {
                handleDeleteStoryline(id);
                return;
              }
              setStorylinePendingDeleteId(id);
            }}
            onAddField={handleAddField}
            onUpdateField={handleUpdateField}
            onDeleteField={handleDeleteField}
            onMoveField={handleMoveField}
            onReorderStorylines={handleReorder}
            onMoveStoryline={handleMoveStoryline}
            storylinesDropMode={storylinesDropMode}
            onSelectChapter={onSelectChapter}
            onLinkChapter={handleLinkChapter}
            onUnlinkChapter={handleUnlinkChapter}
            onLinkCharacter={handleLinkCharacter}
            onUnlinkCharacter={handleUnlinkCharacter}
            onLinkWorldItem={handleLinkWorldItem}
            onUnlinkWorldItem={handleUnlinkWorldItem}
          />
        )}

        {viewMode === 'chapters' && (
          <div className="flex-1 overflow-y-auto p-2">
            <StorylineChaptersView
              validChapters={validChapters}
              storylines={storylines}
              colorSettings={colorSettings}
              isExpanded={isExpanded}
              onSelectChapter={onSelectChapter}
              onLinkChapter={handleLinkChapter}
              onUnlinkChapter={handleUnlinkChapter}
            />
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(storylinePendingDeleteId)}
        onCancel={() => setStorylinePendingDeleteId(null)}
        onConfirm={handleConfirmDeleteStoryline}
        title={t('deleteStorylineConfirmTitle')}
        itemName={storylinePendingDelete?.title}
        message={t('deleteStorylineConfirmMessage')}
      />

      {!isAdding && (
        <div className="p-2 border-t border-zinc-800 bg-zinc-950/80">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded-sm text-[11px] font-medium text-zinc-200 hover:text-white border border-zinc-700 hover:border-zinc-600 bg-zinc-900/80 hover:bg-zinc-850 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addStoryline')}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(StorylineViewComponent);