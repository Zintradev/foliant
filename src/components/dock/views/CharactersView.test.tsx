import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import CharactersView from './CharactersView';
import { CharacterItem } from '../../../types/dock';

const mockCharacters: CharacterItem[] = [
  {
    id: 'char-1',
    name: 'Elrond Starweaver',
    role: 'Protagonist',
    summary: 'A resilient mage wandering the astral plane.',
    tags: [{ id: 'tag-1', label: 'Magic', color: 'purple' }],
    fields: [{ id: 'f-1', label: 'Goal', value: 'Find the lost star' }],
  },
];

describe('CharactersView Component', () => {
  it('renders collapsed character card and expands on click', () => {
    render(<CharactersView characters={mockCharacters} onChange={vi.fn()} />);

    expect(screen.getByText('Elrond Starweaver')).toBeInTheDocument();
    // Summary is initially collapsed
    expect(screen.queryByText('A resilient mage wandering the astral plane.')).not.toBeInTheDocument();

    // Click to expand card
    const expandBtn = screen.getByTitle('Expand card');
    fireEvent.click(expandBtn);

    // Summary is now revealed
    expect(screen.getByText('A resilient mage wandering the astral plane.')).toBeInTheDocument();
  });

  it('triggers onDirtyChange when entering edit mode and provides avatar uploader and auto-expanding textareas', async () => {
    const onDirtyChange = vi.fn();
    render(
      <CharactersView
        characters={mockCharacters}
        onChange={vi.fn()}
        onDirtyChange={onDirtyChange}
        saveMode="manual"
      />
    );

    // Expand the card first
    fireEvent.click(screen.getByTitle('Expand card'));

    // Click Edit button
    const editBtn = screen.getByTitle('Edit character profile');
    fireEvent.click(editBtn);

    // Verify onDirtyChange was called with true
    expect(onDirtyChange).toHaveBeenCalledWith(true);

    // Verify Avatar Upload file input exists
    const avatarInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
    expect(avatarInput).toBeInTheDocument();

    // Verify textareas have transition-all and focus:min-h-[150px]
    const textareas = document.querySelectorAll('textarea');
    expect(textareas.length).toBeGreaterThan(0);
    textareas.forEach((ta) => {
      expect(ta.className).toContain('focus:min-h-[150px]');
      expect(ta.className).toContain('transition-all');
    });

    // Cancel edit
    const cancelBtn = screen.getByTitle('Cancel edit');
    fireEvent.click(cancelBtn);

    // onDirtyChange is updated to false
    expect(onDirtyChange).toHaveBeenCalledWith(false);
  });

  it('opens lightbox modal when clicking avatar in non-edit mode', () => {
    const charWithAvatar: CharacterItem = {
      id: 'char-avatar',
      name: 'Aria Silver',
      role: 'Protagonist',
      summary: 'A silver-haired scout.',
      avatarUrl: 'data:image/png;base64,mockavatar',
    };

    render(<CharactersView characters={[charWithAvatar]} onChange={vi.fn()} />);

    // Click avatar in display mode
    const avatar = screen.getByTitle('Click to view portrait');
    fireEvent.click(avatar);

    // Lightbox modal opens
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    const img = dialog.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute('src')).toBe('data:image/png;base64,mockavatar');
    expect(img?.className).toContain('max-w-full max-h-[80vh] object-contain');

    // Close lightbox
    const closeBtn = screen.getByLabelText('Close lightbox');
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('in auto-save mode does not show confirm or cancel buttons and directly commits changes', () => {
    const onChange = vi.fn();
    const onDirtyChange = vi.fn();
    render(
      <CharactersView
        characters={mockCharacters}
        onChange={onChange}
        onDirtyChange={onDirtyChange}
        saveMode="auto"
      />
    );

    // Expand the card
    fireEvent.click(screen.getByTitle('Expand card'));

    // Click Edit button
    fireEvent.click(screen.getByTitle('Edit character profile'));

    // Confirm (Save) and Reject (Cancel) buttons must NOT be present
    expect(screen.queryByTitle('Save Changes')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Cancel edit')).not.toBeInTheDocument();

    // Close button should be present
    expect(screen.getByTitle('Close')).toBeInTheDocument();

    // Modifying name immediately calls onChange
    const nameInput = screen.getByPlaceholderText('Character name...');
    fireEvent.change(nameInput, { target: { value: 'Elrond the Wise' } });

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'char-1',
        name: 'Elrond the Wise',
      }),
    ]);
  });
});
