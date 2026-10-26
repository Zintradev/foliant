import { memo } from 'react';
import { BookOpen, X } from 'lucide-react';
import { useTranslation } from '../../../i18n/translations';

interface ExportModalHeaderProps {
  onClose: () => void;
  isExporting: boolean;
}

function ExportModalHeader({ onClose, isExporting }: ExportModalHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
            Export to EPUB
          </h2>
          <p className="text-xs text-zinc-400">
            Configure book metadata, selective contents, and chapter nesting
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        disabled={isExporting}
        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
        title={t('close') || 'Close'}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default memo(ExportModalHeader);
