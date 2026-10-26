import { memo } from 'react';
import { X } from 'lucide-react';
import { CharacterTag } from './types';
import { TAG_COLOR_MAP } from './constants';

interface CharacterTagBadgeProps {
  tag: CharacterTag;
  onRemove?: () => void;
}

export const CharacterTagBadge = memo(function CharacterTagBadge({
  tag,
  onRemove,
}: CharacterTagBadgeProps) {
  const style = TAG_COLOR_MAP[tag.color] ?? TAG_COLOR_MAP.zinc;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-xs border ${style.bg} ${style.border} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{tag.label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-red-400 ml-0.5 transition cursor-pointer"
          title="Remove tag"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
});
