import React, { useState, useRef, useEffect, memo } from 'react';

export interface HorizontalSplitterProps {
  onResize: (deltaY: number) => void;
  onReset?: () => void;
  label?: string;
}

/**
 * Resizable horizontal splitter handle between the top and bottom dock strips.
 */
function HorizontalSplitterComponent({
  onResize,
  onReset,
  label = 'Resize strips',
}: HorizontalSplitterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const onResizeRef = useRef(onResize);

  useEffect(() => {
    onResizeRef.current = onResize;
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startYRef.current;
      startYRef.current = moveEvent.clientY;
      onResizeRef.current(delta);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={label}
      onPointerDown={handlePointerDown}
      onDoubleClick={onReset}
      className={`group relative h-1.5 shrink-0 cursor-row-resize select-none transition-colors z-20 flex items-center justify-center ${
        isDragging ? 'bg-zinc-800' : 'bg-zinc-900/90 hover:bg-zinc-800'
      }`}
      title={`${label} (Double-click to balance)`}
    >
      <div
        className={`h-[1px] w-full transition-colors ${
          isDragging ? 'bg-zinc-400' : 'bg-zinc-800 group-hover:bg-zinc-600'
        }`}
      />
      <div className="absolute w-8 h-1 rounded-full bg-zinc-700/60 group-hover:bg-zinc-400 transition" />
    </div>
  );
}

export default memo(HorizontalSplitterComponent);
