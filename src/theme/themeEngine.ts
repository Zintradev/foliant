import { ThemeMode, CustomThemeColors, DEFAULT_CUSTOM_THEME } from '../types/settings';

export interface ThemePalette {
  bgBase: string;
  bgSurface: string;
  bgSurfaceElevated: string;
  colorPrimary: string;
  textBase: string;
  textMuted: string;
  borderBase: string;
}

export const DARK_THEME: ThemePalette = {
  bgBase: '#09090b', // zinc-950
  bgSurface: '#18181b', // zinc-900
  bgSurfaceElevated: '#27272a', // zinc-800
  colorPrimary: '#10b981', // emerald-500
  textBase: '#f4f4f5', // zinc-100
  textMuted: '#a1a1aa', // zinc-400
  borderBase: '#27272a', // zinc-800
};

export const LIGHT_THEME: ThemePalette = {
  bgBase: '#f4f4f5', // zinc-100
  bgSurface: '#ffffff', // white
  bgSurfaceElevated: '#e4e4e7', // zinc-200
  colorPrimary: '#059669', // emerald-600
  textBase: '#18181b', // zinc-900
  textMuted: '#71717a', // zinc-500
  borderBase: '#e4e4e7', // zinc-200
};

/**
 * Blend two hex colors together by weight (0 = c1, 1 = c2).
 */
function mixHex(c1: string, c2: string, weight: number): string {
  const parse = (hex: string) => {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  try {
    const [r1, g1, b1] = parse(c1);
    const [r2, g2, b2] = parse(c2);
    const w = Math.max(0, Math.min(1, weight));
    const r = Math.round(r1 * (1 - w) + r2 * w);
    const g = Math.round(g1 * (1 - w) + g2 * w);
    const b = Math.round(b1 * (1 - w) + b2 * w);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch {
    return c1;
  }
}

const MANAGED_VARIABLES = [
  '--bg-base',
  '--bg-surface',
  '--bg-surface-elevated',
  '--color-primary',
  '--text-base',
  '--text-muted',
  '--border-base',
  '--color-zinc-950',
  '--color-zinc-900',
  '--color-zinc-850',
  '--color-zinc-800',
  '--color-zinc-750',
  '--color-zinc-700',
  '--color-zinc-600',
  '--color-zinc-500',
  '--color-zinc-400',
  '--color-zinc-300',
  '--color-zinc-200',
  '--color-zinc-100',
  '--color-zinc-50',
  '--color-emerald-400',
  '--color-emerald-500',
  '--color-emerald-600',
];

/**
 * Injects dynamic CSS Custom Properties directly onto `document.documentElement` (`:root`).
 *
 * ### Architectural Rationale:
 * Tailwind CSS v4 compiles utility classes (e.g. `bg-zinc-950`, `text-zinc-400`, `border-zinc-800`)
 * to CSS variables defined in `@theme`. By overriding these exact variable names at runtime on `:root`,
 * the entire UI (sidebars, editors, cards, borders, buttons) adapts instantaneously to Light Mode,
 * High-Contrast Dark Mode, or Custom Color Palettes without requiring full component tree re-renders
 * or clumsy multi-class toggling across hundreds of components.
 */
export function applyTheme(
  themeMode: ThemeMode = 'dark',
  customTheme: CustomThemeColors = DEFAULT_CUSTOM_THEME
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (themeMode === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';

    // Semantic tokens
    root.style.setProperty('--bg-base', LIGHT_THEME.bgBase);
    root.style.setProperty('--bg-surface', LIGHT_THEME.bgSurface);
    root.style.setProperty('--bg-surface-elevated', LIGHT_THEME.bgSurfaceElevated);
    root.style.setProperty('--color-primary', LIGHT_THEME.colorPrimary);
    root.style.setProperty('--text-base', LIGHT_THEME.textBase);
    root.style.setProperty('--text-muted', LIGHT_THEME.textMuted);
    root.style.setProperty('--border-base', LIGHT_THEME.borderBase);

    // Tailwind v4 Zinc Scale overrides for crisp Light Mode
    root.style.setProperty('--color-zinc-950', '#f4f4f5'); // Canvas background
    root.style.setProperty('--color-zinc-900', '#ffffff'); // Surface panels & sidebars
    root.style.setProperty('--color-zinc-850', '#f0f0f3'); // Elevated surface
    root.style.setProperty('--color-zinc-800', '#e4e4e7'); // Borders & dividers
    root.style.setProperty('--color-zinc-750', '#dcdee2'); // Elevated borders
    root.style.setProperty('--color-zinc-700', '#d4d4d8'); // Button hovers
    root.style.setProperty('--color-zinc-600', '#a1a1aa'); // Inactive icons
    root.style.setProperty('--color-zinc-500', '#71717a'); // Secondary/muted labels
    root.style.setProperty('--color-zinc-400', '#52525b'); // Tertiary text
    root.style.setProperty('--color-zinc-300', '#3f3f46'); // Body text
    root.style.setProperty('--color-zinc-200', '#27272a'); // Titles & high contrast
    root.style.setProperty('--color-zinc-100', '#09090b'); // Pure dark headings
    root.style.setProperty('--color-zinc-50', '#000000'); // Pure black text

    // Accent overrides
    root.style.setProperty('--color-emerald-400', '#10b981');
    root.style.setProperty('--color-emerald-500', '#059669');
    root.style.setProperty('--color-emerald-600', '#047857');
  } else if (themeMode === 'custom' && customTheme) {
    root.classList.remove('light');
    root.classList.add('dark');
    root.style.colorScheme = 'dark';

    const bg = customTheme.background || '#09090b';
    const surf = customTheme.surface || '#18181b';
    const prim = customTheme.primary || '#10b981';
    const txt = customTheme.text || '#f4f4f5';

    // Semantic tokens
    root.style.setProperty('--bg-base', bg);
    root.style.setProperty('--bg-surface', surf);
    root.style.setProperty('--bg-surface-elevated', mixHex(surf, txt, 0.08));
    root.style.setProperty('--color-primary', prim);
    root.style.setProperty('--text-base', txt);
    root.style.setProperty('--text-muted', mixHex(surf, txt, 0.55));
    root.style.setProperty('--border-base', mixHex(surf, txt, 0.15));

    // Tailwind v4 Zinc Scale overrides mapped to custom palette
    root.style.setProperty('--color-zinc-950', bg);
    root.style.setProperty('--color-zinc-900', surf);
    root.style.setProperty('--color-zinc-850', mixHex(surf, txt, 0.08));
    root.style.setProperty('--color-zinc-800', mixHex(surf, txt, 0.15));
    root.style.setProperty('--color-zinc-750', mixHex(surf, txt, 0.22));
    root.style.setProperty('--color-zinc-700', mixHex(surf, txt, 0.3));
    root.style.setProperty('--color-zinc-600', mixHex(surf, txt, 0.42));
    root.style.setProperty('--color-zinc-500', mixHex(surf, txt, 0.55));
    root.style.setProperty('--color-zinc-400', mixHex(surf, txt, 0.7));
    root.style.setProperty('--color-zinc-300', mixHex(surf, txt, 0.82));
    root.style.setProperty('--color-zinc-200', mixHex(surf, txt, 0.92));
    root.style.setProperty('--color-zinc-100', txt);
    root.style.setProperty('--color-zinc-50', mixHex(txt, '#ffffff', 0.2));

    // Custom Primary Accent overrides
    root.style.setProperty('--color-emerald-400', mixHex(prim, '#ffffff', 0.2));
    root.style.setProperty('--color-emerald-500', prim);
    root.style.setProperty('--color-emerald-600', mixHex(prim, '#000000', 0.2));
  } else {
    // Dark Mode (Tailwind's native dark defaults)
    root.classList.remove('light');
    root.classList.add('dark');
    root.style.colorScheme = 'dark';

    // Remove all overrides so Tailwind's native theme is active
    for (const v of MANAGED_VARIABLES) {
      root.style.removeProperty(v);
    }

    // Re-inject standard dark fallback variables
    root.style.setProperty('--bg-base', DARK_THEME.bgBase);
    root.style.setProperty('--bg-surface', DARK_THEME.bgSurface);
    root.style.setProperty('--bg-surface-elevated', DARK_THEME.bgSurfaceElevated);
    root.style.setProperty('--color-primary', DARK_THEME.colorPrimary);
    root.style.setProperty('--text-base', DARK_THEME.textBase);
    root.style.setProperty('--text-muted', DARK_THEME.textMuted);
    root.style.setProperty('--border-base', DARK_THEME.borderBase);
  }
}
