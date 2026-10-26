import {
  AlertTriangle,
  Star,
  Flag,
  Skull,
  Bookmark,
} from 'lucide-react';
import {
  StorylineColor,
  TimelineMarkerIcon,
  TimelineMarkerColor,
} from '../../../../types/dock';

export const STORYLINE_COLOR_MAP: Record<
  StorylineColor,
  { bg: string; text: string; border: string; dot: string; line: string; stroke: string }
> = {
  emerald: {
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-300',
    border: 'border-emerald-800/60',
    dot: 'bg-emerald-400',
    line: 'bg-emerald-500/80',
    stroke: '#10b981',
  },
  purple: {
    bg: 'bg-purple-950/40',
    text: 'text-purple-300',
    border: 'border-purple-800/60',
    dot: 'bg-purple-400',
    line: 'bg-purple-500/80',
    stroke: '#a855f7',
  },
  amber: {
    bg: 'bg-amber-950/40',
    text: 'text-amber-300',
    border: 'border-amber-800/60',
    dot: 'bg-amber-400',
    line: 'bg-amber-500/80',
    stroke: '#f59e0b',
  },
  blue: {
    bg: 'bg-blue-950/40',
    text: 'text-blue-300',
    border: 'border-blue-800/60',
    dot: 'bg-blue-400',
    line: 'bg-blue-500/80',
    stroke: '#3b82f6',
  },
  rose: {
    bg: 'bg-rose-950/40',
    text: 'text-rose-300',
    border: 'border-rose-800/60',
    dot: 'bg-rose-400',
    line: 'bg-rose-500/80',
    stroke: '#f43f5e',
  },
  cyan: {
    bg: 'bg-cyan-950/40',
    text: 'text-cyan-300',
    border: 'border-cyan-800/60',
    dot: 'bg-cyan-400',
    line: 'bg-cyan-500/80',
    stroke: '#06b6d4',
  },
};

export const MARKER_COLOR_CONFIG: Record<
  TimelineMarkerColor,
  {
    label: string;
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    badgeHoverBg: string;
    hex: string;
  }
> = {
  rose: {
    label: 'Critical / Threat',
    bg: 'bg-rose-950/80',
    border: 'border-rose-700/70',
    text: 'text-rose-200',
    badgeBg: 'bg-rose-950/60',
    badgeBorder: 'border-rose-800/80',
    badgeText: 'text-rose-300',
    badgeHoverBg: 'hover:bg-rose-900/60',
    hex: '#f43f5e',
  },
  amber: {
    label: 'Warning / Suspense',
    bg: 'bg-amber-950/80',
    border: 'border-amber-700/70',
    text: 'text-amber-200',
    badgeBg: 'bg-amber-950/60',
    badgeBorder: 'border-amber-800/80',
    badgeText: 'text-amber-300',
    badgeHoverBg: 'hover:bg-amber-900/60',
    hex: '#f59e0b',
  },
  emerald: {
    label: 'Triumph / Discovery',
    bg: 'bg-emerald-950/80',
    border: 'border-emerald-700/70',
    text: 'text-emerald-200',
    badgeBg: 'bg-emerald-950/60',
    badgeBorder: 'border-emerald-800/80',
    badgeText: 'text-emerald-300',
    badgeHoverBg: 'hover:bg-emerald-900/60',
    hex: '#10b981',
  },
  cyan: {
    label: 'Clue / Mystery',
    bg: 'bg-cyan-950/80',
    border: 'border-cyan-700/70',
    text: 'text-cyan-200',
    badgeBg: 'bg-cyan-950/60',
    badgeBorder: 'border-cyan-800/80',
    badgeText: 'text-cyan-300',
    badgeHoverBg: 'hover:bg-cyan-900/60',
    hex: '#06b6d4',
  },
  purple: {
    label: 'Twist / Revelation',
    bg: 'bg-purple-950/80',
    border: 'border-purple-700/70',
    text: 'text-purple-200',
    badgeBg: 'bg-purple-950/60',
    badgeBorder: 'border-purple-800/80',
    badgeText: 'text-purple-300',
    badgeHoverBg: 'hover:bg-purple-900/60',
    hex: '#a855f7',
  },
  zinc: {
    label: 'Neutral / Note',
    bg: 'bg-zinc-900/90',
    border: 'border-zinc-700/70',
    text: 'text-zinc-200',
    badgeBg: 'bg-zinc-950/70',
    badgeBorder: 'border-zinc-800',
    badgeText: 'text-zinc-300',
    badgeHoverBg: 'hover:bg-zinc-855',
    hex: '#a1a1aa',
  },
};

export const MARKER_ICONS: readonly {
  id: TimelineMarkerIcon;
  label: string;
}[] = [
  { id: 'alert', label: 'Alert' },
  { id: 'star', label: 'Star' },
  { id: 'flag', label: 'Flag' },
  { id: 'skull', label: 'Threat' },
  { id: 'custom', label: 'Custom' },
];

export const MARKER_COLORS: readonly TimelineMarkerColor[] = [
  'rose',
  'amber',
  'emerald',
  'cyan',
  'purple',
  'zinc',
];

export function renderMarkerIcon(icon: TimelineMarkerIcon, className: string = 'w-3 h-3') {
  switch (icon) {
    case 'alert':
      return <AlertTriangle className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'flag':
      return <Flag className={className} />;
    case 'skull':
      return <Skull className={className} />;
    case 'custom':
    default:
      return <Bookmark className={className} />;
  }
}
