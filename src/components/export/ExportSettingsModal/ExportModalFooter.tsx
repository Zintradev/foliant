import { memo } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../i18n/translations';

interface ExportModalFooterProps {
  onClose: () => void;
  isExporting: boolean;
  selectedScenesCount: number;
  totalScenesCount: number;
  selectedWords: number;
}

function ExportModalFooter({
  onClose,
  isExporting,
  selectedScenesCount,
  totalScenesCount,
  selectedWords,
}: ExportModalFooterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/60 shrink-0">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
        <span>
          <strong>{selectedScenesCount}</strong> of{' '}
          <strong>{totalScenesCount}</strong> scenes selected (
          {selectedWords.toLocaleString()} words)
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isExporting}
          className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg transition cursor-pointer disabled:opacity-50"
        >
          {t('cancel') || 'Cancel'}
        </button>

        <button
          type="submit"
          disabled={isExporting || selectedScenesCount === 0}
          className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            selectedScenesCount === 0
              ? 'Please select at least one scene to export'
              : undefined
          }
        >
          {isExporting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Exporting EPUB...</span>
            </>
          ) : (
            <>
              <BookOpen className="w-3.5 h-3.5" />
              <span>Export EPUB</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default memo(ExportModalFooter);
