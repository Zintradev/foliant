import { Palette } from 'lucide-react';
import MoodboardBlock from '../context/MoodboardBlock';

export default function MoodboardStudioView() {
  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 select-none overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Palette className="w-4 h-4 text-zinc-200" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
              Visual Moodboard Studio
            </h1>
            <p className="text-[11px] text-zinc-400">
              Collect inspiring setting artwork, costume designs, and character face-claims
            </p>
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950">
        <div className="w-full max-w-[1800px] mx-auto h-full">
          <MoodboardBlock
            title="Project Visual References"
            collapsible={false}
            isExpanded={true}
          />
        </div>
      </div>
    </div>
  );
}
