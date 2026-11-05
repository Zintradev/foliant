import React, { useEffect } from 'react';
import { Sparkles, BookOpen, Feather, FolderOpen, FolderDown, X } from 'lucide-react';
import { useTranslation } from '../../i18n/translations';

interface FirstRunPromptModalProps {
  isOpen: boolean;
  onLoadDemo: () => void;
  onStartEmpty: () => void;
  onOpenExisting?: () => void;
  onImportManuskript?: () => void;
  onClose?: () => void;
}

export const FirstRunPromptModal: React.FC<FirstRunPromptModalProps> = ({
  isOpen,
  onLoadDemo,
  onStartEmpty,
  onOpenExisting,
  onImportManuskript,
  onClose,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Foliant"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg p-6 shadow-2xl flex flex-col items-center text-center text-zinc-200 animate-in zoom-in-95 duration-150">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close', 'Close')}
            className="absolute top-4 right-4 p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
          <Sparkles className="w-6 h-6" />
        </div>

        <h2 className="text-base font-bold text-zinc-100 tracking-tight">
          {t('firstRunPromptTitle', 'Welcome to Foliant')}
        </h2>
        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed max-w-sm">
          {t(
            'firstRunPromptDesc',
            'How would you like to start your novel project? You can explore a demo project with preconfigured storylines and characters, or start on a blank canvas.'
          )}
        </p>

        <div className="w-full space-y-2.5 mt-6">
          <button
            type="button"
            onClick={onLoadDemo}
            className="w-full flex items-center gap-3 p-3 rounded-md bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-750 hover:border-emerald-500/60 transition group text-left cursor-pointer"
          >
            <div className="p-2 rounded-sm bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-300 transition-colors">
                {t('loadDemoProject', 'Load Demo Project')}
              </div>
              <div className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                {t(
                  'loadDemoProjectDesc',
                  'Explore preloaded scenes, cast, timeline, and relationships.'
                )}
              </div>
            </div>
          </button>

          {onOpenExisting && (
            <button
              type="button"
              onClick={onOpenExisting}
              className="w-full flex items-center gap-3 p-3 rounded-md bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-750 hover:border-blue-500/60 transition group text-left cursor-pointer"
            >
              <div className="p-2 rounded-sm bg-blue-950/40 border border-blue-800/40 text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-blue-300 transition-colors">
                  {t('openExistingProject', 'Open Existing Project...')}
                </div>
                <div className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                  {t(
                    'openExistingProjectDesc',
                    'Select an existing .foliant file from your computer.'
                  )}
                </div>
              </div>
            </button>
          )}

          {onImportManuskript && (
            <button
              type="button"
              onClick={onImportManuskript}
              className="w-full flex items-center gap-3 p-3 rounded-md bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-750 hover:border-amber-500/60 transition group text-left cursor-pointer"
            >
              <div className="p-2 rounded-sm bg-amber-950/40 border border-amber-800/40 text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                <FolderDown className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300 transition-colors">
                  {t('importManuskript', 'Import Manuskript Project...')}
                </div>
                <div className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                  {t(
                    'importManuskriptDesc',
                    'Import an existing novel project from a Manuskript folder.'
                  )}
                </div>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={onStartEmpty}
            className="w-full flex items-center gap-3 p-3 rounded-md bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-750 hover:border-zinc-600 transition group text-left cursor-pointer"
          >
            <div className="p-2 rounded-sm bg-zinc-800 border border-zinc-700 text-zinc-300 group-hover:scale-105 transition-transform shrink-0">
              <Feather className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-zinc-200 group-hover:text-zinc-100 transition-colors">
                {t('startEmptyProject', 'Start with Blank Project')}
              </div>
              <div className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                {t(
                  'startEmptyProjectDesc',
                  'Blank canvas to write your own story from scratch.'
                )}
              </div>
            </div>
          </button>
        </div>

        <div className="w-full mt-6 pt-3.5 border-t border-zinc-800/80 text-[11px] text-zinc-500 leading-relaxed text-center">
          <p>
            {t(
              'firstRunManuskriptCredit',
              'Con agradecimiento a la aplicación de código abierto '
            )}
            <a
              href="https://www.theologeek.ch/manuskript/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-emerald-400 underline decoration-zinc-750 transition"
            >
              Manuskript
            </a>
            {t(
              'firstRunManuskriptCreditSuffix',
              ' por haber sido la inspiración original para la arquitectura narrativa de Foliant.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirstRunPromptModal;

