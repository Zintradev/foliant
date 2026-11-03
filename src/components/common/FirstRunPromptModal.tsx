import React from 'react';
import { Sparkles, BookOpen, Feather } from 'lucide-react';
import { useTranslation } from '../../i18n/translations';

interface FirstRunPromptModalProps {
  isOpen: boolean;
  onLoadDemo: () => void;
  onStartEmpty: () => void;
}

export const FirstRunPromptModal: React.FC<FirstRunPromptModalProps> = ({
  isOpen,
  onLoadDemo,
  onStartEmpty,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Foliant"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none"
    >
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg p-6 shadow-2xl flex flex-col items-center text-center text-zinc-200 animate-in zoom-in-95 duration-150">
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
      </div>
    </div>
  );
};

export default FirstRunPromptModal;

