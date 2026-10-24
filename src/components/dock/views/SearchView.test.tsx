import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchView from './SearchView';
import { FoliantProject } from '../../../types/project';

describe('SearchView Component', () => {
  const mockProject: FoliantProject = {
    id: 'proj-1',
    title: 'Test Novel',
    lastModified: Date.now(),
    chapters: [
      {
        id: 'scene-1',
        title: 'Meeting at Dusk',
        content: '<p>The silver dagger reflected moonlight.</p>',
        type: 'scene',
        parentId: null,
      },
      {
        id: 'scene-2',
        title: 'The Escape',
        content: '<p>He ran through the silver gates into the night.</p>',
        type: 'scene',
        parentId: null,
      },
    ],
    storylines: [],
    characters: [],
    relationships: [],
    junctions: [],
    worldItems: [],
    contextBlocks: [],
  };

  it('renders search input, scope selector, and initial empty state', () => {
    render(
      <SearchView
        project={mockProject}
        activeSceneId="scene-1"
        onSelectResult={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/Search manuscript/i)).toBeDefined();
    expect(screen.getByLabelText(/Search Scope/i)).toBeDefined();
    expect(screen.getByText(/Search your manuscript/i)).toBeDefined();
  });

  it('searches across scenes and renders highlighted matches', () => {
    render(
      <SearchView
        project={mockProject}
        activeSceneId="scene-1"
        onSelectResult={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/Search manuscript/i);
    fireEvent.change(input, { target: { value: 'silver' } });

    // Should render matching scene titles
    expect(screen.getByText('Meeting at Dusk')).toBeDefined();
    expect(screen.getByText('The Escape')).toBeDefined();

    // Verify mark highlighting
    const marks = document.querySelectorAll('mark.bg-yellow-500\\/50.text-white');
    expect(marks.length).toBeGreaterThan(0);
  });

  it('calls onSelectResult when clicking a result card', () => {
    const handleSelectResult = vi.fn();

    render(
      <SearchView
        project={mockProject}
        activeSceneId="scene-1"
        onSelectResult={handleSelectResult}
      />
    );

    const input = screen.getByPlaceholderText(/Search manuscript/i);
    fireEvent.change(input, { target: { value: 'dagger' } });

    const card = screen.getByText('Meeting at Dusk');
    fireEvent.click(card);

    expect(handleSelectResult).toHaveBeenCalledWith('scene-1', 'dagger');
  });

  it('filters by scope when Current Scene is chosen', () => {
    render(
      <SearchView
        project={mockProject}
        activeSceneId="scene-1"
        onSelectResult={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/Search manuscript/i);
    fireEvent.change(input, { target: { value: 'silver' } });

    expect(screen.getByText('Meeting at Dusk')).toBeDefined();
    expect(screen.getByText('The Escape')).toBeDefined();

    const scopeSelect = screen.getByLabelText(/Search Scope/i);
    fireEvent.change(scopeSelect, { target: { value: 'current_scene' } });

    // Only scene-1 should remain
    expect(screen.getByText('Meeting at Dusk')).toBeDefined();
    expect(screen.queryByText('The Escape')).toBeNull();
  });
});
