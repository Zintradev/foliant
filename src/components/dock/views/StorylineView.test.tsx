import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import StorylineView from './StorylineView';
import { StorylineItem } from '../../../types/dock';

const mockStorylines: StorylineItem[] = [
  {
    id: 'story-1',
    title: 'Main Quest',
    color: 'emerald',
    description: 'Find the ancient artifact',
    linkedChapterIds: [],
    linkedCharacterIds: [],
    fields: [],
  },
  {
    id: 'story-2',
    title: 'Secret Romance',
    color: 'rose',
    description: 'Forbidden love affair',
    linkedChapterIds: [],
    linkedCharacterIds: [],
    fields: [],
  },
];

describe('StorylineView Component', () => {
  it('renders storylines and supports drag-and-drop reordering', () => {
    const onChange = vi.fn();
    render(
      <StorylineView
        storylines={mockStorylines}
        chapters={[]}
        onChange={onChange}
      />
    );

    expect(screen.getByText('Main Quest')).toBeInTheDocument();
    expect(screen.getByText('Secret Romance')).toBeInTheDocument();

    const gripHandles = screen.getAllByTitle(/(drag to reorder|arrastrar para reordenar)/i);
    expect(gripHandles).toHaveLength(2);

    // Find the cards
    const cards = screen.getAllByText(/(Main Quest|Secret Romance)/);
    const firstCard = cards[0].closest('[draggable="true"]') as HTMLElement;
    const secondCard = cards[1].closest('[draggable="true"]') as HTMLElement;

    expect(firstCard).toBeInTheDocument();
    expect(secondCard).toBeInTheDocument();

    // Perform drag and drop
    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(key: string, val: string) {
        this.data[key] = val;
      },
      getData(key: string) {
        return this.data[key] || '';
      },
      dropEffect: 'none',
      effectAllowed: 'all',
    };

    fireEvent.dragStart(firstCard, { dataTransfer });
    fireEvent.dragOver(secondCard, { dataTransfer });
    fireEvent.drop(secondCard, { dataTransfer });

    // Should call onChange with reordered storylines: [story-2, story-1]
    expect(onChange).toHaveBeenCalledWith([mockStorylines[1], mockStorylines[0]]);
  });

  it('renders arrow buttons and reorders when storylinesDropMode is "arrows"', () => {
    const onChange = vi.fn();
    render(
      <StorylineView
        storylines={mockStorylines}
        chapters={[]}
        onChange={onChange}
        storylinesDropMode="arrows"
      />
    );

    const rightButtons = screen.getAllByTitle(/move right|mover a la derecha/i);
    expect(rightButtons.length).toBeGreaterThan(0);

    // In arrows mode, drag & drop handles must NOT exist
    expect(screen.queryByTitle(/(drag to reorder|arrastrar para reordenar)/i)).not.toBeInTheDocument();

    fireEvent.click(rightButtons[0]);
    expect(onChange).toHaveBeenCalledWith([mockStorylines[1], mockStorylines[0]]);
  });

  it('does NOT render arrow buttons when storylinesDropMode is "shift"', () => {
    render(
      <StorylineView
        storylines={mockStorylines}
        chapters={[]}
        onChange={vi.fn()}
        storylinesDropMode="shift"
      />
    );

    expect(screen.queryByTitle(/move right|mover a la derecha/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/move left|mover a la izquierda/i)).not.toBeInTheDocument();
  });

  it('supports searching and filtering storylines', () => {
    render(
      <StorylineView
        storylines={mockStorylines}
        chapters={[]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Main Quest')).toBeInTheDocument();
    expect(screen.getByText('Secret Romance')).toBeInTheDocument();

    const searchToggleBtn = screen.getByTitle(/search storylines|buscar tramas/i);
    fireEvent.click(searchToggleBtn);

    const searchInput = screen.getByPlaceholderText(/search storylines|buscar tramas/i);
    fireEvent.change(searchInput, { target: { value: 'Secret' } });

    expect(screen.queryByText('Main Quest')).not.toBeInTheDocument();
    expect(screen.getByText('Secret Romance')).toBeInTheDocument();
  });

  it('persists card expand/collapse state in localStorage', () => {
    localStorage.clear();
    render(
      <StorylineView
        storylines={mockStorylines}
        chapters={[]}
        onChange={vi.fn()}
      />
    );

    const chevronBtn = document.querySelector('[data-tour-id="storylines-expand-btn"]');
    expect(chevronBtn).toBeInTheDocument();

    fireEvent.click(chevronBtn!);
    expect(localStorage.getItem('foliant_storyline_expanded_story-1')).toBe('true');

    fireEvent.click(chevronBtn!);
    expect(localStorage.getItem('foliant_storyline_expanded_story-1')).toBe('false');
  });
});
