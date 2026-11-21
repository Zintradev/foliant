import React, { useState, useEffect } from 'react';
import { Compass, X, Sparkles } from 'lucide-react';
import { useTranslation } from '../../i18n/translations';

interface FirstRunTourToastProps {
  onStartTour: () => void;
}

export const FirstRunTourToast: React.FC<FirstRunTourToastProps> = ({ onStartTour }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    try {
      const dismissedForever =
        localStorage.getItem('foliant_tour_prompt_seen') === 'true' ||
        localStorage.getItem('foliant_tour_prompt_never') === 'true';
      const dismissedSession =
        typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('foliant_tour_prompt_session_dismissed') === 'true';

      if (!dismissedForever && !dismissedSession) {
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage read error
    }
  }, []);

  const handleDismissSession = () => {
    setIsVisible(false);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('foliant_tour_prompt_session_dismissed', 'true');
      }
    } catch {
      // Ignore sessionStorage write error
    }
  };

  const handleNeverShowAgain = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('foliant_tour_prompt_seen', 'true');
      localStorage.setItem('foliant_tour_prompt_never', 'true');
    } catch {
      // Ignore localStorage write error
    }
  };

  const handleStart = () => {
    handleNeverShowAgain();
    onStartTour();
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Interactive tutorial prompt"
      role="region"
      className="fixed bottom-6 right-6 z-50 max-w-[460px] sm:max-w-lg w-auto bg-zinc-900/95 border border-zinc-750 rounded-lg p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3 select-none"
    >
      <div className="p-2 rounded-md bg-emerald-950/60 border border-emerald-800/70 text-emerald-400 shrink-0 mt-0.5">
        <Compass className="w-4 h-4 animate-spin-slow" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
            <span>{t('tourToastTitle', '¿Primeros pasos en Foliant?')}</span>
          </h4>
          <button
            type="button"
            onClick={handleDismissSession}
            aria-label="Cerrar notificación"
            className="p-0.5 text-zinc-400 hover:text-zinc-200 rounded transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-zinc-300 leading-relaxed mb-2.5">
          {t('tourToastDesc', 'Realiza un breve tutorial interactivo para conocer las herramientas.')}
        </p>

        <div className="flex items-center gap-2 flex-nowrap pt-0.5">
          <button
            type="button"
            onClick={handleStart}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <Sparkles className="w-3 h-3" />
            <span>{t('tourToastStart', 'Iniciar tutorial')}</span>
          </button>
          <button
            type="button"
            onClick={handleDismissSession}
            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            {t('tourToastDismiss', 'Más tarde')}
          </button>
          <button
            type="button"
            onClick={handleNeverShowAgain}
            className="px-2 py-1 text-xs text-zinc-500 hover:text-rose-400 transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            {t('tourToastNever', 'No volver a mostrar')}
          </button>
        </div>
      </div>
    </aside>
  );
};
