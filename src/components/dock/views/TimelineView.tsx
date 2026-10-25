import React, { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import {
  Clock,
  GitMerge,
  Users,
  Plus,
  X,
  AlertTriangle,
  Star,
  Flag,
  Skull,
  Bookmark,
  Trash2,
  Columns,
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  Check,
  Circle,
  GripVertical,
} from 'lucide-react';
import { TextNode, PlotStatus } from '../../../types/project';
import {
  StorylineItem,
  CharacterItem,
  StorylineColor,
  TimelineMarker,
  TimelineMarkerIcon,
  TimelineMarkerColor,
} from '../../../types/dock';
import { AppSettings, loadSettings } from '../../../types/settings';
import { useFlipAnimation } from '../../common/useFlipAnimation';
import { useTranslation, getRoleLabel } from '../../../i18n/translations';
import { countWords } from '../../../utils/textMetrics';

export interface TimelineFilters {
  storyline: string;
  character: string;
}

interface TimelineViewProps {
  chapters: TextNode[];
  storylines: StorylineItem[];
  characters: CharacterItem[];
  activeChapterId: string;
  onSelectChapter: (id: string) => void;
  onUpdateChapter?: (id: string, updates: Partial<TextNode>) => void;
  onUpdateStorylines?: (updated: StorylineItem[]) => void;
  onUpdateCharacters?: (updated: CharacterItem[]) => void;
  isExpanded?: boolean;
  timelineDropMode?: 'shift' | 'swap';
  selectedStorylineFilter?: string;
  onStorylineFilterChange?: (id: string) => void;
  selectedCharacterFilter?: string;
  onCharacterFilterChange?: (id: string) => void;
  timelineFilters?: TimelineFilters;
  setTimelineFilters?:
    | React.Dispatch<React.SetStateAction<TimelineFilters>>
    | ((filters: TimelineFilters) => void);
  appSettings?: AppSettings;
}

interface ActivePopover {
  type: 'storyline' | 'character';
  itemId: string;
  sceneId: string;
  x: number;
  y: number;
}

interface ActiveMarkerPopoverState {
  sceneId: string;
  markerId: string;
}

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

interface ChapterGroup {
  folder: TextNode | null;
  scenes: TextNode[];
  totalWords: number;
}

/**
 * Represents a chronological scene column in the Subway Map lane.
 */
export type TimelineColumnItem = {
  type: 'scene';
  scene: TextNode;
  originalIndex: number;
};

function TimelineViewComponent({
  chapters,
  storylines,
  characters,
  activeChapterId,
  onSelectChapter,
  onUpdateChapter,
  onUpdateStorylines,
  timelineDropMode = 'shift',
  selectedStorylineFilter: propStorylineFilter,
  onStorylineFilterChange: propOnStorylineFilterChange,
  selectedCharacterFilter: propCharacterFilter,
  onCharacterFilterChange: propOnCharacterFilterChange,
  timelineFilters,
  setTimelineFilters,
  appSettings,
}: TimelineViewProps) {
  const { t } = useTranslation();
  const effectiveAppSettings = appSettings || loadSettings();

  const getTimelineStatusLabel = (status?: string): string => {
    switch (status) {
      case 'Draft':
        return t('statusDraft');
      case 'Not Started':
        return t('statusNotStarted');
      case 'In Progress':
        return t('statusInProgress');
      case 'First Draft':
        return t('statusFirstDraft');
      case 'Revised':
        return t('statusRevised');
      case 'Completed':
      case 'Done':
        return t('statusDone');
      default:
        return status ? String(status) : t('statusDraft');
    }
  };

  // All scenes in chronological order
  const scenes = useMemo(() => chapters.filter((c) => c.type === 'scene'), [chapters]);

  // Layout mode: 'subway' (Subway Map & Collapsible Swimlanes) is the default
  const [layoutMode, setLayoutMode] = useState<'subway' | 'lanes'>('subway');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  // Individual Storyline collapse state (by default all storylines are expanded)
  const [collapsedStorylines, setCollapsedStorylines] = useState<Record<string, boolean>>({});

  // Independent Zoom States: zoomX for scene column widths, zoomY for storyline track heights
  const [zoomX, setZoomX] = useState<number>(1.0);
  const [zoomY, setZoomY] = useState<number>(1.0);

  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const swimlanesContainerRef = useRef<HTMLDivElement | null>(null);
  const sliderXRef = useRef<HTMLInputElement | null>(null);
  const sliderYRef = useRef<HTMLInputElement | null>(null);
  const percentXRef = useRef<HTMLSpanElement | null>(null);
  const percentYRef = useRef<HTMLSpanElement | null>(null);

  const zoomXRef = useRef<number>(zoomX);
  const zoomYRef = useRef<number>(zoomY);
  const zoomXDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoomYDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleZoomXChange = useCallback(
    (newVal: number) => {
      zoomXRef.current = newVal;
      const pxVal = Math.round(240 * newVal);
      if (timelineContainerRef.current) {
        timelineContainerRef.current.style.setProperty('--zoom-x', String(newVal));
        timelineContainerRef.current.style.setProperty('--scene-width', `${pxVal}px`);
      }
      if (percentXRef.current) {
        percentXRef.current.textContent = `${Math.round(newVal * 100)}%`;
      }
      if (sliderXRef.current && Number(sliderXRef.current.value) !== newVal) {
        sliderXRef.current.value = String(newVal);
      }
      if (zoomXDebounceRef.current) clearTimeout(zoomXDebounceRef.current);
      zoomXDebounceRef.current = setTimeout(() => {
        setZoomX(newVal);
        const preserve = appSettings
          ? appSettings.preferences?.preserveManualSceneWidth
          : effectiveAppSettings?.preferences?.preserveManualSceneWidth;
        if (!preserve) {
          setManualSceneWidths((prev) => (Object.keys(prev).length > 0 ? {} : prev));
        }
      }, 200);
    },
    [appSettings, effectiveAppSettings]
  );

  const handleZoomYChange = useCallback((newVal: number) => {
    zoomYRef.current = newVal;
    const pxVal = Math.round(60 * newVal);
    if (timelineContainerRef.current) {
      timelineContainerRef.current.style.setProperty('--zoom-y', String(newVal));
      timelineContainerRef.current.style.setProperty('--track-height', `${pxVal}px`);
    }
    if (percentYRef.current) {
      percentYRef.current.textContent = `${Math.round(newVal * 100)}%`;
    }
    if (sliderYRef.current && Number(sliderYRef.current.value) !== newVal) {
      sliderYRef.current.value = String(newVal);
    }
    if (zoomYDebounceRef.current) clearTimeout(zoomYDebounceRef.current);
    zoomYDebounceRef.current = setTimeout(() => {
      setZoomY(newVal);
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (zoomXDebounceRef.current) clearTimeout(zoomXDebounceRef.current);
      if (zoomYDebounceRef.current) clearTimeout(zoomYDebounceRef.current);
    };
  }, []);

  // Smooth Ctrl+Wheel and trackpad pinch zoom
  useEffect(() => {
    const el = timelineContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const normalizedDelta =
          e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 500 : e.deltaY;
        const isNotch = Math.abs(normalizedDelta) >= 40;
        const factor = isNotch
          ? (normalizedDelta < 0 ? 1.10 : 0.91)
          : Math.exp(-normalizedDelta * 0.0025);

        if (e.shiftKey) {
          const currentY = zoomYRef.current;
          const nextY = Math.min(3.0, Math.max(0.5, Math.round(currentY * factor * 100) / 100));
          handleZoomYChange(nextY);
        } else {
          const currentX = zoomXRef.current;
          const nextX = Math.min(3.0, Math.max(0.5, Math.round(currentX * factor * 100) / 100));
          handleZoomXChange(nextX);
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [handleZoomXChange, handleZoomYChange]);

  useEffect(() => {
    zoomXRef.current = zoomX;
    if (sliderXRef.current) sliderXRef.current.value = String(zoomX);
    if (percentXRef.current) percentXRef.current.textContent = `${Math.round(zoomX * 100)}%`;
    if (timelineContainerRef.current) {
      timelineContainerRef.current.style.setProperty('--zoom-x', String(zoomX));
      timelineContainerRef.current.style.setProperty('--scene-width', `${Math.round(240 * zoomX)}px`);
    }
  }, [zoomX]);

  useEffect(() => {
    zoomYRef.current = zoomY;
    if (sliderYRef.current) sliderYRef.current.value = String(zoomY);
    if (percentYRef.current) percentYRef.current.textContent = `${Math.round(zoomY * 100)}%`;
    if (timelineContainerRef.current) {
      timelineContainerRef.current.style.setProperty('--zoom-y', String(zoomY));
      timelineContainerRef.current.style.setProperty('--track-height', `${Math.round(60 * zoomY)}px`);
    }
  }, [zoomY]);

  // Independent filters for thread isolation (fallback to local state if not controlled)
  const [internalStorylineFilter, setInternalStorylineFilter] = useState<string>('all');
  const [internalCharacterFilter, setInternalCharacterFilter] = useState<string>('all');

  const selectedStorylineFilter =
    timelineFilters?.storyline !== undefined
      ? timelineFilters.storyline
      : propStorylineFilter !== undefined
      ? propStorylineFilter
      : internalStorylineFilter;

  const selectedCharacterFilter =
    timelineFilters?.character !== undefined
      ? timelineFilters.character
      : propCharacterFilter !== undefined
      ? propCharacterFilter
      : internalCharacterFilter;

  const setSelectedStorylineFilter = useCallback(
    (id: string) => {
      if (setTimelineFilters) {
        setTimelineFilters({
          storyline: id,
          character: selectedCharacterFilter,
        });
      } else if (propOnStorylineFilterChange) {
        propOnStorylineFilterChange(id);
      }
      setInternalStorylineFilter(id);
    },
    [setTimelineFilters, propOnStorylineFilterChange, selectedCharacterFilter]
  );

  const setSelectedCharacterFilter = useCallback(
    (id: string) => {
      if (setTimelineFilters) {
        setTimelineFilters({
          storyline: selectedStorylineFilter,
          character: id,
        });
      } else if (propOnCharacterFilterChange) {
        propOnCharacterFilterChange(id);
      }
      setInternalCharacterFilter(id);
    },
    [setTimelineFilters, propOnCharacterFilterChange, selectedStorylineFilter]
  );

  // Drag and Drop state for storyline reordering (Y-axis)
  const dragStorylineIndex = useRef<number | null>(null);
  const dragStorylineNode = useRef<HTMLElement | null>(null);
  const [draggedStorylineId, setDraggedStorylineId] = useState<string | null>(null);
  const [dragOverPlotId, setDragOverPlotId] = useState<string | null>(null);
  const [shiftTargetIndex, setShiftTargetIndex] = useState<number | null>(null);

  // FLIP hook
  const registerTrack = useFlipAnimation(false);

  // Stable display storylines: in both 'shift' and 'swap' modes, rows remain stable during dragging
  // while cards visually glide with fluid transforms, preventing DOM thrashing.
  const displayStorylines = storylines;

  // Popovers & Dropdowns
  const [activePopover, setActivePopover] = useState<ActivePopover | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const [activeMarkerPopover, setActiveMarkerPopover] = useState<ActiveMarkerPopoverState | null>(null);
  const markerPopoverRef = useRef<HTMLDivElement | null>(null);

  const [openAttachDropdown, setOpenAttachDropdown] = useState<{
    sceneId: string;
    type: 'character' | 'storyline';
  } | null>(null);

  // Individual resizer overrides for cards and plot tracks
  const [manualSceneWidths, setManualSceneWidths] = useState<Record<string, number>>({});
  const [plotHeights, setPlotHeights] = useState<Record<string, number>>({});



  // Dynamic width & height calculations based on zoom and individual overrides
  const baseSceneColWidth = Math.round(240 * zoomX);
  const baseSwimlaneRowHeight = Math.round(80 * zoomY);

  const getSceneWidth = (sceneId: string) => manualSceneWidths[sceneId] ?? baseSceneColWidth;
  const getPlotHeight = (storylineId: string) => plotHeights[storylineId] ?? baseSwimlaneRowHeight;

  const getRowHeight = useCallback(
    (stId: string) => {
      if (collapsedStorylines[stId]) return 34;
      if (plotHeights[stId]) return plotHeights[stId];
      return Math.round(60 * (zoomYRef.current || 1.0));
    },
    [collapsedStorylines, plotHeights]
  );

  const handleSceneResizeStart = (e: React.PointerEvent, sceneId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = getSceneWidth(sceneId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(140, Math.min(800, startWidth + delta));
      setManualSceneWidths((prev) => ({ ...prev, [sceneId]: newWidth }));
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const handlePlotResizeStart = (e: React.PointerEvent, storylineId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = getPlotHeight(storylineId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startY;
      const newHeight = Math.max(40, Math.min(400, startHeight + delta));
      setPlotHeights((prev) => ({ ...prev, [storylineId]: newHeight }));
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // ---------------------------------------------------------------------------
  // Helpers: Scene Storyline Attachments & Filter checks
  // ---------------------------------------------------------------------------

  // Pre-computed attached storylines map per scene for instant O(1) rendering in scene header cards
  const sceneAttachedStorylinesMap = useMemo(() => {
    const map = new Map<string, { storyline: StorylineItem; status: PlotStatus }[]>();
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const scenePlotStates = scene.plotStates || [];
      const results: { storyline: StorylineItem; status: PlotStatus }[] = [];

      for (let j = 0; j < storylines.length; j++) {
        const s = storylines[j];
        const plotState = scenePlotStates.find((p) => p.storylineId === s.id);
        const isLinkedLegacy = s.linkedChapterIds?.includes(scene.id);
        if (plotState) {
          results.push({ storyline: s, status: plotState.status });
        } else if (isLinkedLegacy) {
          results.push({ storyline: s, status: 'Active' });
        }
      }
      map.set(scene.id, results);
    }
    return map;
  }, [scenes, storylines]);

  // Pre-computed set of scene IDs matching active filters for instant O(1) filtering
  const participatingScenesSet = useMemo(() => {
    if (selectedStorylineFilter === 'all' && selectedCharacterFilter === 'all') {
      return null;
    }
    const set = new Set<string>();
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      let matchesStoryline = true;
      if (selectedStorylineFilter !== 'all') {
        const hasLegacyLink = storylines
          .filter((s) => s.id === selectedStorylineFilter)
          .some((s) => s.linkedChapterIds?.includes(scene.id));
        const hasPlotState = scene.plotStates?.some(
          (p) => p.storylineId === selectedStorylineFilter
        );
        matchesStoryline = Boolean(hasLegacyLink || hasPlotState);
      }

      let matchesCharacter = true;
      if (selectedCharacterFilter !== 'all') {
        matchesCharacter = Boolean((scene.attachedCharacterIds || []).includes(selectedCharacterFilter));
      }

      if (matchesStoryline && matchesCharacter) {
        set.add(scene.id);
      }
    }
    return set;
  }, [scenes, selectedStorylineFilter, selectedCharacterFilter, storylines]);

  // Pre-computed word counts per scene to avoid regex recalculation during renders
  const sceneWordCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < scenes.length; i++) {
      map.set(scenes[i].id, countWords(scenes[i].content || ''));
    }
    return map;
  }, [scenes]);

  // Pre-computed character map for instant O(1) attached character lookups
  const characterMap = useMemo(() => {
    const map = new Map<string, CharacterItem>();
    for (let i = 0; i < characters.length; i++) {
      map.set(characters[i].id, characters[i]);
    }
    return map;
  }, [characters]);

  // ---------------------------------------------------------------------------
  // Subway Map Columns: Chronological Scene Lane (Always fully expanded)
  // ---------------------------------------------------------------------------
  const timelineColumns = useMemo<TimelineColumnItem[]>(() => {
    return scenes.map((scene, originalIndex) => ({
      type: 'scene',
      scene,
      originalIndex,
    }));
  }, [scenes]);

  // Pre-computed Station & Span Map for instant 60fps rendering of swimlane tracks
  const { storylineSpanMap, stationMap } = useMemo(() => {
    const spans = new Map<
      string,
      { firstActiveIdx: number; lastActiveIdx: number; count: number }
    >();
    const stations = new Map<
      string,
      {
        plotState: { storylineId: string; status: PlotStatus } | undefined;
        isLinkedLegacy: boolean;
        isStationActive: boolean;
        currentStatus: PlotStatus;
      }
    >();

    storylines.forEach((st) => {
      const activeIndices: number[] = [];
      scenes.forEach((sc, idx) => {
        const plotState = sc.plotStates?.find((p) => p.storylineId === st.id);
        const isLinkedLegacy = Boolean(st.linkedChapterIds?.includes(sc.id));
        const isStationActive = Boolean(plotState || isLinkedLegacy);
        const currentStatus: PlotStatus = plotState?.status || 'Active';

        stations.set(`${st.id}:${sc.id}`, {
          plotState,
          isLinkedLegacy,
          isStationActive,
          currentStatus,
        });

        if (isStationActive) {
          activeIndices.push(idx);
        }
      });

      spans.set(st.id, {
        firstActiveIdx: activeIndices.length > 0 ? activeIndices[0] : -1,
        lastActiveIdx: activeIndices.length > 0 ? activeIndices[activeIndices.length - 1] : -1,
        count: activeIndices.length,
      });
    });

    return { storylineSpanMap: spans, stationMap: stations };
  }, [storylines, scenes]);

  // ---------------------------------------------------------------------------
  // Group scenes by their parent folder/chapter for Lanes layout
  // ---------------------------------------------------------------------------
  const chapterGroups = useMemo<ChapterGroup[]>(() => {
    const folders = chapters.filter((c) => c.type === 'folder');
    const groups: ChapterGroup[] = [];
    const scenesByParent = new Map<string | null, TextNode[]>();

    scenes.forEach((scene) => {
      const pid = scene.parentId || null;
      if (!scenesByParent.has(pid)) {
        scenesByParent.set(pid, []);
      }
      scenesByParent.get(pid)!.push(scene);
    });

    folders.forEach((folder) => {
      const folderScenes = scenesByParent.get(folder.id) || [];
      const totalWords = folderScenes.reduce((acc, s) => acc + countWords(s.content), 0);
      groups.push({
        folder,
        scenes: folderScenes,
        totalWords,
      });
    });

    const rootScenes = scenesByParent.get(null) || [];
    if (rootScenes.length > 0) {
      const totalWords = rootScenes.reduce((acc, s) => acc + countWords(s.content), 0);
      groups.push({
        folder: null,
        scenes: rootScenes,
        totalWords,
      });
    }

    return groups;
  }, [chapters, scenes]);

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Popover details
  const popoverStoryline = useMemo(() => {
    if (activePopover?.type === 'storyline') {
      return storylines.find((s) => s.id === activePopover.itemId);
    }
    return null;
  }, [activePopover, storylines]);

  const popoverCharacter = useMemo(() => {
    if (activePopover?.type === 'character') {
      return characters.find((c) => c.id === activePopover.itemId);
    }
    return null;
  }, [activePopover, characters]);

  // Dismiss popovers on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (
        markerPopoverRef.current &&
        !markerPopoverRef.current.contains(target) &&
        !target.closest('.marker-trigger-btn')
      ) {
        setActiveMarkerPopover(null);
      }

      if (popoverRef.current && !popoverRef.current.contains(target)) {
        setActivePopover(null);
      }

      if (!target.closest('.attach-dropdown-trigger') && !target.closest('.attach-dropdown-menu')) {
        setOpenAttachDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePopover(null);
        setActiveMarkerPopover(null);
        setOpenAttachDropdown(null);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Marker Management Handlers
  // ---------------------------------------------------------------------------
  const handleAddMarker = (sceneId: string) => {
    if (!onUpdateChapter) return;
    const scene = chapters.find((c) => c.id === sceneId);
    if (!scene) return;

    const newMarker: TimelineMarker = {
      id: `marker-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: 'Key Event / Alert',
      description: '',
      icon: 'alert',
      color: 'rose',
    };

    const updated = [...(scene.markers || []), newMarker];
    onUpdateChapter(sceneId, { markers: updated });
    setActiveMarkerPopover({ sceneId, markerId: newMarker.id });
  };

  const handleUpdateMarker = (
    sceneId: string,
    markerId: string,
    updates: Partial<TimelineMarker>
  ) => {
    if (!onUpdateChapter) return;
    const scene = chapters.find((c) => c.id === sceneId);
    if (!scene) return;

    const updated = (scene.markers || []).map((m) =>
      m.id === markerId ? { ...m, ...updates } : m
    );

    onUpdateChapter(sceneId, { markers: updated });
  };

  const handleDeleteMarker = (sceneId: string, markerId: string) => {
    if (!onUpdateChapter) return;
    const scene = chapters.find((c) => c.id === sceneId);
    if (!scene) return;

    const updated = (scene.markers || []).filter((m) => m.id !== markerId);
    onUpdateChapter(sceneId, { markers: updated });
    setActiveMarkerPopover(null);
  };

  // ---------------------------------------------------------------------------
  // Attachment Handlers
  // ---------------------------------------------------------------------------
  const handleAttachCharacter = (sceneId: string, characterId: string) => {
    const scene = chapters.find((c) => c.id === sceneId);
    if (!scene || !onUpdateChapter) return;

    const currentAttached = scene.attachedCharacterIds || [];
    if (!currentAttached.includes(characterId)) {
      onUpdateChapter(sceneId, {
        attachedCharacterIds: [...currentAttached, characterId],
      });
    }
    setOpenAttachDropdown(null);
  };

  const handleDetachCharacter = (sceneId: string, characterId: string) => {
    const scene = chapters.find((c) => c.id === sceneId);
    if (!scene || !onUpdateChapter) return;

    const currentAttached = scene.attachedCharacterIds || [];
    onUpdateChapter(sceneId, {
      attachedCharacterIds: currentAttached.filter((id) => id !== characterId),
    });
    setActivePopover(null);
  };

  const handleAttachStoryline = (sceneId: string, storylineId: string) => {
    const scene = chapters.find((c) => c.id === sceneId);
    if (!scene || !onUpdateChapter) return;

    const currentPlotStates = scene.plotStates || [];
    if (!currentPlotStates.some((p) => p.storylineId === storylineId)) {
      onUpdateChapter(sceneId, {
        plotStates: [...currentPlotStates, { storylineId, status: 'Active' }],
      });
    }

    if (onUpdateStorylines) {
      const updated = storylines.map((s) => {
        if (s.id === storylineId && !s.linkedChapterIds?.includes(sceneId)) {
          return {
            ...s,
            linkedChapterIds: [...(s.linkedChapterIds || []), sceneId],
          };
        }
        return s;
      });
      onUpdateStorylines(updated);
    }

    setOpenAttachDropdown(null);
  };

  const handleDetachStoryline = (sceneId: string, storylineId: string) => {
    const scene = chapters.find((c) => c.id === sceneId);
    if (scene && onUpdateChapter) {
      onUpdateChapter(sceneId, {
        plotStates: (scene.plotStates || []).filter((p) => p.storylineId !== storylineId),
      });
    }

    if (onUpdateStorylines) {
      const updated = storylines.map((s) => {
        if (s.id === storylineId) {
          return {
            ...s,
            linkedChapterIds: (s.linkedChapterIds || []).filter((id) => id !== sceneId),
          };
        }
        return s;
      });
      onUpdateStorylines(updated);
    }
    setActivePopover(null);
  };

  const handleStorylineDragStart = (e: React.DragEvent, index: number, id: string) => {
    e.stopPropagation();
    dragStorylineIndex.current = index;
    dragStorylineNode.current = e.currentTarget as HTMLElement;
    setDraggedStorylineId(id);
    setShiftTargetIndex(index);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStorylineDragEnter = (e: React.DragEvent, _targetIndex: number, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedStorylineId && draggedStorylineId !== targetId && dragOverPlotId !== targetId) {
      setDragOverPlotId(targetId);
    }
  };

  const handleSwimlanesDragOver = (e: React.DragEvent) => {
    if (!draggedStorylineId || timelineDropMode !== 'shift') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!swimlanesContainerRef.current) return;

    const rect = swimlanesContainerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;

    let accumulatedY = 0;
    let targetSlot = storylines.length - 1;
    for (let i = 0; i < storylines.length; i++) {
      const h = getRowHeight(storylines[i].id);
      if (relativeY < accumulatedY + h) {
        targetSlot = i;
        break;
      }
      accumulatedY += h;
    }

    targetSlot = Math.max(0, Math.min(storylines.length - 1, targetSlot));
    if (shiftTargetIndex !== targetSlot) {
      setShiftTargetIndex(targetSlot);
    }
  };

  const handleStorylineDragOver = (e: React.DragEvent, targetId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (timelineDropMode === 'swap') {
      e.stopPropagation();
      if (targetId && draggedStorylineId && draggedStorylineId !== targetId) {
        if (dragOverPlotId !== targetId) {
          setDragOverPlotId(targetId);
        }
      }
    }
  };

  const handleStorylineDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    if (!e.relatedTarget || !timelineContainerRef.current?.contains(e.relatedTarget as Node)) {
      setDragOverPlotId(null);
    }
  };

  const handleStorylineDrop = (e: React.DragEvent, targetIndex?: number, targetId?: string) => {
    e.preventDefault();
    e.stopPropagation();

    const payload = e.dataTransfer?.getData?.('text/plain') ?? '';
    try {
      const sourceId = payload || draggedStorylineId;

      if (sourceId && onUpdateStorylines) {
        if (timelineDropMode === 'swap') {
          const effectiveTargetId = dragOverPlotId || targetId;
          if (effectiveTargetId && sourceId !== effectiveTargetId) {
            const sourceIdx = storylines.findIndex((s) => s.id === sourceId);
            const targetIdx = storylines.findIndex((s) => s.id === effectiveTargetId);
            if (sourceIdx !== -1 && targetIdx !== -1) {
              const next = [...storylines];
              const temp = next[sourceIdx];
              next[sourceIdx] = next[targetIdx];
              next[targetIdx] = temp;
              onUpdateStorylines(next);
            }
          }
        } else {
          // Shift mode: move source item to the target position
          const sourceIdx = storylines.findIndex((s) => s.id === sourceId);
          const finalTargetIdx =
            shiftTargetIndex !== null
              ? shiftTargetIndex
              : targetIndex !== undefined && targetIndex !== -1
              ? targetIndex
              : dragOverPlotId || targetId
              ? storylines.findIndex((s) => s.id === (dragOverPlotId || targetId))
              : -1;

          if (sourceIdx !== -1 && finalTargetIdx !== -1 && sourceIdx !== finalTargetIdx) {
            const next = storylines.filter((s) => s.id !== sourceId);
            next.splice(finalTargetIdx, 0, storylines[sourceIdx]);
            onUpdateStorylines(next);
          }
        }
      }
    } catch (error) {
      console.error('Error reordering storyline:', error);
    } finally {
      dragStorylineIndex.current = null;
      dragStorylineNode.current = null;
      setDraggedStorylineId(null);
      setDragOverPlotId(null);
      setShiftTargetIndex(null);
    }
  };

  const handleStorylineDragEnd = () => {
    dragStorylineIndex.current = null;
    dragStorylineNode.current = null;
    setDraggedStorylineId(null);
    setDragOverPlotId(null);
    setShiftTargetIndex(null);
  };

  const handleOpenMarkerPopover = (
    e: React.MouseEvent,
    type: 'storyline' | 'character',
    itemId: string,
    sceneId: string
  ) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popoverWidth = 280;
    const popoverHeight = 220;

    let x = rect.left;
    let y = rect.bottom + 6;

    if (x + popoverWidth > window.innerWidth - 16) {
      x = window.innerWidth - popoverWidth - 16;
    }
    if (y + popoverHeight > window.innerHeight - 16) {
      y = rect.top - popoverHeight - 6;
    }

    setActivePopover({
      type,
      itemId,
      sceneId,
      x: Math.max(16, x),
      y: Math.max(16, y),
    });
  };

  // ---------------------------------------------------------------------------
  // Helper: Visual Plot State Badge
  // ---------------------------------------------------------------------------
  const renderPlotStateBadge = (
    st: StorylineItem,
    currentStatus: PlotStatus,
    sceneId: string,
    isInteractiveButton: boolean
  ) => {
    const theme = STORYLINE_COLOR_MAP[st.color] || STORYLINE_COLOR_MAP.emerald;
    const isDormant = currentStatus === 'Dormant';
    const isResolved = currentStatus === 'Resolved';

    let stateClasses = `${theme.bg} ${theme.border} ${theme.text}`;
    if (isDormant) {
      stateClasses = `${theme.bg} ${theme.border} ${theme.text} opacity-50 border-dashed`;
    } else if (isResolved) {
      stateClasses = `${theme.bg} ${theme.border} ${theme.text} opacity-60`;
    }

    const badgeContent = (
      <>
        {isResolved ? (
          <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
        ) : (
          <span
            className={`w-1.5 h-1.5 rounded-full ${theme.dot} ${
              isDormant ? 'opacity-50' : ''
            }`}
          />
        )}
        <span className={`truncate ${isResolved ? 'line-through' : ''}`}>
          {st.title}
        </span>
        {isDormant && (
          <span className="text-[8px] opacity-75 font-sans lowercase">
            (Dormant)
          </span>
        )}
        {isResolved && (
          <span className="text-[8px] opacity-75 font-sans lowercase">
            (Resolved)
          </span>
        )}
      </>
    );

    if (isInteractiveButton) {
      return (
        <button
          key={st.id}
          type="button"
          onClick={(e) => handleOpenMarkerPopover(e, 'storyline', st.id, sceneId)}
          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs border text-[9px] font-mono truncate max-w-[170px] cursor-pointer hover:brightness-110 transition ${stateClasses}`}
          title={`${st.title} (${currentStatus})`}
        >
          {badgeContent}
        </button>
      );
    }

    return (
      <span
        key={st.id}
        className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs border text-[9px] font-mono truncate max-w-[170px] ${stateClasses}`}
        title={`${st.title} (${currentStatus})`}
      >
        {badgeContent}
      </span>
    );
  };

  // ---------------------------------------------------------------------------
  // Chapter Lanes: Group Renderer
  // ---------------------------------------------------------------------------
  const renderLaneGroup = (group: ChapterGroup) => {
    const folderKey = group.folder ? group.folder.id : 'root';
    const folderTitle = group.folder ? group.folder.title : 'Root Scenes (No Chapter)';
    const isCollapsed = collapsedFolders[folderKey];

    // Empty folder check: Render ONLY the compact header as a structural divider without empty containers
    if (group.scenes.length === 0) {
      return (
        <div
          key={folderKey}
          className="bg-zinc-900/40 border border-zinc-800/60 rounded-xs px-2.5 py-1 flex items-center justify-between text-zinc-400 select-none"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-3.5 h-3.5 rounded-xs bg-amber-950/50 border border-amber-800/50 flex items-center justify-center text-amber-400 shrink-0">
              <Folder className="w-2 h-2" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-300 font-sans truncate">
              {folderTitle}
            </span>
            <span className="text-[9px] font-mono text-zinc-600">
              (Folder)
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={folderKey}
        className="bg-zinc-900/60 border border-zinc-800 rounded-sm overflow-hidden flex flex-col"
      >
        {/* Lane Header */}
        <div
          onClick={() => toggleFolder(folderKey)}
          className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80 cursor-pointer select-none hover:bg-zinc-850 transition"
        >
          <div className="flex items-center gap-2 min-w-0">
            <button type="button" className="text-zinc-400 hover:text-zinc-200 p-0.5">
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            <div className="w-4 h-4 rounded-xs bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400 shrink-0">
              <Folder className="w-2.5 h-2.5" />
            </div>
            <span className="text-xs font-semibold text-zinc-100 font-sans truncate">
              {folderTitle}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              ({group.scenes.length} {group.scenes.length === 1 ? 'scene' : 'scenes'})
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
            <span>{group.totalWords.toLocaleString()} words</span>
          </div>
        </div>

        {/* Lane Body: Horizontal Scenes */}
        {!isCollapsed && (
          <div className="overflow-x-auto p-2.5 flex items-stretch gap-2.5 bg-zinc-950/50">
            {group.scenes.map((scene, sIdx) => {
              const isActive = scene.id === activeChapterId;
              const isParticipating = !participatingScenesSet || participatingScenesSet.has(scene.id);
              const wordCount = sceneWordCountMap.get(scene.id) ?? 0;
              const markers = scene.markers || [];
              const attachedStorylineList = sceneAttachedStorylinesMap.get(scene.id) || [];
              const attachedCharacters = (scene.attachedCharacterIds || [])
                .map((id) => characterMap.get(id))
                .filter(Boolean) as CharacterItem[];

              return (
                <div
                  key={scene.id}
                  onClick={() => onSelectChapter(scene.id)}
                  style={{
                    width: manualSceneWidths[scene.id]
                      ? `${manualSceneWidths[scene.id]}px`
                      : 'calc(240px * var(--zoom-x))',
                    minWidth: manualSceneWidths[scene.id]
                      ? `${manualSceneWidths[scene.id]}px`
                      : 'calc(240px * var(--zoom-x))',
                  }}
                  className={`min-w-[240px] w-[calc(240px*var(--zoom-x))] shrink-0 rounded-sm border p-2.5 bg-zinc-900/90 shadow-xs cursor-pointer transition-colors duration-150 flex flex-col justify-between gap-2 select-none relative ${
                    !isParticipating ? 'opacity-35' : ''
                  } ${
                    isActive
                      ? 'border-zinc-300 ring-1 ring-zinc-300/40 bg-zinc-850'
                      : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 pb-1 border-b border-zinc-800/80">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400 font-bold">
                        #{sIdx + 1}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider truncate">
                        {scene.status || 'Draft'}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500">
                      {wordCount.toLocaleString()}w
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-zinc-400 shrink-0" />
                      <h4
                        className="text-xs font-semibold text-zinc-100 truncate"
                        title={scene.title}
                      >
                        {scene.title || 'Untitled Scene'}
                      </h4>
                    </div>
                    {scene.synopsis && (
                      <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {scene.synopsis}
                      </p>
                    )}
                  </div>

                  {markers.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {markers.map((marker) => {
                        const colorConf =
                          MARKER_COLOR_CONFIG[marker.color] || MARKER_COLOR_CONFIG.zinc;
                        return (
                          <button
                            key={marker.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMarkerPopover((prev) =>
                                prev?.sceneId === scene.id && prev?.markerId === marker.id
                                  ? null
                                  : { sceneId: scene.id, markerId: marker.id }
                              );
                            }}
                            className={`flex items-center gap-1 px-1.5 py-0.2 rounded-xs border text-[9px] font-mono transition cursor-pointer select-none ${colorConf.badgeBg} ${colorConf.badgeBorder} ${colorConf.badgeText}`}
                            title={marker.title}
                          >
                            {renderMarkerIcon(marker.icon, 'w-2 h-2 shrink-0')}
                            <span className="truncate max-w-[70px]">{marker.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Attached Storyline Plot Badges with visual status indication */}
                  <div className="space-y-1 pt-1 border-t border-zinc-800/60">
                    {attachedStorylineList.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {attachedStorylineList.map(({ storyline: st, status: currentStatus }) =>
                          renderPlotStateBadge(st, currentStatus, scene.id, true)
                        )}
                      </div>
                    )}

                    {attachedCharacters.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {attachedCharacters.slice(0, 3).map((ch) => (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={(e) =>
                              handleOpenMarkerPopover(e, 'character', ch.id, scene.id)
                            }
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                          >
                            {ch.name}
                          </button>
                        ))}
                        {attachedCharacters.length > 3 && (
                          <span className="text-[9px] font-mono text-zinc-600">
                            +{attachedCharacters.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                    <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-zinc-850/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddMarker(scene.id);
                      }}
                      className="flex items-center gap-0.5 px-1 py-0.5 rounded-xs border border-zinc-850 hover:border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300 text-[8px] font-mono transition cursor-pointer max-w-full"
                      title="Add key event milestone or alert to this scene"
                    >
                      <Plus className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{t('alert')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenAttachDropdown(
                          openAttachDropdown?.sceneId === scene.id &&
                            openAttachDropdown?.type === 'storyline'
                            ? null
                            : { sceneId: scene.id, type: 'storyline' }
                        );
                      }}
                      className="flex items-center gap-0.5 px-1 py-0.5 rounded-xs border border-zinc-850 hover:border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300 text-[8px] font-mono transition cursor-pointer max-w-full"
                      title="Attach plot thread to scene"
                    >
                      <Plus className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{t('dockStoriesShort')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenAttachDropdown(
                          openAttachDropdown?.sceneId === scene.id &&
                            openAttachDropdown?.type === 'character'
                            ? null
                            : { sceneId: scene.id, type: 'character' }
                        );
                      }}
                      className="flex items-center gap-0.5 px-1 py-0.5 rounded-xs border border-zinc-850 hover:border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300 text-[8px] font-mono transition cursor-pointer max-w-full"
                      title="Attach character to scene"
                    >
                      <Plus className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{t('dockCastShort')}</span>
                    </button>

                    {openAttachDropdown?.sceneId === scene.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="attach-dropdown-menu absolute bottom-full mb-1 left-2 z-50 w-48 rounded-sm bg-zinc-950 border border-zinc-800 shadow-2xl py-1 text-xs"
                      >
                        <div className="px-2 py-0.5 text-[8px] font-mono text-zinc-500 uppercase border-b border-zinc-850 flex items-center justify-between">
                          <span>{t('link')} {openAttachDropdown.type === 'character' ? t('dockCastShort') : t('dockStoriesShort')}</span>
                          <button
                            type="button"
                            onClick={() => setOpenAttachDropdown(null)}
                            className="text-zinc-500 hover:text-zinc-200"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {openAttachDropdown.type === 'character' ? (
                            characters.length === 0 ? (
                              <div className="px-2 py-1 text-[10px] text-zinc-500 italic">
                                {t('noCharactersYet')}
                              </div>
                            ) : (
                              characters.map((ch) => (
                                <button
                                  key={ch.id}
                                  type="button"
                                  onClick={() => handleAttachCharacter(scene.id, ch.id)}
                                  className="w-full text-left px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Users className="w-2.5 h-2.5 text-zinc-500" />
                                  <span className="truncate">{ch.name}</span>
                                </button>
                              ))
                            )
                          ) : storylines.length === 0 ? (
                            <div className="px-2 py-1 text-[10px] text-zinc-500 italic">
                              {t('noStorylinesYet')}
                            </div>
                          ) : (
                            storylines.map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => handleAttachStoryline(scene.id, st.id)}
                                className="w-full text-left px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center gap-1.5 cursor-pointer"
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    STORYLINE_COLOR_MAP[st.color]?.dot || 'bg-blue-400'
                                  }`}
                                />
                                <span className="truncate">{st.title}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Drag Resizer Handle on right border */}
                  <div
                    onPointerDown={(e) => handleSceneResizeStart(e, scene.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-zinc-500/40 active:bg-zinc-400/60 transition-colors z-30 group flex items-center justify-center select-none"
                    title="Drag to resize scene width"
                  >
                    <div className="w-0.5 h-6 bg-zinc-700/60 group-hover:bg-zinc-300 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Subway Map Swimlane Component (Hybrid Subway Map + Collapsible Swimlanes)
  // ---------------------------------------------------------------------------
  const renderSubwaySwimlanes = () => {
    if (scenes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 gap-2">
          <Clock className="w-8 h-8 text-zinc-600" />
          <p className="text-xs font-medium text-zinc-400">{t('noScenesInOutline')}</p>
        </div>
      );
    }

    // Live display storylines: shifts naturally in 'shift' mode, stays in place in 'swap' mode
    const visibleStorylines = displayStorylines;

    return (
      <div
        ref={timelineContainerRef}
        className="flex-1 overflow-auto bg-zinc-950 font-sans relative"
        style={{
          '--zoom-x': zoomX,
          '--zoom-y': zoomY,
          '--scene-width': `${Math.round(240 * zoomX)}px`,
          '--track-height': `${Math.round(60 * zoomY)}px`,
        } as React.CSSProperties}
      >
        <div className="inline-block min-w-full align-top">
          {/* HEADER ROW: TOP-LEFT CORNER + CHRONOLOGICAL SCENE COLUMNS (X-Axis) */}
          <div className="flex sticky top-0 z-40 bg-zinc-950 border-b border-zinc-800 shadow-xs">
            {/* Corner Cell: Storylines Header & Gap Toggle */}
            <div className="w-64 min-w-[16rem] sticky left-0 z-45 bg-zinc-950/95 backdrop-blur-md border-r border-zinc-850 p-2 flex flex-col justify-between shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <GitMerge className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t('storylineTracks')}</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {storylines.length} {storylines.length === 1 ? t('track') : t('tracks')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-zinc-850/70 mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const allCollapsed = storylines.every((s) => collapsedStorylines[s.id]);
                    if (allCollapsed) {
                      setCollapsedStorylines({});
                    } else {
                      const next: Record<string, boolean> = {};
                      storylines.forEach((s) => {
                        next[s.id] = true;
                      });
                      setCollapsedStorylines(next);
                    }
                  }}
                  className="text-[9px] font-mono text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                >
                  {storylines.every((s) => collapsedStorylines[s.id])
                    ? t('expandAllTracks')
                    : t('collapseAllTracks')}
                </button>
              </div>
            </div>

            {/* X-Axis Columns: Chronological Scene Headers & Collapsed Gaps */}
            <div className="flex items-stretch divide-x divide-zinc-850/60">
              {timelineColumns.map((colItem) => {

                const { scene, originalIndex } = colItem;
                const isActive = scene.id === activeChapterId;
                const isParticipating = !participatingScenesSet || participatingScenesSet.has(scene.id);
                const wordCount = sceneWordCountMap.get(scene.id) ?? 0;
                const markers = scene.markers || [];
                const attachedStorylineList = sceneAttachedStorylinesMap.get(scene.id) || [];
                const attachedCharacters = (scene.attachedCharacterIds || [])
                  .map((id) => characterMap.get(id))
                  .filter(Boolean) as CharacterItem[];

                const isAttachOpen = Boolean(openAttachDropdown && openAttachDropdown.sceneId === scene.id);

                return (
                  <div
                    key={scene.id}
                    onClick={() => onSelectChapter(scene.id)}
                    style={{
                      width: manualSceneWidths[scene.id]
                        ? `${manualSceneWidths[scene.id]}px`
                        : 'var(--scene-width)',
                      minWidth: manualSceneWidths[scene.id]
                        ? `${manualSceneWidths[scene.id]}px`
                        : 'var(--scene-width)',
                      maxWidth: manualSceneWidths[scene.id]
                        ? `${manualSceneWidths[scene.id]}px`
                        : 'var(--scene-width)',
                      contentVisibility: 'auto',
                      containIntrinsicSize: 'auto var(--scene-width) 220px',
                    }}
                    className={`p-2 flex flex-col justify-between gap-1.5 shrink-0 select-none cursor-pointer relative bg-zinc-900/60 hover:bg-zinc-850/60 ${
                      isAttachOpen ? 'z-40' : 'z-0'
                    } ${
                      !isParticipating ? 'opacity-35' : ''
                    }`}
                  >
                    <div
                      className={`rounded-sm border p-2 flex flex-col justify-between max-h-[300px] transition-colors duration-150 ${
                        isActive
                          ? 'border-zinc-300 ring-1 ring-zinc-300/40 bg-zinc-850 shadow-md'
                          : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                      }`}
                    >
                      {/* Scrollable Card Body: Content, Markers, Characters & Plots */}
                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 pr-0.5">
                        {/* Top Meta Header */}
                        <div className="flex items-center justify-between gap-1 pb-1 border-b border-zinc-800/80">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400 font-bold">
                              #{originalIndex + 1}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider truncate">
                              {getTimelineStatusLabel(scene.status)}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500">
                            {wordCount.toLocaleString()}w
                          </span>
                        </div>

                        {/* Scene Title & Synopsis */}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-zinc-400 shrink-0" />
                            <h4
                              className="text-xs font-semibold text-zinc-100 truncate"
                              title={scene.title}
                            >
                              {scene.title || 'Untitled Scene'}
                            </h4>
                          </div>
                          {scene.synopsis && (
                            <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                              {scene.synopsis}
                            </p>
                          )}
                        </div>

                        {/* Markers Badges */}
                        {markers.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {markers.map((marker: TimelineMarker) => {
                              const colorConf =
                                MARKER_COLOR_CONFIG[marker.color] || MARKER_COLOR_CONFIG.zinc;
                              return (
                                <button
                                  key={marker.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMarkerPopover((prev) =>
                                      prev?.sceneId === scene.id && prev?.markerId === marker.id
                                        ? null
                                        : { sceneId: scene.id, markerId: marker.id }
                                    );
                                  }}
                                  className={`flex items-center gap-1 px-1.5 py-0.2 rounded-xs border text-[9px] font-mono transition cursor-pointer select-none ${colorConf.badgeBg} ${colorConf.badgeBorder} ${colorConf.badgeText}`}
                                  title={marker.title}
                                >
                                  {renderMarkerIcon(marker.icon, 'w-2 h-2 shrink-0')}
                                  <span className="truncate max-w-[80px]">{marker.title}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Attached Cast / Characters Row */}
                        {attachedCharacters.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5 overflow-hidden">
                            {attachedCharacters.map((ch) => (
                              <button
                                key={ch.id}
                                type="button"
                                onClick={(e) =>
                                  handleOpenMarkerPopover(e, 'character', ch.id, scene.id)
                                }
                                className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer max-w-full truncate"
                              >
                                <span className="truncate">{ch.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Attached Plot Thread Badges with visual status indication */}
                        {attachedStorylineList.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5 overflow-hidden">
                            {attachedStorylineList.map(({ storyline: st, status: currentStatus }) =>
                              renderPlotStateBadge(st, currentStatus, scene.id, false)
                            )}
                          </div>
                        )}
                      </div>

                      {/* Internal Card Footer: Add Alert / Plot / Cast */}
                      <div className="flex flex-wrap gap-1 items-center pt-1.5 mt-1 border-t border-zinc-850/70 relative shrink-0 overflow-hidden">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddMarker(scene.id);
                          }}
                          className="flex items-center gap-0.5 px-1 py-0.5 rounded-xs border border-zinc-850 hover:border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300 text-[8px] font-mono transition cursor-pointer max-w-full"
                          title="Add key event milestone or alert to this scene"
                        >
                          <Plus className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">Alert</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenAttachDropdown(
                              openAttachDropdown?.sceneId === scene.id &&
                                openAttachDropdown?.type === 'storyline'
                                ? null
                                : { sceneId: scene.id, type: 'storyline' }
                            );
                          }}
                          className="flex items-center gap-0.5 px-1 py-0.5 rounded-xs border border-zinc-850 hover:border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300 text-[8px] font-mono transition cursor-pointer max-w-full"
                          title="Attach plot thread to scene"
                        >
                          <Plus className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">Plot</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenAttachDropdown(
                              openAttachDropdown?.sceneId === scene.id &&
                                openAttachDropdown?.type === 'character'
                                ? null
                                : { sceneId: scene.id, type: 'character' }
                            );
                          }}
                          className="flex items-center gap-0.5 px-1 py-0.5 rounded-xs border border-zinc-850 hover:border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300 text-[8px] font-mono transition cursor-pointer max-w-full"
                          title="Attach character to scene"
                        >
                          <Plus className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">Cast</span>
                        </button>

                        {openAttachDropdown && openAttachDropdown.sceneId === scene.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="attach-dropdown-menu absolute bottom-full mb-1.5 left-0 z-50 w-52 rounded-sm bg-zinc-950 border border-zinc-800 shadow-2xl py-1 text-xs"
                          >
                            <div className="px-2 py-0.5 text-[8px] font-mono text-zinc-500 uppercase border-b border-zinc-850 flex items-center justify-between">
                              <span>Attach {openAttachDropdown.type === 'character' ? 'Cast' : 'Plot'}</span>
                              <button
                                type="button"
                                onClick={() => setOpenAttachDropdown(null)}
                                className="text-zinc-500 hover:text-zinc-200"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {openAttachDropdown.type === 'character' ? (
                                characters.length === 0 ? (
                                  <div className="px-2 py-1 text-[10px] text-zinc-500 italic">
                                    No characters available
                                  </div>
                                ) : (
                                  characters.map((ch) => (
                                    <button
                                      key={ch.id}
                                      type="button"
                                      onClick={() => handleAttachCharacter(scene.id, ch.id)}
                                      className="w-full text-left px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Users className="w-2.5 h-2.5 text-zinc-500" />
                                      <span className="truncate">{ch.name}</span>
                                    </button>
                                  ))
                                )
                              ) : storylines.length === 0 ? (
                                <div className="px-2 py-1 text-[10px] text-zinc-500 italic">
                                  No plot threads available
                                </div>
                              ) : (
                                storylines.map((st) => (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => handleAttachStoryline(scene.id, st.id)}
                                    className="w-full text-left px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        STORYLINE_COLOR_MAP[st.color]?.dot || 'bg-blue-400'
                                      }`}
                                    />
                                    <span className="truncate">{st.title}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Drag Resizer Handle on right border */}
                    <div
                      onPointerDown={(e) => handleSceneResizeStart(e, scene.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-zinc-500/40 active:bg-zinc-400/60 transition-colors z-30 group flex items-center justify-center select-none"
                      title="Drag to resize scene width"
                    >
                      <div className="w-0.5 h-6 bg-zinc-700/60 group-hover:bg-zinc-300 rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SWIMLANE ROWS (Y-Axis): ALL STORYLINES (Expanded by default, collapsible per lane) */}
          <div
            ref={swimlanesContainerRef}
            onDragOver={handleSwimlanesDragOver}
            onDrop={(e) => handleStorylineDrop(e, shiftTargetIndex ?? 0, '')}
            className="divide-y divide-zinc-850/60"
          >
            {visibleStorylines.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs italic">
                No plot threads found in this project.
              </div>
            ) : (() => {
              const isShiftMode = timelineDropMode === 'shift';
              const isDraggingAny = draggedStorylineId !== null;
              const sourceIndex =
                dragStorylineIndex.current ??
                (draggedStorylineId ? storylines.findIndex((s) => s.id === draggedStorylineId) : -1);

              const rowHeights = isShiftMode ? visibleStorylines.map((s) => getRowHeight(s.id)) : [];
              const draggedRowHeight = sourceIndex !== -1 && rowHeights[sourceIndex] !== undefined ? rowHeights[sourceIndex] : 0;

              let draggedTargetOffset = 0;
              if (isShiftMode && isDraggingAny && sourceIndex !== -1 && shiftTargetIndex !== null) {
                if (sourceIndex < shiftTargetIndex) {
                  for (let i = sourceIndex + 1; i <= shiftTargetIndex; i++) {
                    draggedTargetOffset += rowHeights[i] ?? 0;
                  }
                } else if (sourceIndex > shiftTargetIndex) {
                  for (let i = shiftTargetIndex; i < sourceIndex; i++) {
                    draggedTargetOffset -= rowHeights[i] ?? 0;
                  }
                }
              }

              return visibleStorylines.map((st, index) => {
                const theme = STORYLINE_COLOR_MAP[st.color] || STORYLINE_COLOR_MAP.emerald;
                const isLaneCollapsed = Boolean(collapsedStorylines[st.id]);
                const isFilterActive = selectedStorylineFilter !== 'all';
                const isSelectedTrack = selectedStorylineFilter === st.id;

                const spanInfo = storylineSpanMap.get(st.id) || { firstActiveIdx: -1, lastActiveIdx: -1, count: 0 };
                const firstActiveIdx = spanInfo.firstActiveIdx;
                const lastActiveIdx = spanInfo.lastActiveIdx;

                const isDraggingThis = draggedStorylineId === st.id;
                const isDragOverThis =
                  dragOverPlotId === st.id &&
                  draggedStorylineId !== null &&
                  draggedStorylineId !== st.id;

                let rowTranslateY = 0;
                if (isShiftMode && isDraggingAny && sourceIndex !== -1 && shiftTargetIndex !== null) {
                  if (index === sourceIndex) {
                    rowTranslateY = draggedTargetOffset;
                  } else if (sourceIndex < shiftTargetIndex && index > sourceIndex && index <= shiftTargetIndex) {
                    rowTranslateY = -draggedRowHeight;
                  } else if (sourceIndex > shiftTargetIndex && index >= shiftTargetIndex && index < sourceIndex) {
                    rowTranslateY = draggedRowHeight;
                  }
                }

                const floatingRowClass = isDragOverThis
                  ? 'bg-zinc-900/40 z-20'
                  : '';

                const floatingHeaderClass =
                  !isShiftMode && isDragOverThis
                    ? 'translate-x-2 border-l-2 border-emerald-400 bg-zinc-900/95 shadow-md shadow-black/50 z-30'
                    : isShiftMode && isDraggingThis && shiftTargetIndex !== null && shiftTargetIndex !== sourceIndex
                    ? 'translate-x-2 border-l-2 border-emerald-400 bg-zinc-900/95 shadow-lg shadow-black/60 z-30'
                    : '';

                return (
                  <div
                    key={st.id}
                    ref={(el) => registerTrack(st.id, el)}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      handleStorylineDragEnter(e, index, st.id);
                    }}
                    onDragOver={(e) => {
                      handleStorylineDragOver(e, st.id);
                    }}
                    onDragLeave={handleStorylineDragLeave}
                    onDrop={(e) => handleStorylineDrop(e, index, st.id)}
                    style={{
                      transform: rowTranslateY ? `translate3d(0, ${rowTranslateY}px, 0)` : undefined,
                      transition: isDraggingAny && isShiftMode ? 'transform 220ms cubic-bezier(0.2, 0.9, 0.25, 1)' : undefined,
                      willChange: isDraggingAny && isShiftMode ? 'transform' : undefined,
                      contain: 'layout style',
                    }}
                    className={`flex items-stretch hover:bg-zinc-900/20 group relative transition-colors duration-150 ${
                      isFilterActive && !isSelectedTrack ? 'opacity-40' : 'opacity-100'
                    } ${
                      isDraggingThis
                        ? 'opacity-40 bg-zinc-900/40 border border-dashed border-zinc-700/80 rounded-xs z-30'
                        : ''
                    } ${floatingRowClass}`}
                  >
                    {/* Storyline Swimlane Left Header (Sticky & Draggable from anywhere on card except chevron) */}
                    <div
                      draggable={true}
                      onDragStart={(e) => handleStorylineDragStart(e, index, st.id)}
                      onDragEnd={handleStorylineDragEnd}
                      style={{
                        height: isLaneCollapsed
                          ? '34px'
                          : plotHeights[st.id]
                          ? `${plotHeights[st.id]}px`
                          : 'var(--track-height)',
                      }}
                      className={`w-64 min-w-[16rem] sticky left-0 z-30 bg-zinc-950/95 backdrop-blur-md border-r border-zinc-850 border-l-2 border-transparent p-2.5 flex flex-col justify-between shrink-0 shadow-xs cursor-grab active:cursor-grabbing select-none transition-transform duration-150 ease-out ${
                        isDraggingThis
                          ? 'opacity-20'
                          : floatingHeaderClass
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 min-w-0 pointer-events-none">
                        <div className="flex items-center gap-1 min-w-0 pointer-events-none">
                          <GripVertical className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition shrink-0 pointer-events-none" />
                          <button
                            type="button"
                            tabIndex={0}
                            draggable={false}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCollapsedStorylines((prev) => ({
                                ...prev,
                                [st.id]: !prev[st.id],
                              }));
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="p-0.5 text-zinc-500 hover:text-zinc-200 transition cursor-pointer rounded-xs hover:bg-zinc-800 shrink-0 pointer-events-auto"
                            title={isLaneCollapsed ? 'Expand storyline track' : 'Collapse storyline track'}
                          >
                            {isLaneCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5 pointer-events-none" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 pointer-events-none" />
                            )}
                          </button>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs pointer-events-none"
                            style={{ backgroundColor: theme.stroke }}
                          />
                          <h4 className="text-xs font-semibold text-zinc-100 truncate font-sans pointer-events-none">
                            {st.title}
                          </h4>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500 shrink-0 pointer-events-none">
                          {spanInfo.count} {spanInfo.count === 1 ? 'stop' : 'stops'}
                        </span>
                      </div>

                      {!isLaneCollapsed && st.description && (
                        <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5 leading-relaxed pointer-events-none">
                          {st.description}
                        </p>
                      )}
                    </div>

                    {/* Storyline Swimlane Subway Track Area */}
                    <div className={`flex items-stretch divide-x divide-zinc-850/40 relative ${draggedStorylineId ? 'pointer-events-none' : ''}`}>
                      {timelineColumns.map((colItem) => {

                        const { scene, originalIndex } = colItem;
                        const station = stationMap.get(`${st.id}:${scene.id}`);
                        const isStationActive = station?.isStationActive ?? false;
                        const currentStatus: PlotStatus = station?.currentStatus ?? 'Active';

                        const isTrackSpan =
                          firstActiveIdx !== -1 &&
                          originalIndex >= firstActiveIdx &&
                          originalIndex <= lastActiveIdx;

                        return (
                          <div
                            key={scene.id}
                            style={{
                              width: manualSceneWidths[scene.id]
                                ? `${manualSceneWidths[scene.id]}px`
                                : 'var(--scene-width)',
                              minWidth: manualSceneWidths[scene.id]
                                ? `${manualSceneWidths[scene.id]}px`
                                : 'var(--scene-width)',
                              maxWidth: manualSceneWidths[scene.id]
                                ? `${manualSceneWidths[scene.id]}px`
                                : 'var(--scene-width)',
                              height: isLaneCollapsed
                                ? '34px'
                                : plotHeights[st.id]
                                ? `${plotHeights[st.id]}px`
                                : 'var(--track-height)',
                              contentVisibility: 'auto',
                              containIntrinsicSize: 'auto var(--scene-width) var(--track-height)',
                            }}
                            className="flex items-center justify-center relative shrink-0"
                          >
                            {/* Horizontal Track Line */}
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10">
                              {isTrackSpan ? (
                                <div
                                  className="h-1 w-full rounded-full transition-opacity"
                                  style={{
                                    backgroundColor: theme.stroke,
                                    opacity: isStationActive ? 0.9 : 0.35,
                                  }}
                                />
                              ) : (
                                <div className="h-px w-full border-t border-dashed border-zinc-800/80" />
                              )}
                            </div>

                            {/* Subway Station Node */}
                            {isStationActive && (
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleOpenMarkerPopover(e, 'storyline', st.id, scene.id)
                                }
                                aria-label={`${st.title} at ${scene.title} (${currentStatus})`}
                                title={`${st.title} · ${scene.title} (${currentStatus})\nClick for plot details and actions`}
                                className={`relative z-20 w-6 h-6 rounded-full bg-zinc-950 border-2 flex items-center justify-center shadow-lg transition-transform hover:scale-125 cursor-pointer ${
                                  currentStatus === 'Dormant'
                                    ? 'opacity-60 border-dashed'
                                    : currentStatus === 'Resolved'
                                    ? 'opacity-70'
                                    : ''
                                }`}
                                style={{
                                  borderColor: theme.stroke,
                                }}
                              >
                                {currentStatus === 'Resolved' ? (
                                  <Check
                                    className="w-3 h-3 text-emerald-400"
                                  />
                                ) : currentStatus === 'Dormant' ? (
                                  <Circle
                                    className="w-2 h-2 opacity-50"
                                    style={{ color: theme.stroke }}
                                  />
                                ) : (
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: theme.stroke }}
                                  />
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Drag Resizer Handle on bottom border */}
                    {!isLaneCollapsed && (
                      <div
                        onPointerDown={(e) => handlePlotResizeStart(e, st.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 right-0 bottom-0 h-2 cursor-row-resize hover:bg-zinc-500/40 active:bg-zinc-400/60 transition-colors z-30 group/resizer flex items-center justify-center select-none"
                        title="Drag to resize plot track height"
                      >
                        <div className="h-0.5 w-16 bg-zinc-700/60 group-hover/resizer:bg-zinc-300 rounded-full" />
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full select-none overflow-hidden bg-zinc-950 font-sans relative">
      {/* ------------------------------------------------------------------- */}
      {/* ULTRA-COMPACT TOOLBAR (Single horizontal row, py-1, gap-1.5, max-w) */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-850 bg-zinc-900/70 shrink-0 relative z-50 gap-1.5 min-w-0">
        {/* Left: Mode Switcher & Independent Zoom X / Y Controls */}
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xs p-0.5">
            <button
              type="button"
              onClick={() => setLayoutMode('subway')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-medium transition cursor-pointer ${
                layoutMode === 'subway'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title={t('subwayMapTooltip')}
            >
              <GitMerge className="w-2.5 h-2.5" />
              <span>{t('subwayMap')}</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('lanes')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-medium transition cursor-pointer ${
                layoutMode === 'lanes'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title={t('chapterLanesTooltip')}
            >
              <Columns className="w-2.5 h-2.5" />
              <span>{t('chapterLanes')}</span>
            </button>
          </div>

          {/* Independent Zoom Controls (Subway Map only) */}
          {layoutMode === 'subway' && (
            <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-xs px-2 py-0.5 select-none">
              <span className="text-zinc-500 font-semibold">{t('zoom')}</span>
              {/* Zoom X */}
              <div className="flex items-center gap-1" title={t('zoomXTooltip')}>
                <span className="text-zinc-400 font-bold">X</span>
                <input
                  ref={sliderXRef}
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  defaultValue={zoomX}
                  onInput={(e) => handleZoomXChange(Number((e.target as HTMLInputElement).value))}
                  onChange={(e) => handleZoomXChange(Number((e.target as HTMLInputElement).value))}
                  className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-300"
                />
                <span ref={percentXRef} className="w-7 text-right">{Math.round(zoomX * 100)}%</span>
              </div>
              <span className="text-zinc-800">|</span>
              {/* Zoom Y */}
              <div className="flex items-center gap-1" title={t('zoomYTooltip')}>
                <span className="text-zinc-400 font-bold">Y</span>
                <input
                  ref={sliderYRef}
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  defaultValue={zoomY}
                  onInput={(e) => handleZoomYChange(Number((e.target as HTMLInputElement).value))}
                  onChange={(e) => handleZoomYChange(Number((e.target as HTMLInputElement).value))}
                  className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-300"
                />
                <span ref={percentYRef} className="w-7 text-right">{Math.round(zoomY * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Independent Filters (No extra text labels, wider plot select, text-[10px]) */}
        <div className="flex items-center gap-1.5 shrink-0 relative z-50">
          {storylines.length > 0 && (
            <div className="flex items-center gap-0.5">
              <GitMerge className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
              <select
                value={selectedStorylineFilter}
                onChange={(e) => setSelectedStorylineFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xs px-2 py-0.5 text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-600 w-48 min-w-[12rem] truncate cursor-pointer font-sans"
              >
                <option value="all">{t('allPlotsAndStorylines')}</option>
                {storylines.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {characters.length > 0 && (
            <div className="flex items-center gap-0.5">
              <Users className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
              <select
                value={selectedCharacterFilter}
                onChange={(e) => setSelectedCharacterFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xs px-1.5 py-0.5 text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-600 max-w-[120px] truncate cursor-pointer font-sans"
              >
                <option value="all">{t('allCast')}</option>
                {characters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MAIN VIEWPORT: SUBWAY MAP SWIMLANES vs CHAPTER LANES                */}
      {/* ------------------------------------------------------------------- */}
      {layoutMode === 'subway' ? (
        renderSubwaySwimlanes()
      ) : (
        /* CHAPTER LANES CONTAINER */
        <div
          data-testid="timeline-canvas"
          className="flex-1 overflow-y-auto bg-zinc-950 p-2.5 space-y-2.5"
          style={{ '--zoom-x': zoomX, '--zoom-y': zoomY } as React.CSSProperties}
        >
          {chapterGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 gap-2 py-12">
              <Clock className="w-7 h-7 text-zinc-600" />
              <p className="text-xs font-medium text-zinc-400">{t('noChaptersOrScenes')}</p>
            </div>
          ) : (
            chapterGroups.map(renderLaneGroup)
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* FLOATING DETAIL POPOVER FOR STORYLINES & CHARACTERS (z-50)          */}
      {/* ------------------------------------------------------------------- */}
      {activePopover && (
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: `${activePopover.x}px`,
            top: `${activePopover.y}px`,
          }}
          className="w-72 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl p-3 z-50 text-xs text-zinc-300 font-sans animate-in fade-in zoom-in-95 duration-100 select-none"
        >
          {activePopover.type === 'storyline' && popoverStoryline && (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2 border-b border-zinc-850 pb-1.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        STORYLINE_COLOR_MAP[popoverStoryline.color]?.dot || 'bg-blue-400'
                      }`}
                    />
                    <h5 className="font-semibold text-zinc-100 text-xs truncate">
                      {popoverStoryline.title}
                    </h5>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mt-0.5">
                    {t('plotThread')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePopover(null)}
                  className="p-0.5 text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/50 p-2 rounded-xs border border-zinc-850/80">
                {popoverStoryline.description || t('noDescriptionPlot')}
              </div>

              {popoverStoryline.fields && popoverStoryline.fields.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-zinc-850">
                  {popoverStoryline.fields.map((f) => (
                    <div key={f.id} className="text-[10px]">
                      <span className="font-mono text-zinc-500">{f.label}: </span>
                      <span className="text-zinc-300">{f.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-1.5 border-t border-zinc-850 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    handleDetachStoryline(activePopover.sceneId, popoverStoryline.id)
                  }
                  className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-xs hover:bg-zinc-900 transition cursor-pointer"
                >
                  {t('detachFromScene')}
                </button>
              </div>
            </div>
          )}

          {activePopover.type === 'character' && popoverCharacter && (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2 border-b border-zinc-850 pb-1.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <h5 className="font-semibold text-zinc-100 text-xs truncate">
                      {popoverCharacter.name}
                    </h5>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mt-0.5">
                    {t('role')}: {getRoleLabel(popoverCharacter.role, t)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePopover(null)}
                  className="p-0.5 text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/50 p-2 rounded-xs border border-zinc-850/80">
                {popoverCharacter.summary || t('noSummaryCharacter')}
              </div>

              <div className="pt-1.5 border-t border-zinc-850 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    handleDetachCharacter(activePopover.sceneId, popoverCharacter.id)
                  }
                  className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-xs hover:bg-zinc-900 transition cursor-pointer"
                >
                  {t('detachFromScene')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* FLOATING KEY EVENT MARKER POPOVER (z-50)                            */}
      {/* ------------------------------------------------------------------- */}
      {activeMarkerPopover && (() => {
        const targetScene = chapters.find((c) => c.id === activeMarkerPopover.sceneId);
        const marker = targetScene?.markers?.find((m) => m.id === activeMarkerPopover.markerId);
        if (!marker || !targetScene) return null;

        return (
          <div
            ref={markerPopoverRef}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <div className="w-80 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl p-3 text-xs text-zinc-300 font-sans animate-in fade-in zoom-in-95 duration-100 select-none">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <span
                    className="p-1 rounded-xs"
                    style={{
                      backgroundColor: `${MARKER_COLOR_CONFIG[marker.color]?.hex || '#f43f5e'}20`,
                      color: MARKER_COLOR_CONFIG[marker.color]?.hex || '#f43f5e',
                    }}
                  >
                    {renderMarkerIcon(marker.icon, 'w-3.5 h-3.5')}
                  </span>
                  <span className="font-semibold text-zinc-200 text-xs">{t('eventMarker')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMarkerPopover(null)}
                  className="text-zinc-500 hover:text-zinc-200 transition p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title Input */}
              <div className="space-y-1 mb-2.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                  {t('eventTitle')}
                </label>
                <input
                  type="text"
                  value={marker.title}
                  onChange={(e) =>
                    handleUpdateMarker(targetScene.id, marker.id, { title: e.target.value })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-sans"
                  placeholder={t('eventTitlePlaceholder')}
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1 mb-2.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                  {t('notes')} / {t('description')}
                </label>
                <textarea
                  value={marker.description || ''}
                  onChange={(e) =>
                    handleUpdateMarker(targetScene.id, marker.id, { description: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 font-sans resize-none"
                  placeholder={t('eventDescPlaceholder')}
                />
              </div>

              {/* Color Selector */}
              <div className="space-y-1 mb-2.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                  {t('severityColor')}
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {MARKER_COLORS.map((col) => {
                    const cConfig = MARKER_COLOR_CONFIG[col];
                    const isSelected = marker.color === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => handleUpdateMarker(targetScene.id, marker.id, { color: col })}
                        aria-label={`Color: ${col}`}
                        className={`h-5 rounded-xs border transition cursor-pointer flex items-center justify-center ${
                          isSelected ? 'ring-1 ring-zinc-100 scale-105' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: `${cConfig.hex}30`,
                          borderColor: cConfig.hex,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cConfig.hex }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Selector */}
              <div className="space-y-1 mb-3">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                  {t('icon')}
                </label>
                <div className="flex items-center gap-1">
                  {MARKER_ICONS.map((ic) => {
                    const isSelected = marker.icon === ic.id;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => handleUpdateMarker(targetScene.id, marker.id, { icon: ic.id })}
                        className={`flex-1 flex items-center justify-center py-1 rounded-xs border transition cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-800 border-zinc-600 text-white'
                            : 'bg-zinc-900/60 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={ic.label}
                      >
                        {renderMarkerIcon(ic.id, 'w-3 h-3')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Popover Footer: Delete & Close */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => handleDeleteMarker(targetScene.id, marker.id)}
                  className="flex items-center gap-1 text-[10px] font-mono text-rose-400 hover:text-rose-300 transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t('deleteMarker')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMarkerPopover(null)}
                  className="px-2.5 py-0.5 rounded-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-medium transition cursor-pointer"
                >
                  {t('done')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default memo(TimelineViewComponent);
