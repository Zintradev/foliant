import React, { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import {
  Network,
  Users,
  Plus,
  Trash2,
  X,
  RotateCcw,
  Pencil,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  Link,
  GitCommit,
  ZoomIn,
  ZoomOut,
  GitMerge,
} from 'lucide-react';
import {
  CharacterItem,
  CharacterRelationship,
  RelationshipType,
  RelationshipColor,
  RelationshipDirection,
  LineStrokeStyle,
  GraphJunctionNode,
  StorylineItem,
  StorylineColor,
} from '../../../types/dock';
import { useTranslation, getRoleLabel } from '../../../i18n/translations';

interface RelationshipGraphViewProps {
  characters: CharacterItem[];
  relationships: CharacterRelationship[];
  storylines?: StorylineItem[];
  junctions?: GraphJunctionNode[];
  onUpdateRelationships?: (updated: CharacterRelationship[]) => void;
  onUpdateCharacters?: (updated: CharacterItem[]) => void;
  onUpdateJunctions?: (updated: GraphJunctionNode[]) => void;
  onAddCharacter?: (char: CharacterItem) => void;
  isExpanded?: boolean;
}

interface NodePosition {
  x: number;
  y: number;
}

interface PanOffset {
  x: number;
  y: number;
}

interface CanvasContextMenuState {
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3.0;
const DRAG_THRESHOLD = 4; // 4px movement threshold before drag initiates

// Visual color palette token map
const COLOR_PALETTE: Record<
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
    label: 'Mentor / Duty (Amber)',
    stroke: '#f59e0b',
    bg: 'bg-amber-950/80',
    border: 'border-amber-700/70',
    text: 'text-amber-200',
  },
  purple: {
    label: 'Romance / Secret (Purple)',
    stroke: '#a855f7',
    bg: 'bg-purple-950/80',
    border: 'border-purple-700/70',
    text: 'text-purple-200',
  },
  cyan: {
    label: 'Contract / Trade (Cyan)',
    stroke: '#06b6d4',
    bg: 'bg-cyan-950/80',
    border: 'border-cyan-700/70',
    text: 'text-cyan-200',
  },
  zinc: {
    label: 'Neutral / Acquaintance (Zinc)',
    stroke: '#71717a',
    bg: 'bg-zinc-900',
    border: 'border-zinc-700',
    text: 'text-zinc-300',
  },
};

const STORYLINE_THEMES: Record<
  StorylineColor,
  { bg: string; text: string; border: string; dot: string }
> = {
  emerald: {
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-300',
    border: 'border-emerald-700/70',
    dot: 'bg-emerald-400',
  },
  purple: {
    bg: 'bg-purple-950/80',
    text: 'text-purple-300',
    border: 'border-purple-700/70',
    dot: 'bg-purple-400',
  },
  amber: {
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-700/70',
    dot: 'bg-amber-400',
  },
  blue: {
    bg: 'bg-blue-950/80',
    text: 'text-blue-300',
    border: 'border-blue-700/70',
    dot: 'bg-blue-400',
  },
  rose: {
    bg: 'bg-rose-950/80',
    text: 'text-rose-300',
    border: 'border-rose-700/70',
    dot: 'bg-rose-400',
  },
  cyan: {
    bg: 'bg-cyan-950/80',
    text: 'text-cyan-300',
    border: 'border-cyan-700/70',
    dot: 'bg-cyan-400',
  },
};

const STROKE_STYLES: Record<LineStrokeStyle, { label: string; dash?: string }> = {
  solid: { label: 'Solid' },
  dashed: { label: 'Dashed', dash: '6,4' },
  dotted: { label: 'Dotted', dash: '2,3' },
};

/**
 * Calculates exact perimeter anchor coordinate on the outer boundary of a target node
 * with an offset/margin, preventing arrowhead markers from clipping under cards or inverting.
 * Uses strict Ray-Box intersection for cards and Ray-Circle intersection for junctions.
 */
function getPerimeterAnchor(
  from: { cx: number; cy: number },
  to: { cx: number; cy: number; isJunction: boolean },
  padding: number = 4,
  arrowOffset: number = 9
): { x: number; y: number } {
  let dx = from.cx - to.cx;
  let dy = from.cy - to.cy;
  let dist = Math.hypot(dx, dy);

  // If distance is negligible, clamp to minimal distance so vector never inverts
  if (dist < 0.0001) {
    dx = 1;
    dy = 0;
    dist = 1;
  }

  const ux = dx / dist;
  const uy = dy / dist;

  // Ray-Circle intersection for junction nodes
  if (to.isJunction) {
    const radius = 14 + padding;
    return {
      x: Math.round(to.cx + ux * (radius + arrowOffset)),
      y: Math.round(to.cy + uy * (radius + arrowOffset)),
    };
  }

  // Ray-Box intersection for rectangular Character Cards (exact 160x72px card)
  const effHalfW = 80 + padding;
  const effHalfH = 36 + padding;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Calculate hit parameter t along direction vector
  const tX = absDx > 0.00001 ? effHalfW / absDx : Infinity;
  const tY = absDy > 0.00001 ? effHalfH / absDy : Infinity;
  const tHit = Math.min(tX, tY);

  const intersectX = to.cx + dx * tHit;
  const intersectY = to.cy + dy * tHit;

  // Step back endpoint outward towards origin node by arrowOffset (8-10px)
  // so the SVG arrowhead marker rests completely visible on the card perimeter
  return {
    x: Math.round(intersectX + ux * arrowOffset),
    y: Math.round(intersectY + uy * arrowOffset),
  };
}

function RelationshipGraphViewComponent({
  characters,
  relationships,
  storylines = [],
  junctions: propJunctions,
  onUpdateRelationships,
  onUpdateCharacters,
  onUpdateJunctions,
  onAddCharacter,
  isExpanded = false,
}: RelationshipGraphViewProps) {
  const { t } = useTranslation();

  const getColorPaletteLabel = (key: string): string => {
    switch (key) {
      case 'blue': return t('relAlliance');
      case 'rose': return t('relHostile');
      case 'emerald': return t('relFamily');
      case 'amber': return t('relMentor');
      case 'purple': return t('relRomance');
      case 'cyan': return t('relContract');
      case 'zinc': return t('relNeutral');
      default: return key;
    }
  };

  const boardRef = useRef<HTMLDivElement | null>(null);

  // ---------------------------------------------------------------------------
  // Viewport State: Zoom & Pan Matrix
  // ---------------------------------------------------------------------------
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<PanOffset>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

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
  // Junction / Union Nodes State
  // ---------------------------------------------------------------------------
  const [internalJunctions, setInternalJunctions] = useState<GraphJunctionNode[]>([]);
  const junctions = propJunctions ?? internalJunctions;

  const updateJunctions = useCallback(
    (newJuncs: GraphJunctionNode[]) => {
      if (onUpdateJunctions) {
        onUpdateJunctions(newJuncs);
      }
      setInternalJunctions(newJuncs);
    },
    [onUpdateJunctions]
  );

  // Filter state for relationship colors
  const [filterType, setFilterType] = useState<string>('all');

  // Node positions on canvas
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});

  // High-performance card dragging state with 4px threshold
  const dragNodeRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    lastX: number;
    lastY: number;
    isDragging: boolean;
  } | null>(null);

  // Malleable relationship curve pill dragging state
  const [draggingRelId, setDraggingRelId] = useState<string | null>(null);
  const dragRelRef = useRef<{
    relId: string;
    startX: number;
    startY: number;
    initOffsetX: number;
    initOffsetY: number;
    lastOffsetX: number;
    lastOffsetY: number;
    isDragging: boolean;
  } | null>(null);
  const justDraggedRelRef = useRef<boolean>(false);

  // "Draw Connection" state (initiated via right-click on node or double-click)
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [elasticCursor, setElasticCursor] = useState<{ x: number; y: number } | null>(null);
  const isDrawingConnection = Boolean(connectingSourceId);

  // Active inspectors
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null);
  const [selectedJunctionId, setSelectedJunctionId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [hoveredJunctionId, setHoveredJunctionId] = useState<string | null>(null);

  // Context menu for empty canvas
  const [canvasContextMenu, setCanvasContextMenu] = useState<CanvasContextMenuState | null>(null);

  // Quick Character Placement / Creation Dialog
  const [isCreatingChar, setIsCreatingChar] = useState(false);
  const [newCharCoords, setNewCharCoords] = useState<{ x: number; y: number }>({ x: 200, y: 150 });
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState<string>('Supporting');
  const [newCharSummary, setNewCharSummary] = useState('');

  // Manual Connection Modal
  const [isCreatingRel, setIsCreatingRel] = useState(false);
  const [newSourceId, setNewSourceId] = useState<string>('');
  const [newTargetId, setNewTargetId] = useState<string>('');
  const newType: RelationshipType = 'Alliance';
  const [newLabel, setNewLabel] = useState<string>('');
  const [newStyle, setNewStyle] = useState<LineStrokeStyle>('solid');
  const [newColor, setNewColor] = useState<RelationshipColor>('blue');
  const newDirection: RelationshipDirection = 'directed';
  const [newNotes, setNewNotes] = useState<string>('');

  // ---------------------------------------------------------------------------
  // Circular / Dynamic Layout Init
  // ---------------------------------------------------------------------------
  const resetLayout = useCallback(() => {
    if (!characters.length && !junctions.length) return;
    const newPositions: Record<string, NodePosition> = {};
    const centerX = 360;
    const centerY = 240;
    const radius = Math.max(160, Math.min(300, characters.length * 45));

    characters.forEach((char, index) => {
      const angle = (index / characters.length) * 2 * Math.PI;
      newPositions[char.id] = {
        x: Math.round(centerX + radius * Math.cos(angle) - 80),
        y: Math.round(centerY + radius * Math.sin(angle) - 40),
      };
    });

    junctions.forEach((junc) => {
      newPositions[junc.id] = { x: junc.x, y: junc.y };
    });

    setPositions(newPositions);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, [characters, junctions]);

  // Initial layout initialization
  useEffect(() => {
    setPositions((prev) => {
      let changed = false;
      const next = { ...prev };
      const centerX = 360;
      const centerY = 240;
      const radius = Math.max(160, Math.min(300, characters.length * 45));

      characters.forEach((char, index) => {
        if (!next[char.id]) {
          const angle = (index / characters.length) * 2 * Math.PI;
          next[char.id] = {
            x: Math.round(centerX + radius * Math.cos(angle) - 80),
            y: Math.round(centerY + radius * Math.sin(angle) - 40),
          };
          changed = true;
        }
      });

      junctions.forEach((junc) => {
        if (!next[junc.id]) {
          next[junc.id] = { x: junc.x, y: junc.y };
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [characters, junctions]);

  // ---------------------------------------------------------------------------
  // Touchpad Pinch-to-Zoom & Mouse Wheel Zoom (Tauri / WebKit / Webview)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
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
  // Spacebar Hand-Grab Modifier & Escape Listener
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;

      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
      if (e.key === 'Escape') {
        setConnectingSourceId(null);
        setElasticCursor(null);
        setSelectedRelId(null);
        setSelectedJunctionId(null);
        setCanvasContextMenu(null);
        setEditingCardId(null);
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
  // Canvas Free Pan Dragging
  // ---------------------------------------------------------------------------
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // If currently in drawing connection mode, clicking empty space cancels it
    if (connectingSourceId) {
      setConnectingSourceId(null);
      setElasticCursor(null);
      return;
    }

    const target = e.target as HTMLElement;
    if (
      target.closest('.character-card') ||
      target.closest('.junction-node') ||
      target.closest('.relationship-pill') ||
      target.closest('button') ||
      target.closest('select') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.viewport-controls') ||
      target.closest('.context-menu-box')
    ) {
      return;
    }

    // Left click on empty space: start Pan
    if (e.button === 0 || e.button === 1 || isSpacePressed) {
      setIsPanning(true);
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initPanX: pan.x,
        initPanY: pan.y,
      };
      setCanvasContextMenu(null);
      setSelectedRelId(null);
      setSelectedJunctionId(null);
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

  // Track cursor position in world coordinates for the elastic connection line
  const handleBoardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (connectingSourceId && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - pan.x) / zoom;
      const worldY = (e.clientY - rect.top - pan.y) / zoom;
      setElasticCursor({ x: worldX, y: worldY });
    }
  };

  // Right-click on empty canvas: open entity creation menu
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    if (connectingSourceId) {
      setConnectingSourceId(null);
      setElasticCursor(null);
      return;
    }

    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const worldX = Math.round((screenX - pan.x) / zoom);
    const worldY = Math.round((screenY - pan.y) / zoom);

    setCanvasContextMenu({ screenX, screenY, worldX, worldY });
  };

  // ---------------------------------------------------------------------------
  // Card Dragging with 4px Drag Threshold & Pointer Capture (Zero Lag)
  // ---------------------------------------------------------------------------
  const handleNodePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    nodeId: string
  ) => {
    if (e.button !== 0) return; // Only primary button for drag

    // If in connecting mode, click will confirm connection instead of dragging
    if (connectingSourceId) {
      if (connectingSourceId !== nodeId) {
        createQuickRelationship(connectingSourceId, nodeId);
      }
      setConnectingSourceId(null);
      setElasticCursor(null);
      return;
    }

    e.stopPropagation();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const currentPos = positions[nodeId] || { x: 100, y: 100 };
    dragNodeRef.current = {
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      initX: currentPos.x,
      initY: currentPos.y,
      lastX: currentPos.x,
      lastY: currentPos.y,
      isDragging: false,
    };
  };

  const handleNodePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragNodeRef.current) return;
    e.stopPropagation();

    const { nodeId, startX, startY, initX, initY, isDragging } = dragNodeRef.current;
    const moveDist = Math.hypot(e.clientX - startX, e.clientY - startY);

    // Filter out minor hand tremors below threshold to preserve clean clicks
    if (!isDragging && moveDist < DRAG_THRESHOLD) {
      return;
    }

    dragNodeRef.current.isDragging = true;
    const currentZoom = zoomRef.current || 1.0;

    const dx = (e.clientX - startX) / currentZoom;
    const dy = (e.clientY - startY) / currentZoom;

    const nextX = Math.round(initX + dx);
    const nextY = Math.round(initY + dy);

    dragNodeRef.current.lastX = nextX;
    dragNodeRef.current.lastY = nextY;

    // Synchronously update node position in the exact same render frame as SVG lines
    setPositions((prev) => ({
      ...prev,
      [nodeId]: { x: nextX, y: nextY },
    }));
  };

  const handleNodePointerUp = (e: React.PointerEvent<HTMLDivElement>, nodeId: string) => {
    if (!dragNodeRef.current) return;
    e.stopPropagation();

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const dragInfo = dragNodeRef.current;
    dragNodeRef.current = null;

    // If movement was below threshold and in connection mode, confirm connection
    if (connectingSourceId && !dragInfo.isDragging && connectingSourceId !== nodeId) {
      createQuickRelationship(connectingSourceId, nodeId);
      setConnectingSourceId(null);
      setElasticCursor(null);
      return;
    }

    if (dragInfo.isDragging && junctions.some((j) => j.id === dragInfo.nodeId)) {
      updateJunctions(
        junctions.map((j) =>
          j.id === dragInfo.nodeId ? { ...j, x: dragInfo.lastX, y: dragInfo.lastY } : j
        )
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Malleable Relationship Pill Dragging & Curve Bending
  // ---------------------------------------------------------------------------
  const handlePillPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    rel: CharacterRelationship
  ) => {
    if (e.button !== 0) return; // Only primary button for drag
    e.stopPropagation();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const initOffsetX = rel.controlOffset?.x ?? 0;
    const initOffsetY = rel.controlOffset?.y ?? 0;

    dragRelRef.current = {
      relId: rel.id,
      startX: e.clientX,
      startY: e.clientY,
      initOffsetX,
      initOffsetY,
      lastOffsetX: initOffsetX,
      lastOffsetY: initOffsetY,
      isDragging: false,
    };
    justDraggedRelRef.current = false;
  };

  const handlePillPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRelRef.current) return;
    e.stopPropagation();

    const { relId, startX, startY, initOffsetX, initOffsetY, isDragging } = dragRelRef.current;
    const moveDist = Math.hypot(e.clientX - startX, e.clientY - startY);

    if (!isDragging && moveDist < DRAG_THRESHOLD) {
      return;
    }

    if (!isDragging) {
      dragRelRef.current.isDragging = true;
      setDraggingRelId(relId);
      justDraggedRelRef.current = true;
    }

    const currentZoom = zoomRef.current || 1.0;
    const dx = (e.clientX - startX) / currentZoom;
    const dy = (e.clientY - startY) / currentZoom;

    const nextOffsetX = Math.round(initOffsetX + dx);
    const nextOffsetY = Math.round(initOffsetY + dy);

    dragRelRef.current.lastOffsetX = nextOffsetX;
    dragRelRef.current.lastOffsetY = nextOffsetY;

    if (onUpdateRelationships) {
      onUpdateRelationships(
        relationships.map((r) =>
          r.id === relId ? { ...r, controlOffset: { x: nextOffsetX, y: nextOffsetY } } : r
        )
      );
    }
  };

  const handlePillPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRelRef.current) return;
    e.stopPropagation();

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const dragInfo = dragRelRef.current;
    dragRelRef.current = null;
    setDraggingRelId(null);

    if (dragInfo.isDragging) {
      setTimeout(() => {
        justDraggedRelRef.current = false;
      }, 50);
    } else {
      justDraggedRelRef.current = false;
    }
  };

  const handlePillDoubleClick = (e: React.MouseEvent, relId: string) => {
    e.stopPropagation();
    if (onUpdateRelationships) {
      onUpdateRelationships(
        relationships.map((r) =>
          r.id === relId ? { ...r, controlOffset: undefined } : r
        )
      );
    }
  };

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
  };

  // ---------------------------------------------------------------------------
  // Direct Right-Click & Click Connection Confirmation
  // ---------------------------------------------------------------------------
  const createQuickRelationship = (sourceId: string, targetId: string) => {
    const isJuncSource = junctions.some((j) => j.id === sourceId);
    const isJuncTarget = junctions.some((j) => j.id === targetId);
    const defaultLabel = isJuncSource || isJuncTarget ? 'Lineage / Branch' : 'Allies';

    const newRel: CharacterRelationship = {
      id: `rel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sourceId,
      targetId,
      type: isJuncSource || isJuncTarget ? 'Family' : 'Alliance',
      label: defaultLabel,
      style: 'solid',
      color: isJuncSource || isJuncTarget ? 'emerald' : 'blue',
      direction: 'directed', // default arrow directed toward target
    };

    if (onUpdateRelationships) {
      onUpdateRelationships([...relationships, newRel]);
    }

    setSelectedRelId(newRel.id);
    setSelectedJunctionId(null);
    setConnectingSourceId(null);
    setElasticCursor(null);
  };

  // Right-click on a card or junction node enters "Draw Connection" mode
  // OR confirms connection if already drawing
  const handleNodeContextMenu = (
    e: React.MouseEvent,
    nodeId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // If already in Draw Connection mode, clicking/right-clicking destination confirms connection!
    if (connectingSourceId) {
      if (connectingSourceId !== nodeId) {
        createQuickRelationship(connectingSourceId, nodeId);
      }
      setConnectingSourceId(null);
      setElasticCursor(null);
      return;
    }

    setCanvasContextMenu(null);
    setConnectingSourceId(nodeId);
    setSelectedRelId(null);
    setSelectedJunctionId(null);
    setEditingCardId(null);

    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - pan.x) / zoom;
      const worldY = (e.clientY - rect.top - pan.y) / zoom;
      setElasticCursor({ x: worldX, y: worldY });
    }
  };

  const handleCardDoubleClick = (e: React.MouseEvent, charId: string) => {
    e.stopPropagation();
    setConnectingSourceId(charId);
    setSelectedRelId(null);
    setSelectedJunctionId(null);
    setEditingCardId(null);

    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - pan.x) / zoom;
      const worldY = (e.clientY - rect.top - pan.y) / zoom;
      setElasticCursor({ x: worldX, y: worldY });
    }
  };

  const cardPointerCoordRef = useRef<{ x: number; y: number } | null>(null);

  const handleCardMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      cardPointerCoordRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleCardMouseUp = (e: React.MouseEvent, charId: string) => {
    if (e.button !== 0 || !cardPointerCoordRef.current) return;
    const delta = Math.hypot(
      e.clientX - cardPointerCoordRef.current.x,
      e.clientY - cardPointerCoordRef.current.y
    );
    cardPointerCoordRef.current = null;

    // Movement greater than 3px is treated as a drag, not a click
    if (delta > 3) {
      return;
    }

    // If currently in connecting mode, confirm connection to this card
    if (connectingSourceId) {
      if (connectingSourceId !== charId) {
        createQuickRelationship(connectingSourceId, charId);
      }
      setConnectingSourceId(null);
      setElasticCursor(null);
      return;
    }

    // Pure click anywhere on card opens the editor modal
    setEditingCardId(charId);
    setSelectedRelId(null);
    setSelectedJunctionId(null);
  };

  const handleCardClick = (e: React.MouseEvent, charId: string) => {
    e.stopPropagation();

    // If currently in connecting mode, confirm connection to this card
    if (connectingSourceId) {
      if (connectingSourceId !== charId) {
        createQuickRelationship(connectingSourceId, charId);
      }
      setConnectingSourceId(null);
      setElasticCursor(null);
      return;
    }

    setEditingCardId(charId);
    setSelectedRelId(null);
    setSelectedJunctionId(null);
  };

  // Re-assign which character a card in the graph represents
  const handleReassignCardCharacter = (oldCharId: string, newCharId: string) => {
    if (oldCharId === newCharId) return;

    // Transfer positions
    setPositions((prev) => {
      const next = { ...prev };
      if (next[oldCharId]) {
        next[newCharId] = next[oldCharId];
        delete next[oldCharId];
      }
      return next;
    });

    // Update any relationships referencing oldCharId to newCharId
    if (onUpdateRelationships) {
      onUpdateRelationships(
        relationships.map((r) => {
          let s = r.sourceId;
          let t = r.targetId;
          if (s === oldCharId) s = newCharId;
          if (t === oldCharId) t = newCharId;
          return { ...r, sourceId: s, targetId: t };
        })
      );
    }

    setEditingCardId(newCharId);
  };

  // ---------------------------------------------------------------------------
  // Union Node Creation & Handlers
  // ---------------------------------------------------------------------------
  const handleAddUnionNode = (x: number, y: number) => {
    const newJunc: GraphJunctionNode = {
      id: `junction-${Date.now()}`,
      label: 'Union Node',
      x,
      y,
    };
    updateJunctions([...junctions, newJunc]);
    setPositions((prev) => ({
      ...prev,
      [newJunc.id]: { x, y },
    }));
    setCanvasContextMenu(null);
  };

  const handleDeleteJunction = (id: string) => {
    updateJunctions(junctions.filter((j) => j.id !== id));
    if (onUpdateRelationships) {
      onUpdateRelationships(
        relationships.filter((r) => r.sourceId !== id && r.targetId !== id)
      );
    }
    setSelectedJunctionId(null);
  };

  // ---------------------------------------------------------------------------
  // Center & Contact Points Computation
  // ---------------------------------------------------------------------------
  const getNodeInfo = useCallback(
    (id: string): { cx: number; cy: number; isJunction: boolean } | null => {
      const pos = positions[id];
      if (!pos) return null;

      const isJunc = junctions.some((j) => j.id === id);
      if (isJunc) {
        return {
          cx: pos.x + 14,
          cy: pos.y + 14,
          isJunction: true,
        };
      }

      return {
        cx: pos.x + 80,
        cy: pos.y + 36,
        isJunction: false,
      };
    },
    [positions, junctions]
  );

  const getNodeLabel = (id: string): string => {
    const char = characters.find((c) => c.id === id);
    if (char) return char.name;
    const junc = junctions.find((j) => j.id === id);
    if (junc) return junc.label || 'Union Node';
    return id;
  };

  // Filtered relationships
  const visibleRelationships = useMemo(() => {
    if (filterType === 'all') return relationships;
    return relationships.filter((r) => {
      const color = r.color || 'blue';
      return color === filterType;
    });
  }, [relationships, filterType]);

  const selectedRel = relationships.find((r) => r.id === selectedRelId);
  const connectingSourceChar = characters.find((c) => c.id === connectingSourceId);
  const connectingSourceJunc = junctions.find((j) => j.id === connectingSourceId);
  const connectingSourceName = connectingSourceChar?.name || connectingSourceJunc?.label || 'Node';

  const editingCharacter = characters.find((c) => c.id === editingCardId);

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
        <div className="flex items-center gap-2">
          <Network className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          {isExpanded && (
            <>
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                {t('relationshipBoard')}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                ({characters.length} {t('charactersCountLabel')} • {junctions.length} {t('unionsCountLabel')} • {relationships.length} {t('linksCountLabel')})
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick instructions / connecting status */}
          {connectingSourceId ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-blue-950/80 border border-blue-800 text-blue-300 text-[10px] font-mono animate-pulse">
              <Link className="w-3 h-3" />
              <span>{t('clickTargetToConnect')} "{connectingSourceName}"</span>
              <button
                type="button"
                onClick={() => {
                  setConnectingSourceId(null);
                  setElasticCursor(null);
                }}
                className="ml-1 text-blue-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : null}

          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xs px-1.5 py-0.5 text-zinc-300 text-[10px] font-mono focus:outline-none focus:border-zinc-600 cursor-pointer"
          >
            <option value="all">{t('allLinks')}</option>
            {Object.entries(COLOR_PALETTE).map(([key]) => (
              <option key={key} value={key}>
                {getColorPaletteLabel(key)}
              </option>
            ))}
          </select>

          {/* Reset Layout */}
          <button
            type="button"
            onClick={resetLayout}
            title={t('autoArrangeTooltip')}
            className="p-1 hover:bg-zinc-800 rounded-xs text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {/* Connect Button (Modal trigger) */}
          {characters.length >= 2 && (
            <button
              type="button"
              onClick={() => {
                setNewSourceId(characters[0]?.id || '');
                setNewTargetId(characters[1]?.id || '');
                setIsCreatingRel(true);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-xs border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-[10px] font-mono transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{t('connect')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* INTERACTIVE BOARD SURFACE (Infinite Free Pan & Focal Zoom)          */}
      {/* ------------------------------------------------------------------- */}
      <div
        ref={boardRef}
        data-testid="relationship-board"
        onMouseDown={handleCanvasMouseDown}
        onPointerMove={handleBoardPointerMove}
        onContextMenu={handleCanvasContextMenu}
        className={`flex-1 relative overflow-hidden select-none touch-none bg-zinc-950 ${
          isDrawingConnection
            ? 'cursor-crosshair'
            : isPanning
            ? 'cursor-grabbing'
            : isSpacePressed
            ? 'cursor-grab'
            : 'cursor-grab'
        }`}
        style={{
          touchAction: 'none',
          backgroundImage:
            'radial-gradient(circle, rgba(63, 63, 70, 0.22) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {characters.length === 0 && junctions.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-zinc-500 gap-2 pointer-events-none">
            <Users className="w-7 h-7 text-zinc-600" />
            <p className="text-xs font-medium text-zinc-400">{t('noCharactersRegistered')}</p>
          </div>
        ) : null}

        {/* Scaled & Translated Layer (Infinite Dimension SVG & Nodes) */}
        <div
          className="absolute top-0 left-0 w-[10000px] h-[10000px]"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            overflow: 'visible',
          }}
        >
          {/* --------------------------------------------------------------- */}
          {/* LAYER 2: SVG CONNECTING LINES (z-10, never clipped by cards)   */}
          {/* --------------------------------------------------------------- */}
          <svg
            className="absolute inset-0 pointer-events-none overflow-visible w-full h-full z-10"
            style={{ overflow: 'visible' }}
          >
            <defs>
              {/* Arrowhead markers for target (end) and source (start) */}
              {Object.entries(COLOR_PALETTE).map(([key, config]) => (
                <React.Fragment key={`markers-${key}`}>
                  <marker
                    id={`arrowhead-end-${key}`}
                    markerWidth="8"
                    markerHeight="6"
                    refX="16"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill={config.stroke} />
                  </marker>
                  <marker
                    id={`arrowhead-start-${key}`}
                    markerWidth="8"
                    markerHeight="6"
                    refX="1"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="8 0, 0 3, 8 6" fill={config.stroke} />
                  </marker>
                </React.Fragment>
              ))}
            </defs>

            {/* Elastic Rubber-Band Connection Line during drawing mode */}
            {connectingSourceId && elasticCursor && (() => {
              const sourceInfo = getNodeInfo(connectingSourceId);
              if (!sourceInfo) return null;
              const pathD = `M ${sourceInfo.cx} ${sourceInfo.cy} L ${elasticCursor.x} ${elasticCursor.y}`;
              return (
                <g className="pointer-events-none">
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="6,4"
                    strokeOpacity="0.9"
                    markerEnd="url(#arrowhead-end-blue)"
                  />
                  <circle
                    cx={elasticCursor.x}
                    cy={elasticCursor.y}
                    r="4.5"
                    fill="#38bdf8"
                  />
                </g>
              );
            })()}

            {/* Render Relationship Lines with Exact Outer Perimeter Anchors */}
            {visibleRelationships.map((rel) => {
              const sourceInfo = getNodeInfo(rel.sourceId);
              const targetInfo = getNodeInfo(rel.targetId);
              if (!sourceInfo || !targetInfo) return null;

              // Natural midpoint between card centers
              const naturalMidX = (sourceInfo.cx + targetInfo.cx) / 2;
              const naturalMidY = (sourceInfo.cy + targetInfo.cy) / 2;

              // Displaced pill center (t = 0.5 peak)
              const px = naturalMidX + (rel.controlOffset?.x ?? 0);
              const py = naturalMidY + (rel.controlOffset?.y ?? 0);

              // Calculate clean perimeter contact endpoints on card outer boundary towards peak
              const startAnchor = getPerimeterAnchor({ cx: px, cy: py }, sourceInfo, 2, 9);
              const endAnchor = getPerimeterAnchor({ cx: px, cy: py }, targetInfo, 4, 9);

              const startX = startAnchor.x;
              const startY = startAnchor.y;
              const endX = endAnchor.x;
              const endY = endAnchor.y;

              // Quadratic Bézier control point (Cx, Cy) ensuring curve passes exactly through (px, py) at t = 0.5:
              // Cx = 2 * Px - (StartX + EndX) / 2
              // Cy = 2 * Py - (StartY + EndY) / 2
              const cx = 2 * px - (startX + endX) / 2;
              const cy = 2 * py - (startY + endY) / 2;
              const pathD = `M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`;

              const isSelected = selectedRelId === rel.id;
              const colorKey = (rel.color || 'blue') as RelationshipColor;
              const strokeColor = COLOR_PALETTE[colorKey]?.stroke || '#3b82f6';
              const strokeConfig = STROKE_STYLES[rel.style || 'solid'];

              // Marker attributes based on direction: directed (A->B), reverse (B->A), bidirectional (A<->B), or none (undirected)
              const isDirected = rel.direction === 'directed';
              const isReverse = rel.direction === 'reverse';
              const isBidirectional = (rel.direction || 'bidirectional') === 'bidirectional';
              const isNone = rel.direction === 'none';

              const markerEnd =
                !isNone && (isDirected || isBidirectional) ? `url(#arrowhead-end-${colorKey})` : undefined;
              const markerStart =
                !isNone && (isReverse || isBidirectional) ? `url(#arrowhead-start-${colorKey})` : undefined;

              return (
                <g key={`rel-${rel.id}`}>
                  {/* Interaction hitbox */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="18"
                    className="cursor-pointer pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRelId(rel.id);
                      setSelectedJunctionId(null);
                      setEditingCardId(null);
                    }}
                  />

                  {/* Rendered line with arrowheads resting on card edge */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isSelected ? '#ffffff' : strokeColor}
                    strokeWidth={isSelected ? 2.5 : 1.75}
                    strokeDasharray={strokeConfig.dash}
                    strokeOpacity={isSelected ? 1 : 0.85}
                    markerEnd={markerEnd}
                    markerStart={markerStart}
                    className="transition-all duration-75"
                  />
                </g>
              );
            })}
          </svg>

          {/* --------------------------------------------------------------- */}
          {/* RELATIONSHIP LABEL PILLS (Draggable to bend curves, z-20)       */}
          {/* --------------------------------------------------------------- */}
          {visibleRelationships.map((rel) => {
            const sourceInfo = getNodeInfo(rel.sourceId);
            const targetInfo = getNodeInfo(rel.targetId);
            if (!sourceInfo || !targetInfo) return null;

            const naturalMidX = (sourceInfo.cx + targetInfo.cx) / 2;
            const naturalMidY = (sourceInfo.cy + targetInfo.cy) / 2;
            const px = naturalMidX + (rel.controlOffset?.x ?? 0);
            const py = naturalMidY + (rel.controlOffset?.y ?? 0);

            const colorKey = (rel.color || 'blue') as RelationshipColor;
            const colorMeta = COLOR_PALETTE[colorKey] || COLOR_PALETTE.blue;
            const isSelected = selectedRelId === rel.id;
            const isPillDragging = draggingRelId === rel.id;
            const dx = targetInfo.cx - sourceInfo.cx;
            const dy = targetInfo.cy - sourceInfo.cy;
            const isCompactPill = Math.abs(dx) < 160 && Math.abs(dy) < 50;

            if (isCompactPill) {
              return (
                <button
                  key={`pill-${rel.id}`}
                  type="button"
                  onPointerDown={(e) => handlePillPointerDown(e, rel)}
                  onPointerMove={handlePillPointerMove}
                  onPointerUp={handlePillPointerUp}
                  onDoubleClick={(e) => handlePillDoubleClick(e, rel.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (justDraggedRelRef.current) return;
                    setSelectedRelId(rel.id);
                    setSelectedJunctionId(null);
                    setEditingCardId(null);
                  }}
                  title={`${rel.label || 'Relationship'} (Drag to bend curve, double-click to straighten)`}
                  style={{
                    position: 'absolute',
                    left: `${px}px`,
                    top: `${py}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`relationship-pill pointer-events-auto w-5 h-5 flex items-center justify-center rounded-xs border text-[9px] font-mono transition shadow-md hover:scale-110 select-none ${
                    isPillDragging
                      ? 'cursor-grabbing scale-110 ring-1 ring-white/50'
                      : 'cursor-grab'
                  } ${
                    isSelected
                      ? 'bg-zinc-800 border-zinc-400 text-white ring-1 ring-zinc-300 font-bold z-30'
                      : `${colorMeta.bg} ${colorMeta.border} ${colorMeta.text} hover:border-zinc-500 z-20`
                  }`}
                >
                  <span className="leading-none text-[9px]">...</span>
                </button>
              );
            }

            return (
              <button
                key={`pill-${rel.id}`}
                type="button"
                onPointerDown={(e) => handlePillPointerDown(e, rel)}
                onPointerMove={handlePillPointerMove}
                onPointerUp={handlePillPointerUp}
                onDoubleClick={(e) => handlePillDoubleClick(e, rel.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (justDraggedRelRef.current) return;
                  setSelectedRelId(rel.id);
                  setSelectedJunctionId(null);
                  setEditingCardId(null);
                }}
                title={`${rel.label || 'Relationship'} (Drag to bend curve, double-click to straighten)`}
                style={{
                  position: 'absolute',
                  left: `${px}px`,
                  top: `${py}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`relationship-pill pointer-events-auto flex items-center gap-1 px-1.5 py-0.5 rounded-xs border text-[9px] font-mono transition shadow-md hover:scale-105 select-none ${
                  isPillDragging
                    ? 'cursor-grabbing scale-105 ring-1 ring-white/50'
                    : 'cursor-grab'
                } ${
                  isSelected
                    ? 'bg-zinc-800 border-zinc-400 text-white ring-1 ring-zinc-300 font-bold z-30'
                    : `${colorMeta.bg} ${colorMeta.border} ${colorMeta.text} hover:border-zinc-500 z-20`
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: colorMeta.stroke }}
                />
                <span className="truncate max-w-[90px]">{rel.label || 'Connected'}</span>
              </button>
            );
          })}

          {/* --------------------------------------------------------------- */}
          {/* LAYER 3: UNION / JUNCTION NODES (z-20)                          */}
          {/* --------------------------------------------------------------- */}
          {junctions.map((junc) => {
            const pos = positions[junc.id] || { x: junc.x, y: junc.y };
            const isSelected = selectedJunctionId === junc.id;
            const isConnectingSource = connectingSourceId === junc.id;
            const linkedStoryline = storylines.find((s) => s.id === junc.storylineId);
            const storylineTheme = linkedStoryline
              ? STORYLINE_THEMES[linkedStoryline.color] || STORYLINE_THEMES.blue
              : null;

            return (
              <div
                key={junc.id}
                title={`${junc.label || 'Union Node'}${
                  linkedStoryline ? ` • Storyline: ${linkedStoryline.title}` : ''
                } (Right-click to link, click to connect)`}
                style={{
                  position: 'absolute',
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                }}
                onPointerDown={(e) => handleNodePointerDown(e, junc.id)}
                onPointerMove={handleNodePointerMove}
                onPointerUp={(e) => handleNodePointerUp(e, junc.id)}
                onContextMenu={(e) => handleNodeContextMenu(e, junc.id)}
                onMouseEnter={() => setHoveredJunctionId(junc.id)}
                onMouseLeave={() => setHoveredJunctionId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (connectingSourceId) {
                    if (connectingSourceId !== junc.id) {
                      createQuickRelationship(connectingSourceId, junc.id);
                    }
                    setConnectingSourceId(null);
                    setElasticCursor(null);
                    return;
                  }
                  setSelectedJunctionId(junc.id);
                  setSelectedRelId(null);
                  setEditingCardId(null);
                }}
                className={`junction-node w-7 h-7 rounded-full border flex items-center justify-center ${
                  isDrawingConnection
                    ? isConnectingSource
                      ? 'cursor-not-allowed'
                      : 'cursor-pointer'
                    : 'cursor-move'
                } shadow-md transition select-none z-20 relative ${
                  isConnectingSource
                    ? 'bg-blue-900 border-blue-400 ring-2 ring-blue-400 animate-pulse'
                    : isSelected
                    ? 'bg-emerald-900 border-emerald-400 ring-1 ring-emerald-400'
                    : storylineTheme
                    ? `${storylineTheme.bg} ${storylineTheme.border} ring-1 ring-white/10 hover:border-emerald-400`
                    : 'bg-zinc-900 border-zinc-700 hover:border-emerald-500 hover:bg-zinc-850'
                }`}
              >
                <GitCommit
                  className={`w-3.5 h-3.5 ${
                    storylineTheme ? storylineTheme.text : 'text-emerald-400'
                  }`}
                />

                {/* Floating Informational Tooltip on Hover */}
                {hoveredJunctionId === junc.id && !selectedJunctionId && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-xs shadow-xl text-[9px] font-mono whitespace-nowrap z-40 pointer-events-none flex items-center gap-1.5"
                  >
                    <span className="text-zinc-200 font-semibold">{junc.label || 'Union Node'}</span>
                    {linkedStoryline && storylineTheme && (
                      <span
                        className={`flex items-center gap-1 px-1 py-0.2 rounded-xs border text-[8px] ${storylineTheme.bg} ${storylineTheme.border} ${storylineTheme.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${storylineTheme.dot}`} />
                        <span>{linkedStoryline.title}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* --------------------------------------------------------------- */}
          {/* LAYER 3: CHARACTER CARDS (z-20, representation of global Cast)  */}
          {/* --------------------------------------------------------------- */}
          {characters.map((char) => {
            const pos = positions[char.id] || { x: 100, y: 100 };
            const isConnectingSource = connectingSourceId === char.id;
            const isSelected = editingCardId === char.id;

            return (
              <div
                key={char.id}
                style={{
                  position: 'absolute',
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: '160px',
                  height: '72px',
                }}
                onPointerDown={(e) => handleNodePointerDown(e, char.id)}
                onPointerMove={handleNodePointerMove}
                onPointerUp={(e) => handleNodePointerUp(e, char.id)}
                onMouseDown={handleCardMouseDown}
                onMouseUp={(e) => handleCardMouseUp(e, char.id)}
                onContextMenu={(e) => handleNodeContextMenu(e, char.id)}
                onClick={(e) => handleCardClick(e, char.id)}
                onDoubleClick={(e) => handleCardDoubleClick(e, char.id)}
                className={`character-card h-[72px] rounded-sm border p-2 bg-zinc-900/95 shadow-lg select-none transition-shadow ${
                  isDrawingConnection
                    ? isConnectingSource
                      ? 'cursor-not-allowed'
                      : 'cursor-pointer'
                    : 'cursor-move'
                } flex flex-col justify-between z-20 ${
                  isConnectingSource
                    ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-blue-950/50'
                    : isSelected
                    ? 'border-zinc-300 ring-1 ring-zinc-300/40 bg-zinc-900'
                    : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-1 pb-1 border-b border-zinc-800/80 mb-1">
                  <span className="text-[10px] font-mono px-1 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400 uppercase tracking-wider truncate max-w-[110px]">
                    {getRoleLabel(char.role, t)}
                  </span>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCardId(char.id);
                      setSelectedRelId(null);
                      setSelectedJunctionId(null);
                    }}
                    title={`Edit "${char.name}" representation`}
                    className="p-0.5 text-zinc-500 hover:text-zinc-200 rounded-xs transition cursor-pointer shrink-0"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Name */}
                <h4 className="text-xs font-semibold text-zinc-200 truncate" title={char.name}>
                  {char.name}
                </h4>

                {/* Summary or Category Tags from Cast */}
                {char.tags && char.tags.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {char.tags.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className="text-[8px] font-mono px-1 rounded-xs bg-zinc-950 border border-zinc-850 text-zinc-400"
                      >
                        {t.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-zinc-500 truncate mt-0.5">
                    {char.summary || 'No summary'}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* RIGHT-CLICK EMPTY CANVAS CONTEXT MENU                             */}
        {/* ----------------------------------------------------------------- */}
        {canvasContextMenu && (
          <div
            className="context-menu-box absolute z-50 w-44 rounded-sm bg-zinc-950 border border-zinc-800 shadow-2xl py-1 text-xs select-none"
            style={{
              left: `${canvasContextMenu.screenX}px`,
              top: `${canvasContextMenu.screenY}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-0.5 text-[8px] font-mono text-zinc-500 uppercase border-b border-zinc-850 mb-0.5">
              {t('canvasActions')}
            </div>
            <button
              type="button"
              onClick={() => {
                setNewCharCoords({ x: canvasContextMenu.worldX, y: canvasContextMenu.worldY });
                setIsCreatingChar(true);
                setCanvasContextMenu(null);
              }}
              className="w-full text-left px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3 h-3 text-zinc-400" />
              <span>{t('addCharacter')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddUnionNode(canvasContextMenu.worldX, canvasContextMenu.worldY)}
              className="w-full text-left px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <GitCommit className="w-3 h-3 text-emerald-400" />
              <span>{t('addUnionNode')}</span>
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* FLOATING VIEWPORT CONTROLS (Bottom Right)                         */}
        {/* ----------------------------------------------------------------- */}
        <div
          className="viewport-controls absolute bottom-3 right-3 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-xs border border-zinc-800 rounded-sm px-1.5 py-1 text-zinc-300 shadow-xl z-30"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            title={t('zoomOut')}
            className="p-1 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-xs transition text-zinc-400 hover:text-white cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetViewport}
            title={t('currentZoom')}
            className="text-[10px] font-mono px-1.5 min-w-[38px] text-center text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xs transition cursor-pointer select-none"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            title={t('zoomIn')}
            className="p-1 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-xs transition text-zinc-400 hover:text-white cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="h-3 w-px bg-zinc-800 mx-0.5" />
          <button
            type="button"
            onClick={handleResetViewport}
            title={t('resetViewport')}
            className="p-1 hover:bg-zinc-800 rounded-xs transition text-zinc-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* RELATIONSHIP LINE CUSTOMIZATION INSPECTOR (Clean Flow Direction)    */}
      {/* ------------------------------------------------------------------- */}
      {selectedRel && (
        <div
          className="absolute top-12 right-4 z-40 w-72 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl p-3 text-xs text-zinc-300 font-sans animate-in fade-in zoom-in-95 duration-100 select-none"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850 mb-2">
            <span className="font-semibold text-zinc-100 text-xs font-mono">
              {t('relationshipInspector')}
            </span>
            <button
              type="button"
              onClick={() => setSelectedRelId(null)}
              className="text-zinc-500 hover:text-zinc-200 transition p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Connection Ends */}
            <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between bg-zinc-900/60 p-1.5 rounded-xs border border-zinc-850">
              <span className="truncate max-w-[90px] text-zinc-200">
                {getNodeLabel(selectedRel.sourceId)}
              </span>
              <div className="flex items-center gap-1 text-zinc-400">
                {selectedRel.direction === 'directed' && <ArrowRight className="w-3 h-3 text-blue-400" />}
                {selectedRel.direction === 'reverse' && <ArrowLeft className="w-3 h-3 text-blue-400" />}
                {(!selectedRel.direction || selectedRel.direction === 'bidirectional') && (
                  <ArrowLeftRight className="w-3 h-3 text-blue-400" />
                )}
                {selectedRel.direction === 'none' && (
                  <span className="text-[10px] text-zinc-500 font-mono font-bold">—</span>
                )}
              </div>
              <span className="truncate max-w-[90px] text-zinc-200">
                {getNodeLabel(selectedRel.targetId)}
              </span>
            </div>

            {/* Label Input */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-mono text-zinc-500 uppercase">Label</label>
              <input
                type="text"
                value={selectedRel.label || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (onUpdateRelationships) {
                    onUpdateRelationships(
                      relationships.map((r) =>
                        r.id === selectedRel.id ? { ...r, label: val } : r
                      )
                    );
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
              />
            </div>

            {/* Clean Flow Direction Selector (Forward, Backward, Bidirectional, None / Undirected) */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-mono text-zinc-500 uppercase">Flow Direction</label>
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    { dir: 'directed', label: 'A → B', sublabel: 'Forward', ariaLabel: 'Directed' },
                    { dir: 'reverse', label: 'B → A', sublabel: 'Backward', ariaLabel: 'Reverse' },
                    { dir: 'bidirectional', label: 'A ↔ B', sublabel: 'Bidirectional', ariaLabel: 'Bidirectional' },
                    { dir: 'none', label: 'None', sublabel: 'Undirected', ariaLabel: 'None' },
                  ] as { dir: RelationshipDirection; label: string; sublabel: string; ariaLabel: string }[]
                ).map(({ dir, label, sublabel, ariaLabel }) => {
                  const isCurrent = (selectedRel.direction || 'bidirectional') === dir;
                  return (
                    <button
                      key={dir}
                      type="button"
                      aria-label={ariaLabel}
                      title={`${label} (${sublabel})`}
                      onClick={() => {
                        if (onUpdateRelationships) {
                          onUpdateRelationships(
                            relationships.map((r) =>
                              r.id === selectedRel.id ? { ...r, direction: dir } : r
                            )
                          );
                        }
                      }}
                      className={`py-1 px-0.5 rounded-xs border text-[9px] font-mono transition cursor-pointer flex flex-col items-center justify-center text-center ${
                        isCurrent
                          ? 'bg-zinc-800 border-zinc-600 text-white font-semibold shadow-xs'
                          : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="font-bold leading-tight">{label}</span>
                      <span className="text-[7.5px] text-zinc-500 leading-tight truncate max-w-full">
                        {sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stroke Style */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-mono text-zinc-500 uppercase">{t('style')}</label>
              <div className="grid grid-cols-3 gap-1">
                {(['solid', 'dashed', 'dotted'] as LineStrokeStyle[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      if (onUpdateRelationships) {
                        onUpdateRelationships(
                          relationships.map((r) =>
                            r.id === selectedRel.id ? { ...r, style: st } : r
                          )
                        );
                      }
                    }}
                    className={`py-1 rounded-xs border text-[9px] font-mono capitalize transition cursor-pointer ${
                      (selectedRel.style || 'solid') === st
                        ? 'bg-zinc-800 border-zinc-600 text-white font-semibold'
                        : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {st === 'solid' ? t('strokeSolid') : st === 'dashed' ? t('strokeDashed') : t('strokeDotted')}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-mono text-zinc-500 uppercase">{t('color')}</label>
              <div className="grid grid-cols-4 gap-1">
                {Object.entries(COLOR_PALETTE).map(([colKey, conf]) => (
                  <button
                    key={colKey}
                    type="button"
                    onClick={() => {
                      if (onUpdateRelationships) {
                        onUpdateRelationships(
                          relationships.map((r) =>
                            r.id === selectedRel.id
                              ? { ...r, color: colKey as RelationshipColor }
                              : r
                          )
                        );
                      }
                    }}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs border text-[9px] font-mono transition cursor-pointer ${
                      (selectedRel.color || 'blue') === colKey
                        ? `${conf.bg} ${conf.border} ${conf.text} font-semibold ring-1 ring-white/30`
                        : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: conf.stroke }}
                    />
                    <span className="capitalize text-[8px] truncate">{colKey}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-mono text-zinc-500 uppercase">Notes</label>
              <textarea
                rows={2}
                value={selectedRel.notes || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (onUpdateRelationships) {
                    onUpdateRelationships(
                      relationships.map((r) =>
                        r.id === selectedRel.id ? { ...r, notes: val } : r
                      )
                    );
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xs p-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 resize-none"
              />
            </div>

            {/* Curve Curvature Reset */}
            {selectedRel.controlOffset && (selectedRel.controlOffset.x !== 0 || selectedRel.controlOffset.y !== 0) && (
              <div className="pt-1 flex items-center justify-between text-[9px] font-mono text-zinc-400 bg-zinc-900/40 p-1.5 rounded-xs border border-zinc-850">
                <span className="truncate">Curve bent: ({selectedRel.controlOffset.x}, {selectedRel.controlOffset.y})</span>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateRelationships) {
                      onUpdateRelationships(
                        relationships.map((r) =>
                          r.id === selectedRel.id ? { ...r, controlOffset: undefined } : r
                        )
                      );
                    }
                  }}
                  className="px-1.5 py-0.5 rounded-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer text-[8px]"
                >
                  Straighten
                </button>
              </div>
            )}

            {/* Delete Connection */}
            <div className="pt-1 border-t border-zinc-850 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (onUpdateRelationships) {
                    onUpdateRelationships(relationships.filter((r) => r.id !== selectedRel.id));
                  }
                  setSelectedRelId(null);
                }}
                className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-xs hover:bg-zinc-900 transition cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t('deleteConnection')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* UNION NODE INSPECTOR (Storyline Linking Support)                    */}
      {/* ------------------------------------------------------------------- */}
      {selectedJunctionId && (() => {
        const junc = junctions.find((j) => j.id === selectedJunctionId);
        if (!junc) return null;
        return (
          <div
            className="absolute top-12 right-4 z-40 w-72 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl p-3 text-xs text-zinc-300 font-sans select-none"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850 mb-2">
              <div className="flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-zinc-100 text-xs font-mono">
                  Union Node Inspector
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJunctionId(null)}
                className="text-zinc-500 hover:text-zinc-200 transition p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Node Name */}
              <div className="space-y-0.5">
                <label className="text-[9px] font-mono text-zinc-500 uppercase">Node Name</label>
                <input
                  type="text"
                  value={junc.label || ''}
                  placeholder="e.g. Stark-Tully Union, Northern Alliance"
                  onChange={(e) => {
                    const val = e.target.value;
                    updateJunctions(
                      junctions.map((j) => (j.id === junc.id ? { ...j, label: val } : j))
                    );
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Storyline Linkage Selector */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase">
                    Linked Storyline / Plot Thread
                  </label>
                  <GitMerge className="w-3 h-3 text-zinc-500" />
                </div>
                <select
                  value={junc.storylineId || ''}
                  onChange={(e) => {
                    const val = e.target.value || undefined;
                    updateJunctions(
                      junctions.map((j) => (j.id === junc.id ? { ...j, storylineId: val } : j))
                    );
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
                >
                  <option value="">No Storyline (Independent)</option>
                  {storylines.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.title}
                    </option>
                  ))}
                </select>
                {junc.storylineId && (() => {
                  const st = storylines.find((s) => s.id === junc.storylineId);
                  if (!st) return null;
                  const theme = STORYLINE_THEMES[st.color] || STORYLINE_THEMES.blue;
                  return (
                    <div
                      className={`mt-1 flex items-center gap-1.5 px-2 py-1 rounded-xs border text-[10px] ${theme.bg} ${theme.border} ${theme.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                      <span className="truncate">{st.title}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Delete Union Action */}
              <div className="pt-1.5 border-t border-zinc-850 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteJunction(junc.id)}
                  className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-xs hover:bg-zinc-900 transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t('deleteUnion')}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ------------------------------------------------------------------- */}
      {/* CHARACTER REPRESENTATION DRAWER (No Duplicate Global Editing)       */}
      {/* ------------------------------------------------------------------- */}
      {editingCharacter && (
        <div
          className="absolute top-0 right-0 h-full w-80 bg-zinc-950 border-l border-zinc-800 shadow-2xl p-3 z-50 overflow-y-auto select-none"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-850 mb-3">
            <span className="font-semibold text-zinc-100 text-xs font-mono">
              Graph Node Representation
            </span>
            <button
              type="button"
              onClick={() => setEditingCardId(null)}
              className="text-zinc-500 hover:text-zinc-200 transition p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Linked Character Dropdown Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-400 uppercase">
                Linked Character (From Project Cast)
              </label>
              <select
                value={editingCharacter.id}
                onChange={(e) => handleReassignCardCharacter(editingCharacter.id, e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({getRoleLabel(c.role, t)})
                  </option>
                ))}
              </select>
            </div>

            {/* Read-Only Cast Information Card */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xs p-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
                <span className="font-semibold text-zinc-100">{editingCharacter.name}</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400 uppercase">
                  {getRoleLabel(editingCharacter.role, t)}
                </span>
              </div>

              {editingCharacter.tags && editingCharacter.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {editingCharacter.tags.map((t) => (
                    <span
                      key={t.id}
                      className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-zinc-950 border border-zinc-800 text-zinc-400"
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-[11px] text-zinc-400 leading-relaxed">
                {editingCharacter.summary || t('noSummaryCharacter')}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-850 flex justify-end">
              <button
                type="button"
                onClick={() => setEditingCardId(null)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xs text-[10px] font-mono transition cursor-pointer"
              >
                {t('done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* QUICK CHARACTER PLACEMENT MODAL                                     */}
      {/* ------------------------------------------------------------------- */}
      {isCreatingChar && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsCreatingChar(false)}
        >
          <div
            className="w-80 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl p-4 text-xs text-zinc-300 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-850 mb-3">
              <span className="font-semibold text-zinc-100 text-xs font-mono">
                {t('placeCharacterAtCursor')}
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingChar(false)}
                className="text-zinc-500 hover:text-zinc-200 transition p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCharName.trim()) return;

                const newChar: CharacterItem = {
                  id: `char-${Date.now()}`,
                  name: newCharName.trim(),
                  role: newCharRole,
                  summary: newCharSummary.trim(),
                };

                if (onAddCharacter) {
                  onAddCharacter(newChar);
                } else if (onUpdateCharacters) {
                  onUpdateCharacters([...characters, newChar]);
                }

                setPositions((prev) => ({
                  ...prev,
                  [newChar.id]: { x: newCharCoords.x - 80, y: newCharCoords.y - 42 },
                }));

                setNewCharName('');
                setNewCharSummary('');
                setIsCreatingChar(false);
              }}
              className="space-y-2.5"
            >
              <div className="space-y-0.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">{t('name')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Kaelen"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">{t('role')}</label>
                <input
                  type="text"
                  value={newCharRole}
                  onChange={(e) => setNewCharRole(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">{t('summary')}</label>
                <textarea
                  rows={2}
                  placeholder={t('briefRolePlaceholder')}
                  value={newCharSummary}
                  onChange={(e) => setNewCharSummary(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xs p-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingChar(false)}
                  className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded-xs transition cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xs text-[10px] font-mono transition cursor-pointer"
                >
                  {t('placeCharacter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MANUAL CONNECTION CREATOR MODAL                                     */}
      {/* ------------------------------------------------------------------- */}
      {isCreatingRel && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsCreatingRel(false)}
        >
          <div
            className="w-80 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl p-4 text-xs text-zinc-300 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-850 mb-3">
              <span className="font-semibold text-zinc-100 text-xs font-mono">
                Define Character Connection
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingRel(false)}
                className="text-zinc-500 hover:text-zinc-200 transition p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newSourceId || !newTargetId || newSourceId === newTargetId) return;

                const newRel: CharacterRelationship = {
                  id: `rel-${Date.now()}`,
                  sourceId: newSourceId,
                  targetId: newTargetId,
                  type: newType,
                  label: newLabel.trim() || 'Connected',
                  style: newStyle,
                  color: newColor,
                  direction: newDirection,
                  notes: newNotes.trim(),
                };

                if (onUpdateRelationships) {
                  onUpdateRelationships([...relationships, newRel]);
                }

                setIsCreatingRel(false);
                setNewLabel('');
                setNewNotes('');
              }}
              className="space-y-2.5"
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase">From</label>
                  <select
                    value={newSourceId}
                    onChange={(e) => setNewSourceId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    {junctions.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.label || 'Union Node'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase">To</label>
                  <select
                    value={newTargetId}
                    onChange={(e) => setNewTargetId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    {junctions.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.label || 'Union Node'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-mono text-zinc-400 uppercase">Label</label>
                <input
                  type="text"
                  placeholder="e.g. Sworn Brothers, Nemesis..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase">Style</label>
                  <select
                    value={newStyle}
                    onChange={(e) => setNewStyle(e.target.value as LineStrokeStyle)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase">Color</label>
                  <select
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value as RelationshipColor)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    {Object.entries(COLOR_PALETTE).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingRel(false)}
                  className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xs text-[10px] font-mono transition cursor-pointer"
                >
                  Create Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(RelationshipGraphViewComponent);
