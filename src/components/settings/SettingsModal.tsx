import { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Users,
  GitMerge,
  Globe,
  RotateCcw,
  Check,
  Palette,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  AppColorSettings,
  ColorThemeKey,
  COLOR_SWATCHES,
  DEFAULT_COLOR_SETTINGS,
  saveColorSettings,
} from '../../types/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppColorSettings;
  onUpdateSettings: (newSettings: AppColorSettings) => void;
}

type TabKey = 'roles' | 'storylines' | 'categories' | 'presets';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('roles');
  const [draftSettings, setDraftSettings] = useState<AppColorSettings>(settings);
  const [newCustomRoleName, setNewCustomRoleName] = useState('');
  const [newCustomRoleColor, setNewCustomRoleColor] = useState<ColorThemeKey>('blue');

  // Sync draft when opened
  useEffect(() => {
    if (isOpen) {
      setDraftSettings(settings);
    }
  }, [isOpen, settings]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRoleColorChange = (
    role: string,
    color: ColorThemeKey
  ) => {
    const updated: AppColorSettings = {
      ...draftSettings,
      roles: {
        ...draftSettings.roles,
        [role]: color,
      },
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveColorSettings(updated);
  };

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomRoleName.trim()) return;
    const trimmed = newCustomRoleName.trim();
    const updated: AppColorSettings = {
      ...draftSettings,
      roles: {
        ...draftSettings.roles,
        [trimmed]: newCustomRoleColor,
      },
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveColorSettings(updated);
    setNewCustomRoleName('');
  };

  const handleRemoveCustomRole = (role: string) => {
    const nextRoles = { ...draftSettings.roles };
    delete nextRoles[role];
    const updated: AppColorSettings = {
      ...draftSettings,
      roles: nextRoles,
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveColorSettings(updated);
  };

  const handleStorylineColorChange = (
    key: keyof AppColorSettings['storylines'],
    color: ColorThemeKey
  ) => {
    const updated: AppColorSettings = {
      ...draftSettings,
      storylines: {
        ...draftSettings.storylines,
        [key]: color,
      },
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveColorSettings(updated);
  };

  const handleCategoryColorChange = (
    category: keyof AppColorSettings['categories'],
    color: ColorThemeKey
  ) => {
    const updated: AppColorSettings = {
      ...draftSettings,
      categories: {
        ...draftSettings.categories,
        [category]: color,
      },
    };
    setDraftSettings(updated);
    onUpdateSettings(updated);
    saveColorSettings(updated);
  };

  const handleResetToDefault = () => {
    setDraftSettings(DEFAULT_COLOR_SETTINGS);
    onUpdateSettings(DEFAULT_COLOR_SETTINGS);
    saveColorSettings(DEFAULT_COLOR_SETTINGS);
  };

  const applyPreset = (preset: 'default' | 'monochrome' | 'warm' | 'cyber') => {
    let next: AppColorSettings;
    switch (preset) {
      case 'monochrome':
        next = {
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
        next = {
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
        next = {
          roles: {
            Protagonist: 'cyan',
            Antagonist: 'purple',
            Supporting: 'blue',
            Minor: 'zinc',
          },
          storylines: {
            emerald: 'cyan',
            purple: 'purple',
            amber: 'blue',
            blue: 'cyan',
            rose: 'purple',
            cyan: 'blue',
          },
          categories: {
            Location: 'cyan',
            Faction: 'purple',
            Lore: 'blue',
            Artifact: 'cyan',
          },
        };
        break;
      case 'default':
      default:
        next = DEFAULT_COLOR_SETTINGS;
        break;
    }
    setDraftSettings(next);
    onUpdateSettings(next);
    saveColorSettings(next);
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
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Sliders className="w-4 h-4 text-zinc-200" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                Studio Settings & Tag Colors
              </h2>
              <p className="text-[11px] text-zinc-400">
                Configure taxonomy palettes, role distinctions, and narrative highlighting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close Settings (Esc)"
            className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-zinc-850 bg-zinc-950">
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition -mb-[1px] ${
              activeTab === 'roles'
                ? 'border-zinc-200 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Character Roles</span>
          </button>

          <button
            onClick={() => setActiveTab('storylines')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition -mb-[1px] ${
              activeTab === 'storylines'
                ? 'border-zinc-200 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>Storyline Tags</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition -mb-[1px] ${
              activeTab === 'categories'
                ? 'border-zinc-200 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>World Lore</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition -mb-[1px] ${
              activeTab === 'presets'
                ? 'border-zinc-200 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5 bg-zinc-950">
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400 pb-1">
                Assign sober color tones to character badges. Icons have been eliminated to ensure a minimal, distraction-free cast list.
              </div>

              {Array.from(
                new Set([
                  'Protagonist',
                  'Antagonist',
                  'Supporting',
                  'Minor',
                  ...Object.keys(draftSettings.roles),
                ])
              ).map((role) => {
                const currentColor = draftSettings.roles[role] || 'zinc';
                const meta = COLOR_SWATCHES[currentColor] || COLOR_SWATCHES.zinc;
                const isPreset = ['Protagonist', 'Antagonist', 'Supporting', 'Minor'].includes(role);

                return (
                  <div
                    key={role}
                    className="p-3 rounded-sm bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Live Role Badge Preview */}
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border ${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText}`}
                      >
                        {role}
                      </span>
                      <span className="text-xs font-medium text-zinc-200 truncate">{role}</span>
                      {!isPreset && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomRole(role)}
                          title={`Remove custom role "${role}"`}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Color Swatch Picker */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {colorKeys.map((colorKey) => {
                        const swatch = COLOR_SWATCHES[colorKey];
                        const isSelected = currentColor === colorKey;
                        return (
                          <button
                            key={colorKey}
                            onClick={() => handleRoleColorChange(role, colorKey)}
                            title={swatch.name}
                            className={`w-6 h-6 rounded-sm flex items-center justify-center border transition ${
                              isSelected
                                ? 'border-zinc-100 scale-110 shadow-xs'
                                : 'border-zinc-800 hover:border-zinc-600'
                            }`}
                            style={{ backgroundColor: swatch.hexPreview }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Add Custom Role Box */}
              <form
                onSubmit={handleAddCustomRole}
                className="p-3 rounded-sm border border-dashed border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={newCustomRoleName}
                    onChange={(e) => setNewCustomRoleName(e.target.value)}
                    placeholder="New custom role (e.g. Mentor, Love Interest, Foil)..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xs px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                  />
                  {/* Color selector for new custom role */}
                  <div className="flex items-center gap-1">
                    {colorKeys.map((ck) => (
                      <button
                        key={ck}
                        type="button"
                        onClick={() => setNewCustomRoleColor(ck)}
                        className={`w-4 h-4 rounded-full border transition ${
                          newCustomRoleColor === ck
                            ? 'border-white scale-125'
                            : 'border-zinc-800 hover:border-zinc-500'
                        }`}
                        style={{ backgroundColor: COLOR_SWATCHES[ck].hexPreview }}
                        title={COLOR_SWATCHES[ck].name}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newCustomRoleName.trim()}
                  className="flex items-center justify-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 text-xs font-mono rounded-xs transition shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Role</span>
                </button>
              </form>
            </div>
          )}

          {activeTab === 'storylines' && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400 pb-1">
                Customize indicator dot and highlight colors for narrative threads and subplot tracks.
              </div>

              {(
                [
                  'emerald',
                  'purple',
                  'amber',
                  'blue',
                  'rose',
                  'cyan',
                ] as (keyof AppColorSettings['storylines'])[]
              ).map((slotKey) => {
                const currentColor = draftSettings.storylines[slotKey];
                const meta = COLOR_SWATCHES[currentColor];

                return (
                  <div
                    key={slotKey}
                    className="p-3 rounded-sm bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${meta.dotBg}`} />
                      <span className="text-xs font-medium text-zinc-300 capitalize">
                        {slotKey} thread tag
                      </span>
                    </div>

                    {/* Color Swatch Picker */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {colorKeys.map((colorKey) => {
                        const swatch = COLOR_SWATCHES[colorKey];
                        const isSelected = currentColor === colorKey;
                        return (
                          <button
                            key={colorKey}
                            onClick={() => handleStorylineColorChange(slotKey, colorKey)}
                            title={swatch.name}
                            className={`w-6 h-6 rounded-sm flex items-center justify-center border transition ${
                              isSelected
                                ? 'border-zinc-100 scale-110 shadow-xs'
                                : 'border-zinc-800 hover:border-zinc-600'
                            }`}
                            style={{ backgroundColor: swatch.hexPreview }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400 pb-1">
                Configure taxonomy badge colors for worldbuilding lore categories and locations.
              </div>

              {(
                [
                  'Location',
                  'Faction',
                  'Lore',
                  'Artifact',
                ] as (keyof AppColorSettings['categories'])[]
              ).map((cat) => {
                const currentColor = draftSettings.categories[cat];
                const meta = COLOR_SWATCHES[currentColor];

                return (
                  <div
                    key={cat}
                    className="p-3 rounded-sm bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border ${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText}`}
                      >
                        {cat}
                      </span>
                      <span className="text-xs font-medium text-zinc-300">{cat}</span>
                    </div>

                    {/* Color Swatch Picker */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {colorKeys.map((colorKey) => {
                        const swatch = COLOR_SWATCHES[colorKey];
                        const isSelected = currentColor === colorKey;
                        return (
                          <button
                            key={colorKey}
                            onClick={() => handleCategoryColorChange(cat, colorKey)}
                            title={swatch.name}
                            className={`w-6 h-6 rounded-sm flex items-center justify-center border transition ${
                              isSelected
                                ? 'border-zinc-100 scale-110 shadow-xs'
                                : 'border-zinc-800 hover:border-zinc-600'
                            }`}
                            style={{ backgroundColor: swatch.hexPreview }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => applyPreset('default')}
                className="p-3 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition group"
              >
                <div className="text-xs font-medium text-zinc-200 group-hover:text-white">
                  Industrial Studio (Default)
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Balanced emerald, rose, and blue accents against dark zinc slate.
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-3.5 h-3.5 rounded-xs bg-emerald-500" />
                  <div className="w-3.5 h-3.5 rounded-xs bg-rose-500" />
                  <div className="w-3.5 h-3.5 rounded-xs bg-blue-500" />
                  <div className="w-3.5 h-3.5 rounded-xs bg-zinc-400" />
                </div>
              </button>

              <button
                onClick={() => applyPreset('monochrome')}
                className="p-3 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition group"
              >
                <div className="text-xs font-medium text-zinc-200 group-hover:text-white">
                  Obsidian Monochrome
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Pure grayscale palette for maximum focus with zero chromatic distraction.
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-3.5 h-3.5 rounded-xs bg-zinc-300" />
                  <div className="w-3.5 h-3.5 rounded-xs bg-zinc-500" />
                  <div className="w-3.5 h-3.5 rounded-xs bg-zinc-700" />
                  <div className="w-3.5 h-3.5 rounded-xs bg-zinc-850" />
                </div>
              </button>

              <button
                onClick={() => applyPreset('warm')}
                className="p-3 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition group"
              >
                <div className="text-xs font-medium text-zinc-200 group-hover:text-white">
                  Warm Parchment Noir
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Earthy amber and warm rose hues reminiscent of vintage typewriter pages.
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-3.5 h-3.5 rounded-xs bg-amber-500" />
                  <div className="w-3.5 h-3.5 rounded-xs bg-orange-500" />
                  <div className="w-3.5 h-3.5 rounded-xs bg-rose-500" />
                  <div className="w-3.5 h-3.5 rounded-xs bg-zinc-500" />
                </div>
              </button>

              <button
                onClick={() => applyPreset('cyber')}
                className="p-3 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition group"
              >
                <div className="text-xs font-medium text-zinc-200 group-hover:text-white">
                  Cyan & Indigo Noir
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  High-contrast cool cyan, purple, and blue tones for spec-fic writers.
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-3.5 h-3.5 rounded-xs bg-cyan-500" />
                  <div className="w-3.5 h-3.5 rounded-xs bg-purple-500" />
                  <div className="w-3.5 h-3.5 rounded-xs bg-blue-500" />
                  <div className="w-3.5 h-3.5 rounded-xs bg-zinc-500" />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-900/40">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-sm hover:bg-zinc-800 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 font-medium text-xs rounded-sm transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
