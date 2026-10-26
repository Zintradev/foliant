import { COLOR_SWATCHES, ColorThemeKey } from '../../../types/settings';

export function resolveColorHex(val: string): string {
  if (val.startsWith('#')) return val;
  return COLOR_SWATCHES[val as ColorThemeKey]?.hexPreview || '#71717a';
}

export const COLOR_TRANSLATION_MAP: Record<string, string> = {
  amber: 'colorAmber',
  blue: 'colorBlue',
  cyan: 'colorCyan',
  emerald: 'colorEmerald',
  fuchsia: 'colorFuchsia',
  green: 'colorGreen',
  indigo: 'colorIndigo',
  lime: 'colorLime',
  orange: 'colorOrange',
  pink: 'colorPink',
  purple: 'colorPurple',
  red: 'colorRed',
  rose: 'colorRose',
  sky: 'colorSky',
  teal: 'colorTeal',
  violet: 'colorViolet',
  yellow: 'colorYellow',
  zinc: 'colorZinc',
};

export function getColorLabel(c: string, t: (key: string, fallback?: string) => string): string {
  const transKey = COLOR_TRANSLATION_MAP[c.toLowerCase()];
  return transKey ? t(transKey) : c;
}

export function getRoleLabel(role: string, t: (key: string, fallback?: string) => string): string {
  switch (role) {
    case 'Protagonist':
      return t('roleProtagonist');
    case 'Antagonist':
      return t('roleAntagonist');
    case 'Supporting':
      return t('roleSupporting');
    case 'Minor':
      return t('roleMinor');
    default:
      return role;
  }
}

export function getCategoryLabel(category: string, t: (key: string, fallback?: string) => string): string {
  switch (category) {
    case 'Location':
      return t('catLocation');
    case 'Faction':
      return t('catFaction');
    case 'Lore':
      return t('catMagic');
    case 'Artifact':
      return t('catObject');
    default:
      return category;
  }
}

export function getStorylineLabel(key: string, t: (key: string, fallback?: string) => string): string {
  const colorTrans = COLOR_TRANSLATION_MAP[key.toLowerCase()];
  return colorTrans ? t(colorTrans) : key;
}
