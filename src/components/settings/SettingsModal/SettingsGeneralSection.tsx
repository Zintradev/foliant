import React from 'react';
import { Languages, Save, Zap, Clock, Globe, Check } from 'lucide-react';
import { Language } from '../../../types/settings';
import { PreferenceChangeHandler } from './types';

interface SettingsGeneralSectionProps {
  currentLang: Language;
  saveMode: 'auto' | 'manual';
  timelineDropMode: 'shift' | 'swap';
  worldDropMode: 'shift' | 'swap';
  preserveManualSceneWidth: boolean;
  preserveManualPlotHeight: boolean;
  onPreferenceChange: PreferenceChangeHandler;
  t: (key: string, fallback?: string) => string;
}

export const SettingsGeneralSection = React.memo(function SettingsGeneralSection({
  currentLang,
  saveMode,
  timelineDropMode,
  worldDropMode,
  preserveManualSceneWidth,
  preserveManualPlotHeight,
  onPreferenceChange,
  t,
}: SettingsGeneralSectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      <div>
        <h3 className="text-base font-semibold text-zinc-100">{t('categoryGeneral')}</h3>
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
            onClick={() => onPreferenceChange('language', 'en')}
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
            onClick={() => onPreferenceChange('language', 'es')}
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
          <button
            type="button"
            onClick={() => onPreferenceChange('saveMode', 'auto')}
            className={`flex flex-col justify-between p-3 rounded-md border text-xs font-medium transition cursor-pointer text-left space-y-2 ${
              saveMode === 'auto'
                ? 'border-emerald-500 bg-emerald-950/20 text-zinc-100 ring-1 ring-emerald-500/40'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 font-semibold">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>{t('saveModeAuto')}</span>
              </div>
              {saveMode === 'auto' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
              {t('saveModeAutoDesc')}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onPreferenceChange('saveMode', 'manual')}
            className={`flex flex-col justify-between p-3 rounded-md border text-xs font-medium transition cursor-pointer text-left space-y-2 ${
              saveMode === 'manual'
                ? 'border-emerald-500 bg-emerald-950/20 text-zinc-100 ring-1 ring-emerald-500/40'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 font-semibold">
                <Save className="w-4 h-4 text-blue-400" />
                <span>{t('saveModeManual')}</span>
              </div>
              {saveMode === 'manual' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
              {t('saveModeManualDesc')}
            </p>
          </button>
        </div>
      </div>

      {/* Timeline Drag & Drop Mode Card */}
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div>
          <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('timelineDropMode')}</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => onPreferenceChange('timelineDropMode', 'shift')}
            className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-center h-16 ${
              timelineDropMode === 'shift'
                ? 'border-emerald-500 bg-emerald-950/20 text-zinc-100 ring-1 ring-emerald-500/40'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{t('shiftMode')}</span>
              {timelineDropMode === 'shift' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onPreferenceChange('timelineDropMode', 'swap')}
            className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-center h-16 ${
              timelineDropMode === 'swap'
                ? 'border-emerald-500 bg-emerald-950/20 text-zinc-100 ring-1 ring-emerald-500/40'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{t('swapMode')}</span>
              {timelineDropMode === 'swap' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
          </button>
        </div>
      </div>

      {/* World Items Drag & Drop Mode Card */}
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div>
          <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('worldDropMode')}</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => onPreferenceChange('worldDropMode', 'shift')}
            className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-center h-16 ${
              worldDropMode === 'shift'
                ? 'border-emerald-500 bg-emerald-950/20 text-zinc-100 ring-1 ring-emerald-500/40'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{t('shiftMode')}</span>
              {worldDropMode === 'shift' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onPreferenceChange('worldDropMode', 'swap')}
            className={`p-3 rounded-md border text-left transition cursor-pointer flex flex-col justify-center h-16 ${
              worldDropMode === 'swap'
                ? 'border-emerald-500 bg-emerald-950/20 text-zinc-100 ring-1 ring-emerald-500/40'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{t('swapMode')}</span>
              {worldDropMode === 'swap' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
          </button>
        </div>
      </div>

      {/* Preserve Card Width on Zoom */}
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-zinc-200">{t('preserveSceneWidth')}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">{t('preserveSceneWidthDesc')}</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            aria-label={t('preserveSceneWidth')}
            checked={preserveManualSceneWidth}
            onChange={(e) => onPreferenceChange('preserveManualSceneWidth', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
        </label>
      </div>

      {/* Preserve Track Height on Zoom */}
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-zinc-200">{t('preserveTrackHeight')}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">{t('preserveTrackHeightDesc')}</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            aria-label={t('preserveTrackHeight')}
            checked={preserveManualPlotHeight}
            onChange={(e) => onPreferenceChange('preserveManualPlotHeight', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
        </label>
      </div>
    </div>
  );
});
