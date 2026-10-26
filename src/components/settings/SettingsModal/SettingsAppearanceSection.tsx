import React from 'react';
import { Check } from 'lucide-react';
import { CustomThemeColors } from '../../../types/settings';
import { PreferenceChangeHandler, CustomColorChangeHandler, ActiveColorPickerState } from './types';

interface SettingsAppearanceSectionProps {
  themeMode: 'dark' | 'light' | 'custom';
  customTheme: CustomThemeColors;
  onPreferenceChange: PreferenceChangeHandler;
  onCustomColorChange: CustomColorChangeHandler;
  onOpenColorPicker: (state: ActiveColorPickerState) => void;
  t: (key: string, fallback?: string) => string;
}

export const SettingsAppearanceSection = React.memo(function SettingsAppearanceSection({
  themeMode,
  customTheme,
  onPreferenceChange,
  onCustomColorChange,
  onOpenColorPicker,
  t,
}: SettingsAppearanceSectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      <div>
        <h3 className="text-base font-semibold text-zinc-100">{t('categoryAppearance')}</h3>
      </div>

      {/* Theme Mode Selector Card */}
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div>
          <label className="text-xs font-semibold text-zinc-200">{t('themeMode')}</label>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          {/* Dark Card */}
          <button
            onClick={() => onPreferenceChange('themeMode', 'dark')}
            className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-20 ${
              themeMode === 'dark'
                ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40 text-zinc-100'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-5 h-5 rounded-full bg-zinc-950 border border-zinc-700" />
              {themeMode === 'dark' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="text-xs font-semibold">{t('dark')}</div>
          </button>

          {/* Light Card */}
          <button
            onClick={() => onPreferenceChange('themeMode', 'light')}
            className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-20 ${
              themeMode === 'light'
                ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40 text-zinc-100'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-5 h-5 rounded-full bg-white border border-zinc-300" />
              {themeMode === 'light' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="text-xs font-semibold">{t('light')}</div>
          </button>

          {/* Custom Card */}
          <button
            onClick={() => onPreferenceChange('themeMode', 'custom')}
            className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-20 ${
              themeMode === 'custom'
                ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40 text-zinc-100'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
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
              {themeMode === 'custom' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="text-xs font-semibold">{t('custom')}</div>
          </button>
        </div>
      </div>

      {/* Custom Palette Engine (Visible when custom theme is selected) */}
      {themeMode === 'custom' && (
        <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-4 animate-in fade-in duration-150">
          <div>
            <h4 className="text-xs font-semibold text-zinc-200">{t('customThemeColors')}</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Background */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-300">{t('background')}</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenColorPicker({
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
                  onChange={(e) => onCustomColorChange('background', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-zinc-600 uppercase"
                />
              </div>
            </div>

            {/* Surface */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-300">{t('surface')}</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenColorPicker({
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
                  onChange={(e) => onCustomColorChange('surface', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-zinc-600 uppercase"
                />
              </div>
            </div>

            {/* Primary Accent */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-300">{t('primary')}</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenColorPicker({
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
                  onChange={(e) => onCustomColorChange('primary', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-zinc-600 uppercase"
                />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-300">{t('text')}</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenColorPicker({
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
                  onChange={(e) => onCustomColorChange('text', e.target.value)}
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
              <span className="text-xs font-medium" style={{ color: customTheme.text }}>
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
  );
});
