import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  detectDynamicLanguage,
  dict,
  loadLanguage,
  isLanguageLoaded,
  clearLanguageCache,
  useTranslation,
  getRoleLabel,
  localeLoaders,
} from './translations';
import { loadSettings } from '../types/settings';
import { namespaces as enNamespaces } from './locales/en';
import { namespaces as esNamespaces } from './locales/es';
import { renderHook } from '@testing-library/react';

describe('detectDynamicLanguage & Dynamic i18n Autodetection', () => {
  const originalDocLang = document.documentElement.lang;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('data-lang');
  });

  afterEach(() => {
    document.documentElement.lang = originalDocLang;
    vi.restoreAllMocks();
  });

  it('detects "es" when document.documentElement.lang starts with "es"', () => {
    document.documentElement.lang = 'es-ES';
    expect(detectDynamicLanguage()).toBe('es');
  });

  it('detects "en" when document.documentElement.lang starts with "en" or other non-es language', () => {
    document.documentElement.lang = 'en-US';
    expect(detectDynamicLanguage()).toBe('en');

    document.documentElement.lang = 'fr-FR';
    expect(detectDynamicLanguage()).toBe('en');
  });

  it('falls back to navigator.language when documentElement has no lang set', () => {
    document.documentElement.removeAttribute('lang');
    document.documentElement.lang = '';

    vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-MX');
    expect(detectDynamicLanguage()).toBe('es');

    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB');
    expect(detectDynamicLanguage()).toBe('en');
  });

  it('matches the landing page language stored in "foliant-lang" even if navigator is in Spanish', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-ES');
    localStorage.setItem('foliant-lang', 'en');
    expect(detectDynamicLanguage()).toBe('en');

    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    localStorage.setItem('foliant-lang', 'es');
    expect(detectDynamicLanguage()).toBe('es');
  });

  it('prioritizes URL search parameter ?lang=es / ?lang=en over document & navigator', () => {
    document.documentElement.lang = 'en-US';
    const originalSearch = window.location.search;
    try {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...window.location, search: '?lang=es' },
      });
      expect(detectDynamicLanguage()).toBe('es');

      window.location.search = '?lang=en';
      document.documentElement.lang = 'es';
      expect(detectDynamicLanguage()).toBe('en');
    } finally {
      window.location.search = originalSearch;
    }
  });

  it('STRICT RESTRICTION: does NOT write detected language to localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    document.documentElement.lang = 'es';

    const detected = detectDynamicLanguage();
    expect(detected).toBe('es');
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('foliant_app_settings_v1')).toBeNull();
  });

  it('loadSettings() on web reflects detected language dynamically without persisting to localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    delete (window as any).__TAURI_INTERNALS__;
    delete (window as any).__TAURI__;
    delete (window as any).__TAURI_IPC__;

    document.documentElement.lang = 'es';
    const settingsEs = loadSettings();
    expect(settingsEs.preferences.language).toBe('es');
    expect(setItemSpy).not.toHaveBeenCalled();

    document.documentElement.lang = 'en';
    const settingsEn = loadSettings();
    expect(settingsEn.preferences.language).toBe('en');
    expect(setItemSpy).not.toHaveBeenCalled();
  });
});

describe('Runtime Lazy Loading & In-Memory Caching', () => {
  it('preloads default English language in memory cache', () => {
    expect(isLanguageLoaded('en')).toBe(true);
    expect(dict.en).toBeDefined();
    expect(dict.en.studioSettings).toBe('Studio Settings');
  });

  it('lazily loads Spanish dictionary via dynamic import and caches it', async () => {
    clearLanguageCache();
    expect(isLanguageLoaded('es')).toBe(false);

    const esDict = await loadLanguage('es');
    expect(isLanguageLoaded('es')).toBe(true);
    expect(esDict.studioSettings).toBe('Ajustes de Foliant');

    // Calling again returns from in-memory cache
    const cached = await loadLanguage('es');
    expect(cached).toBe(esDict);
  });

  it('tracks dynamic import loader functions for each supported language', async () => {
    expect(typeof localeLoaders.en).toBe('function');
    expect(typeof localeLoaders.es).toBe('function');

    const enModule = await localeLoaders.en();
    const esModule = await localeLoaders.es();

    expect(enModule.default).toBeDefined();
    expect(esModule.default).toBeDefined();
    expect(enModule.namespaces).toBeDefined();
    expect(esModule.namespaces).toBeDefined();
  });
});

describe('Translation Key & Namespace 1:1 Parity', () => {
  beforeEach(async () => {
    await loadLanguage('es');
    await loadLanguage('en');
  });

  it('guarantees 1:1 parity between English and Spanish translation dictionaries', () => {
    const enKeys = Object.keys(dict.en).sort();
    const esKeys = Object.keys(dict.es).sort();

    const missingInEs = enKeys.filter((k) => !(k in dict.es));
    const missingInEn = esKeys.filter((k) => !(k in dict.en));

    expect(missingInEs).toEqual([]);
    expect(missingInEn).toEqual([]);
    expect(enKeys.length).toBe(esKeys.length);
    expect(enKeys.length).toBe(916);
  });

  it('guarantees 1:1 parity of namespaces between English and Spanish', () => {
    const enNsNames = Object.keys(enNamespaces).sort();
    const esNsNames = Object.keys(esNamespaces).sort();

    expect(enNsNames).toEqual(esNsNames);
    expect(enNsNames).toEqual([
      'characters',
      'common',
      'dock',
      'editor',
      'export',
      'graph',
      'help',
      'navigation',
      'settings',
      'stats',
      'storyline',
      'timeline',
      'worldbuilding',
    ]);
  });

  it('guarantees 1:1 key parity inside each individual namespace module', () => {
    const namespaces = Object.keys(enNamespaces) as (keyof typeof enNamespaces)[];

    for (const ns of namespaces) {
      const enKeys = Object.keys(enNamespaces[ns]).sort();
      const esKeys = Object.keys(esNamespaces[ns]).sort();

      const missingInEs = enKeys.filter((k) => !(k in esNamespaces[ns]));
      const missingInEn = esKeys.filter((k) => !(k in enNamespaces[ns]));

      expect(missingInEs).toEqual([]);
      expect(missingInEn).toEqual([]);
      expect(enKeys.length).toBe(esKeys.length);
      expect(enKeys.length).toBeGreaterThan(0);
    }
  });
});

describe('useTranslation Hook & Helpers', () => {
  beforeEach(async () => {
    await loadLanguage('es');
    await loadLanguage('en');
  });

  it('retrieves translated strings in active and override languages', () => {
    const { result: enResult } = renderHook(() => useTranslation('en'));
    expect(enResult.current.t('settings')).toBe('Settings');
    expect(enResult.current.t('studioSettings')).toBe('Studio Settings');
    expect(enResult.current.lang).toBe('en');

    const { result: esResult } = renderHook(() => useTranslation('es'));
    expect(esResult.current.t('settings')).toBe('Ajustes');
    expect(esResult.current.t('studioSettings')).toBe('Ajustes de Foliant');
    expect(esResult.current.lang).toBe('es');
  });

  it('supports namespaced key lookups (e.g. editor:indentSize)', () => {
    const { result: enResult } = renderHook(() => useTranslation('en'));
    expect(enResult.current.t('editor:indentSize')).toBe('Indentation Width');

    const { result: esResult } = renderHook(() => useTranslation('es'));
    expect(esResult.current.t('editor:indentSize')).toBe('Tamaño de Sangría');
  });

  it('interpolates {0}, {1} parameters cleanly', () => {
    const { result } = renderHook(() => useTranslation('en'));
    const formatted = result.current.t('tourStepOf', ['2', '6']);
    expect(formatted).toBe('Step 2 of 6');
  });

  it('falls back to provided fallback or key when translation is not found', () => {
    const { result } = renderHook(() => useTranslation('en'));
    expect(result.current.t('non_existent_key', 'Default Fallback')).toBe('Default Fallback');
    expect(result.current.t('non_existent_key')).toBe('non_existent_key');
  });

  it('translates character roles correctly via getRoleLabel in both languages', () => {
    const { result: enResult } = renderHook(() => useTranslation('en'));
    expect(getRoleLabel('protagonist', enResult.current.t)).toBe('Protagonist');
    expect(getRoleLabel('antagonist', enResult.current.t)).toBe('Antagonist');
    expect(getRoleLabel('supporting', enResult.current.t)).toBe('Supporting');
    expect(getRoleLabel('minor', enResult.current.t)).toBe('Minor');
    expect(getRoleLabel(undefined, enResult.current.t)).toBe('Minor');

    const { result: esResult } = renderHook(() => useTranslation('es'));
    expect(getRoleLabel('protagonist', esResult.current.t)).toBe('Protagonista');
    expect(getRoleLabel('antagonist', esResult.current.t)).toBe('Antagonista');
    expect(getRoleLabel('supporting', esResult.current.t)).toBe('Secundario');
    expect(getRoleLabel('minor', esResult.current.t)).toBe('Menor');
  });
});
