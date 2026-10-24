import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { X, Check } from 'lucide-react';

export interface DarkColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
  onClose?: () => void;
  title?: string;
  className?: string;
  standalone?: boolean;
}

// Color conversion helpers
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num) || clean.length !== 6) {
    return { r: 255, g: 255, b: 255 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / diff) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / diff + 2;
    } else {
      h = (rNorm - gNorm) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return { h, s, v };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = c;
    gPrime = x;
    bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = x;
    gPrime = c;
    bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0;
    gPrime = c;
    bPrime = x;
  } else if (h >= 180 && h < 240) {
    rPrime = 0;
    gPrime = x;
    bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x;
    gPrime = 0;
    bPrime = c;
  } else {
    rPrime = c;
    gPrime = 0;
    bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsv(r, g, b);
}

export function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

const QUICK_PRESETS = [
  '#ffffff',
  '#f87171',
  '#fb923c',
  '#facc15',
  '#4ade80',
  '#22d3ee',
  '#818cf8',
  '#c084fc',
];

export const DarkColorPicker: React.FC<DarkColorPickerProps> = ({
  color,
  onChange,
  onClose,
  title = 'Custom Color',
  className = '',
  standalone = false,
}) => {
  const [hsv, setHsv] = useState(() => hexToHsv(color || '#ffffff'));
  const [hexInput, setHexInput] = useState(() => (color || '#ffffff').toUpperCase());

  const containerRef = useRef<HTMLDivElement>(null);
  const satValRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingSatVal = useRef(false);
  const isDraggingHue = useRef(false);

  const [placementStyle, setPlacementStyle] = useState<React.CSSProperties>(() =>
    standalone ? { position: 'relative', opacity: 1 } : { position: 'absolute', opacity: 0 }
  );

  // Calculate smart placement towards available space respecting container boundaries
  useLayoutEffect(() => {
    if (standalone) {
      setPlacementStyle({ position: 'relative', opacity: 1 });
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const updatePosition = () => {
      const parent = el.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const pickerRect = el.getBoundingClientRect();
      const pickerWidth = pickerRect.width || 208;
      const pickerHeight = pickerRect.height || 340;
      const margin = 8;
      const viewportPadding = 12;

      // Find the main editor container boundary (stops before the right dock panel)
      const containerEl = el.closest('main') || el.closest('.overflow-y-auto');
      const containerRect = containerEl
        ? containerEl.getBoundingClientRect()
        : { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight };

      const maxRightBoundary = Math.min(window.innerWidth - viewportPadding, containerRect.right - viewportPadding);
      const minLeftBoundary = Math.max(viewportPadding, containerRect.left + viewportPadding);
      const maxBottomBoundary = Math.min(window.innerHeight - viewportPadding, containerRect.bottom - viewportPadding);
      const minTopBoundary = Math.max(viewportPadding, containerRect.top + viewportPadding);

      const spaceRight = maxRightBoundary - parentRect.right;
      const spaceLeft = parentRect.left - minLeftBoundary;
      const spaceBottom = maxBottomBoundary - parentRect.bottom;
      const spaceTop = parentRect.top - minTopBoundary;

      const style: React.CSSProperties = {
        position: 'absolute',
        opacity: 1,
        transition: 'opacity 0.12s ease-out',
      };

      // 1. Horizontal determination: only grow right if there is genuine space before the right panel
      if (spaceRight >= pickerWidth + margin) {
        // Space available on the right of the dropdown
        style.left = '100%';
        style.marginLeft = `${margin}px`;
      } else if (spaceLeft >= pickerWidth + margin) {
        // Space available on the left of the dropdown
        style.right = '100%';
        style.marginRight = `${margin}px`;
      } else {
        // Restricted on both sides: grow directly below (or above) the dropdown
        if (spaceBottom >= pickerHeight + margin || spaceBottom >= spaceTop) {
          style.top = '100%';
          style.marginTop = `${margin}px`;
        } else {
          style.bottom = '100%';
          style.marginBottom = `${margin}px`;
        }

        // Horizontal alignment when stacked: ensure it stays within container boundaries
        if (parentRect.left + pickerWidth > maxRightBoundary) {
          // Align with right edge of dropdown so it expands to the left
          style.right = '0px';
          style.left = 'auto';
        } else {
          style.left = '0px';
          style.right = 'auto';
        }
      }

      // 2. Vertical adjustment when positioned on the left or right of dropdown
      if (style.left === '100%' || style.right === '100%') {
        const bottomEdge = parentRect.top + pickerHeight;
        if (bottomEdge > maxBottomBoundary) {
          const overflowY = bottomEdge - maxBottomBoundary;
          style.top = `-${Math.max(0, overflowY)}px`;
        } else {
          style.top = '0px';
        }
      }

      setPlacementStyle(style);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, []);

  // Sync state if color changes externally
  useEffect(() => {
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      setHsv(hexToHsv(color));
      setHexInput(color.toUpperCase());
    }
  }, [color]);

  const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v).toUpperCase();

  const applyHsv = useCallback(
    (newHsv: { h: number; s: number; v: number }) => {
      setHsv(newHsv);
      const nextHex = hsvToHex(newHsv.h, newHsv.s, newHsv.v).toUpperCase();
      setHexInput(nextHex);
      onChange(nextHex);
    },
    [onChange]
  );

  // Saturation / Value Drag Handling
  const updateSatVal = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!satValRef.current) return;
      const rect = satValRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

      const s = x / rect.width;
      const v = 1 - y / rect.height;

      applyHsv({ ...hsv, s, v });
    },
    [hsv, applyHsv]
  );

  const handleSatValMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSatVal.current = true;
    updateSatVal(e);

    const onMouseMove = (ev: MouseEvent) => {
      if (isDraggingSatVal.current) {
        updateSatVal(ev);
      }
    };
    const onMouseUp = () => {
      isDraggingSatVal.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Hue Drag Handling
  const updateHue = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!hueRef.current) return;
      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const h = Math.round((x / rect.width) * 360) % 360;

      applyHsv({ ...hsv, h });
    },
    [hsv, applyHsv]
  );

  const handleHueMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingHue.current = true;
    updateHue(e);

    const onMouseMove = (ev: MouseEvent) => {
      if (isDraggingHue.current) {
        updateHue(ev);
      }
    };
    const onMouseUp = () => {
      isDraggingHue.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Hex input change
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    const cleaned = val.startsWith('#') ? val : `#${val}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
      setHsv(hexToHsv(cleaned));
      onChange(cleaned.toUpperCase());
    }
  };

  // RGB input change
  const handleRgbChange = (channel: 'r' | 'g' | 'b', valStr: string) => {
    const num = Math.max(0, Math.min(255, parseInt(valStr, 10) || 0));
    const nextRgb = { ...currentRgb, [channel]: num };
    const nextHex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b).toUpperCase();
    setHsv(hexToHsv(nextHex));
    setHexInput(nextHex);
    onChange(nextHex);
  };

  return (
    <div
      ref={containerRef}
      style={standalone ? undefined : placementStyle}
      className={`bg-zinc-900 border border-zinc-800 rounded-md shadow-2xl p-3 w-56 max-w-[calc(100vw-24px)] space-y-3 select-none backdrop-blur-md text-zinc-100 z-50 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
        <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider font-semibold">
          {title}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 -mr-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-sm transition cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2D Saturation & Brightness Gradient Box */}
      <div
        ref={satValRef}
        onMouseDown={handleSatValMouseDown}
        className="relative w-full h-28 rounded-sm cursor-crosshair overflow-hidden select-none border border-zinc-800 shadow-inner"
        style={{
          backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
          backgroundImage: `
            linear-gradient(to bottom, transparent 0%, #000 100%),
            linear-gradient(to right, #fff 0%, transparent 100%)
          `,
        }}
      >
        {/* Reticle / Handle */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_2px_1px_rgba(0,0,0,0.85)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${Math.round(hsv.s * 100)}%`,
            top: `${Math.round((1 - hsv.v) * 100)}%`,
            backgroundColor: currentHex,
          }}
        />
      </div>

      {/* Hue Slider Bar */}
      <div className="space-y-1">
        <div
          ref={hueRef}
          onMouseDown={handleHueMouseDown}
          className="relative w-full h-3 rounded-full cursor-pointer select-none border border-zinc-800 shadow-inner"
          style={{
            background:
              'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
          }}
        >
          <div
            className="absolute top-0 bottom-0 w-2.5 -translate-x-1/2 bg-white border border-black/40 rounded-xs shadow-xs pointer-events-none"
            style={{
              left: `${Math.round((hsv.h / 360) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Color Preview & Hex / RGB Inputs */}
      <div className="space-y-2 pt-1 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          {/* Live Preview Swatch */}
          <div
            className="w-7 h-7 rounded-sm border border-zinc-700 shadow-inner shrink-0"
            style={{ backgroundColor: currentHex }}
            title={currentHex}
          />

          {/* Hex Input */}
          <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-emerald-500 rounded-sm px-2 py-1 shadow-inner transition">
            <span className="text-zinc-500 font-mono text-[10px] select-none mr-0.5">#</span>
            <input
              type="text"
              maxLength={7}
              value={hexInput.replace(/^#/, '')}
              onChange={handleHexInputChange}
              className="w-full bg-transparent text-zinc-100 font-mono text-[11px] uppercase tracking-wider focus:outline-hidden"
              placeholder="FFFFFF"
              title="Hex Color"
            />
          </div>
        </div>

        {/* RGB Channels */}
        <div className="grid grid-cols-3 gap-1">
          {(['r', 'g', 'b'] as const).map((channel) => (
            <div
              key={channel}
              className="flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-emerald-500 rounded-sm px-1.5 py-0.5 shadow-inner transition"
            >
              <span className="text-zinc-500 font-mono text-[9px] uppercase select-none mr-1">
                {channel}
              </span>
              <input
                type="number"
                min={0}
                max={255}
                value={currentRgb[channel]}
                onChange={(e) => handleRgbChange(channel, e.target.value)}
                className="w-full bg-transparent text-zinc-200 font-mono text-[10px] focus:outline-hidden"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Color Swatches */}
      <div className="pt-1.5 border-t border-zinc-800 space-y-1">
        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
          Presets
        </div>
        <div className="grid grid-cols-8 gap-1">
          {QUICK_PRESETS.map((p) => {
            const isSelected = currentHex.toLowerCase() === p.toLowerCase();
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  applyHsv(hexToHsv(p));
                }}
                className={`w-5 h-5 rounded-xs border transition hover:scale-115 flex items-center justify-center cursor-pointer ${
                  isSelected
                    ? 'border-white scale-110 shadow-xs ring-1 ring-zinc-400'
                    : 'border-zinc-800 hover:border-zinc-600'
                }`}
                style={{ backgroundColor: p }}
                title={p}
              >
                {isSelected && <Check className="w-2.5 h-2.5 text-zinc-950 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
