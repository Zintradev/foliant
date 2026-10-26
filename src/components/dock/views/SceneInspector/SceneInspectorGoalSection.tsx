import React, { memo } from 'react';
import { Target, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';

interface SceneInspectorGoalSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  currentWords: number;
  targetWords: number;
  progressPercent: number;
  clampedProgress: number;
  readingTimeMin: number;
  onTargetWordsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectPreset: (preset: number) => void;
}

function SceneInspectorGoalSection({
  isOpen,
  onToggle,
  currentWords,
  targetWords,
  progressPercent,
  clampedProgress,
  readingTimeMin,
  onTargetWordsChange,
  onSelectPreset,
}: SceneInspectorGoalSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="p-3">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left group cursor-pointer"
      >
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5 group-hover:text-zinc-200 transition">
          <Target className="w-3 h-3 text-zinc-400" />
          {t('wordGoalAndProgress')}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-mono font-semibold ${
              progressPercent >= 100
                ? 'text-emerald-400'
                : progressPercent >= 70
                ? 'text-blue-400'
                : 'text-zinc-400'
            }`}
          >
            {progressPercent.toFixed(0)}%
          </span>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="mt-3 p-3 rounded-sm border border-zinc-800/80 bg-zinc-900/40 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block mb-0.5">
                {t('currentWords')}
              </span>
              <div className="text-sm font-bold font-mono text-zinc-100">
                {currentWords.toLocaleString()}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 font-mono block mb-0.5">
                {t('targetWords')}
              </span>
              <input
                type="number"
                min="0"
                step="100"
                value={targetWords}
                onChange={onTargetWordsChange}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xs px-2 py-0.5 text-xs font-mono text-zinc-100 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progressPercent > 100
                    ? 'bg-rose-500'
                    : progressPercent >= 70
                    ? 'bg-emerald-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${clampedProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
              <span>{Math.max(0, targetWords - currentWords).toLocaleString()} {t('wordsLeft')}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> ~{readingTimeMin} {t('minRead')}
              </span>
            </div>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1 pt-1 border-t border-zinc-800/60">
            <span className="text-[9px] text-zinc-500 font-mono mr-1">{t('wordPresets')}:</span>
            {[1000, 2000, 2500, 5000].map((preset) => (
              <button
                key={preset}
                onClick={() => onSelectPreset(preset)}
                className={`px-1.5 py-0.5 rounded-xs text-[9px] font-mono transition cursor-pointer ${
                  targetWords === preset
                    ? 'bg-zinc-700 text-zinc-100 border border-zinc-600'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {preset >= 1000 ? `${preset / 1000}k` : preset}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(SceneInspectorGoalSection);
