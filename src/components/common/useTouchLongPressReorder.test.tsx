import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { useTouchLongPressReorder } from './useTouchLongPressReorder';

function TestItem({
  id,
  index,
  onStart,
  onMove,
  onEnd,
  onCancel,
}: {
  id: string;
  index: number;
  onStart: (id: string, index: number) => void;
  onMove: (clientY: number, clientX: number) => void;
  onEnd: () => void;
  onCancel?: () => void;
}) {
  const { isTouchDragging, touchDragProps } = useTouchLongPressReorder({
    id,
    index,
    onStart,
    onMove,
    onEnd,
    onCancel,
    delayMs: 500,
    moveThreshold: 10,
  });

  return (
    <div
      data-testid={`item-${id}`}
      data-touch-dragging={isTouchDragging}
      {...touchDragProps}
    >
      Item {id}
    </div>
  );
}

describe('useTouchLongPressReorder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('strictly ignores mouse pointers (pointerType === "mouse") without any delay or timer', () => {
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();

    const { getByTestId } = render(
      <TestItem
        id="item-1"
        index={0}
        onStart={onStart}
        onMove={onMove}
        onEnd={onEnd}
      />
    );

    const el = getByTestId('item-item-1');

    // Pointer down with mouse
    fireEvent.pointerDown(el, {
      pointerType: 'mouse',
      button: 0,
      clientX: 50,
      clientY: 100,
      pointerId: 1,
    });

    // Advance timers beyond 500ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // onStart must NOT be called for mouse (native HTML5 handles mouse immediately)
    expect(onStart).not.toHaveBeenCalled();
    expect(el.getAttribute('data-touch-dragging')).toBe('false');
  });

  it('cancels drag if touch pointer moves > 10px before 0.5s (allows browser scroll)', () => {
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();

    const { getByTestId } = render(
      <TestItem
        id="item-1"
        index={0}
        onStart={onStart}
        onMove={onMove}
        onEnd={onEnd}
      />
    );

    const el = getByTestId('item-item-1');

    // Touch down at (50, 100)
    fireEvent.pointerDown(el, {
      pointerType: 'touch',
      button: 0,
      clientX: 50,
      clientY: 100,
      pointerId: 2,
    });

    // Move after 100ms by 15px (user is scrolling)
    act(() => {
      vi.advanceTimersByTime(100);
    });

    fireEvent.pointerMove(el, {
      pointerType: 'touch',
      clientX: 50,
      clientY: 115, // dy = 15px > 10px threshold
      pointerId: 2,
    });

    // Advance past 500ms
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onStart).not.toHaveBeenCalled();
    expect(el.getAttribute('data-touch-dragging')).toBe('false');
  });

  it('activates touch drag after 0.5 seconds (500ms) hold, locks scroll, and handles move and drop', () => {
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();

    const { getByTestId } = render(
      <TestItem
        id="item-1"
        index={0}
        onStart={onStart}
        onMove={onMove}
        onEnd={onEnd}
      />
    );

    const el = getByTestId('item-item-1');

    // Touch down at (50, 100)
    fireEvent.pointerDown(el, {
      pointerType: 'touch',
      button: 0,
      clientX: 50,
      clientY: 100,
      pointerId: 3,
    });

    // Micro-move under 10px threshold (natural resting tremor)
    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.pointerMove(el, {
      pointerType: 'touch',
      clientX: 52,
      clientY: 103, // dy = 3px < 10px
      pointerId: 3,
    });

    // At 400ms, still under 500ms, drag should not be active
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onStart).not.toHaveBeenCalled();
    expect(el.getAttribute('data-touch-dragging')).toBe('false');

    // Reach 500ms (0.5 seconds)
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onStart).toHaveBeenCalledWith('item-1', 0);
    expect(el.getAttribute('data-touch-dragging')).toBe('true');

    // Drag on window via touchmove
    const touchMoveEvent = new Event('touchmove', { cancelable: true }) as any;
    touchMoveEvent.touches = [{ clientX: 50, clientY: 250 }];
    act(() => {
      window.dispatchEvent(touchMoveEvent);
    });

    expect(onMove).toHaveBeenCalledWith(250, 50);

    // Release finger on window via touchend
    act(() => {
      window.dispatchEvent(new Event('touchend'));
    });

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(el.getAttribute('data-touch-dragging')).toBe('false');
  });

  it('automatically scrolls the container downward when dragging near the bottom edge', () => {
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();

    // Create a scrollable container
    const scrollContainer = document.createElement('div');
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 600, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1200, configurable: true });
    scrollContainer.style.overflowY = 'auto';
    scrollContainer.scrollTop = 0;
    scrollContainer.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 0,
      bottom: 600,
      height: 600,
      left: 0,
      right: 400,
      width: 400,
    });
    document.body.appendChild(scrollContainer);

    const { getByTestId } = render(
      <TestItem
        id="item-scroll"
        index={0}
        onStart={onStart}
        onMove={onMove}
        onEnd={onEnd}
      />,
      { container: scrollContainer }
    );

    const el = getByTestId('item-item-scroll');

    // Pointer down with touch
    fireEvent.pointerDown(el, {
      pointerType: 'touch',
      button: 0,
      clientX: 50,
      clientY: 100,
      pointerId: 4,
    });

    // Advance 550ms to activate drag
    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(onStart).toHaveBeenCalledWith('item-scroll', 0);

    // Mock requestAnimationFrame to run synchronous callbacks with timers
    let rafCallback: FrameRequestCallback | null = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    // Drag to the bottom zone: clientY = 580 (within bottom - 85 zone)
    const touchMoveEvent = new Event('touchmove', { cancelable: true }) as any;
    touchMoveEvent.touches = [{ clientX: 50, clientY: 580 }];
    act(() => {
      window.dispatchEvent(touchMoveEvent);
    });

    // Run the RAF step
    act(() => {
      if (rafCallback) {
        rafCallback(performance.now());
      }
    });

    // Container should have scrolled downwards
    expect(scrollContainer.scrollTop).toBeGreaterThan(0);

    // Release touch
    act(() => {
      window.dispatchEvent(new Event('touchend'));
    });

    expect(onEnd).toHaveBeenCalled();
    scrollContainer.remove();
  });
});
