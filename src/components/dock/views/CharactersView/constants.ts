export const TAG_COLOR_MAP: Record<
  string,
  { bg: string; border: string; text: string; dot: string }
> = {
  emerald: {
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-800/60',
    text: 'text-emerald-300',
    dot: 'bg-emerald-500',
  },
  purple: {
    bg: 'bg-purple-950/40',
    border: 'border-purple-800/60',
    text: 'text-purple-300',
    dot: 'bg-purple-500',
  },
  amber: {
    bg: 'bg-amber-950/40',
    border: 'border-amber-800/60',
    text: 'text-amber-300',
    dot: 'bg-amber-500',
  },
  blue: {
    bg: 'bg-blue-950/40',
    border: 'border-blue-800/60',
    text: 'text-blue-300',
    dot: 'bg-blue-500',
  },
  rose: {
    bg: 'bg-rose-950/40',
    border: 'border-rose-800/60',
    text: 'text-rose-300',
    dot: 'bg-rose-500',
  },
  cyan: {
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-800/60',
    text: 'text-cyan-300',
    dot: 'bg-cyan-500',
  },
  zinc: {
    bg: 'bg-zinc-850',
    border: 'border-zinc-750',
    text: 'text-zinc-300',
    dot: 'bg-zinc-400',
  },
};

export const PRESET_CHARACTER_FIELDS = [
  'Motivation',
  'Backstory',
  'Internal Conflict',
  'Appearance',
] as const;
