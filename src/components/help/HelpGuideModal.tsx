import React from 'react';
import {
  X,
  BookOpen,
  Compass,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Language } from '../../types/settings';
import { useTranslation } from '../../i18n/translations';
import KofiButton from './KofiButton';

export interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  language?: Language;
  onLoadDemoProject?: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
  language = 'en',
  onLoadDemoProject,
}) => {
  const { t } = useTranslation(language);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('helpAndGuide', 'Help & Guide')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[680px] max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                {t('helpAndGuideTitle', 'Foliant Studio Guide & Help')}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {t('tabControls', 'Controls & Shortcuts')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title={t('closeHelp', 'Close Help')}
            aria-label="Close Help"
            className="p-2 md:p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer touch-manipulation min-w-[36px] min-h-[36px] md:min-w-0 md:min-h-0 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Interactive Tour Access Banner */}
        <div className="mx-6 mt-4 p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                <span>{t('interactiveTourTitle', 'Quick Interactive Tour')}</span>
              </h3>
              <p className="text-[11px] text-zinc-300 leading-snug mt-0.5 max-w-xl">
                {t(
                  'interactiveTourDesc',
                  'Explore the interface interactively while directly testing each tool of the literary studio.'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onLoadDemoProject && (
              <button
                type="button"
                onClick={() => {
                  onLoadDemoProject();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs transition shadow-sm cursor-pointer shrink-0 whitespace-nowrap"
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t('loadDemoProject', 'Load example project')}</span>
              </button>
            )}
            <button
              onClick={onStartTour}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-sm cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{t('startInteractiveTour', 'Start interactive tour')}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body: Controls & Shortcuts Exclusive Section */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 text-xs text-zinc-300">
          {/* Grafo de Relaciones */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white font-mono mb-2">
              {t('helpGraphControlsTitle', 'Character Graph & Arrow Controls')}
            </h4>
            <div className="border border-zinc-800/80 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpGraphBendArrow', 'Bend arrow & move link')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpGraphBendArrowKey', 'Left-click + Drag label pill')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpGraphSlideLabel', 'Slide label along the link')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpGraphSlideLabelKey', 'Hold right-click + Drag')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpGraphResetCurve', 'Reset arrow curve to default')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpGraphResetCurveKey', 'Double-click label pill')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpGraphUndo', 'Undo in graph')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Ctrl + Z
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpGraphRedo', 'Redo in graph')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Ctrl + Shift + Z / Ctrl + Y
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpGraphAddNode', 'Add character or junction node')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpGraphAddNodeKey', 'Right-click empty canvas')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpGraphDrawLink', 'Draw new relationship link')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpGraphDrawLinkKey', 'Click port + Drag to card')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpGraphDeleteSelected', 'Delete selected relationship or node')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpGraphDeleteSelectedKey', 'Delete / Backspace')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpGraphZoomPan', 'Zoom & Pan canvas')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpGraphZoomPanKey', 'Mouse wheel / Drag background')}
                </kbd>
              </div>
            </div>
          </div>

          {/* Atajos Generales */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white font-mono mb-2">
              {t('helpGeneralShortcutsTitle', 'General Project & Search Shortcuts')}
            </h4>
            <div className="border border-zinc-800/80 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpSaveProject', 'Save Project')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Ctrl + S
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpSaveAsProject', 'Save As...')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Ctrl + Shift + S
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpOpenProject', 'Open Project...')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Ctrl + O
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpGlobalSearch', 'Global Text Search')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Ctrl + Shift + F / Ctrl + F
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpOpenGuide', 'Open Help & Guide')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  F1
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpConfigAutosave', 'Configure auto-save delay')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpConfigAutosaveKey', 'Settings > General > Interval')}
                </kbd>
              </div>
            </div>
          </div>

          {/* Atajos de Redacción */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white font-mono mb-2">
              {t('helpEditorShortcutsTitle', 'Editor Formatting & Symbol Shortcuts')}
            </h4>
            <div className="border border-zinc-800/80 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpBoldText', 'Bold text')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Ctrl + B
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpItalicText', 'Italic text')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Ctrl + I
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpUnderlineText', 'Underline text')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Ctrl + U
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpUndoRedoText', 'Undo / Redo in text')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Ctrl + Z / Ctrl + Y
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpSpecialSymbols', 'Insert special symbols (—, « », “ ”, ¿, ¡)')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpSpecialSymbolsKey', 'Ω button in toolbar')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpTextColorHighlight', 'Highlight & underline text color')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpTextColorHighlightKey', 'Color picker in toolbar')}
                </kbd>
              </div>
            </div>
          </div>

          {/* Notas de Contexto & Lista de Tareas */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white font-mono mb-2">
              {t('helpNotesTasksTitle', 'Context Notes & Task Lists')}
            </h4>
            <div className="border border-zinc-800/80 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpSaveNoteEdit', 'Save & finish editing note')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Ctrl + Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpCommitNoteItem', 'Commit title / new item in list note')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpRenameNoteTitle', 'Rename note title')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpRenameNoteTitleKey', 'Double-click note title')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpFilterNotesFolder', 'Filter notes by folder')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpFilterNotesFolderKey', 'Click folder pill')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpMoodboardLightbox', 'View full-size image (Lightbox)')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpMoodboardLightboxKey', 'Click Moodboard image')}
                </kbd>
              </div>
            </div>
          </div>

          {/* Controles del Sistema Dock & Paneles */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white font-mono mb-2">
              {t('helpDockControlsTitle', 'Dock System & Workspace Controls')}
            </h4>
            <div className="border border-zinc-800/80 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpCollapseLeftDock', 'Collapse / Expand left dock')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpHeaderToggleButton', 'Header toggle button')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpCollapseRightDock', 'Collapse / Expand right dock')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpHeaderToggleButton', 'Header toggle button')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpMaximizeBottomPanel', 'Maximize bottom panel fullscreen')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpMaximizeBottomPanelKey', 'Maximize button in bottom dock')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpResizeDockPanels', 'Resize dock panels')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpResizeDockPanelsKey', 'Drag splitter bar')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpFocusMode', 'Focus Mode (distraction-free)')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpFocusModeKey', 'Focus button in top bar')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpMoveReorderTabs', 'Move or reorder tabs across panels')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpMoveReorderTabsKey', 'Drag tab')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpTabContextMenu', 'Tab context menu (split, move, close)')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpTabContextMenuKey', 'Right-click tab')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpAddDockModules', 'Add new modules to a Dock panel')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpAddDockModulesKey', '+ button on tab bar')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpOutlineContextMenu', 'Outline context menu (rename, delete...)')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpOutlineContextMenuKey', 'Right-click scene or folder')}
                </kbd>
              </div>
            </div>
          </div>

          {/* Cronología */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white font-mono mb-2">
              {t('helpTimelineControlsTitle', 'Timeline')}
            </h4>
            <div className="border border-zinc-800/80 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpTimelineToggleViews', 'Toggle between Lanes & Subway Map')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpTimelineToggleViewsKey', 'Header view toggle buttons')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpTimelineZoomReorder', 'Zoom timeline & drag to reorder scenes')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpTimelineZoomReorderKey', 'Zoom slider / Drag scene')}
                </kbd>
              </div>
            </div>
          </div>

          {/* Controles Web y Tablet */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white font-mono mb-2">
              {t('helpWebTabletTitle', 'Web & Tablet / Touchscreen Controls')}
            </h4>
            <div className="border border-zinc-800/80 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpSaveWeb', 'Save on Web (download .foliant file)')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Ctrl + S
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpOpenWeb', 'Open project file on Web')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  Ctrl + O
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpTouchReorderItems', 'Reorder touchscreen items (Timeline, World, Notes & Moodboard)')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpTouchLongPressKey', 'Long-press (350ms)')}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 transition gap-4">
                <span className="text-zinc-300 font-medium">
                  {t('helpTouchGraphZoomPan', 'Touch zoom & pan in Relationship Graph')}
                </span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded shadow-xs shrink-0 whitespace-nowrap">
                  {t('helpTouchGraphZoomPanKey', 'Pinch to zoom / Drag canvas')}
                </kbd>
              </div>
            </div>
          </div>

          {/* Dock Layout Tip */}
          <div className="p-3 rounded-lg border border-emerald-900/60 bg-emerald-950/20 flex items-start gap-2.5">
            <span className="text-amber-400 text-xs shrink-0 mt-0.5">💡</span>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              <strong className="text-white">
                {t('helpWorkspaceTipTitle', 'Workspace layout tip:')}
              </strong>{' '}
              {t(
                'helpWorkspaceTipDesc',
                'If you want to work with your text and tools enlarged at the same time, it is a great idea to collapse one side (left or right) and expand the opposite dock to half of the screen.'
              )}
            </p>
          </div>

          {/* Local-first banner */}
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-zinc-200 shrink-0" />
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <strong className="text-white">
                {t('helpPrivacyTitle', 'Privacy & Local-First Architecture:')}
              </strong>{' '}
              {t(
                'helpPrivacyDesc',
                'Your manuscripts and notes are stored directly on your disk in open Markdown formats. Foliant never sends your writing to external servers.'
              )}
            </p>
          </div>
        </div>

        {/* Bottom Bar: Single-row, non-breaking creator info & Ko-fi Button */}
        <div className="flex flex-row items-center justify-between px-6 py-3 border-t border-zinc-800 bg-zinc-900/60 shrink-0 gap-4 text-xs text-zinc-400 whitespace-nowrap">
          <div className="flex items-center gap-2 text-[11px] whitespace-nowrap">
            <span className="font-mono text-zinc-300 font-semibold">Foliant</span>
            <span>•</span>
            <span className="whitespace-nowrap">{t('craftedBy', 'Crafted by Zintradev')}</span>
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
