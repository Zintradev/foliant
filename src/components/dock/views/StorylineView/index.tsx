import { useState, useMemo, memo } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';
import { StorylineViewProps, ViewMode } from './types';
import { useStorylineActions } from './useStorylineActions';
import { StorylineHeader } from './StorylineHeader';
import { StorylineAddDrawer } from './StorylineAddDrawer';
import { StorylineThreadsView } from './StorylineThreadsView';
import { StorylineChaptersView } from './StorylineChaptersView';

export function StorylineViewComponent({
  storylines,
  chapters,
  worldItems = [],
  onChange,
  onSelectChapter,
  colorSettings,
  isExpanded = false,
  onDirtyChange,
}: StorylineViewProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('threads');

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
    handleLinkWorldItem,
    handleUnlinkWorldItem,
  } = useStorylineActions({
    storylines,
    onChange,
    onDirtyChange,
  });

  return (
    <div className="flex flex-col h-full select-none bg-zinc-950 font-sans">
      <StorylineHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        storylinesCount={storylines.length}
        chaptersCount={validChapters.length}
        onToggleAdd={() => setIsAdding(!isAdding)}
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
          validChapters={validChapters}
          onCancel={() => setIsAdding(false)}
          onAdd={handleAddStoryline}
        />
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {viewMode === 'threads' && (
          <StorylineThreadsView
            storylines={storylines}
            colorSettings={colorSettings}
            validChapters={validChapters}
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
            onDeleteStoryline={handleDeleteStoryline}
            onAddField={handleAddField}
            onUpdateField={handleUpdateField}
            onDeleteField={handleDeleteField}
            onMoveField={handleMoveField}
            onSelectChapter={onSelectChapter}
            onLinkChapter={handleLinkChapter}
            onUnlinkChapter={handleUnlinkChapter}
            onLinkWorldItem={handleLinkWorldItem}
            onUnlinkWorldItem={handleUnlinkWorldItem}
          />
        )}

        {viewMode === 'chapters' && (
          <StorylineChaptersView
            validChapters={validChapters}
            storylines={storylines}
            colorSettings={colorSettings}
            isExpanded={isExpanded}
            onSelectChapter={onSelectChapter}
            onLinkChapter={handleLinkChapter}
            onUnlinkChapter={handleUnlinkChapter}
          />
        )}
      </div>

      {!isAdding && (
        <div className="p-2 border-t border-zinc-800 bg-zinc-950/80">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded-sm text-[11px] font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition"
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
