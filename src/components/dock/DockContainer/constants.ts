import React from 'react';
import {
  BookOpen,
  BookMarked,
  Image as ImageIcon,
  Users,
  GitMerge,
  BarChart3,
  Clock,
  Network,
  Globe,
  Sliders,
  Search,
} from 'lucide-react';
import { TabId, ALL_SYSTEM_TABS } from '../../../types/dock';
import { TranslationKey } from '../../../i18n/translations';

export const TAB_TRANSLATION_KEYS: Record<TabId, { labelKey: TranslationKey; shortLabelKey: TranslationKey }> = {
  inspector: { labelKey: 'dockInspector', shortLabelKey: 'dockInspectorShort' },
  outline: { labelKey: 'dockOutline', shortLabelKey: 'dockOutlineShort' },
  timeline: { labelKey: 'dockTimeline', shortLabelKey: 'dockTimelineShort' },
  relationships: { labelKey: 'dockGraph', shortLabelKey: 'dockGraphShort' },
  storyline: { labelKey: 'dockStories', shortLabelKey: 'dockStoriesShort' },
  stats: { labelKey: 'dockStats', shortLabelKey: 'dockStatsShort' },
  context: { labelKey: 'dockNotes', shortLabelKey: 'dockNotesShort' },
  characters: { labelKey: 'dockCast', shortLabelKey: 'dockCastShort' },
  worldbuilding: { labelKey: 'dockWorld', shortLabelKey: 'dockWorldShort' },
  moodboard: { labelKey: 'dockVisuals', shortLabelKey: 'dockVisualsShort' },
  search: { labelKey: 'search', shortLabelKey: 'search' },
};

export const TAB_META: Record<
  TabId,
  { label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }
> = {
  inspector: { label: 'Scene Inspector', shortLabel: 'Inspector', icon: Sliders },
  outline: { label: 'Outline', shortLabel: 'Outline', icon: BookOpen },
  timeline: { label: 'Timeline', shortLabel: 'Timeline', icon: Clock },
  relationships: { label: 'Relationships', shortLabel: 'Graph', icon: Network },
  storyline: { label: 'Storylines', shortLabel: 'Storylines', icon: GitMerge },
  stats: { label: 'Stats & Hierarchy', shortLabel: 'Stats', icon: BarChart3 },
  context: { label: 'Notes & Context', shortLabel: 'Notes', icon: BookMarked },
  characters: { label: 'Characters', shortLabel: 'Cast', icon: Users },
  worldbuilding: { label: 'Worldbuilding & Lore', shortLabel: 'World', icon: Globe },
  moodboard: { label: 'Moodboard', shortLabel: 'Moodboard', icon: ImageIcon },
  search: { label: 'Search', shortLabel: 'Search', icon: Search },
};

export const ALL_TAB_IDS = ALL_SYSTEM_TABS;
