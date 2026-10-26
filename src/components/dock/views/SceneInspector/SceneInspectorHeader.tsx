import React, { memo } from 'react';
import { FileText, Folder } from 'lucide-react';
import { ChapterStatus } from '../../../../types/project';
import { STATUS_OPTIONS, getStatusBadgeStyle } from '../ProjectStatsView';
import { useTranslation } from '../../../../i18n/translations';

interface SceneInspectorHeaderProps {
  isFolder: boolean;
  title: string;
  status?: ChapterStatus;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (status: ChapterStatus) => void;
}

function SceneInspectorHeader({
  isFolder,
  title,
  status,
  onTitleChange,
  onStatusChange,
}: SceneInspectorHeaderProps) {
  const { t } = useTranslation();

  const getStatusLabel = (s: ChapterStatus): string => {
    switch (s) {
      case 'Not Started':
        return t('statusNotStarted');
      case 'In Progress':
        return t('statusInProgress');
      case 'First Draft':
        return t('statusFirstDraft');
      case 'Revised':
        return t('statusRevised');
      case 'Completed':
        return t('statusDone');
      default:
        return s;
    }
  };

  const currentStatus = status || 'In Progress';

  return (
    <div className="p-3 bg-zinc-900/60 flex flex-col gap-2 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-5 h-5 rounded-sm flex items-center justify-center shrink-0 ${
              isFolder
                ? 'bg-amber-950/60 border border-amber-800/60 text-amber-400'
                : 'bg-blue-950/60 border border-blue-800/60 text-blue-400'
            }`}
          >
            {isFolder ? <Folder className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
          </div>
          <span className="text-[11px] font-semibold text-zinc-200 uppercase tracking-wider font-mono truncate">
            {isFolder ? t('folderSection') : t('sceneInspector')}
          </span>
        </div>

        <select
          value={currentStatus}
          onChange={(e) => onStatusChange(e.target.value as ChapterStatus)}
          className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-xs border focus:outline-none focus:ring-1 focus:ring-zinc-600 bg-zinc-900 cursor-pointer ${getStatusBadgeStyle(
            currentStatus
          )}`}
        >
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st} className="bg-zinc-900 text-zinc-200 font-sans">
              {getStatusLabel(st)}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        value={title}
        onChange={onTitleChange}
        placeholder={t('untitledScene')}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition font-medium"
      />
    </div>
  );
}

export default memo(SceneInspectorHeader);
