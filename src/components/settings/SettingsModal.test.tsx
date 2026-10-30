import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import SettingsModal from './SettingsModal';
import { DEFAULT_APP_SETTINGS, AppSettings } from '../../types/settings';
import { dict } from '../../i18n/translations';

describe('SettingsModal Component', () => {
  let mockSettings: AppSettings;
  let mockOnUpdateSettings: ReturnType<typeof vi.fn>;
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings = JSON.parse(JSON.stringify(DEFAULT_APP_SETTINGS));
    mockOnUpdateSettings = vi.fn();
    mockOnClose = vi.fn();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SettingsModal
        isOpen={false}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('transitions smoothly from isOpen=false to isOpen=true without hook mismatch error', () => {
    const { rerender } = render(
      <SettingsModal
        isOpen={false}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );
    expect(screen.queryByText(dict.en.studioSettings)).not.toBeInTheDocument();

    rerender(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );
    expect(screen.getByText(dict.en.studioSettings)).toBeInTheDocument();
  });

  it('renders navigation tabs and general section by default when open', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    expect(screen.getByText(dict.en.studioSettings)).toBeInTheDocument();
    expect(screen.getAllByText(dict.en.categoryGeneral).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(dict.en.categoryAppearance)).toBeInTheDocument();
    expect(screen.getByText(dict.en.categoryEditor)).toBeInTheDocument();
    expect(screen.getByText(dict.en.categoryTaxonomy)).toBeInTheDocument();
  });

  it('switches languages and triggers onUpdateSettings', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    // Switch to Spanish
    const esButton = screen.getByText('Español').closest('button')!;
    fireEvent.click(esButton);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ language: 'es' }),
      })
    );

    // Switch to English
    const enButton = screen.getByText('English').closest('button')!;
    fireEvent.click(enButton);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ language: 'en' }),
      })
    );
  });

  it('switches save mode between auto and manual', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    // Switch to manual save
    const manualBtn = screen.getByText(dict.en.saveModeManual).closest('button')!;
    fireEvent.click(manualBtn);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ saveMode: 'manual' }),
      })
    );

    // Switch to auto save
    const autoBtn = screen.getByText(dict.en.saveModeAuto).closest('button')!;
    fireEvent.click(autoBtn);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ saveMode: 'auto' }),
      })
    );

    // Modify autoSaveInterval in auto mode
    const intervalSelect = screen.getByLabelText(dict.en.autoSaveInterval);
    expect(intervalSelect).toBeInTheDocument();
    expect(screen.getByText(dict.en.autoSaveShortNotice)).toBeInTheDocument();
    fireEvent.change(intervalSelect, { target: { value: '300' } });

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ autoSaveInterval: 300 }),
      })
    );
  });

  it('navigates to Appearance tab and switches themeMode (dark, light, custom)', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    // Go to Appearance
    fireEvent.click(screen.getByText(dict.en.categoryAppearance));

    // Select Light theme
    fireEvent.click(screen.getByText(dict.en.light));
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ themeMode: 'light' }),
      })
    );

    // Select Custom theme
    fireEvent.click(screen.getByText(dict.en.custom));
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ themeMode: 'custom' }),
      })
    );

    // Custom theme colors editor should appear
    expect(screen.getByText(dict.en.customThemeColors)).toBeInTheDocument();

    // Select Dark theme
    fireEvent.click(screen.getByText(dict.en.dark));
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ themeMode: 'dark' }),
      })
    );
  });

  it('edits custom theme colors directly when in custom theme mode', () => {
    const customSettings: AppSettings = {
      ...mockSettings,
      preferences: {
        ...mockSettings.preferences,
        themeMode: 'custom',
      },
    };

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={customSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryAppearance));

    // Inputs for Background, Surface, Primary, Text
    const backgroundInput = screen.getByDisplayValue(
      customSettings.preferences.customTheme?.background || '#09090b'
    );
    fireEvent.change(backgroundInput, { target: { value: '#1a1a1a' } });

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          customTheme: expect.objectContaining({ background: '#1a1a1a' }),
        }),
      })
    );
  });

  it('navigates to Editor tab and toggles first-line indentation', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryEditor));
    expect(screen.getByText(dict.en.automaticIndent)).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ editorIndentFirstLine: false }),
      })
    );
  });

  it('manages drag & drop modes (timeline and world) and card zoom retention in General section', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    expect(screen.getByText(dict.en.timelineDropMode)).toBeInTheDocument();
    expect(screen.getByText(dict.en.worldDropMode)).toBeInTheDocument();

    // Timeline Drop Mode toggle
    const swapButtons = screen.getAllByText(dict.en.swapMode);
    fireEvent.click(swapButtons[0]);
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ timelineDropMode: 'swap' }),
      })
    );

    // World Items Drop Mode toggle
    fireEvent.click(swapButtons[1]);
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ worldDropMode: 'swap' }),
      })
    );

    // Toggle preserve scene width
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ preserveManualSceneWidth: true }),
      })
    );

    // Toggle preserve track height
    fireEvent.click(checkboxes[1]);
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ preserveManualPlotHeight: true }),
      })
    );
  });

  it('navigates to Taxonomy tab: Roles subtab (add custom role, delete role, empty input guard)', () => {
    const { rerender } = render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryTaxonomy));
    expect(screen.getByText(dict.en.characterRoles)).toBeInTheDocument();

    // Verify existing default role
    expect(screen.getByText(dict.en.roleProtagonist)).toBeInTheDocument();

    // Attempt to add empty custom role -> should guard and do nothing
    const addRoleBtn = screen.getByRole('button', { name: dict.en.add });
    fireEvent.click(addRoleBtn);
    expect(mockOnUpdateSettings).not.toHaveBeenCalled();

    // Type a new custom role
    const roleInput = screen.getByPlaceholderText(dict.en.roleNamePlaceholder);
    fireEvent.change(roleInput, { target: { value: 'Mentor' } });
    fireEvent.click(addRoleBtn);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: expect.objectContaining({ Mentor: 'blue' }),
      })
    );

    // Now re-render with the updated role to test deletion
    const updatedWithMentor: AppSettings = {
      ...mockSettings,
      roles: { ...mockSettings.roles, Mentor: 'blue' },
    };

    rerender(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={updatedWithMentor}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    expect(screen.getByText('Mentor')).toBeInTheDocument();

    // Find the delete button for custom role
    const deleteBtn = screen.getByTitle(dict.en.deleteCustomRole);
    fireEvent.click(deleteBtn);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: expect.not.objectContaining({ Mentor: 'blue' }),
      })
    );
  });

  it('navigates to Taxonomy tab: Storylines subtab (add and delete storyline)', () => {
    const { rerender } = render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryTaxonomy));
    fireEvent.click(screen.getByText(dict.en.storylineTags));

    // Attempt empty input guard
    const addStorylineBtn = screen.getByRole('button', { name: dict.en.add });
    fireEvent.click(addStorylineBtn);

    const storylineInput = screen.getByPlaceholderText(dict.en.storylineNamePlaceholder);
    fireEvent.change(storylineInput, { target: { value: 'Subplot B' } });
    fireEvent.click(addStorylineBtn);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        storylines: expect.objectContaining({ 'Subplot B': 'emerald' }),
      })
    );

    // Re-render and delete
    const updatedWithStoryline: AppSettings = {
      ...mockSettings,
      storylines: { ...mockSettings.storylines, 'Subplot B': 'emerald' },
    };

    rerender(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={updatedWithStoryline}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    const deleteBtn = screen.getByTitle(dict.en.deleteCustomStoryline);
    fireEvent.click(deleteBtn);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        storylines: expect.not.objectContaining({ 'Subplot B': 'emerald' }),
      })
    );
  });

  it('navigates to Taxonomy tab: Categories subtab (add and delete category)', () => {
    const { rerender } = render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryTaxonomy));
    fireEvent.click(screen.getByText(dict.en.worldLore));

    // Attempt empty input guard
    const addCategoryBtn = screen.getByRole('button', { name: dict.en.add });
    fireEvent.click(addCategoryBtn);

    const categoryInput = screen.getByPlaceholderText(dict.en.categoryNamePlaceholder);
    fireEvent.change(categoryInput, { target: { value: 'Deities' } });
    fireEvent.click(addCategoryBtn);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: expect.objectContaining({ Deities: 'amber' }),
      })
    );

    // Re-render and delete
    const updatedWithCategory: AppSettings = {
      ...mockSettings,
      categories: { ...mockSettings.categories, Deities: 'amber' },
    };

    rerender(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={updatedWithCategory}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    const deleteBtn = screen.getByTitle(dict.en.deleteCustomCategory);
    fireEvent.click(deleteBtn);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: expect.not.objectContaining({ Deities: 'amber' }),
      })
    );
  });

  it('navigates to Taxonomy tab: Presets subtab and applies color presets', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryTaxonomy));
    fireEvent.click(screen.getByText(dict.en.presets));

    // Apply Monochrome preset
    fireEvent.click(screen.getByText(dict.en.presetMonochrome));
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ colorPreset: 'monochrome' }),
        roles: expect.objectContaining({ Protagonist: 'zinc' }),
      })
    );

    // Apply Warm preset
    fireEvent.click(screen.getByText(dict.en.presetWarm));
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ colorPreset: 'warm' }),
        roles: expect.objectContaining({ Protagonist: 'amber' }),
      })
    );

    // Apply Cyber Neon preset
    fireEvent.click(screen.getByText(dict.en.presetCyber));
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ colorPreset: 'cyber' }),
        roles: expect.objectContaining({ Protagonist: 'cyan' }),
      })
    );

    // Apply Foliant Default preset
    fireEvent.click(screen.getByText(dict.en.presetDefault));
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ colorPreset: 'default' }),
        roles: expect.objectContaining({ Protagonist: 'emerald' }),
      })
    );
  });

  it('handles reset to defaults with confirmation', () => {
    const confirmSpy = vi.spyOn(window, 'confirm');

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    // 1. User cancels reset
    confirmSpy.mockReturnValueOnce(false);
    fireEvent.click(screen.getByText(dict.en.resetDefaults));
    expect(confirmSpy).toHaveBeenCalled();
    expect(mockOnUpdateSettings).not.toHaveBeenCalled();

    // 2. User confirms reset
    confirmSpy.mockReturnValueOnce(true);
    fireEvent.click(screen.getByText(dict.en.resetDefaults));
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(DEFAULT_APP_SETTINGS);
  });

  it('handles closing the modal via Done button, X button, and Escape key', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    // Done button
    fireEvent.click(screen.getByText(dict.en.done));
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Top X button
    const closeIconBtn = screen.getByTitle('Close Settings (Esc)');
    fireEvent.click(closeIconBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(2);

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(3);
  });

  it('opens and closes DarkColorPicker popover and handles custom color changes', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryTaxonomy));

    // Open color picker for Protagonist
    const pickColorButtons = screen.getAllByTitle(dict.en.chooseColor);
    expect(pickColorButtons.length).toBeGreaterThan(0);
    fireEvent.click(pickColorButtons[0]);

    // DarkColorPicker modal should now be open
    expect(screen.getByText('Protagonist - Color')).toBeInTheDocument();

    // Change hex in DarkColorPicker
    const hexInput = screen.getByTitle('Hex Color');
    fireEvent.change(hexInput, { target: { value: '123456' } });
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: expect.objectContaining({ Protagonist: '#123456' }),
      })
    );

    // Press Escape -> closes the color picker without closing the main modal
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(screen.queryByText('Protagonist - Color')).not.toBeInTheDocument();
  });

  it('adds and removes a custom character role in Taxonomy tab', () => {
    const customSettings: AppSettings = {
      ...mockSettings,
      roles: {
        ...mockSettings.roles,
        'Custom Role': 'blue',
      },
    };

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={customSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryTaxonomy));

    // Input new custom role name
    const roleInput = screen.getByPlaceholderText(dict.en.roleNamePlaceholder);
    fireEvent.change(roleInput, { target: { value: 'Anti-Hero' } });

    // Open color picker for new role via select
    const roleSelects = screen.getAllByRole('combobox');
    const newRoleSelect = roleSelects[roleSelects.length - 1];
    fireEvent.change(newRoleSelect, { target: { value: 'custom' } });
    const hexRoleInput = screen.getByTitle('Hex Color');
    expect(hexRoleInput).toBeInTheDocument();
    fireEvent.change(hexRoleInput, { target: { value: '112233' } });
    fireEvent.click(screen.getByTitle('Close'));

    // Submit form via Add button
    const addButtons = screen.getAllByRole('button', { name: new RegExp(dict.en.add, 'i') });
    fireEvent.click(addButtons[0]);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: expect.objectContaining({ 'Anti-Hero': '#112233' }),
      })
    );

    // Delete custom role
    const deleteRoleBtns = screen.getAllByTitle(dict.en.deleteCustomRole);
    fireEvent.click(deleteRoleBtns[0]);

    expect(mockOnUpdateSettings).toHaveBeenCalled();
  });

  it('manages storylines in Taxonomy tab: adds, updates color, and deletes custom storyline', () => {
    const customSettings: AppSettings = {
      ...mockSettings,
      storylines: {
        ...mockSettings.storylines,
        'Custom Plot': 'emerald',
      },
    };

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={customSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryTaxonomy));

    // Switch to Storylines subtab
    const storylinesSubTab = screen.getByRole('button', { name: new RegExp(dict.en.storylineTags, 'i') });
    fireEvent.click(storylinesSubTab);

    // Add custom storyline
    const storylineInput = screen.getByPlaceholderText(dict.en.storylineNamePlaceholder);
    fireEvent.change(storylineInput, { target: { value: 'Rebellion Arc' } });

    // Open color picker for new storyline via select
    const storylineSelects = screen.getAllByRole('combobox');
    const newStorylineSelect = storylineSelects[storylineSelects.length - 1];
    fireEvent.change(newStorylineSelect, { target: { value: 'custom' } });
    const hexStorylineInput = screen.getByTitle('Hex Color');
    expect(hexStorylineInput).toBeInTheDocument();
    fireEvent.change(hexStorylineInput, { target: { value: '445566' } });
    fireEvent.click(screen.getByTitle('Close'));

    const addButtons = screen.getAllByRole('button', { name: new RegExp(dict.en.add, 'i') });
    fireEvent.click(addButtons[0]);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        storylines: expect.objectContaining({ 'Rebellion Arc': '#445566' }),
      })
    );

    // Change storyline color via select
    fireEvent.change(storylineSelects[0], { target: { value: 'rose' } });

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        storylines: expect.objectContaining({ emerald: 'rose' }),
      })
    );

    // Open color picker for storyline
    const pickColorButtons = screen.getAllByTitle(dict.en.chooseColor);
    fireEvent.click(pickColorButtons[0]);

    const hexInput = screen.getByTitle('Hex Color');
    fireEvent.change(hexInput, { target: { value: 'abcdef' } });
    expect(mockOnUpdateSettings).toHaveBeenCalled();

    // Close color picker
    fireEvent.click(screen.getByTitle('Close'));

    // Delete custom storyline
    const deleteStorylineBtns = screen.getAllByTitle(dict.en.deleteCustomStoryline);
    fireEvent.click(deleteStorylineBtns[0]);
    expect(mockOnUpdateSettings).toHaveBeenCalled();
  });

  it('manages categories in Taxonomy tab: adds, updates color, and deletes custom category', () => {
    const customSettings: AppSettings = {
      ...mockSettings,
      categories: {
        ...mockSettings.categories,
        'Magic Items': 'amber',
      },
    };

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={customSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryTaxonomy));

    // Switch to Categories subtab
    const categoriesSubTab = screen.getByRole('button', { name: new RegExp(dict.en.worldLore, 'i') });
    fireEvent.click(categoriesSubTab);

    // Add custom category
    const categoryInput = screen.getByPlaceholderText(dict.en.categoryNamePlaceholder);
    fireEvent.change(categoryInput, { target: { value: 'Artifacts & Relics' } });

    // Open color picker for new category via select
    const catSelects = screen.getAllByRole('combobox');
    const newCatSelect = catSelects[catSelects.length - 1];
    fireEvent.change(newCatSelect, { target: { value: 'custom' } });
    const hexCatInput = screen.getByTitle('Hex Color');
    expect(hexCatInput).toBeInTheDocument();
    fireEvent.change(hexCatInput, { target: { value: '778899' } });
    fireEvent.click(screen.getByTitle('Close'));

    const addButtons = screen.getAllByRole('button', { name: new RegExp(dict.en.add, 'i') });
    fireEvent.click(addButtons[0]);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: expect.objectContaining({ 'Artifacts & Relics': '#778899' }),
      })
    );

    // Change category color via select
    const updatedCatSelects = screen.getAllByRole('combobox');
    fireEvent.change(updatedCatSelects[0], { target: { value: 'violet' } });
    expect(mockOnUpdateSettings).toHaveBeenCalled();

    // Open color picker for category
    const pickColorButtons = screen.getAllByTitle(dict.en.chooseColor);
    fireEvent.click(pickColorButtons[0]);

    const hexInput = screen.getByTitle('Hex Color');
    fireEvent.change(hexInput, { target: { value: '334455' } });
    expect(mockOnUpdateSettings).toHaveBeenCalled();

    // Close color picker
    fireEvent.click(screen.getByTitle('Close'));

    // Delete custom category
    const deleteCatBtns = screen.getAllByTitle(dict.en.deleteCustomCategory);
    fireEvent.click(deleteCatBtns[0]);
    expect(mockOnUpdateSettings).toHaveBeenCalled();
  });

  it('edits custom theme colors using DarkColorPicker popup in Appearance tab', () => {
    const customSettings: AppSettings = {
      ...mockSettings,
      preferences: {
        ...mockSettings.preferences,
        themeMode: 'custom',
      },
    };

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={customSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryAppearance));

    // Open theme color picker for Background
    const colorSwatches = screen.getAllByTitle(dict.en.chooseColor);
    fireEvent.click(colorSwatches[0]);

    // Popup is open
    expect(screen.getByTitle('Hex Color')).toBeInTheDocument();

    // Change hex
    fireEvent.change(screen.getByTitle('Hex Color'), { target: { value: '001122' } });
    expect(mockOnUpdateSettings).toHaveBeenCalled();

    // Close via close icon
    fireEvent.click(screen.getByTitle('Close'));
    expect(screen.queryByTitle('Hex Color')).not.toBeInTheDocument();
  });
});
