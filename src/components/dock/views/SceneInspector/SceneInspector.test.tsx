import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import SceneInspector from './index';
import { TextNode } from '../../../../types/project';

const mockScene: TextNode = {
  id: 'scene-1',
  title: 'Opening Scene',
  content: 'Once upon a time in a faraway galaxy...',
  synopsis: 'The protagonist begins their adventure.',
  type: 'scene',
  parentId: null,
  targetWords: 2500,
  status: 'In Progress',
};

describe('SceneInspector Component', () => {
  it('renders default and custom statuses in dropdown and triggers status change', () => {
    const handleUpdateNode = vi.fn();
    render(
      <SceneInspector
        activeNodeId="scene-1"
        activeNode={mockScene}
        chapters={[mockScene]}
        customStatuses={['Needs Fact-Checking', 'Beta Reader Review', 'Final Polish']}
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
            'Needs Fact-Checking': 'amber',
            'Beta Reader Review': 'purple',
            'Final Polish': 'emerald',
          },
        }}
        onUpdateNode={handleUpdateNode}
      />
    );

    // Find the status dropdown
    const select = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
    expect(select.value).toBe('In Progress');

    const options = Array.from(select.options).map((opt) => opt.value);
    expect(options).toEqual([
      'Not Started',
      'In Progress',
      'First Draft',
      'Revised',
      'Completed',
      'Needs Fact-Checking',
      'Beta Reader Review',
      'Final Polish',
    ]);

    // Change to custom status
    fireEvent.change(select, { target: { value: 'Beta Reader Review' } });
    expect(handleUpdateNode).toHaveBeenCalledWith('scene-1', { status: 'Beta Reader Review' });
  });

  it('renders matching custom hex color styles on the status select element', () => {
    const customHexScene: TextNode = {
      ...mockScene,
      status: 'Final Polish',
    };

    render(
      <SceneInspector
        activeNodeId="scene-1"
        activeNode={customHexScene}
        chapters={[customHexScene]}
        customStatuses={['Final Polish']}
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
            'Final Polish': '#a855f7',
          },
        }}
        onUpdateNode={vi.fn()}
      />
    );

    const select = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
    expect(select.value).toBe('Final Polish');
    expect(select.style.color).toBe('rgb(168, 85, 247)');
    expect(select.style.backgroundColor).toBe('rgba(168, 85, 247, 0.2)');
    expect(select.style.borderColor).toBe('rgba(168, 85, 247, 0.6)');
  });
});
