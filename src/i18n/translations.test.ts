import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { detectDynamicLanguage } from './translations';
import { loadSettings } from '../types/settings';

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
