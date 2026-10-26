import React, { memo, useCallback } from 'react';
import { TabId } from '../../types/dock';
import { FoliantChapter } from '../../types/project';
import { AppSettings } from '../../types/settings';
import { SaveStatus } from '../../hooks/useProjectPersistence';
import { UseDockLayoutReturn } from '../../hooks/useDockLayout';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import DockContainer from '../dock/DockContainer';
import Splitter from '../common/Splitter';
import FoliantEditor from '../editor/FoliantEditor';
import { EditorWorkspaceHeader } from './EditorWorkspaceHeader';
import { EditorStatusBar } from './EditorStatusBar';
import { BottomDockPanel } from './BottomDockPanel';

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
  appSettings: AppSettings;
  activeSearchTerm: string | null;
  editorSaveStatus: SaveStatus;
  isDirty: boolean;
  currentLanguage: string;
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
  const noop = useCallback(() => {}, []);

  return (
    <div className={`flex-1 flex min-w-0 h-full ${isVisible ? 'flex' : 'hidden'}`}>
      <DockContainer
        side="left"
        isOpen={layout.leftOpen}
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

      {layout.leftOpen && <Splitter onResize={layout.handleResizeLeft} onReset={noop} label="Resize left panel" />}

      <main className="flex-1 flex flex-col bg-zinc-950 min-w-0 overflow-hidden relative">
        <EditorWorkspaceHeader
          leftOpen={layout.leftOpen}
          onToggleLeft={handleToggleLeft}
          activeChapterTitle={activeChapter?.title ?? t('noChapterSelected')}
          wordCount={wordCount}
          targetWords={targetWords}
          rightOpen={layout.rightOpen}
          onToggleRight={handleToggleRight}
          t={t}
        />

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

        <div className="flex-1 overflow-y-auto px-8 py-10 flex justify-center min-h-0">
          <div className="w-full max-w-2xl bg-zinc-950 focus:outline-none">
            <h1 className="text-3xl font-serif font-bold text-zinc-100 mb-6 pb-2 border-b border-zinc-800">
              {activeChapter?.title ?? t('untitled')}
            </h1>
            <FoliantEditor
              chapterId={activeChapterId}
              content={activeChapter?.content ?? ''}
              onChange={onContentChange}
              onStatusChange={onEditorStatusChange}
              indentFirstLine={appSettings.preferences?.editorIndentFirstLine}
              fontFamily={appSettings.preferences?.editorFontFamily}
              searchTerm={activeSearchTerm}
            />
          </div>
        </div>

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
      </main>

      {layout.rightOpen && <Splitter onResize={layout.handleResizeRight} onReset={noop} label="Resize right panel" />}

      <DockContainer
        side="right"
        isOpen={layout.rightOpen}
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
