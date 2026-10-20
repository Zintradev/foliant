import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ManuscriptStatsView from './ManuscriptStatsView';
import { TextNode } from '../../../types/project';

const mockChapters: TextNode[] = [
  {
    id: 'folder-1',
    title: 'Part 1',
    content: '',
    synopsis: 'Overview',
    type: 'folder',
    parentId: null,
    targetWords: 10000,
    status: 'In Progress',
  },
  {
    id: 'scene-1',
    title: 'Chapter 1',
    content: 'A few sample words here for stats testing.',
    synopsis: 'First scene',
    type: 'scene',
    parentId: 'folder-1',
    targetWords: 3000,
    status: 'In Progress',
  },
];

describe('ManuscriptStatsView', () => {
  it('renders status dropdown selector with options and defaults to In Progress', () => {
    const handleUpdate = vi.fn();
    render(
      <ManuscriptStatsView
        chapters={mockChapters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
        onUpdateChapter={handleUpdate}
        isExpanded={true}
      />
    );

    // Find select elements for status
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);

    const firstSelect = selects[0] as HTMLSelectElement;
    expect(firstSelect.value).toBe('In Progress');

    // Change status to Completed
    fireEvent.change(firstSelect, { target: { value: 'Completed' } });

    expect(handleUpdate).toHaveBeenCalledWith('folder-1', { status: 'Completed' });
  });
});
