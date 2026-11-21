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

  it('keeps all accordion sections collapsed by default and hides synopsis word count until expanded', () => {
    render(
      <SceneInspector
        activeNodeId="scene-1"
        activeNode={mockScene}
        chapters={[mockScene]}
        onUpdateNode={vi.fn()}
      />
    );

    // Textarea for synopsis should not be visible when collapsed
    expect(screen.queryByPlaceholderText(/synopsis/i)).not.toBeInTheDocument();

    // Word count in synopsis header should be hidden when collapsed
    expect(screen.queryByText(/w$/)).not.toBeInTheDocument();

    // Click to open synopsis section
    const synopsisButton = screen.getByText(/Synopsis/i);
    fireEvent.click(synopsisButton);

    // Textarea is now visible
    expect(screen.getByDisplayValue(mockScene.synopsis!)).toBeInTheDocument();
    // Word count is now visible (synopsis has 5 words)
    expect(screen.getByText('5 w')).toBeInTheDocument();
  });

  it('collapses sections again when changing activeNodeId', () => {
    const scene2: TextNode = {
      id: 'scene-2',
      title: 'Second Scene',
      content: '',
      synopsis: 'Next chapter notes',
      type: 'scene',
      parentId: null,
    };

    const { rerender } = render(
      <SceneInspector
        activeNodeId="scene-1"
        activeNode={mockScene}
        chapters={[mockScene, scene2]}
        onUpdateNode={vi.fn()}
      />
    );

    // Open synopsis
    fireEvent.click(screen.getByText(/Synopsis/i));
    expect(screen.getByDisplayValue(mockScene.synopsis!)).toBeInTheDocument();

    // Switch to scene-2
    rerender(
      <SceneInspector
        activeNodeId="scene-2"
        activeNode={scene2}
        chapters={[mockScene, scene2]}
        onUpdateNode={vi.fn()}
      />
    );

    // All sections should be collapsed again
    expect(screen.queryByDisplayValue(scene2.synopsis!)).not.toBeInTheDocument();
  });

  it('renders sections respecting the sectionOrder prop', () => {
    render(
      <SceneInspector
        activeNodeId="scene-1"
        activeNode={mockScene}
        chapters={[mockScene]}
        sectionOrder={['world', 'cast', 'plots', 'synopsis', 'goal']}
        onUpdateNode={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    // Extract section header button texts
    const buttonTexts = buttons.map((b) => b.textContent || '');
    const worldIdx = buttonTexts.findIndex((t) => t.includes('Mundo') || t.includes('World'));
    const castIdx = buttonTexts.findIndex((t) => t.includes('Personajes') || t.includes('Cast'));
    const goalIdx = buttonTexts.findIndex((t) => t.includes('Objetivo') || t.includes('Goal'));

    expect(worldIdx).toBeLessThan(castIdx);
    expect(castIdx).toBeLessThan(goalIdx);
  });
});
