import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import MoodboardBlock from './MoodboardBlock';
import { invoke } from '@tauri-apps/api/core';
import { ProjectVisualItem } from '../../types/project';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  convertFileSrc: vi.fn((path: string) => `asset://${path}`),
}));

describe('MoodboardBlock Component', () => {
  const defaultVisuals: ProjectVisualItem[] = [
    { id: '1', path: 'C:/images/landscape.jpg', name: 'landscape.jpg', sectionId: 'general' },
    { id: '2', path: 'C:/images/forest.png', name: 'forest.png', sectionId: 'general' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = { invoke: vi.fn() };
    (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      'C:/images/landscape.jpg',
      'C:/images/forest.png',
    ]);
  });

  it('renders multi-select file input', async () => {
    render(<MoodboardBlock title="Moodboard" initialVisuals={defaultVisuals} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('renders compact inline-flex folder headers that toggle collapse with rotating chevron', async () => {
    render(<MoodboardBlock title="Moodboard" initialVisuals={defaultVisuals} />);

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
    render(<MoodboardBlock title="Moodboard" initialVisuals={defaultVisuals} />);

    await waitFor(() => {
      expect(screen.getByText('landscape.jpg')).toBeInTheDocument();
    });

    const masonryGrid = document.querySelector('.columns-2.md\\:columns-4');
    expect(masonryGrid).toBeInTheDocument();

    const thumbnail = screen.getByText('landscape.jpg').closest('div.break-inside-avoid');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute('draggable', 'true');
  });

  it('supports dragging an image between folder sections', async () => {
    render(<MoodboardBlock title="Moodboard" initialVisuals={defaultVisuals} />);

    await waitFor(() => {
      expect(screen.getByText('landscape.jpg')).toBeInTheDocument();
    });

    const landscapeCard = screen.getByText('landscape.jpg').closest('div[draggable="true"]')!;
    expect(landscapeCard).toBeInTheDocument();

    // Start drag
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue(''),
      types: ['text/image-id'],
      effectAllowed: 'move',
    };
    // Check initial counts
    const atmosphereHeader = screen.getByText('Atmosphere').closest('div[role="button"]')!;
    expect(atmosphereHeader).toHaveTextContent('0');

    fireEvent.dragStart(landscapeCard, { dataTransfer });
    fireEvent.dragOver(atmosphereHeader, { dataTransfer });

    // Drop on Atmosphere folder
    fireEvent.drop(atmosphereHeader, {
      dataTransfer: {
        ...dataTransfer,
        files: [],
      },
    });

    // Verify Atmosphere folder count updated to 1
    await waitFor(() => {
      expect(atmosphereHeader).toHaveTextContent('1');
    });
  });

  it('ensures all internal elements in ThumbnailCard have pointer-events-none', async () => {
    render(<MoodboardBlock title="Moodboard" initialVisuals={defaultVisuals} />);

    await waitFor(() => {
      expect(screen.getByText('landscape.jpg')).toBeInTheDocument();
    });

    const landscapeCard = screen.getByText('landscape.jpg').closest('div[draggable="true"]')!;
    expect(landscapeCard).toBeInTheDocument();

    const internalElements = landscapeCard.querySelectorAll('img, div, span, button, svg');
    expect(internalElements.length).toBeGreaterThan(0);
    internalElements.forEach((el) => {
      expect(el).toHaveClass('pointer-events-none');
    });
  });

  it('renders visuals correctly from in-memory state without localStorage when running on web (no Tauri IPC)', async () => {
    delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;

    const webVisuals: ProjectVisualItem[] = [
      {
        id: 'web-1',
        path: 'web-sample.jpg',
        name: 'web-sample.jpg',
        sectionId: 'general',
        base64: 'data:image/png;base64,mockWebImg',
      },
    ];

    render(<MoodboardBlock title="Moodboard" initialVisuals={webVisuals} />);
    await waitFor(() => {
      expect(screen.getByText('web-sample.jpg')).toBeInTheDocument();
    });
  });

  it('actively strips and rejects castle.jpg if present in initialVisuals or disk', async () => {
    const mixedVisuals: ProjectVisualItem[] = [
      { id: 'bad-1', path: 'C:/visuals/castle.jpg', name: 'castle.jpg', sectionId: 'general' },
      { id: 'ok-1', path: 'C:/visuals/valid.png', name: 'valid.png', sectionId: 'general' },
    ];
    (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      'C:/visuals/castle.jpg',
      'C:/visuals/valid.png',
    ]);

    render(<MoodboardBlock title="Moodboard" initialVisuals={mixedVisuals} />);
    await waitFor(() => {
      expect(screen.getByText('valid.png')).toBeInTheDocument();
    });
    expect(screen.queryByText('castle.jpg')).not.toBeInTheDocument();
  });

  it('supports swapping image positions when visualsDropMode is swap', async () => {
    const onUpdate = vi.fn();
    render(
      <MoodboardBlock
        title="Moodboard"
        visualsDropMode="swap"
        initialVisuals={defaultVisuals}
        onUpdateVisuals={onUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('landscape.jpg')).toBeInTheDocument();
      expect(screen.getByText('forest.png')).toBeInTheDocument();
    });

    const landscapeCard = screen.getByText('landscape.jpg').closest('div[draggable="true"]')!;
    const forestCard = screen.getByText('forest.png').closest('div[draggable="true"]')!;

    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn((key: string) => (key === 'text/plain' ? '1' : '')),
      types: ['text/plain', 'text/image-id'],
      effectAllowed: 'move',
    };

    fireEvent.dragStart(landscapeCard, { dataTransfer });
    fireEvent.dragEnter(forestCard, { dataTransfer });
    fireEvent.dragOver(forestCard, { dataTransfer, clientY: 100 });
    fireEvent.drop(forestCard, { dataTransfer });

    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({ id: '2', name: 'forest.png' }),
      expect.objectContaining({ id: '1', name: 'landscape.jpg' }),
    ]);
  });

  it('restores original positions when dragging back in shift mode without dropping (arrepentimiento)', async () => {
    const onUpdate = vi.fn();
    render(
      <MoodboardBlock
        title="Moodboard"
        visualsDropMode="shift"
        initialVisuals={defaultVisuals}
        onUpdateVisuals={onUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('landscape.jpg')).toBeInTheDocument();
      expect(screen.getByText('forest.png')).toBeInTheDocument();
    });

    const landscapeCard = screen.getByText('landscape.jpg').closest('div[draggable="true"]')!;
    const forestCard = screen.getByText('forest.png').closest('div[draggable="true"]')!;

    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn((key: string) => (key === 'text/plain' ? '1' : '')),
      types: ['text/plain', 'text/image-id'],
      effectAllowed: 'move',
    };

    // 1. Iniciar arrastre de landscape (id: 1)
    fireEvent.dragStart(landscapeCard, { dataTransfer });

    // 2. Mover sobre forest (id: 2) -> se desplaza
    fireEvent.dragOver(forestCard, { dataTransfer, clientX: 100, clientY: 100 });

    // 3. Mover de vuelta sobre forest (que ahora está en la posición anterior) -> se desplaza de vuelta
    fireEvent.dragOver(forestCard, { dataTransfer, clientX: 50, clientY: 50 });

    // 4. Soltar -> debe preservar el orden original restablecido
    fireEvent.drop(landscapeCard, { dataTransfer });

    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({ id: '1', name: 'landscape.jpg' }),
      expect.objectContaining({ id: '2', name: 'forest.png' }),
    ]);
  });

  it('does not display rogue files from disk when project visuals are empty', async () => {
    localStorage.clear();
    (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      'C:/temp/castle.jpg',
      'C:/temp/rogue.png',
    ]);

    render(<MoodboardBlock title="Moodboard" projectId="new-proj" initialVisuals={[]} />);
    await waitFor(() => {
      expect(screen.queryByText('castle.jpg')).not.toBeInTheDocument();
      expect(screen.queryByText('rogue.png')).not.toBeInTheDocument();
    });
  });

  it('strictly resets moodboard state to empty when switching to a project without visuals (no state bleeding)', async () => {
    const { rerender } = render(
      <MoodboardBlock title="Moodboard" projectId="proj-with-images" initialVisuals={defaultVisuals} />
    );

    await waitFor(() => {
      expect(screen.getByText('landscape.jpg')).toBeInTheDocument();
      expect(screen.getByText('forest.png')).toBeInTheDocument();
    });

    // Re-render as a new empty project (e.g. user created or loaded a clean project)
    rerender(
      <MoodboardBlock title="Moodboard" projectId="proj-empty" initialVisuals={[]} />
    );

    await waitFor(() => {
      expect(screen.queryByText('landscape.jpg')).not.toBeInTheDocument();
      expect(screen.queryByText('forest.png')).not.toBeInTheDocument();
    });
  });

  it('never persists moodboard visuals or sections to localStorage', async () => {
    localStorage.clear();
    render(<MoodboardBlock title="Moodboard" projectId="clean-proj" initialVisuals={defaultVisuals} />);

    await waitFor(() => {
      expect(screen.getByText('landscape.jpg')).toBeInTheDocument();
    });

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      expect(key).not.toMatch(/^foliant_moodboard/);
    }
  });
});
