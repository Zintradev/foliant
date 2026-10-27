import { memo } from 'react';
import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react';
import { TextNode, ChapterStatus } from '../../../../types/project';
import { TreeStatItem } from './types';
import { getProgressStatus, getStatusBadgeStyle, getStatusLabel, STATUS_OPTIONS } from './statUtils';
import { useTranslation } from '../../../../i18n/translations';

interface ProjectStatsTableRowProps {
  item: TreeStatItem;
  isExpanded: boolean;
  isActive: boolean;
  isCollapsed: boolean;
  onSelectChapter: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onUpdateChapter?: (id: string, updates: Partial<TextNode>) => void;
}

function ProjectStatsTableRowComponent({
  item,
  isExpanded,
  isActive,
  isCollapsed,
  onSelectChapter,
  onToggleFolder,
  onUpdateChapter,
}: ProjectStatsTableRowProps) {
  const { t } = useTranslation();
  const { node, depth, currentWords, targetWords } = item;
  const isFolder = node.type === 'folder';
  const status = getProgressStatus(currentWords, targetWords);
  const hasTarget = targetWords > 0;
  const nodeStatus: ChapterStatus = node.status || 'In Progress';


  return (
    <tr
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
                onToggleFolder(node.id);
              }}
              className="p-0.5 text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
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
              className={`truncate text-xs ${isExpanded ? 'font-medium' : ''} ${
                isActive
                  ? 'text-zinc-100'
                  : isFolder
                  ? 'text-zinc-200'
                  : 'text-zinc-300'
              }`}
            >
              {node.title || (isFolder ? t('untitledFolder') : t('untitledScene'))}
            </span>
            {isExpanded && node.synopsis && (
              <span className="text-[10px] text-zinc-500 truncate block font-normal">
                {node.synopsis}
              </span>
            )}
          </div>

          {isActive && (
            <span className="text-[8px] font-mono px-1 rounded-xs bg-zinc-800 text-zinc-200 border border-zinc-700 shrink-0">
              {t('active')}
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

      {isExpanded ? (
        <>
          <td className="py-2.5 px-3 text-right font-mono text-xs">
            <span className="font-bold text-zinc-100">
              {currentWords.toLocaleString()}
            </span>
            <span className="text-zinc-400 text-[11px] ml-1">
              / {hasTarget ? `${targetWords.toLocaleString()} w` : '—'}
            </span>
          </td>

          <td className="py-2.5 px-3 text-right">
            <div className="w-32 h-2 bg-zinc-850 rounded-full overflow-hidden ml-auto border border-zinc-800/80">
              <div
                className={`h-full rounded-full transition-all duration-300 ${status.barColor}`}
                style={{
                  width: `${
                    hasTarget ? Math.min(Math.max(status.percent, 2), 100) : 0
                  }%`,
                }}
              />
            </div>
          </td>

          <td className="py-2.5 px-3 text-right font-mono text-xs">
            <span className={`font-bold tracking-tight ${status.textColor}`}>
              {hasTarget ? `${status.percent.toFixed(1)}%` : '—'}
            </span>
          </td>

          <td className="py-2.5 px-3 text-center">
            <select
              value={nodeStatus}
              onChange={(e) => {
                e.stopPropagation();
                onUpdateChapter?.(node.id, {
                  status: e.target.value as ChapterStatus,
                });
              }}
              onClick={(e) => e.stopPropagation()}
              className={`min-w-[115px] px-2 py-0.5 text-[10px] font-mono rounded-xs border uppercase tracking-wider bg-zinc-950 focus:outline-none focus:border-zinc-500 cursor-pointer transition ${getStatusBadgeStyle(
                nodeStatus
              )}`}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-zinc-950 text-zinc-200">
                  {getStatusLabel(opt, t)}
                </option>
              ))}
            </select>
          </td>
        </>
      ) : (
        <>
          <td className="py-2 px-2 text-right font-mono text-zinc-200 text-xs">
            {currentWords.toLocaleString()}
          </td>

          <td className="py-2 px-2 text-right font-mono text-zinc-400 text-xs">
            {hasTarget ? targetWords.toLocaleString() : '—'}
          </td>

          <td className="py-2 px-2 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <div className="w-10 h-1.5 bg-zinc-800 rounded-full overflow-hidden shrink-0">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${status.barColor}`}
                  style={{
                    width: `${
                      hasTarget ? Math.min(Math.max(status.percent, 2), 100) : 0
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

          <td className="py-2 px-2 text-center">
            <select
              value={nodeStatus}
              onChange={(e) => {
                e.stopPropagation();
                onUpdateChapter?.(node.id, {
                  status: e.target.value as ChapterStatus,
                });
              }}
              onClick={(e) => e.stopPropagation()}
              className={`min-w-[110px] px-1.5 py-0.5 text-[9px] font-mono rounded-xs border uppercase tracking-wider bg-zinc-950 focus:outline-none focus:border-zinc-500 cursor-pointer transition ${getStatusBadgeStyle(
                nodeStatus
              )}`}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-zinc-950 text-zinc-200">
                  {getStatusLabel(opt, t)}
                </option>
              ))}
            </select>
          </td>
        </>
      )}
    </tr>
  );
}

export const ProjectStatsTableRow = memo(ProjectStatsTableRowComponent);
