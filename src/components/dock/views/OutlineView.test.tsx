import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import OutlineView from './OutlineView';
import { TextNode } from '../../../types/project';

const mockChapters: TextNode[] = [
  {
    id: 'folder-1',
    title: 'Act I',
    content: '',
    synopsis: 'Introduction',
    type: 'folder',
    parentId: null,
    targetWords: 5000,
  },
  {
    id: 'scene-1',
    title: 'The Beginning',
    content: 'First words of the project written here.',
    synopsis: 'Opening scene',
    type: 'scene',
    parentId: 'folder-1',
    targetWords: 2000,
  },
];

describe('OutlineView', () => {
  it('renders sidebar view without numeric word counts in tree items', () => {
    render(
      <OutlineView
        chapters={mockChapters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
        onAddChapter={vi.fn()}
        isExpanded={false}
      />
    );

    // Folder and Scene titles should be in the document
    expect(screen.getByText('Act I')).toBeInTheDocument();
    expect(screen.getByText('The Beginning')).toBeInTheDocument();

    // Scene word count is 7 words. In sidebar mode, "7 w" should NOT be rendered in scene items
    expect(screen.queryByText('7 w')).not.toBeInTheDocument();
  });

  it('provides inline rename via context menu and confirms on Enter without buttons', () => {
    const handleUpdate = vi.fn();
    render(
      <OutlineView
        chapters={mockChapters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
        onAddChapter={vi.fn()}
        onUpdateChapter={handleUpdate}
        isExpanded={false}
      />
    );

    // Right-click scene to open context menu
    const sceneItem = screen.getByText('The Beginning');
    fireEvent.contextMenu(sceneItem);

    // Click "Rename" option
    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    // An input field should appear without any tick or cross buttons
    const input = screen.getByDisplayValue('The Beginning');
    expect(input).toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Cancel')).not.toBeInTheDocument();

    // Change value and press Enter
    fireEvent.change(input, { target: { value: 'New Scene Title' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleUpdate).toHaveBeenCalledWith('scene-1', { title: 'New Scene Title' });
  });

  it('renders layout selector with 1 Column, 2 Columns, and Split View when expanded', () => {
    render(
      <OutlineView
        chapters={mockChapters}
        activeChapterId="scene-1"
        onSelectChapter={vi.fn()}
        onAddChapter={vi.fn()}
        isExpanded={true}
      />
    );

    expect(screen.getByText('1 Column')).toBeInTheDocument();
    expect(screen.getByText('2 Columns')).toBeInTheDocument();
    expect(screen.getByText('Split View')).toBeInTheDocument();
  });
});
