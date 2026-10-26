import React from 'react';
import { MapPin, Shield, Scroll, Sparkles, Compass } from 'lucide-react';

export const DEFAULT_CATEGORIES: string[] = [
  'Location',
  'Faction',
  'Lore',
  'Artifact',
];

export const CATEGORY_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    dot: string;
    badge: string;
  }
> = {
  Location: {
    icon: MapPin,
    dot: 'bg-cyan-500',
    badge: 'border-cyan-800/60 bg-cyan-950/40 text-cyan-400',
  },
  Faction: {
    icon: Shield,
    dot: 'bg-amber-500',
    badge: 'border-amber-800/60 bg-amber-950/40 text-amber-400',
  },
  Lore: {
    icon: Scroll,
    dot: 'bg-emerald-500',
    badge: 'border-emerald-800/60 bg-emerald-950/40 text-emerald-400',
  },
  Artifact: {
    icon: Sparkles,
    dot: 'bg-purple-500',
    badge: 'border-purple-800/60 bg-purple-950/40 text-purple-400',
  },
};

export function getCategoryConfig(category: string): {
  icon: React.ComponentType<{ className?: string }>;
  dot: string;
  badge: string;
} {
  return (
    CATEGORY_CONFIG[category] ?? {
      icon: Compass,
      dot: 'bg-blue-500',
      badge: 'border-blue-800/60 bg-blue-950/40 text-blue-400',
    }
  );
}
