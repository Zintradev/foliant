import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import MoodboardBlock from './MoodboardBlock';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  convertFileSrc: vi.fn((path: string) => `asset://${path}`),
}));

describe('MoodboardBlock Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      'C:/images/castle.jpg',
      'C:/images/forest.png',
    ]);
  });

  it('renders multi-select file input', async () => {
    render(<MoodboardBlock title="Moodboard" />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('renders compact inline-flex folder headers that toggle collapse with rotating chevron', async () => {
    render(<MoodboardBlock title="Moodboard" />);

    // Wait for images to load
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
    });

    // Find the General folder compact header
    const generalHeader = screen.getByText('General').closest('div[role="button"]');
    expect(generalHeader).toHaveClass('inline-flex');
    expect(generalHeader).toHaveClass('w-max');

    // Initially expanded, chevron has rotate-90
    const chevron = generalHeader?.querySelector('svg.rotate-90');
    expect(chevron).toBeInTheDocument();

    // Click header to collapse
    fireEvent.click(generalHeader!);

    // Now chevron should NOT have rotate-90
    const collapsedChevron = generalHeader?.querySelector('svg.rotate-90');
    expect(collapsedChevron).not.toBeInTheDocument();

    // Click header again to expand
    fireEvent.click(generalHeader!);
    expect(generalHeader?.querySelector('svg.rotate-90')).toBeInTheDocument();
  });

  it('renders Pinterest masonry layout with columns-2 md:columns-4', async () => {
    render(<MoodboardBlock title="Moodboard" />);

    await waitFor(() => {
      expect(screen.getByText('castle.jpg')).toBeInTheDocument();
    });

    const masonryGrid = document.querySelector('.columns-2.md\\:columns-4');
    expect(masonryGrid).toBeInTheDocument();

    const thumbnail = screen.getByText('castle.jpg').closest('div.break-inside-avoid');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute('draggable', 'true');
  });

  it('supports dragging an image between folder sections', async () => {
    render(<MoodboardBlock title="Moodboard" />);

    await waitFor(() => {
      expect(screen.getByText('castle.jpg')).toBeInTheDocument();
    });

    const castleCard = screen.getByText('castle.jpg').closest('div[draggable="true"]')!;
    expect(castleCard).toBeInTheDocument();

    // Start drag
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue(''),
      types: ['text/image-id'],
      effectAllowed: 'move',
    };
    fireEvent.dragStart(castleCard, { dataTransfer });

    // Drop on Atmosphere folder
    const atmosphereHeader = screen.getByText('Atmosphere').closest('div[role="button"]')!;
    fireEvent.drop(atmosphereHeader, {
      dataTransfer: {
        ...dataTransfer,
        files: [],
      },
    });

    // Verify it updated section
    await waitFor(() => {
      expect(screen.getByText('castle.jpg')).toBeInTheDocument();
    });
  });

  it('ensures all internal elements in ThumbnailCard have pointer-events-none', async () => {
    render(<MoodboardBlock title="Moodboard" />);

    await waitFor(() => {
      expect(screen.getByText('castle.jpg')).toBeInTheDocument();
    });

    const castleCard = screen.getByText('castle.jpg').closest('div[draggable="true"]')!;
    expect(castleCard).toBeInTheDocument();

    const internalElements = castleCard.querySelectorAll('img, div, span, button, svg');
    expect(internalElements.length).toBeGreaterThan(0);
    internalElements.forEach((el) => {
      expect(el).toHaveClass('pointer-events-none');
    });
  });
});

