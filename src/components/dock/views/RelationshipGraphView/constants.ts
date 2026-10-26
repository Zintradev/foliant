import {
  RelationshipColor,
  StorylineColor,
  LineStrokeStyle,
} from '../../../../types/dock';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3.0;
export const DRAG_THRESHOLD = 4; // 4px movement threshold before drag initiates
export const CARD_GAP = 20; // Compact minimum distance between character card boundaries
export const NODE_GAP = 26; // Smooth distance between node/junction boundaries and card shapes

// Visual color palette token map
export const COLOR_PALETTE: Record<
  RelationshipColor,
  { label: string; stroke: string; bg: string; border: string; text: string }
> = {
  blue: {
    label: 'Alliance (Blue)',
    stroke: '#3b82f6',
    bg: 'bg-blue-950/80',
    border: 'border-blue-700/70',
    text: 'text-blue-200',
  },
  rose: {
    label: 'Hostile / Enmity (Rose)',
    stroke: '#f43f5e',
    bg: 'bg-rose-950/80',
    border: 'border-rose-700/70',
    text: 'text-rose-200',
  },
  emerald: {
    label: 'Family / Blood (Emerald)',
    stroke: '#10b981',
    bg: 'bg-emerald-950/80',
    border: 'border-emerald-700/70',
    text: 'text-emerald-200',
  },
  amber: {
    label: 'Mentor / Master (Amber)',
    stroke: '#f59e0b',
    bg: 'bg-amber-950/80',
    border: 'border-amber-700/70',
    text: 'text-amber-200',
  },
  purple: {
    label: 'Romance / Bound (Purple)',
    stroke: '#a855f7',
    bg: 'bg-purple-950/80',
    border: 'border-purple-700/70',
    text: 'text-purple-200',
  },
  cyan: {
    label: 'Contract / Pact (Cyan)',
    stroke: '#06b6d4',
    bg: 'bg-cyan-950/80',
    border: 'border-cyan-700/70',
    text: 'text-cyan-200',
  },
  zinc: {
    label: 'Neutral / Unknown (Zinc)',
    stroke: '#71717a',
    bg: 'bg-zinc-900/90',
    border: 'border-zinc-700',
    text: 'text-zinc-300',
  },
};

// Storyline theme colors for Union Nodes
export const STORYLINE_THEMES: Record<
  StorylineColor,
  { bg: string; border: string; text: string; dot: string }
> = {
  blue: {
    bg: 'bg-blue-950/70',
    border: 'border-blue-700/70',
    text: 'text-blue-300',
    dot: 'bg-blue-500',
  },
  emerald: {
    bg: 'bg-emerald-950/70',
    border: 'border-emerald-700/70',
    text: 'text-emerald-300',
    dot: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-950/70',
    border: 'border-amber-700/70',
    text: 'text-amber-300',
    dot: 'bg-amber-500',
  },
  rose: {
    bg: 'bg-rose-950/70',
    border: 'border-rose-700/70',
    text: 'text-rose-300',
    dot: 'bg-rose-500',
  },
  purple: {
    bg: 'bg-purple-950/70',
    border: 'border-purple-700/70',
    text: 'text-purple-300',
    dot: 'bg-purple-500',
  },
  cyan: {
    bg: 'bg-cyan-950/70',
    border: 'border-cyan-700/70',
    text: 'text-cyan-300',
    dot: 'bg-cyan-500',
  },
};

export const STROKE_STYLES: Record<LineStrokeStyle, { label: string; dash?: string }> = {
  solid: { label: 'Solid' },
  dashed: { label: 'Dashed', dash: '6,4' },
  dotted: { label: 'Dotted', dash: '2.5,3.5' },
};
