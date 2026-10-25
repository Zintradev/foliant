import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDockLayout } from './useDockLayout';

describe('useDockLayout hook', () => {
  it('initializes with default panel widths and open states', () => {
    const { result } = renderHook(() => useDockLayout());

    expect(result.current.leftOpen).toBe(true);
    expect(result.current.rightOpen).toBe(true);
    expect(result.current.isBottomOpen).toBe(false);
    expect(result.current.leftWidth).toBe(270);
    expect(result.current.rightWidth).toBe(310);
    expect(result.current.activeLeftTab).toBe('outline');
    expect(result.current.activeRightTab).toBe('inspector');
  });

  it('resizes left panel constrained between 180 and 600', () => {
    const { result } = renderHook(() => useDockLayout());

    act(() => {
      result.current.handleResizeLeft(50);
    });
    expect(result.current.leftWidth).toBe(320);

    act(() => {
      result.current.handleResizeLeft(-500);
    });
    expect(result.current.leftWidth).toBe(180);

    act(() => {
      result.current.handleResizeLeft(1000);
    });
    expect(result.current.leftWidth).toBe(600);
  });

  it('docks tabs between sides and maintains selection', () => {
    const { result } = renderHook(() => useDockLayout());

    act(() => {
      result.current.handleDockTab('characters', 'left');
    });

    expect(result.current.leftTabs).toContain('characters');
    expect(result.current.rightTabs).not.toContain('characters');
    expect(result.current.activeLeftTab).toBe('characters');
    expect(result.current.leftOpen).toBe(true);
  });

  it('opens search tab in existing panel or adds to left panel', () => {
    const onOpenWriteView = vi.fn();
    const { result } = renderHook(() => useDockLayout({ onOpenWriteView }));

    act(() => {
      result.current.handleOpenSearchTab();
    });

    expect(result.current.leftTabs).toContain('search');
    expect(result.current.activeLeftTab).toBe('search');
    expect(result.current.leftOpen).toBe(true);
    expect(onOpenWriteView).toHaveBeenCalled();
  });
});
