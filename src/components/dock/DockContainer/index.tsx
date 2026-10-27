import { useState, useRef, memo } from 'react';
import { useTranslation } from '../../../i18n/translations';
import HorizontalSplitter from '../HorizontalSplitter';
import { DockContainerProps } from './types';
import { useDockSplit } from './useDockSplit';
import { useDockDragAndDrop } from './useDockDragAndDrop';
import DockStripTabBar from './DockStripTabBar';
import DockEmptyStrip from './DockEmptyStrip';
import DockModulePickerModal from './DockModulePickerModal';
import DockDragPreview from './DockDragPreview';

export function DockContainerComponent({
  side,
  isOpen,
  onToggleOpen,
  tabs,
  activeTab,
  onSelectTab,
  onDockTab,
  renderView,
  width,
  onRemoveTab,
  isDirty = false,
  language = 'en',
  onRequestTabChange,
}: DockContainerProps) {
  const { t } = useTranslation(language);
  const containerRef = useRef<HTMLElement | null>(null);
  const topMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const bottomMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Subdivided Dual-Strip State
  const {
    isSplit,
    splitRatio,
    setSplitTabIds,
    setActiveTopTab,
    setActiveBottomTab,
    topTabs,
    bottomTabs,
    currentTopTab,
    currentBottomTab,
    toggleSplit,
    handleHorizontalResize,
    handleHorizontalReset,
  } = useDockSplit({ tabs, activeTab, containerRef });

  // Module Picker State
  const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false);
  const [moduleMenuStrip, setModuleMenuStrip] = useState<'top' | 'bottom'>('top');

  // Pointer-Driven Tab Drag & Drop System
  const { dragState, handlePointerDown } = useDockDragAndDrop({
    side,
    isSplit,
    currentTopTab,
    currentBottomTab,
    isDirty,
    onSelectTab,
    onDockTab,
    onRequestTabChange,
    setSplitTabIds,
    setActiveTopTab,
    setActiveBottomTab,
  });

  const handleOpenModuleMenu = (strip: 'top' | 'bottom') => {
    setModuleMenuStrip(strip);
    setIsModuleMenuOpen(!isModuleMenuOpen || moduleMenuStrip !== strip);
  };

  if (!isOpen) return null;

  return (
    <>
      <aside
        ref={containerRef}
        data-dock-side={side}
        style={width ? { width: `${width}px` } : undefined}
        className={`shrink-0 border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden transition-[width] duration-75 select-none relative ${
          side === 'left' ? 'border-r' : 'border-l'
        } data-[drag-over=true]:bg-zinc-900/95`}
      >
        {!isSplit ? (
          /* ================= SINGLE FULL STRIP MODE ================= */
          <div className="flex flex-col h-full w-full overflow-hidden" data-dock-strip="top">
            <DockStripTabBar
              strip="top"
              side={side}
              stripTabs={topTabs}
              activeStripTab={currentTopTab}
              dragState={dragState}
              isSplit={isSplit}
              menuButtonRef={topMenuButtonRef}
              onPointerDownTab={handlePointerDown}
              onToggleSplit={toggleSplit}
              onOpenModuleMenu={handleOpenModuleMenu}
              onToggleOpen={onToggleOpen}
            />
            <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950">
              {currentTopTab ? renderView(currentTopTab) : <DockEmptyStrip type="single" />}
            </div>
          </div>
        ) : (
          /* ================= DUAL SUBDIVIDED STRIPS MODE ================= */
          <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Top Strip */}
            <div
              data-dock-strip="top"
              style={{ height: `${splitRatio * 100}%` }}
              className="flex flex-col overflow-hidden min-h-[100px]"
            >
              <DockStripTabBar
                strip="top"
                side={side}
                stripTabs={topTabs}
                activeStripTab={currentTopTab}
                dragState={dragState}
                isSplit={isSplit}
                menuButtonRef={topMenuButtonRef}
                onPointerDownTab={handlePointerDown}
                onToggleSplit={toggleSplit}
                onOpenModuleMenu={handleOpenModuleMenu}
                onToggleOpen={onToggleOpen}
              />
              <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950">
                {currentTopTab ? renderView(currentTopTab) : <DockEmptyStrip type="top" />}
              </div>
            </div>

            {/* Horizontal Splitter Handle */}
            <HorizontalSplitter
              onResize={handleHorizontalResize}
              onReset={handleHorizontalReset}
              label={t('resizeStrips', 'Resize panel strips')}
            />

            {/* Bottom Strip */}
            <div
              data-dock-strip="bottom"
              className="flex-1 flex flex-col overflow-hidden min-h-[100px]"
            >
              <DockStripTabBar
                strip="bottom"
                side={side}
                stripTabs={bottomTabs}
                activeStripTab={currentBottomTab}
                dragState={dragState}
                isSplit={isSplit}
                menuButtonRef={bottomMenuButtonRef}
                onPointerDownTab={handlePointerDown}
                onToggleSplit={toggleSplit}
                onOpenModuleMenu={handleOpenModuleMenu}
                onToggleOpen={onToggleOpen}
              />
              <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950">
                {currentBottomTab ? renderView(currentBottomTab) : <DockEmptyStrip type="bottom" />}
              </div>
            </div>
          </div>
        )}

        {/* Portal Module Toggle Picker */}
        <DockModulePickerModal
          isOpen={isModuleMenuOpen}
          side={side}
          moduleMenuStrip={moduleMenuStrip}
          buttonRef={moduleMenuStrip === 'bottom' ? bottomMenuButtonRef : topMenuButtonRef}
          tabs={tabs}
          topTabs={topTabs}
          bottomTabs={bottomTabs}
          isSplit={isSplit}
          isDirty={isDirty}
          onClose={() => setIsModuleMenuOpen(false)}
          onRequestTabChange={onRequestTabChange}
          onRemoveTab={onRemoveTab}
          onDockTab={onDockTab}
          setSplitTabIds={setSplitTabIds}
          setActiveTopTab={setActiveTopTab}
          setActiveBottomTab={setActiveBottomTab}
        />
      </aside>

      {/* Floating Drag Preview Pill */}
      <DockDragPreview dragState={dragState} />
    </>
  );
}

export default memo(DockContainerComponent);
