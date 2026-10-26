import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import WorldbuildingView from './WorldbuildingView';
import { WorldItem } from '../../../types/dock';

const mockItems: WorldItem[] = [
  {
    id: 'world-1',
    title: 'Citadel of the Whispering Sands',
    category: 'Location',
    summary: 'An ancient obsidian fortress surrounded by glass dunes.',
    description: 'Legends speak of scholars who could decipher the sands.',
  },
  {
    id: 'world-2',
    title: 'The Iron Syndicate',
    category: 'Faction',
    summary: 'A guild of metalsmiths and mercenary bankers.',
    description: 'They control currency flow across three principalities.',
    imageUrl: 'data:image/png;base64,mockSyndicateImage',
  },
];

describe('WorldbuildingView Component', () => {
  it('renders entity list and selects an entity for detail editing', () => {
    const onChange = vi.fn();
    render(<WorldbuildingView items={mockItems} onChange={onChange} />);

    expect(screen.getByText('Citadel of the Whispering Sands')).toBeInTheDocument();
    expect(screen.getByText('The Iron Syndicate')).toBeInTheDocument();

    // Verify detail form shows the first selected item
    expect(screen.getByDisplayValue('Citadel of the Whispering Sands')).toBeInTheDocument();
  });

  it('renders hidden image file input and uploads base64 imageUrl via FileReader', async () => {
    const onChange = vi.fn();
    render(<WorldbuildingView items={mockItems} onChange={onChange} />);

    const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass('hidden');

    // Create a mock file and simulate FileReader
    const file = new File(['mock content'], 'citadel.png', { type: 'image/png' });
    const mockDataUrl = 'data:image/png;base64,citadelBase64Data';

    // Mock FileReader
    const originalFileReader = window.FileReader;
    class MockFileReader {
      result: string | null = null;
      onload: (() => void) | null = null;
      readAsDataURL() {
        this.result = mockDataUrl;
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    }
    window.FileReader = MockFileReader as any;

    try {
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'world-1',
              imageUrl: mockDataUrl,
            }),
          ])
        );
      });
    } finally {
      window.FileReader = originalFileReader;
    }
  });

  it('renders image with object-cover when imageUrl is present and allows removing it', () => {
    const onChange = vi.fn();
    // Render with item that already has imageUrl
    render(<WorldbuildingView items={[mockItems[1]]} onChange={onChange} />);

    const img = document.querySelector('img[src="data:image/png;base64,mockSyndicateImage"]');
    expect(img).toBeInTheDocument();
    expect(img?.className).toContain('object-cover');

    // Verify "Remove Image" button exists and removes image
    const removeBtn = screen.getByText('Remove Image');
    expect(removeBtn).toBeInTheDocument();

    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'world-2',
        imageUrl: undefined,
      }),
    ]);
  });

  it('reorders world items via drag and drop', () => {
    const onChange = vi.fn();
    render(<WorldbuildingView items={mockItems} onChange={onChange} />);

    const draggableCards = document.querySelectorAll('div[draggable="true"]');
    expect(draggableCards.length).toBe(2);

    // Drag first item (world-1) over second item (world-2) and drop
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn(() => 'world-1'),
      effectAllowed: 'move',
      dropEffect: 'move',
    };

    fireEvent.dragStart(draggableCards[0], { dataTransfer });
    fireEvent.dragOver(draggableCards[1], { dataTransfer });
    fireEvent.drop(draggableCards[1], { dataTransfer });

    // Should swap or move world-1 after world-2
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'world-2' }),
      expect.objectContaining({ id: 'world-1' }),
    ]);
  });

  it('allows adding and editing custom fields on world items', () => {
    const onChange = vi.fn();
    render(<WorldbuildingView items={mockItems} onChange={onChange} />);

    // Click "+ History" preset button
    const historyPresetBtn = screen.getByText('+ History');
    fireEvent.click(historyPresetBtn);

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'world-1',
          fields: expect.arrayContaining([
            expect.objectContaining({ label: 'History', value: '' }),
          ]),
        }),
      ])
    );
  });

  it('swaps world items when worldDropMode is swap', () => {
    const onChange = vi.fn();
    render(<WorldbuildingView items={mockItems} onChange={onChange} worldDropMode="swap" />);

    const draggableCards = document.querySelectorAll('div[draggable="true"]');
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn(() => 'world-1'),
      effectAllowed: 'move',
      dropEffect: 'move',
    };

    fireEvent.dragStart(draggableCards[0], { dataTransfer });
    fireEvent.dragOver(draggableCards[1], { dataTransfer });
    fireEvent.drop(draggableCards[1], { dataTransfer });

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'world-2' }),
      expect.objectContaining({ id: 'world-1' }),
    ]);
  });
});
