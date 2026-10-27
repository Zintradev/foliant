import { memo } from 'react';
import { Clock, Layers, Target, TrendingUp } from 'lucide-react';
import { ChapterStatus } from '../../../../types/project';
import { ProgressStatus } from './types';
import { formatReadingTime } from './statUtils';
import { useTranslation } from '../../../../i18n/translations';

interface ProjectStatsCardsExpandedProps {
  totalWords: number;
  targetWordCount: number;
  globalStatus: ProgressStatus;
  remainingWords: number;
  sceneCount: number;
  folderCount: number;
  statusCounts: Record<ChapterStatus, number>;
  onTargetWordCountChange: (next: number) => void;
}

function ProjectStatsCardsExpandedComponent({
  totalWords,
  targetWordCount,
  globalStatus,
  remainingWords,
  sceneCount,
  folderCount,
  statusCounts,
  onTargetWordCountChange,
}: ProjectStatsCardsExpandedProps) {
  const { t } = useTranslation();

  const getBadgeLabel = (badgeText: string): string => {
    switch (badgeText) {
      case 'No target':
        return t('noTarget');
      case 'Exceeded':
        return t('exceeded');
      case 'Optimal':
        return t('optimal');
      case 'In Progress':
        return t('statusInProgress');
      default:
        return badgeText;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. Target Tracking Card */}
      <div className="p-4 rounded-sm border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
            {t('targetTracking')}
          </span>
          <span
            className={`px-2 py-0.5 rounded-xs border text-[10px] font-mono uppercase tracking-wider ${globalStatus.badgeClass}`}
          >
            {getBadgeLabel(globalStatus.badgeText)}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-2xl lg:text-3xl font-bold text-zinc-100">
              {totalWords.toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span>/</span>
              <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-500 rounded-xs px-1.5 py-0.5">
                <Target className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={targetWordCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    const next = isNaN(val) ? 0 : Math.max(0, val);
                    onTargetWordCountChange(next);
                  }}
                  title="Edit Global Word Goal directly"
                  className="w-20 bg-transparent text-xs font-mono font-bold text-zinc-200 focus:outline-none"
                />
                <span className="text-[10px] text-zinc-500 font-mono">w</span>
              </div>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700/40">
            <div
              className={`h-full rounded-full transition-all duration-300 ${globalStatus.barColor}`}
              style={{ width: `${Math.min(globalStatus.percent, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pt-1 border-t border-zinc-800/80">
          <span className="font-semibold text-zinc-300">
            {globalStatus.percent.toFixed(1)}% {t('completed')}
          </span>
          <span>
            {remainingWords > 0
              ? `${remainingWords.toLocaleString()} ${t('wordsRemaining')}`
              : t('goalReached')}
          </span>
        </div>
      </div>

      {/* 2. Pacing & Time Card */}
      <div className="p-4 rounded-sm border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between space-y-3">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          {t('readingAndPacing')}
        </span>

        <div className="space-y-1">
          <div className="text-2xl lg:text-3xl font-bold font-mono text-zinc-100">
            ~{formatReadingTime(totalWords)}
          </div>
          <div className="text-xs text-zinc-400 font-mono">
            {t('estimatedReadTime')}
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>{t('avgPerScene')}</span>
          <span className="text-zinc-200 font-semibold">
            {sceneCount > 0 ? Math.round(totalWords / sceneCount).toLocaleString() : 0} w
          </span>
        </div>
      </div>

      {/* 3. Status Distribution Card */}
      <div className="p-4 rounded-sm border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between space-y-3">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          {t('workflowStatus')}
        </span>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="flex items-center justify-between px-2 py-1 rounded-xs bg-zinc-950 border border-zinc-850">
            <span className="text-zinc-400">{t('statusInProgress')}:</span>
            <span className="text-blue-400 font-semibold">{statusCounts['In Progress']}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 rounded-xs bg-zinc-950 border border-zinc-850">
            <span className="text-zinc-400">{t('statusFirstDraft')}:</span>
            <span className="text-amber-400 font-semibold">{statusCounts['First Draft']}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 rounded-xs bg-zinc-950 border border-zinc-850">
            <span className="text-zinc-400">{t('statusRevised')}:</span>
            <span className="text-purple-400 font-semibold">{statusCounts['Revised']}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 rounded-xs bg-zinc-950 border border-zinc-850">
            <span className="text-zinc-400">{t('statusDone')}:</span>
            <span className="text-emerald-400 font-semibold">{statusCounts['Completed']}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>{t('totalItems')}</span>
          <span className="text-zinc-200 font-semibold">
            {sceneCount} {t('scenesCountLabel')}, {folderCount} {t('sectionsCountLabel')}
          </span>
        </div>
      </div>
    </div>
  );
}

export const ProjectStatsCardsExpanded = memo(ProjectStatsCardsExpandedComponent);
