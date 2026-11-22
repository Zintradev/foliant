import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import SettingsModal from './SettingsModal';
import { DEFAULT_APP_SETTINGS, AppSettings } from '../../types/settings';
import { dict } from '../../i18n/translations';
import * as platform from '../../utils/platform';

describe('SettingsModal Component', () => {
  let mockSettings: AppSettings;
  let mockOnUpdateSettings: any;
  let mockOnClose: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings = JSON.parse(JSON.stringify(DEFAULT_APP_SETTINGS));
    mockOnUpdateSettings = vi.fn() as any;
    mockOnClose = vi.fn() as any;
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
    expect(screen.getByText(dict.en.categoryAppearanceEditor)).toBeInTheDocument();
    expect(screen.getByText(dict.en.categoryTaxonomy)).toBeInTheDocument();
  });

  it('reorders scene inspector sections with move down and move up buttons in General tab', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    expect(screen.getByText(dict.en.inspectorSectionOrder)).toBeInTheDocument();
    expect(screen.getByText(dict.en.inspectorSectionGoal)).toBeInTheDocument();

    // Click Move Down on the first section (Goal)
    const moveDownButtons = screen.getAllByTitle(dict.en.moveDown);
    expect(moveDownButtons.length).toBeGreaterThan(0);
    fireEvent.click(moveDownButtons[0]);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          inspectorSectionOrder: ['synopsis', 'goal', 'plots', 'cast', 'world'],
        }),
      })
    );
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
    fireEvent.click(screen.getByText(dict.en.categoryAppearanceEditor));

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

  it('switches interface style (uiStyle: modern, editorial, classic, classic-clean) in Appearance tab', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryAppearanceEditor));
    expect(screen.getByText(dict.en.uiStyle)).toBeInTheDocument();
    expect(screen.getByText(dict.en.uiStyleModern)).toBeInTheDocument();
    expect(screen.getByText(dict.en.uiStyleEditorial)).toBeInTheDocument();
    expect(screen.getByText(dict.en.uiStyleClassic)).toBeInTheDocument();
    expect(screen.getByText(dict.en.uiStyleClassicClean)).toBeInTheDocument();

    // Select Clean Editorial
    fireEvent.click(screen.getByText(dict.en.uiStyleEditorial));
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ uiStyle: 'editorial' }),
      })
    );

    // Select Classic
    fireEvent.click(screen.getByText(dict.en.uiStyleClassic));
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ uiStyle: 'classic' }),
      })
    );

    // Select Classic Clean
    fireEvent.click(screen.getByText(dict.en.uiStyleClassicClean));
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ uiStyle: 'classic-clean' }),
      })
    );

    // Select Modern
    fireEvent.click(screen.getByText(dict.en.uiStyleModern));
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ uiStyle: 'modern' }),
      })
    );
  });

  it('selects dark interface paper color in Appearance tab', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryAppearanceEditor));
    expect(screen.getByText(dict.en.paperDark)).toBeInTheDocument();

    fireEvent.click(screen.getByText(dict.en.paperDark));
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ editorPaperColor: 'dark' }),
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

    fireEvent.click(screen.getByText(dict.en.categoryAppearanceEditor));

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

  it('toggles first-line indentation in General section', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    expect(screen.getByText(dict.en.automaticIndent)).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: new RegExp(dict.en.automaticIndent, 'i') });
    expect(checkbox).toBeChecked();

    // When active, indent size controls are rendered
    expect(screen.getByLabelText(dict.en.indentSize)).toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ editorIndentFirstLine: false }),
      })
    );
  });

  it('allows choosing the indent size value when automatic indentation is enabled', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    const select = screen.getByLabelText(dict.en.indentSize) as HTMLSelectElement;
    const slider = screen.getByLabelText(`${dict.en.indentSize} Slider`) as HTMLInputElement;

    expect(select).toBeInTheDocument();
    expect(slider).toBeInTheDocument();
    expect(select.value).toBe('1.5');
    expect(slider.value).toBe('1.5');

    // Change via select
    fireEvent.change(select, { target: { value: '2' } });
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ editorIndentSize: 2 }),
      })
    );
    expect(slider.value).toBe('2');

    // Change via slider
    fireEvent.change(slider, { target: { value: '2.5' } });
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ editorIndentSize: 2.5 }),
      })
    );
    expect(select.value).toBe('2.5');
  });

  it('hides indent size controls when automatic indentation is disabled', () => {
    const disabledSettings = {
      ...mockSettings,
      preferences: {
        ...mockSettings.preferences,
        editorIndentFirstLine: false,
      },
    };

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={disabledSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    expect(screen.queryByLabelText(dict.en.indentSize)).not.toBeInTheDocument();
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
    expect(screen.getByText(dict.en.notesDropMode)).toBeInTheDocument();
    expect(screen.getByText(dict.en.visualsDropMode)).toBeInTheDocument();

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

    // Notes Drop Mode toggle
    fireEvent.click(swapButtons[2]);
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ notesDropMode: 'swap' }),
      })
    );

    // Moodboard Visuals Drop Mode toggle
    fireEvent.click(swapButtons[3]);
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ visualsDropMode: 'swap' }),
      })
    );

    // Toggle preserve scene width
    const widthCheckbox = screen.getByRole('checkbox', { name: new RegExp(dict.en.preserveWidth, 'i') });
    fireEvent.click(widthCheckbox);
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ preserveManualSceneWidth: true }),
      })
    );

    // Toggle preserve track height
    const heightCheckbox = screen.getByRole('checkbox', { name: new RegExp(dict.en.preserveHeight, 'i') });
    fireEvent.click(heightCheckbox);
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

  it('manages workflow statuses in Taxonomy tab: adds, edits, updates color, and deletes custom status', () => {
    const mockUpdateCustomStatuses = vi.fn();
    const mockRenameCustomStatus = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
        project={{
          id: 'test-project',
          title: 'Test',
          lastModified: Date.now(),
          chapters: [],
          storylines: [],
          characters: [],
          relationships: [],
          junctions: [],
          worldItems: [],
          contextBlocks: [],
          customStatuses: ['Beta Reader Review'],
        }}
        onUpdateCustomStatuses={mockUpdateCustomStatuses}
        onRenameCustomStatus={mockRenameCustomStatus}
      />
    );

    fireEvent.click(screen.getByText(dict.en.categoryTaxonomy));
    const statusesTabButton = screen.getByRole('button', { name: dict.en.workflowStatuses });
    fireEvent.click(statusesTabButton);

    // Default statuses must be displayed
    expect(screen.getByText(dict.en.statusNotStarted)).toBeInTheDocument();
    expect(screen.getByText(dict.en.statusInProgress)).toBeInTheDocument();
    expect(screen.getByText(dict.en.statusFirstDraft)).toBeInTheDocument();
    expect(screen.getByText(dict.en.statusRevised)).toBeInTheDocument();
    expect(screen.getAllByText(dict.en.statusDone).length).toBeGreaterThanOrEqual(1);

    // Initial custom status
    expect(screen.getByText('Beta Reader Review')).toBeInTheDocument();

    // Add a new custom status
    const statusInput = screen.getByPlaceholderText(dict.en.statusNamePlaceholder);
    fireEvent.change(statusInput, { target: { value: 'Needs Fact-Checking' } });

    const addButtons = screen.getAllByRole('button', { name: new RegExp(dict.en.add, 'i') });
    fireEvent.click(addButtons[0]);

    expect(mockUpdateCustomStatuses).toHaveBeenCalledWith(
      expect.arrayContaining(['Beta Reader Review', 'Needs Fact-Checking'])
    );
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        statuses: expect.objectContaining({
          'Needs Fact-Checking': 'blue',
        }),
      })
    );

    // Update status color
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[selects.length - 1], { target: { value: 'amber' } });
    expect(mockOnUpdateSettings).toHaveBeenCalled();

    // Edit custom status name
    const editBtn = screen.getAllByTitle(dict.en.editCustomStatus)[0];
    fireEvent.click(editBtn);

    const renameInput = screen.getByDisplayValue('Beta Reader Review');
    fireEvent.change(renameInput, { target: { value: 'Beta Review Round 2' } });

    const saveBtn = screen.getByTitle(dict.en.saveStatusName);
    fireEvent.click(saveBtn);

    expect(mockRenameCustomStatus).toHaveBeenCalledWith('Beta Reader Review', 'Beta Review Round 2');
    expect(mockUpdateCustomStatuses).toHaveBeenCalledWith(
      expect.arrayContaining(['Beta Review Round 2'])
    );

    // Delete custom status
    const deleteBtn = screen.getAllByTitle(dict.en.deleteCustomStatus)[0];
    fireEvent.click(deleteBtn);

    expect(mockUpdateCustomStatuses).toHaveBeenCalled();
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

    fireEvent.click(screen.getByText(dict.en.categoryAppearanceEditor));

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

  it('hides update options completely when running in a web browser', () => {
    vi.spyOn(platform, 'isTauriApp').mockReturnValue(false);
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    // Completely hidden in web browser environment
    expect(screen.queryByLabelText(dict.en.autoUpdateCheck)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: new RegExp(dict.en.checkForUpdatesNow, 'i') })
    ).not.toBeInTheDocument();
  });

  it('manages auto-update toggle and manual check for updates in General section when running in Tauri', () => {
    vi.spyOn(platform, 'isTauriApp').mockReturnValue(true);
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    // Local-first notice must be clearly visible
    expect(screen.getByText(dict.en.autoUpdateNotice)).toBeInTheDocument();

    // Auto-update checkbox toggle (starts unchecked by default for 100% local-first)
    const autoUpdateCheckbox = screen.getByLabelText(dict.en.autoUpdateCheck);
    expect(autoUpdateCheckbox).not.toBeChecked();

    fireEvent.click(autoUpdateCheckbox);
    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ autoUpdateCheck: true }),
      })
    );

    // Manual check for updates button
    const checkNowButton = screen.getByRole('button', { name: new RegExp(dict.en.checkForUpdatesNow, 'i') });
    expect(checkNowButton).toBeInTheDocument();
    fireEvent.click(checkNowButton);
  });

  it('renders Info section with app version, local-first guarantee, and project details', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    // Click Info section in sidebar
    const infoNavButton = screen.getByRole('button', { name: new RegExp(dict.en.categoryInfo, 'i') });
    expect(infoNavButton).toBeInTheDocument();
    fireEvent.click(infoNavButton);

    // Check version and title
    expect(screen.getByText('Foliant Studio')).toBeInTheDocument();
    expect(screen.getAllByText('v0.3.2').length).toBeGreaterThan(0);
    expect(screen.getByText(dict.en.appLocalFirstTitle)).toBeInTheDocument();
    expect(screen.getByText(dict.en.appLocalFirstDesc)).toBeInTheDocument();
    expect(screen.getByText('Tauri v2 (Rust Core)')).toBeInTheDocument();
    expect(screen.getByText('ProseMirror Engine')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/Zintradev/foliant'
    );
  });

  it('preserves black swatch dot (#09090b) for dark mode in Appearance section', () => {
    const { container } = render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    const appearanceNavButton = screen.getByRole('button', { name: new RegExp(dict.en.categoryAppearanceEditor, 'i') });
    fireEvent.click(appearanceNavButton);

    const darkDot = container.querySelector('.bg-\\[\\#09090b\\]');
    expect(darkDot).toBeInTheDocument();
  });

  it('renders scene scroll position toggle options and updates preferences when clicked', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onUpdateSettings={mockOnUpdateSettings}
      />
    );

    expect(screen.getByText(dict.en.sceneScrollMode)).toBeInTheDocument();

    const bottomOptionButton = screen.getByText(dict.en.sceneScrollBottom).closest('button')!;
    expect(bottomOptionButton).toBeInTheDocument();
    fireEvent.click(bottomOptionButton);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          sceneScrollMode: 'bottom',
        }),
      })
    );

    const rememberOptionButton = screen.getByText(dict.en.sceneScrollRemember).closest('button')!;
    fireEvent.click(rememberOptionButton);

    expect(mockOnUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          sceneScrollMode: 'remember',
        }),
      })
    );
  });
});
