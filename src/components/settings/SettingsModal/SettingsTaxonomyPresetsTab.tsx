import React from 'react';
import { Check } from 'lucide-react';
import { PresetType } from './types';

interface SettingsTaxonomyPresetsTabProps {
  activePreset: string | undefined;
  onApplyPreset: (preset: PresetType) => void;
  t: (key: string, fallback?: string) => string;
}

export const SettingsTaxonomyPresetsTab = React.memo(function SettingsTaxonomyPresetsTab({
  activePreset,
  onApplyPreset,
  t,
}: SettingsTaxonomyPresetsTabProps) {
  const currentPreset = activePreset || 'default';

  return (
    <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
      <div>
        <h4 className="text-xs font-semibold text-zinc-200">{t('presets')}</h4>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Vibrant Default */}
        <button
          onClick={() => onApplyPreset('default')}
          className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-22 ${
            currentPreset === 'default'
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
            {currentPreset === 'default' && <Check className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-100">{t('presetDefault')}</span>
            {currentPreset === 'default' && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                {t('activePresetBadge')}
              </span>
            )}
          </div>
        </button>

        {/* Monochrome Slate */}
        <button
          onClick={() => onApplyPreset('monochrome')}
          className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-22 ${
            currentPreset === 'monochrome'
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
            {currentPreset === 'monochrome' && <Check className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-100">{t('presetMonochrome')}</span>
            {currentPreset === 'monochrome' && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                {t('activePresetBadge')}
              </span>
            )}
          </div>
        </button>

        {/* Warm Amber & Rose */}
        <button
          onClick={() => onApplyPreset('warm')}
          className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-22 ${
            currentPreset === 'warm'
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
            {currentPreset === 'warm' && <Check className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-100">{t('presetWarm')}</span>
            {currentPreset === 'warm' && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                {t('activePresetBadge')}
              </span>
            )}
          </div>
        </button>

        {/* Cyber Neon */}
        <button
          onClick={() => onApplyPreset('cyber')}
          className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-between h-22 ${
            currentPreset === 'cyber'
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
            {currentPreset === 'cyber' && <Check className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-100">{t('presetCyber')}</span>
            {currentPreset === 'cyber' && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                {t('activePresetBadge')}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
});
