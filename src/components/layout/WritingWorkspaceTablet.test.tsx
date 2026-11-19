import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WritingWorkspace } from './WritingWorkspace';
import { EditorWorkspaceHeader } from './EditorWorkspaceHeader';
import { DEFAULT_PROJECT } from '../../data/getMockProject';

vi.mock('../../utils/platform', () => ({
  isTauriApp: () => false,
  isWebPlatform: () => true,
  closeDesktopApp: vi.fn(),
}));

vi.mock('../editor/FoliantEditor', () => ({
  default: () => <div data-testid="mock-foliant-editor">Mock Foliant Editor</div>,
}));

vi.mock('../dock/DockContainer', () => ({
  default: ({ side, isOpen, className }: any) =>
    isOpen ? (
      <aside data-testid={`dock-container-${side}`} className={className}>
        Dock {side}
      </aside>
    ) : null,
  TAB_TRANSLATION_KEYS: {},
  TAB_META: {},
  ALL_TAB_IDS: [],
}));

describe('Tablet Responsive UI (WritingWorkspace and Header)', () => {
  const createMockProps = (overrides = {}) => {
    const mockSetLeftOpen = vi.fn();
    const mockSetRightOpen = vi.fn();
    const mockSetIsBottomOpen = vi.fn();

    const layout: any = {
      leftOpen: true,
      setLeftOpen: mockSetLeftOpen,
      rightOpen: true,
      setRightOpen: mockSetRightOpen,
      isBottomOpen: false,
      setIsBottomOpen: mockSetIsBottomOpen,
      leftTabs: ['outline'],
      rightTabs: ['inspector'],
      bottomTabs: ['timeline'],
      activeLeftTab: 'outline',
      activeRightTab: 'inspector',
      activeBottomTab: 'timeline',
      leftWidth: 270,
      rightWidth: 310,
      bottomHeight: 230,
      handleResizeLeft: vi.fn(),
      handleResizeRight: vi.fn(),
      handleBottomSplitterMouseDown: vi.fn(),
      handleSelectLeftTab: vi.fn(),
      handleSelectRightTab: vi.fn(),
      handleDockTab: vi.fn(),
      handleRemoveTab: vi.fn(),
    };

    const nav: any = {
      handleOpenTimelineBottom: vi.fn(),
      handleOpenRelationshipsBottom: vi.fn(),
      handleMaximizeBottom: vi.fn(),
    };

    return {
      isVisible: true,
      layout,
      nav,
      renderDockView: () => <div>View</div>,
      activeChapter: DEFAULT_PROJECT.chapters[0],
      activeChapterId: DEFAULT_PROJECT.chapters[0].id,
      targetWords: 50000,
      wordCount: 1200,
      persistenceError: null,
      onClearPersistenceError: vi.fn(),
      onContentChange: vi.fn(),
      onEditorStatusChange: vi.fn(),
      appSettings: { preferences: { themeMode: 'dark', editorFontFamily: 'serif' } } as any,
      activeSearchTerm: null,
      editorSaveStatus: 'saved' as const,
      isDirty: false,
      currentLanguage: 'es' as const,
      t: (key: string, fallback?: string) => fallback || key,
      ...overrides,
    };
  };

  it('renders tablet slide-over drawer backdrops and closes docks when clicking on them', () => {
    const props = createMockProps();
    render(<WritingWorkspace {...props} />);

    // Left and right backdrops must be present when both are open
    const leftBackdrop = screen.getByTestId('left-dock-backdrop');
    const rightBackdrop = screen.getByTestId('right-dock-backdrop');
    expect(leftBackdrop).toBeInTheDocument();
    expect(rightBackdrop).toBeInTheDocument();

    // Clicking left backdrop closes left dock
    fireEvent.click(leftBackdrop);
    expect(props.layout.setLeftOpen).toHaveBeenCalledWith(false);

    // Clicking right backdrop closes right dock
    fireEvent.click(rightBackdrop);
    expect(props.layout.setRightOpen).toHaveBeenCalledWith(false);
  });

  it('assigns responsive slide-over drawer classes to side dock containers', () => {
    const props = createMockProps();
    render(<WritingWorkspace {...props} />);

    const leftContainer = screen.getByTestId('dock-container-left');
    const rightContainer = screen.getByTestId('dock-container-right');

    expect(leftContainer.className).toContain('tablet-drawer-left');
    expect(rightContainer.className).toContain('tablet-drawer-right');
  });

  it('provides accessible touch-manipulation toggle buttons with visual active states in EditorWorkspaceHeader', () => {
    const onToggleLeft = vi.fn();
    const onToggleRight = vi.fn();

    const { rerender } = render(
      <EditorWorkspaceHeader
        leftOpen={false}
        onToggleLeft={onToggleLeft}
        activeChapterTitle="Chapter 1"
        wordCount={500}
        targetWords={10000}
        rightOpen={false}
        onToggleRight={onToggleRight}
        t={(k: any, fallback?: string) => fallback || k}
      />
    );

    const leftBtn = screen.getByLabelText('expandLeftDock');
    const rightBtn = screen.getByLabelText('expandRightDock');

    expect(leftBtn).toHaveClass('touch-manipulation');
    expect(rightBtn).toHaveClass('touch-manipulation');

    fireEvent.click(leftBtn);
    expect(onToggleLeft).toHaveBeenCalledTimes(1);

    fireEvent.click(rightBtn);
    expect(onToggleRight).toHaveBeenCalledTimes(1);

    // Re-render with docks open to verify active visual feedback class
    rerender(
      <EditorWorkspaceHeader
        leftOpen={true}
        onToggleLeft={onToggleLeft}
        activeChapterTitle="Chapter 1"
        wordCount={500}
        targetWords={10000}
        rightOpen={true}
        onToggleRight={onToggleRight}
        t={(k: any, fallback?: string) => fallback || k}
      />
    );

    const openLeftBtn = screen.getByLabelText('collapseLeftDock');
    const openRightBtn = screen.getByLabelText('collapseRightDock');

    expect(openLeftBtn.className).toContain('text-emerald-400');
    expect(openRightBtn.className).toContain('text-emerald-400');
  });
});
