import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  BookOpen,
  Users,
  Network,
  Layers,
  Clock,
  Sliders,
  Sparkles,
  Minimize2,
  Maximize2,
  ArrowRight,
} from 'lucide-react';
import { Language } from '../../types/settings';
import { MainViewId } from '../../types/navigation';
import { useTranslation } from '../../i18n/translations';
import KofiButton from './KofiButton';

export interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  activeMainView?: MainViewId;
  onSelectView?: (view: MainViewId) => void;
  onLoadDemoProject?: () => void;
  isSettingsOpen?: boolean;
  onHighlightViewChange?: (view: MainViewId | null) => void;
  chapters?: Array<{ id: string; title: string; type?: string; tags?: string[]; characterIds?: string[] }>;
  characters?: Array<{ id: string; name: string }>;
  storylines?: Array<{ id: string; title: string; linkedChapterIds?: string[]; linkedCharacterIds?: string[] }>;
}

export interface TourStep {
  id: string;
  targetView: MainViewId;
  targetSelector?: string;
  icon: React.ComponentType<{ className?: string }>;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  tipEs: string;
  tipEn: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'outline-create-scene',
    targetView: 'write',
    targetSelector: '[data-tour-id="outline-create-scene-btn"]',
    icon: BookOpen,
    titleEs: '01 • Esquema: Crear tu primera escena',
    titleEn: '01 • Outline: Create your first scene',
    descEs:
      'Empezamos con el editor vacío. Pulsa el botón iluminado de «Nueva Escena» en el panel Esquema para crear tu primer capítulo.',
    descEn:
      'We start with an empty editor. Click the illuminated «New Scene» button in the Outline panel to create your first chapter.',
    tipEs: 'Puedes crear carpetas y escenas para organizar la estructura de tu obra.',
    tipEn: 'You can create folders and scenes to organize your story structure.',
  },
  {
    id: 'cast-create-character',
    targetView: 'characters',
    targetSelector: '[data-tour-id="characters-add-btn"]',
    icon: Users,
    titleEs: '02 • Reparto: Da vida a tus personajes',
    titleEn: '02 • Cast: Bring your characters to life',
    descEs:
      'Dirígete a la pestaña Reparto en la barra lateral. Luego pulsa «Añadir Personaje» para incorporar a tu protagonista.',
    descEn:
      'Head to the Cast tab in the side bar. Then click «Add Character» to add your protagonist.',
    tipEs: 'Cada personaje puede tener un rol asignado, color distintivo y avatar visual.',
    tipEn: 'Each character can have an assigned role, accent color, and visual avatar.',
  },
  {
    id: 'graph-connect-nodes',
    targetView: 'relationships',
    icon: Network,
    titleEs: '03 • Grafo de Relaciones: Conecta el reparto',
    titleEn: '03 • Relationship Graph: Connect your cast',
    descEs:
      'Ve al Grafo en el menú lateral. Añade un personaje o nodo de unión y enlázalos. Los enlaces se pueden mover: arrastra físicamente la etiqueta del enlace para curvar la línea.',
    descEn:
      'Go to the Graph in the side menu. Add a character or union node and connect them. Link lines can be curved: physically drag the link label to shape the line.',
    tipEs: 'Mueve físicamente la etiqueta de un enlace en el lienzo para completar este paso.',
    tipEn: 'Physically drag a link label on the canvas to complete this step.',
  },
  {
    id: 'plots-tag-scene',
    targetView: 'storyline',
    icon: Layers,
    titleEs: '04 • Tramas: Asocia personajes o capítulos',
    titleEn: '04 • Plots: Link characters or chapters',
    descEs:
      'Accede a la pestaña de Tramas en la barra lateral. Asocia un personaje o un capítulo a una trama para seguir el curso de la historia.',
    descEn:
      'Access the Plots tab in the side bar. Associate a character or a chapter to a storyline to track your narrative threads.',
    tipEs: 'Asocia un personaje o una escena a una trama para desbloquear el siguiente paso.',
    tipEn: 'Associate a character or a scene to a plot to unlock the next step.',
  },
  {
    id: 'timeline-demo-choice',
    targetView: 'timeline',
    icon: Clock,
    titleEs: '05 • Cronología: Visualización espacial',
    titleEn: '05 • Timeline: Spatial overview',
    descEs:
      'La cronología muestra el mapa de metro y las calles de escenas. Esta sección se ve mejor con datos completos: elige si deseas cargar el proyecto de ejemplo para verlo en su esplendor o continuar.',
    descEn:
      'The timeline displays the subway map and scene lanes. This section looks best with comprehensive data: choose whether to load the demo project to see it in full splendor, or continue.',
    tipEs: 'Elige una de las dos opciones para continuar al último paso.',
    tipEn: 'Choose one of the two options to proceed to the final step.',
  },
  {
    id: 'settings-save-config',
    targetView: 'write',
    targetSelector: '[data-tour-id="activity-bar-settings-btn"]',
    icon: Sliders,
    titleEs: '06 • Ajustes: Configuración de Guardado',
    titleEn: '06 • Settings: Save Configuration',
    descEs:
      'Abre el menú de Ajustes para revisar la «Configuración de Guardado». Puedes elegir entre guardado automático silencioso o guardado manual con Ctrl+S según tu flujo de trabajo.',
    descEn:
      'Open Studio Settings to review your «Save Configuration». You can choose between background auto-save or manual saving with Ctrl+S according to your workflow.',
    tipEs: 'Revisa el intervalo de guardado y los modos de apariencia antes de comenzar a escribir.',
    tipEn: 'Review the save interval and appearance presets before starting your novel.',
  },
];

const getLocalizedViewName = (view: MainViewId, lang: Language): string => {
  const isSpanish = lang === 'es';
  switch (view) {
    case 'write':
      return isSpanish ? 'Escribir' : 'Write';
    case 'characters':
      return isSpanish ? 'Reparto' : 'Cast';
    case 'relationships':
      return isSpanish ? 'Grafo' : 'Graph';
    case 'storyline':
      return isSpanish ? 'Tramas' : 'Plots';
    case 'timeline':
      return isSpanish ? 'Cronología' : 'Timeline';
    default:
      return view;
  }
};

export const GuidedTour: React.FC<GuidedTourProps> = ({
  isOpen,
  onClose,
  language = 'en',
  activeMainView = 'write',
  onSelectView: _onSelectView,
  onLoadDemoProject,
  isSettingsOpen = false,
  onHighlightViewChange,
  chapters,
  characters,
  storylines,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [stepUnlocked, setStepUnlocked] = useState<Record<number, boolean>>({ 0: false });
  const [addBtnClicked, setAddBtnClicked] = useState(false);

  const { t } = useTranslation(language);
  const isEs = language === 'es';
  const totalSteps = TOUR_STEPS.length;
  const currentStep = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Determine if user is currently on the expected view for this step
  const isOnTargetView = activeMainView === currentStep.targetView;

  // Notify parent of view highlighting
  useEffect(() => {
    if (!isOpen || isMinimized) {
      onHighlightViewChange?.(null);
      return;
    }
    const target = currentStep.targetView;
    if (activeMainView !== target) {
      onHighlightViewChange?.(target);
    } else {
      onHighlightViewChange?.(null);
    }
    return () => {
      onHighlightViewChange?.(null);
    };
  }, [isOpen, isMinimized, currentStepIndex, activeMainView, currentStep, onHighlightViewChange]);

  // Mark step completed
  const markStepDone = useCallback((index: number) => {
    setStepUnlocked((prev) => ({ ...prev, [index]: true }));
  }, []);

  // Auto-detect step completion from live project props as a fallback
  useEffect(() => {
    if (!isOpen) return;
    if (currentStepIndex === 0 && chapters && chapters.some((c) => c.type === 'scene')) {
      markStepDone(0);
    }
    if (currentStepIndex === 1 && characters && characters.length > 0) {
      markStepDone(1);
    }
    if (
      currentStepIndex === 3 &&
      storylines &&
      storylines.some(
        (s) =>
          (s.linkedChapterIds && s.linkedChapterIds.length > 0) ||
          (s.linkedCharacterIds && s.linkedCharacterIds.length > 0)
      )
    ) {
      markStepDone(3);
    }
  }, [isOpen, currentStepIndex, chapters, characters, storylines, markStepDone]);

  // Listen to interactive tutorial events
  useEffect(() => {
    if (!isOpen) return;

    const handleSceneCreated = () => {
      if (currentStepIndex === 0) {
        markStepDone(0);
      }
    };

    const handleCharacterCreated = () => {
      if (currentStepIndex === 1) {
        markStepDone(1);
      }
    };

    const handleGraphPillMoved = () => {
      if (currentStepIndex === 2) {
        markStepDone(2);
      }
    };

    const handleTagAssigned = () => {
      if (currentStepIndex === 3) {
        markStepDone(3);
      }
    };

    window.addEventListener('foliant-tour-scene-created', handleSceneCreated);
    window.addEventListener('foliant-tour-character-created', handleCharacterCreated);
    window.addEventListener('foliant-tour-graph-pill-moved', handleGraphPillMoved);
    window.addEventListener('foliant-tour-tag-assigned', handleTagAssigned);

    return () => {
      window.removeEventListener('foliant-tour-scene-created', handleSceneCreated);
      window.removeEventListener('foliant-tour-character-created', handleCharacterCreated);
      window.removeEventListener('foliant-tour-graph-pill-moved', handleGraphPillMoved);
      window.removeEventListener('foliant-tour-tag-assigned', handleTagAssigned);
    };
  }, [isOpen, currentStepIndex, markStepDone]);

  // Settings step unlock when settings is opened
  useEffect(() => {
    if (currentStepIndex === 5 && isSettingsOpen) {
      markStepDone(5);
    }
  }, [currentStepIndex, isSettingsOpen, markStepDone]);

  // Target button highlighting logic
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    // Reset clicked state on step change
    setAddBtnClicked(false);

    // Apply pulse ring to target elements
    let highlightedElements: HTMLElement[] = [];

    const applyHighlight = () => {
      if (currentStepIndex === 0) {
        const btn1 = document.querySelector('[data-tour-id="outline-create-scene-btn"]') as HTMLElement;
        const btn2 = document.querySelector('[data-tour-id="outline-create-scene-btn-footer"]') as HTMLElement;
        [btn1, btn2].forEach((el) => {
          if (el) {
            el.classList.add('ring-2', 'ring-emerald-400', 'ring-offset-1', 'ring-offset-zinc-950', 'animate-pulse');
            highlightedElements.push(el);
          }
        });
      } else if (currentStepIndex === 1 && !addBtnClicked) {
        const charBtn = document.querySelector('[data-tour-id="characters-add-btn"]') as HTMLElement;
        if (charBtn) {
          charBtn.classList.add('ring-2', 'ring-emerald-400', 'ring-offset-1', 'ring-offset-zinc-950', 'animate-pulse');
          highlightedElements.push(charBtn);

          const handleClick = () => {
            setAddBtnClicked(true);
            charBtn.classList.remove('ring-2', 'ring-emerald-400', 'ring-offset-1', 'ring-offset-zinc-950', 'animate-pulse');
          };
          charBtn.addEventListener('click', handleClick, { once: true });
        }
      } else if (currentStepIndex === 5 && !isSettingsOpen) {
        const settingsBtn = document.querySelector('[data-tour-id="activity-bar-settings-btn"]') as HTMLElement;
        const fileMenuBtn = document.querySelector('[data-tour-id="activity-bar-file-menu"]') as HTMLElement;
        [settingsBtn, fileMenuBtn].forEach((el) => {
          if (el) {
            el.classList.add('ring-2', 'ring-emerald-400', 'ring-offset-1', 'ring-offset-zinc-950', 'animate-pulse');
            highlightedElements.push(el);
          }
        });
      }
    };

    applyHighlight();
    const timer = setTimeout(applyHighlight, 250);

    return () => {
      clearTimeout(timer);
      highlightedElements.forEach((el) => {
        el.classList.remove('ring-2', 'ring-emerald-400', 'ring-offset-1', 'ring-offset-zinc-950', 'animate-pulse');
      });
    };
  }, [isOpen, isMinimized, currentStepIndex, addBtnClicked, isSettingsOpen, activeMainView]);

  const handleNext = useCallback(() => {
    // STRICT BLOCKING: Cannot advance unless current step is unlocked
    if (!stepUnlocked[currentStepIndex] && currentStepIndex !== totalSteps - 1) {
      return;
    }
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  }, [currentStepIndex, totalSteps, onClose, stepUnlocked]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'ArrowRight' && currentStepIndex !== 4 && stepUnlocked[currentStepIndex]) {
        // Can advance via ArrowRight unless blocked on step 5 choice
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, handleSkip, currentStepIndex]);

  if (!isOpen) return null;

  const StepIcon = currentStep.icon;

  return (
    <aside
      aria-label="Interactive Guided Tour"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none"
    >
      {/* Minimized Pill */}
      {isMinimized ? (
        <div className="pointer-events-auto fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in-95 duration-150">
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-zinc-950/95 border border-emerald-500/80 text-zinc-100 shadow-2xl hover:border-emerald-400 hover:bg-zinc-900 transition cursor-pointer text-xs font-medium backdrop-blur-md"
            title="Expandir Guía"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>
              {isEs ? 'Guía Interactiva:' : 'Interactive Tour:'}{' '}
              <strong className="text-emerald-400 font-mono">
                {currentStepIndex + 1}/{totalSteps}
              </strong>
            </span>
            <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      ) : (
        /* Floating Tour Card */
        <div
          role="region"
          aria-label="Interactive Guided Tour"
          className="pointer-events-auto fixed bottom-6 right-6 z-50 w-[440px] max-w-[calc(100vw-2.5rem)] bg-zinc-950/95 border border-zinc-700/80 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 text-zinc-200 backdrop-blur-md"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-emerald-950 border border-emerald-800/80 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-mono tracking-wider text-emerald-400 uppercase font-semibold">
                {t('interactiveTourTitle', 'Tour Interactivo')}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400 font-mono">
                {isEs
                  ? `Paso ${currentStepIndex + 1} de ${totalSteps}`
                  : `Step ${currentStepIndex + 1} of ${totalSteps}`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                title={isEs ? 'Minimizar guía' : 'Minimize tour'}
                aria-label="Minimize tour"
                className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSkip}
                title={t('tourSkip', 'Cerrar tour')}
                aria-label="Close tour"
                className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 flex flex-col gap-3">
            {/* View navigation alert when not on target tab */}
            {!isOnTargetView && (
              <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-emerald-400 animate-bounce-x" />
                  <span>
                    {isEs
                      ? `Pulsa en la pestaña iluminada en el lateral para ir a «${getLocalizedViewName(currentStep.targetView, language)}»`
                      : `Click the highlighted tab on the side bar to visit «${getLocalizedViewName(currentStep.targetView, language)}»`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 shrink-0 mt-0.5">
                <StepIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-zinc-100 mb-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-100">{isEs ? currentStep.titleEs : currentStep.titleEn}</span>
                    {stepUnlocked[currentStepIndex] ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[10px] text-emerald-300 font-medium shrink-0 animate-in fade-in duration-150">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>{isEs ? 'Paso completado' : 'Step completed'}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-600/40 text-[10px] text-amber-300 font-medium shrink-0">
                        <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                        <span>{isEs ? 'Acción pendiente' : 'Action required'}</span>
                      </span>
                    )}
                  </div>
                </h3>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {isEs ? currentStep.descEs : currentStep.descEn}
                </p>
              </div>
            </div>

            {/* Step 5: Timeline explicit choice buttons */}
            {currentStepIndex === 4 && (
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg flex flex-col sm:flex-row gap-2 mt-1">
                {onLoadDemoProject && (
                  <button
                    type="button"
                    onClick={() => {
                      onLoadDemoProject();
                      markStepDone(4);
                      setCurrentStepIndex(5);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-sm cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{t('loadDemoProject', 'Cargar proyecto de ejemplo')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    markStepDone(4);
                    setCurrentStepIndex(5);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs transition cursor-pointer"
                >
                  <span>{isEs ? 'Continuar' : 'Continue'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Tip Advice */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-2.5 flex items-start gap-2">
              <span className="text-amber-400 text-xs shrink-0 mt-0.5">💡</span>
              <p className="text-[11px] text-zinc-300 leading-snug">
                {isEs ? currentStep.tipEs : currentStep.tipEn}
              </p>
            </div>

            {/* Ko-fi Button: Solely at the final step */}
            {isLastStep && (
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                <span className="text-[11px] text-zinc-400">
                  {isEs
                    ? '¿Te resulta útil Foliant para escribir?'
                    : 'Does Foliant empower your writing?'}
                </span>
                <KofiButton label={t('supportKofi', 'Apoyar en Ko-fi')} />
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-800 bg-zinc-900/50 shrink-0">
            {/* Step Dots */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-[150px] py-1" aria-label="Tour step indicators">
              {TOUR_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => {
                  if (idx <= currentStepIndex || stepUnlocked[idx - 1]) {
                    setCurrentStepIndex(idx);
                  }
                }}
                  aria-label={`Go to step ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                    idx === currentStepIndex
                      ? 'w-4 bg-emerald-500'
                      : idx < currentStepIndex
                      ? 'w-1.5 bg-emerald-800 hover:bg-emerald-700'
                      : 'w-1.5 bg-zinc-700 hover:bg-zinc-600'
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSkip}
                className="px-2 py-1 rounded text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition cursor-pointer"
              >
                {t('tourSkip', 'Saltar')}
              </button>

              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-0.5 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs transition cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>{t('tourPrev', 'Anterior')}</span>
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={currentStepIndex === 4 || (!stepUnlocked[currentStepIndex] && currentStepIndex !== totalSteps - 1)}
                className={`flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white font-medium text-xs shadow transition cursor-pointer ${
                  stepUnlocked[currentStepIndex] && !isLastStep
                    ? 'ring-2 ring-emerald-400/80 ring-offset-1 ring-offset-zinc-950 animate-pulse'
                    : ''
                }`}
              >
                <span>{isLastStep ? t('tourFinish', 'Finalizar') : t('tourNext', 'Siguiente')}</span>
                {isLastStep ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default GuidedTour;
