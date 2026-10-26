import { useState, useRef, useEffect, memo } from 'react';
import { Editor } from '@tiptap/react';
import { Highlighter, ChevronDown, Pipette } from 'lucide-react';
import { HIGHLIGHT_COLORS } from './extensions';
import { DarkColorPicker } from '../../common/DarkColorPicker';

interface HighlightColorPickerProps {
  editor: Editor | null;
  isEditorReady: boolean;
  highlightColor: string;
  onHighlightColorChange: (color: string) => void;
}

function HighlightColorPicker({
  editor,
  isEditorReady,
  highlightColor,
  onHighlightColorChange,
}: HighlightColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCustomOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsCustomOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleApplyColor = (color: string) => {
    onHighlightColorChange(color);
    setIsOpen(false);
    setIsCustomOpen(false);
    editor?.chain().focus().setHighlight({ color }).run();
  };

  const handleClearColor = () => {
    setIsOpen(false);
    setIsCustomOpen(false);
    editor?.chain().focus().unsetHighlight().run();
  };

  return (
    <div className="relative flex items-center shrink-0" ref={containerRef}>
      <button
        type="button"
        disabled={!isEditorReady}
        title={`Highlight - Current Color: ${highlightColor}`}
        onClick={() => {
          if (!isEditorReady) return;
          if (editor.isActive('highlight')) {
            editor.chain().focus().unsetHighlight().run();
          } else {
            editor.chain().focus().setHighlight({ color: highlightColor }).run();
          }
        }}
        className={`h-7 px-1.5 rounded-l-xs transition flex flex-col items-center justify-center cursor-pointer select-none ${
          !isEditorReady
            ? 'opacity-30 cursor-not-allowed text-zinc-500'
            : isEditorReady && editor.isActive('highlight')
            ? 'bg-zinc-800 text-zinc-100 border-l border-t border-b border-zinc-700/80 shadow-xs'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/80 border border-transparent'
        }`}
      >
        <Highlighter className="w-3.5 h-3.5" />
        <span
          className="w-3.5 h-0.5 mt-0.5 rounded-full"
          style={{ backgroundColor: highlightColor }}
        />
      </button>
      <button
        type="button"
        disabled={!isEditorReady}
        title="Highlight Color Palette"
        onClick={() => {
          setIsOpen((prev) => {
            if (prev) setIsCustomOpen(false);
            return !prev;
          });
        }}
        className={`h-7 px-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850/80 rounded-r-xs border-r border-t border-b border-zinc-800/80 cursor-pointer flex items-center justify-center transition ${
          isOpen ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : ''
        }`}
      >
        <ChevronDown className="w-2.5 h-2.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 p-2.5 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl z-50 w-52 space-y-2.5 select-none ring-1 ring-black/80 backdrop-blur-md">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Highlight Color</span>
            <span
              className="w-2.5 h-2.5 rounded-full border border-zinc-700"
              style={{ backgroundColor: highlightColor }}
            />
          </div>
          <div className="grid grid-cols-6 gap-1">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.name}
                onClick={() => handleApplyColor(c.hex)}
                className={`w-6 h-5.5 rounded-xs border transition hover:scale-115 flex items-center justify-center cursor-pointer ${
                  highlightColor.toLowerCase() === c.hex.toLowerCase()
                    ? 'border-white scale-110 shadow-xs ring-1 ring-zinc-400'
                    : 'border-zinc-800 hover:border-zinc-600'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[10px]">
            <button
              type="button"
              onClick={handleClearColor}
              className="px-1.5 py-0.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-850/80 rounded-xs text-[10px] font-mono transition cursor-pointer"
            >
              No Color
            </button>
            <button
              type="button"
              onClick={() => setIsCustomOpen((prev) => !prev)}
              className={`relative flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-zinc-950 border transition cursor-pointer group shadow-inner ${
                isCustomOpen
                  ? 'border-zinc-500 bg-zinc-900'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
              title="Pick exact custom color"
            >
              <Pipette className="w-3 h-3 text-zinc-400" />
              <span
                className="w-2.5 h-2.5 rounded-full border border-zinc-700/80 shadow-xs shrink-0"
                style={{ backgroundColor: highlightColor }}
              />
              <span className="font-mono text-[10px] text-zinc-300 group-hover:text-white uppercase">
                {highlightColor}
              </span>
            </button>
          </div>

          {isCustomOpen && (
            <DarkColorPicker
              color={highlightColor}
              title="Exact Highlight Color"
              onChange={(hex) => {
                onHighlightColorChange(hex);
                editor?.chain().focus().setHighlight({ color: hex }).run();
              }}
              onClose={() => setIsCustomOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default memo(HighlightColorPicker);
