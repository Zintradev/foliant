import { useState, useMemo } from 'react';
import {
  BarChart3,
  Folder,
  FolderOpen,
  Clock,
  Target,
  Search,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  FileText,
  ChevronsUpDown,
  Layers,
} from 'lucide-react';
import { TextNode, ChapterStatus } from '../../../types/project';
import { StorylineItem } from '../../../types/dock';

export const STATUS_OPTIONS: ChapterStatus[] = [
  'Not Started',
  'In Progress',
  'First Draft',
  'Revised',
  'Completed',
];

interface ManuscriptStatsViewProps {
  chapters: TextNode[];
  storylines?: StorylineItem[];
  activeChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onUpdateChapter?: (id: string, updates: Partial<TextNode>) => void;
  targetWordCount?: number;
  isExpanded?: boolean;
}

interface TreeStatItem {
  node: TextNode;
  children: TreeStatItem[];
  depth: number;
  currentWords: number;
  targetWords: number;
  completionPercent: number;
}

function countWords(content: string): number {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

function formatReadingTime(words: number): string {
  const minutes = Math.ceil(words / 225);
  if (minutes < 60) {
    return `${Math.max(1, minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

interface ProgressStatus {
  percent: number;
  barColor: string;
  textColor: string;
  badgeText: string;
  badgeClass: string;
}

/**
 * Returns dynamic color tokens based on completion percentage:
 * - < 70%: Sober blue (in progress)
 * - 70% - 100%: Optimal emerald green (on target)
 * - > 100%: Warning rose/red (exceeded limit)
 */
function getProgressStatus(current: number, target: number): ProgressStatus {
  if (!target || target <= 0) {
    return {
      percent: 0,
      barColor: 'bg-zinc-700',
      textColor: 'text-zinc-500',
      badgeText: 'No target',
      badgeClass: 'text-zinc-500 border-zinc-800 bg-zinc-900',
    };
  }

  const percent = (current / target) * 100;

  if (percent > 100) {
    return {
      percent,
      barColor: 'bg-rose-500',
      textColor: 'text-rose-400',
      badgeText: 'Exceeded',
      badgeClass: 'text-rose-400 border-rose-800/60 bg-rose-950/40',
    };
  }

  if (percent >= 70) {
    return {
      percent,
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      badgeText: 'Optimal',
      badgeClass: 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40',
    };
  }

  return {
    percent,
    barColor: 'bg-blue-500/85',
    textColor: 'text-blue-400',
    badgeText: 'In Progress',
    badgeClass: 'text-blue-400 border-blue-800/60 bg-blue-950/40',
  };
}

export function getStatusBadgeStyle(status: ChapterStatus): string {
  switch (status) {
    case 'Completed':
      return 'border-emerald-800/60 bg-emerald-950/40 text-emerald-400';
    case 'Revised':
      return 'border-purple-800/60 bg-purple-950/40 text-purple-400';
    case 'First Draft':
      return 'border-amber-800/60 bg-amber-950/40 text-amber-400';
    case 'In Progress':
      return 'border-blue-800/60 bg-blue-950/40 text-blue-400';
    case 'Not Started':
    default:
      return 'border-zinc-800 bg-zinc-900 text-zinc-400';
  }
}

export default function ManuscriptStatsView({
  chapters,
  storylines: _storylines = [],
  activeChapterId,
  onSelectChapter,
  onUpdateChapter,
  targetWordCount: initialTarget = 80000,
  isExpanded = false,
}: ManuscriptStatsViewProps) {
  const [targetWordCount, setTargetWordCount] = useState<number>(initialTarget);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState(String(initialTarget));
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());

  // ---------------------------------------------------------------------------
  // Build Hierarchical Stats Tree
  // ---------------------------------------------------------------------------
  const { roots, totalWords, sceneCount, folderCount, statusCounts } = useMemo(() => {
    const nodeMap = new Map<string, TreeStatItem>();
    const rootItems: TreeStatItem[] = [];
    const counts: Record<ChapterStatus, number> = {
      'Not Started': 0,
      'In Progress': 0,
      'First Draft': 0,
      'Revised': 0,
      'Completed': 0,
    };

    // Initialize items
    chapters.forEach((node) => {
      nodeMap.set(node.id, {
        node,
        children: [],
        depth: 0,
        currentWords: node.type === 'scene' ? countWords(node.content) : 0,
        targetWords: node.targetWords || 0,
        completionPercent: 0,
      });

      const st = node.status || 'In Progress';
      counts[st] = (counts[st] || 0) + 1;
    });

    // Link parents & children
    chapters.forEach((node) => {
      const item = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(item);
      } else {
        rootItems.push(item);
      }
    });

    let totalProjectWords = 0;
    let sCount = 0;
    let fCount = 0;

    // Recursive calculation of depths, words, and targets
    const processStats = (item: TreeStatItem, depth: number): { words: number; target: number } => {
      item.depth = depth;

      if (item.node.type === 'scene') {
        sCount++;
        const words = countWords(item.node.content);
        item.currentWords = words;
        totalProjectWords += words;
        const target = item.node.targetWords || 0;
        item.targetWords = target;
        item.completionPercent = target > 0 ? (words / target) * 100 : 0;
        return { words, target };
      }

      // Folder: sum children
      fCount++;
      let sumWords = 0;
      let sumChildTargets = 0;

      for (const child of item.children) {
        const res = processStats(child, depth + 1);
        sumWords += res.words;
        sumChildTargets += res.target;
      }

      item.currentWords = sumWords;
      const effectiveTarget =
        item.node.targetWords && item.node.targetWords > 0
          ? item.node.targetWords
          : sumChildTargets;

      item.targetWords = effectiveTarget;
      item.completionPercent =
        effectiveTarget > 0 ? (sumWords / effectiveTarget) * 100 : 0;

      return { words: sumWords, target: effectiveTarget };
    };

    rootItems.forEach((root) => processStats(root, 0));

    return {
      roots: rootItems,
      totalWords: totalProjectWords,
      sceneCount: sCount,
      folderCount: fCount,
      statusCounts: counts,
    };
  }, [chapters]);

  // Overall Project Progress
  const globalStatus = getProgressStatus(totalWords, targetWordCount);
  const remainingWords = Math.max(0, targetWordCount - totalWords);

  // Flatten visible items based on collapsed state and filter
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
    }
    setIsEditingTarget(false);
  };

  return (
    <div
      className={`flex flex-col h-full select-none bg-zinc-950 overflow-hidden font-sans ${
        isExpanded ? 'p-3' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-1.5 min-w-0">
          <BarChart3 className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono truncate">
            {isExpanded ? 'Project Analytics & Target Tracking' : 'Project Analytics'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-500 font-mono px-1.5 py-0.5 rounded-sm bg-zinc-950 border border-zinc-850"
            title="Estimated reading time at ~225 words per minute"
          >
            <Clock className="w-2.5 h-2.5 text-zinc-500" />
            <span>~{formatReadingTime(totalWords)}</span>
          </span>

          <button
            onClick={() => {
              setCustomTargetInput(String(targetWordCount));
              setIsEditingTarget(!isEditingTarget);
            }}
            title="Configure Target Word Count"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition border border-zinc-800"
          >
            <Target className="w-2.5 h-2.5" />
            <span>{targetWordCount.toLocaleString()}w</span>
          </button>
        </div>
      </div>

      {/* Target Word Count Quick Editor Modal/Bar */}
      {isEditingTarget && (
        <div className="p-2 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between gap-2 text-xs">
          <span className="text-zinc-400 font-mono text-[11px]">Project Target:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={customTargetInput}
              onChange={(e) => setCustomTargetInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTarget()}
              className="w-24 bg-zinc-950 border border-zinc-700 rounded-xs px-2 py-0.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500"
              placeholder="e.g. 80000"
              autoFocus
            />
            <button
              onClick={handleSaveTarget}
              className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xs text-[10px] font-mono transition"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditingTarget(false)}
              className="px-1.5 py-0.5 text-zinc-500 hover:text-zinc-300 text-[10px] transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* ----------------------------------------------------------------- */}
        {/* TOP CARDS: EXPANDED vs COMPACT                                     */}
        {/* ----------------------------------------------------------------- */}
        {isExpanded ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Target Tracking Card */}
            <div className="p-4 rounded-sm border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                  Target Tracking
                </span>
                <span
                  className={`px-2 py-0.5 rounded-xs border text-[10px] font-mono uppercase tracking-wider ${globalStatus.badgeClass}`}
                >
                  {globalStatus.badgeText}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-2xl lg:text-3xl font-bold text-zinc-100">
                    {totalWords.toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-400">
                    / {targetWordCount.toLocaleString()} w
                  </span>
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
                  {globalStatus.percent.toFixed(1)}% Completed
                </span>
                <span>
                  {remainingWords > 0
                    ? `${remainingWords.toLocaleString()} w remaining`
                    : 'Goal reached'}
                </span>
              </div>
            </div>

            {/* 2. Pacing & Time Card */}
            <div className="p-4 rounded-sm border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between space-y-3">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Reading & Pacing
              </span>

              <div className="space-y-1">
                <div className="text-2xl lg:text-3xl font-bold font-mono text-zinc-100">
                  ~{formatReadingTime(totalWords)}
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  Estimated read time (~225 wpm)
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>Avg/Scene:</span>
                <span className="text-zinc-200 font-semibold">
                  {sceneCount > 0 ? Math.round(totalWords / sceneCount).toLocaleString() : 0} w
                </span>
              </div>
            </div>

            {/* 3. Status Distribution Card */}
            <div className="p-4 rounded-sm border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between space-y-3">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                Workflow Status
              </span>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="flex items-center justify-between px-2 py-1 rounded-xs bg-zinc-950 border border-zinc-850">
                  <span className="text-zinc-400">In Progress:</span>
                  <span className="text-blue-400 font-semibold">{statusCounts['In Progress']}</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded-xs bg-zinc-950 border border-zinc-850">
                  <span className="text-zinc-400">First Draft:</span>
                  <span className="text-amber-400 font-semibold">{statusCounts['First Draft']}</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded-xs bg-zinc-950 border border-zinc-850">
                  <span className="text-zinc-400">Revised:</span>
                  <span className="text-purple-400 font-semibold">{statusCounts['Revised']}</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded-xs bg-zinc-950 border border-zinc-850">
                  <span className="text-zinc-400">Completed:</span>
                  <span className="text-emerald-400 font-semibold">{statusCounts['Completed']}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>Total Items:</span>
                <span className="text-zinc-200 font-semibold">
                  {sceneCount} scenes, {folderCount} sections
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* COMPACT SIDEBAR PROGRESS CARD */
          <div className="p-2.5 rounded-sm border border-zinc-800 bg-zinc-900/40 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider font-mono">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5 text-zinc-400" />
                Progress
              </span>
              <span className={`font-semibold ${globalStatus.textColor}`}>
                {globalStatus.percent.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-baseline justify-between font-mono">
              <span className="text-base font-bold text-zinc-100">
                {totalWords.toLocaleString()}
              </span>
              <span className="text-[10px] text-zinc-400">
                / {targetWordCount.toLocaleString()} w
              </span>
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
                  ? `${remainingWords.toLocaleString()} w left`
                  : 'Goal reached!'}
              </span>
              <span>
                {sceneCount} scenes
              </span>
            </div>
          </div>
        )}

        {/* Toolbar: Search & Hierarchy Collapse Toggle */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search outline elements..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-sm pl-7 pr-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-sans"
            />
          </div>

          {folderCount > 0 && (
            <button
              onClick={handleToggleExpandAll}
              title={collapsedFolderIds.size > 0 ? 'Expand all folders' : 'Collapse all folders'}
              className="flex items-center gap-1 px-2 py-1 rounded-sm border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-[10px] font-mono transition shrink-0"
            >
              <ChevronsUpDown className="w-3 h-3" />
              <span>{collapsedFolderIds.size > 0 ? 'Expand' : 'Collapse'}</span>
            </button>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* HIERARCHICAL TREE TABLE                                           */}
        {/* ----------------------------------------------------------------- */}
        <div className="border border-zinc-800 rounded-sm overflow-hidden bg-zinc-900/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  <th className={`font-medium ${isExpanded ? 'py-2.5 px-3' : 'py-2 px-2'}`}>
                    Outline Structure
                  </th>
                  <th className={`font-medium text-center ${isExpanded ? 'w-20' : 'w-14'}`}>
                    Type
                  </th>
                  {isExpanded ? (
                    <>
                      <th className="py-2.5 px-3 font-medium text-right w-40">
                        Words / Target
                      </th>
                      <th className="py-2.5 px-3 font-medium text-right w-36">
                        Progress Bar
                      </th>
                      <th className="py-2.5 px-3 font-medium text-right w-20">
                        Percent
                      </th>
                      <th className="py-2.5 px-3 font-medium text-center w-36">
                        Status
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 px-2 font-medium text-right w-16">
                        Words
                      </th>
                      <th className="py-2 px-2 font-medium text-right w-16">
                        Target
                      </th>
                      <th className="py-2 px-2 font-medium text-right w-20">
                        Progress
                      </th>
                      <th className="py-2 px-2 font-medium text-center w-32">
                        Status
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/80 font-sans">
                {visibleTreeItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isExpanded ? 6 : 6}
                      className="py-8 text-center text-zinc-500 text-xs"
                    >
                      {searchQuery ? 'No elements match your search' : 'No chapters available'}
                    </td>
                  </tr>
                ) : (
                  visibleTreeItems.map(({ node, depth, currentWords, targetWords }) => {
                    const isFolder = node.type === 'folder';
                    const isActive = !isFolder && node.id === activeChapterId;
                    const isCollapsed = isFolder && collapsedFolderIds.has(node.id);
                    const status = getProgressStatus(currentWords, targetWords);
                    const hasTarget = targetWords > 0;
                    const nodeStatus: ChapterStatus = node.status || 'In Progress';

                    return (
                      <tr
                        key={node.id}
                        onClick={() => {
                          if (node.type === 'scene') {
                            onSelectChapter(node.id);
                          }
                        }}
                        className={`transition group ${
                          isActive
                            ? 'bg-zinc-850/90 text-zinc-100 font-medium'
                            : isFolder
                            ? 'bg-zinc-900/40 hover:bg-zinc-900/80 text-zinc-200'
                            : 'hover:bg-zinc-900/50 text-zinc-300 cursor-pointer'
                        }`}
                      >
                        {/* 1. Structure Title with indentation */}
                        <td className={isExpanded ? 'py-2 px-3' : 'py-1.5 px-2'}>
                          <div
                            className="flex items-center gap-1.5"
                            style={{ paddingLeft: `${depth * 14}px` }}
                          >
                            {isFolder ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFolder(node.id);
                                }}
                                className="p-0.5 text-zinc-500 hover:text-zinc-200 transition"
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            ) : (
                              <span className="w-4 shrink-0" />
                            )}

                            {isFolder ? (
                              isCollapsed ? (
                                <Folder className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                              ) : (
                                <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )
                            ) : (
                              <FileText
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isActive ? 'text-zinc-100' : 'text-zinc-500'
                                }`}
                              />
                            )}

                            <div className="truncate max-w-[220px]">
                              <span
                                className={`truncate text-xs ${
                                  isExpanded ? 'font-medium' : ''
                                } ${
                                  isActive
                                    ? 'text-zinc-100'
                                    : isFolder
                                    ? 'text-zinc-200'
                                    : 'text-zinc-300'
                                }`}
                              >
                                {node.title ||
                                  (isFolder ? 'Untitled Folder' : 'Untitled Scene')}
                              </span>
                              {isExpanded && node.synopsis && (
                                <span className="text-[10px] text-zinc-500 truncate block font-normal">
                                  {node.synopsis}
                                </span>
                              )}
                            </div>

                            {isActive && (
                              <span className="text-[8px] font-mono px-1 rounded-xs bg-zinc-800 text-zinc-200 border border-zinc-700 shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Type Badge */}
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded-xs border uppercase tracking-wider ${
                              isFolder
                                ? 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                            }`}
                          >
                            {node.type}
                          </span>
                        </td>

                        {/* --------------------------------------------------- */}
                        {/* EXPANDED VIEW COLUMNS                               */}
                        {/* --------------------------------------------------- */}
                        {isExpanded ? (
                          <>
                            {/* Words / Target */}
                            <td className="py-2.5 px-3 text-right font-mono text-xs">
                              <span className="font-bold text-zinc-100">
                                {currentWords.toLocaleString()}
                              </span>
                              <span className="text-zinc-400 text-[11px] ml-1">
                                / {hasTarget ? `${targetWords.toLocaleString()} w` : '—'}
                              </span>
                            </td>

                            {/* Progress Bar */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="w-32 h-2 bg-zinc-850 rounded-full overflow-hidden ml-auto border border-zinc-800/80">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${status.barColor}`}
                                  style={{
                                    width: `${
                                      hasTarget
                                        ? Math.min(Math.max(status.percent, 2), 100)
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                            </td>

                            {/* Percentage */}
                            <td className="py-2.5 px-3 text-right font-mono text-xs">
                              <span
                                className={`font-bold tracking-tight ${status.textColor}`}
                              >
                                {hasTarget ? `${status.percent.toFixed(1)}%` : '—'}
                              </span>
                            </td>

                            {/* Editable Status Dropdown */}
                            <td className="py-2.5 px-3 text-center">
                              <select
                                value={nodeStatus}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (onUpdateChapter) {
                                    onUpdateChapter(node.id, {
                                      status: e.target.value as ChapterStatus,
                                    });
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className={`min-w-[115px] px-2 py-0.5 text-[10px] font-mono rounded-xs border uppercase tracking-wider bg-zinc-950 focus:outline-none focus:border-zinc-500 cursor-pointer transition ${getStatusBadgeStyle(
                                  nodeStatus
                                )}`}
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option
                                    key={opt}
                                    value={opt}
                                    className="bg-zinc-950 text-zinc-200"
                                  >
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </>
                        ) : (
                          /* --------------------------------------------------- */
                          /* COMPACT SIDEBAR COLUMNS                             */
                          /* --------------------------------------------------- */
                          <>
                            {/* Current Words */}
                            <td className="py-2 px-2 text-right font-mono text-zinc-200 text-xs">
                              {currentWords.toLocaleString()}
                            </td>

                            {/* Target Words */}
                            <td className="py-2 px-2 text-right font-mono text-zinc-400 text-xs">
                              {hasTarget ? targetWords.toLocaleString() : '—'}
                            </td>

                            {/* Mini Progress Bar + % */}
                            <td className="py-2 px-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <div className="w-10 h-1.5 bg-zinc-800 rounded-full overflow-hidden shrink-0">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${status.barColor}`}
                                    style={{
                                      width: `${
                                        hasTarget
                                          ? Math.min(Math.max(status.percent, 2), 100)
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                                <span
                                  className={`text-[9px] font-mono ${
                                    hasTarget ? status.textColor : 'text-zinc-600'
                                  }`}
                                >
                                  {hasTarget ? `${Math.round(status.percent)}%` : '—'}
                                </span>
                              </div>
                            </td>

                            {/* Editable Status Dropdown */}
                            <td className="py-2 px-2 text-center">
                              <select
                                value={nodeStatus}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (onUpdateChapter) {
                                    onUpdateChapter(node.id, {
                                      status: e.target.value as ChapterStatus,
                                    });
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className={`min-w-[110px] px-1.5 py-0.5 text-[9px] font-mono rounded-xs border uppercase tracking-wider bg-zinc-950 focus:outline-none focus:border-zinc-500 cursor-pointer transition ${getStatusBadgeStyle(
                                  nodeStatus
                                )}`}
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option
                                    key={opt}
                                    value={opt}
                                    className="bg-zinc-950 text-zinc-200"
                                  >
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
