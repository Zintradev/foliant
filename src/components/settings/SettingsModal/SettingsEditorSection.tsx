import React from 'react';
import { PreferenceChangeHandler } from './types';

interface SettingsEditorSectionProps {
  editorIndentFirstLine: boolean;
  onPreferenceChange: PreferenceChangeHandler;
  t: (key: string, fallback?: string) => string;
}

export const SettingsEditorSection = React.memo(function SettingsEditorSection({
  editorIndentFirstLine,
  onPreferenceChange,
  t,
}: SettingsEditorSectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      <div>
        <h3 className="text-base font-semibold text-zinc-100">{t('categoryEditor')}</h3>
      </div>

      {/* First-Line Indent Card */}
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-zinc-200">{t('automaticIndent')}</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={editorIndentFirstLine}
            onChange={(e) => onPreferenceChange('editorIndentFirstLine', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
        </label>
      </div>
    </div>
  );
});
