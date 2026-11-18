import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ProjectStatsView from './ProjectStatsView';
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

describe('ProjectStatsView', () => {
  it('renders status dropdown selector with options and defaults to In Progress', () => {
    const handleUpdate = vi.fn();
    render(
      <ProjectStatsView
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

  it('renders custom statuses in the dropdown alongside defaults and applies custom selection', () => {
    const handleUpdate = vi.fn();
    render(
      <ProjectStatsView
        chapters={mockChapters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
        onUpdateChapter={handleUpdate}
        isExpanded={true}
        customStatuses={['Needs Fact-Checking', 'Beta Reader Review']}
        colorSettings={{
          roles: { Protagonist: 'emerald', Antagonist: 'rose', Supporting: 'blue', Minor: 'zinc' },
          storylines: { emerald: 'emerald', purple: 'purple', amber: 'amber', blue: 'blue', rose: 'rose', cyan: 'cyan' },
          categories: { Location: 'cyan', Faction: 'amber', Lore: 'emerald', Artifact: 'purple' },
          statuses: {
            'Not Started': 'zinc',
            'In Progress': 'blue',
            'First Draft': 'amber',
            'Revised': 'purple',
            'Completed': 'emerald',
            'Needs Fact-Checking': 'rose',
            'Beta Reader Review': 'purple',
          },
        }}
      />
    );

    const selects = screen.getAllByRole('combobox');
    const firstSelect = selects[0] as HTMLSelectElement;

    // Check options contain both default and custom statuses
    const optionValues = Array.from(firstSelect.options).map((opt) => opt.value);
    expect(optionValues).toContain('Not Started');
    expect(optionValues).toContain('In Progress');
    expect(optionValues).toContain('First Draft');
    expect(optionValues).toContain('Revised');
    expect(optionValues).toContain('Completed');
    expect(optionValues).toContain('Needs Fact-Checking');
    expect(optionValues).toContain('Beta Reader Review');

    // Select custom status
    fireEvent.change(firstSelect, { target: { value: 'Needs Fact-Checking' } });
    expect(handleUpdate).toHaveBeenCalledWith('folder-1', { status: 'Needs Fact-Checking' });
  });

  it('correctly applies custom hex colors to badge style for arbitrary hex values', () => {
    const chaptersWithCustomHex: TextNode[] = [
      {
        id: 'scene-custom',
        title: 'Custom Scene',
        content: '',
        type: 'scene',
        status: 'Beta Review',
      },
    ];

    render(
      <ProjectStatsView
        chapters={chaptersWithCustomHex}
        activeChapterId="scene-custom"
        onSelectChapter={vi.fn()}
        isExpanded={true}
        customStatuses={['Beta Review']}
        colorSettings={{
          roles: { Protagonist: 'emerald', Antagonist: 'rose', Supporting: 'blue', Minor: 'zinc' },
          storylines: { emerald: 'emerald', purple: 'purple', amber: 'amber', blue: 'blue', rose: 'rose', cyan: 'cyan' },
          categories: { Location: 'cyan', Faction: 'amber', Lore: 'emerald', Artifact: 'purple' },
          statuses: {
            'Not Started': 'zinc',
            'In Progress': 'blue',
            'First Draft': 'amber',
            'Revised': 'purple',
            'Completed': 'emerald',
            'Beta Review': '#e11d48',
          },
        }}
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('Beta Review');
    expect(select.style.color).toBe('rgb(225, 29, 72)');
    expect(select.style.backgroundColor).toBe('rgba(225, 29, 72, 0.2)');
    expect(select.style.borderColor).toBe('rgba(225, 29, 72, 0.6)');
  });
});
