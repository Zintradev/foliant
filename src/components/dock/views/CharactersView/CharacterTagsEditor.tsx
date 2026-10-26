import { memo, useState } from 'react';
import { Tag } from 'lucide-react';
import { CharacterTag } from './types';
import { TAG_COLOR_MAP } from './constants';
import { CharacterTagBadge } from './CharacterTagBadge';
import { useTranslation } from '../../../../i18n/translations';

interface CharacterTagsEditorProps {
  tags: CharacterTag[];
  onAddTag: (label: string, color: string) => void;
  onRemoveTag: (tagId: string) => void;
}

export const CharacterTagsEditor = memo(function CharacterTagsEditor({
  tags,
  onAddTag,
  onRemoveTag,
}: CharacterTagsEditorProps) {
  const { t } = useTranslation();
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState('blue');

  const handleAdd = () => {
    if (!newTagInput.trim()) return;
    onAddTag(newTagInput.trim(), selectedTagColor);
    setNewTagInput('');
  };

  return (
    <div className="space-y-2 pt-2 border-t border-zinc-800/80">
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
        <span className="flex items-center gap-1">
          <Tag className="w-2.5 h-2.5 text-zinc-500" />
          {t('tags')} ({tags.length})
        </span>
      </div>

      {/* Existing Tags Chips */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <CharacterTagBadge
              key={tag.id}
              tag={tag}
              onRemove={() => onRemoveTag(tag.id)}
            />
          ))}
        </div>
      )}

      {/* Add Tag Row */}
      <div className="flex items-center gap-1.5 pt-1">
        <input
          type="text"
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={t('newTagPlaceholder')}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-0.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
        />

        {/* Tag Color Picker Dots */}
        <div className="flex items-center gap-1">
          {Object.keys(TAG_COLOR_MAP).map((cKey) => {
            const c = TAG_COLOR_MAP[cKey];
            return (
              <button
                key={cKey}
                type="button"
                onClick={() => setSelectedTagColor(cKey)}
                className={`w-3 h-3 rounded-full transition-transform ${c.dot} ${
                  selectedTagColor === cKey
                    ? 'scale-125 ring-1 ring-zinc-300 ring-offset-1 ring-offset-zinc-900'
                    : 'opacity-50 hover:opacity-100'
                }`}
                title={cKey}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!newTagInput.trim()}
          className="px-2 py-0.5 rounded-sm text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition cursor-pointer"
        >
          {t('add')}
        </button>
      </div>
    </div>
  );
});
