import { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Globe,
  RotateCcw,
  Check,
  Palette,
  Plus,
  Trash2,
  Clock,
  Layers,
  Languages,
  Zap,
  Save,
} from 'lucide-react';
import {
  AppSettings,
  AppPreferences,
  Language,
  CustomThemeColors,
  DEFAULT_CUSTOM_THEME,
  ColorThemeKey,
  COLOR_SWATCHES,
  DEFAULT_PREFERENCES,
  DEFAULT_APP_SETTINGS,
  saveSettings,
} from '../../types/settings';
import { useTranslation } from '../../i18n/translations';
import { DarkColorPicker } from '../common/DarkColorPicker';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

type SettingsSection = 'general' | 'appearance' | 'editor' | 'timeline' | 'taxonomy';
type TaxonomySubTab = 'roles' | 'storylines' | 'categories' | 'presets';

function resolveColorHex(val: string): string {
  if (val.startsWith('#')) return val;
  return COLOR_SWATCHES[val as ColorThemeKey]?.hexPreview || '#71717a';
}

const COLOR_TRANSLATION_MAP: Record<string, string> = {
  amber: 'colorAmber',
  blue: 'colorBlue',
  cyan: 'colorCyan',
  emerald: 'colorEmerald',
  fuchsia: 'colorFuchsia',
  green: 'colorGreen',
  indigo: 'colorIndigo',
  lime: 'colorLime',
  orange: 'colorOrange',
  pink: 'colorPink',
  purple: 'colorPurple',
  red: 'colorRed',
  rose: 'colorRose',
  sky: 'colorSky',
  teal: 'colorTeal',
  violet: 'colorViolet',
  yellow: 'colorYellow',
  zinc: 'colorZinc',
};

function getColorLabel(c: string, t: (key: string, fallback?: string) => string): string {
  const transKey = COLOR_TRANSLATION_MAP[c.toLowerCase()];
  return transKey ? t(transKey) : c;
}

function getRoleLabel(role: string, t: (key: string, fallback?: string) => string): string {
  switch (role) {
    case 'Protagonist':
      return t('roleProtagonist');
    case 'Antagonist':
      return t('roleAntagonist');
    case 'Supporting':
      return t('roleSupporting');
    case 'Minor':
      return t('roleMinor');
    default:
      return role;
  }
}

function getCategoryLabel(category: string, t: (key: string, fallback?: string) => string): string {
  switch (category) {
    case 'Location':
      return t('catLocation');
    case 'Faction':
      return t('catFaction');
    case 'Lore':
      return t('catMagic');
    case 'Artifact':
      return t('catObject');
    default:
      return category;
  }
}

function getStorylineLabel(key: string, t: (key: string, fallback?: string) => string): string {
  const colorTrans = COLOR_TRANSLATION_MAP[key.toLowerCase()];
  return colorTrans ? t(colorTrans) : key;
}


export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [taxonomyTab, setTaxonomyTab] = useState<TaxonomySubTab>('roles');
  const [draftSettings, setDraftSettings] = useState<AppSettings>(() => ({
    ...settings,
    preferences: settings.preferences || DEFAULT_PREFERENCES,
  }));

  // Forms for adding custom items
  const [newCustomRoleName, setNewCustomRoleName] = useState('');
  const [newCustomRoleColor, setNewCustomRoleColor] = useState<string>('blue');

  const [newCustomStorylineName, setNewCustomStorylineName] = useState('');
  const [newCustomStorylineColor, setNewCustomStorylineColor] = useState<string>('emerald');

  const [newCustomCategoryName, setNewCustomCategoryName] = useState('');
  const [newCustomCategoryColor, setNewCustomCategoryColor] = useState<string>('amber');

  // Unified color picker popup
  const [activeColorPicker, setActiveColorPicker] = useState<{
    type: 'role' | 'storyline' | 'category' | 'theme';
    key: string;
    color: string;
    title: string;
  } | null>(null);

  // Sync draft whenever opened or incoming settings update
  useEffect(() => {
    if (isOpen) {
      setDraftSettings({
        ...settings,
        preferences: settings.preferences || DEFAULT_PREFERENCES,
      });
    }
  }, [isOpen, settings]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeColorPicker) {
          setActiveColorPicker(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, activeColorPicker]);

  if (!isOpen) return null;

  const currentLang: Language = draftSettings.preferences?.language || 'en';
  const { t } = useTranslation(currentLang);

  const handlePreferenceChange = <K extends keyof AppPreferences>(
    key: K,
    val: AppPreferences[K]
  ) => {
    const updated: AppSettings = {
      ...draftSettings,
      preferences: {
        ...(draftSettings.preferences || DEFAULT_PREFERENCES),
        [key]: val,
      },
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveSettings(updated);
  };

  const handleRoleColorChange = (role: string, color: string) => {
    const updated: AppSettings = {
      ...draftSettings,
      preferences: {
        ...(draftSettings.preferences || DEFAULT_PREFERENCES),
        colorPreset: 'custom',
      },
      roles: {
        ...draftSettings.roles,
        [role]: color,
      },
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveSettings(updated);
  };

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomRoleName.trim()) return;
    const trimmed = newCustomRoleName.trim();
    const updated: AppSettings = {
      ...draftSettings,
      preferences: {
        ...(draftSettings.preferences || DEFAULT_PREFERENCES),
        colorPreset: 'custom',
      },
      roles: {
        ...draftSettings.roles,
        [trimmed]: newCustomRoleColor,
      },
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveSettings(updated);
    setNewCustomRoleName('');
  };

  const handleRemoveCustomRole = (role: string) => {
    const nextRoles = { ...draftSettings.roles };
    delete nextRoles[role];
    const updated: AppSettings = {
      ...draftSettings,
      preferences: {
        ...(draftSettings.preferences || DEFAULT_PREFERENCES),
        colorPreset: 'custom',
      },
      roles: nextRoles,
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveSettings(updated);
  };

  const handleStorylineColorChange = (key: string, color: string) => {
    const updated: AppSettings = {
      ...draftSettings,
      preferences: {
        ...(draftSettings.preferences || DEFAULT_PREFERENCES),
        colorPreset: 'custom',
      },
      storylines: {
        ...draftSettings.storylines,
        [key]: color,
      },
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveSettings(updated);
  };

  const handleAddCustomStoryline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomStorylineName.trim()) return;
    const trimmed = newCustomStorylineName.trim();
    const updated: AppSettings = {
      ...draftSettings,
      preferences: {
        ...(draftSettings.preferences || DEFAULT_PREFERENCES),
        colorPreset: 'custom',
      },
      storylines: {
        ...draftSettings.storylines,
        [trimmed]: newCustomStorylineColor,
      },
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveSettings(updated);
    setNewCustomStorylineName('');
  };

  const handleRemoveCustomStoryline = (key: string) => {
    const nextStorylines = { ...draftSettings.storylines };
    delete nextStorylines[key];
    const updated: AppSettings = {
      ...draftSettings,
      preferences: {
        ...(draftSettings.preferences || DEFAULT_PREFERENCES),
        colorPreset: 'custom',
      },
      storylines: nextStorylines,
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveSettings(updated);
  };

  const handleCategoryColorChange = (category: string, color: string) => {
    const updated: AppSettings = {
      ...draftSettings,
      preferences: {
        ...(draftSettings.preferences || DEFAULT_PREFERENCES),
        colorPreset: 'custom',
      },
      categories: {
        ...draftSettings.categories,
        [category]: color,
      },
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveSettings(updated);
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomCategoryName.trim()) return;
    const trimmed = newCustomCategoryName.trim();
    const updated: AppSettings = {
      ...draftSettings,
      preferences: {
        ...(draftSettings.preferences || DEFAULT_PREFERENCES),
        colorPreset: 'custom',
      },
      categories: {
        ...draftSettings.categories,
        [trimmed]: newCustomCategoryColor,
      },
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveSettings(updated);
    setNewCustomCategoryName('');
  };

  const handleRemoveCustomCategory = (key: string) => {
    const nextCategories = { ...draftSettings.categories };
    delete nextCategories[key];
    const updated: AppSettings = {
      ...draftSettings,
      preferences: {
        ...(draftSettings.preferences || DEFAULT_PREFERENCES),
        colorPreset: 'custom',
      },
      categories: nextCategories,
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveSettings(updated);
  };

  const handleResetToDefault = () => {
    if (window.confirm(t('resetDefaultsConfirm'))) {
      setDraftSettings(DEFAULT_APP_SETTINGS);
      onUpdateSettings(DEFAULT_APP_SETTINGS);
      saveSettings(DEFAULT_APP_SETTINGS);
    }
  };

  const applyPreset = (preset: 'default' | 'monochrome' | 'warm' | 'cyber') => {
    let nextColors: AppSettings;
    const currentPrefs = draftSettings.preferences || DEFAULT_PREFERENCES;
    switch (preset) {
      case 'monochrome':
        nextColors = {
          ...draftSettings,
          preferences: { ...currentPrefs, colorPreset: 'monochrome' },
          roles: {
            Protagonist: 'zinc',
            Antagonist: 'zinc',
            Supporting: 'zinc',
            Minor: 'zinc',
          },
          storylines: {
            emerald: 'zinc',
            purple: 'zinc',
            amber: 'zinc',
            blue: 'zinc',
            rose: 'zinc',
            cyan: 'zinc',
          },
          categories: {
            Location: 'zinc',
            Faction: 'zinc',
            Lore: 'zinc',
            Artifact: 'zinc',
          },
        };
        break;
      case 'warm':
        nextColors = {
          ...draftSettings,
          preferences: { ...currentPrefs, colorPreset: 'warm' },
          roles: {
            Protagonist: 'amber',
            Antagonist: 'rose',
            Supporting: 'orange',
            Minor: 'zinc',
          },
          storylines: {
            emerald: 'amber',
            purple: 'rose',
            amber: 'orange',
            blue: 'amber',
            rose: 'rose',
            cyan: 'orange',
          },
          categories: {
            Location: 'orange',
            Faction: 'amber',
            Lore: 'rose',
            Artifact: 'amber',
          },
        };
        break;
      case 'cyber':
        nextColors = {
          ...draftSettings,
          preferences: { ...currentPrefs, colorPreset: 'cyber' },
          roles: {
            Protagonist: 'cyan',
            Antagonist: 'purple',
            Supporting: 'emerald',
            Minor: 'zinc',
          },
          storylines: {
            emerald: 'cyan',
            purple: 'purple',
            amber: 'rose',
            blue: 'blue',
            rose: 'purple',
            cyan: 'emerald',
          },
          categories: {
            Location: 'blue',
            Faction: 'purple',
            Lore: 'cyan',
            Artifact: 'rose',
          },
        };
        break;
      case 'default':
      default:
        nextColors = {
          ...DEFAULT_APP_SETTINGS,
          preferences: { ...currentPrefs, colorPreset: 'default' },
        };
        break;
    }
    setDraftSettings(nextColors);
    onUpdateSettings(nextColors);
    saveSettings(nextColors);
  };

  const customTheme = draftSettings.preferences?.customTheme || DEFAULT_CUSTOM_THEME;

  const handleCustomColorChange = (channel: keyof CustomThemeColors, val: string) => {
    const updatedCustom: CustomThemeColors = {
      ...customTheme,
      [channel]: val,
    };
    handlePreferenceChange('customTheme', updatedCustom);
  };

  const colorKeys = Object.keys(COLOR_SWATCHES) as ColorThemeKey[];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Studio Settings"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[620px] max-h-[88vh] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200">
              <Sliders className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                {t('studioSettings')}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            title={t('closeSettings')}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop Two-Column Body: Left Sidebar + Right Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar Navigation */}
          <nav className="w-56 shrink-0 bg-zinc-900/40 border-r border-zinc-800 p-3 flex flex-col gap-1 overflow-y-auto">
            <button
              onClick={() => setActiveSection('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition cursor-pointer text-left ${
                activeSection === 'general'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0 text-zinc-300" />
              <span>{t('categoryGeneral')}</span>
            </button>

            <button
              onClick={() => setActiveSection('appearance')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition cursor-pointer text-left ${
                activeSection === 'appearance'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
              }`}
            >
              <Palette className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{t('categoryAppearance')}</span>
            </button>

            <button
              onClick={() => setActiveSection('editor')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition cursor-pointer text-left ${
                activeSection === 'editor'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0 text-zinc-300" />
              <span>{t('categoryEditor')}</span>
            </button>

            <button
              onClick={() => setActiveSection('timeline')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition cursor-pointer text-left ${
                activeSection === 'timeline'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0 text-zinc-300" />
              <span>{t('categoryTimeline')}</span>
            </button>

            <button
              onClick={() => setActiveSection('taxonomy')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition cursor-pointer text-left ${
                activeSection === 'taxonomy'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0 text-zinc-300" />
              <span>{t('categoryTaxonomy')}</span>
            </button>
          </nav>

          {/* Right Content Panel */}
          <main className="flex-1 overflow-y-auto p-6 bg-zinc-950 space-y-6">
            {/* 1. GENERAL SECTION */}
            {activeSection === 'general' && (
              <div className="space-y-6 animate-in fade-in duration-100">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">
                    {t('categoryGeneral')}
                  </h3>
                </div>

                {/* Language Picker Card */}
                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                      <Languages className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{t('language')}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => handlePreferenceChange('language', 'en')}
                      className={`flex items-center justify-between p-3 rounded-md border text-xs font-medium transition cursor-pointer ${
                        currentLang === 'en'
                          ? 'border-emerald-500 bg-emerald-950/20 text-zinc-100 ring-1 ring-emerald-500/40'
                          : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🇬🇧</span>
                        <div className="text-left font-semibold">{t('english')}</div>
                      </div>
                      {currentLang === 'en' && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>

                    <button
                      onClick={() => handlePreferenceChange('language', 'es')}
                      className={`flex items-center justify-between p-3 rounded-md border text-xs font-medium transition cursor-pointer ${
                        currentLang === 'es'
                          ? 'border-emerald-500 bg-emerald-950/20 text-zinc-100 ring-1 ring-emerald-500/40'
                          : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🇪🇸</span>
                        <div className="text-left font-semibold">{t('spanish')}</div>
                      </div>
                      {currentLang === 'es' && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  </div>
                </div>

                {/* Save Mode Selector Card */}
                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                      <Save className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{t('saveMode')}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Auto-save */}
                    <button
                      type="button"
                      onClick={() => handlePreferenceChange('saveMode', 'auto')}
                      className={`flex flex-col justify-between p-3 rounded-md border text-xs font-medium transition cursor-pointer text-left space-y-2 ${
                        (draftSettings.preferences?.saveMode || 'auto') === 'auto'
                          ? 'border-emerald-500 bg-emerald-950/20 text-zinc-100 ring-1 ring-emerald-500/40'
                          : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 font-semibold">
                          <Zap className="w-4 h-4 text-emerald-400" />
                          <span>{t('saveModeAuto')}</span>
                        </div>
                        {(draftSettings.preferences?.saveMode || 'auto') === 'auto' && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                        {t('saveModeAutoDesc')}
                      </p>
                    </button>

                    {/* Manual save with button */}
                    <button
                      type="button"
                      onClick={() => handlePreferenceChange('saveMode', 'manual')}
                      className={`flex flex-col justify-between p-3 rounded-md border text-xs font-medium transition cursor-pointer text-left space-y-2 ${
                        draftSettings.preferences?.saveMode === 'manual'
                          ? 'border-emerald-500 bg-emerald-950/20 text-zinc-100 ring-1 ring-emerald-500/40'
                          : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 font-semibold">
                          <Save className="w-4 h-4 text-blue-400" />
                          <span>{t('saveModeManual')}</span>
                        </div>
                        {draftSettings.preferences?.saveMode === 'manual' && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                        {t('saveModeManualDesc')}
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. APPEARANCE & THEME SECTION */}
            {activeSection === 'appearance' && (
              <div className="space-y-6 animate-in fade-in duration-100">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">
                    {t('categoryAppearance')}
                  </h3>
                </div>

                {/* Theme Mode Selector Card */}
                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-200">
                      {t('themeMode')}
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {/* Dark Card */}
                    <button
                      onClick={() => handlePreferenceChange('themeMode', 'dark')}
                      className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-20 ${
                        (draftSettings.preferences?.themeMode || 'dark') === 'dark'
                          ? 'border-emerald-500 bg-zinc-950 ring-1 ring-emerald-500/50'
                          : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-5 h-5 rounded-full bg-zinc-950 border border-zinc-700" />
                        {(draftSettings.preferences?.themeMode || 'dark') === 'dark' && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-xs font-semibold text-zinc-100">{t('dark')}</div>
                    </button>

                    {/* Light Card */}
                    <button
                      onClick={() => handlePreferenceChange('themeMode', 'light')}
                      className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-20 ${
                        draftSettings.preferences?.themeMode === 'light'
                          ? 'border-emerald-500 bg-white ring-1 ring-emerald-500/50'
                          : 'border-zinc-800 bg-zinc-100 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-5 h-5 rounded-full bg-white border border-zinc-300" />
                        {draftSettings.preferences?.themeMode === 'light' && (
                          <Check className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div className="text-xs font-semibold text-zinc-900">{t('light')}</div>
                    </button>

                    {/* Custom Card */}
                    <button
                      onClick={() => handlePreferenceChange('themeMode', 'custom')}
                      className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-20 ${
                        draftSettings.preferences?.themeMode === 'custom'
                          ? 'border-emerald-500 bg-zinc-900 ring-1 ring-emerald-500/50'
                          : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-1">
                          <span
                            className="w-4 h-4 rounded-full border border-black/30"
                            style={{ backgroundColor: customTheme.background }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/30"
                            style={{ backgroundColor: customTheme.primary }}
                          />
                        </div>
                        {draftSettings.preferences?.themeMode === 'custom' && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-xs font-semibold text-zinc-100">{t('custom')}</div>
                    </button>
                  </div>
                </div>

                {/* Custom Palette Engine (Visible when custom theme is selected) */}
                {draftSettings.preferences?.themeMode === 'custom' && (
                  <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-4 animate-in fade-in duration-150">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">
                        {t('customThemeColors')}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Background */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-zinc-300">
                          {t('background')}
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveColorPicker({
                                type: 'theme',
                                key: 'background',
                                color: customTheme.background,
                                title: t('background'),
                              })
                            }
                            className="w-8 h-8 rounded-md border border-zinc-700 cursor-pointer shrink-0 shadow-xs hover:scale-105 transition"
                            style={{ backgroundColor: customTheme.background }}
                            title={t('chooseColor')}
                          />
                          <input
                            type="text"
                            value={customTheme.background}
                            onChange={(e) => handleCustomColorChange('background', e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-zinc-600 uppercase"
                          />
                        </div>
                      </div>

                      {/* Surface */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-zinc-300">
                          {t('surface')}
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveColorPicker({
                                type: 'theme',
                                key: 'surface',
                                color: customTheme.surface,
                                title: t('surface'),
                              })
                            }
                            className="w-8 h-8 rounded-md border border-zinc-700 cursor-pointer shrink-0 shadow-xs hover:scale-105 transition"
                            style={{ backgroundColor: customTheme.surface }}
                            title={t('chooseColor')}
                          />
                          <input
                            type="text"
                            value={customTheme.surface}
                            onChange={(e) => handleCustomColorChange('surface', e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-zinc-600 uppercase"
                          />
                        </div>
                      </div>

                      {/* Primary Accent */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-zinc-300">
                          {t('primary')}
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveColorPicker({
                                type: 'theme',
                                key: 'primary',
                                color: customTheme.primary,
                                title: t('primary'),
                              })
                            }
                            className="w-8 h-8 rounded-md border border-zinc-700 cursor-pointer shrink-0 shadow-xs hover:scale-105 transition"
                            style={{ backgroundColor: customTheme.primary }}
                            title={t('chooseColor')}
                          />
                          <input
                            type="text"
                            value={customTheme.primary}
                            onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-zinc-600 uppercase"
                          />
                        </div>
                      </div>

                      {/* Text */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-zinc-300">
                          {t('text')}
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveColorPicker({
                                type: 'theme',
                                key: 'text',
                                color: customTheme.text,
                                title: t('text'),
                              })
                            }
                            className="w-8 h-8 rounded-md border border-zinc-700 cursor-pointer shrink-0 shadow-xs hover:scale-105 transition"
                            style={{ backgroundColor: customTheme.text }}
                            title={t('chooseColor')}
                          />
                          <input
                            type="text"
                            value={customTheme.text}
                            onChange={(e) => handleCustomColorChange('text', e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-zinc-600 uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live Preview Box */}
                    <div
                      className="p-3 rounded-md border flex items-center justify-between mt-2"
                      style={{
                        backgroundColor: customTheme.surface,
                        borderColor: customTheme.primary + '55',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: customTheme.primary }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: customTheme.text }}
                        >
                          {t('dynamicPreview')}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-sm text-xs font-semibold text-white shadow-xs"
                        style={{ backgroundColor: customTheme.primary }}
                      >
                        {t('actionAccent')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. EDITOR & TYPOGRAPHY SECTION */}
            {activeSection === 'editor' && (
              <div className="space-y-6 animate-in fade-in duration-100">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">
                    {t('categoryEditor')}
                  </h3>
                </div>

                {/* First-Line Indent Card */}
                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">
                      {t('automaticIndent')}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={draftSettings.preferences?.editorIndentFirstLine ?? true}
                      onChange={(e) =>
                        handlePreferenceChange('editorIndentFirstLine', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>
              </div>
            )}

            {/* 4. TIMELINE & CARDS SECTION */}
            {activeSection === 'timeline' && (
              <div className="space-y-6 animate-in fade-in duration-100">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">
                    {t('categoryTimeline')}
                  </h3>
                </div>

                {/* Drag & Drop Mode Card */}
                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-200">
                      {t('timelineDropMode')}
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => handlePreferenceChange('timelineDropMode', 'shift')}
                      className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-center h-16 ${
                        (draftSettings.preferences?.timelineDropMode || 'shift') === 'shift'
                          ? 'border-emerald-500 bg-emerald-950/20 text-zinc-100 ring-1 ring-emerald-500/40'
                          : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{t('shiftMode')}</span>
                        {(draftSettings.preferences?.timelineDropMode || 'shift') === 'shift' && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => handlePreferenceChange('timelineDropMode', 'swap')}
                      className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-center h-16 ${
                        draftSettings.preferences?.timelineDropMode === 'swap'
                          ? 'border-emerald-500 bg-emerald-950/20 text-zinc-100 ring-1 ring-emerald-500/40'
                          : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{t('swapMode')}</span>
                        {draftSettings.preferences?.timelineDropMode === 'swap' && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Preserve Card Width on Zoom */}
                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">
                      {t('preserveSceneWidth')}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={draftSettings.preferences?.preserveManualSceneWidth ?? false}
                      onChange={(e) =>
                        handlePreferenceChange('preserveManualSceneWidth', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>
              </div>
            )}

            {/* 5. TAGS & TAXONOMY SECTION */}
            {activeSection === 'taxonomy' && (
              <div className="space-y-6 animate-in fade-in duration-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100">
                      {t('categoryTaxonomy')}
                    </h3>
                  </div>

                  {/* Sub-Tabs switcher */}
                  <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
                    <button
                      onClick={() => setTaxonomyTab('roles')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                        taxonomyTab === 'roles'
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t('characterRoles')}
                    </button>
                    <button
                      onClick={() => setTaxonomyTab('storylines')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                        taxonomyTab === 'storylines'
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t('storylineTags')}
                    </button>
                    <button
                      onClick={() => setTaxonomyTab('categories')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                        taxonomyTab === 'categories'
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t('worldLore')}
                    </button>
                    <button
                      onClick={() => setTaxonomyTab('presets')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                        taxonomyTab === 'presets'
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t('presets')}
                    </button>
                  </div>
                </div>

                {/* Sub-Tab: ROLES */}
                {taxonomyTab === 'roles' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
                      <div className="space-y-2">
                        {Object.entries(draftSettings.roles).map(([role, color]) => {
                          const isCustomRole = ![
                            'Protagonist',
                            'Antagonist',
                            'Supporting',
                            'Minor',
                          ].includes(role);
                          const hex = resolveColorHex(color);

                          return (
                            <div
                              key={role}
                              className="flex items-center justify-between p-2.5 rounded-md bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-xs font-medium text-zinc-200">
                                  {getRoleLabel(role, t)}
                                </span>
                                {isCustomRole && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-xs">
                                    {t('customBadge')}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={color.startsWith('#') ? 'custom' : color}
                                  onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                      setActiveColorPicker({
                                        type: 'role',
                                        key: role,
                                        color: hex,
                                        title: `${getRoleLabel(role, t)} - ${t('color')}`,
                                      });
                                    } else {
                                      handleRoleColorChange(role, e.target.value);
                                    }
                                  }}
                                  className="text-xs bg-zinc-950 border border-zinc-700 rounded-sm px-2 py-1 text-zinc-200 capitalize cursor-pointer focus:outline-hidden"
                                >
                                  {colorKeys.map((c) => (
                                    <option key={c} value={c}>
                                      {getColorLabel(c, t)}
                                    </option>
                                  ))}
                                  <option value="custom">
                                    {color.startsWith('#') ? color : t('customColor')}
                                  </option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveColorPicker({
                                      type: 'role',
                                      key: role,
                                      color: hex,
                                      title: `${getRoleLabel(role, t)} - ${t('color')}`,
                                    })
                                  }
                                  title={t('chooseColor')}
                                  className="w-4 h-4 rounded-full border border-black/30 shrink-0 cursor-pointer shadow-xs hover:scale-115 transition"
                                  style={{ backgroundColor: hex }}
                                />

                                {isCustomRole && (
                                  <button
                                    onClick={() => handleRemoveCustomRole(role)}
                                    title={t('deleteCustomRole')}
                                    className="p-1 rounded-sm text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Custom Role Form */}
                      <form
                        onSubmit={handleAddCustomRole}
                        className="pt-3 border-t border-zinc-800/80 flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={newCustomRoleName}
                          onChange={(e) => setNewCustomRoleName(e.target.value)}
                          placeholder={t('roleNamePlaceholder')}
                          className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 focus:outline-hidden focus:border-zinc-600"
                        />
                        <select
                          value={newCustomRoleColor.startsWith('#') ? 'custom' : newCustomRoleColor}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setActiveColorPicker({
                                type: 'role',
                                key: '__new_role__',
                                color: resolveColorHex(newCustomRoleColor),
                                title: t('addCustomRole'),
                              });
                            } else {
                              setNewCustomRoleColor(e.target.value);
                            }
                          }}
                          className="text-xs bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1.5 text-zinc-200 capitalize cursor-pointer focus:outline-hidden"
                        >
                          {colorKeys.map((c) => (
                            <option key={c} value={c}>
                              {getColorLabel(c, t)}
                            </option>
                          ))}
                          <option value="custom">
                            {newCustomRoleColor.startsWith('#')
                              ? newCustomRoleColor
                              : t('customColor')}
                          </option>
                        </select>
                        <button
                          type="submit"
                          disabled={!newCustomRoleName.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('add')}</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Sub-Tab: STORYLINES */}
                {taxonomyTab === 'storylines' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
                      <div className="space-y-2">
                        {Object.entries(draftSettings.storylines).map(([storylineKey, color]) => {
                          const isCustomStoryline = ![
                            'emerald',
                            'purple',
                            'amber',
                            'blue',
                            'rose',
                            'cyan',
                          ].includes(storylineKey);
                          const hex = resolveColorHex(color);

                          return (
                            <div
                              key={storylineKey}
                              className="flex items-center justify-between p-2.5 rounded-md bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-zinc-200 capitalize">
                                  {getStorylineLabel(storylineKey, t)}
                                </span>
                                {isCustomStoryline && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-xs">
                                    {t('customBadge')}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={color.startsWith('#') ? 'custom' : color}
                                  onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                      setActiveColorPicker({
                                        type: 'storyline',
                                        key: storylineKey,
                                        color: hex,
                                        title: `${getStorylineLabel(storylineKey, t)} - ${t('color')}`,
                                      });
                                    } else {
                                      handleStorylineColorChange(storylineKey, e.target.value);
                                    }
                                  }}
                                  className="text-xs bg-zinc-950 border border-zinc-700 rounded-sm px-2 py-1 text-zinc-200 capitalize cursor-pointer focus:outline-hidden"
                                >
                                  {colorKeys.map((c) => (
                                    <option key={c} value={c}>
                                      {getColorLabel(c, t)}
                                    </option>
                                  ))}
                                  <option value="custom">
                                    {color.startsWith('#') ? color : t('customColor')}
                                  </option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveColorPicker({
                                      type: 'storyline',
                                      key: storylineKey,
                                      color: hex,
                                      title: `${getStorylineLabel(storylineKey, t)} - ${t('color')}`,
                                    })
                                  }
                                  title={t('chooseColor')}
                                  className="w-4 h-4 rounded-full border border-black/30 shrink-0 cursor-pointer shadow-xs hover:scale-115 transition"
                                  style={{ backgroundColor: hex }}
                                />

                                {isCustomStoryline && (
                                  <button
                                    onClick={() => handleRemoveCustomStoryline(storylineKey)}
                                    title={t('deleteCustomStoryline')}
                                    className="p-1 rounded-sm text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Custom Storyline Form */}
                      <form
                        onSubmit={handleAddCustomStoryline}
                        className="pt-3 border-t border-zinc-800/80 flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={newCustomStorylineName}
                          onChange={(e) => setNewCustomStorylineName(e.target.value)}
                          placeholder={t('storylineNamePlaceholder')}
                          className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 focus:outline-hidden focus:border-zinc-600"
                        />
                        <select
                          value={
                            newCustomStorylineColor.startsWith('#')
                              ? 'custom'
                              : newCustomStorylineColor
                          }
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setActiveColorPicker({
                                type: 'storyline',
                                key: '__new_storyline__',
                                color: resolveColorHex(newCustomStorylineColor),
                                title: t('addCustomStoryline'),
                              });
                            } else {
                              setNewCustomStorylineColor(e.target.value);
                            }
                          }}
                          className="text-xs bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1.5 text-zinc-200 capitalize cursor-pointer focus:outline-hidden"
                        >
                          {colorKeys.map((c) => (
                            <option key={c} value={c}>
                              {getColorLabel(c, t)}
                            </option>
                          ))}
                          <option value="custom">
                            {newCustomStorylineColor.startsWith('#')
                              ? newCustomStorylineColor
                              : t('customColor')}
                          </option>
                        </select>
                        <button
                          type="submit"
                          disabled={!newCustomStorylineName.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('add')}</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Sub-Tab: CATEGORIES */}
                {taxonomyTab === 'categories' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
                      <div className="space-y-2">
                        {Object.entries(draftSettings.categories).map(([category, color]) => {
                          const isCustomCat = ![
                            'Location',
                            'Faction',
                            'Lore',
                            'Artifact',
                          ].includes(category);
                          const hex = resolveColorHex(color);

                          return (
                            <div
                              key={category}
                              className="flex items-center justify-between p-2.5 rounded-md bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-zinc-200 capitalize">
                                  {getCategoryLabel(category, t)}
                                </span>
                                {isCustomCat && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-xs">
                                    {t('customBadge')}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={color.startsWith('#') ? 'custom' : color}
                                  onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                      setActiveColorPicker({
                                        type: 'category',
                                        key: category,
                                        color: hex,
                                        title: `${getCategoryLabel(category, t)} - ${t('color')}`,
                                      });
                                    } else {
                                      handleCategoryColorChange(category, e.target.value);
                                    }
                                  }}
                                  className="text-xs bg-zinc-950 border border-zinc-700 rounded-sm px-2 py-1 text-zinc-200 capitalize cursor-pointer focus:outline-hidden"
                                >
                                  {colorKeys.map((c) => (
                                    <option key={c} value={c}>
                                      {getColorLabel(c, t)}
                                    </option>
                                  ))}
                                  <option value="custom">
                                    {color.startsWith('#') ? color : t('customColor')}
                                  </option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveColorPicker({
                                      type: 'category',
                                      key: category,
                                      color: hex,
                                      title: `${getCategoryLabel(category, t)} - ${t('color')}`,
                                    })
                                  }
                                  title={t('chooseColor')}
                                  className="w-4 h-4 rounded-full border border-black/30 shrink-0 cursor-pointer shadow-xs hover:scale-115 transition"
                                  style={{ backgroundColor: hex }}
                                />

                                {isCustomCat && (
                                  <button
                                    onClick={() => handleRemoveCustomCategory(category)}
                                    title={t('deleteCustomCategory')}
                                    className="p-1 rounded-sm text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Custom Category Form */}
                      <form
                        onSubmit={handleAddCustomCategory}
                        className="pt-3 border-t border-zinc-800/80 flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={newCustomCategoryName}
                          onChange={(e) => setNewCustomCategoryName(e.target.value)}
                          placeholder={t('categoryNamePlaceholder')}
                          className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 focus:outline-hidden focus:border-zinc-600"
                        />
                        <select
                          value={
                            newCustomCategoryColor.startsWith('#')
                              ? 'custom'
                              : newCustomCategoryColor
                          }
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setActiveColorPicker({
                                type: 'category',
                                key: '__new_category__',
                                color: resolveColorHex(newCustomCategoryColor),
                                title: t('addCustomCategory'),
                              });
                            } else {
                              setNewCustomCategoryColor(e.target.value);
                            }
                          }}
                          className="text-xs bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1.5 text-zinc-200 capitalize cursor-pointer focus:outline-hidden"
                        >
                          {colorKeys.map((c) => (
                            <option key={c} value={c}>
                              {getColorLabel(c, t)}
                            </option>
                          ))}
                          <option value="custom">
                            {newCustomCategoryColor.startsWith('#')
                              ? newCustomCategoryColor
                              : t('customColor')}
                          </option>
                        </select>
                        <button
                          type="submit"
                          disabled={!newCustomCategoryName.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('add')}</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Sub-Tab: PRESETS */}
                {taxonomyTab === 'presets' && (
                  <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">{t('presets')}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Vibrant Default */}
                      {(() => {
                        const isSelected =
                          (draftSettings.preferences?.colorPreset || 'default') === 'default';
                        return (
                          <button
                            onClick={() => applyPreset('default')}
                            className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-22 ${
                              isSelected
                                ? 'border-emerald-500 ring-2 ring-emerald-500/50 bg-zinc-900 shadow-md'
                                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#10b981] border border-black/30 shadow-xs" />
                                <span className="w-4 h-4 rounded-full bg-[#a855f7] border border-black/30 shadow-xs" />
                                <span className="w-4 h-4 rounded-full bg-[#f59e0b] border border-black/30 shadow-xs" />
                                <span className="w-4 h-4 rounded-full bg-[#3b82f6] border border-black/30 shadow-xs" />
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-zinc-100">
                                {t('presetDefault')}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                                  {t('activePresetBadge')}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })()}

                      {/* Monochrome Slate */}
                      {(() => {
                        const isSelected = draftSettings.preferences?.colorPreset === 'monochrome';
                        return (
                          <button
                            onClick={() => applyPreset('monochrome')}
                            className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-22 ${
                              isSelected
                                ? 'border-emerald-500 ring-2 ring-emerald-500/50 bg-zinc-900 shadow-md'
                                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#f4f4f5] border border-black/30 shadow-xs" />
                                <span className="w-4 h-4 rounded-full bg-[#d4d4d8] border border-black/30 shadow-xs" />
                                <span className="w-4 h-4 rounded-full bg-[#a1a1aa] border border-black/30 shadow-xs" />
                                <span className="w-4 h-4 rounded-full bg-[#71717a] border border-black/30 shadow-xs" />
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-zinc-100">
                                {t('presetMonochrome')}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                                  {t('activePresetBadge')}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })()}

                      {/* Warm Amber & Rose */}
                      {(() => {
                        const isSelected = draftSettings.preferences?.colorPreset === 'warm';
                        return (
                          <button
                            onClick={() => applyPreset('warm')}
                            className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-22 ${
                              isSelected
                                ? 'border-emerald-500 ring-2 ring-emerald-500/50 bg-zinc-900 shadow-md'
                                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#fbbf24] border border-black/30 shadow-xs" />
                                <span className="w-4 h-4 rounded-full bg-[#f43f5e] border border-black/30 shadow-xs" />
                                <span className="w-4 h-4 rounded-full bg-[#fb923c] border border-black/30 shadow-xs" />
                                <span className="w-4 h-4 rounded-full bg-[#f97316] border border-black/30 shadow-xs" />
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-zinc-100">
                                {t('presetWarm')}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                                  {t('activePresetBadge')}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })()}

                      {/* Cyber Neon */}
                      {(() => {
                        const isSelected = draftSettings.preferences?.colorPreset === 'cyber';
                        return (
                          <button
                            onClick={() => applyPreset('cyber')}
                            className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-22 ${
                              isSelected
                                ? 'border-emerald-500 ring-2 ring-emerald-500/50 bg-zinc-900 shadow-md'
                                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#22d3ee] border border-black/30 shadow-xs" />
                                <span className="w-4 h-4 rounded-full bg-[#c084fc] border border-black/30 shadow-xs" />
                                <span className="w-4 h-4 rounded-full bg-[#4ade80] border border-black/30 shadow-xs" />
                                <span className="w-4 h-4 rounded-full bg-[#f472b6] border border-black/30 shadow-xs" />
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-zinc-100">
                                {t('presetCyber')}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                                  {t('activePresetBadge')}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/60 shrink-0">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('resetDefaults')}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-xs transition cursor-pointer"
          >
            {t('done')}
          </button>
        </div>

        {/* Floating Custom RGB / HEX Color Picker Popover */}
        {activeColorPicker && (
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
            onClick={() => setActiveColorPicker(null)}
          >
            <div onClick={(e) => e.stopPropagation()} className="relative z-[61] shadow-2xl">
              <DarkColorPicker
                standalone
                color={activeColorPicker.color}
                title={activeColorPicker.title || t('exactColor')}
                onChange={(hex) => {
                  if (activeColorPicker.type === 'role') {
                    if (activeColorPicker.key === '__new_role__') {
                      setNewCustomRoleColor(hex);
                    } else {
                      handleRoleColorChange(activeColorPicker.key, hex);
                    }
                  } else if (activeColorPicker.type === 'storyline') {
                    if (activeColorPicker.key === '__new_storyline__') {
                      setNewCustomStorylineColor(hex);
                    } else {
                      handleStorylineColorChange(activeColorPicker.key, hex);
                    }
                  } else if (activeColorPicker.type === 'category') {
                    if (activeColorPicker.key === '__new_category__') {
                      setNewCustomCategoryColor(hex);
                    } else {
                      handleCategoryColorChange(activeColorPicker.key, hex);
                    }
                  } else if (activeColorPicker.type === 'theme') {
                    handleCustomColorChange(
                      activeColorPicker.key as keyof CustomThemeColors,
                      hex
                    );
                  }
                  setActiveColorPicker((prev) => (prev ? { ...prev, color: hex } : null));
                }}
                onClose={() => setActiveColorPicker(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
