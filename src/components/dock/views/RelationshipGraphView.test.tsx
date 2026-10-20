import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import RelationshipGraphView from './RelationshipGraphView';
import {
  CharacterItem,
  CharacterRelationship,
  GraphJunctionNode,
  StorylineItem,
} from '../../../types/dock';

const mockCharacters: CharacterItem[] = [
  {
    id: 'char-1',
    name: 'Evelyn Cross',
    role: 'Protagonist',
    summary: 'Master archivist.',
  },
  {
    id: 'char-2',
    name: 'Chancellor Sterling',
    role: 'Antagonist',
    summary: 'Ruthless lord.',
  },
];

const mockRelationships: CharacterRelationship[] = [
  {
    id: 'rel-1',
    sourceId: 'char-1',
    targetId: 'char-2',
    type: 'Enmity',
    label: 'Sworn Enemies',
    notes: 'Bitter conflict over the cipher.',
  },
];

describe('RelationshipGraphView', () => {
  it('renders character cards and relationship label pills', () => {
    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        onUpdateRelationships={vi.fn()}
      />
    );

    // Characters rendered on board
    expect(screen.getByText('Evelyn Cross')).toBeInTheDocument();
    expect(screen.getByText('Chancellor Sterling')).toBeInTheDocument();

    // Relationship pill rendered
    expect(screen.getByText('Sworn Enemies')).toBeInTheDocument();
  });

  it('inspects a relationship when clicking its label pill and allows deletion', () => {
    const handleUpdate = vi.fn();
    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        onUpdateRelationships={handleUpdate}
      />
    );

    const pill = screen.getByText('Sworn Enemies');
    fireEvent.click(pill);

    // Inspector shows details
    expect(
      screen.getByText('Bitter conflict over the cipher.')
    ).toBeInTheDocument();

    // Click delete connection
    const deleteBtn = screen.getByRole('button', { name: /Delete Connection/i });
    fireEvent.click(deleteBtn);

    expect(handleUpdate).toHaveBeenCalledWith([]);
  });

  it('allows opening connection creator and saving a new relationship', () => {
    const handleUpdate = vi.fn();
    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={[]}
        onUpdateRelationships={handleUpdate}
      />
    );

    const connectBtn = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectBtn);

    // Modal appears
    expect(screen.getByText('Define Character Connection')).toBeInTheDocument();

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Create Connection/i });
    fireEvent.click(submitBtn);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    const saved = handleUpdate.mock.calls[0][0];
    expect(saved.length).toBe(1);
    expect(saved[0].sourceId).toBe('char-1');
  });

  it('connects two cards via double-click on first card and clicking second card', () => {
    let capturedRels: CharacterRelationship[] = [];
    const TestComponent = () => {
      const [rels, setRels] = useState<CharacterRelationship[]>([]);
      return (
        <RelationshipGraphView
          characters={mockCharacters}
          relationships={rels}
          onUpdateRelationships={(newRels) => {
            capturedRels = newRels;
            setRels(newRels);
          }}
        />
      );
    };

    render(<TestComponent />);

    // Double-click Evelyn Cross card to enter connecting mode
    const card1 = screen.getByText('Evelyn Cross').closest('div');
    expect(card1).toBeInTheDocument();
    fireEvent.doubleClick(card1!);

    // Banner indicates connecting mode
    expect(screen.getByText(/Click target character to connect with "Evelyn Cross"/i)).toBeInTheDocument();

    // Click Chancellor Sterling card to create connection
    const card2 = screen.getByText('Chancellor Sterling').closest('div');
    fireEvent.click(card2!);

    // Captured relationships updated
    expect(capturedRels.length).toBe(1);
    expect(capturedRels[0].sourceId).toBe('char-1');
    expect(capturedRels[0].targetId).toBe('char-2');
    expect(capturedRels[0].style).toBe('solid');

    // Inspector popover opens for the new relationship
    expect(screen.getByText('Relationship Line Inspector')).toBeInTheDocument();
  });

  it('cancels connecting mode when pressing Escape key', () => {
    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={[]}
        onUpdateRelationships={vi.fn()}
      />
    );

    const card1 = screen.getByText('Evelyn Cross').closest('div');
    fireEvent.doubleClick(card1!);
    expect(screen.getByText(/Click target character to connect/i)).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText(/Click target character to connect/i)).not.toBeInTheDocument();
  });

  it('opens character representation drawer when clicking pencil icon and reassigns character', () => {
    const handleUpdateRels = vi.fn();
    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        onUpdateRelationships={handleUpdateRels}
      />
    );

    const editBtn = screen.getByTitle('Edit "Evelyn Cross" representation');
    fireEvent.click(editBtn);

    // Drawer opens
    expect(screen.getByText('Graph Node Representation')).toBeInTheDocument();

    // Select different character from dropdown
    const select = screen.getByDisplayValue(/Evelyn Cross/i);
    fireEvent.change(select, { target: { value: 'char-2' } });

    // Relationships targeting or sourced from char-1 are migrated to char-2
    expect(handleUpdateRels).toHaveBeenCalled();
  });

  it('customizes relationship line style, color, and direction from inspector popover', () => {
    let currentRels = mockRelationships;
    const handleUpdateRel = vi.fn((newRels) => {
      currentRels = newRels;
    });
    const { rerender } = render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={currentRels}
        onUpdateRelationships={handleUpdateRel}
      />
    );

    // Click label pill to open inspector
    const pill = screen.getByText('Sworn Enemies');
    fireEvent.click(pill);

    // Change stroke to dashed
    const dashedBtn = screen.getByRole('button', { name: /dashed/i });
    fireEvent.click(dashedBtn);
    expect(handleUpdateRel).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'rel-1', style: 'dashed' }),
    ]);

    // Rerender with updated relationship
    rerender(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={currentRels}
        onUpdateRelationships={handleUpdateRel}
      />
    );

    // Change direction to directed
    const directedBtn = screen.getByRole('button', { name: /Directed/i });
    fireEvent.click(directedBtn);
    expect(handleUpdateRel).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'rel-1', direction: 'directed' }),
    ]);

    // Rerender with updated relationship
    rerender(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={currentRels}
        onUpdateRelationships={handleUpdateRel}
      />
    );

    // Use Reverse button
    const reverseBtn = screen.getByRole('button', { name: /Reverse/i });
    fireEvent.click(reverseBtn);
    expect(handleUpdateRel).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'rel-1', direction: 'reverse' }),
    ]);

    // Rerender with updated relationship
    rerender(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={currentRels}
        onUpdateRelationships={handleUpdateRel}
      />
    );

    // Use None (Undirected) button
    const noneBtn = screen.getByRole('button', { name: /None/i });
    fireEvent.click(noneBtn);
    expect(handleUpdateRel).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'rel-1', direction: 'none' }),
    ]);
  });

  it('creates a union node from canvas context menu and allows linking to it', () => {
    let currentRels: CharacterRelationship[] = [];
    const TestComponent = () => {
      const [rels, setRels] = useState<CharacterRelationship[]>([]);
      return (
        <RelationshipGraphView
          characters={mockCharacters}
          relationships={rels}
          onUpdateRelationships={(newRels) => {
            currentRels = newRels;
            setRels(newRels);
          }}
        />
      );
    };

    render(<TestComponent />);

    // Right-click empty canvas to open context menu
    const board = screen.getByTestId('relationship-board');
    fireEvent.contextMenu(board, { clientX: 250, clientY: 200 });

    // Click "Add Union Node"
    const addUnionBtn = screen.getByRole('button', { name: /Add Union Node/i });
    expect(addUnionBtn).toBeInTheDocument();
    fireEvent.click(addUnionBtn);

    // Verify union node rendered with title
    const unionNode = screen.getByTitle(/Union Node/i);
    expect(unionNode).toBeInTheDocument();

    // Double-click Evelyn Cross to enter connecting mode
    const card1 = screen.getByText('Evelyn Cross').closest('.rounded-sm');
    fireEvent.doubleClick(card1!);

    // Click union node to create connection
    fireEvent.click(unionNode);

    // Connection created between Evelyn Cross and Union Node
    expect(currentRels.length).toBe(1);
    expect(currentRels[0].sourceId).toBe('char-1');
    expect(currentRels[0].targetId).toMatch(/^junction-/);
  });

  it('links union node to storyline and displays storyline badge', () => {
    const mockStorylines: StorylineItem[] = [
      {
        id: 'story-1',
        title: 'Throne Succession',
        color: 'purple',
        description: 'Succession crisis plotline',
        linkedChapterIds: [],
        status: 'Active',
      },
    ];
    const mockJunctions: GraphJunctionNode[] = [
      {
        id: 'junc-1',
        label: 'Alliance Union',
        x: 200,
        y: 200,
      },
    ];
    const handleUpdateJunc = vi.fn();

    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={[]}
        junctions={mockJunctions}
        storylines={mockStorylines}
        onUpdateJunctions={handleUpdateJunc}
      />
    );

    // Click union node to inspect
    const juncNode = screen.getByTitle(/Alliance Union/i);
    fireEvent.click(juncNode);

    expect(screen.getByText('Union Node Inspector')).toBeInTheDocument();

    // Link to storyline
    const storylineSelect = screen.getByDisplayValue('No Storyline (Independent)');
    fireEvent.change(storylineSelect, { target: { value: 'story-1' } });

    expect(handleUpdateJunc).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'junc-1', storylineId: 'story-1' }),
    ]);
  });

  it('pans the canvas with left click on empty space without opening context menu', () => {
    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={[]}
      />
    );

    const board = screen.getByTestId('relationship-board');
    expect(board).toHaveClass('cursor-grab');

    // Left click and drag on empty canvas space
    fireEvent.mouseDown(board, { button: 0, clientX: 100, clientY: 100 });
    expect(board).toHaveClass('cursor-grabbing');

    fireEvent.mouseMove(window, { clientX: 180, clientY: 160 });
    fireEvent.mouseUp(window);
    expect(board).toHaveClass('cursor-grab');

    // Context menu is NOT opened by left click
    expect(screen.queryByText('Canvas Actions')).not.toBeInTheDocument();
  });

  it('opens context menu on right click and closes on Escape', () => {
    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={[]}
      />
    );

    const board = screen.getByTestId('relationship-board');

    // Right click
    fireEvent.contextMenu(board, { clientX: 300, clientY: 250 });
    expect(screen.getByText('Canvas Actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Character/i })).toBeInTheDocument();

    // Escape closes context menu
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Canvas Actions')).not.toBeInTheDocument();
  });

  it('supports trackpad pinch-to-zoom with ctrlKey and prevents native touch actions', () => {
    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={[]}
      />
    );

    const board = screen.getByTestId('relationship-board');
    expect(board).toBeInTheDocument();
    expect(board.className).toContain('touch-none');
    expect(board.style.touchAction).toBe('none');

    // Trackpad pinch-to-zoom (ctrlKey: true)
    fireEvent.wheel(board, { ctrlKey: true, deltaY: -30 });
    expect(screen.queryByText('100%')).not.toBeInTheDocument();

    // WebKit gesture prevention
    const gestureEvent = new Event('gesturestart', { bubbles: true, cancelable: true });
    board.dispatchEvent(gestureEvent);
    expect(gestureEvent.defaultPrevented).toBe(true);

    // Reset button restores 100%
    const resetBtn = screen.getByTitle(/Reset Zoom/i);
    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('enters Draw Connection mode on node right-click and connects to second node on click', () => {
    let currentRels: CharacterRelationship[] = [];
    const TestComponent = () => {
      const [rels, setRels] = useState<CharacterRelationship[]>([]);
      return (
        <RelationshipGraphView
          characters={mockCharacters}
          relationships={rels}
          onUpdateRelationships={(newRels) => {
            currentRels = newRels;
            setRels(newRels);
          }}
        />
      );
    };

    render(<TestComponent />);

    // Right-click Evelyn Cross card
    const card1 = screen.getByText('Evelyn Cross').closest('.character-card');
    expect(card1).toBeInTheDocument();
    fireEvent.contextMenu(card1!);

    // Banner indicates connecting mode
    expect(screen.getByText(/Click target character to connect with "Evelyn Cross"/i)).toBeInTheDocument();

    // Context menu for empty canvas must NOT appear
    expect(screen.queryByText('Canvas Actions')).not.toBeInTheDocument();

    // Click target card (Chancellor Sterling) to complete connection
    const card2 = screen.getByText('Chancellor Sterling').closest('.character-card');
    fireEvent.click(card2!);

    // Relationship is created immediately with directed arrow
    expect(currentRels.length).toBe(1);
    expect(currentRels[0].sourceId).toBe('char-1');
    expect(currentRels[0].targetId).toBe('char-2');
    expect(currentRels[0].direction).toBe('directed');
  });

  it('switches cursors to crosshair on board and pointer on cards during connection mode', () => {
    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={[]}
        onUpdateRelationships={vi.fn()}
      />
    );

    const board = screen.getByTestId('relationship-board');
    const card1 = screen.getByText('Evelyn Cross').closest('.character-card')!;
    const card2 = screen.getByText('Chancellor Sterling').closest('.character-card')!;

    // Initial state: canvas and cards have grab/move cursors
    expect(board.className).toContain('cursor-grab');
    expect(card1.className).toContain('cursor-move');
    expect(card2.className).toContain('cursor-move');

    // Right-click Evelyn Cross to enter connection mode
    fireEvent.contextMenu(card1);

    // Board switches to cursor-crosshair
    expect(board.className).toContain('cursor-crosshair');
    expect(board.className).not.toContain('cursor-grab');

    // Target card switches to cursor-pointer
    expect(card2.className).toContain('cursor-pointer');
    expect(card2.className).not.toContain('cursor-move');

    // Source card switches to cursor-not-allowed
    expect(card1.className).toContain('cursor-not-allowed');
  });

  it('renders SVG path without marker-end and marker-start when direction is none', () => {
    const noneRel: CharacterRelationship = {
      id: 'rel-none',
      sourceId: 'char-1',
      targetId: 'char-2',
      direction: 'none',
      label: 'Neutral Link',
    };

    const { container } = render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={[noneRel]}
      />
    );

    // Find rendered visible path for relationship
    const paths = container.querySelectorAll('svg path.transition-all');
    expect(paths.length).toBe(1);
    const relPath = paths[0];

    expect(relPath.getAttribute('marker-end')).toBeNull();
    expect(relPath.getAttribute('marker-start')).toBeNull();
  });

  it('reliably opens edit drawer on single click with onPointerDown stopPropagation', () => {
    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={[]}
      />
    );

    const editBtn = screen.getByTitle('Edit "Evelyn Cross" representation');

    // Simulate pointerdown and click on edit button
    const pointerDownEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true });
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

    fireEvent(editBtn, pointerDownEvent);
    fireEvent(editBtn, clickEvent);

    expect(screen.getByText('Graph Node Representation')).toBeInTheDocument();
  });

  it('hides header title and stats when compact and renders them when expanded', () => {
    const { rerender } = render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        isExpanded={false}
      />
    );

    // In compact/docked view, title and stats are hidden
    expect(screen.queryByText('Relationship Board')).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+ characters/i)).not.toBeInTheDocument();

    // In expanded view, title and stats are rendered
    rerender(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        isExpanded={true}
      />
    );

    expect(screen.getByText('Relationship Board')).toBeInTheDocument();
    expect(screen.getByText(/2 characters • 0 unions • 1 links/i)).toBeInTheDocument();
  });

  it('renders quadratic Bézier curve (Q path) passing through relationship control point', () => {
    const customRelationships: CharacterRelationship[] = [
      {
        id: 'rel-curve',
        sourceId: 'char-1',
        targetId: 'char-2',
        type: 'Alliance',
        label: 'Flexible Bond',
        controlOffset: { x: 50, y: -40 },
      },
    ];

    const { container } = render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={customRelationships}
        onUpdateRelationships={vi.fn()}
      />
    );

    const paths = container.querySelectorAll('path');
    const qPaths = Array.from(paths).filter((p) => p.getAttribute('d')?.includes('Q'));
    expect(qPaths.length).toBeGreaterThanOrEqual(1);
  });

  it('allows dragging relationship label pill to update controlOffset and double-clicking to reset', () => {
    const handleUpdate = vi.fn();
    const customRelationships: CharacterRelationship[] = [
      {
        id: 'rel-curve-1',
        sourceId: 'char-1',
        targetId: 'char-2',
        type: 'Alliance',
        label: 'Allies & Bonds',
      },
    ];

    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={customRelationships}
        onUpdateRelationships={handleUpdate}
      />
    );

    const pill = screen.getByText('Allies & Bonds').closest('button');
    expect(pill).toBeInTheDocument();

    // Simulate pointerdown and drag on the pill
    fireEvent.pointerDown(pill!, { clientX: 200, clientY: 200, button: 0 });
    fireEvent.pointerMove(pill!, { clientX: 250, clientY: 220 });
    fireEvent.pointerUp(pill!, { clientX: 250, clientY: 220 });

    expect(handleUpdate).toHaveBeenCalled();
    const updatedRels = handleUpdate.mock.calls[0][0];
    expect(updatedRels[0].controlOffset).toBeDefined();

    // Simulate double click to reset/straighten
    fireEvent.doubleClick(pill!);
    const resetCall = handleUpdate.mock.calls[handleUpdate.mock.calls.length - 1][0];
    expect(resetCall[0].controlOffset).toBeUndefined();
  });
});


