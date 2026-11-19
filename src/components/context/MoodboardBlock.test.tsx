import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

  it('reads image as data URL in web mode and stores base64 for card rendering', async () => {
    delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    const handleUpdate = vi.fn();
    const originalFileReader = window.FileReader;
    class MockFileReader {
      result: string | null = null;
      onload: (() => void) | null = null;
      readAsDataURL() {
        this.result = 'data:image/jpeg;base64,mockJpegBase64Data';
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    }
    window.FileReader = MockFileReader as any;

    try {
      render(
        <MoodboardBlock
          title="Moodboard"
          projectId="web-proj"
          initialVisuals={[]}
          onUpdateVisuals={handleUpdate}
        />
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();

      const mockFile = new File(['mock content'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(input, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(handleUpdate).toHaveBeenCalled();
      });

      const savedVisuals = handleUpdate.mock.calls[0][0];
      expect(savedVisuals.length).toBe(1);
      expect(savedVisuals[0].name).toBe('photo.jpg');
      expect(savedVisuals[0].base64).toBeDefined();
    } finally {
      window.FileReader = originalFileReader;
    }
  });

  it('allows reordering images using discrete prev/next buttons', async () => {
    const handleUpdate = vi.fn();
    render(
      <MoodboardBlock
        title="Moodboard"
        projectId="reorder-proj"
        initialVisuals={defaultVisuals}
        onUpdateVisuals={handleUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('landscape.jpg')).toBeInTheDocument();
      expect(screen.getByText('forest.png')).toBeInTheDocument();
    });

    const nextButtons = screen.getAllByTitle('Mover después');
    expect(nextButtons.length).toBeGreaterThan(0);
    fireEvent.click(nextButtons[0]);

    expect(handleUpdate).toHaveBeenCalled();
    const updated = handleUpdate.mock.calls[0][0];
    expect(updated[0].name).toBe('forest.png');
    expect(updated[1].name).toBe('landscape.jpg');
  });

  it('supports touch long-press drag & drop on tablet to reorder visual cards', async () => {
    const handleUpdate = vi.fn();
    render(
      <MoodboardBlock
        title="Moodboard"
        projectId="touch-proj"
        initialVisuals={defaultVisuals}
        onUpdateVisuals={handleUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('landscape.jpg')).toBeInTheDocument();
      expect(screen.getByText('forest.png')).toBeInTheDocument();
    });

    const card1 = document.querySelector('[data-image-id="1"]') as HTMLElement;
    const card2 = document.querySelector('[data-image-id="2"]') as HTMLElement;
    expect(card1).toBeInTheDocument();
    expect(card2).toBeInTheDocument();

    // Mock elementsFromPoint so touch drag move detects card2
    document.elementsFromPoint = vi.fn().mockReturnValue([card2]);

    vi.useFakeTimers();
    try {
      // Touch start on card 1
      fireEvent.pointerDown(card1, {
        pointerType: 'touch',
        button: 0,
        clientX: 100,
        clientY: 100,
        pointerId: 10,
      });

      // Advance by 550ms to activate touch drag
      act(() => {
        vi.advanceTimersByTime(550);
      });

      // Card 1 in-flow slot should now be the placeholder while floating clone is dragged
      expect(card1.className).toContain('border-dashed');

      // Dispatch window touchmove over card2
      const touchMoveEv = new Event('touchmove', { cancelable: true }) as any;
      touchMoveEv.touches = [{ clientX: 100, clientY: 300 }];
      act(() => {
        window.dispatchEvent(touchMoveEv);
      });

      // Release finger
      act(() => {
        window.dispatchEvent(new Event('touchend'));
      });

      expect(handleUpdate).toHaveBeenCalled();
      const updated = handleUpdate.mock.calls[0][0];
      expect(updated[0].id).toBe('2');
      expect(updated[1].id).toBe('1');
    } finally {
      vi.useRealTimers();
    }
  });

  it('supports touch dragging an image across folders to change its section', async () => {
    const handleUpdate = vi.fn();
    render(
      <MoodboardBlock
        title="Moodboard"
        projectId="touch-folder-proj"
        initialVisuals={defaultVisuals}
        onUpdateVisuals={handleUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('landscape.jpg')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
    });

    const card1 = document.querySelector('[data-image-id="1"]') as HTMLElement;
    expect(card1).toBeInTheDocument();

    const charactersFolder = document.querySelector('[data-section-id="characters"]') as HTMLElement;
    expect(charactersFolder).toBeInTheDocument();

    document.elementsFromPoint = vi.fn().mockReturnValue([charactersFolder]);

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(card1, {
        pointerType: 'touch',
        button: 0,
        clientX: 100,
        clientY: 100,
        pointerId: 11,
      });

      act(() => {
        vi.advanceTimersByTime(550);
      });

      const touchMoveEv = new Event('touchmove', { cancelable: true }) as any;
      touchMoveEv.touches = [{ clientX: 100, clientY: 500 }];
      act(() => {
        window.dispatchEvent(touchMoveEv);
      });

      act(() => {
        window.dispatchEvent(new Event('touchend'));
      });

      expect(handleUpdate).toHaveBeenCalled();
      const updated = handleUpdate.mock.calls[0][0];
      const moved = updated.find((img: any) => img.id === '1');
      expect(moved.sectionId).toBe('characters');
    } finally {
      vi.useRealTimers();
    }
  });

  it('supports touch dragging in swap mode on tablet', async () => {
    localStorage.setItem(
      'foliant_settings',
      JSON.stringify({ preferences: { visualsDropMode: 'swap' } })
    );

    const handleUpdate = vi.fn();
    render(
      <MoodboardBlock
        title="Moodboard"
        projectId="touch-swap-proj"
        initialVisuals={defaultVisuals}
        onUpdateVisuals={handleUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('landscape.jpg')).toBeInTheDocument();
      expect(screen.getByText('forest.png')).toBeInTheDocument();
    });

    const card1 = document.querySelector('[data-image-id="1"]') as HTMLElement;
    const card2 = document.querySelector('[data-image-id="2"]') as HTMLElement;

    document.elementsFromPoint = vi.fn().mockReturnValue([card2]);

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(card1, {
        pointerType: 'touch',
        button: 0,
        clientX: 100,
        clientY: 100,
        pointerId: 12,
      });

      act(() => {
        vi.advanceTimersByTime(550);
      });

      const touchMoveEv = new Event('touchmove', { cancelable: true }) as any;
      touchMoveEv.touches = [{ clientX: 100, clientY: 300 }];
      act(() => {
        window.dispatchEvent(touchMoveEv);
      });

      act(() => {
        window.dispatchEvent(new Event('touchend'));
      });

      expect(handleUpdate).toHaveBeenCalled();
      const updated = handleUpdate.mock.calls[0][0];
      expect(updated[0].id).toBe('2');
      expect(updated[1].id).toBe('1');
    } finally {
      vi.useRealTimers();
    }
  });

  it('supports swapping images across different folders on tablet without getting stuck', async () => {
    localStorage.setItem(
      'foliant_settings',
      JSON.stringify({ preferences: { visualsDropMode: 'swap' } })
    );

    const crossFolderVisuals: ProjectVisualItem[] = [
      { id: '1', name: 'landscape.jpg', path: 'visuals/landscape.jpg', sectionId: 'general' },
      { id: '2', name: 'forest.png', path: 'visuals/forest.png', sectionId: 'locations' },
    ];

    const handleUpdate = vi.fn();
    render(
      <MoodboardBlock
        title="Moodboard"
        projectId="touch-cross-folder-swap"
        visualsDropMode="swap"
        initialVisuals={crossFolderVisuals}
        onUpdateVisuals={handleUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('landscape.jpg')).toBeInTheDocument();
      expect(screen.getByText('forest.png')).toBeInTheDocument();
    });

    const card1 = document.querySelector('[data-image-id="1"]') as HTMLElement;
    const card2 = document.querySelector('[data-image-id="2"]') as HTMLElement;
    const folderLocations = document.querySelector('[data-section-id="locations"]') as HTMLElement;

    document.elementsFromPoint = vi.fn().mockReturnValue([card2, folderLocations]);

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(card1, {
        pointerType: 'touch',
        button: 0,
        clientX: 100,
        clientY: 100,
        pointerId: 14,
      });

      act(() => {
        vi.advanceTimersByTime(550);
      });

      const touchMoveEv = new Event('touchmove', { cancelable: true }) as any;
      touchMoveEv.touches = [{ clientX: 100, clientY: 400 }];
      act(() => {
        window.dispatchEvent(touchMoveEv);
      });

      act(() => {
        window.dispatchEvent(new Event('touchend'));
      });

      expect(handleUpdate).toHaveBeenCalled();
      const updated = handleUpdate.mock.calls[0][0];
      const img1 = updated.find((img: ProjectVisualItem) => img.id === '1');
      const img2 = updated.find((img: ProjectVisualItem) => img.id === '2');

      // Both images must have swapped sections cleanly
      expect(img1?.sectionId).toBe('locations');
      expect(img2?.sectionId).toBe('general');
    } finally {
      vi.useRealTimers();
    }
  });
});
