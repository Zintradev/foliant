import { memo } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { TextNode } from '../../../types/project';
import { countWords } from '../../../utils/textMetrics';
import IndeterminateCheckbox from './IndeterminateCheckbox';
import { TreeItem } from './types';

interface ExportContentTreeItemProps {
  item: TreeItem;
  selectedIds: Set<string>;
  collapsedFolderIds: Set<string>;
  allDescendantMap: Map<string, string[]>;
  allChapters: TextNode[];
  isExporting: boolean;
  onToggleFolder: (folderId: string) => void;
  onToggleNodeSelection: (node: TextNode) => void;
}

function ExportContentTreeItem({
  item,
  selectedIds,
  collapsedFolderIds,
  allDescendantMap,
  allChapters,
  isExporting,
  onToggleFolder,
  onToggleNodeSelection,
}: ExportContentTreeItemProps) {
  const { node, children, depth } = item;
  const isFolder = node.type === 'folder';
  const isSelected = selectedIds.has(node.id);
  const isCollapsed = isFolder && collapsedFolderIds.has(node.id);

  // Compute indeterminate state for folders
  let isIndeterminate = false;
  if (isFolder) {
    const descendants = allDescendantMap.get(node.id) || [];
    const selectedDescendants = descendants.filter((id) => selectedIds.has(id));
    if (selectedDescendants.length > 0 && selectedDescendants.length < descendants.length) {
      isIndeterminate = true;
    } else if (selectedDescendants.length === 0 && isSelected) {
      isIndeterminate = true;
    }
  }

  const wordCount = !isFolder ? countWords(node.content) : 0;
  const childSceneCount = isFolder
    ? (allDescendantMap.get(node.id) || []).filter(
        (id) => allChapters.find((c) => c.id === id)?.type === 'scene'
      ).length
    : 0;

  return (
    <div className="w-full">
      <div
        className={`group flex items-center justify-between py-1.5 px-2 rounded-md text-xs transition select-none hover:bg-zinc-850/80 ${
          isSelected ? 'text-zinc-100' : 'text-zinc-500'
        }`}
        style={{ paddingLeft: `${Math.max(depth * 18 + 8, 8)}px` }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Expand / Collapse for folders */}
          {isFolder ? (
            <button
              type="button"
              onClick={() => onToggleFolder(node.id)}
              className="p-0.5 text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
              title={isCollapsed ? 'Expand folder' : 'Collapse folder'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}

          {/* Checkbox */}
          <IndeterminateCheckbox
            checked={isSelected}
            indeterminate={isIndeterminate}
            onChange={() => onToggleNodeSelection(node)}
            disabled={isExporting}
          />

          {/* Icon */}
          {isFolder ? (
            isCollapsed ? (
              <Folder className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
            ) : (
              <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )
          ) : (
            <FileText className="w-3.5 h-3.5 text-emerald-400/90 shrink-0" />
          )}

          {/* Node Title */}
          <span
            onClick={() => onToggleNodeSelection(node)}
            className={`truncate cursor-pointer ${
              isFolder ? 'font-semibold text-zinc-200' : 'font-normal'
            }`}
          >
            {node.title || (isFolder ? 'Untitled Folder' : 'Untitled Scene')}
          </span>
        </div>

        {/* Badges / Metrics */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isFolder ? (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-zinc-850 text-zinc-400 border border-zinc-750">
              {childSceneCount} scene{childSceneCount === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-zinc-400">
              {wordCount.toLocaleString()} w
            </span>
          )}
        </div>
      </div>

      {/* Nested Children */}
      {isFolder && !isCollapsed && children.length > 0 && (
        <div className="w-full">
          {children.map((child) => (
            <ExportContentTreeItem
              key={child.node.id}
              item={child}
              selectedIds={selectedIds}
              collapsedFolderIds={collapsedFolderIds}
              allDescendantMap={allDescendantMap}
              allChapters={allChapters}
              isExporting={isExporting}
              onToggleFolder={onToggleFolder}
              onToggleNodeSelection={onToggleNodeSelection}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(ExportContentTreeItem);
