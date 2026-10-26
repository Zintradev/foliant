import { useState, useMemo, useEffect, memo } from 'react';
import { BarChart3, Clock, Target, TrendingUp, Search, ChevronsUpDown } from 'lucide-react';
import { ProjectStatsViewProps, TreeStatItem, ProgressStatus } from './types';
import { getProgressStatus, formatReadingTime } from './statUtils';
import { useProjectStatsTree } from './useProjectStatsTree';
import { ProjectStatsCardsExpanded } from './ProjectStatsCardsExpanded';
import { ProjectStatsTable } from './ProjectStatsTable';
import { useTranslation } from '../../../../i18n/translations';

// ---------------------------------------------------------------------------
// Cohesive Inlined Presentational Subcomponents
// ---------------------------------------------------------------------------

interface ProjectStatsHeaderProps {
  isExpanded: boolean;
  totalWords: number;
  targetWordCount: number;
  isEditingTarget: boolean;
  customTargetInput: string;
  sumSceneTargets: number;
  onToggleEditingTarget: () => void;
  onCustomTargetInputChange: (val: string) => void;
  onSaveTarget: () => void;
  onCancelEditingTarget: () => void;
  onSyncWithSceneTargets: () => void;
}

const ProjectStatsHeader = memo(function ProjectStatsHeader({
  isExpanded,
  totalWords,
  targetWordCount,
  isEditingTarget,
  customTargetInput,
  sumSceneTargets,
  onToggleEditingTarget,
  onCustomTargetInputChange,
  onSaveTarget,
  onCancelEditingTarget,
  onSyncWithSceneTargets,
}: ProjectStatsHeaderProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-1.5 min-w-0">
          <BarChart3 className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono truncate">
            {isExpanded ? t('projectAnalyticsTracking') : t('projectAnalytics')}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-500 font-mono px-1.5 py-0.5 rounded-sm bg-zinc-950 border border-zinc-850"
            title={t('estReadingTimeTooltip')}
          >
            <Clock className="w-2.5 h-2.5 text-zinc-500" />
            <span>~{formatReadingTime(totalWords)}</span>
          </span>

          <button
            type="button"
            onClick={onToggleEditingTarget}
            title={t('configureTargetWordCount')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-855 transition border border-zinc-800 cursor-pointer"
          >
            <Target className="w-2.5 h-2.5" />
            <span>{targetWordCount.toLocaleString()}w</span>
          </button>
        </div>
      </div>

      {isEditingTarget && (
        <div className="p-2 border-b border-zinc-800 bg-zinc-900/90 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-mono text-[11px]">{t('projectTarget')}</span>
            <input
              type="text"
              value={customTargetInput}
              onChange={(e) => onCustomTargetInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSaveTarget()}
              className="w-24 bg-zinc-950 border border-zinc-700 rounded-xs px-2 py-0.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500"
              placeholder="e.g. 80000"
              autoFocus
            />
            <button
              type="button"
              onClick={onSaveTarget}
              className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xs text-[10px] font-mono transition cursor-pointer"
            >
              {t('save')}
            </button>
            <button
              type="button"
              onClick={onCancelEditingTarget}
              className="px-1.5 py-0.5 text-zinc-500 hover:text-zinc-300 text-[10px] transition cursor-pointer"
            >
              {t('cancel')}
            </button>
          </div>

          {sumSceneTargets > 0 && (
            <button
              type="button"
              onClick={onSyncWithSceneTargets}
              title="Set project goal equal to sum of individual scene goals"
              className="text-[10px] font-mono text-blue-400 hover:text-blue-300 bg-blue-950/40 border border-blue-800/60 px-2 py-0.5 rounded-xs transition cursor-pointer"
            >
              {t('syncToScenes')} ({sumSceneTargets.toLocaleString()}w)
            </button>
          )}
        </div>
      )}
    </>
  );
});

interface ProjectStatsCardCompactProps {
  totalWords: number;
  targetWordCount: number;
  globalStatus: ProgressStatus;
  remainingWords: number;
  sceneCount: number;
  onTargetWordCountChange: (next: number) => void;
}

const ProjectStatsCardCompact = memo(function ProjectStatsCardCompact({
  totalWords,
  targetWordCount,
  globalStatus,
  remainingWords,
  sceneCount,
  onTargetWordCountChange,
}: ProjectStatsCardCompactProps) {
  const { t } = useTranslation();

  return (
    <div className="p-2.5 rounded-sm border border-zinc-800 bg-zinc-900/40 space-y-1.5">
      <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider font-mono">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-2.5 h-2.5 text-zinc-400" />
          {t('targetProgressLabel')}
        </span>
        <span className={`font-semibold ${globalStatus.textColor}`}>
          {globalStatus.percent.toFixed(1)}%
        </span>
      </div>

      <div className="flex items-baseline justify-between font-mono">
        <span className="text-base font-bold text-zinc-100">
          {totalWords.toLocaleString()}
        </span>
        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
          <span>/</span>
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
            title="Click to edit project target words"
            className="w-16 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-500 rounded-xs px-1 py-0.2 text-[10px] font-mono font-bold text-zinc-200 focus:outline-none"
          />
          <span>w</span>
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${globalStatus.barColor}`}
          style={{ width: `${Math.min(globalStatus.percent, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono pt-0.5">
        <span>
          {remainingWords > 0
            ? `${remainingWords.toLocaleString()} ${t('wordsLeft')}`
            : t('goalReached')}
        </span>
        <span>
          {sceneCount} {t('scenesCountLabel')}
        </span>
      </div>
    </div>
  );
});

interface ProjectStatsToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  folderCount: number;
  hasCollapsedFolders: boolean;
  onToggleExpandAll: () => void;
}

const ProjectStatsToolbar = memo(function ProjectStatsToolbar({
  searchQuery,
  onSearchChange,
  folderCount,
  hasCollapsedFolders,
  onToggleExpandAll,
}: ProjectStatsToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <div className="relative flex-1">
        <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('searchOutlineElements')}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-sm pl-7 pr-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-sans"
        />
      </div>

      {folderCount > 0 && (
        <button
          type="button"
          onClick={onToggleExpandAll}
          title={hasCollapsedFolders ? t('expandAllFolders') : t('collapseAllFolders')}
          className="flex items-center gap-1 px-2 py-1 rounded-sm border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-[10px] font-mono transition shrink-0 cursor-pointer"
        >
          <ChevronsUpDown className="w-3 h-3" />
          <span>{hasCollapsedFolders ? t('expand') : t('collapse')}</span>
        </button>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main Orchestrator
// ---------------------------------------------------------------------------

export function ProjectStatsViewComponent({
  chapters,
  storylines: _storylines = [],
  activeChapterId,
  onSelectChapter,
  onUpdateChapter,
  targetWordCount: initialTarget = 80000,
  onUpdateTargetWordCount,
  isExpanded = false,
}: ProjectStatsViewProps) {
  const [targetWordCount, setTargetWordCount] = useState<number>(initialTarget);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState(String(initialTarget));
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialTarget !== undefined) {
      setTargetWordCount(initialTarget);
      setCustomTargetInput(String(initialTarget));
    }
  }, [initialTarget]);

  const {
    roots,
    totalWords,
    sceneCount,
    folderCount,
    statusCounts,
    sumSceneTargets,
  } = useProjectStatsTree(chapters);

  const globalStatus = getProgressStatus(totalWords, targetWordCount);
  const remainingWords = Math.max(0, targetWordCount - totalWords);

  const visibleTreeItems = useMemo(() => {
    const list: TreeStatItem[] = [];

    const traverse = (items: TreeStatItem[]) => {
      for (const item of items) {
        const matchesSearch =
          !searchQuery.trim() ||
          item.node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.node.synopsis &&
            item.node.synopsis.toLowerCase().includes(searchQuery.toLowerCase()));

        if (matchesSearch) {
          list.push(item);
        }

        if (item.node.type === 'folder' && !collapsedFolderIds.has(item.node.id)) {
          traverse(item.children);
        }
      }
    };

    traverse(roots);
    return list;
  }, [roots, collapsedFolderIds, searchQuery]);

  const handleToggleFolder = (folderId: string) => {
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleToggleExpandAll = () => {
    if (collapsedFolderIds.size > 0) {
      setCollapsedFolderIds(new Set());
    } else {
      const allFolderIds = chapters.filter((c) => c.type === 'folder').map((c) => c.id);
      setCollapsedFolderIds(new Set(allFolderIds));
    }
  };

  const handleSaveTarget = () => {
    const val = parseInt(customTargetInput.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      setTargetWordCount(val);
      onUpdateTargetWordCount?.(val);
    }
    setIsEditingTarget(false);
  };

  const handleSyncWithSceneTargets = () => {
    if (sumSceneTargets > 0) {
      setTargetWordCount(sumSceneTargets);
      setCustomTargetInput(String(sumSceneTargets));
      onUpdateTargetWordCount?.(sumSceneTargets);
      setIsEditingTarget(false);
    }
  };

  const handleTargetChange = (next: number) => {
    setTargetWordCount(next);
    setCustomTargetInput(String(next));
    onUpdateTargetWordCount?.(next);
  };

  return (
    <div
      className={`flex flex-col h-full select-none bg-zinc-950 overflow-hidden font-sans ${
        isExpanded ? 'p-3' : ''
      }`}
    >
      <ProjectStatsHeader
        isExpanded={isExpanded}
        totalWords={totalWords}
        targetWordCount={targetWordCount}
        isEditingTarget={isEditingTarget}
        customTargetInput={customTargetInput}
        sumSceneTargets={sumSceneTargets}
        onToggleEditingTarget={() => {
          setCustomTargetInput(String(targetWordCount));
          setIsEditingTarget(!isEditingTarget);
        }}
        onCustomTargetInputChange={setCustomTargetInput}
        onSaveTarget={handleSaveTarget}
        onCancelEditingTarget={() => setIsEditingTarget(false)}
        onSyncWithSceneTargets={handleSyncWithSceneTargets}
      />

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {isExpanded ? (
          <ProjectStatsCardsExpanded
            totalWords={totalWords}
            targetWordCount={targetWordCount}
            globalStatus={globalStatus}
            remainingWords={remainingWords}
            sceneCount={sceneCount}
            folderCount={folderCount}
            statusCounts={statusCounts}
            onTargetWordCountChange={handleTargetChange}
          />
        ) : (
          <ProjectStatsCardCompact
            totalWords={totalWords}
            targetWordCount={targetWordCount}
            globalStatus={globalStatus}
            remainingWords={remainingWords}
            sceneCount={sceneCount}
            onTargetWordCountChange={handleTargetChange}
          />
        )}

        <ProjectStatsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          folderCount={folderCount}
          hasCollapsedFolders={collapsedFolderIds.size > 0}
          onToggleExpandAll={handleToggleExpandAll}
        />

        <ProjectStatsTable
          visibleTreeItems={visibleTreeItems}
          isExpanded={isExpanded}
          activeChapterId={activeChapterId}
          collapsedFolderIds={collapsedFolderIds}
          searchQuery={searchQuery}
          onSelectChapter={onSelectChapter}
          onToggleFolder={handleToggleFolder}
          onUpdateChapter={onUpdateChapter}
        />
      </div>
    </div>
  );
}

export default memo(ProjectStatsViewComponent);
