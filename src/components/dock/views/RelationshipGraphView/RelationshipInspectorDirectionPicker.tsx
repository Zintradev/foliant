import { memo } from 'react';
import { RelationshipDirection } from '../../../../types/dock';

const DIRECTIONS: { dir: RelationshipDirection; label: string; sublabel: string; ariaLabel: string }[] = [
  { dir: 'directed', label: 'A → B', sublabel: 'Forward', ariaLabel: 'Directed' },
  { dir: 'reverse', label: 'B → A', sublabel: 'Backward', ariaLabel: 'Reverse' },
  { dir: 'bidirectional', label: 'A ↔ B', sublabel: 'Bidirectional', ariaLabel: 'Bidirectional' },
  { dir: 'none', label: 'None', sublabel: 'Undirected', ariaLabel: 'None' },
];

interface RelationshipInspectorDirectionPickerProps {
  direction?: RelationshipDirection;
  onChange: (dir: RelationshipDirection) => void;
}

export const RelationshipInspectorDirectionPicker = memo(function RelationshipInspectorDirectionPicker({
  direction = 'bidirectional',
  onChange,
}: RelationshipInspectorDirectionPickerProps) {
  return (
    <div className="space-y-0.5">
      <label className="text-[9px] font-mono text-zinc-500 uppercase">Flow Direction</label>
      <div className="grid grid-cols-4 gap-1">
        {DIRECTIONS.map(({ dir, label, sublabel, ariaLabel }) => {
          const isCurrent = direction === dir;
          return (
            <button
              key={dir}
              type="button"
              aria-label={ariaLabel}
              title={`${label} (${sublabel})`}
              onClick={() => onChange(dir)}
              className={`py-1 px-0.5 rounded-xs border text-[9px] font-mono transition cursor-pointer flex flex-col items-center justify-center text-center ${
                isCurrent
                  ? 'bg-zinc-800 border-zinc-600 text-white font-semibold shadow-xs'
                  : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="font-bold leading-tight">{label}</span>
              <span className="text-[7.5px] text-zinc-500 leading-tight truncate max-w-full">
                {sublabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
