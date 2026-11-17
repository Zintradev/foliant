import React from 'react';
import { Check, Indent } from 'lucide-react';
import { CustomThemeColors, EditorFontFamily } from '../../../types/settings';
import { PreferenceChangeHandler, CustomColorChangeHandler, ActiveColorPickerState } from './types';

interface SettingsAppearanceSectionProps {
  themeMode: 'dark' | 'light' | 'custom';
  customTheme: CustomThemeColors;
  editorIndentFirstLine?: boolean;
  editorIndentSize?: number;
  editorFontFamily?: EditorFontFamily;
  editorPaperColor?: 'paper' | 'white' | 'warm' | 'dark' | 'custom' | 'default';
  editorCustomBg?: string;
  editorCustomText?: string;
  matchEditorBackgroundWithPaper?: boolean;
  focusModeShowFormattingToolbar?: boolean;
  onPreferenceChange: PreferenceChangeHandler;
  onCustomColorChange: CustomColorChangeHandler;
  onOpenColorPicker: (state: ActiveColorPickerState) => void;
  t: (key: string, fallback?: string) => string;
}

export const SettingsAppearanceSection = React.memo(function SettingsAppearanceSection({
  themeMode,
  customTheme,
  editorIndentFirstLine = true,
  editorIndentSize = 1.5,
  editorFontFamily: _editorFontFamily = 'serif',
  editorPaperColor = 'paper',
  editorCustomBg = '#f6f1e8',
  editorCustomText = '#2c2523',
  matchEditorBackgroundWithPaper = false,
  focusModeShowFormattingToolbar = false,
  onPreferenceChange,
  onCustomColorChange,
  onOpenColorPicker,
  t,
}: SettingsAppearanceSectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      <div>
        <h3 className="text-base font-semibold text-zinc-100">
          {t('categoryAppearanceEditor', 'Appearance & Editor')}
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          {t('categoryAppearanceEditorDesc', 'Theme modes, paper sheet colors and focus options')}
        </p>
      </div>

      {/* Theme Mode Selector Card */}
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div>
          <label className="text-xs font-semibold text-zinc-200">{t('themeMode', 'Theme Mode')}</label>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          {/* Dark Card */}
          <button
            type="button"
            onClick={() => onPreferenceChange('themeMode', 'dark')}
            className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-20 ${
              themeMode === 'dark'
                ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40 text-zinc-100'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-5 h-5 rounded-full bg-[#09090b] border border-[#3f3f46]" />
              {themeMode === 'dark' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="text-xs font-semibold">{t('dark', 'Dark')}</div>
          </button>

          {/* Light Card */}
          <button
            type="button"
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
            <div className="text-xs font-semibold">{t('light', 'Light')}</div>
          </button>

          {/* Custom Theme Card */}
          <button
            type="button"
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
            <div className="text-xs font-semibold">{t('custom', 'Custom Palette')}</div>
          </button>
        </div>
      </div>

      {/* Custom Theme Palette Engine (Visible when custom theme is selected) */}
      {themeMode === 'custom' && (
        <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-4 animate-in fade-in duration-150">
          <div>
            <h4 className="text-xs font-semibold text-zinc-200">{t('customThemeColors', 'Custom Theme Colors')}</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Background */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-300">{t('background', 'Background')}</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenColorPicker({
                      type: 'theme',
                      key: 'background',
                      color: customTheme.background,
                      title: t('background', 'Background'),
                    })
                  }
                  className="w-8 h-8 rounded-md border border-zinc-700 cursor-pointer shrink-0 shadow-xs hover:scale-105 transition"
                  style={{ backgroundColor: customTheme.background }}
                  title={t('chooseColor', 'Choose color')}
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
              <label className="text-[11px] font-medium text-zinc-300">{t('surface', 'Surface')}</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenColorPicker({
                      type: 'theme',
                      key: 'surface',
                      color: customTheme.surface,
                      title: t('surface', 'Surface'),
                    })
                  }
                  className="w-8 h-8 rounded-md border border-zinc-700 cursor-pointer shrink-0 shadow-xs hover:scale-105 transition"
                  style={{ backgroundColor: customTheme.surface }}
                  title={t('chooseColor', 'Choose color')}
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
              <label className="text-[11px] font-medium text-zinc-300">{t('primary', 'Primary Accent')}</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenColorPicker({
                      type: 'theme',
                      key: 'primary',
                      color: customTheme.primary,
                      title: t('primary', 'Primary Accent'),
                    })
                  }
                  className="w-8 h-8 rounded-md border border-zinc-700 cursor-pointer shrink-0 shadow-xs hover:scale-105 transition"
                  style={{ backgroundColor: customTheme.primary }}
                  title={t('chooseColor', 'Choose color')}
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
              <label className="text-[11px] font-medium text-zinc-300">{t('text', 'Text')}</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenColorPicker({
                      type: 'theme',
                      key: 'text',
                      color: customTheme.text,
                      title: t('text', 'Text'),
                    })
                  }
                  className="w-8 h-8 rounded-md border border-zinc-700 cursor-pointer shrink-0 shadow-xs hover:scale-105 transition"
                  style={{ backgroundColor: customTheme.text }}
                  title={t('chooseColor', 'Choose color')}
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
                {t('dynamicPreview', 'Dynamic Preview')}
              </span>
            </div>
            <button
              type="button"
              className="px-2.5 py-1 rounded-sm text-xs font-semibold text-white shadow-xs"
              style={{ backgroundColor: customTheme.primary }}
            >
              {t('actionAccent', 'Button')}
            </button>
          </div>
        </div>
      )}

      {/* Editor Paper Color Card */}
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div>
          <label className="text-xs font-semibold text-zinc-200">
            {t('editorPaperColor', 'Writing Paper Color')}
          </label>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {t('editorSheetColorsDesc', 'Select the tone for your writing sheet')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {/* Paper Tone Card */}
          <button
            type="button"
            onClick={() => onPreferenceChange('editorPaperColor', 'paper')}
            className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col gap-2.5 ${
              editorPaperColor === 'paper'
                ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40 text-zinc-100'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{t('paperType', 'Paper')}</span>
              {editorPaperColor === 'paper' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            {/* Expanded Preview Box displayed under option */}
            <div className="w-full h-20 rounded-md border border-stone-300/80 p-2.5 flex flex-col justify-center bg-[#f6f1e8] shadow-xs select-none">
              <div className="space-y-1.5">
                <div className="w-2/5 h-2 rounded-xs bg-[#2c2523]/80" />
                <div className="w-full h-1 rounded-xs bg-[#2c2523]/50" />
                <div className="w-4/5 h-1 rounded-xs bg-[#2c2523]/50" />
                <div className="w-3/5 h-1 rounded-xs bg-[#2c2523]/50" />
              </div>
            </div>
          </button>

          {/* White Card */}
          <button
            type="button"
            onClick={() => onPreferenceChange('editorPaperColor', 'white')}
            className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col gap-2.5 ${
              editorPaperColor === 'white'
                ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40 text-zinc-100'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{t('paperWhite', 'White')}</span>
              {editorPaperColor === 'white' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            {/* Expanded Preview Box displayed under option */}
            <div className="w-full h-20 rounded-md border border-zinc-200 p-2.5 flex flex-col justify-center bg-white shadow-xs select-none">
              <div className="space-y-1.5">
                <div className="w-2/5 h-2 rounded-xs bg-[#18181b]/80" />
                <div className="w-full h-1 rounded-xs bg-[#18181b]/50" />
                <div className="w-4/5 h-1 rounded-xs bg-[#18181b]/50" />
                <div className="w-3/5 h-1 rounded-xs bg-[#18181b]/50" />
              </div>
            </div>
          </button>

          {/* Warm White Card */}
          <button
            type="button"
            onClick={() => onPreferenceChange('editorPaperColor', 'warm')}
            className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col gap-2.5 ${
              editorPaperColor === 'warm'
                ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40 text-zinc-100'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{t('paperWarm', 'Warm White')}</span>
              {editorPaperColor === 'warm' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            {/* Expanded Preview Box displayed under option */}
            <div className="w-full h-20 rounded-md border border-amber-200/70 p-2.5 flex flex-col justify-center bg-[#fdf6e2] shadow-xs select-none">
              <div className="space-y-1.5">
                <div className="w-2/5 h-2 rounded-xs bg-[#2d2a24]/80" />
                <div className="w-full h-1 rounded-xs bg-[#2d2a24]/50" />
                <div className="w-4/5 h-1 rounded-xs bg-[#2d2a24]/50" />
                <div className="w-3/5 h-1 rounded-xs bg-[#2d2a24]/50" />
              </div>
            </div>
          </button>

          {/* Dark / Interface Card */}
          <button
            type="button"
            onClick={() => onPreferenceChange('editorPaperColor', 'dark')}
            className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col gap-2.5 ${
              editorPaperColor === 'dark' || editorPaperColor === 'default'
                ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40 text-zinc-100'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{t('paperDark', 'Dark (Interface)')}</span>
              {(editorPaperColor === 'dark' || editorPaperColor === 'default') && (
                <Check className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            {/* Expanded Preview Box displayed under option */}
            <div className="w-full h-20 rounded-md border border-zinc-750 p-2.5 flex flex-col justify-center bg-[#09090b] shadow-xs select-none">
              <div className="space-y-1.5">
                <div className="w-2/5 h-2 rounded-xs bg-zinc-300/80" />
                <div className="w-full h-1 rounded-xs bg-zinc-500/50" />
                <div className="w-4/5 h-1 rounded-xs bg-zinc-500/50" />
                <div className="w-3/5 h-1 rounded-xs bg-zinc-500/50" />
              </div>
            </div>
          </button>

          {/* Custom Paper Card */}
          <button
            type="button"
            onClick={() => onPreferenceChange('editorPaperColor', 'custom')}
            className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col gap-2.5 ${
              editorPaperColor === 'custom'
                ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40 text-zinc-100'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{t('paperCustom', 'Custom')}</span>
              {editorPaperColor === 'custom' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            {/* Expanded Preview Box displayed under option */}
            <div
              className="w-full h-20 rounded-md border border-zinc-700/80 p-2.5 flex flex-col justify-center shadow-xs select-none transition-colors"
              style={{ backgroundColor: editorCustomBg }}
            >
              <div className="space-y-1.5">
                <div className="w-2/5 h-2 rounded-xs" style={{ backgroundColor: editorCustomText, opacity: 0.8 }} />
                <div className="w-full h-1 rounded-xs" style={{ backgroundColor: editorCustomText, opacity: 0.5 }} />
                <div className="w-4/5 h-1 rounded-xs" style={{ backgroundColor: editorCustomText, opacity: 0.5 }} />
                <div className="w-3/5 h-1 rounded-xs" style={{ backgroundColor: editorCustomText, opacity: 0.5 }} />
              </div>
            </div>
          </button>
        </div>

        {/* Custom Paper Colors Picker (Visible when custom is selected) */}
        {editorPaperColor === 'custom' && (
          <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-4 animate-in fade-in duration-100">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-300">
                {t('editorCustomBg', 'Sheet background')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editorCustomBg}
                  onChange={(e) => onPreferenceChange('editorCustomBg', e.target.value)}
                  className="w-8 h-8 rounded-md border border-zinc-700 cursor-pointer shrink-0 bg-transparent"
                />
                <input
                  type="text"
                  value={editorCustomBg}
                  onChange={(e) => onPreferenceChange('editorCustomBg', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-zinc-600 uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-300">
                {t('editorCustomText', 'Text color')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editorCustomText}
                  onChange={(e) => onPreferenceChange('editorCustomText', e.target.value)}
                  className="w-8 h-8 rounded-md border border-zinc-700 cursor-pointer shrink-0 bg-transparent"
                />
                <input
                  type="text"
                  value={editorCustomText}
                  onChange={(e) => onPreferenceChange('editorCustomText', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-zinc-600 uppercase"
                />
              </div>
            </div>
          </div>
        )}

        {/* Match editor background with paper toggle */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          <div>
            <label htmlFor="setting-match-editor-bg" className="text-xs font-semibold text-zinc-200 cursor-pointer">
              {t('matchEditorBackground', 'Match background with paper')}
            </label>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {t(
                'matchEditorBackgroundDesc',
                'Applies paper color to writing workspace panel (excluding header)'
              )}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input
              id="setting-match-editor-bg"
              type="checkbox"
              aria-label={t('matchEditorBackground', 'Match background with paper')}
              checked={matchEditorBackgroundWithPaper}
              onChange={(e) => onPreferenceChange('matchEditorBackgroundWithPaper', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
          </label>
        </div>
      </div>

      {/* Editor Paragraph & Layout Settings */}
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-4">
        {/* First-Line Indent Card */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="setting-editor-indent" className="text-xs font-semibold text-zinc-200 cursor-pointer">{t('automaticIndent', 'Automatic Indentation')}</label>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {t('automaticIndentDesc', 'Automatically indents the first line of each novel paragraph.')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input
              type="checkbox"
              id="setting-editor-indent"
              aria-label={t('automaticIndent', 'Automatic First-Line Indent')}
              checked={editorIndentFirstLine}
              onChange={(e) => onPreferenceChange('editorIndentFirstLine', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
          </label>
        </div>

        {editorIndentFirstLine && (
          <div className="pt-3 border-t border-zinc-800/80 space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-0.5">
                <label
                  htmlFor="setting-editor-indent-size"
                  className="text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Indent className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('indentSize', 'Indentation Width')}</span>
                </label>
                <p className="text-[11px] text-zinc-400">
                  {t('indentSizeDesc', 'Select or adjust the indentation width for the first line of paragraphs.')}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <input
                  type="range"
                  id="setting-editor-indent-slider"
                  aria-label={`${t('indentSize', 'Indentation Width')} Slider`}
                  min="0.5"
                  max="3"
                  step="0.25"
                  value={editorIndentSize}
                  onChange={(e) => onPreferenceChange('editorIndentSize', Number(e.target.value))}
                  className="w-24 sm:w-28 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <select
                  id="setting-editor-indent-size"
                  aria-label={t('indentSize', 'Indentation Width')}
                  value={editorIndentSize}
                  onChange={(e) => onPreferenceChange('editorIndentSize', Number(e.target.value))}
                  className="px-2.5 py-1.5 border border-zinc-750 text-zinc-200 bg-zinc-950 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer font-sans"
                >
                  <option value={0.5} className="bg-zinc-900 text-zinc-300">0.5 rem (8px - {t('indentMinimal', 'Minimal')})</option>
                  <option value={0.75} className="bg-zinc-900 text-zinc-300">0.75 rem (12px)</option>
                  <option value={1} className="bg-zinc-900 text-zinc-300">1.0 rem (16px - {t('indentCompact', 'Compact')})</option>
                  <option value={1.25} className="bg-zinc-900 text-zinc-300">1.25 rem (20px)</option>
                  <option value={1.5} className="bg-zinc-900 text-emerald-400 font-medium">1.5 rem (24px - {t('indentStandard', 'Standard')})</option>
                  <option value={1.75} className="bg-zinc-900 text-zinc-300">1.75 rem (28px)</option>
                  <option value={2} className="bg-zinc-900 text-zinc-300">2.0 rem (32px - {t('indentWide', 'Wide')})</option>
                  <option value={2.25} className="bg-zinc-900 text-zinc-300">2.25 rem (36px)</option>
                  <option value={2.5} className="bg-zinc-900 text-zinc-300">2.5 rem (40px - {t('indentGenerous', 'Generous')})</option>
                  <option value={2.75} className="bg-zinc-900 text-zinc-300">2.75 rem (44px)</option>
                  <option value={3} className="bg-zinc-900 text-zinc-300">3.0 rem (48px - {t('indentDeep', 'Deep')})</option>
                </select>
              </div>
            </div>

            {/* Live Indent Preview */}
            <div className="p-3 rounded-md bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 font-serif leading-relaxed select-none">
              <p
                style={{
                  textIndent: `${editorIndentSize}rem`,
                  transition: 'text-indent 0.15s ease',
                }}
              >
                {t(
                  'indentPreviewSample',
                  'Érase una vez en un rincón apartado del mundo donde las historias cobraban vida...'
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Focus Mode Preferences */}
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div>
          <label className="text-xs font-semibold text-zinc-200">
            {t('focusModeSettings', 'Focus Mode')}
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-200">
              {t('focusModeShowToolbar', 'Keep formatting toolbar visible')}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {t(
                'focusModeShowToolbarDesc',
                'Pins formatting tools during focus mode'
              )}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input
              type="checkbox"
              checked={focusModeShowFormattingToolbar}
              onChange={(e) => onPreferenceChange('focusModeShowFormattingToolbar', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
          </label>
        </div>
      </div>
    </div>
  );
});
