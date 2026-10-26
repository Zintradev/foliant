import React, { useState, useEffect, useRef, useCallback, memo, RefObject } from 'react';
import { X, Check } from 'lucide-react';
import {
  hexToHsv,
  hsvToHex,
  hsvToRgb,
  rgbToHex,
  QUICK_PRESETS,
} from './colorConversions';
import { useColorPickerPlacement } from './useColorPickerPlacement';

export interface DarkColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
  onClose?: () => void;
  title?: string;
  className?: string;
  standalone?: boolean;
}

const SatValBox = memo(function SatValBox({
  satValRef,
  hsv,
  currentHex,
  onMouseDown,
}: {
  satValRef: RefObject<HTMLDivElement | null>;
  hsv: { h: number; s: number; v: number };
  currentHex: string;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      ref={satValRef}
      onMouseDown={onMouseDown}
      className="relative w-full h-28 rounded-sm cursor-crosshair overflow-hidden select-none border border-zinc-800 shadow-inner"
      style={{
        backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
        backgroundImage: `
          linear-gradient(to bottom, transparent 0%, #000 100%),
          linear-gradient(to right, #fff 0%, transparent 100%)
        `,
      }}
    >
      <div
        className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_2px_1px_rgba(0,0,0,0.85)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: `${Math.round(hsv.s * 100)}%`,
          top: `${Math.round((1 - hsv.v) * 100)}%`,
          backgroundColor: currentHex,
        }}
      />
    </div>
  );
});

const HueSlider = memo(function HueSlider({
  hueRef,
  hue,
  onMouseDown,
}: {
  hueRef: RefObject<HTMLDivElement | null>;
  hue: number;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="space-y-1">
      <div
        ref={hueRef}
        onMouseDown={onMouseDown}
        className="relative w-full h-3 rounded-full cursor-pointer select-none border border-zinc-800 shadow-inner"
        style={{
          background:
            'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
        }}
      >
        <div
          className="absolute top-0 bottom-0 w-2.5 -translate-x-1/2 bg-white border border-black/40 rounded-xs shadow-xs pointer-events-none"
          style={{
            left: `${Math.round((hue / 360) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
});

const ColorInputs = memo(function ColorInputs({
  currentHex,
  hexInput,
  currentRgb,
  onHexInputChange,
  onRgbChange,
}: {
  currentHex: string;
  hexInput: string;
  currentRgb: { r: number; g: number; b: number };
  onHexInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRgbChange: (channel: 'r' | 'g' | 'b', valStr: string) => void;
}) {
  return (
    <div className="space-y-2 pt-1 border-t border-zinc-800">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-sm border border-zinc-700 shadow-inner shrink-0"
          style={{ backgroundColor: currentHex }}
          title={currentHex}
        />
        <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-emerald-500 rounded-sm px-2 py-1 shadow-inner transition">
          <span className="text-zinc-500 font-mono text-[10px] select-none mr-0.5">#</span>
          <input
            type="text"
            maxLength={7}
            value={hexInput.replace(/^#/, '')}
            onChange={onHexInputChange}
            className="w-full bg-transparent text-zinc-100 font-mono text-[11px] uppercase tracking-wider focus:outline-hidden"
            placeholder="FFFFFF"
            title="Hex Color"
          />
        </div>
      </div>

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
              onChange={(e) => onRgbChange(channel, e.target.value)}
              className="w-full bg-transparent text-zinc-200 font-mono text-[10px] focus:outline-hidden"
            />
          </div>
        ))}
      </div>
    </div>
  );
});

const PresetsGrid = memo(function PresetsGrid({
  currentHex,
  onSelectPreset,
}: {
  currentHex: string;
  onSelectPreset: (hex: string) => void;
}) {
  return (
    <div className="pt-1.5 border-t border-zinc-800 space-y-1">
      <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Presets</div>
      <div className="grid grid-cols-8 gap-1">
        {QUICK_PRESETS.map((p) => {
          const isSelected = currentHex.toLowerCase() === p.toLowerCase();
          return (
            <button
              key={p}
              type="button"
              onClick={() => onSelectPreset(p)}
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
  );
});

export const DarkColorPicker = memo(function DarkColorPicker({
  color,
  onChange,
  onClose,
  title = 'Custom Color',
  className = '',
  standalone = false,
}: DarkColorPickerProps) {
  const [hsv, setHsv] = useState(() => hexToHsv(color || '#ffffff'));
  const [hexInput, setHexInput] = useState(() => (color || '#ffffff').toUpperCase());

  const containerRef = useRef<HTMLDivElement>(null);
  const satValRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingSatVal = useRef(false);
  const isDraggingHue = useRef(false);

  const placementStyle = useColorPickerPlacement(containerRef, standalone);

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

  const updateSatVal = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!satValRef.current) return;
      const rect = satValRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      applyHsv({ ...hsv, s: x / rect.width, v: 1 - y / rect.height });
    },
    [hsv, applyHsv]
  );

  const handleSatValMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSatVal.current = true;
    updateSatVal(e);

    const onMouseMove = (ev: MouseEvent) => {
      if (isDraggingSatVal.current) updateSatVal(ev);
    };
    const onMouseUp = () => {
      isDraggingSatVal.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

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
      if (isDraggingHue.current) updateHue(ev);
    };
    const onMouseUp = () => {
      isDraggingHue.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    const cleaned = val.startsWith('#') ? val : `#${val}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
      setHsv(hexToHsv(cleaned));
      onChange(cleaned.toUpperCase());
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', valStr: string) => {
    const num = Math.max(0, Math.min(255, parseInt(valStr, 10) || 0));
    const nextRgb = { ...currentRgb, [channel]: num };
    const nextHex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b).toUpperCase();
    setHsv(hexToHsv(nextHex));
    setHexInput(nextHex);
    onChange(nextHex);
  };

  const handleSelectPreset = useCallback(
    (preset: string) => {
      applyHsv(hexToHsv(preset));
    },
    [applyHsv]
  );

  return (
    <div
      ref={containerRef}
      style={standalone ? undefined : placementStyle}
      className={`bg-zinc-900 border border-zinc-800 rounded-md shadow-2xl p-3 w-56 max-w-[calc(100vw-24px)] space-y-3 select-none backdrop-blur-md text-zinc-100 z-50 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
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

      <SatValBox
        satValRef={satValRef}
        hsv={hsv}
        currentHex={currentHex}
        onMouseDown={handleSatValMouseDown}
      />

      <HueSlider
        hueRef={hueRef}
        hue={hsv.h}
        onMouseDown={handleHueMouseDown}
      />

      <ColorInputs
        currentHex={currentHex}
        hexInput={hexInput}
        currentRgb={currentRgb}
        onHexInputChange={handleHexInputChange}
        onRgbChange={handleRgbChange}
      />

      <PresetsGrid
        currentHex={currentHex}
        onSelectPreset={handleSelectPreset}
      />
    </div>
  );
});

export default DarkColorPicker;
