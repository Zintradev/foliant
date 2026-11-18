import type { CSSProperties } from 'react';
import { ChapterStatus } from '../../../../types/project';
import { AppColorSettings, COLOR_SWATCHES } from '../../../../types/settings';
import { hexToRgb } from '../../../common/DarkColorPicker/colorConversions';
import { ProgressStatus } from './types';

export const DEFAULT_STATUS_OPTIONS: ChapterStatus[] = [
  'Not Started',
  'In Progress',
  'First Draft',
  'Revised',
  'Completed',
];

export const STATUS_OPTIONS: ChapterStatus[] = DEFAULT_STATUS_OPTIONS;

export function getAllStatusOptions(
  customStatuses?: string[],
  currentStatus?: string
): string[] {
  const options = [...DEFAULT_STATUS_OPTIONS];
  if (customStatuses && Array.isArray(customStatuses)) {
    for (const s of customStatuses) {
      if (s && !options.includes(s as any)) {
        options.push(s);
      }
    }
  }
  if (currentStatus && !options.includes(currentStatus as any)) {
    options.push(currentStatus);
  }
  return options;
}

export function formatReadingTime(words: number): string {
  const minutes = Math.ceil(words / 225);
  if (minutes < 60) {
    return `${Math.max(1, minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

/**
 * Returns dynamic color tokens based on completion percentage:
 * - < 70%: Sober blue (in progress)
 * - 70% - 100%: Optimal emerald green (on target)
 * - > 100%: Warning rose/red (exceeded limit)
 */
export function getProgressStatus(current: number, target: number): ProgressStatus {
  if (!target || target <= 0) {
    return {
      percent: 0,
      barColor: 'bg-zinc-700',
      textColor: 'text-zinc-500',
      badgeText: 'No target',
      badgeClass: 'text-zinc-500 border-zinc-800 bg-zinc-900',
    };
  }

  const percent = (current / target) * 100;

  if (percent > 100) {
    return {
      percent,
      barColor: 'bg-rose-500',
      textColor: 'text-rose-400',
      badgeText: 'Exceeded',
      badgeClass: 'text-rose-400 border-rose-800/60 bg-rose-950/40',
    };
  }

  if (percent >= 70) {
    return {
      percent,
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      badgeText: 'Optimal',
      badgeClass: 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40',
    };
  }

  return {
    percent,
    barColor: 'bg-blue-500/85',
    textColor: 'text-blue-400',
    badgeText: 'In Progress',
    badgeClass: 'text-blue-400 border-blue-800/60 bg-blue-950/40',
  };
}

export interface StatusBadgeProps {
  className: string;
  style?: CSSProperties;
}

export function getStatusBadgeProps(
  status: ChapterStatus,
  colorSettings?: AppColorSettings
): StatusBadgeProps {
  const colorKey = colorSettings?.statuses?.[status];
  if (colorKey) {
    if (COLOR_SWATCHES[colorKey]) {
      const swatch = COLOR_SWATCHES[colorKey]!;
      return {
        className: `${swatch.badgeBorder} ${swatch.badgeBg} ${swatch.badgeText}`,
      };
    }

    // Custom hex color (e.g. #e11d48)
    const cleanHex = colorKey.startsWith('#')
      ? colorKey.length > 7
        ? colorKey.slice(0, 7)
        : colorKey
      : `#${colorKey}`;
    const { r, g, b } = hexToRgb(cleanHex);
    return {
      className: 'border',
      style: {
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.2)`,
        borderColor: `rgba(${r}, ${g}, ${b}, 0.6)`,
        color: cleanHex,
      },
    };
  }

  switch (status) {
    case 'Completed':
      return { className: 'border-emerald-800/60 bg-emerald-950/40 text-emerald-400' };
    case 'Revised':
      return { className: 'border-purple-800/60 bg-purple-950/40 text-purple-400' };
    case 'First Draft':
      return { className: 'border-amber-800/60 bg-amber-950/40 text-amber-400' };
    case 'In Progress':
      return { className: 'border-blue-800/60 bg-blue-950/40 text-blue-400' };
    case 'Not Started':
    default:
      return { className: 'border-zinc-800 bg-zinc-900 text-zinc-400' };
  }
}

export function getStatusBadgeStyle(
  status: ChapterStatus,
  colorSettings?: AppColorSettings
): string {
  return getStatusBadgeProps(status, colorSettings).className;
}

export function getStatusLabel(s: ChapterStatus, t: (key: string) => string): string {
  switch (s) {
    case 'Not Started':
      return t('statusNotStarted');
    case 'In Progress':
      return t('statusInProgress');
    case 'First Draft':
      return t('statusFirstDraft');
    case 'Revised':
      return t('statusRevised');
    case 'Completed':
      return t('statusDone');
    default:
      return s;
  }
}

