import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Keyboard,
  Sliders,
  Sparkles,
  Compass,
  FileText,
  Clock,
  Users,
  Globe,
  BookUp,
  ShieldCheck,
  Check,
  MousePointer,
  Save,
} from 'lucide-react';
import { Language } from '../../types/settings';
import { useTranslation } from '../../i18n/translations';
import KofiButton from './KofiButton';

export interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  language?: Language;
}

type HelpTab = 'doc' | 'controls' | 'settings';

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
  language = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<HelpTab>('doc');
  const { t } = useTranslation(language);
  const isEs = language === 'es';

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('helpAndGuide', 'Ayuda y Guía')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[640px] max-h-[88vh] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                {t('helpAndGuideTitle', 'Guía y Ayuda de Foliant')}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {t('helpAndGuideSubtitle', 'Estudio literario y arquitectura narrativa')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title={t('closeHelp', 'Cerrar Ayuda')}
            aria-label="Close Help"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Interactive Tour Access Banner */}
        <div className="mx-6 mt-4 p-4 rounded-lg bg-gradient-to-r from-emerald-950/40 via-zinc-900/80 to-zinc-900/40 border border-emerald-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-md bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-emerald-200 flex items-center gap-2">
                <span>{t('interactiveTourTitle', 'Guía Interactiva Rápida')}</span>
                <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/40 whitespace-nowrap">
                  1 min • Toca y prueba
                </span>
              </h3>
              <p className="text-[11px] text-zinc-300 leading-snug mt-0.5 max-w-xl">
                {t(
                  'interactiveTourDesc',
                  'Explora la interfaz interactiva mientras tocas y pruebas directamente cada herramienta del estudio literario.'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onStartTour}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-sm cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">{t('startInteractiveTour', 'Iniciar tour guiado')}</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <button
            onClick={() => setActiveTab('doc')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'doc'
                ? 'border-emerald-500 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('tabDoc', 'Documentación')}</span>
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'controls'
                ? 'border-emerald-500 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{t('tabControls', 'Controles y Atajos')}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-emerald-500 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('tabSettingsGuide', 'Guía de Ajustes')}</span>
          </button>
        </div>

        {/* Tab Body Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs text-zinc-300">
          {activeTab === 'doc' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 01 Redacción */}
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40">
                  <div className="flex items-center gap-2 font-semibold text-zinc-100 mb-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>{isEs ? '01 • Editor Inmersivo TipTap' : '01 • Immersive TipTap Editor'}</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    {isEs
                      ? 'Lienzo de redacción sin distracciones con formato enriquecido (negrita, cursiva, subrayado), resaltados cromáticos, notas al margen y cálculo de palabras en tiempo real por escena frente al objetivo global.'
                      : 'Distraction-free writing canvas with rich text formatting, color highlights, margin notes, and live word count per scene tracked against your project goal.'}
                  </p>
                </div>

                {/* 02 Estructura */}
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40">
                  <div className="flex items-center gap-2 font-semibold text-zinc-100 mb-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>{isEs ? '02 • Esquema & Manuscrito' : '02 • Outline & Manuscript'}</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    {isEs
                      ? 'Estructuración jerárquica en Actos, Capítulos y Escenas. Reordena secuencias fácilmente, asigna estados de avance y añade resúmenes argumentales.'
                      : 'Hierarchical structure in Acts, Chapters, and Scenes. Reorder sections smoothly, track writing status, and manage narrative summaries.'}
                  </p>
                </div>

                {/* 03 Cronología */}
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40">
                  <div className="flex items-center gap-2 font-semibold text-zinc-100 mb-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>{isEs ? '03 • Cronología Multivía' : '03 • Multi-Track Timeline'}</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    {isEs
                      ? 'Visualiza subtramas y arcos simultáneos en dos modalidades: mapa de metro cronológico y carriles por capítulo ordenado con filtrado por personajes y tramas.'
                      : 'Visualize storylines and simultaneous character arcs in two modes: subway timeline map and ordered chapter lanes with character & plot filtering.'}
                  </p>
                </div>

                {/* 04 Personajes & Grafo */}
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40">
                  <div className="flex items-center gap-2 font-semibold text-zinc-100 mb-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>{isEs ? '04 • Grafo de Personajes & Flechas Curvables' : '04 • Character Graph & Curvable Arrows'}</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    {isEs
                      ? 'Crea fichas del reparto y conecta personajes con enlaces dinámicos (alianza, conflicto, secretos). Con clic izquierdo doblas y mueves el enlace, y con clic derecho mantenido sobre la etiqueta la desplazas a lo largo del enlace. Doble clic para resetear curvatura, clic derecho en el lienzo para crear nodos y Ctrl+Z para deshacer al instante.'
                      : 'Build character dossiers and connect them with dynamic links (alliances, rivalries, secrets). Left-click and drag label to bend the link, hold right-click to slide it along the link, double-click to reset curve, right-click canvas to spawn nodes, and press Ctrl+Z to undo.'}
                  </p>
                </div>

                {/* 05 Worldbuilding */}
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40">
                  <div className="flex items-center gap-2 font-semibold text-zinc-100 mb-1.5">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>{isEs ? '05 • Enciclopedia & Lore' : '05 • Lore & Worldbuilding'}</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    {isEs
                      ? 'Enciclopedia narrativa para documentar reinos, facciones, reliquias y magia con taxonomías cromáticas personalizables y moodboards visuales.'
                      : 'Narrative encyclopedia to document kingdoms, factions, relics, and magic with customizable color taxonomies and visual moodboards.'}
                  </p>
                </div>

                {/* 06 Exportación EPUB */}
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40">
                  <div className="flex items-center gap-2 font-semibold text-zinc-100 mb-1.5">
                    <BookUp className="w-4 h-4 text-emerald-400" />
                    <span>{isEs ? '06 • Exportación a EPUB Estándar' : '06 • Standard EPUB Export'}</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    {isEs
                      ? 'Genera libros electrónicos estándar listos para publicación comercial o lectura digital, con portada personalizada, metadatos y selección de escenas.'
                      : 'Generate standard e-books ready for publishing or digital readers, complete with cover artwork, metadata, and flexible scene inclusion.'}
                  </p>
                </div>

                {/* 07 Guardado & Autoguardado */}
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40">
                  <div className="flex items-center gap-2 font-semibold text-zinc-100 mb-1.5">
                    <Save className="w-4 h-4 text-emerald-400" />
                    <span>{isEs ? '07 • Guardado y Tiempo de Autoguardado' : '07 • Save Mode & Auto-Save Delay'}</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    {isEs
                      ? 'Foliant permite alternar entre guardado automático y confirmación manual. Al usar el modo automático, puedes personalizar en Ajustes > General el tiempo de espera del autoguardado (desde 5 segundos hasta 10 minutos de inactividad, siendo 5 minutos el valor recomendado para evitar escrituras excesivas en disco o tirones al escribir).'
                      : 'Foliant lets you toggle between automatic background saving and manual confirmation. In auto-save mode, you can customize the idle delay under Settings > General (from 5 seconds to 10 minutes, with 5 minutes recommended to avoid excessive disk writes or typing stutter).'}
                  </p>
                </div>
              </div>

              {/* Dock Layout Tip */}
              <div className="p-3 rounded-lg border border-emerald-900/60 bg-emerald-950/20 flex items-start gap-2.5">
                <span className="text-amber-400 text-xs shrink-0 mt-0.5">💡</span>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  <strong className="text-emerald-300">
                    {isEs ? 'Consejo de espacio de trabajo:' : 'Workspace layout tip:'}
                  </strong>{' '}
                  {isEs
                    ? 'Si deseas trabajar con tu texto y las herramientas en grande a la vez, es una buena idea colapsar un lado (izquierdo o derecho) y agrandar el panel opuesto hasta ocupar la mitad de la pantalla.'
                    : 'If you want to work with your text and tools enlarged at the same time, it is a great idea to collapse one side (left or right) and expand the opposite dock to half of the screen.'}
                </p>
              </div>

              {/* Local-first banner */}
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-200">
                    {isEs ? 'Privacidad y Almacenamiento Local-First:' : 'Privacy & Local-First Architecture:'}
                  </strong>{' '}
                  {isEs
                    ? 'Tus manuscritos y notas se almacenan directamente en tu propio disco en formato Markdown abierto. Foliant nunca envía tus obras a servidores externos.'
                    : 'Your manuscripts and notes are stored directly on your disk in open Markdown formats. Foliant never sends your writing to external servers.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-4">
              {/* Grafo de Relaciones */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono mb-2 flex items-center gap-2">
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>{isEs ? 'Controles del Grafo de Personajes & Flechas' : 'Character Graph & Arrow Controls'}</span>
                </h4>
                <div className="border border-zinc-800/80 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/40">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Doblar flecha y mover enlace' : 'Bend arrow & move link'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {isEs ? 'Clic izquierdo y arrastrar etiqueta' : 'Left-click & drag label pill'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/20">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Mover etiqueta a lo largo del enlace' : 'Slide label along the link'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {isEs ? 'Clic derecho mantenido sobre etiqueta' : 'Hold right-click & drag label pill'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/20">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Restablecer curvatura y posición central' : 'Reset arrow curve to default'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {isEs ? 'Doble clic en la etiqueta' : 'Double-click label pill'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/40">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Deshacer en el grafo (posiciones, enlaces...)' : 'Undo in graph'}
                    </span>
                    <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                      Ctrl + Z
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/20">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Rehacer en el grafo' : 'Redo in graph'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Ctrl + Shift + Z / Ctrl + Y
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/40">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Crear personaje o conector en esa posición' : 'Add character or junction node'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {isEs ? 'Clic derecho en el lienzo vacío' : 'Right-click empty canvas'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/20">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Trazar nueva conexión entre personajes' : 'Draw new relationship link'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {isEs ? 'Clic en puerto y arrastrar al destino' : 'Click port & drag to target card'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/40">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Eliminar relación o personaje seleccionado' : 'Delete selected relationship or node'}
                    </span>
                    <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                      Supr / Backspace
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/20">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Zoom y Paneo por el mapa del grafo' : 'Zoom & Pan canvas'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {isEs ? 'Rueda del ratón / Arrastrar fondo' : 'Mouse wheel / Drag background'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Atajos Generales */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono mb-2">
                  {isEs ? 'Atajos Generales del Proyecto' : 'General Project Shortcuts'}
                </h4>
                <div className="border border-zinc-800/80 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/40">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Guardar proyecto' : 'Save Project'}
                    </span>
                    <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                      Ctrl + S
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/20">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Guardar como nuevo archivo' : 'Save As...'}
                    </span>
                    <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                      Ctrl + Shift + S
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/40">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Abrir proyecto existente' : 'Open Project...'}
                    </span>
                    <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                      Ctrl + O
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/20">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Búsqueda global en el manuscrito' : 'Global Text Search'}
                    </span>
                    <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                      Ctrl + Shift + F
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/40">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Abrir esta guía y panel de ayuda' : 'Open Help & Guide'}
                    </span>
                    <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                      F1
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/20">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Configurar tiempo de autoguardado' : 'Configure auto-save delay'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {isEs ? 'Ajustes > General > Intervalo' : 'Settings > General > Interval'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Atajos de Redacción */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono mb-2">
                  {isEs ? 'Atajos de Redacción en Editor' : 'Editor Formatting Shortcuts'}
                </h4>
                <div className="border border-zinc-800/80 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/40">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Texto en negrita' : 'Bold text'}
                    </span>
                    <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                      Ctrl + B
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/20">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Texto en cursiva' : 'Italic text'}
                    </span>
                    <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                      Ctrl + I
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/40">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Texto subrayado' : 'Underline text'}
                    </span>
                    <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                      Ctrl + U
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/20">
                    <span className="text-zinc-300 font-medium">
                      {isEs ? 'Deshacer / Rehacer en texto' : 'Undo / Redo in text'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Ctrl + Z / Ctrl + Y
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 space-y-2">
                <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isEs ? 'Ajustes Generales' : 'General Settings'}</span>
                </h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Permite configurar el idioma del estudio (Español / Inglés) y definir el modo de guardado. El modo automático guarda silenciosamente tras cada modificación y permite personalizar el tiempo de espera del autoguardado (desde 5 segundos hasta 10 minutos de inactividad, con 5 minutos como valor recomendado), mientras que el modo manual otorga control explícito al autor mediante el botón de guardado o Ctrl+S.'
                    : 'Allows configuring interface language (Spanish / English) and save mode. Auto-save mode stores changes continuously and lets you customize the auto-save delay (from 5 seconds to 10 minutes of idle time, with 5 minutes recommended), while manual mode provides explicit author control via the save button or Ctrl+S.'}
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 space-y-2">
                <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isEs ? 'Tipografía y Confort de Lectura' : 'Typography & Reading Comfort'}</span>
                </h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Selecciona entre fuentes serif clásicas como Lora y Merriweather, elegantes como Cinzel o limpias sans-serif como Inter. Puedes regular el tamaño tipográfico, el margen horizontal del lienzo y la sangría de primera línea para asemejarlo a un libro impreso.'
                    : 'Choose among classic serif fonts like Lora and Merriweather, elegant Cinzel, or clean sans-serif Inter. Adjust font scaling, line indentation, and canvas margins to simulate printed books.'}
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 space-y-2">
                <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isEs ? 'Taxonomías & Códigos de Color' : 'Taxonomies & Color Coding'}</span>
                </h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Define y crea etiquetas personalizadas con paletas de color asignadas para roles de personajes (Protagonista, Antagonista, Secundario...), líneas argumentales de trama y categorías enciclopédicas del mundo.'
                    : 'Define custom tags with distinct color palettes for character roles (Protagonist, Antagonist, Secondary...), storyline threads, and world categories.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar: Single-row, non-breaking creator info & Ko-fi Button */}
        <div className="flex flex-row items-center justify-between px-6 py-3 border-t border-zinc-800 bg-zinc-900/60 shrink-0 gap-4 text-xs text-zinc-400 whitespace-nowrap">
          <div className="flex items-center gap-2 text-[11px] whitespace-nowrap">
            <span className="font-mono text-zinc-300 font-semibold">Foliant</span>
            <span>•</span>
            <span className="whitespace-nowrap">{isEs ? 'Creado por Zintradev' : 'Crafted by Zintradev'}</span>
          </div>

          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <span className="text-[11px] text-zinc-500 hidden sm:inline whitespace-nowrap">
              {t('kofiDesc', 'Proyecto libre y local-first:')}
            </span>
            <KofiButton label={t('supportKofi', 'Apoyar en Ko-fi')} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpGuideModal;
