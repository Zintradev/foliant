import { memo } from 'react';
import { PlusCircle } from 'lucide-react';

interface DockEmptyStripProps {
  type: 'single' | 'top' | 'bottom';
}

function DockEmptyStrip({ type }: DockEmptyStripProps) {
  if (type === 'top') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-zinc-500 gap-1.5">
        <PlusCircle className="w-5 h-5 text-zinc-600" />
        <p className="text-xs font-medium text-zinc-300">Empty Top Strip</p>
        <p className="text-[10px] text-zinc-500 max-w-[150px] leading-relaxed">
          Click + above or drag tabs here.
        </p>
      </div>
    );
  }

  if (type === 'bottom') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-zinc-500 gap-1.5">
        <PlusCircle className="w-5 h-5 text-zinc-600" />
        <p className="text-xs font-medium text-zinc-300">Empty Bottom Strip</p>
        <p className="text-[10px] text-zinc-500 max-w-[150px] leading-relaxed">
          Click + above or drag tabs here to view side by side.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center text-zinc-500 gap-2">
      <PlusCircle className="w-6 h-6 text-zinc-600" />
      <p className="text-xs font-medium text-zinc-300">Empty Panel</p>
      <p className="text-[11px] text-zinc-500 max-w-[170px] leading-relaxed">
        Click + above or drag any tab header here to dock it in this panel.
      </p>
    </div>
  );
}

export default memo(DockEmptyStrip);
