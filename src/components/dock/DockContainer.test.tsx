import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import DockContainer from './DockContainer';

describe('DockContainer Dirty Guard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prompts window.confirm when switching tabs if isDirty is true', () => {
    const onSelectTab = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <DockContainer
        side="left"
        isOpen={true}
        onToggleOpen={vi.fn()}
        tabs={['outline', 'characters']}
        activeTab={'outline'}
        onSelectTab={onSelectTab}
        onDockTab={vi.fn()}
        onRemoveTab={vi.fn()}
        renderView={() => <div>Content</div>}
        isDirty={true}
      />
    );

    const charTab = screen.getByText('Cast');
    fireEvent.pointerDown(charTab, { clientX: 10, clientY: 10 });
    fireEvent.pointerUp(charTab, { clientX: 10, clientY: 10 });

    expect(confirmSpy).toHaveBeenCalledWith(
      'You have unsaved edits. Are you sure you want to switch tabs? Changes will be lost.'
    );
    expect(onSelectTab).not.toHaveBeenCalled();
  });

  it('switches tabs without confirmation when isDirty is false', () => {
    const onSelectTab = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm');

    render(
      <DockContainer
        side="left"
        isOpen={true}
        onToggleOpen={vi.fn()}
        tabs={['outline', 'characters']}
        activeTab={'outline'}
        onSelectTab={onSelectTab}
        onDockTab={vi.fn()}
        onRemoveTab={vi.fn()}
        renderView={() => <div>Content</div>}
        isDirty={false}
      />
    );

    const charTab = screen.getByText('Cast');
    fireEvent.pointerDown(charTab, { clientX: 10, clientY: 10 });
    fireEvent.pointerUp(charTab, { clientX: 10, clientY: 10 });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onSelectTab).toHaveBeenCalledWith('characters');
  });
});

describe('DockContainer Dual-Strip Subdivision', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('subdivides panel into two strips when clicking the split button', () => {
    render(
      <DockContainer
        side="left"
        isOpen={true}
        onToggleOpen={vi.fn()}
        tabs={['outline', 'search']}
        activeTab={'outline'}
        onSelectTab={vi.fn()}
        onDockTab={vi.fn()}
        onRemoveTab={vi.fn()}
        renderView={(tabId) => <div data-testid={`content-${tabId}`}>View for {tabId}</div>}
      />
    );

    // Initial state: single strip
    expect(screen.getByTestId('content-outline')).toBeDefined();
    expect(screen.queryByTestId('content-search')).toBeNull();

    // Click the split button (Subdivide panel)
    const splitButton = screen.getByTitle(/Subdivide panel into two strips/i);
    expect(splitButton).toBeDefined();
    fireEvent.click(splitButton);

    // Both top strip and bottom strip views should now be rendered simultaneously!
    expect(screen.getByTestId('content-outline')).toBeDefined();
    expect(screen.getByTestId('content-search')).toBeDefined();

    // Horizontal splitter divider should be present
    const splitter = screen.getByRole('separator', { name: /Resize panel strips/i });
    expect(splitter).toBeDefined();

    // Merging back into single panel
    const mergeButton = screen.getByTitle(/Merge into single panel/i);
    fireEvent.click(mergeButton);

    // Back to single strip: only top tab content rendered
    expect(screen.getByTestId('content-outline')).toBeDefined();
    expect(screen.queryByTestId('content-search')).toBeNull();
  });

  it('allows closing bottom strip via the close button in bottom strip header', () => {
    render(
      <DockContainer
        side="right"
        isOpen={true}
        onToggleOpen={vi.fn()}
        tabs={['inspector', 'context', 'characters']}
        activeTab={'inspector'}
        onSelectTab={vi.fn()}
        onDockTab={vi.fn()}
        onRemoveTab={vi.fn()}
        renderView={(tabId) => <div data-testid={`content-${tabId}`}>View for {tabId}</div>}
      />
    );

    // Split right panel
    const splitButton = screen.getByTitle(/Subdivide panel into two strips/i);
    fireEvent.click(splitButton);

    expect(screen.getByTestId('content-inspector')).toBeDefined();
    expect(screen.getByTestId('content-context')).toBeDefined();

    // Click close bottom strip
    const closeBottomBtn = screen.getByTitle(/Close bottom strip/i);
    fireEvent.click(closeBottomBtn);

    // Single panel restored
    expect(screen.getByTestId('content-inspector')).toBeDefined();
    expect(screen.queryByTestId('content-context')).toBeNull();
  });
});
