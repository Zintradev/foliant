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
    plotStates: [{ storylineId: 'story-1', status: 'Active' }],
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
  it('renders scenes in grouped chapter lanes layout', () => {
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

    // Attached markers / plot thread badges
    const markerStoryline = screen.getByRole('button', {
      name: /Crown Conspiracy/i,
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
      name: /Crown Conspiracy/i,
    });
    fireEvent.click(marker);

    // Popover shows description and detach action
    expect(
      screen.getAllByText('Infiltration of the royal council.').length
    ).toBeGreaterThanOrEqual(1);
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

  it('allows switching layout modes between Subway Map and Chapter Lanes', () => {
    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    // Subway Map is default view
    expect(screen.getByText('Storyline Tracks')).toBeInTheDocument();

    // Click Chapter Lanes button
    const lanesBtn = screen.getByRole('button', { name: /Chapter Lanes/i });
    fireEvent.click(lanesBtn);

    expect(screen.getAllByText('Chapter Lanes').length).toBeGreaterThan(0);

    // Switch back to Subway Map
    const subwayBtn = screen.getByRole('button', { name: /Subway Map/i });
    fireEvent.click(subwayBtn);
    expect(screen.getByText('Storyline Tracks')).toBeInTheDocument();
  });

  it('highlights active scene card cleanly', () => {
    render(
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

  it('adds a new marker when clicking "+ Alert" and invokes onUpdateChapter', () => {
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
    const cyanBtn = screen.getByRole('button', { name: /Color: cyan/i });
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

  it('renders Subway Map with storyline tracks and interactive station nodes', () => {
    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    // Switch to Subway Map
    const subwayBtn = screen.getByRole('button', { name: /Subway Map/i });
    fireEvent.click(subwayBtn);

    // Header tracks label present
    expect(screen.getByText('Storyline Tracks')).toBeInTheDocument();

    // Storyline left header present
    expect(screen.getAllByText('Crown Conspiracy').length).toBeGreaterThan(0);

    // Circular Subway station node present on track
    const stationNode = screen.getByRole('button', {
      name: /Crown Conspiracy at The Secret Meeting/i,
    });
    expect(stationNode).toBeInTheDocument();

    // Clicking station node opens the plot popover
    fireEvent.click(stationNode);
    expect(
      screen.getAllByText('Infiltration of the royal council.').length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Detach from Scene')).toBeInTheDocument();
  });

  it('compresses consecutive inactive scenes into [...] gap spacer and expands when clicked', () => {
    const chaptersWithGap: TextNode[] = [
      ...mockChapters,
      {
        id: 'scene-3',
        title: 'Quiet Morning',
        content: 'Birds chirped.',
        type: 'scene',
        parentId: null,
        targetWords: 1000,
        status: 'In Progress',
        attachedCharacterIds: [],
        plotStates: [],
      },
      {
        id: 'scene-4',
        title: 'Market Day',
        content: 'Apples were sold.',
        type: 'scene',
        parentId: null,
        targetWords: 1500,
        status: 'In Progress',
        attachedCharacterIds: [],
        plotStates: [],
      },
    ];

    render(
      <TimelineView
        chapters={chaptersWithGap}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    // Switch to Subway Map
    const subwayBtn = screen.getByRole('button', { name: /Subway Map/i });
    fireEvent.click(subwayBtn);

    // In Subway Map, all scenes are always fully rendered and never compressed into [...]
    expect(screen.queryByText('[...]')).not.toBeInTheDocument();
    expect(screen.getByText('Quiet Morning')).toBeInTheDocument();
    expect(screen.getByText('Market Day')).toBeInTheDocument();
  });

  it('keeps storyline and character filters independent and applies additive AND filtering', () => {
    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    const selects = screen.getAllByRole('combobox');
    const plotSelect = selects[0];
    const castSelect = selects[1];

    // Switch to Chapter Lanes to inspect chapter lane scene cards
    fireEvent.click(screen.getByRole('button', { name: /Chapter Lanes/i }));

    // Select storyline filter
    fireEvent.change(plotSelect, { target: { value: 'story-1' } });
    expect(plotSelect).toHaveValue('story-1');

    // Select character filter - storyline filter MUST NOT reset to 'all'
    fireEvent.change(castSelect, { target: { value: 'char-1' } });
    expect(plotSelect).toHaveValue('story-1');
    expect(castSelect).toHaveValue('char-1');

    // Scene 1 matches both story-1 and char-1 -> participates (not dimmed)
    const scene1Card = screen.getByText('The Secret Meeting').closest('.min-w-\\[240px\\]');
    expect(scene1Card).not.toHaveClass('opacity-35');

    // Scene 2 matches neither -> dimmed
    const scene2Card = screen.getByText('The Confrontation').closest('.min-w-\\[240px\\]');
    expect(scene2Card).toHaveClass('opacity-35');
  });

  it('renders empty folders as a compact structural divider without empty scene block', () => {
    const chaptersWithEmptyFolder: TextNode[] = [
      {
        id: 'folder-empty',
        title: 'Act II: The Descent',
        content: '',
        type: 'folder',
        parentId: null,
      },
      ...mockChapters,
    ];

    render(
      <TimelineView
        chapters={chaptersWithEmptyFolder}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    // Switch to Chapter Lanes view where structural folders are rendered
    fireEvent.click(screen.getByRole('button', { name: /Chapter Lanes/i }));

    // Empty folder title is rendered as divider
    expect(screen.getByText('Act II: The Descent')).toBeInTheDocument();
    expect(screen.getByText('(Folder)')).toBeInTheDocument();

    // No empty section placeholder text
    expect(screen.queryByText(/No scenes inside this section/i)).not.toBeInTheDocument();
  });

  it('renders visual indicators for plot states (Dormant with text and Resolved with text/line-through)', () => {
    const chaptersWithPlotStates: TextNode[] = [
      {
        id: 'scene-states',
        title: 'The Crossroads',
        content: 'Forks in the road.',
        type: 'scene',
        parentId: null,
        targetWords: 2000,
        status: 'In Progress',
        attachedCharacterIds: [],
        plotStates: [
          { storylineId: 'story-1', status: 'Dormant' },
        ],
      },
    ];

    const { rerender } = render(
      <TimelineView
        chapters={chaptersWithPlotStates}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-states"
        onSelectChapter={vi.fn()}
      />
    );

    // Dormant state reflects visual indicator
    expect(screen.getByText('(Dormant)')).toBeInTheDocument();

    // Now test Resolved state
    const chaptersResolved: TextNode[] = [
      {
        ...chaptersWithPlotStates[0],
        plotStates: [
          { storylineId: 'story-1', status: 'Resolved' },
        ],
      },
    ];

    rerender(
      <TimelineView
        chapters={chaptersResolved}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-states"
        onSelectChapter={vi.fn()}
      />
    );

    expect(screen.getByText('(Resolved)')).toBeInTheDocument();
  });

  it('supports controlled storyline and character filters', () => {
    const handleStorylineFilter = vi.fn();
    const handleCharacterFilter = vi.fn();

    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
        selectedStorylineFilter="story-1"
        onStorylineFilterChange={handleStorylineFilter}
        selectedCharacterFilter="char-1"
        onCharacterFilterChange={handleCharacterFilter}
      />
    );

    const storylineSelect = screen.getByDisplayValue('Crown Conspiracy');
    fireEvent.change(storylineSelect, { target: { value: 'all' } });
    expect(handleStorylineFilter).toHaveBeenCalledWith('all');

    const characterSelect = screen.getByDisplayValue('Evelyn Cross');
    fireEvent.change(characterSelect, { target: { value: 'all' } });
    expect(handleCharacterFilter).toHaveBeenCalledWith('all');
  });

  it('executes swap reordering when timelineDropMode is swap', () => {
    const multipleStorylines: StorylineItem[] = [
      { id: 'st-1', title: 'Plot Alpha', color: 'emerald', description: '', linkedChapterIds: [] },
      { id: 'st-2', title: 'Plot Beta', color: 'rose', description: '', linkedChapterIds: [] },
    ];
    const handleUpdate = vi.fn();

    render(
      <TimelineView
        chapters={mockChapters}
        storylines={multipleStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
        onUpdateStorylines={handleUpdate}
        timelineDropMode="swap"
      />
    );

    const plotAlphaHeader = screen.getByRole('heading', { name: 'Plot Alpha' });
    const plotBetaHeader = screen.getByRole('heading', { name: 'Plot Beta' });

    const alphaTrack = plotAlphaHeader.closest('[draggable="true"]');
    const betaContainer = plotBetaHeader.closest('[draggable="true"]');

    expect(alphaTrack).toBeTruthy();
    expect(betaContainer).toBeTruthy();

    if (alphaTrack && betaContainer) {
      fireEvent.dragStart(alphaTrack, {
        dataTransfer: { setData: vi.fn(), effectAllowed: 'move' },
      });
      fireEvent.dragEnter(betaContainer);
      fireEvent.dragOver(betaContainer, { dataTransfer: { dropEffect: 'move' } });
      fireEvent.drop(betaContainer);

      expect(handleUpdate).toHaveBeenCalledWith([multipleStorylines[1], multipleStorylines[0]]);
    }
  });

  it('ensures all internal elements in draggable storyline header have pointer-events-none', () => {
    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    const title = screen.getByRole('heading', { name: 'Crown Conspiracy' });
    const draggableHeader = title.closest('[draggable="true"]');
    expect(draggableHeader).toBeInTheDocument();

    // Check that text, labels, and icons have pointer-events-none so the whole card is grabbable
    const nonInteractiveElements = draggableHeader?.querySelectorAll('h4, p, span');
    expect(nonInteractiveElements?.length).toBeGreaterThan(0);
    nonInteractiveElements?.forEach((el) => {
      expect(el).toHaveClass('pointer-events-none');
    });

    // The collapse button must be interactive (pointer-events-auto)
    const collapseButton = draggableHeader?.querySelector('button');
    expect(collapseButton).toHaveClass('pointer-events-auto');
  });

  it('renders scene card resize handle with cursor-col-resize and supports manual resizing', () => {
    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
      />
    );

    const resizeHandles = document.querySelectorAll('.cursor-col-resize');
    expect(resizeHandles.length).toBeGreaterThan(0);

    const handle = resizeHandles[0] as HTMLElement;
    expect(handle).toBeInTheDocument();

    // Trigger pointerdown
    fireEvent.pointerDown(handle, { clientX: 100 });
    // Trigger pointermove on window
    fireEvent(window, new MouseEvent('pointermove', { clientX: 250 }));
    // Trigger pointerup
    fireEvent(window, new MouseEvent('pointerup'));
  });

  it('resets manualSceneWidths on zoomX change when preserveManualSceneWidth is false', () => {
    render(
      <TimelineView
        chapters={mockChapters}
        storylines={mockStorylines}
        characters={mockCharacters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
        appSettings={{
          ...({} as any),
          preferences: {
            timelineDropMode: 'shift',
            persistViewFilters: false,
            preserveManualSceneWidth: false,
          },
        }}
      />
    );

    // Find zoom X slider by title
    const zoomXContainer = screen.getByTitle('Horizontal Zoom (Scene column width)');
    const zoomXSlider = zoomXContainer.querySelector('input[type="range"]') as HTMLInputElement;
    expect(zoomXSlider).toBeInTheDocument();

    // Change zoomX
    fireEvent.change(zoomXSlider, { target: { value: '1.5' } });
  });
});


