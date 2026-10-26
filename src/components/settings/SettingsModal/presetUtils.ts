import { AppSettings, DEFAULT_PREFERENCES, DEFAULT_APP_SETTINGS } from '../../../types/settings';
import { PresetType } from './types';

export function getPresetSettings(
  draftSettings: AppSettings,
  preset: PresetType
): AppSettings {
  const currentPrefs = draftSettings.preferences || DEFAULT_PREFERENCES;
  switch (preset) {
    case 'monochrome':
      return {
        ...draftSettings,
        preferences: { ...currentPrefs, colorPreset: 'monochrome' },
        roles: { Protagonist: 'zinc', Antagonist: 'zinc', Supporting: 'zinc', Minor: 'zinc' },
        storylines: {
          emerald: 'zinc',
          purple: 'zinc',
          amber: 'zinc',
          blue: 'zinc',
          rose: 'zinc',
          cyan: 'zinc',
        },
        categories: { Location: 'zinc', Faction: 'zinc', Lore: 'zinc', Artifact: 'zinc' },
      };
    case 'warm':
      return {
        ...draftSettings,
        preferences: { ...currentPrefs, colorPreset: 'warm' },
        roles: { Protagonist: 'amber', Antagonist: 'rose', Supporting: 'orange', Minor: 'zinc' },
        storylines: {
          emerald: 'amber',
          purple: 'rose',
          amber: 'orange',
          blue: 'amber',
          rose: 'rose',
          cyan: 'orange',
        },
        categories: { Location: 'orange', Faction: 'amber', Lore: 'rose', Artifact: 'amber' },
      };
    case 'cyber':
      return {
        ...draftSettings,
        preferences: { ...currentPrefs, colorPreset: 'cyber' },
        roles: { Protagonist: 'cyan', Antagonist: 'purple', Supporting: 'emerald', Minor: 'zinc' },
        storylines: {
          emerald: 'cyan',
          purple: 'purple',
          amber: 'rose',
          blue: 'blue',
          rose: 'purple',
          cyan: 'emerald',
        },
        categories: { Location: 'blue', Faction: 'purple', Lore: 'cyan', Artifact: 'rose' },
      };
    case 'default':
    default:
      return {
        ...DEFAULT_APP_SETTINGS,
        preferences: { ...currentPrefs, colorPreset: 'default' },
      };
  }
}
