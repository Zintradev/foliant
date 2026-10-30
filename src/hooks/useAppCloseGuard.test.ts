import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAppCloseGuard } from './useAppCloseGuard';
import { getCurrentWindow } from '@tauri-apps/api/window';

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  ask: vi.fn(),
}));

describe('useAppCloseGuard', () => {
  const mockOnCloseRequested = vi.fn();
  const mockDestroy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).__TAURI_INTERNALS__ = undefined;
    vi.mocked(getCurrentWindow).mockReturnValue({
      onCloseRequested: mockOnCloseRequested.mockResolvedValue(vi.fn()),
      destroy: mockDestroy,
    } as any);
  });

  it('registers beforeunload handler and blocks navigation when hasUnsavedChanges is true', () => {
    const addEventSpy = vi.spyOn(window, 'addEventListener');
    const removeEventSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useAppCloseGuard({
        hasUnsavedChanges: true,
        language: 'es',
      })
    );

    expect(addEventSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    // Simulate beforeunload event
    const event = new Event('beforeunload') as BeforeUnloadEvent;
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();

    unmount();
    expect(removeEventSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('does not prevent default on beforeunload when hasUnsavedChanges is false', () => {
    renderHook(() =>
      useAppCloseGuard({
        hasUnsavedChanges: false,
        language: 'en',
      })
    );

    const event = new Event('beforeunload') as BeforeUnloadEvent;
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('in Tauri desktop, does NOT register onCloseRequested when hasUnsavedChanges is false, allowing natural window close', () => {
    (window as any).__TAURI_INTERNALS__ = { invoke: vi.fn() };

    renderHook(() =>
      useAppCloseGuard({
        hasUnsavedChanges: false,
        language: 'es',
      })
    );

    expect(mockOnCloseRequested).not.toHaveBeenCalled();
  });

  it('in Tauri desktop, registers onCloseRequested and triggers onRequestCloseConfirm when hasUnsavedChanges is true', async () => {
    (window as any).__TAURI_INTERNALS__ = { invoke: vi.fn() };
    const mockRequestConfirm = vi.fn();

    let closeHandler: ((evt: any) => Promise<void>) | undefined;
    mockOnCloseRequested.mockImplementation((handler) => {
      closeHandler = handler;
      return Promise.resolve(vi.fn());
    });

    renderHook(() =>
      useAppCloseGuard({
        hasUnsavedChanges: true,
        onRequestCloseConfirm: mockRequestConfirm,
        language: 'es',
      })
    );

    expect(mockOnCloseRequested).toHaveBeenCalled();
    expect(closeHandler).toBeDefined();

    const mockEvt = { preventDefault: vi.fn() };
    await closeHandler!(mockEvt);

    expect(mockEvt.preventDefault).toHaveBeenCalled();
    expect(mockRequestConfirm).toHaveBeenCalled();
  });
});

