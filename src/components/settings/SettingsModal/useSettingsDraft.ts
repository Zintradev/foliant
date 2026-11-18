import { useState, useEffect } from 'react';
import {
  AppSettings,
  AppPreferences,
  CustomThemeColors,
  DEFAULT_CUSTOM_THEME,
  DEFAULT_PREFERENCES,
  DEFAULT_APP_SETTINGS,
  DEFAULT_COLOR_SETTINGS,
  saveSettings,
} from '../../../types/settings';
import { FoliantProject } from '../../../types/project';
import { ActiveColorPickerState, PresetType } from './types';
import { getPresetSettings } from './presetUtils';

interface UseSettingsDraftOptions {
  isOpen: boolean;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
  confirmResetMessage: string;
  project?: FoliantProject;
  onUpdateCustomStatuses?: (statuses: string[]) => void;
  onRenameCustomStatus?: (oldName: string, newName: string) => void;
}

const DEFAULT_STATUS_NAMES = [
  'Not Started',
  'In Progress',
  'First Draft',
  'Revised',
  'Completed',
];

export function useSettingsDraft({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
  confirmResetMessage,
  project,
  onUpdateCustomStatuses,
  onRenameCustomStatus,
}: UseSettingsDraftOptions) {
  const [draftSettings, setDraftSettings] = useState<AppSettings>(() => ({
    ...settings,
    preferences: settings.preferences || DEFAULT_PREFERENCES,
  }));

  const [newCustomRoleName, setNewCustomRoleName] = useState('');
  const [newCustomRoleColor, setNewCustomRoleColor] = useState<string>('blue');

  const [newCustomStorylineName, setNewCustomStorylineName] = useState('');
  const [newCustomStorylineColor, setNewCustomStorylineColor] = useState<string>('emerald');

  const [newCustomCategoryName, setNewCustomCategoryName] = useState('');
  const [newCustomCategoryColor, setNewCustomCategoryColor] = useState<string>('amber');

  const [customStatuses, setCustomStatuses] = useState<string[]>(() => {
    if (project?.customStatuses && project.customStatuses.length > 0) {
      return project.customStatuses;
    }
    return Object.keys(settings.statuses || {}).filter(
      (k) => !DEFAULT_STATUS_NAMES.includes(k)
    );
  });
  const [newCustomStatusName, setNewCustomStatusName] = useState('');
  const [newCustomStatusColor, setNewCustomStatusColor] = useState<string>('blue');
  const [editingStatusOriginalName, setEditingStatusOriginalName] = useState<string | null>(null);
  const [editingStatusDraftName, setEditingStatusDraftName] = useState('');

  const [activeColorPicker, setActiveColorPicker] = useState<ActiveColorPickerState | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraftSettings({
        ...settings,
        preferences: settings.preferences || DEFAULT_PREFERENCES,
      });
      if (project?.customStatuses) {
        setCustomStatuses(project.customStatuses);
      } else {
        setCustomStatuses(
          Object.keys(settings.statuses || {}).filter(
            (k) => !DEFAULT_STATUS_NAMES.includes(k)
          )
        );
      }
    }
  }, [isOpen, settings, project?.customStatuses]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeColorPicker) setActiveColorPicker(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, activeColorPicker]);

  const commitSettings = (updated: AppSettings) => {
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveSettings(updated);
  };

  const handlePreferenceChange = <K extends keyof AppPreferences>(
    key: K,
    val: AppPreferences[K]
  ) => {
    commitSettings({
      ...draftSettings,
      preferences: {
        ...(draftSettings.preferences || DEFAULT_PREFERENCES),
        [key]: val,
      },
    });
  };

  const handleRoleColorChange = (role: string, color: string) => {
    commitSettings({
      ...draftSettings,
      preferences: { ...(draftSettings.preferences || DEFAULT_PREFERENCES), colorPreset: 'custom' },
      roles: { ...draftSettings.roles, [role]: color },
    });
  };

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomRoleName.trim()) return;
    const trimmed = newCustomRoleName.trim();
    commitSettings({
      ...draftSettings,
      preferences: { ...(draftSettings.preferences || DEFAULT_PREFERENCES), colorPreset: 'custom' },
      roles: { ...draftSettings.roles, [trimmed]: newCustomRoleColor },
    });
    setNewCustomRoleName('');
  };

  const handleRemoveCustomRole = (role: string) => {
    const nextRoles = { ...draftSettings.roles };
    delete nextRoles[role];
    commitSettings({
      ...draftSettings,
      preferences: { ...(draftSettings.preferences || DEFAULT_PREFERENCES), colorPreset: 'custom' },
      roles: nextRoles,
    });
  };

  const handleStorylineColorChange = (key: string, color: string) => {
    commitSettings({
      ...draftSettings,
      preferences: { ...(draftSettings.preferences || DEFAULT_PREFERENCES), colorPreset: 'custom' },
      storylines: { ...draftSettings.storylines, [key]: color },
    });
  };

  const handleAddCustomStoryline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomStorylineName.trim()) return;
    const trimmed = newCustomStorylineName.trim();
    commitSettings({
      ...draftSettings,
      preferences: { ...(draftSettings.preferences || DEFAULT_PREFERENCES), colorPreset: 'custom' },
      storylines: { ...draftSettings.storylines, [trimmed]: newCustomStorylineColor },
    });
    setNewCustomStorylineName('');
  };

  const handleRemoveCustomStoryline = (key: string) => {
    const nextStorylines = { ...draftSettings.storylines };
    delete nextStorylines[key];
    commitSettings({
      ...draftSettings,
      preferences: { ...(draftSettings.preferences || DEFAULT_PREFERENCES), colorPreset: 'custom' },
      storylines: nextStorylines,
    });
  };

  const handleCategoryColorChange = (category: string, color: string) => {
    commitSettings({
      ...draftSettings,
      preferences: { ...(draftSettings.preferences || DEFAULT_PREFERENCES), colorPreset: 'custom' },
      categories: { ...draftSettings.categories, [category]: color },
    });
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomCategoryName.trim()) return;
    const trimmed = newCustomCategoryName.trim();
    commitSettings({
      ...draftSettings,
      preferences: { ...(draftSettings.preferences || DEFAULT_PREFERENCES), colorPreset: 'custom' },
      categories: { ...draftSettings.categories, [trimmed]: newCustomCategoryColor },
    });
    setNewCustomCategoryName('');
  };

  const handleRemoveCustomCategory = (key: string) => {
    const nextCategories = { ...draftSettings.categories };
    delete nextCategories[key];
    commitSettings({
      ...draftSettings,
      preferences: { ...(draftSettings.preferences || DEFAULT_PREFERENCES), colorPreset: 'custom' },
      categories: nextCategories,
    });
  };

  const handleStatusColorChange = (status: string, color: string) => {
    commitSettings({
      ...draftSettings,
      preferences: { ...(draftSettings.preferences || DEFAULT_PREFERENCES), colorPreset: 'custom' },
      statuses: {
        ...(draftSettings.statuses || DEFAULT_COLOR_SETTINGS.statuses),
        [status]: color,
      },
    });
  };

  const handleAddCustomStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCustomStatusName.trim();
    if (!trimmed) return;
    if (DEFAULT_STATUS_NAMES.includes(trimmed) || customStatuses.includes(trimmed)) return;
    const nextStatuses = [...customStatuses, trimmed];
    setCustomStatuses(nextStatuses);
    onUpdateCustomStatuses?.(nextStatuses);
    commitSettings({
      ...draftSettings,
      preferences: { ...(draftSettings.preferences || DEFAULT_PREFERENCES), colorPreset: 'custom' },
      statuses: {
        ...(draftSettings.statuses || DEFAULT_COLOR_SETTINGS.statuses),
        [trimmed]: newCustomStatusColor,
      },
    });
    setNewCustomStatusName('');
  };

  const handleRemoveCustomStatus = (status: string) => {
    const nextStatuses = customStatuses.filter((s) => s !== status);
    setCustomStatuses(nextStatuses);
    onUpdateCustomStatuses?.(nextStatuses);
    const nextStatusesColors = {
      ...(draftSettings.statuses || DEFAULT_COLOR_SETTINGS.statuses),
    };
    delete nextStatusesColors[status];
    commitSettings({
      ...draftSettings,
      preferences: { ...(draftSettings.preferences || DEFAULT_PREFERENCES), colorPreset: 'custom' },
      statuses: nextStatusesColors,
    });
    if (editingStatusOriginalName === status) {
      setEditingStatusOriginalName(null);
      setEditingStatusDraftName('');
    }
  };

  const handleStartEditStatus = (status: string) => {
    setEditingStatusOriginalName(status);
    setEditingStatusDraftName(status);
  };

  const handleCancelEditStatus = () => {
    setEditingStatusOriginalName(null);
    setEditingStatusDraftName('');
  };

  const handleSaveEditStatus = (originalName: string) => {
    const trimmed = editingStatusDraftName.trim();
    if (!trimmed || trimmed === originalName) {
      setEditingStatusOriginalName(null);
      setEditingStatusDraftName('');
      return;
    }
    if (DEFAULT_STATUS_NAMES.includes(trimmed) || customStatuses.includes(trimmed)) {
      setEditingStatusOriginalName(null);
      setEditingStatusDraftName('');
      return;
    }
    const nextStatuses = customStatuses.map((s) => (s === originalName ? trimmed : s));
    setCustomStatuses(nextStatuses);
    onUpdateCustomStatuses?.(nextStatuses);
    onRenameCustomStatus?.(originalName, trimmed);

    const nextStatusesColors = {
      ...(draftSettings.statuses || DEFAULT_COLOR_SETTINGS.statuses),
    };
    const prevColor = nextStatusesColors[originalName] || 'blue';
    delete nextStatusesColors[originalName];
    nextStatusesColors[trimmed] = prevColor;

    commitSettings({
      ...draftSettings,
      preferences: { ...(draftSettings.preferences || DEFAULT_PREFERENCES), colorPreset: 'custom' },
      statuses: nextStatusesColors,
    });
    setEditingStatusOriginalName(null);
    setEditingStatusDraftName('');
  };

  const handleResetToDefault = () => {
    if (window.confirm(confirmResetMessage)) {
      commitSettings(DEFAULT_APP_SETTINGS);
    }
  };

  const applyPreset = (preset: PresetType) => {
    commitSettings(getPresetSettings(draftSettings, preset));
  };

  const customTheme = draftSettings.preferences?.customTheme || DEFAULT_CUSTOM_THEME;

  const handleCustomColorChange = (channel: keyof CustomThemeColors, val: string) => {
    handlePreferenceChange('customTheme', { ...customTheme, [channel]: val });
  };

  const handleColorPickerHexChange = (hex: string) => {
    if (!activeColorPicker) return;
    if (activeColorPicker.type === 'role') {
      if (activeColorPicker.key === '__new_role__') setNewCustomRoleColor(hex);
      else handleRoleColorChange(activeColorPicker.key, hex);
    } else if (activeColorPicker.type === 'storyline') {
      if (activeColorPicker.key === '__new_storyline__') setNewCustomStorylineColor(hex);
      else handleStorylineColorChange(activeColorPicker.key, hex);
    } else if (activeColorPicker.type === 'category') {
      if (activeColorPicker.key === '__new_category__') setNewCustomCategoryColor(hex);
      else handleCategoryColorChange(activeColorPicker.key, hex);
    } else if (activeColorPicker.type === 'status') {
      if (activeColorPicker.key === '__new_status__') setNewCustomStatusColor(hex);
      else handleStatusColorChange(activeColorPicker.key, hex);
    } else if (activeColorPicker.type === 'theme') {
      handleCustomColorChange(activeColorPicker.key as keyof CustomThemeColors, hex);
    }
    setActiveColorPicker((prev) => (prev ? { ...prev, color: hex } : null));
  };

  return {
    draftSettings,
    newCustomRoleName,
    setNewCustomRoleName,
    newCustomRoleColor,
    setNewCustomRoleColor,
    newCustomStorylineName,
    setNewCustomStorylineName,
    newCustomStorylineColor,
    setNewCustomStorylineColor,
    newCustomCategoryName,
    setNewCustomCategoryName,
    newCustomCategoryColor,
    setNewCustomCategoryColor,
    customStatuses,
    newCustomStatusName,
    setNewCustomStatusName,
    newCustomStatusColor,
    setNewCustomStatusColor,
    editingStatusOriginalName,
    editingStatusDraftName,
    setEditingStatusDraftName,
    activeColorPicker,
    setActiveColorPicker,
    handlePreferenceChange,
    handleRoleColorChange,
    handleAddCustomRole,
    handleRemoveCustomRole,
    handleStorylineColorChange,
    handleAddCustomStoryline,
    handleRemoveCustomStoryline,
    handleCategoryColorChange,
    handleAddCustomCategory,
    handleRemoveCustomCategory,
    handleStatusColorChange,
    handleAddCustomStatus,
    handleRemoveCustomStatus,
    handleStartEditStatus,
    handleCancelEditStatus,
    handleSaveEditStatus,
    handleResetToDefault,
    applyPreset,
    customTheme,
    handleCustomColorChange,
    handleColorPickerHexChange,
  };
}
