import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  FolderOpen,
  PenLine,
  Layout,
  Network,
  Sliders,
  Sparkles,
  Minimize2,
  Maximize2,
  BookOpen,
  Clock,
  Users,
  Layers,
  BarChart3,
  Globe,
  Palette,
} from 'lucide-react';
import { Language } from '../../types/settings';
import { MainViewId } from '../../types/navigation';
import { useTranslation } from '../../i18n/translations';
import KofiButton from './KofiButton';

export interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  onSelectView?: (view: MainViewId) => void;
}

interface TourStep {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  view?: MainViewId;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  tipEs: string;
  tipEn: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'editor-canvas',
    icon: PenLine,
    view: 'write',
    titleEs: '01 • Editor de Escritura Inmersivo',
    titleEn: '01 • Immersive Writing Canvas',
    descEs:
      'Lienzo de redacción sin distracciones con formato enriquecido (negrita, cursiva, subrayado), resaltados cromáticos, notas al margen y cálculo de palabras en tiempo real por escena frente a tu objetivo.',
    descEn:
      'Distraction-free central writing canvas with rich formatting (bold, italic, underline), color highlights, margin notes, and live word tracking against your novel target.',
    tipEs: 'La guía recorrerá pestaña por pestaña todo el estudio para mostrarte sus herramientas principales.',
    tipEn: 'The tour will guide you tab by tab across the studio to showcase its core tools.',
  },
  {
    id: 'file-menu',
    icon: FolderOpen,
    view: 'write',
    titleEs: '02 • Menú de Proyecto & Transferencia',
    titleEn: '02 • Project & File Menu',
    descEs:
      'Gestiona tus proyectos con almacenamiento directo y privado en tu disco. Puedes guardar con Ctrl+S, importar historias desde Manuskript y exportar tu libro a EPUB estándar listo para publicación.',
    descEn:
      'Manage local projects directly and privately on disk. Save with Ctrl+S, import novels from Manuskript, and export completed books to standard EPUB format.',
    tipEs: 'Usa Ctrl+S para guardar cambios manualmente en cualquier momento si usas guardado manual.',
    tipEn: 'Press Ctrl+S to save manually at any time if using manual save mode.',
  },
  {
    id: 'docks-layout',
    icon: Layout,
    view: 'write',
    titleEs: '03 • Paneles Acoplables & Espacio de Trabajo',
    titleEn: '03 • Dock Panels & Workspace',
    descEs:
      'Organiza tu entorno: panel izquierdo para el árbol de capítulos y escenas; panel derecho para notas de contexto y personajes; y panel inferior para la cronología o notas.',
    descEn:
      'Structure your environment: left dock for chapters and scenes; right dock for context notes and characters; and bottom dock for timeline tracking.',
    tipEs: 'Si quieres trabajar con texto y herramientas en grande a la vez, colapsa un lado y agranda el otro a la mitad.',
    tipEn: 'If you want to work with text and tools enlarged at once, collapse one side and expand the other to half screen.',
  },
  {
    id: 'outline',
    icon: BookOpen,
    view: 'outline',
    titleEs: '04 • Estructura & Esquema del Manuscrito',
    titleEn: '04 • Manuscript Outline',
    descEs:
      'Organización jerárquica de la novela en Actos, Capítulos y Escenas. Permite reordenar secuencias fácilmente, controlar el estado de redacción y añadir notas de síntesis narrativa.',
    descEn:
      'Hierarchical novel structure in Acts, Chapters, and Scenes. Reorder sequences fluidly, track completion states, and keep narrative synopses.',
    tipEs: 'Haz doble clic sobre cualquier capítulo o escena para renombrarla al instante.',
    tipEn: 'Double-click any chapter or scene to rename it instantly.',
  },
  {
    id: 'timeline',
    icon: Clock,
    view: 'timeline',
    titleEs: '05 • Cronología Multivía de Escenas',
    titleEn: '05 • Multi-Track Scene Timeline',
    descEs:
      'Control temporal con dos modos: Mapa de metro para visualizar subtramas paralelas, y Carriles por capítulo para comprobar el ritmo y orden cronológico de cada escena.',
    descEn:
      'Temporal tracking in two layouts: Subway Map to visualize parallel storylines, and Chapter Lanes to review pacing and scene order.',
    tipEs: 'Filtra por personajes o tramas para aislar hilos argumentales específicos.',
    tipEn: 'Filter by character or storyline to isolate specific plot threads.',
  },
  {
    id: 'relationships',
    icon: Network,
    view: 'relationships',
    titleEs: '06 • Grafo de Personajes & Flechas Curvables',
    titleEn: '06 • Character Graph & Curving Arrows',
    descEs:
      'Mapa visual de conexiones entre personajes. Con clic izquierdo doblas y mueves la flecha, y con clic derecho mantenido sobre la etiqueta la desplazas a lo largo del enlace. Doble clic para resetearla, clic derecho en el lienzo para crear nodos y Ctrl+Z para deshacer.',
    descEn:
      'Visual map of character links. Left-click & drag label to bend the link, hold right-click to slide it along the link, double-click to reset, right-click canvas to spawn nodes, and press Ctrl+Z to undo.',
    tipEs: 'Usa la rueda del ratón para hacer zoom y arrastra el fondo para desplazarte libremente.',
    tipEn: 'Scroll mouse wheel to zoom and drag background to pan freely.',
  },
  {
    id: 'characters',
    icon: Users,
    view: 'characters',
    titleEs: '07 • Reparto & Fichas de Personajes',
    titleEn: '07 • Cast & Character Dossiers',
    descEs:
      'Directorio integral de personajes. Documenta roles (Protagonista, Antagonista...), trasfondo psicológico, apariencia, objetivos narrativos y asigna avatares o retratos visuales.',
    descEn:
      'Comprehensive character directory. Document roles (Protagonist, Antagonist...), psychological depth, appearance, motives, and assign avatar portraits.',
    tipEs: 'Haz clic en cualquier avatar para abrirlo en el visor de imagen en grande.',
    tipEn: 'Click on any avatar thumbnail to view it in full size.',
  },
  {
    id: 'storylines',
    icon: Layers,
    view: 'storyline',
    titleEs: '08 • Tramas & Arcos Argumentales',
    titleEn: '08 • Storylines & Narrative Arcs',
    descEs:
      'Supervisa los hilos conductores de tu historia. Asigna colores personalizados a cada subtrama para distinguir los arcos principales de las tramas secundarias en todo el estudio.',
    descEn:
      'Track your narrative threads. Assign distinct color codes to each plotline to separate main arcs from subplots across the studio.',
    tipEs: 'Puedes crear tantas líneas argumentales como necesite tu obra desde Ajustes.',
    tipEn: 'You can create as many storylines as your project needs in Studio Settings.',
  },
  {
    id: 'stats',
    icon: BarChart3,
    view: 'stats',
    titleEs: '09 • Métricas & Estadísticas de Progreso',
    titleEn: '09 • Analytics & Word Targets',
    descEs:
      'Panel analítico para seguir tu ritmo de escritura: conteo total de palabras frente a la meta final de la novela, desglose por capítulos y velocidad diaria de producción literaria.',
    descEn:
      'Analytics dashboard tracking writing pace: total word count against manuscript target, chapter breakdowns, and daily progress velocity.',
    tipEs: 'Define tu objetivo de palabras global para visualizar la barra de avance del libro.',
    tipEn: 'Set your global target word count to monitor overall completion progress.',
  },
  {
    id: 'worldbuilding',
    icon: Globe,
    view: 'worldbuilding',
    titleEs: '10 • Enciclopedia del Mundo & Lore',
    titleEn: '10 • Lore & Worldbuilding',
    descEs:
      'Enciclopedia para estructurar el universo de tu novela: reinos, ciudades, facciones políticas, reliquias mágicas y reglas del mundo con categorías cromáticas a medida.',
    descEn:
      'Encyclopedia to structure your world lore: kingdoms, cities, political factions, magical relics, and world rules with custom color taxonomy.',
    tipEs: 'Asocia elementos de lore a tus escenas para tener las referencias a mano mientras escribes.',
    tipEn: 'Reference lore entries in scene context notes while drafting.',
  },
  {
    id: 'moodboard',
    icon: Palette,
    view: 'moodboard',
    titleEs: '11 • Tablón Visual & Inspiración',
    titleEn: '11 • Visual Moodboard',
    descEs:
      'Espacio de inspiración estética para recopilar imágenes, mapas, paletas de ambiente y referencias visuales de localizaciones o personajes.',
    descEn:
      'Visual board to collect mood imagery, maps, ambiance palettes, and aesthetic references for locations and characters.',
    tipEs: 'Puedes arrastrar y organizar libremente las imágenes en la galería.',
    tipEn: 'You can freely organize and view referenced gallery images.',
  },
  {
    id: 'settings-and-finish',
    icon: Sliders,
    view: 'write',
    titleEs: '12 • Ajustes del Estudio & Finalización',
    titleEn: '12 • Studio Settings & Completion',
    descEs:
      'Personaliza fuentes de lectura (Lora, Merriweather, Cinzel, Inter), sangría de primera línea, modo de autoguardado y paletas de color en Ajustes. ¡Todo listo para dar vida a tus historias!',
    descEn:
      'Configure reading fonts (Lora, Merriweather, Cinzel, Inter), first-line indentation, save mode, and color tags in Settings. You are ready to craft your story!',
    tipEs: 'Pulsa F1 en cualquier momento para consultar controles y documentación.',
    tipEn: 'Press F1 at any time to open documentation and keyboard shortcuts.',
  },
];

export const GuidedTour: React.FC<GuidedTourProps> = ({
  isOpen,
  onClose,
  language = 'en',
  onSelectView,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const { t } = useTranslation(language);
  const isEs = language === 'es';

  // Reset to first step whenever reopened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setIsMinimized(false);
    }
  }, [isOpen]);

  const totalSteps = TOUR_STEPS.length;
  const currentStep = TOUR_STEPS[currentStepIndex];

  // Navigate to the step's recommended view
  useEffect(() => {
    if (isOpen && currentStep && currentStep.view && onSelectView) {
      onSelectView(currentStep.view);
    }
  }, [isOpen, currentStepIndex, currentStep, onSelectView]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      if (onSelectView) onSelectView('write');
      onClose();
    }
  }, [currentStepIndex, totalSteps, onClose, onSelectView]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const handleSkip = useCallback(() => {
    if (onSelectView) onSelectView('write');
    onClose();
  }, [onClose, onSelectView]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable ||
          activeEl.classList.contains('tiptap') ||
          activeEl.closest('.ProseMirror'))
      ) {
        if (e.key === 'Escape') {
          handleSkip();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, handleSkip]);

  if (!isOpen) return null;

  const StepIcon = currentStep.icon;
  const isLastStep = currentStepIndex === totalSteps - 1;

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
              {isEs ? 'Guía del Estudio:' : 'Studio Tour:'}{' '}
              <strong className="text-emerald-400 font-mono">
                {currentStepIndex + 1}/{totalSteps}
              </strong>
            </span>
            <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      ) : (
        /* Floating Tour Card (Non-blocking: Workspace and tabs are viewable) */
        <div
          role="region"
          aria-label="Interactive Guided Tour"
          className="pointer-events-auto fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2.5rem)] bg-zinc-950/95 border border-zinc-700/80 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 text-zinc-200 backdrop-blur-md"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-emerald-950 border border-emerald-800/80 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-mono tracking-wider text-emerald-400 uppercase font-semibold">
                {t('interactiveTourTitle', 'Tour Guiado')}
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
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 shrink-0 mt-0.5">
                <StepIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-zinc-100 mb-1">
                  {isEs ? currentStep.titleEs : currentStep.titleEn}
                </h3>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {isEs ? currentStep.descEs : currentStep.descEn}
                </p>
              </div>
            </div>

            {/* Pro tip / Layout advice */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-2.5 flex items-start gap-2">
              <span className="text-amber-400 text-xs shrink-0 mt-0.5">💡</span>
              <p className="text-[11px] text-zinc-300 leading-snug">
                {isEs ? currentStep.tipEs : currentStep.tipEn}
              </p>
            </div>

            {/* Ko-fi Button: Solely at the final step, single row, no title tooltip */}
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
                  onClick={() => setCurrentStepIndex(idx)}
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

            {/* Buttons */}
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
                className="flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow transition cursor-pointer"
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
