import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';
import { TextNode } from '../../../../types/project';
import { StorylineColor } from './types';
import { STORYLINE_COLORS, COLOR_CLASSES } from './constants';

interface StorylineAddDrawerProps {
  newTitle: string;
  onNewTitleChange: (val: string) => void;
  newDescription: string;
  onNewDescriptionChange: (val: string) => void;
  newColor: StorylineColor;
  onNewColorChange: (c: StorylineColor) => void;
  initialChapterId: string;
  onInitialChapterIdChange: (id: string) => void;
  validChapters: TextNode[];
  onCancel: () => void;
  onAdd: () => void;
}

export const StorylineAddDrawer = React.memo(function StorylineAddDrawer({
  newTitle,
  onNewTitleChange,
  newDescription,
  onNewDescriptionChange,
  newColor,
  onNewColorChange,
  initialChapterId,
  onInitialChapterIdChange,
  validChapters,
  onCancel,
  onAdd,
}: StorylineAddDrawerProps) {
  const { t } = useTranslation();

  return (
    <div className="p-3 border-b border-zinc-800 bg-zinc-900/90 space-y-2.5 animate-in fade-in duration-100">
      <input
        type="text"
        placeholder={t('storylineTitlePlaceholder')}
        value={newTitle}
        onChange={(e) => onNewTitleChange(e.target.value)}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
        autoFocus
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">{t('color')}:</span>
          {STORYLINE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onNewColorChange(c)}
              className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                COLOR_CLASSES[c].dot
              } ${
                newColor === c
                  ? 'scale-125 ring-1 ring-zinc-300 ring-offset-1 ring-offset-zinc-900'
                  : 'opacity-60 hover:opacity-100'
              }`}
            />
          ))}
        </div>

        {validChapters.length > 0 && (
          <div className="relative">
            <select
              value={initialChapterId}
              onChange={(e) => onInitialChapterIdChange(e.target.value)}
              className="appearance-none bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 pr-6 text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
            >
              <option value="">{t('noneSelect')}</option>
              {validChapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  Link: {ch.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-2.5 h-2.5 text-zinc-500 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
          </div>
        )}
      </div>

      <textarea
        placeholder={t('storylineGoalPlaceholder')}
        value={newDescription}
        onChange={(e) => onNewDescriptionChange(e.target.value)}
        rows={2}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans"
      />

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-2.5 py-1 rounded-sm text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
        >
          {t('cancel')}
        </button>
        <button
          onClick={onAdd}
          disabled={!newTitle.trim()}
          className="px-3 py-1 rounded-sm text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition cursor-pointer"
        >
          {t('addStoryline')}
        </button>
      </div>
    </div>
  );
});
