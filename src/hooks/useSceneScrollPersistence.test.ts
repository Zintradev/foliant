import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  useSceneScrollPersistence,
  getSavedSceneScroll,
  getSceneScrollStorageKey,
  SCENE_SCROLL_STORAGE_PREFIX,
} from './useSceneScrollPersistence';

describe('useSceneScrollPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates proper storage keys and parses saved scroll values correctly', () => {
    expect(getSceneScrollStorageKey('scene-123')).toBe(`${SCENE_SCROLL_STORAGE_PREFIX}scene-123`);
    expect(getSceneScrollStorageKey(undefined)).toBe('');

    expect(getSavedSceneScroll('scene-123')).toBeNull();

    localStorage.setItem(`${SCENE_SCROLL_STORAGE_PREFIX}scene-123`, '450');
    expect(getSavedSceneScroll('scene-123')).toBe(450);

    localStorage.setItem(`${SCENE_SCROLL_STORAGE_PREFIX}scene-123`, 'invalid');
    expect(getSavedSceneScroll('scene-123')).toBeNull();
  });

  it('restores saved scroll position when sceneScrollMode is remember', () => {
    localStorage.setItem(`${SCENE_SCROLL_STORAGE_PREFIX}scene-1`, '250');

    const { result } = renderHook(() =>
      useSceneScrollPersistence({
        chapterId: 'scene-1',
        sceneScrollMode: 'remember',
      })
    );

    const mockContainer = {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 500,
    } as unknown as HTMLDivElement;

    // Attach mock DOM container to ref
    (result.current.scrollContainerRef as any).current = mockContainer;

    act(() => {
      result.current.restoreScroll();
    });

    expect(mockContainer.scrollTop).toBe(250);
  });

  it('scrolls to bottom when sceneScrollMode is bottom', () => {
    const { result } = renderHook(() =>
      useSceneScrollPersistence({
        chapterId: 'scene-1',
        sceneScrollMode: 'bottom',
      })
    );

    const mockContainer = {
      scrollTop: 0,
      scrollHeight: 1200,
      clientHeight: 400,
    } as unknown as HTMLDivElement;

    (result.current.scrollContainerRef as any).current = mockContainer;

    act(() => {
      result.current.restoreScroll();
    });

    // scrollHeight (1200) - clientHeight (400) = 800
    expect(mockContainer.scrollTop).toBe(800);
  });

  it('captures onScroll events and debounces saving to localStorage', () => {
    const { result } = renderHook(() =>
      useSceneScrollPersistence({
        chapterId: 'scene-2',
        sceneScrollMode: 'remember',
      })
    );

    const mockEvent = {
      currentTarget: { scrollTop: 340 },
    } as any;

    act(() => {
      result.current.handleScroll(mockEvent);
    });

    // Should not save immediately due to debounce
    expect(localStorage.getItem(`${SCENE_SCROLL_STORAGE_PREFIX}scene-2`)).toBeNull();

    // Fast-forward debounce timer (100ms)
    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(localStorage.getItem(`${SCENE_SCROLL_STORAGE_PREFIX}scene-2`)).toBe('340');
  });

  it('flushes pending save when chapterId switches or hook unmounts', () => {
    let chapterId = 'scene-alpha';
    const { result, rerender, unmount } = renderHook(() =>
      useSceneScrollPersistence({
        chapterId,
        sceneScrollMode: 'remember',
      })
    );

    const mockEvent = {
      currentTarget: { scrollTop: 520 },
    } as any;

    act(() => {
      result.current.handleScroll(mockEvent);
    });

    // Switch chapterId before debounce finishes
    chapterId = 'scene-beta';
    rerender();

    // Previous chapter's position should have been flushed immediately
    expect(localStorage.getItem(`${SCENE_SCROLL_STORAGE_PREFIX}scene-alpha`)).toBe('520');

    // Scroll scene-beta and unmount before debounce
    act(() => {
      result.current.handleScroll({ currentTarget: { scrollTop: 180 } } as any);
    });

    unmount();

    expect(localStorage.getItem(`${SCENE_SCROLL_STORAGE_PREFIX}scene-beta`)).toBe('180');
  });
});
