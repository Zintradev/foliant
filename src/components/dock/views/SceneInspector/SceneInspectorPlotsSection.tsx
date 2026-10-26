import React, { memo } from 'react';
import { GitMerge, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { StorylineItem } from '../../../../types/dock';
import { PlotStatus, ScenePlotState } from '../../../../types/project';
import { useTranslation } from '../../../../i18n/translations';

interface SceneInspectorPlotsSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  storylines: StorylineItem[];
  sortedStorylines: StorylineItem[];
  currentPlotStates: ScenePlotState[];
  onTogglePlotInScene: (storylineId: string) => void;
  onUpdatePlotStatus: (storylineId: string, status: PlotStatus) => void;
}

function SceneInspectorPlotsSection({
  isOpen,
  onToggle,
  storylines,
  sortedStorylines,
  currentPlotStates,
  onTogglePlotInScene,
  onUpdatePlotStatus,
}: SceneInspectorPlotsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="p-3">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left group cursor-pointer"
      >
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5 group-hover:text-zinc-200 transition">
          <GitMerge className="w-3 h-3 text-zinc-400" />
          {t('plotsInScene')} ({currentPlotStates.length})
        </span>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-2.5">
          {storylines.length === 0 ? (
            <p className="text-[11px] text-zinc-600 italic">{t('noStorylinesYet')}</p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto p-1 bg-zinc-900/30 border border-zinc-850 rounded-sm">
              {sortedStorylines.map((storyline) => {
                const stateEntry = currentPlotStates.find((p) => p.storylineId === storyline.id);
                const isAttached = Boolean(stateEntry);
                const currentStatus: PlotStatus = stateEntry?.status || 'Active';

                return (
                  <div
                    key={storyline.id}
                    className={`flex items-center justify-between gap-2 p-1.5 rounded-sm border transition ${
                      isAttached
                        ? 'bg-zinc-900 border-zinc-700/80 text-zinc-200'
                        : 'bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onTogglePlotInScene(storyline.id)}
                      className="flex items-center gap-1.5 min-w-0 text-left cursor-pointer flex-1"
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                          isAttached
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-zinc-900 border-zinc-750 text-transparent'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="text-xs font-medium truncate" title={storyline.title}>
                        {storyline.title}
                      </span>
                    </button>

                    {isAttached && (
                      <select
                        value={currentStatus}
                        onChange={(e) =>
                          onUpdatePlotStatus(storyline.id, e.target.value as PlotStatus)
                        }
                        className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-xs border focus:outline-none focus:ring-1 focus:ring-zinc-600 cursor-pointer ${
                          currentStatus === 'Active'
                            ? 'bg-blue-950/70 border-blue-700/70 text-blue-300'
                            : currentStatus === 'Resolved'
                            ? 'bg-emerald-950/70 border-emerald-700/70 text-emerald-300'
                            : 'bg-zinc-900 border-zinc-750 text-zinc-400'
                        }`}
                      >
                        <option key="Active" value="Active">{t('statusActive')}</option>
                        <option key="Dormant" value="Dormant">{t('statusDormant')}</option>
                        <option key="Resolved" value="Resolved">{t('statusResolved')}</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(SceneInspectorPlotsSection);
