import React, { useState } from 'react';
import { Languages, Save, Zap, Clock, Globe, StickyNote, Check, AlertCircle, RefreshCw, Loader2, ShieldCheck } from 'lucide-react';
import { Language } from '../../../types/settings';
import { PreferenceChangeHandler } from './types';
import { GbFlag, EsFlag } from '../../common/FlagIcons';
import { checkForAppUpdates, UpdateStatus } from '../../../utils/updater';
import { isTauriApp } from '../../../utils/platform';

interface SettingsGeneralSectionProps {
  currentLang: Language;
  saveMode: 'auto' | 'manual';
  autoSaveInterval?: number;
  timelineDropMode: 'shift' | 'swap';
  worldDropMode: 'shift' | 'swap';
  notesDropMode?: 'shift' | 'swap';
  preserveManualSceneWidth: boolean;
  preserveManualPlotHeight: boolean;
  autoUpdateCheck?: boolean;
  onPreferenceChange: PreferenceChangeHandler;
  t: (key: string, fallback?: string) => string;
}

export const SettingsGeneralSection = React.memo(function SettingsGeneralSection({
  currentLang,
  saveMode,
  autoSaveInterval = 300,
  timelineDropMode,
  worldDropMode,
  notesDropMode = 'shift',
  preserveManualSceneWidth,
  preserveManualPlotHeight,
  autoUpdateCheck = false,
  onPreferenceChange,
  t,
}: SettingsGeneralSectionProps) {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateStatusMessage, setUpdateStatusMessage] = useState<string>('');

  const isDesktop = isTauriApp();

  const handleManualCheckUpdates = async () => {
    if (!isTauriApp()) return;
    setUpdateStatus('checking');
    setUpdateStatusMessage('');
    await checkForAppUpdates({
      silent: false,
      language: currentLang,
      onStatusChange: (status, msg) => {
        setUpdateStatus(status);
        if (msg) setUpdateStatusMessage(msg);
      },
    });
  };
  const getSelectToneClass = (interval: number) => {
    switch (interval) {
      case 5:
        return 'border-red-900/80 text-red-300 bg-red-950/20 focus:ring-red-500';
      case 15:
        return 'border-orange-900/70 text-orange-300 bg-orange-950/20 focus:ring-orange-500';
      case 30:
        return 'border-amber-900/60 text-amber-200 bg-amber-950/20 focus:ring-amber-500';
      case 300:
        return 'border-emerald-800/70 text-emerald-300 bg-emerald-950/20 focus:ring-emerald-500';
      default:
        return 'border-zinc-750 text-zinc-200 bg-zinc-950 focus:ring-emerald-500';
    }
  };
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
              <GbFlag className="w-5 h-3.5" />
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
              <EsFlag className="w-5 h-3.5" />
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

        {saveMode === 'auto' && (
          <div className="pt-3 mt-1 border-t border-zinc-800/80 space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-0.5">
                <label htmlFor="autosave-interval-select" className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>{t('autoSaveInterval')}</span>
                </label>
                <p className="text-[11px] text-zinc-400">
                  {t('autoSaveIntervalDesc')}
                </p>
              </div>
              <div className="shrink-0">
                <select
                  id="autosave-interval-select"
                  aria-label={t('autoSaveInterval')}
                  value={autoSaveInterval}
                  onChange={(e) => onPreferenceChange('autoSaveInterval', Number(e.target.value))}
                  className={`px-3 py-1.5 border text-xs rounded-md focus:outline-none focus:ring-1 transition cursor-pointer font-sans ${getSelectToneClass(autoSaveInterval)}`}
                >
                  <option value={5} className="bg-zinc-900 text-red-400 font-medium">
                    {t('interval5s')}
                  </option>
                  <option value={15} className="bg-zinc-900 text-orange-300">
                    {t('interval15s')}
                  </option>
                  <option value={30} className="bg-zinc-900 text-amber-200">
                    {t('interval30s')}
                  </option>
                  <option value={60} className="bg-zinc-900 text-zinc-300">
                    {t('interval1m')}
                  </option>
                  <option value={300} className="bg-zinc-900 text-emerald-400 font-medium">
                    {t('interval5m')}
                  </option>
                  <option value={600} className="bg-zinc-900 text-zinc-300">
                    {t('interval10m')}
                  </option>
                </select>
              </div>
            </div>

            {/* Informative notice explaining ultra-short frequency drawbacks */}
            <div className={`p-2.5 rounded-md border text-xs flex items-start gap-2.5 transition-colors ${
              autoSaveInterval <= 30
                ? 'bg-red-950/20 border-red-900/40 text-red-200/90'
                : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400'
            }`}>
              <AlertCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                autoSaveInterval <= 30 ? 'text-red-400' : 'text-zinc-500'
              }`} />
              <p className="text-[11px] leading-relaxed">
                {t('autoSaveShortNotice')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Drag & Drop Behaviors Section - 3 distinct, fine settings grouped together */}
      <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 divide-y divide-zinc-800/80 overflow-hidden">
        {/* Timeline Drop Mode */}
        <div className="p-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{t('timelineDropMode')}</span>
            </label>
            <div className="text-[11px] text-zinc-500 mt-0.5 pl-5.5">
              {t('timelineDropModeDesc')}
            </div>
          </div>

          <div className="flex items-center p-0.5 bg-zinc-950 border border-zinc-800 rounded-md shrink-0">
            <button
              type="button"
              onClick={() => onPreferenceChange('timelineDropMode', 'shift')}
              className={`px-3 py-1 text-xs font-medium rounded transition flex items-center gap-1.5 cursor-pointer ${
                timelineDropMode === 'shift'
                  ? 'border border-emerald-500/50 bg-emerald-950/50 text-zinc-100 ring-1 ring-emerald-500/30 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <span>{t('shiftMode')}</span>
              {timelineDropMode === 'shift' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              type="button"
              onClick={() => onPreferenceChange('timelineDropMode', 'swap')}
              className={`px-3 py-1 text-xs font-medium rounded transition flex items-center gap-1.5 cursor-pointer ${
                timelineDropMode === 'swap'
                  ? 'border border-emerald-500/50 bg-emerald-950/50 text-zinc-100 ring-1 ring-emerald-500/30 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <span>{t('swapMode')}</span>
              {timelineDropMode === 'swap' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* World Items Drop Mode */}
        <div className="p-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{t('worldDropMode')}</span>
            </label>
            <div className="text-[11px] text-zinc-500 mt-0.5 pl-5.5">
              {t('worldDropModeDesc')}
            </div>
          </div>

          <div className="flex items-center p-0.5 bg-zinc-950 border border-zinc-800 rounded-md shrink-0">
            <button
              type="button"
              onClick={() => onPreferenceChange('worldDropMode', 'shift')}
              className={`px-3 py-1 text-xs font-medium rounded transition flex items-center gap-1.5 cursor-pointer ${
                worldDropMode === 'shift'
                  ? 'border border-emerald-500/50 bg-emerald-950/50 text-zinc-100 ring-1 ring-emerald-500/30 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <span>{t('shiftMode')}</span>
              {worldDropMode === 'shift' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              type="button"
              onClick={() => onPreferenceChange('worldDropMode', 'swap')}
              className={`px-3 py-1 text-xs font-medium rounded transition flex items-center gap-1.5 cursor-pointer ${
                worldDropMode === 'swap'
                  ? 'border border-emerald-500/50 bg-emerald-950/50 text-zinc-100 ring-1 ring-emerald-500/30 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <span>{t('swapMode')}</span>
              {worldDropMode === 'swap' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Notes Drop Mode */}
        <div className="p-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <StickyNote className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{t('notesDropMode')}</span>
            </label>
            <div className="text-[11px] text-zinc-500 mt-0.5 pl-5.5">
              {t('notesDropModeDesc')}
            </div>
          </div>

          <div className="flex items-center p-0.5 bg-zinc-950 border border-zinc-800 rounded-md shrink-0">
            <button
              type="button"
              onClick={() => onPreferenceChange('notesDropMode', 'shift')}
              className={`px-3 py-1 text-xs font-medium rounded transition flex items-center gap-1.5 cursor-pointer ${
                notesDropMode === 'shift'
                  ? 'border border-emerald-500/50 bg-emerald-950/50 text-zinc-100 ring-1 ring-emerald-500/30 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <span>{t('shiftMode')}</span>
              {notesDropMode === 'shift' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              type="button"
              onClick={() => onPreferenceChange('notesDropMode', 'swap')}
              className={`px-3 py-1 text-xs font-medium rounded transition flex items-center gap-1.5 cursor-pointer ${
                notesDropMode === 'swap'
                  ? 'border border-emerald-500/50 bg-emerald-950/50 text-zinc-100 ring-1 ring-emerald-500/30 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <span>{t('swapMode')}</span>
              {notesDropMode === 'swap' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
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

      {/* App Updates (Local-First Opt-In) Card - Hidden in Web Browsers */}
      {isDesktop && (
        <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('autoUpdateCheck')}</span>
              </label>
              <p className="text-[11px] text-zinc-400">
                {t('autoUpdateCheckDesc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                aria-label={t('autoUpdateCheck')}
                checked={autoUpdateCheck}
                onChange={(e) => onPreferenceChange('autoUpdateCheck', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          {/* Local-first instant startup notice */}
          <div className="p-3 rounded-md border border-emerald-900/40 bg-emerald-950/20 text-emerald-200/90 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-zinc-300">
              <strong className="text-emerald-300 font-semibold block mb-0.5">
                {currentLang === 'es' ? 'Compromiso 100% Local-First:' : '100% Local-First Commitment:'}
              </strong>
              {t('autoUpdateNotice')}
            </p>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-[11px] text-zinc-400 min-h-[1.25rem] flex items-center">
              {updateStatusMessage ? (
                <span className={`flex items-center gap-1.5 font-medium ${
                  updateStatus === 'error'
                    ? 'text-red-400'
                    : updateStatus === 'up-to-date'
                    ? 'text-emerald-400'
                    : 'text-zinc-300'
                }`}>
                  {updateStatus === 'checking' || updateStatus === 'downloading' || updateStatus === 'restarting' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-emerald-400" />
                  ) : updateStatus === 'up-to-date' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : updateStatus === 'error' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  ) : null}
                  <span>{updateStatusMessage}</span>
                </span>
              ) : (
                <span className="text-zinc-500">{t('updates')}</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleManualCheckUpdates}
              disabled={updateStatus === 'checking' || updateStatus === 'downloading' || updateStatus === 'restarting'}
              className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-md border border-zinc-750 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-850 text-zinc-200 text-xs font-medium transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {updateStatus === 'checking' || updateStatus === 'downloading' || updateStatus === 'restarting' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>
                    {updateStatus === 'downloading'
                      ? t('downloadingUpdate')
                      : updateStatus === 'restarting'
                      ? t('restartingApp')
                      : t('checkingForUpdates')}
                  </span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t('checkForUpdatesNow')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
