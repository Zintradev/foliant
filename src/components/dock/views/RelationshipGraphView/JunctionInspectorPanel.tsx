import { memo } from 'react';
import { X, Trash2, GitCommit, GitMerge } from 'lucide-react';
import { GraphJunctionNode, StorylineItem } from '../../../../types/dock';
import { STORYLINE_THEMES } from './constants';
import { useTranslation } from '../../../../i18n/translations';

interface JunctionInspectorPanelProps {
  junction: GraphJunctionNode;
  storylines: StorylineItem[];
  onClose: () => void;
  onUpdateJunction: (updated: GraphJunctionNode) => void;
  onDeleteJunction: (id: string) => void;
}

function JunctionInspectorPanelComponent({
  junction,
  storylines,
  onClose,
  onUpdateJunction,
  onDeleteJunction,
}: JunctionInspectorPanelProps) {
  const { t } = useTranslation();
  const linkedStoryline = storylines.find((s) => s.id === junction.storylineId);
  const storylineTheme = linkedStoryline
    ? STORYLINE_THEMES[linkedStoryline.color] || STORYLINE_THEMES.blue
    : null;

  return (
    <div
      className="absolute top-12 right-4 z-40 w-72 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl p-3 text-xs text-zinc-300 font-sans select-none"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850 mb-2">
        <div className="flex items-center gap-1.5">
          <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-zinc-100 text-xs font-mono">
            Union Node Inspector
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-200 transition p-0.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        {/* Node Name */}
        <div className="space-y-0.5">
          <label className="text-[9px] font-mono text-zinc-500 uppercase">Node Name</label>
          <input
            type="text"
            value={junction.label || ''}
            placeholder="e.g. Stark-Tully Union, Northern Alliance"
            onChange={(e) => onUpdateJunction({ ...junction, label: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
          />
        </div>

        {/* Storyline Linkage Selector */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-mono text-zinc-500 uppercase">
              Linked Storyline / Plot Thread
            </label>
            <GitMerge className="w-3 h-3 text-zinc-500" />
          </div>
          <select
            value={junction.storylineId || ''}
            onChange={(e) =>
              onUpdateJunction({
                ...junction,
                storylineId: e.target.value || undefined,
              })
            }
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
          >
            <option value="">No Storyline (Independent)</option>
            {storylines.map((st) => (
              <option key={st.id} value={st.id}>
                {st.title}
              </option>
            ))}
          </select>
          {linkedStoryline && storylineTheme && (
            <div
              className={`mt-1 flex items-center gap-1.5 px-2 py-1 rounded-xs border text-[10px] ${storylineTheme.bg} ${storylineTheme.border} ${storylineTheme.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${storylineTheme.dot}`} />
              <span className="truncate">{linkedStoryline.title}</span>
            </div>
          )}
        </div>

        {/* Delete Union Action */}
        <div className="pt-1.5 border-t border-zinc-850 flex justify-end">
          <button
            type="button"
            onClick={() => onDeleteJunction(junction.id)}
            className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-xs hover:bg-zinc-900 transition cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>{t('deleteUnion')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export const JunctionInspectorPanel = memo(JunctionInspectorPanelComponent);
