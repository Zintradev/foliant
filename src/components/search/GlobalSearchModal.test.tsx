import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalSearchModal from './GlobalSearchModal';
import { FoliantProject } from '../../types/project';

describe('GlobalSearchModal', () => {
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

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <GlobalSearchModal
        isOpen={false}
        onClose={vi.fn()}
        project={mockProject}
        activeSceneId="scene-1"
        onSelectResult={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders input, scope select, and matches when opened', () => {
    render(
      <GlobalSearchModal
        isOpen={true}
        onClose={vi.fn()}
        project={mockProject}
        activeSceneId="scene-1"
        onSelectResult={vi.fn()}
      />
    );

    // Verify input and select presence
    const searchInput = screen.getByPlaceholderText(/Search across manuscript/i);
    expect(searchInput).toBeDefined();

    const scopeSelect = screen.getByLabelText(/Search Scope/i);
    expect(scopeSelect).toBeDefined();

    // Type query
    fireEvent.change(searchInput, { target: { value: 'silver' } });

    // Should render matching scenes
    expect(screen.getByText('Meeting at Dusk')).toBeDefined();
    expect(screen.getByText('The Escape')).toBeDefined();

    // Verify <mark className="bg-yellow-500/50 text-white"> is used
    const marks = document.querySelectorAll('mark.bg-yellow-500\\/50.text-white');
    expect(marks.length).toBeGreaterThan(0);
  });

  it('executes onSelectResult and onClose when a result is clicked', () => {
    const handleSelectResult = vi.fn();
    const handleClose = vi.fn();

    render(
      <GlobalSearchModal
        isOpen={true}
        onClose={handleClose}
        project={mockProject}
        activeSceneId="scene-1"
        onSelectResult={handleSelectResult}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search across manuscript/i);
    fireEvent.change(searchInput, { target: { value: 'dagger' } });

    const resultCard = screen.getByText('Meeting at Dusk');
    fireEvent.click(resultCard);

    expect(handleSelectResult).toHaveBeenCalledWith('scene-1', 'dagger');
    expect(handleClose).toHaveBeenCalled();
  });

  it('allows changing the search scope to Current Scene', () => {
    render(
      <GlobalSearchModal
        isOpen={true}
        onClose={vi.fn()}
        project={mockProject}
        activeSceneId="scene-1"
        onSelectResult={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search across manuscript/i);
    fireEvent.change(searchInput, { target: { value: 'silver' } });

    // In global scope, both scenes appear
    expect(screen.getByText('Meeting at Dusk')).toBeDefined();
    expect(screen.getByText('The Escape')).toBeDefined();

    // Change scope to current_scene
    const scopeSelect = screen.getByLabelText(/Search Scope/i);
    fireEvent.change(scopeSelect, { target: { value: 'current_scene' } });

    // Now only scene-1 (activeSceneId) should appear
    expect(screen.getByText('Meeting at Dusk')).toBeDefined();
    expect(screen.queryByText('The Escape')).toBeNull();
  });
});
