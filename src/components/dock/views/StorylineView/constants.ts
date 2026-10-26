import { StorylineColor } from '../../../../types/dock';

export const STORYLINE_COLORS: StorylineColor[] = [
  'emerald',
  'purple',
  'amber',
  'blue',
  'rose',
  'cyan',
];

export const PRESET_FIELDS = [
  'Motivation',
  'Beginning',
  'Turning Point',
  'Resolution',
] as const;

export const COLOR_CLASSES: Record<
  StorylineColor,
  { bg: string; border: string; text: string; dot: string }
> = {
  emerald: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-750',
    text: 'text-zinc-200',
    dot: 'bg-emerald-500',
  },
  purple: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-750',
    text: 'text-zinc-200',
    dot: 'bg-purple-500',
  },
  amber: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-750',
    text: 'text-zinc-200',
    dot: 'bg-amber-500',
  },
  blue: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-750',
    text: 'text-zinc-200',
    dot: 'bg-blue-500',
  },
  rose: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-750',
    text: 'text-zinc-200',
    dot: 'bg-rose-500',
  },
  cyan: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-750',
    text: 'text-zinc-200',
    dot: 'bg-cyan-500',
  },
};
