import { useState, useCallback, useEffect, useRef } from 'react';

interface SplitterProps {
  /** Called with delta in pixels whenever dragged. */
  onResize: (delta: number) => void;
  /** Called when dragging starts */
  onResizeStart?: () => void;
  /** Called when dragging finishes */
  onResizeEnd?: () => void;
  /** Optional callback to reset width to default on double click */
  onReset?: () => void;
  /** Optional tooltip or aria-label */
  label?: string;
}

export default function Splitter({
  onResize,
  onResizeStart,
  onResizeEnd,
  onReset,
  label = 'Resize panel',
}: SplitterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number>(0);
  const onResizeRef = useRef(onResize);
  const onResizeEndRef = useRef(onResizeEnd);

  // Keep callback refs fresh
  useEffect(() => {
    onResizeRef.current = onResize;
    onResizeEndRef.current = onResizeEnd;
  });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;
      onResizeStart?.();

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startXRef.current;
        startXRef.current = moveEvent.clientX;
        onResizeRef.current(delta);
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        onResizeEndRef.current?.();
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [onResizeStart]
  );

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={label}
      onPointerDown={handlePointerDown}
      onDoubleClick={onReset}
      className={`group relative w-1.5 shrink-0 cursor-col-resize select-none transition-colors z-20 flex items-center justify-center ${
        isDragging ? 'bg-zinc-800' : 'hover:bg-zinc-850'
      }`}
      title={`${label} (Double-click to reset)`}
    >
      {/* Visual divider line */}
      <div
        className={`w-[1px] h-full transition-colors ${
          isDragging
            ? 'bg-zinc-400'
            : 'bg-zinc-800 group-hover:bg-zinc-600'
        }`}
      />
    </div>
  );
}
