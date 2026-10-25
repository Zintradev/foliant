import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../i18n/translations';

export type ImportModalData =
  | { type: 'success'; title: string; sceneCount: number; charCount: number; worldCount: number }
  | { type: 'error'; message: string }
  | null;

export interface ImportResultModalProps {
  data: ImportModalData;
  onClose: () => void;
}

/**
 * ImportResultModal:
 * Displays the result statistics or error diagnostics following a Manuskript project import.
 */
export default function ImportResultModal({
  data,
  onClose,
}: ImportResultModalProps) {
  const { t } = useTranslation();

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-750 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 font-sans animate-in fade-in zoom-in-95 duration-150">
        {data.type === 'success' ? (
          <>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-zinc-100">
                  {t('importSuccessTitle')}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {t('importSuccessDesc')}
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-300">
                    {data.sceneCount} {t('scenesCountLabel')}
                  </span>
                  <span className="px-2 py-0.5 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-300">
                    {data.charCount} {t('charactersCountLabel')}
                  </span>
                  <span className="px-2 py-0.5 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-300">
                    {data.worldCount} {t('dockWorldShort')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-sm text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
              >
                {t('accept')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-950/60 border border-rose-800/80 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Import Error
                </h3>
                <p className="text-xs text-rose-300 leading-relaxed whitespace-pre-wrap">
                  {data.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-sm text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
              >
                {t('close')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
