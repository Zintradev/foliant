import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import App from './App';
import { ask, open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { importManuskriptProject } from './utils/importManuskript';
import { DEFAULT_PROJECT } from './data/mockProject';
import { dict } from './i18n/translations';

// Mock Tauri plugin-fs
vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  mkdir: vi.fn(),
}));

// Mock Tauri core invoke function for the jsdom testing environment
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

// Mock Tauri plugin dialog
vi.mock('@tauri-apps/plugin-dialog', () => ({
  ask: vi.fn(),
  open: vi.fn(),
  save: vi.fn(),
}));

// Mock importManuskript
vi.mock('./utils/importManuskript', () => ({
  importManuskriptProject: vi.fn(),
}));

// Mock heavy lazy views for fast and isolated App integration tests
vi.mock('./components/dock/views/TimelineView', () => ({
  default: ({ onStorylineFilterChange, onCharacterFilterChange }: any) => (
    <div data-testid="mock-timeline-view">
      <span>Timeline View Surface</span>
      <button onClick={() => onStorylineFilterChange?.('arc-1')}>Filter Storyline</button>
      <button onClick={() => onCharacterFilterChange?.('char-1')}>Filter Character</button>
    </div>
  ),
}));

vi.mock('./components/dock/views/RelationshipGraphView', () => ({
  default: ({ onAddCharacter, onUpdateRelationships, onUpdateCharacters, onUpdateJunctions }: any) => (
    <div data-testid="mock-graph-view">
      <span>Graph View Surface</span>
      <button onClick={() => onAddCharacter?.('New Hero', 'Protagonist')}>Add Graph Char</button>
      <button onClick={() => onUpdateRelationships?.([])}>Update Rel</button>
      <button onClick={() => onUpdateCharacters?.([])}>Update Chars</button>
      <button onClick={() => onUpdateJunctions?.([])}>Update Junc</button>
    </div>
  ),
}));

vi.mock('./components/context/ContextPanel', () => ({
  default: ({ onChange, onStartEditing }: any) => (
    <div data-testid="mock-context-panel">
      <span>Context Panel</span>
      <button onClick={onStartEditing}>Start Edit Context</button>
      <button onClick={() => onChange?.([])}>Update Context</button>
    </div>
  ),
}));

vi.mock('./components/settings/SettingsModal', () => ({
  default: ({ isOpen, onClose, settings, onUpdateSettings }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-settings-modal">
        <span>Studio Settings</span>
        <button onClick={onClose}>Done</button>
        <button
          onClick={() =>
            onUpdateSettings({
              ...settings,
              preferences: {
                ...(settings.preferences || {}),
                persistViewFilters: true,
              },
            })
          }
        >
          Update Settings
        </button>
      </div>
    );
  },
}));

vi.mock('./components/export/ExportSettingsModal', () => ({
  default: ({ isOpen, onClose, onExport }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-export-modal">
        <span>Export to EPUB</span>
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => onExport({ title: 'Exported Project' })}>
          Submit Export
        </button>
      </div>
    );
  },
}));

vi.mock('./components/common/UnsavedChangesModal', () => ({
  default: ({ isOpen, onCancel, onConfirm }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-unsaved-modal">
        <span>Unsaved Changes</span>
        <button onClick={onCancel}>Stay Here</button>
        <button onClick={onConfirm}>Discard & Switch</button>
      </div>
    );
  },
}));

describe('App Component', () => {
  const mockAsk = vi.mocked(ask);
  const mockImport = vi.mocked(importManuskriptProject);
  const mockOpen = vi.mocked(open);
  const mockReadTextFile = vi.mocked(readTextFile);

  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    if (!Range.prototype.getClientRects) {
      Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
    }
    if (!Range.prototype.getBoundingClientRect) {
      Range.prototype.getBoundingClientRect = () =>
        ({
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => {},
        } as DOMRect);
    }
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn();
    }
  });

  it('renders the initial workspace with brand title, editor, and docks', () => {
    render(<App />);

    // Brand title in activity bar
    expect(screen.getByText('Foliant')).toBeInTheDocument();

    // Editor should be visible by default (first scene content)
    expect(
      screen.getByText(/The crown did not fall with a clang/i)
    ).toBeInTheDocument();

    // Word count in footer
    expect(screen.getAllByText(/words/i).length).toBeGreaterThanOrEqual(1);
  });

  it('navigates across main views via ActivityBar items', async () => {
    render(<App />);

    // 1. Navigate to Outline View
    const outlineBtn = screen.getByTitle(dict.en.actOutlineTooltip);
    fireEvent.click(outlineBtn);
    expect(screen.getAllByText(/Act I: The Shattered Eclipse/i).length).toBeGreaterThanOrEqual(1);

    // 2. Navigate to Storylines View
    const storiesBtn = screen.getByTitle(dict.en.actStoriesTooltip);
    fireEvent.click(storiesBtn);
    expect(screen.getAllByText(/Storyline/i).length).toBeGreaterThanOrEqual(1);

    // 3. Navigate to Analytics / Stats View
    const statsBtn = screen.getByTitle(dict.en.actStatsTooltip);
    fireEvent.click(statsBtn);
    expect(screen.getAllByText(/Analytics/i).length).toBeGreaterThanOrEqual(1);

    // 4. Navigate to Cast / Characters View
    const castBtn = screen.getByTitle(dict.en.actCastTooltip);
    fireEvent.click(castBtn);
    expect(screen.getAllByText(/Cast/i).length).toBeGreaterThanOrEqual(1);

    // 5. Navigate to Worldbuilding View
    const worldBtn = screen.getByTitle(dict.en.actWorldTooltip);
    fireEvent.click(worldBtn);
    expect(screen.getAllByText(/World/i).length).toBeGreaterThanOrEqual(1);

    // 6. Navigate to Visual Moodboard View
    const visualsBtn = screen.getByTitle(dict.en.actVisualsTooltip);
    fireEvent.click(visualsBtn);
    expect(screen.getAllByText(/Visuals/i).length).toBeGreaterThanOrEqual(1);

    // 7. Navigate to Timeline View
    const timelineBtn = screen.getByTitle(dict.en.actTimelineTooltip);
    fireEvent.click(timelineBtn);
    expect(await screen.findByTestId('mock-timeline-view')).toBeInTheDocument();

    // 8. Navigate to Relationship Graph View
    const graphBtn = screen.getByTitle(dict.en.actGraphTooltip);
    fireEvent.click(graphBtn);
    expect(await screen.findByTestId('mock-graph-view')).toBeInTheDocument();

    // 9. Return to Editor (Write)
    const editorBtn = screen.getByTitle(dict.en.actWriteTooltip);
    fireEvent.click(editorBtn);
    expect(
      screen.getByText(/The crown did not fall with a clang/i)
    ).toBeInTheDocument();
  });

  it('toggles left, right, and bottom dock panels', () => {
    render(<App />);

    // Left Panel Toggle
    const leftPanelToggle = screen.getByTitle(dict.en.collapseLeftDock);
    fireEvent.click(leftPanelToggle);
    const expandLeftBtn = screen.getByTitle(dict.en.expandLeftDock);
    expect(expandLeftBtn).toBeInTheDocument();
    fireEvent.click(expandLeftBtn);

    // Right Panel Toggle
    const rightPanelToggle = screen.getByTitle(dict.en.collapseRightDock);
    fireEvent.click(rightPanelToggle);
    const expandRightBtn = screen.getByTitle(dict.en.expandRightDock);
    expect(expandRightBtn).toBeInTheDocument();
    fireEvent.click(expandRightBtn);

    // Bottom Panel Toggle (Timeline & Relationships footer tabs)
    const timelineButtons = screen.getAllByRole('button', { name: /Timeline/i });
    const timelineBottomTab = timelineButtons[timelineButtons.length - 1];
    fireEvent.click(timelineBottomTab);

    const relationshipButtons = screen.getAllByRole('button', { name: /Relationships/i });
    const relationshipsBottomTab = relationshipButtons[relationshipButtons.length - 1];
    fireEvent.click(relationshipsBottomTab);
  });

  it('opens and closes the Settings modal from the File Menu and updates settings', async () => {
    render(<App />);

    // Open File Menu
    const fileMenuBtn = screen.getByLabelText('File Menu');
    fireEvent.click(fileMenuBtn);

    // Click Studio Settings
    const settingsBtn = screen.getByText(dict.en.studioSettings);
    fireEvent.click(settingsBtn);

    // Settings modal should appear
    expect(await screen.findByTestId('mock-settings-modal')).toBeInTheDocument();

    // Update settings via callback
    const updateSettingsBtn = screen.getByRole('button', { name: 'Update Settings' });
    fireEvent.click(updateSettingsBtn);

    // Close settings via Done button
    const doneBtn = screen.getByRole('button', { name: 'Done' });
    fireEvent.click(doneBtn);

    expect(screen.queryByTestId('mock-settings-modal')).not.toBeInTheDocument();
  });

  it('opens and closes the Export EPUB modal from File Menu', async () => {
    render(<App />);

    // Open Hamburger / File Menu
    const fileMenuBtn = screen.getByLabelText('File Menu');
    fireEvent.click(fileMenuBtn);

    // Click Export EPUB
    const exportBtn = screen.getByText('Export to EPUB...');
    fireEvent.click(exportBtn);

    // ExportSettingsModal should appear
    expect(await screen.findByTestId('mock-export-modal')).toBeInTheDocument();

    // Trigger export
    const submitExportBtn = screen.getByRole('button', { name: 'Submit Export' });
    act(() => {
      fireEvent.click(submitExportBtn);
    });

    // Close via Cancel
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    expect(screen.queryByTestId('mock-export-modal')).not.toBeInTheDocument();
  });

  it('handles New Project action with confirmation', async () => {
    render(<App />);

    const fileMenuBtn = screen.getByLabelText('File Menu');
    fireEvent.click(fileMenuBtn);

    // 1. Rejected confirmation
    mockAsk.mockResolvedValueOnce(false);
    const newProjectBtn = screen.getByText(dict.en.newProject);
    fireEvent.click(newProjectBtn);
    expect(mockAsk).toHaveBeenCalled();

    // 2. Accepted confirmation
    fireEvent.click(fileMenuBtn);
    mockAsk.mockResolvedValueOnce(true);
    const newProjectBtn2 = screen.getByText(dict.en.newProject);
    fireEvent.click(newProjectBtn2);

    await waitFor(() => {
      expect(mockAsk).toHaveBeenCalledTimes(2);
    });
  });

  it('handles Manuskript project import success and error flows', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    const fileMenuBtn = screen.getByLabelText('File Menu');
    fireEvent.click(fileMenuBtn);

    // 1. Successful import
    mockImport.mockResolvedValueOnce({
      project: {
        ...DEFAULT_PROJECT,
        title: 'Imported Fantasy Novel',
      },
      bundlePath: '/path/to/project',
    });

    const importBtn = screen.getByText('Import Manuskript Project...');
    await act(async () => {
      fireEvent.click(importBtn);
    });

    expect(await screen.findByText(dict.en.importSuccessTitle)).toBeInTheDocument();

    // Accept import modal
    const acceptBtn = screen.getByRole('button', { name: /accept/i });
    fireEvent.click(acceptBtn);
    expect(screen.queryByText(dict.en.importSuccessTitle)).not.toBeInTheDocument();

    // 2. Failed import
    fireEvent.click(fileMenuBtn);
    mockImport.mockRejectedValueOnce(new Error('Corrupted .msk project file'));
    const importBtn2 = screen.getByText('Import Manuskript Project...');
    await act(async () => {
      fireEvent.click(importBtn2);
    });

    expect(await screen.findByText(/Corrupted .msk project file/i)).toBeInTheDocument();
    const dismissBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(dismissBtn);
    expect(screen.queryByText(/Corrupted .msk project file/i)).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('handles global keyboard shortcuts (Ctrl+S, Ctrl+Shift+S)', () => {
    render(<App />);

    // Ctrl+S (Save)
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });

    // Ctrl+Shift+S (Save As)
    fireEvent.keyDown(window, { key: 'S', ctrlKey: true, shiftKey: true });
  });

  it('switches to search tab when clicking Search in ActivityBar', () => {
    render(<App />);

    const searchNavBtns = screen.getAllByTitle('Search...');
    expect(searchNavBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(searchNavBtns[0]);
  });

  it('handles bottom dock panel controls: maximize, collapse header button, footer toggle, and splitter drag', () => {
    render(<App />);

    // 1. Open bottom dock via footer Timeline tab
    const timelineButtons = screen.getAllByRole('button', { name: /Timeline/i });
    fireEvent.click(timelineButtons[timelineButtons.length - 1]);

    // 2. Drag bottom splitter
    const bottomSplitter = screen.getByTitle('Drag to resize bottom panel');
    fireEvent.mouseDown(bottomSplitter);

    // 3. Maximize bottom panel into fullscreen view
    const maximizeBtn = screen.getByTitle(dict.en.openFullscreen);
    fireEvent.click(maximizeBtn);

    // Return to Editor view
    fireEvent.click(screen.getByTitle(dict.en.actWriteTooltip));

    // Re-open bottom panel
    const timelineButtons2 = screen.getAllByRole('button', { name: /Timeline/i });
    fireEvent.click(timelineButtons2[timelineButtons2.length - 1]);

    // 4. Collapse bottom panel via header button
    const collapseButtons = screen.getAllByTitle(dict.en.collapsePanel);
    fireEvent.click(collapseButtons[0]);

    // 5. Expand bottom panel via footer toggle chevron
    const footerButtons = screen.getAllByRole('button');
    const chevronBtn = footerButtons.find((btn) =>
      btn.querySelector('.lucide-chevron-up, .lucide-chevron-down')
    );
    if (chevronBtn) fireEvent.click(chevronBtn);
  });

  it('handles left and right dock splitters mouse drag resizing', () => {
    render(<App />);

    // Left splitter
    const leftSplitter = screen.getByLabelText('Resize left panel');
    fireEvent.mouseDown(leftSplitter, { clientX: 250 });
    fireEvent.mouseMove(window, { clientX: 320 });
    fireEvent.mouseUp(window);

    // Right splitter
    const rightSplitter = screen.getByLabelText('Resize right panel');
    fireEvent.mouseDown(rightSplitter, { clientX: 750 });
    fireEvent.mouseMove(window, { clientX: 680 });
    fireEvent.mouseUp(window);
  });

  it('searches project and navigates directly to matching scene result', () => {
    render(<App />);

    // Open search tab
    const searchNavBtns = screen.getAllByTitle('Search...');
    fireEvent.click(searchNavBtns[0]);

    // Type query into search input
    const searchInput = screen.getByPlaceholderText(/Search project/i);
    fireEvent.change(searchInput, { target: { value: 'crown' } });

    // Click first matching search result item
    const results = screen.getAllByText(/crown/i);
    expect(results.length).toBeGreaterThan(0);
    fireEvent.click(results[0]);

    // Navigated back to write view and active scene is selected
    expect(screen.getByText(/The crown did not fall with a clang/i)).toBeInTheDocument();
  });

  it('updates target word count in Analytics / Stats view', () => {
    render(<App />);

    // Navigate to Analytics view
    const statsBtn = screen.getByTitle(dict.en.actStatsTooltip);
    fireEvent.click(statsBtn);

    // Find and update target word count input
    const targetInput = screen.getByTitle('Edit Global Word Goal directly');
    fireEvent.change(targetInput, { target: { value: '95000' } });

    // Return to Write view
    fireEvent.click(screen.getByTitle(dict.en.actWriteTooltip));
  });

  it('guards navigation when unsaved changes exist in outline rename', () => {
    render(<App />);

    // 1. Right click on chapter in outline to trigger rename
    const chapterNode = screen.getAllByText(/The Shattered Eclipse/i)[0];
    fireEvent.contextMenu(chapterNode);

    // Context menu should appear with Rename option
    const renameOption = screen.getByText('Rename');
    fireEvent.click(renameOption);

    // Now renamingNodeId is active -> isDirty is true!
    // 2. Try navigating to Characters in ActivityBar
    const castBtn = screen.getByTitle(dict.en.actCastTooltip);
    fireEvent.click(castBtn);

    // UnsavedChangesModal should appear
    expect(screen.getByText(dict.en.unsavedChangesTitle)).toBeInTheDocument();

    // 3. User clicks "Keep Editing" (Cancel)
    const keepEditingBtn = screen.getByText(dict.en.keepEditing);
    fireEvent.click(keepEditingBtn);
    expect(screen.queryByText(dict.en.unsavedChangesTitle)).not.toBeInTheDocument();

    // 4. Try navigating again and click "Discard & Switch" (Confirm)
    fireEvent.click(castBtn);
    expect(screen.getByText(dict.en.unsavedChangesTitle)).toBeInTheDocument();
    const discardBtn = screen.getByText(dict.en.discardAndSwitch);
    fireEvent.click(discardBtn);

    // Navigated to Cast view
    expect(screen.queryByText(dict.en.unsavedChangesTitle)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Cast/i).length).toBeGreaterThanOrEqual(1);
  });

  it('triggers File Menu Open Project and Save As options', () => {
    render(<App />);

    const fileMenuBtn = screen.getByLabelText('File Menu');
    fireEvent.click(fileMenuBtn);

    // Open Project
    const openBtn = screen.getByText(/Open Project\.\.\./i);
    fireEvent.click(openBtn);

    // Save As
    fireEvent.click(fileMenuBtn);
    const saveAsBtn = screen.getByText(/Save As\.\.\./i);
    fireEvent.click(saveAsBtn);
  });

  it('handles timeline filters with persistViewFilters enabled and graph mutations', async () => {
    render(<App />);

    // 1. Enable persistViewFilters via Settings
    const fileMenuBtn = screen.getByLabelText('File Menu');
    fireEvent.click(fileMenuBtn);
    const settingsBtn = screen.getByText(dict.en.studioSettings);
    fireEvent.click(settingsBtn);

    const updateBtn = await screen.findByRole('button', { name: 'Update Settings' });
    fireEvent.click(updateBtn);
    const doneBtn = screen.getByRole('button', { name: 'Done' });
    fireEvent.click(doneBtn);

    // 2. Navigate to Timeline and trigger filter callbacks
    const timelineBtn = screen.getByTitle(dict.en.actTimelineTooltip);
    fireEvent.click(timelineBtn);

    expect(await screen.findByTestId('mock-timeline-view')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Filter Storyline' }));
    fireEvent.click(screen.getByRole('button', { name: 'Filter Character' }));

    // 3. Navigate to Relationships Graph and trigger mutation callbacks
    const graphBtn = screen.getByTitle(dict.en.actGraphTooltip);
    fireEvent.click(graphBtn);

    expect(await screen.findByTestId('mock-graph-view')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add Graph Char' }));
    fireEvent.click(screen.getByRole('button', { name: 'Update Rel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Update Chars' }));
    fireEvent.click(screen.getByRole('button', { name: 'Update Junc' }));
  });

  it('handles outline new scene addition via context menu and new project error fallback', async () => {
    render(<App />);

    // 1. Outline Context Menu -> New Scene
    const chapterNode = screen.getAllByText(/The Shattered Eclipse/i)[0];
    fireEvent.contextMenu(chapterNode);

    const newSceneOptions = screen.getAllByText(dict.en.newScene || 'New Scene');
    fireEvent.click(newSceneOptions[newSceneOptions.length - 1]);

    // 2. New project fallback when Tauri ask fails with exception
    mockAsk.mockRejectedValueOnce(new Error('Tauri IPC failed'));
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

    const fileMenuBtn = screen.getByLabelText('File Menu');
    fireEvent.click(fileMenuBtn);

    const newProjectBtn = screen.getByText(dict.en.newProject);
    await act(async () => {
      fireEvent.click(newProjectBtn);
    });

    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('covers dock close buttons, splitter double-click noop, and auto-save timer effect', async () => {
    vi.useFakeTimers();

    render(<App />);

    // 1. Double click splitter (triggers onReset -> noop)
    const leftSplitter = screen.getByLabelText('Resize left panel');
    fireEvent.doubleClick(leftSplitter);

    // 2. Close docks via dock container collapse buttons
    const dockCollapseBtns = screen.getAllByLabelText('Collapse Panel');
    if (dockCollapseBtns.length > 0) {
      fireEvent.click(dockCollapseBtns[0]); // handleCloseLeft
    }
    const dockCollapseBtnsAfter = screen.getAllByLabelText('Collapse Panel');
    if (dockCollapseBtnsAfter.length > 0) {
      fireEvent.click(dockCollapseBtnsAfter[0]); // handleCloseRight
    }

    // 3. Trigger auto-save debounce
    act(() => {
      vi.advanceTimersByTime(700);
    });
    vi.useRealTimers();
  });

  it('handles outline chapter selection, rename commit, and chapter deletion', async () => {
    render(<App />);

    // 1. Select a chapter in Outline
    const chapterRows = screen.getAllByText(/The Shattered Eclipse/i);
    fireEvent.click(chapterRows[0]);

    // 2. Commit Rename in Outline
    fireEvent.contextMenu(chapterRows[0]);
    const renameOption = screen.getByText('Rename');
    fireEvent.click(renameOption);

    const renameInput = screen.getByDisplayValue(/The Shattered Eclipse/i);
    fireEvent.change(renameInput, { target: { value: 'Renamed Act' } });
    fireEvent.keyDown(renameInput, { key: 'Enter' });

    // 3. Delete Chapter in Outline
    const secondChapterNode = screen.getAllByText(/Renamed Act/i)[0];
    fireEvent.contextMenu(secondChapterNode);
    const deleteOption = screen.queryByText(/Delete/i);
    if (deleteOption) {
      fireEvent.click(deleteOption);
    }
  });

  it('handles right dock tabs: ContextPanel (editing & change) and CharactersView', async () => {
    render(<App />);

    // Switch to Notes (ContextPanel) in right dock
    const notesTabs = screen.getAllByRole('button', { name: /^notes$/i });
    fireEvent.click(notesTabs[0]);

    // Verify ContextPanel is mounted and trigger callbacks
    expect(screen.getByTestId('mock-context-panel')).toBeInTheDocument();
    const startEditBtn = screen.getByText('Start Edit Context');
    fireEvent.click(startEditBtn);

    const updateContextBtn = screen.getByText('Update Context');
    fireEvent.click(updateContextBtn);

    // Switch to Cast (CharactersView) in right dock
    const castTabs = screen.getAllByRole('button', { name: /^cast$/i });
    if (castTabs.length > 0) {
      fireEvent.click(castTabs[0]);
    }
  });

  it('handles persistence error banner display and dismissal', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    // Mock open dialog and readTextFile failure for readProjectBundle
    mockOpen.mockResolvedValueOnce('/mock/error/dir');
    mockReadTextFile.mockRejectedValueOnce(new Error('EACCES: Permission denied'));

    const fileMenuBtn = screen.getByLabelText('File Menu');
    fireEvent.click(fileMenuBtn);

    const openProjectBtn = screen.getByText(dict.en.openProject || 'Open Project...');
    await act(async () => {
      fireEvent.click(openProjectBtn);
    });

    // Check that error banner rendered
    expect(await screen.findByText(/Permission denied/i)).toBeInTheDocument();

    // Dismiss banner
    const dismissBtn = screen.getByRole('button', { name: dict.en.dismiss || 'Dismiss' });
    fireEvent.click(dismissBtn);

    expect(screen.queryByText(/Permission denied/i)).not.toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('handles bottom dock maximize fullscreen and tab switcher', async () => {
    render(<App />);

    // Open bottom dock via footer timeline button
    const footerTimelineBtns = screen.getAllByRole('button', { name: /Timeline/i });
    fireEvent.click(footerTimelineBtns[footerTimelineBtns.length - 1]);

    // Switch tab inside bottom header
    const relBtns = screen.getAllByRole('button', { name: /Relationships/i });
    if (relBtns.length > 0) {
      fireEvent.click(relBtns[0]);
    }

    // Maximize bottom panel into fullscreen main view
    const maximizeBtn = screen.getByTitle(dict.en.openFullscreen || 'Open Fullscreen');
    fireEvent.click(maximizeBtn);

    // Return to Write view
    const writeBtn = screen.getByTitle(dict.en.actWriteTooltip);
    fireEvent.click(writeBtn);
  });

  it('dismisses splash screen with fade-out class and removes it on mount', async () => {
    vi.useFakeTimers();
    const splash = document.createElement('div');
    splash.id = 'foliant-splash';
    document.body.appendChild(splash);

    render(<App />);

    expect(splash.classList.contains('splash-hidden')).toBe(true);
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(document.getElementById('foliant-splash')).toBeNull();
    vi.useRealTimers();
  });
});
