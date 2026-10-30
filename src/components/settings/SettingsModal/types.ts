import { AppSettings, AppPreferences, CustomThemeColors } from '../../../types/settings';

export type SettingsSection = 'general' | 'appearance' | 'editor' | 'timeline' | 'taxonomy' | 'info';
export type TaxonomySubTab = 'roles' | 'storylines' | 'categories' | 'presets';

export interface ActiveColorPickerState {
  type: 'role' | 'storyline' | 'category' | 'theme';
  key: string;
  color: string;
  title: string;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export type PreferenceChangeHandler = <K extends keyof AppPreferences>(
  key: K,
  val: AppPreferences[K]
) => void;

export type CustomColorChangeHandler = (
  channel: keyof CustomThemeColors,
  val: string
) => void;

export type PresetType = 'default' | 'monochrome' | 'warm' | 'cyber';
