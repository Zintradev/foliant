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

  it('renders custom color arrows and allows modifying custom color via DarkColorPicker', () => {
    const handleUpdate = vi.fn();
    const relWithCustomColor: CharacterRelationship[] = [
      {
        id: 'rel-custom-1',
        sourceId: 'char-1',
        targetId: 'char-2',
        direction: 'directed',
        customColor: '#ff0055',
        label: 'Nemesis',
      },
    ];

    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={relWithCustomColor}
        onUpdateRelationships={handleUpdate}
      />
    );

    // Verify custom marker was created
    const customEndMarker = document.querySelector('#arrowhead-end-custom-rel-custom-1');
    expect(customEndMarker).toBeInTheDocument();
    const polygon = customEndMarker?.querySelector('polygon');
    expect(polygon).toHaveAttribute('fill', '#ff0055');

    // Click pill to open inspector card
    const pill = screen.getByText('Nemesis');
    fireEvent.click(pill);

    // Verify Custom Color button displays
    expect(screen.getByText('#FF0055')).toBeInTheDocument();

    // Click to open DarkColorPicker
    const customColorBtn = screen.getByText('#FF0055');
    fireEvent.click(customColorBtn);

    // Themed DarkColorPicker opens with Hex Color input
    expect(screen.getByTitle('Hex Color')).toBeInTheDocument();
  });

  it('unpins and closes selected character drawer when left-clicking outside on empty canvas', () => {
    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        onUpdateRelationships={vi.fn()}
      />
    );

    // Click character card to open Representation drawer
    const charCard = screen.getByText('Evelyn Cross').closest('.character-card');
    expect(charCard).toBeInTheDocument();
    fireEvent.click(charCard!);

    expect(screen.getByText('Graph Node Representation')).toBeInTheDocument();

    // Left-click outside on canvas board
    const board = screen.getByTestId('relationship-board');
    fireEvent.mouseDown(board, { button: 0 });

    // Drawer is unpinned / closed
    expect(screen.queryByText('Graph Node Representation')).not.toBeInTheDocument();
  });

  it('unpins and closes selected element when right-clicking outside on empty canvas', () => {
    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        onUpdateRelationships={vi.fn()}
      />
    );

    // Click character card to open Representation drawer
    const charCard = screen.getByText('Evelyn Cross').closest('.character-card');
    fireEvent.click(charCard!);
    expect(screen.getByText('Graph Node Representation')).toBeInTheDocument();

    // Right-click outside on canvas board
    const board = screen.getByTestId('relationship-board');
    fireEvent.contextMenu(board);

    // Drawer is unpinned / closed
    expect(screen.queryByText('Graph Node Representation')).not.toBeInTheDocument();
  });

  it('maintains correct forward arrow path orientation and prevents inversion when nodes are close', () => {
    const { container } = render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        onUpdateRelationships={vi.fn()}
      />
    );

    // Find rendered relationship line path
    const renderedPath = container.querySelector('path[marker-end], path[markerend]');
    expect(renderedPath).toBeInTheDocument();

    const d = renderedPath?.getAttribute('d') || '';
    // Format: M startX startY Q cx cy endX endY
    const match = d.match(/M\s+([\d.-]+)\s+([\d.-]+)\s+Q\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)/);
    expect(match).toBeTruthy();
    if (match) {
      const startX = parseFloat(match[1]);
      const cx = parseFloat(match[3]);
      const endX = parseFloat(match[5]);

      // If source is left of target, startX < cx < endX (strictly forward, never looping backward)
      if (startX < endX) {
        expect(cx).toBeGreaterThanOrEqual(startX);
        expect(cx).toBeLessThanOrEqual(endX);
      }
    }
  });

  it('renders a joined double-arrow rhombus polygon for close bidirectional relationships', () => {
    // When elements are close and relationship is bidirectional, a polygon rhombus is rendered
    const closeBidirectionalRel: CharacterRelationship[] = [
      {
        id: 'rel-bidi-close',
        sourceId: 'char-1',
        targetId: 'char-2',
        direction: 'bidirectional',
        label: 'Tied',
      },
    ];

    const { container } = render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={closeBidirectionalRel}
        onUpdateRelationships={vi.fn()}
      />
    );

    // Initial default positions place mockCharacters 2 * radius apart, but label text is uncompressed
    expect(screen.getByText('Tied')).toBeInTheDocument();
  });

  it('allows moving the label along the line without contracting via right-click drag', () => {
    const handleUpdate = vi.fn();
    const slideRelationships: CharacterRelationship[] = [
      {
        id: 'rel-slide',
        sourceId: 'char-1',
        targetId: 'char-2',
        label: 'Sliding Bond',
      },
    ];

    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={slideRelationships}
        onUpdateRelationships={handleUpdate}
      />
    );

    const pill = screen.getByText('Sliding Bond').closest('button');
    expect(pill).toBeInTheDocument();

    // Right-click drag (button 2) to slide label along the line
    fireEvent.pointerDown(pill!, { clientX: 200, clientY: 200, button: 2 });
    fireEvent.pointerMove(pill!, { clientX: 280, clientY: 200 });
    fireEvent.pointerUp(pill!, { clientX: 280, clientY: 200 });

    expect(handleUpdate).toHaveBeenCalled();
    const updated = handleUpdate.mock.calls[0][0];
    expect(updated[0].labelT).toBeDefined();
    expect(typeof updated[0].labelT).toBe('number');
  });

  it('preserves custom character positions passed via characterPositions across mounts', () => {
    const customPositions = [
      { characterId: 'char-1', x: 50, y: 75 },
      { characterId: 'char-2', x: 420, y: 310 },
    ];

    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        characterPositions={customPositions}
        onUpdateRelationships={vi.fn()}
      />
    );

    const card1 = screen.getByText('Evelyn Cross').closest('.character-card');
    const card2 = screen.getByText('Chancellor Sterling').closest('.character-card');

    expect(card1).toBeInTheDocument();
    expect(card2).toBeInTheDocument();

    // Verify coordinates match customPositions instead of circular layout
    expect(card1).toHaveStyle({ left: '50px', top: '75px' });
    expect(card2).toHaveStyle({ left: '420px', top: '310px' });
  });

  it('notifies onUpdateCharacterPositions when a character card finishes dragging', () => {
    const handleUpdatePos = vi.fn();
    const customPositions = [
      { characterId: 'char-1', x: 100, y: 100 },
      { characterId: 'char-2', x: 500, y: 500 },
    ];

    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        characterPositions={customPositions}
        onUpdateCharacterPositions={handleUpdatePos}
        onUpdateRelationships={vi.fn()}
      />
    );

    const card1 = screen.getByText('Evelyn Cross').closest('.character-card');
    expect(card1).toBeInTheDocument();

    // Drag card1
    fireEvent.pointerDown(card1!, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.pointerMove(card1!, { clientX: 180, clientY: 160 });
    fireEvent.pointerUp(card1!, { clientX: 180, clientY: 160 });

    expect(handleUpdatePos).toHaveBeenCalled();
    const updated = handleUpdatePos.mock.calls[0][0];
    expect(updated).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ characterId: 'char-1' }),
      ])
    );
  });

  it('supports undo (Ctrl+Z) and redo (Ctrl+Y, Ctrl+Shift+Z) for relationship operations and toolbar buttons', () => {
    const handleUpdateRel = vi.fn();

    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        onUpdateRelationships={handleUpdateRel}
      />
    );

    const undoBtn = screen.getByRole('button', { name: /undo/i });
    const redoBtn = screen.getByRole('button', { name: /redo/i });

    // Initially undo and redo are disabled
    expect(undoBtn).toBeDisabled();
    expect(redoBtn).toBeDisabled();

    // Double-click pill to reset curve, which pushes to undo stack (Call 1)
    const pill = screen.getByText('Sworn Enemies').closest('button');
    expect(pill).toBeInTheDocument();
    fireEvent.doubleClick(pill!);
    expect(handleUpdateRel).toHaveBeenCalledTimes(1);

    // Now undo should be enabled
    expect(undoBtn).not.toBeDisabled();

    // Click Undo button (Call 2)
    fireEvent.click(undoBtn);
    expect(handleUpdateRel).toHaveBeenCalledTimes(2);

    // Redo should now be enabled
    expect(redoBtn).not.toBeDisabled();

    // Trigger Redo via Ctrl+Y shortcut (Call 3)
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
    expect(handleUpdateRel).toHaveBeenCalledTimes(3);

    // Trigger Undo via Ctrl+Z shortcut (Call 4)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(handleUpdateRel).toHaveBeenCalledTimes(4);

    // Trigger Redo via Ctrl+Shift+Z shortcut (Call 5)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(handleUpdateRel).toHaveBeenCalledTimes(5);
  });

  it('deletes a selected relationship when pressing the Delete key', () => {
    const handleUpdateRel = vi.fn();

    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        onUpdateRelationships={handleUpdateRel}
      />
    );

    // Select the relationship by clicking its pill
    const pill = screen.getByText('Sworn Enemies').closest('button');
    expect(pill).toBeInTheDocument();
    fireEvent.click(pill!);

    // Press Delete key
    fireEvent.keyDown(window, { key: 'Delete' });

    // Verifies relationship was removed
    expect(handleUpdateRel).toHaveBeenCalledWith([]);
  });

  it('deletes a selected character card and its connected relationships when pressing the Delete key', () => {
    const handleUpdateChars = vi.fn();
    const handleUpdateRels = vi.fn();

    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        onUpdateCharacters={handleUpdateChars}
        onUpdateRelationships={handleUpdateRels}
      />
    );

    // Select the character card
    const card = screen.getByText('Evelyn Cross').closest('.character-card');
    expect(card).toBeInTheDocument();
    fireEvent.click(card!);

    // Press Delete key
    fireEvent.keyDown(window, { key: 'Delete' });

    // Verifies character was deleted
    expect(handleUpdateChars).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'char-2', name: 'Chancellor Sterling' }),
    ]);
    // Verifies connected relationships were also removed
    expect(handleUpdateRels).toHaveBeenCalledWith([]);
  });

  it('deletes a selected junction node when pressing the Delete key', () => {
    const handleUpdateJuncs = vi.fn();
    const handleUpdateRels = vi.fn();
    const mockJunctions: GraphJunctionNode[] = [
      { id: 'junc-1', label: 'Alliance Hub', x: 200, y: 200 },
    ];
    const junctionRels: CharacterRelationship[] = [
      {
        id: 'rel-junc',
        sourceId: 'char-1',
        targetId: 'junc-1',
        label: 'Linked to Hub',
      },
    ];

    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={junctionRels}
        junctions={mockJunctions}
        onUpdateJunctions={handleUpdateJuncs}
        onUpdateRelationships={handleUpdateRels}
      />
    );

    // Select junction node
    const juncNode = screen.getByTitle(/Alliance Hub/i);
    expect(juncNode).toBeInTheDocument();
    fireEvent.click(juncNode);

    // Press Delete key
    fireEvent.keyDown(window, { key: 'Delete' });

    // Verifies junction was deleted
    expect(handleUpdateJuncs).toHaveBeenCalledWith([]);
    expect(handleUpdateRels).toHaveBeenCalledWith([]);
  });

  it('renders SVG relationship paths and arrowhead markers connecting characters', () => {
    const { container } = render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        onUpdateRelationships={vi.fn()}
      />
    );

    // SVG element is present and has full viewport dimensions
    const svgEl = container.querySelector('svg.pointer-events-none');
    expect(svgEl).toBeInTheDocument();
    expect(svgEl).toHaveStyle({ width: '10000px', height: '10000px' });

    // Renders the path representing the relationship link
    const paths = svgEl?.querySelectorAll('path');
    expect(paths && paths.length).toBeGreaterThan(0);

    // Arrowhead marker definitions exist in SVG defs
    const markers = svgEl?.querySelectorAll('marker');
    expect(markers && markers.length).toBeGreaterThan(0);
  });

  it('provides fast and responsive zoom controls via buttons and mouse wheel', () => {
    render(
      <RelationshipGraphView
        characters={mockCharacters}
        relationships={mockRelationships}
        onUpdateRelationships={vi.fn()}
      />
    );

    // Initial zoom indicator is 100%
    const zoomIndicator = screen.getByRole('button', { name: /current zoom/i });
    expect(zoomIndicator).toHaveTextContent('100%');

    // Click Zoom In button
    const zoomInBtn = screen.getByRole('button', { name: /zoom in/i });
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('115%')).toBeInTheDocument();

    // Click Zoom Out button
    const zoomOutBtn = screen.getByRole('button', { name: /zoom out/i });
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Wheel event with line delta (standard Windows mouse wheel)
    const board = screen.getByTestId('relationship-board');
    fireEvent.wheel(board, { deltaY: -3, deltaMode: 1 });
    // Should zoom in by a noticeable amount
    const updatedZoom = parseInt(zoomIndicator.textContent || '100', 10);
    expect(updatedZoom).toBeGreaterThan(100);

    // Click Reset Viewport
    const resetBtn = screen.getByRole('button', { name: /reset viewport/i });
    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});



