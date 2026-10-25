import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useGlobalShortcuts } from './useGlobalShortcuts';

describe('useGlobalShortcuts hook', () => {
  it('triggers onSave when pressing Ctrl+S or Cmd+S without shift', () => {
    const onSave = vi.fn();
    const onSaveAs = vi.fn();
    const onOpen = vi.fn();
    const onSearch = vi.fn();

    renderHook(() =>
      useGlobalShortcuts({
        onSave,
        onSaveAs,
        onOpen,
        onSearch,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSaveAs).not.toHaveBeenCalled();
  });

  it('triggers onSaveAs when pressing Ctrl+Shift+S', () => {
    const onSave = vi.fn();
    const onSaveAs = vi.fn();
    const onOpen = vi.fn();
    const onSearch = vi.fn();

    renderHook(() =>
      useGlobalShortcuts({
        onSave,
        onSaveAs,
        onOpen,
        onSearch,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(onSaveAs).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('triggers onOpen when pressing Ctrl+O', () => {
    const onSave = vi.fn();
    const onSaveAs = vi.fn();
    const onOpen = vi.fn();
    const onSearch = vi.fn();

    renderHook(() =>
      useGlobalShortcuts({
        onSave,
        onSaveAs,
        onOpen,
        onSearch,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'o',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('triggers onSearch when pressing Ctrl+Shift+F', () => {
    const onSave = vi.fn();
    const onSaveAs = vi.fn();
    const onOpen = vi.fn();
    const onSearch = vi.fn();

    renderHook(() =>
      useGlobalShortcuts({
        onSave,
        onSaveAs,
        onOpen,
        onSearch,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'f',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
