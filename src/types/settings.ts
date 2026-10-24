export type ColorThemeKey =
  | 'emerald'
  | 'rose'
  | 'blue'
  | 'amber'
  | 'purple'
  | 'cyan'
  | 'orange'
  | 'zinc';

export interface AppColorSettings {
  roles: {
    Protagonist: ColorThemeKey | string;
    Antagonist: ColorThemeKey | string;
    Supporting: ColorThemeKey | string;
    Minor: ColorThemeKey | string;
    [customRole: string]: ColorThemeKey | string;
  };
  storylines: {
    emerald: ColorThemeKey | string;
    purple: ColorThemeKey | string;
    amber: ColorThemeKey | string;
    blue: ColorThemeKey | string;
    rose: ColorThemeKey | string;
    cyan: ColorThemeKey | string;
    [customStoryline: string]: ColorThemeKey | string;
  };
  categories: {
    Location: ColorThemeKey | string;
    Faction: ColorThemeKey | string;
    Lore: ColorThemeKey | string;
    Artifact: ColorThemeKey | string;
    [customCategory: string]: ColorThemeKey | string;
  };
}

export interface SwatchMeta {
  name: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotBg: string;
  dotBorder: string;
  hexPreview: string;
}

export const COLOR_SWATCHES: Record<ColorThemeKey, SwatchMeta> & Record<string, SwatchMeta | undefined> = {
  emerald: {
    name: 'Emerald',
    badgeBg: 'bg-emerald-950/70',
    badgeBorder: 'border-emerald-800/80',
    badgeText: 'text-emerald-300',
    dotBg: 'bg-emerald-500',
    dotBorder: 'border-emerald-400',
    hexPreview: '#10b981',
  },
  rose: {
    name: 'Rose',
    badgeBg: 'bg-rose-950/70',
    badgeBorder: 'border-rose-800/80',
    badgeText: 'text-rose-300',
    dotBg: 'bg-rose-500',
    dotBorder: 'border-rose-400',
    hexPreview: '#f43f5e',
  },
  blue: {
    name: 'Blue',
    badgeBg: 'bg-blue-950/70',
    badgeBorder: 'border-blue-800/80',
    badgeText: 'text-blue-300',
    dotBg: 'bg-blue-500',
    dotBorder: 'border-blue-400',
    hexPreview: '#3b82f6',
  },
  amber: {
    name: 'Amber',
    badgeBg: 'bg-amber-950/70',
    badgeBorder: 'border-amber-800/80',
    badgeText: 'text-amber-300',
    dotBg: 'bg-amber-500',
    dotBorder: 'border-amber-400',
    hexPreview: '#f59e0b',
  },
  purple: {
    name: 'Purple',
    badgeBg: 'bg-purple-950/70',
    badgeBorder: 'border-purple-800/80',
    badgeText: 'text-purple-300',
    dotBg: 'bg-purple-500',
    dotBorder: 'border-purple-400',
    hexPreview: '#a855f7',
  },
  cyan: {
    name: 'Cyan',
    badgeBg: 'bg-cyan-950/70',
    badgeBorder: 'border-cyan-800/80',
    badgeText: 'text-cyan-300',
    dotBg: 'bg-cyan-500',
    dotBorder: 'border-cyan-400',
    hexPreview: '#06b6d4',
  },
  orange: {
    name: 'Orange',
    badgeBg: 'bg-orange-950/70',
    badgeBorder: 'border-orange-800/80',
    badgeText: 'text-orange-300',
    dotBg: 'bg-orange-500',
    dotBorder: 'border-orange-400',
    hexPreview: '#f97316',
  },
  zinc: {
    name: 'Zinc (Neutral)',
    badgeBg: 'bg-zinc-850',
    badgeBorder: 'border-zinc-700',
    badgeText: 'text-zinc-300',
    dotBg: 'bg-zinc-400',
    dotBorder: 'border-zinc-300',
    hexPreview: '#71717a',
  },
};

export const DEFAULT_COLOR_SETTINGS: AppColorSettings = {
  roles: {
    Protagonist: 'emerald',
    Antagonist: 'rose',
    Supporting: 'blue',
    Minor: 'zinc',
  },
  storylines: {
    emerald: 'emerald',
    purple: 'purple',
    amber: 'amber',
    blue: 'blue',
    rose: 'rose',
    cyan: 'cyan',
  },
  categories: {
    Location: 'cyan',
    Faction: 'amber',
    Lore: 'emerald',
    Artifact: 'purple',
  },
};

export type EditorFontFamily =
  | 'serif'
  | 'garamond'
  | 'sans'
  | 'humanist'
  | 'mono'
  | 'bookman';

export type Language = 'en' | 'es';
export type ThemeMode = 'dark' | 'light' | 'custom';

export interface CustomThemeColors {
  background: string;
  surface: string;
  primary: string;
  text: string;
}

export const DEFAULT_CUSTOM_THEME: CustomThemeColors = {
  background: '#09090b',
  surface: '#18181b',
  primary: '#10b981',
  text: '#f4f4f5',
};

export interface AppPreferences {
  timelineDropMode: 'shift' | 'swap';
  persistViewFilters: boolean;
  preserveManualSceneWidth?: boolean;
  editorIndentFirstLine?: boolean;
  editorFontFamily?: EditorFontFamily;
  language?: Language;
  themeMode?: ThemeMode;
  customTheme?: CustomThemeColors;
  colorPreset?: 'default' | 'monochrome' | 'warm' | 'cyber' | 'custom';
  saveMode?: 'auto' | 'manual';
}

export interface AppSettings extends AppColorSettings {
  preferences: AppPreferences;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  timelineDropMode: 'shift',
  persistViewFilters: false,
  preserveManualSceneWidth: false,
  editorIndentFirstLine: true,
  editorFontFamily: 'serif',
  language: 'en',
  themeMode: 'dark',
  customTheme: DEFAULT_CUSTOM_THEME,
  colorPreset: 'default',
  saveMode: 'auto',
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  ...DEFAULT_COLOR_SETTINGS,
  preferences: DEFAULT_PREFERENCES,
};

const STORAGE_KEY = 'foliant_app_settings_v1';
const LEGACY_COLOR_STORAGE_KEY = 'foliant_color_settings_v1';

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_APP_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_COLOR_STORAGE_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      roles: { ...DEFAULT_COLOR_SETTINGS.roles, ...(parsed.roles || {}) },
      storylines: { ...DEFAULT_COLOR_SETTINGS.storylines, ...(parsed.storylines || {}) },
      categories: { ...DEFAULT_COLOR_SETTINGS.categories, ...(parsed.categories || {}) },
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...(parsed.preferences || {}),
        customTheme: {
          ...DEFAULT_CUSTOM_THEME,
          ...(parsed.preferences?.customTheme || {}),
        },
      },
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Also mirror to legacy key for compatibility
    localStorage.setItem(LEGACY_COLOR_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Non-fatal if localStorage is unavailable
  }
}

export function loadColorSettings(): AppColorSettings {
  return loadSettings();
}

export function saveColorSettings(settings: AppColorSettings): void {
  const current = loadSettings();
  saveSettings({
    ...current,
    ...settings,
    preferences: current.preferences || DEFAULT_PREFERENCES,
  });
}

export function getRoleColorKey(role: string, settings?: AppColorSettings): ColorThemeKey | string {
  if (!settings) {
    return (
      (DEFAULT_COLOR_SETTINGS.roles as Record<string, ColorThemeKey>)[role] || 'zinc'
    );
  }
  return settings.roles[role] || (DEFAULT_COLOR_SETTINGS.roles as Record<string, ColorThemeKey>)[role] || 'zinc';
}
