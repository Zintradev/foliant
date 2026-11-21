import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { FirstRunTourToast } from './FirstRunTourToast';

describe('FirstRunTourToast Component', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders prompt after timer when not previously dismissed', () => {
    render(<FirstRunTourToast onStartTour={vi.fn()} />);

    expect(
      screen.queryByText(/(first time in foliant|primeros pasos en foliant)/i)
    ).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(
      screen.getByText(/(first time in foliant|primeros pasos en foliant)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/(don't show again|no volver a mostrar)/i)
    ).toBeInTheDocument();
  });

  it('permanently dismisses when clicking "No volver a mostrar"', () => {
    render(<FirstRunTourToast onStartTour={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(1300);
    });

    const neverBtn = screen.getByText(/(don't show again|no volver a mostrar)/i);
    fireEvent.click(neverBtn);

    expect(localStorage.getItem('foliant_tour_prompt_seen')).toBe('true');
    expect(localStorage.getItem('foliant_tour_prompt_never')).toBe('true');
    expect(
      screen.queryByText(/(first time in foliant|primeros pasos en foliant)/i)
    ).not.toBeInTheDocument();
  });

  it('dismisses for session only when clicking "Más tarde"', () => {
    render(<FirstRunTourToast onStartTour={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(1300);
    });

    const laterBtn = screen.getByText(/(later|más tarde)/i);
    fireEvent.click(laterBtn);

    expect(sessionStorage.getItem('foliant_tour_prompt_session_dismissed')).toBe('true');
    expect(localStorage.getItem('foliant_tour_prompt_seen')).toBeNull();
    expect(
      screen.queryByText(/(first time in foliant|primeros pasos en foliant)/i)
    ).not.toBeInTheDocument();
  });

  it('starts tour and sets permanent dismissal when clicking "Iniciar tutorial"', () => {
    const onStartTour = vi.fn();
    render(<FirstRunTourToast onStartTour={onStartTour} />);

    act(() => {
      vi.advanceTimersByTime(1300);
    });

    const startBtn = screen.getByText(/(start tutorial|iniciar tutorial)/i);
    fireEvent.click(startBtn);

    expect(onStartTour).toHaveBeenCalled();
    expect(localStorage.getItem('foliant_tour_prompt_seen')).toBe('true');
    expect(
      screen.queryByText(/(first time in foliant|primeros pasos en foliant)/i)
    ).not.toBeInTheDocument();
  });

  it('does not render if already dismissed in localStorage', () => {
    localStorage.setItem('foliant_tour_prompt_seen', 'true');
    render(<FirstRunTourToast onStartTour={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      screen.queryByText(/(first time in foliant|primeros pasos en foliant)/i)
    ).not.toBeInTheDocument();
  });
});
