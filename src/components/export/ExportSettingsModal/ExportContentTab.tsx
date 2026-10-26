import React, { memo } from 'react';
import { Layers, HelpCircle } from 'lucide-react';
import { ChapterFormatting } from '../../../utils/exportEpub';
import { TreeItem } from './types';

interface ExportContentTabProps {
  chapterFormatting: ChapterFormatting;
  onChapterFormattingChange: (val: ChapterFormatting) => void;
  isExporting: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleExpandAll: () => void;
  collapsedFolderIds: Set<string>;
  tree: TreeItem[];
  renderTreeItem: (item: TreeItem) => React.ReactNode;
}

function ExportContentTab({
  chapterFormatting,
  onChapterFormattingChange,
  isExporting,
  onSelectAll,
  onDeselectAll,
  onToggleExpandAll,
  collapsedFolderIds,
  tree,
  renderTreeItem,
}: ExportContentTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-100">
      {/* 1. Chapter Formatting Selector */}
      <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Chapter Formatting
          </label>
          <span className="text-[11px] text-zinc-500">Structural Nesting</span>
        </div>

        <select
          value={chapterFormatting}
          onChange={(e) => onChapterFormattingChange(e.target.value as ChapterFormatting)}
          disabled={isExporting}
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-750 rounded-lg text-xs font-medium text-zinc-100 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
        >
          <option value="top-folders">
            Treat top Folders as Chapters (Ignore subfolders, bundle scenes)
          </option>
          <option value="sub-folders">
            Treat sub-folders as Chapters (Root folders act as Parts, subfolders as Chapters)
          </option>
          <option value="flatten">
            Flatten all (Sequential scenes separated by asterisks, no folder index)
          </option>
        </select>

        <p className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-950/60 p-2.5 rounded-md border border-zinc-850 flex items-start gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            {chapterFormatting === 'top-folders' &&
              'Each top-level folder becomes an individual book chapter with its own page-break and TOC entry. Subfolders are transparently bundled together with scene dividers.'}
            {chapterFormatting === 'sub-folders' &&
              'Root folders generate major book Part/Act dividers. Child subfolders generate individual Chapters with nested table of contents entries on e-readers.'}
            {chapterFormatting === 'flatten' &&
              'Exports only the selected scenes in chronological order into a unified narrative flow, separated by asterisks ( * * * ). Folder TOC entries are omitted.'}
          </span>
        </p>
      </div>

      {/* 2. Project Tree View Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Project Content Tree
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectAll}
              disabled={isExporting}
              className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
            >
              Select All
            </button>
            <span className="text-zinc-600">•</span>
            <button
              type="button"
              onClick={onDeselectAll}
              disabled={isExporting}
              className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
            >
              Deselect All
            </button>
            <span className="text-zinc-600">•</span>
            <button
              type="button"
              onClick={onToggleExpandAll}
              disabled={isExporting}
              className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
            >
              {collapsedFolderIds.size > 0 ? 'Expand All' : 'Collapse All'}
            </button>
          </div>
        </div>

        {/* Tree Container */}
        <div className="border border-zinc-800 rounded-lg p-2 bg-zinc-900/40 max-h-[280px] overflow-y-auto space-y-0.5">
          {tree.length > 0 ? (
            tree.map((item) => renderTreeItem(item))
          ) : (
            <p className="text-xs text-zinc-500 text-center py-6">
              No chapters or scenes found in this project.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ExportContentTab);
