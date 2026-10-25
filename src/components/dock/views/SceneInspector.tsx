import React, { useRef, useEffect, useMemo, useState, memo } from 'react';
import {
  FileText,
  Folder,
  Target,
  AlignLeft,
  Clock,
  Sliders,
  User,
  Users,
  Globe,
  GitMerge,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react';
import { TextNode, ChapterStatus, PlotStatus, ScenePlotState } from '../../../types/project';
import { CharacterItem, WorldItem, StorylineItem } from '../../../types/dock';
import { STATUS_OPTIONS, getStatusBadgeStyle } from './ManuscriptStatsView';
import { useTranslation, getRoleLabel } from '../../../i18n/translations';
import { countWords } from '../../../utils/textMetrics';

export interface SceneInspectorProps {
  activeNodeId: string;
  activeNode?: TextNode;
  chapters?: TextNode[];
  characters?: CharacterItem[];
  worldItems?: WorldItem[];
  storylines?: StorylineItem[];
  onUpdateNode: (id: string, updates: Partial<TextNode>) => void;
  onSelectChapter?: (id: string) => void;
}

function SceneInspectorComponent({
  activeNodeId,
  activeNode,
  chapters = [],
  characters = [],
  worldItems = [],
  storylines = [],
  onUpdateNode,
}: SceneInspectorProps) {
  const { t } = useTranslation();

  const getStatusLabel = (status: ChapterStatus): string => {
    switch (status) {
      case 'Not Started':
        return t('statusNotStarted');
      case 'In Progress':
        return t('statusInProgress');
      case 'First Draft':
        return t('statusFirstDraft');
      case 'Revised':
        return t('statusRevised');
      case 'Completed':
        return t('statusDone');
      default:
        return status;
    }
  };

  // Resolve node by prop or lookup from chapters
  const node = useMemo(() => {
    if (activeNode && activeNode.id === activeNodeId) return activeNode;
    return chapters.find((c) => c.id === activeNodeId) || activeNode;
  }, [activeNode, activeNodeId, chapters]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Accordion state management: all sections collapsible
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    goal: true,
    synopsis: true,
    plots: true,
    cast: true,
    world: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Auto-resize textarea dynamically based on imported Manuskript notes length
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(120, Math.min(420, scrollH))}px`;
    }
  }, [node?.synopsis, openSections.synopsis]);

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center select-none bg-zinc-950 text-zinc-500">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
          <Sliders className="w-5 h-5 text-zinc-600" />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono mb-1">
          {t('sceneInspector')}
        </h3>
        <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
          {t('selectSceneToInspect')}
        </p>
      </div>
    );
  }

  const isFolder = node.type === 'folder';
  const currentWords = countWords(node.content);
  const targetWords = node.targetWords ?? (isFolder ? 5000 : 2500);
  const progressPercent = targetWords > 0 ? (currentWords / targetWords) * 100 : 0;
  const clampedProgress = Math.min(progressPercent, 100);
  const readingTimeMin = Math.max(1, Math.ceil(currentWords / 225));

  // Attached entity IDs
  const attachedCharacterIds = node.attachedCharacterIds || [];
  const attachedWorldItemIds = node.attachedWorldItemIds || [];

  // Plot states for this scene: mapping storylineId -> status ('Active' | 'Dormant' | 'Resolved')
  const currentPlotStates: ScenePlotState[] = node.plotStates || [];

  const handleSynopsisChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateNode(node.id, { synopsis: e.target.value });
  };

  const handleTargetWordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onUpdateNode(node.id, { targetWords: isNaN(val) ? 0 : Math.max(0, val) });
  };

  const handleStatusChange = (status: ChapterStatus) => {
    onUpdateNode(node.id, { status });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNode(node.id, { title: e.target.value });
  };

  const handlePovChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onUpdateNode(node.id, { povCharacterId: val || undefined });
  };

  const handleToggleCharacter = (charId: string) => {
    const exists = attachedCharacterIds.includes(charId);
    const updated = exists
      ? attachedCharacterIds.filter((id) => id !== charId)
      : [...attachedCharacterIds, charId];
    onUpdateNode(node.id, { attachedCharacterIds: updated });
  };

  const handleToggleWorldItem = (worldId: string) => {
    const exists = attachedWorldItemIds.includes(worldId);
    const updated = exists
      ? attachedWorldItemIds.filter((id) => id !== worldId)
      : [...attachedWorldItemIds, worldId];
    onUpdateNode(node.id, { attachedWorldItemIds: updated });
  };

  const handleTogglePlotInScene = (storylineId: string) => {
    const existing = currentPlotStates.find((p) => p.storylineId === storylineId);
    let updated: ScenePlotState[];
    if (existing) {
      updated = currentPlotStates.filter((p) => p.storylineId !== storylineId);
    } else {
      updated = [...currentPlotStates, { storylineId, status: 'Active' }];
    }
    onUpdateNode(node.id, { plotStates: updated });
  };

  const handleUpdatePlotStatus = (storylineId: string, status: PlotStatus) => {
    const existing = currentPlotStates.find((p) => p.storylineId === storylineId);
    let updated: ScenePlotState[];
    if (existing) {
      updated = currentPlotStates.map((p) =>
        p.storylineId === storylineId ? { ...p, status } : p
      );
    } else {
      updated = [...currentPlotStates, { storylineId, status }];
    }
    onUpdateNode(node.id, { plotStates: updated });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 select-none overflow-y-auto text-zinc-200 font-sans divide-y divide-zinc-850">
      {/* ------------------------------------------------------------- */}
      {/* HEADER BAR & QUICK STATUS                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3 bg-zinc-900/60 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className={`w-5 h-5 rounded-sm flex items-center justify-center shrink-0 ${
                isFolder
                  ? 'bg-amber-950/60 border border-amber-800/60 text-amber-400'
                  : 'bg-blue-950/60 border border-blue-800/60 text-blue-400'
              }`}
            >
              {isFolder ? <Folder className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
            </div>
            <span className="text-[11px] font-semibold text-zinc-200 uppercase tracking-wider font-mono truncate">
              {isFolder ? t('folderSection') : t('sceneInspector')}
            </span>
          </div>

          <select
            value={node.status || 'In Progress'}
            onChange={(e) => handleStatusChange(e.target.value as ChapterStatus)}
            className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-xs border focus:outline-none focus:ring-1 focus:ring-zinc-600 bg-zinc-900 cursor-pointer ${getStatusBadgeStyle(
              node.status || 'In Progress'
            )}`}
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st} className="bg-zinc-900 text-zinc-200 font-sans">
                {getStatusLabel(st)}
              </option>
            ))}
          </select>
        </div>

        {/* Title Input */}
        <input
          type="text"
          value={node.title}
          onChange={handleTitleChange}
          placeholder={t('untitledScene')}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition font-medium"
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ACCORDION 1: WORD GOAL & PROGRESS                             */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3">
        <button
          onClick={() => toggleSection('goal')}
          className="flex items-center justify-between w-full text-left group cursor-pointer"
        >
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5 group-hover:text-zinc-200 transition">
            <Target className="w-3 h-3 text-zinc-400" />
            {t('wordGoalAndProgress')}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-mono font-semibold ${
                progressPercent >= 100
                  ? 'text-emerald-400'
                  : progressPercent >= 70
                  ? 'text-blue-400'
                  : 'text-zinc-400'
              }`}
            >
              {progressPercent.toFixed(0)}%
            </span>
            {openSections.goal ? (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            )}
          </div>
        </button>

        {openSections.goal && (
          <div className="mt-3 p-3 rounded-sm border border-zinc-800/80 bg-zinc-900/40 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono block mb-0.5">
                  {t('currentWords')}
                </span>
                <div className="text-sm font-bold font-mono text-zinc-100">
                  {currentWords.toLocaleString()}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 font-mono block mb-0.5">
                  {t('targetWords')}
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={targetWords}
                  onChange={handleTargetWordsChange}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xs px-2 py-0.5 text-xs font-mono text-zinc-100 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    progressPercent > 100
                      ? 'bg-rose-500'
                      : progressPercent >= 70
                      ? 'bg-emerald-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${clampedProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                <span>{Math.max(0, targetWords - currentWords).toLocaleString()} {t('wordsLeft')}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> ~{readingTimeMin} {t('minRead')}
                </span>
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1 pt-1 border-t border-zinc-800/60">
              <span className="text-[9px] text-zinc-500 font-mono mr-1">{t('wordPresets')}:</span>
              {[1000, 2000, 2500, 5000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => onUpdateNode(node.id, { targetWords: preset })}
                  className={`px-1.5 py-0.5 rounded-xs text-[9px] font-mono transition cursor-pointer ${
                    targetWords === preset
                      ? 'bg-zinc-700 text-zinc-100 border border-zinc-600'
                      : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {preset >= 1000 ? `${preset / 1000}k` : preset}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ACCORDION 2: SYNOPSIS & SCENE NOTES                           */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3">
        <button
          onClick={() => toggleSection('synopsis')}
          className="flex items-center justify-between w-full text-left group cursor-pointer"
        >
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5 group-hover:text-zinc-200 transition">
            <AlignLeft className="w-3 h-3 text-zinc-400" />
            {t('synopsisAndNotes')}
          </span>
          <div className="flex items-center gap-1.5">
            {node.synopsis && (
              <span className="text-[9px] text-zinc-500 font-mono">
                {countWords(node.synopsis)} w
              </span>
            )}
            {openSections.synopsis ? (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            )}
          </div>
        </button>

        {openSections.synopsis && (
          <div className="mt-2.5 space-y-1">
            <textarea
              ref={textareaRef}
              value={node.synopsis ?? ''}
              onChange={handleSynopsisChange}
              placeholder={t('synopsisPlaceholder')}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-sm p-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition leading-relaxed resize-y font-sans min-h-[120px] max-h-[420px] overflow-y-auto"
            />
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ACCORDION 3: PLOT STATES IN THIS SCENE                        */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3">
        <button
          onClick={() => toggleSection('plots')}
          className="flex items-center justify-between w-full text-left group cursor-pointer"
        >
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5 group-hover:text-zinc-200 transition">
            <GitMerge className="w-3 h-3 text-zinc-400" />
            {t('plotsInScene')} ({currentPlotStates.length})
          </span>
          {openSections.plots ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </button>

        {openSections.plots && (
          <div className="mt-3 space-y-2.5">
            {storylines.length === 0 ? (
              <p className="text-[11px] text-zinc-600 italic">{t('noStorylinesYet')}</p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto p-1 bg-zinc-900/30 border border-zinc-850 rounded-sm">
                {storylines.map((storyline) => {
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
                        onClick={() => handleTogglePlotInScene(storyline.id)}
                        className="flex items-center gap-1.5 min-w-0 text-left cursor-pointer flex-1"
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                            isAttached
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-zinc-900 border-zinc-700 text-transparent'
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
                            handleUpdatePlotStatus(storyline.id, e.target.value as PlotStatus)
                          }
                          className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-xs border focus:outline-none focus:ring-1 focus:ring-zinc-600 cursor-pointer ${
                            currentStatus === 'Active'
                              ? 'bg-blue-950/70 border-blue-700/70 text-blue-300'
                              : currentStatus === 'Resolved'
                              ? 'bg-emerald-950/70 border-emerald-700/70 text-emerald-300'
                              : 'bg-zinc-900 border-zinc-750 text-zinc-400'
                          }`}
                        >
                          <option value="Active">{t('statusActive')}</option>
                          <option value="Dormant">{t('statusDormant')}</option>
                          <option value="Resolved">{t('statusResolved')}</option>
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

      {/* ------------------------------------------------------------- */}
      {/* ACCORDION 4: POV & CAST / CHARACTERS                           */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3">
        <button
          onClick={() => toggleSection('cast')}
          className="flex items-center justify-between w-full text-left group cursor-pointer"
        >
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5 group-hover:text-zinc-200 transition">
            <Users className="w-3 h-3 text-zinc-400" />
            {t('castInScene')} ({attachedCharacterIds.length})
          </span>
          {openSections.cast ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </button>

        {openSections.cast && (
          <div className="mt-3 space-y-3">
            {/* POV Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-1">
                <User className="w-2.5 h-2.5 text-zinc-400" />
                {t('povCharacter')}
              </label>
              <select
                value={node.povCharacterId || ''}
                onChange={handlePovChange}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 cursor-pointer font-sans"
              >
                <option value="">{t('noneSelect')}</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name} ({getRoleLabel(char.role, t)})
                  </option>
                ))}
              </select>
            </div>

            {/* Attached Cast List with Collapsible Summary */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-zinc-400 font-mono uppercase tracking-wider block">
                {t('charactersInScene')}
              </span>
              {characters.length === 0 ? (
                <p className="text-[11px] text-zinc-600 italic">{t('noCharactersYet')}</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto p-1 bg-zinc-900/30 border border-zinc-850 rounded-sm">
                  {characters.map((char) => {
                    const isAttached = attachedCharacterIds.includes(char.id);
                    const isPov = node.povCharacterId === char.id;

                    return (
                      <div
                        key={char.id}
                        className={`rounded-sm border p-2 text-xs transition ${
                          isAttached
                            ? 'bg-zinc-900 border-zinc-750 text-zinc-200'
                            : 'bg-zinc-950/60 border-zinc-850 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCharacter(char.id)}
                            className="flex items-center gap-1.5 cursor-pointer min-w-0 text-left flex-1"
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                                isAttached
                                  ? 'bg-blue-600 border-blue-500 text-white'
                                  : 'bg-zinc-900 border-zinc-700 text-transparent'
                              }`}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span className="font-medium truncate">{char.name}</span>
                            {char.role && (
                              <span className="text-[10px] font-mono text-zinc-500 truncate">
                                · {getRoleLabel(char.role, t)}
                              </span>
                            )}
                          </button>

                          {isPov && (
                            <span className="text-[9px] font-mono px-1 rounded-xs bg-blue-800 text-blue-100 font-bold shrink-0">
                              POV
                            </span>
                          )}
                        </div>

                        {/* Collapsible Character Summary: Hidden by default */}
                        {char.summary && (
                          <details className="mt-1.5 group/summary">
                            <summary className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 cursor-pointer list-none flex items-center gap-1 select-none">
                              <ChevronRight className="w-2.5 h-2.5 transition-transform group-open/summary:rotate-90" />
                              <span>{t('viewBioSummary')}</span>
                            </summary>
                            <div className="mt-1 pl-3.5 text-[11px] text-zinc-400 font-sans leading-relaxed border-l border-zinc-800">
                              {char.summary}
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ACCORDION 5: WORLD REFERENCES                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3">
        <button
          onClick={() => toggleSection('world')}
          className="flex items-center justify-between w-full text-left group cursor-pointer"
        >
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5 group-hover:text-zinc-200 transition">
            <Globe className="w-3 h-3 text-zinc-400" />
            {t('worldItemsInScene')} ({attachedWorldItemIds.length})
          </span>
          {openSections.world ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </button>

        {openSections.world && (
          <div className="mt-3 space-y-2">
            {worldItems.length === 0 ? (
              <p className="text-[11px] text-zinc-600 italic">{t('noWorldEntities')}</p>
            ) : (
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1 bg-zinc-900/30 border border-zinc-850 rounded-sm">
                {worldItems.map((item) => {
                  const isAttached = attachedWorldItemIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleToggleWorldItem(item.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-medium transition cursor-pointer border ${
                        isAttached
                          ? 'bg-emerald-950/80 border-emerald-700/70 text-emerald-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                      }`}
                    >
                      {isAttached && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                      <span>{item.title}</span>
                      <span className="text-[9px] font-mono opacity-60">({item.category})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(SceneInspectorComponent);
