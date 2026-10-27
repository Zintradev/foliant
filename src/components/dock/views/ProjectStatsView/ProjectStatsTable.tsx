import { memo } from 'react';
import { TextNode } from '../../../../types/project';
import { TreeStatItem } from './types';
import { ProjectStatsTableRow } from './ProjectStatsTableRow';
import { useTranslation } from '../../../../i18n/translations';

interface ProjectStatsTableProps {
  visibleTreeItems: TreeStatItem[];
  isExpanded: boolean;
  activeChapterId: string;
  collapsedFolderIds: Set<string>;
  searchQuery: string;
  onSelectChapter: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onUpdateChapter?: (id: string, updates: Partial<TextNode>) => void;
}

function ProjectStatsTableComponent({
  visibleTreeItems,
  isExpanded,
  activeChapterId,
  collapsedFolderIds,
  searchQuery,
  onSelectChapter,
  onToggleFolder,
  onUpdateChapter,
}: ProjectStatsTableProps) {
  const { t } = useTranslation();

  return (
    <div className="border border-zinc-800 rounded-sm overflow-hidden bg-zinc-900/30">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              <th className={`font-medium ${isExpanded ? 'py-2.5 px-3' : 'py-2 px-2'}`}>
                {t('outlineStructure')}
              </th>
              <th className={`font-medium text-center ${isExpanded ? 'w-20' : 'w-14'}`}>
                {t('columnType')}
              </th>
              {isExpanded ? (
                <>
                  <th className="py-2.5 px-3 font-medium text-right w-40">
                    {t('wordsTarget')}
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right w-36">
                    {t('progressBar')}
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right w-20">
                    {t('percent')}
                  </th>
                  <th className="py-2.5 px-3 font-medium text-center w-36">
                    {t('status')}
                  </th>
                </>
              ) : (
                <>
                  <th className="py-2 px-2 font-medium text-right w-16">
                    {t('words')}
                  </th>
                  <th className="py-2 px-2 font-medium text-right w-16">
                    {t('target')}
                  </th>
                  <th className="py-2 px-2 font-medium text-right w-20">
                    {t('targetProgressLabel')}
                  </th>
                  <th className="py-2 px-2 font-medium text-center w-32">
                    {t('status')}
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850/80 font-sans">
            {visibleTreeItems.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-zinc-500 text-xs"
                >
                  {searchQuery ? t('noElementsMatch') : t('noChaptersAvailable')}
                </td>
              </tr>
            ) : (
              visibleTreeItems.map((item) => (
                <ProjectStatsTableRow
                  key={item.node.id}
                  item={item}
                  isExpanded={isExpanded}
                  isActive={item.node.type !== 'folder' && item.node.id === activeChapterId}
                  isCollapsed={item.node.type === 'folder' && collapsedFolderIds.has(item.node.id)}
                  onSelectChapter={onSelectChapter}
                  onToggleFolder={onToggleFolder}
                  onUpdateChapter={onUpdateChapter}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const ProjectStatsTable = memo(ProjectStatsTableComponent);
