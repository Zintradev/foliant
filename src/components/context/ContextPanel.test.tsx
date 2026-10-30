import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ContextPanel from './ContextPanel';
import { ContextBlock } from '../../types/project';
import { StorylineItem, CharacterItem, WorldItem } from '../../types/dock';

describe('ContextPanel and ContextBlockItem (Notes View)', () => {
  const mockWorldItems: WorldItem[] = [
    {
      id: 'world-1',
      title: 'High Bastion Citadel',
      category: 'Location',
      summary: 'Fortress guarding the cliffs',
      description: 'Towering spires of obsidian stone.',
    },
    {
      id: 'world-2',
      title: 'Oceanic Crown',
      category: 'Artifact',
      summary: 'Ancient relic of the sea',
      description: 'Channels abyssal energy.',
    },
  ];

  const mockStorylines: StorylineItem[] = [
    {
      id: 'story-1',
      title: 'Main Rebellion',
      color: 'emerald',
      description: 'The uprising against the empire',
      linkedChapterIds: [],
    },
    {
      id: 'story-2',
      title: 'Shadow Guild',
      color: 'purple',
      description: 'Underworld espionage',
      linkedChapterIds: [],
    },
  ];

  const mockCharacters: CharacterItem[] = [
    {
      id: 'char-1',
      name: 'Valerius',
      role: 'Protagonist',
      summary: 'Exiled captain',
    },
    {
      id: 'char-2',
      name: 'Vespera',
      role: 'Supporting',
      summary: 'Shadow informant',
    },
  ];

  const mockBlocks: ContextBlock[] = [
    {
      id: 'block-1',
      title: 'Magic System',
      type: 'text',
      content: 'Runic magic drawn from the Oceanic Abyss.\nMust be channeled through conduits.',
      folder: 'Worldbuilding',
      storylineIds: ['story-1'],
      characterIds: ['char-1'],
      worldItemIds: ['world-1'],
      tags: ['magic', 'lore'],
    },
    {
      id: 'block-2',
      title: 'Plot Objectives',
      type: 'list',
      content: 'Infiltrate the high bastion\nSteal the ocean crown\nEscape by sea',
      folder: 'Plots',
      storylineIds: ['story-2'],
      tags: ['act2'],
    },
  ];

  it('renders text note without textarea in clean view mode, revealing textarea upon editing', () => {
    const handleChange = vi.fn();
    render(
      <ContextPanel
        blocks={mockBlocks}
        onChange={handleChange}
        storylines={mockStorylines}
        characters={mockCharacters}
        worldItems={mockWorldItems}
      />
    );

    // Header & title
    expect(screen.getByText('Magic System')).toBeInTheDocument();

    // In view mode, the textarea is NOT rendered for text note
    expect(screen.queryByPlaceholderText(/Write section notes/i)).not.toBeInTheDocument();

    // Content is cleanly rendered in view mode
    expect(screen.getByText(/Runic magic drawn from the Oceanic Abyss/i)).toBeInTheDocument();

    // Click on the text content to enter edit mode
    const textContentEl = screen.getByText(/Runic magic drawn from the Oceanic Abyss/i);
    fireEvent.click(textContentEl);

    // Now textarea appears
    const textarea = screen.getByPlaceholderText(/Write section notes/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(mockBlocks[0].content);

    // Edit content and finish
    fireEvent.change(textarea, { target: { value: 'Updated runic magic principles' } });
    const doneButtons = screen.getAllByRole('button', { name: /Done|Listo/i });
    fireEvent.click(doneButtons[0]);

    expect(handleChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'block-1',
          content: 'Updated runic magic principles',
        }),
      ])
    );
  });

  it('renders list note with clean bullet points and no textarea in view mode, revealing textarea on edit', () => {
    const handleChange = vi.fn();
    render(
      <ContextPanel
        blocks={mockBlocks}
        onChange={handleChange}
        storylines={mockStorylines}
        characters={mockCharacters}
        worldItems={mockWorldItems}
      />
    );

    expect(screen.getByText('Plot Objectives')).toBeInTheDocument();

    // In view mode, the textarea is NOT rendered for list note
    expect(screen.queryByPlaceholderText(/One item per line/i)).not.toBeInTheDocument();

    // Clean list items are rendered as bullets
    expect(screen.getByText('Infiltrate the high bastion')).toBeInTheDocument();
    expect(screen.getByText('Steal the ocean crown')).toBeInTheDocument();
    expect(screen.getByText('Escape by sea')).toBeInTheDocument();

    // Click on a list item to enter edit mode
    fireEvent.click(screen.getByText('Infiltrate the high bastion'));

    // Textarea appears
    const listTextarea = screen.getByPlaceholderText(/One item per line/i);
    expect(listTextarea).toBeInTheDocument();
  });

  it('displays folders and filters notes when clicking folder pills', () => {
    const handleChange = vi.fn();
    render(
      <ContextPanel
        blocks={mockBlocks}
        onChange={handleChange}
        storylines={mockStorylines}
        characters={mockCharacters}
        worldItems={mockWorldItems}
      />
    );

    // Both folders are in the folder bar
    const worldbuildingPill = screen.getAllByRole('button', { name: /Worldbuilding/i })[0];
    const plotsPill = screen.getAllByRole('button', { name: /Plots/i })[0];
    expect(worldbuildingPill).toBeInTheDocument();
    expect(plotsPill).toBeInTheDocument();

    // Initially both notes are visible
    expect(screen.getByText('Magic System')).toBeInTheDocument();
    expect(screen.getByText('Plot Objectives')).toBeInTheDocument();

    // Filter by 'Worldbuilding'
    fireEvent.click(worldbuildingPill);

    expect(screen.getByText('Magic System')).toBeInTheDocument();
    expect(screen.queryByText('Plot Objectives')).not.toBeInTheDocument();

    // Filter by 'Plots'
    fireEvent.click(plotsPill);

    expect(screen.queryByText('Magic System')).not.toBeInTheDocument();
    expect(screen.getByText('Plot Objectives')).toBeInTheDocument();

    // Return to All
    fireEvent.click(screen.getByRole('button', { name: /All Notes|Todas las notas/i }));
    expect(screen.getByText('Magic System')).toBeInTheDocument();
    expect(screen.getByText('Plot Objectives')).toBeInTheDocument();
  });

  it('displays badges for storylines, characters, and custom tags and allows tag management', () => {
    const handleChange = vi.fn();
    render(
      <ContextPanel
        blocks={mockBlocks}
        onChange={handleChange}
        storylines={mockStorylines}
        characters={mockCharacters}
        worldItems={mockWorldItems}
      />
    );

    // Badges displayed
    expect(screen.getAllByText('Main Rebellion').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Valerius').length).toBeGreaterThan(0);
    expect(screen.getAllByText('magic').length).toBeGreaterThan(0);
    expect(screen.getAllByText('lore').length).toBeGreaterThan(0);

    // Filter by tag in search
    const searchInput = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'Valerius' } });

    expect(screen.getByText('Magic System')).toBeInTheDocument();
    expect(screen.queryByText('Plot Objectives')).not.toBeInTheDocument();
  });

  it('renders and filters by World Items tags', () => {
    const handleChange = vi.fn();
    render(
      <ContextPanel
        blocks={mockBlocks}
        onChange={handleChange}
        storylines={mockStorylines}
        characters={mockCharacters}
        worldItems={mockWorldItems}
      />
    );

    // World item badge displayed
    expect(screen.getAllByText('High Bastion Citadel').length).toBeGreaterThan(0);

    // Search by world item unique keyword 'Citadel'
    const searchInput = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'Citadel' } });

    expect(screen.getByText('Magic System')).toBeInTheDocument();
    expect(screen.queryByText('Plot Objectives')).not.toBeInTheDocument();
  });

  it('renders a much larger expanded textarea when editing notes (min-h-[260px])', () => {
    const handleChange = vi.fn();
    render(
      <ContextPanel
        blocks={mockBlocks}
        onChange={handleChange}
        storylines={mockStorylines}
        characters={mockCharacters}
        worldItems={mockWorldItems}
      />
    );

    // Click note to enter editing
    fireEvent.click(screen.getByText(/Runic magic drawn from the Oceanic Abyss/i));

    const textarea = screen.getByPlaceholderText(/Write section notes/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea.className).toContain('min-h-[260px]');
    expect(textarea.getAttribute('rows')).toBe('10');
  });

  it('renders full-width outline-like row in line view (layoutCols === 1)', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <ContextPanel
        blocks={mockBlocks}
        onChange={handleChange}
        storylines={mockStorylines}
        characters={mockCharacters}
        worldItems={mockWorldItems}
      />
    );

    // Line view button is active by default (layoutCols === 1)
    const lineViewBtn = screen.getByRole('button', { name: /Line View|Vista de Línea/i });
    expect(lineViewBtn).toBeInTheDocument();

    // Container has full-width column layout
    const listContainer = container.querySelector('.flex.flex-col.gap-2\\.5.w-full');
    expect(listContainer).toBeInTheDocument();
  });

  it('creates a new folder via the top bar', () => {
    const handleChange = vi.fn();
    render(
      <ContextPanel
        blocks={mockBlocks}
        onChange={handleChange}
        storylines={mockStorylines}
        characters={mockCharacters}
        worldItems={mockWorldItems}
      />
    );

    const newFolderBtn = screen.getByRole('button', { name: /New Folder|Nueva Carpeta/i });
    fireEvent.click(newFolderBtn);

    const folderInput = screen.getByPlaceholderText(/Folder name/i);
    fireEvent.change(folderInput, { target: { value: 'Research' } });
    fireEvent.keyDown(folderInput, { key: 'Enter' });

    expect(screen.getByRole('button', { name: /Research/i })).toBeInTheDocument();
  });

  it('reorders notes using shift mode when notesDropMode is shift (default)', () => {
    const handleChange = vi.fn();
    const threeBlocks: ContextBlock[] = [
      { id: 'b-1', title: 'Note 1', type: 'text', content: 'C1' },
      { id: 'b-2', title: 'Note 2', type: 'text', content: 'C2' },
      { id: 'b-3', title: 'Note 3', type: 'text', content: 'C3' },
    ];
    const { container } = render(
      <ContextPanel
        blocks={threeBlocks}
        onChange={handleChange}
        notesDropMode="shift"
      />
    );

    const draggableHeaders = container.querySelectorAll('[draggable="true"]');
    const cards = container.querySelectorAll('.border.rounded-sm.overflow-visible');
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn(() => 'b-1'),
      effectAllowed: 'move',
      dropEffect: 'move',
    };

    // Drag b-1 and drop on b-3 (shift to end)
    fireEvent.dragStart(draggableHeaders[0], { dataTransfer });
    fireEvent.dragOver(cards[2], { dataTransfer });
    fireEvent.drop(cards[2], { dataTransfer });

    expect(handleChange).toHaveBeenCalledWith([
      threeBlocks[1],
      threeBlocks[2],
      threeBlocks[0],
    ]);
  });

  it('swaps note positions when notesDropMode is swap', () => {
    const handleChange = vi.fn();
    const threeBlocks: ContextBlock[] = [
      { id: 'b-1', title: 'Note 1', type: 'text', content: 'C1' },
      { id: 'b-2', title: 'Note 2', type: 'text', content: 'C2' },
      { id: 'b-3', title: 'Note 3', type: 'text', content: 'C3' },
    ];
    const { container } = render(
      <ContextPanel
        blocks={threeBlocks}
        onChange={handleChange}
        notesDropMode="swap"
      />
    );

    const draggableHeaders = container.querySelectorAll('[draggable="true"]');
    const cards = container.querySelectorAll('.border.rounded-sm.overflow-visible');
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn(() => 'b-1'),
      effectAllowed: 'move',
      dropEffect: 'move',
    };

    // Drag b-1 and drop on b-3 (swap b-1 and b-3)
    fireEvent.dragStart(draggableHeaders[0], { dataTransfer });
    fireEvent.dragOver(cards[2], { dataTransfer });
    fireEvent.drop(cards[2], { dataTransfer });

    expect(handleChange).toHaveBeenCalledWith([
      threeBlocks[2],
      threeBlocks[1],
      threeBlocks[0],
    ]);
  });
});
