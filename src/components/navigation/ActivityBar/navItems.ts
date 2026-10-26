import React from 'react';
import {
  Feather,
  BookOpen,
  GitMerge,
  BarChart3,
  BookMarked,
  Users,
  Globe,
  Image as ImageIcon,
  Clock,
  Network,
  Search,
} from 'lucide-react';
import { MainViewId } from '../../../types/navigation';
import { TranslationKey } from '../../../i18n/translations';

export interface NavItem {
  id: MainViewId;
  labelKey: TranslationKey;
  tooltipKey: TranslationKey;
  defaultLabel: string;
  defaultTooltip: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'write',
    labelKey: 'actWrite',
    tooltipKey: 'actWriteTooltip',
    defaultLabel: 'Editor',
    defaultTooltip: 'Writing Workspace & Chapters',
    icon: Feather,
  },
  {
    id: 'outline',
    labelKey: 'actOutline',
    tooltipKey: 'actOutlineTooltip',
    defaultLabel: 'Outline',
    defaultTooltip: 'Project Structure & Outline',
    icon: BookOpen,
  },
  {
    id: 'search',
    labelKey: 'search',
    tooltipKey: 'search',
    defaultLabel: 'Search',
    defaultTooltip: 'Search Project (Ctrl+Shift+F)',
    icon: Search,
  },
  {
    id: 'timeline',
    labelKey: 'actTimeline',
    tooltipKey: 'actTimelineTooltip',
    defaultLabel: 'Timeline',
    defaultTooltip: 'Chronological Scene Timeline',
    icon: Clock,
  },
  {
    id: 'relationships',
    labelKey: 'actGraph',
    tooltipKey: 'actGraphTooltip',
    defaultLabel: 'Graph',
    defaultTooltip: 'Character Relationship Graph',
    icon: Network,
  },
  {
    id: 'storyline',
    labelKey: 'actStories',
    tooltipKey: 'actStoriesTooltip',
    defaultLabel: 'Stories',
    defaultTooltip: 'Storylines & Narrative Threads',
    icon: GitMerge,
  },
  {
    id: 'stats',
    labelKey: 'actStats',
    tooltipKey: 'actStatsTooltip',
    defaultLabel: 'Stats',
    defaultTooltip: 'Project Analytics & Target Tracking',
    icon: BarChart3,
  },
  {
    id: 'context',
    labelKey: 'actNotes',
    tooltipKey: 'actNotesTooltip',
    defaultLabel: 'Notes',
    defaultTooltip: 'Notes & Reference Context',
    icon: BookMarked,
  },
  {
    id: 'characters',
    labelKey: 'actCast',
    tooltipKey: 'actCastTooltip',
    defaultLabel: 'Cast',
    defaultTooltip: 'Characters & Entities',
    icon: Users,
  },
  {
    id: 'worldbuilding',
    labelKey: 'actWorld',
    tooltipKey: 'actWorldTooltip',
    defaultLabel: 'World',
    defaultTooltip: 'Worldbuilding & Lore',
    icon: Globe,
  },
  {
    id: 'moodboard',
    labelKey: 'actVisuals',
    tooltipKey: 'actVisualsTooltip',
    defaultLabel: 'Visuals',
    defaultTooltip: 'Visual Moodboard',
    icon: ImageIcon,
  },
];
