import { useState } from 'react';
import {
  GitBranch,
  Plus,
  Trash2,
  Milestone,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { PlotBeat } from '../../types/navigation';

export default function PlotTimelineView() {
  const [beats, setBeats] = useState<PlotBeat[]>([
    {
      id: 'beat-1',
      act: 'Act I: The Hook',
      title: 'The Cryptic Ledger',
      summary: 'Evelyn uncovers an uncatalogued folio bearing Chancellor Sterling’s private seal.',
      thread: 'Main Conspiracy',
      status: 'Completed',
    },
    {
      id: 'beat-2',
      act: 'Act I: The Hook',
      title: 'The Midnight Meeting',
      summary: 'Conspirators gather in the lower catacombs to coordinate the courier exchange.',
      thread: 'Main Conspiracy',
      status: 'Completed',
    },
    {
      id: 'beat-3',
      act: 'Act II: The Confrontation',
      title: 'Betrayal at the Docks',
      summary: 'Kaelen’s safehouse is compromised by the city guard; Evelyn must choose who to trust.',
      thread: 'Protagonist Arc',
      status: 'In Progress',
    },
    {
      id: 'beat-4',
      act: 'Act II: The Confrontation',
      title: 'The Archives Infiltration',
      summary: 'A covert break-in to retrieve the original cipher ledger before it is incinerated.',
      thread: 'Main Conspiracy',
      status: 'Planned',
    },
    {
      id: 'beat-5',
      act: 'Act III: The Climax',
      title: 'Trial of Shadows',
      summary: 'Sterling attempts to publicly execute the conspirators under high treason charges.',
      thread: 'World & Lore',
      status: 'Planned',
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [targetAct, setTargetAct] = useState<PlotBeat['act']>('Act I: The Hook');
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newThread, setNewThread] = useState<PlotBeat['thread']>('Main Conspiracy');

  const acts: PlotBeat['act'][] = [
    'Act I: The Hook',
    'Act II: The Confrontation',
    'Act III: The Climax',
    'Epilogue',
  ];

  const handleAddBeat = () => {
    if (!newTitle.trim()) return;
    const newBeat: PlotBeat = {
      id: `beat-${Date.now()}`,
      act: targetAct,
      title: newTitle.trim(),
      summary: newSummary.trim() || 'No synopsis added.',
      thread: newThread,
      status: 'Planned',
    };
    setBeats((prev) => [...prev, newBeat]);
    setNewTitle('');
    setNewSummary('');
    setIsAdding(false);
  };

  const handleDeleteBeat = (id: string) => {
    setBeats((prev) => prev.filter((b) => b.id !== id));
  };

  const getThreadBadge = (thread: PlotBeat['thread']) => {
    switch (thread) {
      case 'Main Conspiracy':
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-xs bg-zinc-850 border border-zinc-750 text-zinc-300">
            Conspiracy
          </span>
        );
      case 'Protagonist Arc':
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-xs bg-zinc-850 border border-zinc-750 text-zinc-300">
            Arc
          </span>
        );
      case 'World & Lore':
      default:
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-xs bg-zinc-850 border border-zinc-750 text-zinc-300">
            Lore
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 select-none overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-300">
            <GitBranch className="w-4 h-4 text-zinc-200" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
              Plot & Timeline Board
            </h1>
            <p className="text-[11px] text-zinc-400">
              Structure story beats, major narrative arcs, and pacing across acts
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setTargetAct('Act I: The Hook');
            setIsAdding(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-medium transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Beat</span>
        </button>
      </header>

      {/* Main Board Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6 bg-zinc-950">
        <div className="w-full max-w-[1800px] mx-auto h-full flex flex-col">
          {/* Creation Modal / Inline Drawer */}
          {isAdding && (
            <div className="max-w-xl mx-auto mb-6 p-4 rounded-sm border border-zinc-750 bg-zinc-900 shadow-xl space-y-3 w-full">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Add Story Beat
                </span>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-mono">TARGET ACT</label>
                  <select
                    value={targetAct}
                    onChange={(e) => setTargetAct(e.target.value as PlotBeat['act'])}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                  >
                    {acts.map((act) => (
                      <option key={act} value={act}>
                        {act}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 font-mono">NARRATIVE THREAD</label>
                  <select
                    value={newThread}
                    onChange={(e) => setNewThread(e.target.value as PlotBeat['thread'])}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                  >
                    <option value="Main Conspiracy">Main Conspiracy</option>
                    <option value="Protagonist Arc">Protagonist Arc</option>
                    <option value="World & Lore">World & Lore</option>
                  </select>
                </div>
              </div>

              <input
                type="text"
                placeholder="Beat title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                autoFocus
              />

              <textarea
                placeholder="What happens in this scene or turning point..."
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans leading-relaxed"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 rounded-sm text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBeat}
                  disabled={!newTitle.trim()}
                  className="px-4 py-1 rounded-sm text-xs font-medium bg-zinc-200 hover:bg-white text-zinc-950 disabled:opacity-50 transition"
                >
                  Add Beat
                </button>
              </div>
            </div>
          )}

          {/* 4-Column Act Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-[520px]">
            {acts.map((act) => {
              const actBeats = beats.filter((b) => b.act === act);

              return (
                <div
                  key={act}
                  className="flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-sm overflow-hidden"
                >
                  {/* Act Column Header */}
                  <div className="p-3 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Milestone className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                        {act}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded-xs bg-zinc-950 border border-zinc-800">
                      {actBeats.length}
                    </span>
                  </div>

                  {/* Beats Column Body */}
                  <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                    {actBeats.length === 0 ? (
                      <div className="h-32 flex flex-col items-center justify-center text-center text-zinc-600 border border-dashed border-zinc-850 rounded-sm p-2">
                        <p className="text-[11px] text-zinc-500">No beats recorded</p>
                        <button
                          onClick={() => {
                            setTargetAct(act);
                            setIsAdding(true);
                          }}
                          className="text-[10px] text-zinc-400 hover:text-zinc-200 mt-1 underline"
                        >
                          + Add beat
                        </button>
                      </div>
                    ) : (
                      actBeats.map((beat) => (
                        <div
                          key={beat.id}
                          className="group relative border border-zinc-850 rounded-sm bg-zinc-900/60 hover:bg-zinc-900/90 hover:border-zinc-750 p-3 space-y-2 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <h4 className="text-xs font-medium text-zinc-200 leading-snug">
                              {beat.title}
                            </h4>
                            <button
                              onClick={() => handleDeleteBeat(beat.id)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition p-0.5"
                              title="Delete beat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                            {beat.summary}
                          </p>

                          <div className="flex items-center justify-between pt-1 border-t border-zinc-850 text-[10px]">
                            {getThreadBadge(beat.thread)}
                            <span className="flex items-center gap-1 text-zinc-500 font-mono">
                              {beat.status === 'Completed' ? (
                                <CheckCircle2 className="w-2.5 h-2.5 text-zinc-300" />
                              ) : (
                                <Clock className="w-2.5 h-2.5 text-zinc-500" />
                              )}
                              {beat.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Column Footer */}
                  <div className="p-2 border-t border-zinc-800 bg-zinc-950/80">
                    <button
                      onClick={() => {
                        setTargetAct(act);
                        setIsAdding(true);
                      }}
                      className="flex items-center justify-center gap-1 w-full py-1 text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-sm transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Beat</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
