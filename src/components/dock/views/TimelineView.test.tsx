import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import TimelineView from './TimelineView';
import { TextNode } from '../../../types/project';
import { StorylineItem, CharacterItem } from '../../../types/dock';

const mockChapters: TextNode[] = [
  {
    id: 'scene-1',
    title: 'The Secret Meeting',
    content: 'Lanterns flickered in the fog.',
    synopsis: 'First clandestine rendezvous.',
    type: 'scene',
    parentId: null,
    targetWords: 3000,
    status: 'In Progress',
    attachedCharacterIds: ['char-1'],
  },
  {
    id: 'scene-2',
    title: 'The Confrontation',
    content: 'Sword met shield in the dark alley.',
    synopsis: 'Ambush at midnight.',
    type: 'scene',
    parentId: null,
    targetWords: 3500,
    status: 'Not Started',
    attachedCharacterIds: [],
  },
];

const mockStorylines: StorylineItem[] = [
  {
    id: 'story-1',
    title: 'Crown Conspiracy',
    color: 'purple',
    description: 'Infiltration of the royal council.',
    linkedChapterIds: ['scene-1'],
    status: 'Active',
  },
];

const mockCharacters: CharacterItem[] = [
  {
    id: 'char-1',
    name: 'Evelyn Cross',
    role: 'Protagonist',
    summary: 'Master archivist with an eye for codes.',
  },
  {
    id: 'char-2',
    name: 'Sterling',
    role: 'Antagonist',
    summary: 'Ruthless lord.',
  },
];

describe('TimelineView', () => {
  it('renders scenes in chronological order with attached markers', () => {
    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    // Scenes rendered
    expect(screen.getByText('The Secret Meeting')).toBeInTheDocument();
    expect(screen.getByText('The Confrontation')).toBeInTheDocument();

    // Attached markers (button elements with text)
    const markerStoryline = screen.getByRole('button', {
      name: 'Crown Conspiracy',
    });
    expect(markerStoryline).toBeInTheDocument();

    const markerCharacter = screen.getByRole('button', {
      name: 'Evelyn Cross',
    });
    expect(markerCharacter).toBeInTheDocument();
  });

  it('opens floating popover with details on clicking a storyline marker', () => {
    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    const marker = screen.getByRole('button', {
      name: 'Crown Conspiracy',
    });
    fireEvent.click(marker);

    // Popover shows description and detach action
    expect(
      screen.getByText('Infiltration of the royal council.')
    ).toBeInTheDocument();
    expect(screen.getByText('Detach from Scene')).toBeInTheDocument();
  });

  it('allows attaching an unattached character to a scene', () => {
    const handleUpdateChapter = vi.fn();

    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
        onUpdateChapter={handleUpdateChapter}
      />
    );

    // Click "+ Character" on the second scene
    const attachButtons = screen.getAllByTitle('Attach character to scene');
    fireEvent.click(attachButtons[1]);

    // In the opened menu, click Sterling button
    const menu = document.querySelector('.attach-dropdown-menu');
    expect(menu).not.toBeNull();
    const option = within(menu as HTMLElement).getByText('Sterling');
    fireEvent.click(option);

    expect(handleUpdateChapter).toHaveBeenCalledWith('scene-2', {
      attachedCharacterIds: ['char-2'],
    });
  });

  it('handles zoom in, zoom out, and reset zoom controls', () => {
    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    // Initial zoom 100%
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Zoom in
    const zoomInBtn = screen.getByTitle(/Zoom In/i);
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('110%')).toBeInTheDocument();

    // Zoom out twice
    const zoomOutBtn = screen.getByTitle(/Zoom Out/i);
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('90%')).toBeInTheDocument();

    // Reset zoom
    const resetBtn = screen.getByTitle(/Reset Zoom/i);
    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('supports trackpad pinch-to-zoom with ctrlKey and prevents native touch actions', () => {
    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    const canvas = screen.getByTestId('timeline-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas.className).toContain('touch-none');
    expect(canvas.style.touchAction).toBe('none');

    // Trackpad pinch-to-zoom (ctrlKey: true)
    fireEvent.wheel(canvas, {
      ctrlKey: true,
      deltaY: -30,
    });
    expect(screen.queryByText('100%')).not.toBeInTheDocument();

    // WebKit gesture prevention
    const gestureEvent = new Event('gesturestart', { bubbles: true, cancelable: true });
    canvas.dispatchEvent(gestureEvent);
    expect(gestureEvent.defaultPrevented).toBe(true);
  });

  it('renders SVG connector layer with overflow visible to prevent clipping', () => {
    const { container } = render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    const svg = container.querySelector('svg.overflow-visible');
    expect(svg).not.toBeNull();
    expect(svg).toHaveStyle('overflow: visible');
  });

  it('handles free canvas pan dragging with mouse', () => {
    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    const canvas = screen.getByTestId('timeline-canvas');
    expect(canvas).toHaveClass('cursor-grab');

    // Pan with mouse down on empty canvas
    fireEvent.mouseDown(canvas, { button: 0, clientX: 200, clientY: 200 });
    expect(canvas).toHaveClass('cursor-grabbing');

    // Drag canvas
    fireEvent.mouseMove(window, { clientX: 280, clientY: 240 });
    fireEvent.mouseUp(window);
    expect(canvas).toHaveClass('cursor-grab');
  });

  it('supports spacebar modifier for hand grab navigation', () => {
    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    const canvas = screen.getByTestId('timeline-canvas');

    // Press space
    fireEvent.keyDown(window, { code: 'Space' });
    expect(canvas).toHaveClass('cursor-grab');

    // Release space
    fireEvent.keyUp(window, { code: 'Space' });
  });

  it('highlights active scene card cleanly without redundant selection dots', () => {
    const { container } = render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    const activeTitle = screen.getByText('The Secret Meeting');
    const activeCard = activeTitle.closest('.rounded-sm');
    expect(activeCard).toHaveClass('border-zinc-300');

    // Confirm that the old redundant selection dot wrapper is eliminated
    const oldDots = container.querySelectorAll('.w-3\\.5.h-3\\.5.rounded-full.border-2');
    expect(oldDots.length).toBe(0);
  });

  it('supports dragging cards to reposition them freely without triggering canvas pan', () => {
    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    const canvas = screen.getByTestId('timeline-canvas');
    const card = screen.getByText('The Secret Meeting').closest('.rounded-sm');
    expect(card).toBeInTheDocument();

    // Mouse down on card should not make canvas enter grabbing
    fireEvent.mouseDown(card!, { clientX: 200, clientY: 100 });
    expect(canvas).toHaveClass('cursor-grab');

    // Drag mouse
    fireEvent.mouseMove(window, { clientX: 250, clientY: 180 });
    fireEvent.mouseUp(window);

    // Card has new position applied
    expect(card).toHaveStyle('position: absolute');
  });

  it('renders key event marker badges and opens the interactive popover on click', () => {
    const chaptersWithMarkers: TextNode[] = [
      {
        ...mockChapters[0],
        markers: [
          {
            id: 'm-1',
            title: 'Plot Twist: Betrayal',
            description: 'Sterling orders the city guard to arrest the archivist.',
            icon: 'alert',
            color: 'rose',
          },
        ],
      },
    ];

    render(
      <TimelineView
        chapters={chaptersWithMarkers}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    // Marker badge visible on the card
    const markerBadge = screen.getByText('Plot Twist: Betrayal');
    expect(markerBadge).toBeInTheDocument();

    // Click marker badge opens the popover
    fireEvent.click(markerBadge);

    expect(screen.getByText('Event Marker / Alert')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Plot Twist: Betrayal')
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        'Sterling orders the city guard to arrest the archivist.'
      )
    ).toBeInTheDocument();
  });

  it('adds a new marker when clicking "+ Alert / Marker" and invokes onUpdateChapter', () => {
    const handleUpdateChapter = vi.fn();

    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
        onUpdateChapter={handleUpdateChapter}
      />
    );

    const addAlertBtns = screen.getAllByTitle(
      'Add key event milestone or alert to this scene'
    );
    expect(addAlertBtns.length).toBeGreaterThan(0);

    fireEvent.click(addAlertBtns[0]);

    expect(handleUpdateChapter).toHaveBeenCalledWith(
      'scene-1',
      expect.objectContaining({
        markers: expect.arrayContaining([
          expect.objectContaining({
            title: 'Key Event / Alert',
            icon: 'alert',
            color: 'rose',
          }),
        ]),
      })
    );
  });

  it('updates marker title, color, icon and allows deleting marker', () => {
    const handleUpdateChapter = vi.fn();
    const chaptersWithMarkers: TextNode[] = [
      {
        ...mockChapters[0],
        markers: [
          {
            id: 'm-1',
            title: 'Ancient Cipher',
            description: 'Uncovered in the secret vault.',
            icon: 'star',
            color: 'amber',
          },
        ],
      },
    ];

    render(
      <TimelineView
        chapters={chaptersWithMarkers}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
        onUpdateChapter={handleUpdateChapter}
      />
    );

    // Open popover
    const badge = screen.getByText('Ancient Cipher');
    fireEvent.click(badge);

    // Change title
    const titleInput = screen.getByDisplayValue('Ancient Cipher');
    fireEvent.change(titleInput, { target: { value: 'Ancient Cipher Solved' } });

    expect(handleUpdateChapter).toHaveBeenCalledWith('scene-1', {
      markers: [
        expect.objectContaining({
          id: 'm-1',
          title: 'Ancient Cipher Solved',
        }),
      ],
    });

    // Change color to cyan
    const cyanBtn = screen.getByRole('button', { name: /cyan/i });
    fireEvent.click(cyanBtn);
    expect(handleUpdateChapter).toHaveBeenCalledWith('scene-1', {
      markers: [
        expect.objectContaining({
          id: 'm-1',
          color: 'cyan',
        }),
      ],
    });

    // Delete marker
    const deleteBtn = screen.getByRole('button', { name: /Delete Marker/i });
    fireEvent.click(deleteBtn);
    expect(handleUpdateChapter).toHaveBeenCalledWith('scene-1', {
      markers: [],
    });
  });

  it('does not close the marker popover on canvas pan mouse down', () => {
    const chaptersWithMarkers: TextNode[] = [
      {
        ...mockChapters[0],
        markers: [
          {
            id: 'm-1',
            title: 'Climax Duel',
            icon: 'skull',
            color: 'rose',
          },
        ],
      },
    ];

    render(
      <TimelineView
        chapters={chaptersWithMarkers}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    // Open popover
    const badge = screen.getByText('Climax Duel');
    fireEvent.click(badge);
    expect(screen.getByText('Event Marker / Alert')).toBeInTheDocument();

    // Canvas background mouse down (panning)
    const canvas = screen.getByTestId('timeline-canvas');
    fireEvent.mouseDown(canvas, { button: 0, clientX: 10, clientY: 10 });

    // Popover remains open
    expect(screen.getByText('Event Marker / Alert')).toBeInTheDocument();
  });
});

