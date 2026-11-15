import { memo } from 'react';
import { RelationshipDirection } from '../../../../types/dock';
import { useTranslation } from '../../../../i18n/translations';

const DIRECTIONS: { dir: RelationshipDirection; label: string; subKey: string; ariaLabel: string }[] = [
  { dir: 'directed', label: 'A → B', subKey: 'dirForward', ariaLabel: 'Directed' },
  { dir: 'reverse', label: 'B → A', subKey: 'dirBackward', ariaLabel: 'Reverse' },
  { dir: 'bidirectional', label: 'A ↔ B', subKey: 'dirBidirectional', ariaLabel: 'Bidirectional' },
  { dir: 'none', label: 'None', subKey: 'dirUndirected', ariaLabel: 'None' },
];

interface RelationshipInspectorDirectionPickerProps {
  direction?: RelationshipDirection;
  onChange: (dir: RelationshipDirection) => void;
}

export const RelationshipInspectorDirectionPicker = memo(function RelationshipInspectorDirectionPicker({
  direction = 'bidirectional',
  onChange,
}: RelationshipInspectorDirectionPickerProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-0.5">
      <label className="text-[9px] font-mono text-zinc-500 uppercase">{t('flowDirection')}</label>
      <div className="grid grid-cols-4 gap-1">
        {DIRECTIONS.map(({ dir, label, subKey, ariaLabel }) => {
          const sublabel = t(subKey);
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
              <span className="font-bold leading-tight">{dir === 'none' ? t('dirNone') : label}</span>
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
