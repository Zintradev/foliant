import React from 'react';
import { Indent } from 'lucide-react';
import { PreferenceChangeHandler } from './types';

interface SettingsEditorSectionProps {
  editorIndentFirstLine: boolean;
  editorIndentSize?: number;
  onPreferenceChange: PreferenceChangeHandler;
  t: (key: string, fallback?: string) => string;
}

export const SettingsEditorSection = React.memo(function SettingsEditorSection({
  editorIndentFirstLine,
  editorIndentSize = 1.5,
  onPreferenceChange,
  t,
}: SettingsEditorSectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      <div>
        <h3 className="text-base font-semibold text-zinc-100">{t('categoryEditor')}</h3>
      </div>

      {/* First-Line Indent Card */}
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-zinc-200">{t('automaticIndent')}</div>
            <p className="text-[11px] text-zinc-400 mt-0.5">{t('automaticIndentDesc')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              aria-label={t('automaticIndent')}
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
                  htmlFor="editor-section-indent-size"
                  className="text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Indent className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('indentSize')}</span>
                </label>
                <p className="text-[11px] text-zinc-400">{t('indentSizeDesc')}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <select
                  id="editor-section-indent-size"
                  aria-label={t('indentSize')}
                  value={editorIndentSize}
                  onChange={(e) => onPreferenceChange('editorIndentSize', Number(e.target.value))}
                  className="px-2.5 py-1.5 border border-zinc-750 text-zinc-200 bg-zinc-950 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer font-sans"
                >
                  <option value={0.5}>0.5 rem</option>
                  <option value={1}>1.0 rem</option>
                  <option value={1.5}>1.5 rem</option>
                  <option value={2}>2.0 rem</option>
                  <option value={2.5}>2.5 rem</option>
                  <option value={3}>3.0 rem</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
