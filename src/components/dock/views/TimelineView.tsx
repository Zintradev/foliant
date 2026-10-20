import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Clock,
  GitMerge,
  Users,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  GripHorizontal,
  AlertTriangle,
  Star,
  Flag,
  Skull,
  Bookmark,
  Trash2,
} from 'lucide-react';
import { TextNode } from '../../../types/project';
import {
  StorylineItem,
  CharacterItem,
  StorylineColor,
  TimelineMarker,
  TimelineMarkerIcon,
  TimelineMarkerColor,
} from '../../../types/dock';

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

interface CardPosition {
  x: number;
  y: number;
}

interface PanOffset {
  x: number;
  y: number;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3.0;

function countWords(content: string): number {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

const STORYLINE_COLOR_MAP: Record<
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

// ---------------------------------------------------------------------------
// Key Event Marker Visual Configurations
// ---------------------------------------------------------------------------

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
    badgeHoverBg: 'hover:bg-zinc-850',
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

export default function TimelineView({
  chapters,
  storylines,
  characters,
  activeChapterId,
  onSelectChapter,
  onUpdateChapter,
  onUpdateStorylines,
  isExpanded = false,
}: TimelineViewProps) {
  // Ordered sequence of scenes
  const scenes = useMemo(
    () => chapters.filter((c) => c.type === 'scene'),
    [chapters]
  );

  // ---------------------------------------------------------------------------
  // Viewport State: Zoom & Pan Matrix
  // ---------------------------------------------------------------------------
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<PanOffset>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef<number>(zoom);
  zoomRef.current = zoom;
  const panRef = useRef<PanOffset>(pan);
  panRef.current = pan;

  const panStartRef = useRef<{
    startX: number;
    startY: number;
    initPanX: number;
    initPanY: number;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Spacebar Hand-Grab Modifier Listener
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Touchpad Pinch-to-Zoom & Mouse Wheel Zoom (Tauri / WebKit / Webview)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Obligatory preventDefault and stopPropagation to cancel native browser vertical scrolling completely
      e.preventDefault();
      e.stopPropagation();

      // Trackpad Pinch-to-Zoom detection (emits e.ctrlKey === true) or conventional wheel:
      const isPinch = e.ctrlKey;

      // Pinch from touchpad or wheel rotation:
      if (isPinch || !e.shiftKey) {
        // Smooth scale factor for both touchpad pinch and conventional wheel rotation
        const zoomFactor = isPinch ? Math.exp(-e.deltaY * 0.01) : Math.exp(-e.deltaY * 0.002);

        const rect = el.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const currentZoom = zoomRef.current;
        const currentPan = panRef.current;

        const newZoom = Math.min(Math.max(currentZoom * zoomFactor, MIN_ZOOM), MAX_ZOOM);
        const scaleChange = newZoom / currentZoom;

        // Focal zoom centered on cursor position:
        const newPanX = cursorX - (cursorX - currentPan.x) * scaleChange;
        const newPanY = cursorY - (cursorY - currentPan.y) * scaleChange;

        zoomRef.current = newZoom;
        panRef.current = { x: newPanX, y: newPanY };

        setZoom(newZoom);
        setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
      }
    };

    // Safari/WebKit gesture handlers to prevent native OS window zoom in Tauri
    const handleGesture = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('gesturestart', handleGesture);
    el.addEventListener('gesturechange', handleGesture);
    el.addEventListener('gestureend', handleGesture);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('gesturestart', handleGesture);
      el.removeEventListener('gesturechange', handleGesture);
      el.removeEventListener('gestureend', handleGesture);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Canvas Free Pan Dragging
  // ---------------------------------------------------------------------------
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Ignore interactive UI elements
    const target = e.target as HTMLElement;
    if (
      target.closest('.timeline-card') ||
      target.closest('button') ||
      target.closest('select') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.attach-dropdown-menu') ||
      target.closest('.viewport-controls') ||
      target.closest('.marker-popover')
    ) {
      return;
    }

    // Left click (0) or Middle click (1)
    if (e.button === 0 || e.button === 1 || isSpacePressed) {
      setIsPanning(true);
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initPanX: pan.x,
        initPanY: pan.y,
      };
      // Note: Do NOT dismiss activeMarkerPopover on canvas pan!
      setOpenAttachDropdown(null);
    }
  };

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panStartRef.current) return;
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
      setPan({
        x: Math.round(panStartRef.current.initPanX + dx),
        y: Math.round(panStartRef.current.initPanY + dy),
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  // Viewport Control Actions
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(MAX_ZOOM, Math.round((prev + 0.1) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(MIN_ZOOM, Math.round((prev - 0.1) * 10) / 10));
  };

  const handleResetViewport = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setCardPositions({});
  };

  // ---------------------------------------------------------------------------
  // Free Mobility: Card Dragging State
  // ---------------------------------------------------------------------------
  const [cardPositions, setCardPositions] = useState<Record<string, CardPosition>>({});
  const [dragState, setDragState] = useState<{
    cardId: string;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    hasMoved: boolean;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Popovers & Dropdowns
  // ---------------------------------------------------------------------------
  const [activePopover, setActivePopover] = useState<ActivePopover | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Active key event marker popover state
  const [activeMarkerPopover, setActiveMarkerPopover] = useState<ActiveMarkerPopoverState | null>(null);
  const markerPopoverRef = useRef<HTMLDivElement | null>(null);

  const [openAttachDropdown, setOpenAttachDropdown] = useState<{
    sceneId: string;
    type: 'character' | 'storyline';
  } | null>(null);

  // Filters for thread isolation
  const [selectedStorylineFilter, setSelectedStorylineFilter] = useState<string>('all');
  const [selectedCharacterFilter, setSelectedCharacterFilter] = useState<string>('all');

  // Dismiss popovers on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Handle marker popover dismiss on click outside
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
    if (!onUpdateStorylines) return;

    const updated = storylines.map((s) => {
      if (s.id === storylineId) {
        const currentLinked = s.linkedChapterIds || [];
        if (!currentLinked.includes(sceneId)) {
          return {
            ...s,
            linkedChapterIds: [...currentLinked, sceneId],
          };
        }
      }
      return s;
    });

    onUpdateStorylines(updated);
    setOpenAttachDropdown(null);
  };

  const handleDetachStoryline = (sceneId: string, storylineId: string) => {
    if (!onUpdateStorylines) return;

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
    setActivePopover(null);
  };

  // Open Popover anchor helper for storylines and characters
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

  // Helper: check if a scene participates in the currently active filter
  const hasActiveFilter = selectedStorylineFilter !== 'all' || selectedCharacterFilter !== 'all';

  const doesSceneParticipateInFilter = useCallback(
    (scene: TextNode): boolean => {
      if (selectedStorylineFilter !== 'all') {
        const match = storylines
          .filter((s) => s.id === selectedStorylineFilter)
          .some((s) => s.linkedChapterIds?.includes(scene.id));
        if (!match) return false;
      }

      if (selectedCharacterFilter !== 'all') {
        const match = (scene.attachedCharacterIds || []).includes(selectedCharacterFilter);
        if (!match) return false;
      }

      return true;
    },
    [selectedStorylineFilter, selectedCharacterFilter, storylines]
  );

  // Selected item details for Popover
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

  // Active filter color token (if filtering by storyline)
  const activeFilteredStoryline = storylines.find((s) => s.id === selectedStorylineFilter);
  const activeThreadStroke = activeFilteredStoryline
    ? STORYLINE_COLOR_MAP[activeFilteredStoryline.color]?.stroke || '#71717a'
    : '#71717a';

  // ---------------------------------------------------------------------------
  // Card Dragging Listeners
  // ---------------------------------------------------------------------------
  const handleCardMouseDown = (
    e: React.MouseEvent,
    sceneId: string,
    defaultX: number,
    defaultY: number
  ) => {
    // If spacebar modifier is held, delegate to canvas pan
    if (isSpacePressed) return;

    // Prevent dragging when interacting with interactive buttons, inputs, or popovers
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('select') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.attach-dropdown-menu') ||
      target.closest('.marker-popover')
    ) {
      return;
    }

    // Stop propagation so canvas background pan does not trigger
    e.stopPropagation();

    const currentPos = cardPositions[sceneId] || { x: defaultX, y: defaultY };
    setDragState({
      cardId: sceneId,
      startX: e.clientX,
      startY: e.clientY,
      initX: currentPos.x,
      initY: currentPos.y,
      hasMoved: false,
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentZoom = zoomRef.current || 1.0;
      const dx = (e.clientX - dragState.startX) / currentZoom;
      const dy = (e.clientY - dragState.startY) / currentZoom;

      if (!dragState.hasMoved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        setDragState((prev) => (prev ? { ...prev, hasMoved: true } : null));
      }

      const newX = Math.round(dragState.initX + dx);
      const newY = Math.round(dragState.initY + dy);

      setCardPositions((prev) => ({
        ...prev,
        [dragState.cardId]: { x: newX, y: newY },
      }));
    };

    const handleMouseUp = () => {
      if (dragState && !dragState.hasMoved) {
        onSelectChapter(dragState.cardId);
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, onSelectChapter]);

  // ---------------------------------------------------------------------------
  // Geometry & Layout Constants
  // ---------------------------------------------------------------------------
  const startX = 80;
  const stepX = 280;
  const axisY = isExpanded ? 340 : 250;
  const cardWidth = 224; // w-56 in pixels
  const cardHeightEstimate = 150;

  const totalCanvasWidth = Math.max(1600, startX + scenes.length * stepX + 300);
  const totalCanvasHeight = isExpanded ? 720 : 540;

  return (
    <div
      className={`flex flex-col h-full select-none overflow-hidden touch-none bg-zinc-950 font-sans relative ${
        isExpanded ? 'p-2' : ''
      }`}
    >
      {/* ------------------------------------------------------------------- */}
      {/* HEADER TOOLBAR                                                      */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/60 shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
            Continuous Timeline
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            ({scenes.length} {scenes.length === 1 ? 'scene' : 'scenes'})
          </span>
        </div>

        {/* Narrative & Cast Thread Isolation Filters */}
        <div className="flex items-center gap-2.5">
          {storylines.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
              <GitMerge className="w-3 h-3 text-zinc-500" />
              <select
                value={selectedStorylineFilter}
                onChange={(e) => {
                  setSelectedStorylineFilter(e.target.value);
                  setSelectedCharacterFilter('all');
                }}
                className="bg-zinc-950 border border-zinc-800 rounded-xs px-1.5 py-0.5 text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
              >
                <option value="all">All Narrative Threads</option>
                {storylines.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {characters.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
              <Users className="w-3 h-3 text-zinc-500" />
              <select
                value={selectedCharacterFilter}
                onChange={(e) => {
                  setSelectedCharacterFilter(e.target.value);
                  setSelectedStorylineFilter('all');
                }}
                className="bg-zinc-950 border border-zinc-800 rounded-xs px-1.5 py-0.5 text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
              >
                <option value="all">All Cast</option>
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
      {/* TIMELINE CANVAS SURFACE (Free Pan & Zoom)                           */}
      {/* ------------------------------------------------------------------- */}
      <div
        ref={containerRef}
        data-testid="timeline-canvas"
        onMouseDown={handleCanvasMouseDown}
        className={`flex-1 relative overflow-hidden select-none touch-none bg-zinc-950 ${
          isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : 'cursor-grab'
        }`}
        style={{
          touchAction: 'none',
          backgroundImage:
            'radial-gradient(circle, rgba(63, 63, 70, 0.20) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {scenes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-zinc-500 gap-2">
            <Clock className="w-7 h-7 text-zinc-600" />
            <p className="text-xs font-medium text-zinc-400">No scenes in outline</p>
            <p className="text-[10px] text-zinc-500 max-w-sm">
              Create scenes in the Outline panel to populate your chronological sequence.
            </p>
          </div>
        ) : (
          <div
            className="absolute top-0 left-0"
            style={{
              width: `${totalCanvasWidth}px`,
              height: `${totalCanvasHeight}px`,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              overflow: 'visible',
            }}
          >
            {/* ----------------------------------------------------------- */}
            {/* SVG LAYER: Base Chronological Axis & Flexible Bézier Curves */}
            {/* ----------------------------------------------------------- */}
            <svg
              className="absolute inset-0 pointer-events-none overflow-visible"
              style={{
                width: '100%',
                height: '100%',
                overflow: 'visible',
              }}
            >
              <defs>
                <linearGradient id="activeConnector" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#d4d4d8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#71717a" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              {/* Base Continuous Timeline Axis segments */}
              {scenes.map((scene, index) => {
                if (index >= scenes.length - 1) return null;
                const currentAnchorX = startX + index * stepX;
                const nextAnchorX = startX + (index + 1) * stepX;

                const isCurrentPart = !hasActiveFilter || doesSceneParticipateInFilter(scene);
                const isNextPart =
                  !hasActiveFilter || doesSceneParticipateInFilter(scenes[index + 1]);
                const isGap = hasActiveFilter && (!isCurrentPart || !isNextPart);

                return (
                  <g key={`axis-seg-${scene.id}`}>
                    {isGap ? (
                      <>
                        <line
                          x1={currentAnchorX}
                          y1={axisY}
                          x2={nextAnchorX}
                          y2={axisY}
                          stroke="#52525b"
                          strokeWidth="1.5"
                          strokeDasharray="6,4"
                        />
                        {/* Gap Label */}
                        <rect
                          x={(currentAnchorX + nextAnchorX) / 2 - 16}
                          y={axisY - 8}
                          width="32"
                          height="16"
                          rx="3"
                          fill="#18181b"
                          stroke="#27272a"
                          strokeWidth="1"
                        />
                        <text
                          x={(currentAnchorX + nextAnchorX) / 2}
                          y={axisY + 3.5}
                          textAnchor="middle"
                          fill="#71717a"
                          fontSize="8"
                          fontFamily="monospace"
                        >
                          GAP
                        </text>
                      </>
                    ) : (
                      <line
                        x1={currentAnchorX}
                        y1={axisY}
                        x2={nextAnchorX}
                        y2={axisY}
                        stroke={hasActiveFilter ? activeThreadStroke : '#27272a'}
                        strokeWidth="2"
                      />
                    )}
                  </g>
                );
              })}

              {/* Base Axis Anchor Points & Flexible Bézier Connectors to Cards */}
              {scenes.map((scene, index) => {
                const anchorX = startX + index * stepX;
                const defaultCardX = anchorX - cardWidth / 2;
                const defaultCardY = axisY - 175;

                const pos = cardPositions[scene.id] || { x: defaultCardX, y: defaultCardY };
                const cardCenterX = pos.x + cardWidth / 2;

                // Determine contact point on card depending on vertical position relative to axis
                const isAbove = pos.y + cardHeightEstimate / 2 < axisY;
                const cardContactY = isAbove ? pos.y + cardHeightEstimate : pos.y;

                // Smooth cubic Bézier curve calculation
                const dy = axisY - cardContactY;
                const cp1x = cardCenterX;
                const cp1y = cardContactY + dy * 0.45;
                const cp2x = anchorX;
                const cp2y = axisY - dy * 0.15;
                const pathD = `M ${cardCenterX} ${cardContactY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${anchorX} ${axisY}`;

                const isActive = scene.id === activeChapterId;
                const isParticipating = !hasActiveFilter || doesSceneParticipateInFilter(scene);

                return (
                  <g key={`connector-${scene.id}`}>
                    {/* Flexible Bézier Connector */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={
                        isActive
                          ? '#f4f4f5'
                          : isParticipating && hasActiveFilter
                          ? activeThreadStroke
                          : '#3f3f46'
                      }
                      strokeWidth={isActive ? 2 : 1.5}
                      strokeDasharray={!isParticipating && hasActiveFilter ? '4,4' : undefined}
                      strokeOpacity={
                        isActive ? 1 : !isParticipating && hasActiveFilter ? 0.25 : 0.65
                      }
                      className="transition-all duration-75"
                    />

                    {/* Chronological Pin Anchor on Base Axis */}
                    <circle
                      cx={anchorX}
                      cy={axisY}
                      r={isActive ? 4.5 : 3.5}
                      fill={isActive ? '#f4f4f5' : '#71717a'}
                      stroke="#09090b"
                      strokeWidth="1.5"
                    />

                    {/* Scene Sequence Tag underneath pin */}
                    <text
                      x={anchorX}
                      y={axisY + 16}
                      textAnchor="middle"
                      fill={isActive ? '#e4e4e7' : '#71717a'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight={isActive ? '600' : '400'}
                    >
                      #{index + 1}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* ----------------------------------------------------------- */}
            {/* DRAGGABLE SCENE CARDS (Clean Selection, Free Mobility)      */}
            {/* ----------------------------------------------------------- */}
            {scenes.map((scene, index) => {
              const anchorX = startX + index * stepX;
              const defaultCardX = anchorX - cardWidth / 2;
              const defaultCardY = axisY - 175;

              const pos = cardPositions[scene.id] || { x: defaultCardX, y: defaultCardY };
              const isActive = scene.id === activeChapterId;
              const isDragging = dragState?.cardId === scene.id;
              const wordCount = countWords(scene.content);

              const isParticipating = !hasActiveFilter || doesSceneParticipateInFilter(scene);
              const isCardPopoverActive = activeMarkerPopover?.sceneId === scene.id;

              // Attached storylines & characters
              const attachedStorylines = storylines.filter((s) =>
                s.linkedChapterIds?.includes(scene.id)
              );
              const attachedCharIds = scene.attachedCharacterIds || [];
              const attachedCharacters = characters.filter((c) =>
                attachedCharIds.includes(c.id)
              );

              // Unattached
              const unattachedStorylines = storylines.filter(
                (s) => !s.linkedChapterIds?.includes(scene.id)
              );
              const unattachedCharacters = characters.filter(
                (c) => !attachedCharIds.includes(c.id)
              );

              const isAttachDropdownOpen = openAttachDropdown?.sceneId === scene.id;
              const activeMarker = scene.markers?.find(
                (m) => m.id === activeMarkerPopover?.markerId
              );

              const isCardAboveAxis = pos.y + cardHeightEstimate / 2 < axisY;

              return (
                <div
                  key={scene.id}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    width: `${cardWidth}px`,
                  }}
                  onMouseDown={(e) => handleCardMouseDown(e, scene.id, defaultCardX, defaultCardY)}
                  className={`timeline-card rounded-sm border p-2 select-none transition-shadow duration-100 flex flex-col justify-between relative ${
                    isCardPopoverActive ? 'z-40' : 'z-10'
                  } ${
                    isDragging
                      ? 'cursor-grabbing border-zinc-400 bg-zinc-900 shadow-2xl ring-1 ring-zinc-400/40 z-30'
                      : 'cursor-grab'
                  } ${
                    isActive
                      ? 'border-zinc-300 bg-zinc-900 shadow-md ring-1 ring-zinc-300/30'
                      : isParticipating
                      ? 'border-zinc-800 bg-zinc-900/90 hover:bg-zinc-900 hover:border-zinc-600 shadow-xs'
                      : 'border-zinc-850/60 bg-zinc-950/40 opacity-40 hover:opacity-80'
                  }`}
                >
                  {/* Top Header: Drag Grip, Index, Status, Word Count */}
                  <div className="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-zinc-850/60">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <GripHorizontal className="w-3 h-3 text-zinc-500 hover:text-zinc-300 transition shrink-0" />
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400">
                        #{index + 1}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono truncate">
                        {wordCount.toLocaleString()} w
                      </span>
                    </div>

                    {scene.status && (
                      <span className="text-[8px] font-mono px-1 rounded-xs border uppercase tracking-wider bg-zinc-950 border-zinc-850 text-zinc-400">
                        {scene.status}
                      </span>
                    )}
                  </div>

                  {/* ------------------------------------------------------- */}
                  {/* Key Event Markers / Narrative Alerts Visual Row         */}
                  {/* ------------------------------------------------------- */}
                  {scene.markers && scene.markers.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap mb-1.5 pt-0.5">
                      {scene.markers.map((marker) => {
                        const colorConf =
                          MARKER_COLOR_CONFIG[marker.color] || MARKER_COLOR_CONFIG.zinc;
                        const isMarkerActive =
                          activeMarkerPopover?.sceneId === scene.id &&
                          activeMarkerPopover?.markerId === marker.id;

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
                            title={`Key Event: ${marker.title}${
                              marker.description ? ` — ${marker.description}` : ''
                            } (Click to edit)`}
                            className={`marker-trigger-btn flex items-center gap-1 px-1.5 py-0.5 rounded-xs border text-[9px] font-mono transition cursor-pointer select-none ${
                              colorConf.badgeBg
                            } ${colorConf.badgeBorder} ${colorConf.badgeText} ${
                              colorConf.badgeHoverBg
                            } ${isMarkerActive ? 'ring-1 ring-zinc-300 font-semibold' : ''}`}
                          >
                            {renderMarkerIcon(marker.icon, 'w-2.5 h-2.5 shrink-0')}
                            <span className="truncate max-w-[85px]">{marker.title}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddMarker(scene.id);
                        }}
                        className="marker-trigger-btn px-1 py-0.5 rounded-xs border border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 text-[8px] font-mono transition cursor-pointer"
                        title="Add another key event / alert"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <div className="mb-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddMarker(scene.id);
                        }}
                        className="marker-trigger-btn flex items-center gap-1 px-1.5 py-0.5 rounded-xs border border-zinc-850 hover:border-zinc-700 bg-zinc-950/70 text-zinc-500 hover:text-zinc-300 text-[8px] font-mono transition cursor-pointer"
                        title="Add key event milestone or alert to this scene"
                      >
                        <AlertTriangle className="w-2.5 h-2.5 text-zinc-500" />
                        <span>+ Alert / Marker</span>
                      </button>
                    </div>
                  )}

                  {/* Scene Title */}
                  <h4
                    className={`text-xs font-semibold truncate transition ${
                      isActive ? 'text-zinc-100 font-bold' : 'text-zinc-200'
                    }`}
                    title={scene.title}
                  >
                    {scene.title || 'Untitled Scene'}
                  </h4>

                  {/* Attached Markers (Storylines & Characters) */}
                  {(attachedStorylines.length > 0 || attachedCharacters.length > 0) && (
                    <div className="flex flex-wrap gap-1 items-center mt-1.5 pt-1.5 border-t border-zinc-850/80">
                      {/* Storylines */}
                      {attachedStorylines.map((st) => {
                        const colorToken =
                          STORYLINE_COLOR_MAP[st.color] || STORYLINE_COLOR_MAP.blue;
                        const isFilteredThread = st.id === selectedStorylineFilter;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={(e) =>
                              handleOpenMarkerPopover(e, 'storyline', st.id, scene.id)
                            }
                            title={`Plot Thread: "${st.title}" (Click for details)`}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs border text-[9px] font-mono transition hover:scale-105 cursor-pointer ${
                              colorToken.bg
                            } ${colorToken.border} ${colorToken.text} ${
                              isFilteredThread ? 'ring-1 ring-zinc-300 font-bold' : ''
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${colorToken.dot}`} />
                            <span className="truncate max-w-[85px]">{st.title}</span>
                          </button>
                        );
                      })}

                      {/* Characters */}
                      {attachedCharacters.map((ch) => {
                        const isFilteredChar = ch.id === selectedCharacterFilter;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={(e) =>
                              handleOpenMarkerPopover(e, 'character', ch.id, scene.id)
                            }
                            title={`Character: "${ch.name}" (${ch.role})`}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white text-[9px] font-mono transition hover:scale-105 cursor-pointer ${
                              isFilteredChar ? 'border-zinc-400 ring-1 ring-zinc-400 text-white' : ''
                            }`}
                          >
                            <Users className="w-2.5 h-2.5 text-zinc-400" />
                            <span className="truncate max-w-[75px]">{ch.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick Attachment Dropdown Triggers */}
                  <div className="flex items-center gap-1 pt-1.5 mt-1.5 border-t border-zinc-850/40">
                    {/* Attach Character Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenAttachDropdown(
                            isAttachDropdownOpen && openAttachDropdown?.type === 'character'
                              ? null
                              : { sceneId: scene.id, type: 'character' }
                          );
                        }}
                        className="attach-dropdown-trigger flex items-center gap-0.5 px-1 py-0.5 rounded-xs border border-zinc-850 hover:border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300 text-[8px] font-mono transition cursor-pointer"
                        title="Attach character to scene"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Cast</span>
                      </button>

                      {/* Dropdown Menu for Characters */}
                      {isAttachDropdownOpen && openAttachDropdown?.type === 'character' && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="attach-dropdown-menu absolute bottom-full mb-1 left-0 z-40 w-44 rounded-sm bg-zinc-950 border border-zinc-800 shadow-xl py-1 text-xs"
                        >
                          <div className="px-2 py-0.5 text-[8px] font-mono text-zinc-500 uppercase border-b border-zinc-850">
                            Attach Cast
                          </div>
                          {unattachedCharacters.length === 0 ? (
                            <div className="px-2 py-1 text-[10px] text-zinc-500">
                              All cast attached
                            </div>
                          ) : (
                            unattachedCharacters.map((ch) => (
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
                          )}
                        </div>
                      )}
                    </div>

                    {/* Attach Storyline Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenAttachDropdown(
                            isAttachDropdownOpen && openAttachDropdown?.type === 'storyline'
                              ? null
                              : { sceneId: scene.id, type: 'storyline' }
                          );
                        }}
                        className="attach-dropdown-trigger flex items-center gap-0.5 px-1 py-0.5 rounded-xs border border-zinc-850 hover:border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300 text-[8px] font-mono transition cursor-pointer"
                        title="Attach plot thread to scene"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Thread</span>
                      </button>

                      {/* Dropdown Menu for Storylines */}
                      {isAttachDropdownOpen && openAttachDropdown?.type === 'storyline' && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="attach-dropdown-menu absolute bottom-full mb-1 left-0 z-40 w-44 rounded-sm bg-zinc-950 border border-zinc-800 shadow-xl py-1 text-xs"
                        >
                          <div className="px-2 py-0.5 text-[8px] font-mono text-zinc-500 uppercase border-b border-zinc-850">
                            Attach Plot Thread
                          </div>
                          {unattachedStorylines.length === 0 ? (
                            <div className="px-2 py-1 text-[10px] text-zinc-500">
                              All threads attached
                            </div>
                          ) : (
                            unattachedStorylines.map((st) => (
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
                      )}
                    </div>
                  </div>

                  {/* ------------------------------------------------------- */}
                  {/* FLOATING KEY EVENT MARKER POPOVER (Anchored to Card)    */}
                  {/* ------------------------------------------------------- */}
                  {isCardPopoverActive && activeMarker && (
                    <div
                      ref={markerPopoverRef}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        left: 0,
                        ...(isCardAboveAxis
                          ? { top: '100%', marginTop: '8px' }
                          : { bottom: '100%', marginBottom: '8px' }),
                      }}
                      className="marker-popover w-80 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl p-3 z-50 text-xs text-zinc-300 font-sans animate-in fade-in zoom-in-95 duration-100 select-none"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="p-1 rounded-xs"
                            style={{
                              backgroundColor: `${MARKER_COLOR_CONFIG[activeMarker.color]?.hex || '#f43f5e'}20`,
                              color: MARKER_COLOR_CONFIG[activeMarker.color]?.hex || '#f43f5e',
                            }}
                          >
                            {renderMarkerIcon(activeMarker.icon, 'w-3.5 h-3.5')}
                          </span>
                          <span className="font-semibold text-zinc-200 text-xs">
                            Event Marker / Alert
                          </span>
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
                          Event Title / Alert
                        </label>
                        <input
                          type="text"
                          value={activeMarker.title}
                          onChange={(e) =>
                            handleUpdateMarker(scene.id, activeMarker.id, {
                              title: e.target.value,
                            })
                          }
                          placeholder="e.g. Plot Twist: Sterling betrayed"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                        />
                      </div>

                      {/* Description Textarea */}
                      <div className="space-y-1 mb-2.5">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                          Annotation & Details
                        </label>
                        <textarea
                          rows={2}
                          value={activeMarker.description || ''}
                          onChange={(e) =>
                            handleUpdateMarker(scene.id, activeMarker.id, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Foreshadowing notes, stakes, or consequences..."
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                        />
                      </div>

                      {/* Icon Selector */}
                      <div className="space-y-1 mb-2.5">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                          Marker Icon
                        </label>
                        <div className="grid grid-cols-5 gap-1">
                          {MARKER_ICONS.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                handleUpdateMarker(scene.id, activeMarker.id, {
                                  icon: item.id,
                                })
                              }
                              title={item.label}
                              className={`flex flex-col items-center justify-center py-1 rounded-xs border text-[9px] font-mono transition cursor-pointer ${
                                activeMarker.icon === item.id
                                  ? 'bg-zinc-800 border-zinc-600 text-white font-semibold shadow-xs'
                                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                              }`}
                            >
                              {renderMarkerIcon(item.id, 'w-3 h-3 mb-0.5')}
                              <span className="text-[8px]">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Palette Selector */}
                      <div className="space-y-1 mb-3">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                          Color Theme
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {MARKER_COLORS.map((cKey) => {
                            const cMeta = MARKER_COLOR_CONFIG[cKey];
                            const isSelected = activeMarker.color === cKey;
                            return (
                              <button
                                key={cKey}
                                type="button"
                                onClick={() =>
                                  handleUpdateMarker(scene.id, activeMarker.id, {
                                    color: cKey,
                                  })
                                }
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-xs border text-[10px] transition cursor-pointer ${
                                  isSelected
                                    ? `${cMeta.bg} ${cMeta.border} ${cMeta.text} font-semibold ring-1 ring-white/20`
                                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                                }`}
                              >
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: cMeta.hex }}
                                />
                                <span className="capitalize text-[9px] truncate">
                                  {cKey}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                        <button
                          type="button"
                          onClick={() => handleDeleteMarker(scene.id, activeMarker.id)}
                          className="flex items-center gap-1 text-[10px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2 py-1 rounded-xs transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Marker</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveMarkerPopover(null)}
                          className="text-[10px] font-mono px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xs transition cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* FLOATING VIEWPORT CONTROLS (Zoom In, Zoom Out, Reset, 100%)         */}
        {/* ------------------------------------------------------------------- */}
        <div
          className="viewport-controls absolute bottom-3 right-3 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-xs border border-zinc-800 rounded-sm px-1.5 py-1 text-zinc-300 shadow-xl z-30"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            title="Zoom Out (Ctrl + Scroll Down)"
            className="p-1 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-xs transition text-zinc-400 hover:text-white cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetViewport}
            title="Current zoom level"
            className="text-[10px] font-mono px-1.5 min-w-[38px] text-center text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xs transition cursor-pointer select-none"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            title="Zoom In (Ctrl + Scroll Up)"
            className="p-1 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-xs transition text-zinc-400 hover:text-white cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="h-3 w-px bg-zinc-800 mx-0.5" />
          <button
            type="button"
            onClick={handleResetViewport}
            title="Reset Zoom (100%) & Viewport"
            className="p-1 hover:bg-zinc-800 rounded-xs transition text-zinc-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* FLOATING DETAIL POPOVER FOR STORYLINES & CHARACTERS                 */}
      {/* ------------------------------------------------------------------- */}
      {activePopover && (
        <div
          ref={popoverRef}
          style={{ top: `${activePopover.y}px`, left: `${activePopover.x}px` }}
          className="fixed z-50 w-72 max-w-[90vw] bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl p-3 text-xs text-zinc-300 font-sans animate-in fade-in zoom-in-95 duration-100 select-none"
        >
          {/* Storyline Popover Details */}
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
                    Plot Thread • {popoverStoryline.status || 'Active'}
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

              {/* Description */}
              <div className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/50 p-2 rounded-xs border border-zinc-850/80">
                {popoverStoryline.description || 'No description provided for this plot thread.'}
              </div>

              {/* Fields if present */}
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

              {/* Detach Action */}
              <div className="pt-1.5 border-t border-zinc-850 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    handleDetachStoryline(activePopover.sceneId, popoverStoryline.id)
                  }
                  className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-xs hover:bg-zinc-900 transition cursor-pointer"
                >
                  Detach from Scene
                </button>
              </div>
            </div>
          )}

          {/* Character Popover Details */}
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
                    Role: {popoverCharacter.role}
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

              {/* Character Summary / Bio */}
              <div className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/50 p-2 rounded-xs border border-zinc-850/80">
                {popoverCharacter.summary || 'No summary notes available for this character.'}
              </div>

              {/* Tags & Fields if present */}
              {popoverCharacter.tags && popoverCharacter.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {popoverCharacter.tags.map((t) => (
                    <span
                      key={t.id}
                      className="px-1.5 py-0.2 rounded-xs border border-zinc-800 bg-zinc-950 text-[9px] font-mono text-zinc-400"
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Detach Action */}
              <div className="pt-1.5 border-t border-zinc-850 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    handleDetachCharacter(activePopover.sceneId, popoverCharacter.id)
                  }
                  className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-xs hover:bg-zinc-900 transition cursor-pointer"
                >
                  Detach from Scene
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
