import { memo, useCallback, useState, useEffect, lazy, Suspense } from 'react';
import { Feather, Plus } from 'lucide-react';
import { Editor } from '@tiptap/react';

function SquareInsideSquareIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  );
}
import { TabId } from '../../types/dock';
import { FoliantChapter } from '../../types/project';
import { AppSettings, Language, EditorFontFamily } from '../../types/settings';
import { SaveStatus } from '../../hooks/useProjectPersistence';
import { UseDockLayoutReturn } from '../../hooks/useDockLayout';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import DockContainer from '../dock/DockContainer';
import Splitter from '../common/Splitter';
import FoliantEditor from '../editor/FoliantEditor';
import EditorToolbar from '../editor/FoliantEditor/EditorToolbar';
import { EditorWorkspaceHeader } from './EditorWorkspaceHeader';
import { EditorStatusBar } from './EditorStatusBar';
import { BottomDockPanel } from './BottomDockPanel';

const WordSymbolModal = lazy(() => import('../editor/WordSymbolModal'));

export interface WritingWorkspaceProps {
  isVisible: boolean;
  layout: UseDockLayoutReturn;
  nav: ReturnType<typeof useAppNavigation>;
  renderDockView: (tabId: TabId, isExpanded?: boolean) => React.ReactNode;
  activeChapter: FoliantChapter | undefined;
  activeChapterId: string;
  targetWords: number;
  wordCount: number;
  persistenceError: string | null;
  onClearPersistenceError: () => void;
  onContentChange: (content: string) => void;
  onEditorStatusChange: (status: SaveStatus) => void;
  onUpdateChapter?: (id: string, updates: Partial<FoliantChapter>) => void;
  onAddChapter?: (type?: 'folder' | 'scene', parentId?: string | null) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  appSettings: AppSettings;
  activeSearchTerm: string | null;
  editorSaveStatus: SaveStatus;
  isDirty: boolean;
  currentLanguage: Language;
  t: (key: any, defaultVal?: string) => string;
}

export const WritingWorkspace = memo(function WritingWorkspace({
  isVisible,
  layout,
  nav,
  renderDockView,
  activeChapter,
  activeChapterId,
  targetWords,
  wordCount,
  persistenceError,
  onClearPersistenceError,
  onContentChange,
  onEditorStatusChange,
  onUpdateChapter,
  onAddChapter,
  isFocusMode = false,
  onToggleFocusMode,
  appSettings,
  activeSearchTerm,
  editorSaveStatus,
  isDirty,
  currentLanguage,
  t,
}: WritingWorkspaceProps) {
  const handleCloseLeft = useCallback(() => layout.setLeftOpen(false), [layout]);
  const handleCloseRight = useCallback(() => layout.setRightOpen(false), [layout]);
  const handleToggleLeft = useCallback(() => layout.setLeftOpen((prev) => !prev), [layout]);
  const handleToggleRight = useCallback(() => layout.setRightOpen((prev) => !prev), [layout]);
  const handleCloseBottom = useCallback(() => layout.setIsBottomOpen(false), [layout]);
  const handleToggleBottom = useCallback(() => layout.setIsBottomOpen((prev) => !prev), [layout]);
  const noop = useCallback(() => { }, []);

  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [activeFontFamily, setActiveFontFamily] = useState<EditorFontFamily>(
    appSettings.preferences?.editorFontFamily || 'serif'
  );
  const [isSymbolsModalOpen, setIsSymbolsModalOpen] = useState(false);

  useEffect(() => {
    if (appSettings.preferences?.editorFontFamily) {
      setActiveFontFamily(appSettings.preferences.editorFontFamily);
    }
  }, [appSettings.preferences?.editorFontFamily]);

  const handleInsertSymbolFromModal = useCallback(
    (symbolChar: string) => {
      if (!activeEditor || activeEditor.isDestroyed) return;
      activeEditor.chain().focus().insertContent(symbolChar).run();
    },
    [activeEditor]
  );

  // Determine Paper & Canvas styling
  const paperMode = appSettings.preferences?.editorPaperColor || 'paper';
  const customBg = appSettings.preferences?.editorCustomBg || '#f6f1e8';
  const customText = appSettings.preferences?.editorCustomText || '#2c2523';
  const matchBg = Boolean(appSettings.preferences?.matchEditorBackgroundWithPaper);
  const themeMode = appSettings.preferences?.themeMode || 'dark';

  let paperBg = '#f6f1e8';
  let paperText = '#2c2523';
  let paperBorder = 'rgba(44, 37, 35, 0.12)';

  if (paperMode === 'white') {
    paperBg = '#ffffff';
    paperText = '#18181b';
    paperBorder = 'rgba(0, 0, 0, 0.1)';
  } else if (paperMode === 'warm') {
    paperBg = '#faf8f5';
    paperText = '#27272a';
    paperBorder = 'rgba(39, 39, 42, 0.1)';
  } else if (paperMode === 'custom') {
    paperBg = customBg;
    paperText = customText;
    paperBorder = 'rgba(120, 120, 120, 0.18)';
  } else if (paperMode === 'default') {
    if (themeMode === 'light') {
      paperBg = '#ffffff';
      paperText = '#18181b';
      paperBorder = '#e4e4e7';
    } else {
      paperBg = '#09090b';
      paperText = '#d4d4d8';
      paperBorder = '#27272a';
    }
  }

  // Bugfix: ensure that in Light Theme + Paper sheet color, writing panel is NEVER black
  let containerBg = themeMode === 'light' ? '#f4f4f5' : '#09090b';
  if (matchBg) {
    containerBg = paperBg;
  }

  // Focus mode visibility: in Focus Mode, left and right docks are collapsed, and bottom dock is collapsed
  const showLeftDock = !isFocusMode && layout.leftOpen;
  const showRightDock = !isFocusMode && layout.rightOpen;
  const showBottomDock = !isFocusMode && layout.isBottomOpen;
  const showTopHeader = !isFocusMode;
  const showStatusBar = !isFocusMode;
  const showToolbar =
    (!isFocusMode || Boolean(appSettings.preferences?.focusModeShowFormattingToolbar)) &&
    Boolean(activeChapter);

  return (
    <div className={`flex-1 flex min-w-0 h-full ${isVisible ? 'flex' : 'hidden'}`}>
      {/* Left Dock Panel */}
      <DockContainer
        side="left"
        isOpen={showLeftDock}
        onToggleOpen={handleCloseLeft}
        tabs={layout.leftTabs}
        activeTab={layout.activeLeftTab}
        onSelectTab={layout.handleSelectLeftTab}
        onDockTab={layout.handleDockTab}
        onRemoveTab={layout.handleRemoveTab}
        renderView={renderDockView}
        width={layout.leftWidth}
        isDirty={isDirty}
        language={currentLanguage}
        onRequestTabChange={layout.handleSelectLeftTab}
      />

      {showLeftDock && <Splitter onResize={layout.handleResizeLeft} onReset={noop} label="Resize left panel" />}

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative" style={{ backgroundColor: containerBg }}>
        {showTopHeader && (
          <EditorWorkspaceHeader
            leftOpen={layout.leftOpen}
            onToggleLeft={handleToggleLeft}
            activeChapterTitle={activeChapter?.title ?? t('noChapterSelected')}
            wordCount={wordCount}
            targetWords={targetWords}
            rightOpen={layout.rightOpen}
            onToggleRight={handleToggleRight}
            isFocusMode={isFocusMode}
            onToggleFocus={onToggleFocusMode}
            t={t}
          />
        )}

        {/* Formatting Toolbar directly below Chapter Title / Header (outside the paper background) */}
        {showToolbar && (
          <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-1.5 flex items-center justify-center shrink-0 z-20">
            <EditorToolbar
              editor={activeEditor}
              currentFont={activeFontFamily}
              onFontChange={setActiveFontFamily}
              onOpenSymbols={() => setIsSymbolsModalOpen(true)}
              className="relative z-10 w-full flex items-center justify-center flex-wrap sm:flex-nowrap gap-1 select-none overflow-visible text-zinc-300"
            />
          </div>
        )}

        {/* Floating Exit Focus Mode toggle button when in Focus Mode */}
        {isFocusMode && onToggleFocusMode && (
          <div className="absolute top-3 right-4 z-50">
            <button
              onClick={onToggleFocusMode}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 shadow-md text-xs transition cursor-pointer backdrop-blur-xs font-medium"
              title={t('exitFocusMode', 'Exit Focus')}
            >
              <SquareInsideSquareIcon className="w-3.5 h-3.5 text-zinc-300" />
              <span>{t('exitFocusMode', 'Exit Focus')}</span>
            </button>
          </div>
        )}

        {persistenceError && (
          <div className="bg-rose-950/90 border-b border-rose-800/80 px-3 py-1.5 flex items-center justify-between text-xs text-rose-200 z-30 shrink-0">
            <span className="truncate mr-2">{t('diskError')}: {persistenceError}</span>
            <button
              onClick={onClearPersistenceError}
              className="text-[10px] font-mono hover:text-white px-1.5 py-0.5 rounded-xs bg-rose-900/60 hover:bg-rose-850 transition"
            >
              {t('dismiss')}
            </button>
          </div>
        )}

        {/* Writing Paper Canvas or Empty Canvas State */}
        {!activeChapter ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none min-h-0">
            <div className="w-12 h-12 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3 shadow-xs">
              <Feather className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1">
              {t('noSceneSelected', 'Ninguna escena seleccionada')}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mb-4 leading-relaxed">
              {t('selectSceneHint', 'Selecciona una escena en el Outline o crea una nueva para empezar a escribir.')}
            </p>
            {onAddChapter && (
              <button
                type="button"
                onClick={() => {
                  onAddChapter('scene');
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('foliant-tour-scene-created'));
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('newScene', 'Crear nueva escena')}</span>
              </button>
            )}
          </div>
        ) : (
          <div
            className="flex-1 overflow-y-auto px-8 py-10 flex justify-center items-start min-h-0"
            style={{ backgroundColor: containerBg }}
          >
            <div
              className={`w-full max-w-2xl min-h-[calc(100vh-6rem)] h-auto rounded-sm p-8 transition-colors duration-150 focus:outline-none mb-10 flex flex-col ${matchBg ? 'border-0 shadow-none' : 'shadow-sm'
                }`}
              style={{
                backgroundColor: paperBg,
                color: paperText,
                border: matchBg ? 'none' : `1px solid ${paperBorder}`,
                boxShadow: matchBg ? 'none' : undefined,
              }}
            >
              <FoliantEditor
                chapterId={activeChapterId}
                content={activeChapter?.content ?? ''}
                onChange={onContentChange}
                onStatusChange={onEditorStatusChange}
                indentFirstLine={appSettings.preferences?.editorIndentFirstLine}
                fontFamily={activeFontFamily}
                searchTerm={activeSearchTerm}
                isAutoSave={(appSettings.preferences?.saveMode || 'auto') === 'auto'}
                autoSaveInterval={appSettings.preferences?.autoSaveInterval}
                hideToolbar={true}
                externalToolbar={true}
                onEditorReady={setActiveEditor}
                title={activeChapter?.title}
                onTitleChange={(newTitle) => onUpdateChapter?.(activeChapterId, { title: newTitle })}
              />
            </div>
          </div>
        )}

        {/* Bottom Dock Panel (Hidden in Focus Mode) */}
        {showBottomDock && (
          <BottomDockPanel
            isBottomOpen={layout.isBottomOpen}
            bottomHeight={layout.bottomHeight}
            bottomTabs={layout.bottomTabs}
            activeBottomTab={layout.activeBottomTab}
            onSelectBottomTab={layout.setActiveBottomTab}
            onCloseBottom={handleCloseBottom}
            onMaximizeBottom={nav.handleMaximizeBottom}
            onSplitterMouseDown={layout.handleBottomSplitterMouseDown}
            t={t}
          >
            {renderDockView(layout.activeBottomTab, false)}
          </BottomDockPanel>
        )}

        {/* Status Bar (Hidden in Focus Mode) */}
        {showStatusBar && (
          <EditorStatusBar
            isBottomOpen={layout.isBottomOpen}
            activeBottomTab={layout.activeBottomTab}
            onOpenTimelineBottom={nav.handleOpenTimelineBottom}
            onOpenRelationshipsBottom={nav.handleOpenRelationshipsBottom}
            onToggleBottom={handleToggleBottom}
            editorSaveStatus={editorSaveStatus}
            activeChapterTitle={activeChapter?.title || t('noChapterSelected')}
            wordCount={wordCount}
            targetWords={targetWords}
            t={t}
          />
        )}
        {/* Microsoft Word-like Comprehensive Symbols Modal */}
        <Suspense fallback={null}>
          <WordSymbolModal
            isOpen={isSymbolsModalOpen}
            onClose={() => setIsSymbolsModalOpen(false)}
            onInsertSymbol={handleInsertSymbolFromModal}
          />
        </Suspense>
      </main>

      {showRightDock && <Splitter onResize={layout.handleResizeRight} onReset={noop} label="Resize right panel" />}

      {/* Right Dock Panel */}
      <DockContainer
        side="right"
        isOpen={showRightDock}
        onToggleOpen={handleCloseRight}
        tabs={layout.rightTabs}
        activeTab={layout.activeRightTab}
        onSelectTab={layout.handleSelectRightTab}
        onDockTab={layout.handleDockTab}
        onRemoveTab={layout.handleRemoveTab}
        renderView={renderDockView}
        width={layout.rightWidth}
        isDirty={isDirty}
        language={currentLanguage}
        onRequestTabChange={layout.handleSelectRightTab}
      />
    </div>
  );
});

WritingWorkspace.displayName = 'WritingWorkspace';
