import React from 'react';
import { ShieldCheck, Code2, ExternalLink, Cpu, Database, Sparkles, Layers } from 'lucide-react';
import { isTauriApp } from '../../../utils/platform';
import logoUrl from '../../../assets/logo.svg';

interface SettingsInfoSectionProps {
  t: (key: string, fallback?: string) => string;
}

export const SettingsInfoSection = React.memo(function SettingsInfoSection({
  t,
}: SettingsInfoSectionProps) {
  const isDesktop = isTauriApp();
  const appVersion = 'v0.1.0';

  return (
    <div className="space-y-6">
      {/* Header / Brand Card */}
      <div className="p-5 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center p-2 shadow-inner">
            <img src={logoUrl} alt="Foliant" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-100 tracking-tight">Foliant Studio</h3>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                {appVersion}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t('appInfoSubtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Local-First & Privacy Guarantee */}
      <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <h4 className="text-xs font-semibold">{t('appLocalFirstTitle')}</h4>
        </div>
        <p className="text-xs text-emerald-200/80 leading-relaxed">
          {t('appLocalFirstDesc')}
        </p>
      </div>

      {/* App Specifications Grid */}
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-zinc-500 block mb-0.5">{t('appVersion')}</span>
            <span className="font-mono text-zinc-200 font-semibold">{appVersion}</span>
          </div>
          <div>
            <span className="text-zinc-500 block mb-0.5">{t('appBuildType')}</span>
            <span className="text-zinc-200 font-medium">
              {isDesktop ? t('appDesktopBuild') : t('appWebBuild')}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block mb-0.5">{t('appLicense')}</span>
            <span className="text-zinc-200 font-medium">{t('appLicenseType')}</span>
          </div>
          <div>
            <span className="text-zinc-500 block mb-0.5">{t('appDeveloper')}</span>
            <span className="text-zinc-200 font-medium">{t('appDeveloperName')}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 block mb-2">Stack & Core Technologies</span>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-300">
              <Cpu className="w-3 h-3 text-emerald-400" /> Tauri v2 (Rust Core)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-300">
              <Sparkles className="w-3 h-3 text-emerald-400" /> React 19 + TypeScript
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-300">
              <Layers className="w-3 h-3 text-emerald-400" /> ProseMirror Engine
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-300">
              <Database className="w-3 h-3 text-emerald-400" /> Local Directory Bundles
            </span>
          </div>
        </div>
      </div>

      {/* Links & Repository */}
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-zinc-850 border border-zinc-800 text-zinc-300">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">{t('appSourceCode')}</div>
            <div className="text-[11px] text-zinc-400">{t('appSourceCodeDesc')}</div>
          </div>
        </div>
        <a
          href="https://github.com/Zintradev/foliant"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-md transition cursor-pointer"
        >
          <span>GitHub</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
});

