import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Language } from '../types/settings';
import en, { namespaces as enNamespaces } from './locales/en';

export type TranslationKey = keyof typeof en;
export type TranslationNamespace = keyof typeof enNamespaces;

// In-memory cache for loaded language dictionaries and their namespaces
const translationCache: Partial<Record<Language, Record<string, string>>> = {
  en,
};

const namespaceCache: Partial<Record<Language, Record<string, Record<string, string>>>> = {
  en: enNamespaces,
};

// Dynamic loaders for lazy loading translation bundles per language
export const localeLoaders: Record<
  Language,
  () => Promise<{
    default: Record<string, string>;
    namespaces?: Record<string, Record<string, string>>;
  }>
> = {
  en: () => import('./locales/en'),
  es: () => import('./locales/es'),
};

export function isLanguageLoaded(lang: Language): boolean {
  return Boolean(translationCache[lang]);
}

export function getLoadedLanguage(lang: Language): Record<string, string> | undefined {
  return translationCache[lang];
}

export function clearLanguageCache(): void {
  for (const key of Object.keys(translationCache) as Language[]) {
    if (key !== 'en') {
      delete translationCache[key];
      delete namespaceCache[key];
    }
  }
}

/**
 * Loads a language dictionary lazily via dynamic import() and caches it in memory.
 */
export async function loadLanguage(lang: Language): Promise<Record<string, string>> {
  if (translationCache[lang]) {
    return translationCache[lang]!;
  }
  const loader = localeLoaders[lang];
  if (!loader) {
    return translationCache.en || en;
  }
  const mod = await loader();
  const loaded = mod.default || (mod as unknown as Record<string, string>);
  translationCache[lang] = loaded;
  if (mod.namespaces) {
    namespaceCache[lang] = mod.namespaces;
  }
  return loaded;
}

/**
 * Backwards compatibility export for tests and legacy access.
 */
export const dict: {
  en: typeof en;
  es: typeof en;
} = {
  en,
  get es() {
    return (translationCache.es || en) as typeof en;
  },
};

/**
 * Dynamic on-the-fly language detection for the web version and initial startup.
 * 1. Checks URL query param (e.g. ?lang=es / ?lang=en) if present.
 * 2. Reads document language (document.documentElement.lang or attributes).
 * 3. Falls back to localStorage 'foliant-lang' set by landing page.
 * 4. Falls back to navigator.language.
 * Strictly does NOT write to localStorage to avoid polluting user cache on web.
 */
export function detectDynamicLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    // 1. URL search params (e.g. ?lang=es or ?lang=en from web landing links)
    if (window.location && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang) {
        return urlLang.toLowerCase().startsWith('es') ? 'es' : 'en';
      }
    }

    // 2. Landing page / Website language (stored by the web landing in 'foliant-lang')
    const pageLang = localStorage.getItem('foliant-lang');
    if (pageLang && pageLang.trim()) {
      return pageLang.toLowerCase().startsWith('es') ? 'es' : 'en';
    }

    // 3. Document language (document.documentElement.lang or attributes)
    const docLang =
      document.documentElement?.lang ||
      document.documentElement?.getAttribute('lang') ||
      document.documentElement?.getAttribute('data-lang');
    if (docLang && docLang.trim()) {
      return docLang.toLowerCase().startsWith('es') ? 'es' : 'en';
    }

    // 4. Fallback: navigator.language
    const navLang =
      typeof navigator !== 'undefined'
        ? navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || ''
        : '';
    if (navLang && navLang.trim()) {
      return navLang.toLowerCase().startsWith('es') ? 'es' : 'en';
    }
  } catch {
    // Fallback if access fails
  }
  return 'en';
}

export interface LanguageContextValue {
  language: Language;
  translations: Record<string, string>;
  namespaces?: Record<string, Record<string, string>>;
}

export const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  translations: en,
  namespaces: enNamespaces,
});

export const LanguageProvider: React.FC<{
  language?: Language;
  children: React.ReactNode;
}> = ({ language, children }) => {
  const targetLanguage = language || detectDynamicLanguage();
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    return isLanguageLoaded(targetLanguage) ? targetLanguage : 'en';
  });

  useEffect(() => {
    let cancelled = false;
    if (isLanguageLoaded(targetLanguage)) {
      setCurrentLang(targetLanguage);
    } else {
      loadLanguage(targetLanguage).then(() => {
        if (!cancelled) {
          setCurrentLang(targetLanguage);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [targetLanguage]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language: currentLang,
      translations: translationCache[currentLang] || translationCache.en || en,
      namespaces: namespaceCache[currentLang] || namespaceCache.en,
    }),
    [currentLang]
  );

  return React.createElement(LanguageContext.Provider, { value }, children);
};

/**
 * Universal useTranslation hook.
 * Reads language from LanguageContext by default, or accepts an explicit language override.
 * Returns `t(key)` function to retrieve translated strings and current language.
 */
export function useTranslation(overrideLang?: Language) {
  const context = useContext(LanguageContext);

  const [overrideStateLang, setOverrideStateLang] = useState<Language>(() => {
    if (overrideLang) {
      return isLanguageLoaded(overrideLang) ? overrideLang : 'en';
    }
    return context.language;
  });

  useEffect(() => {
    if (!overrideLang) return;
    if (isLanguageLoaded(overrideLang)) {
      setOverrideStateLang(overrideLang);
    } else {
      let cancelled = false;
      loadLanguage(overrideLang).then(() => {
        if (!cancelled) {
          setOverrideStateLang(overrideLang);
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [overrideLang]);

  const activeLang = overrideLang ? overrideStateLang : context.language;
  const activeTranslations: Record<string, string> =
    (overrideLang ? translationCache[overrideStateLang] : context.translations) ||
    translationCache[activeLang] ||
    translationCache.en ||
    en;
  const activeNamespaces =
    (overrideLang ? namespaceCache[overrideStateLang] : context.namespaces) ||
    namespaceCache[activeLang] ||
    namespaceCache.en ||
    enNamespaces;

  const t = useCallback(
    (
      key: TranslationKey | string,
      fallbackOrParams?: string | (string | number)[],
      params?: (string | number)[]
    ): string => {
      let fallback: string | undefined;
      let interpolationArgs: (string | number)[] | undefined;

      if (Array.isArray(fallbackOrParams)) {
        interpolationArgs = fallbackOrParams;
      } else {
        fallback = fallbackOrParams;
        interpolationArgs = params;
      }

      // 1. Direct key lookup in active dictionary
      let template: string | undefined = activeTranslations?.[key];

      // 2. Namespaced key lookup (e.g. 'editor:indentSize')
      if (!template && key.includes(':')) {
        const [ns, actualKey] = key.split(':');
        const nsDict = (activeNamespaces as Record<string, Record<string, string>>)?.[ns];
        if (nsDict?.[actualKey]) {
          template = nsDict[actualKey];
        } else {
          const enNsDict = (enNamespaces as Record<string, Record<string, string>>)?.[ns];
          if (enNsDict?.[actualKey]) {
            template = enNsDict[actualKey];
          }
        }
      }

      // 3. Fallback to preloaded English dictionary
      if (!template) {
        template = (translationCache.en as Record<string, string> || en as Record<string, string>)?.[key];
      }

      // 4. Provided fallback or raw key
      if (!template) {
        template = fallback !== undefined ? fallback : key;
      }

      // 5. Parameter interpolation: {0}, {1}, etc.
      if (interpolationArgs && interpolationArgs.length > 0) {
        interpolationArgs.forEach((val, idx) => {
          template = template!.replace(new RegExp(`\\{${idx}\\}`, 'g'), String(val));
        });
      }

      return template;
    },
    [activeTranslations, activeNamespaces]
  );

  return useMemo(() => ({ t, lang: activeLang }), [t, activeLang]);
}

/**
 * Helper to display localized role labels across views.
 */
export function getRoleLabel(role: string | undefined, t: (key: string) => string): string {
  if (!role) return t('roleMinor');
  const normalized = role.toLowerCase();
  switch (normalized) {
    case 'protagonist':
      return t('roleProtagonist');
    case 'antagonist':
      return t('roleAntagonist');
    case 'supporting':
      return t('roleSupporting');
    case 'minor':
      return t('roleMinor');
    default:
      return role;
  }
}
