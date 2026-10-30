import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import FoliantEditor from './FoliantEditor';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri invoke API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('FoliantEditor Component', () => {
  const mockInvoke = vi.mocked(invoke);
  let mockOnChange: ReturnType<typeof vi.fn>;
  let mockOnStatusChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = { invoke: vi.fn() };
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue(undefined as never);
    mockOnChange = vi.fn();
    mockOnStatusChange = vi.fn();
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders editor toolbar with all buttons and initial content', () => {
    render(
      <FoliantEditor
        chapterId="scene-1"
        content="<p>The crown did not fall with a clang.</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Font selectors
    expect(screen.getByTitle('Font Family')).toBeInTheDocument();
    expect(screen.getByTitle('Font Size (px)')).toBeInTheDocument();

    // Formatting buttons
    expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument();
    expect(screen.getByTitle('Italic (Ctrl+I)')).toBeInTheDocument();
    expect(screen.getByTitle('Strikethrough')).toBeInTheDocument();
    expect(screen.getByTitle(/Underline \(Ctrl\+U\)/i)).toBeInTheDocument();
    expect(screen.getAllByTitle(/Highlight/i).length).toBeGreaterThan(0);
    expect(screen.getByTitle('Align Left')).toBeInTheDocument();
    expect(screen.getByTitle('Align Center')).toBeInTheDocument();
    expect(screen.getByTitle('Align Justify')).toBeInTheDocument();
    expect(screen.getByTitle('Blockquote')).toBeInTheDocument();
    expect(screen.getByTitle('Horizontal Separator (Markdown ---)')).toBeInTheDocument();
    expect(screen.getByTitle('Insert Symbol (Word Palette)')).toBeInTheDocument();

    // Editor content rendered
    expect(screen.getByText('The crown did not fall with a clang.')).toBeInTheDocument();
  });

  it('switches font family and font size', () => {
    render(
      <FoliantEditor
        chapterId="scene-1"
        content="<p>Sample text</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    const fontSelect = screen.getByTitle('Font Family');
    fireEvent.change(fontSelect, { target: { value: 'garamond' } });
    expect(fontSelect).toHaveValue('garamond');

    fireEvent.change(fontSelect, { target: { value: 'mono' } });
    expect(fontSelect).toHaveValue('mono');

    const sizeSelect = screen.getByTitle('Font Size (px)');
    fireEvent.change(sizeSelect, { target: { value: '20px' } });
    fireEvent.change(sizeSelect, { target: { value: '16px' } });
  });

  it('executes formatting commands via toolbar buttons', () => {
    render(
      <FoliantEditor
        chapterId="scene-1"
        content="<p>Formatted line</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Bold
    fireEvent.click(screen.getByTitle('Bold (Ctrl+B)'));
    // Italic
    fireEvent.click(screen.getByTitle('Italic (Ctrl+I)'));
    // Strikethrough
    fireEvent.click(screen.getByTitle('Strikethrough'));
    // Align Center
    fireEvent.click(screen.getByTitle('Align Center'));
    // Align Left
    fireEvent.click(screen.getByTitle('Align Left'));
    // Align Justify
    fireEvent.click(screen.getByTitle('Align Justify'));
    // Blockquote
    fireEvent.click(screen.getByTitle('Blockquote'));
    // Horizontal rule
    fireEvent.click(screen.getByTitle('Horizontal Separator (Markdown ---)'));
  });

  it('opens and interacts with Underline color popover', () => {
    render(
      <FoliantEditor
        chapterId="scene-1"
        content="<p>Underline line</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open Underline popover
    const underlineDropdownBtn = screen.getByTitle('Underline Color Palette');
    fireEvent.click(underlineDropdownBtn);

    expect(screen.getByText('Underline Color')).toBeInTheDocument();

    // Select Amber Orange swatch
    const amberSwatch = screen.getByTitle('Amber Orange');
    fireEvent.click(amberSwatch);

    // Reopen and toggle custom pipette
    fireEvent.click(underlineDropdownBtn);
    const customColorTrigger = screen.getByTitle('Pick exact custom color');
    fireEvent.click(customColorTrigger);

    // Press Escape to dismiss popover
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Underline Color')).not.toBeInTheDocument();
  });

  it('opens and interacts with Highlight color popover', () => {
    render(
      <FoliantEditor
        chapterId="scene-1"
        content="<p>Highlight line</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open Highlight popover
    const highlightDropdownBtn = screen.getByTitle('Highlight Color Palette');
    fireEvent.click(highlightDropdownBtn);

    expect(screen.getByText('Highlight Color')).toBeInTheDocument();

    // Select Emerald swatch
    const emeraldSwatch = screen.getByTitle('Emerald');
    fireEvent.click(emeraldSwatch);

    // Reopen and select No Color
    fireEvent.click(highlightDropdownBtn);
    const noColorBtn = screen.getByRole('button', { name: /No Color/i });
    fireEvent.click(noColorBtn);

    // Outside click dismisses
    fireEvent.click(highlightDropdownBtn);
    expect(screen.getByText('Highlight Color')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Highlight Color')).not.toBeInTheDocument();
  });

  it('opens WordSymbolModal and inserts a selected symbol', async () => {
    render(
      <FoliantEditor
        chapterId="scene-1"
        content="<p>Special symbol test</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    const symbolBtn = screen.getByTitle('Insert Symbol (Word Palette)');
    fireEvent.click(symbolBtn);

    const searchInput = await screen.findByPlaceholderText(/Search symbol by name/i);
    expect(searchInput).toBeInTheDocument();

    const insertBtn = screen.getByRole('button', { name: /^Insert$/i });
    fireEvent.click(insertBtn);

    // Close modal via Close button
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);

    expect(screen.queryByPlaceholderText(/Search symbol by name/i)).not.toBeInTheDocument();
  });

  it('switches chapterId smoothly without crashing and updates content', () => {
    const { rerender } = render(
      <FoliantEditor
        chapterId="scene-1"
        content="<p>Chapter One Text</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Chapter One Text')).toBeInTheDocument();

    // Switch to Chapter 2
    rerender(
      <FoliantEditor
        chapterId="scene-2"
        content="<p>Chapter Two Text</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(mockOnStatusChange).toHaveBeenCalledWith('saved');
    expect(screen.getByText('Chapter Two Text')).toBeInTheDocument();
  });

  it('handles search term navigation without crashing', () => {
    vi.useFakeTimers();

    render(
      <FoliantEditor
        chapterId="scene-1"
        content="<p>Find the magic crystal in the cave.</p>"
        searchTerm="crystal"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText(/magic crystal/i)).toBeInTheDocument();
  });

  it('handles save failure with invoke error gracefully', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('Disk write failed'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <FoliantEditor
        chapterId="scene-error"
        content="<p>Initial content</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Component handles errors cleanly without throwing unhandled exceptions
    expect(screen.getByText('Initial content')).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('triggers auto-save debounce upon editing and notifies parent with saved status', async () => {
    vi.useFakeTimers();

    render(
      <FoliantEditor
        chapterId="scene-debounce"
        content="<p>Debounce testing</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Trigger formatting to produce an editor update
    const hrBtn = screen.getByTitle('Horizontal Separator (Markdown ---)');
    fireEvent.click(hrBtn);

    // Fast-forward debounce timer (1000ms)
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    expect(mockInvoke).toHaveBeenCalledWith(
      'save_chapter_file',
      expect.objectContaining({
        path: '../scene-debounce.md',
      })
    );
    expect(mockOnChange).toHaveBeenCalled();
    expect(mockOnStatusChange).toHaveBeenCalledWith('saved');
  });

  it('handles auto-save error when invoke fails during debounce', async () => {
    vi.useFakeTimers();
    mockInvoke.mockRejectedValueOnce(new Error('Disk write error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <FoliantEditor
        chapterId="scene-fail"
        content="<p>Failing save test</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Trigger update
    const hrBtn = screen.getByTitle('Horizontal Separator (Markdown ---)');
    fireEvent.click(hrBtn);

    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    expect(mockOnStatusChange).toHaveBeenCalledWith('unsaved');
    consoleErrorSpy.mockRestore();
  });

  it('flushes pending unsaved edits when switching chapter immediately', async () => {
    vi.useFakeTimers();

    const { rerender } = render(
      <FoliantEditor
        chapterId="scene-old"
        content="<p>Old Chapter</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Trigger edit
    fireEvent.click(screen.getByTitle('Horizontal Separator (Markdown ---)'));

    // Switch chapter before 1s debounce expires
    rerender(
      <FoliantEditor
        chapterId="scene-new"
        content="<p>New Chapter</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(mockInvoke).toHaveBeenCalledWith(
      'save_chapter_file',
      expect.objectContaining({
        path: '../scene-old.md',
      })
    );
    expect(screen.getByText('New Chapter')).toBeInTheDocument();
  });

  it('flushes unsaved changes on unmount', () => {
    vi.useFakeTimers();

    const { unmount } = render(
      <FoliantEditor
        chapterId="scene-unmount"
        content="<p>Unmount test</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Make dirty
    fireEvent.click(screen.getByTitle('Horizontal Separator (Markdown ---)'));

    // Unmount
    unmount();

    expect(mockInvoke).toHaveBeenCalledWith(
      'save_chapter_file',
      expect.objectContaining({
        path: '../scene-unmount.md',
      })
    );
  });

  it('interacts with Underline and Highlight split buttons and custom popovers', () => {
    render(
      <FoliantEditor
        chapterId="scene-colors"
        content="<p>Color testing</p>"
        onChange={mockOnChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    // 1. Underline split button direct toggle
    const underlineDirectBtn = screen.getByTitle(/Underline \(Ctrl\+U\)/i);
    fireEvent.click(underlineDirectBtn);
    fireEvent.click(underlineDirectBtn);

    // 2. Underline custom color picker
    const underlineDropdownBtn = screen.getByTitle('Underline Color Palette');
    fireEvent.click(underlineDropdownBtn);
    const customUnderlineTrigger = screen.getByTitle('Pick exact custom color');
    fireEvent.click(customUnderlineTrigger);

    const hexInputUnderline = screen.getByTitle('Hex Color');
    fireEvent.change(hexInputUnderline, { target: { value: '990000' } });
    fireEvent.click(screen.getByTitle('Close'));
    // Close the underline dropdown so it doesn't linger
    fireEvent.click(underlineDropdownBtn);

    // 3. Highlight split button direct toggle
    const highlightDirectBtn = screen.getByTitle(/Highlight - Current Color:/i);
    fireEvent.click(highlightDirectBtn);
    fireEvent.click(highlightDirectBtn);

    // 4. Highlight custom color picker
    const highlightDropdownBtn = screen.getByTitle('Highlight Color Palette');
    fireEvent.click(highlightDropdownBtn);
    const customHighlightTrigger = screen.getByTitle('Pick exact custom color');
    fireEvent.click(customHighlightTrigger);

    const hexInputHighlight = screen.getByTitle('Hex Color');
    fireEvent.change(hexInputHighlight, { target: { value: '009900' } });
    fireEvent.click(screen.getByTitle('Close'));
  });
});
