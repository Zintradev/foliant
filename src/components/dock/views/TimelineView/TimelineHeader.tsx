import React, { memo } from 'react';
import { Columns, Clock, GitMerge, Users } from 'lucide-react';
import { StorylineItem, CharacterItem } from '../../../../types/dock';
import { useTranslation } from '../../../../i18n/translations';

interface TimelineHeaderProps {
  layoutMode: 'subway' | 'lanes';
  onLayoutModeChange: (mode: 'subway' | 'lanes') => void;
  zoomX: number;
  zoomY: number;
  sliderXRef: React.RefObject<HTMLInputElement | null>;
  sliderYRef: React.RefObject<HTMLInputElement | null>;
  percentXRef: React.RefObject<HTMLInputElement | null>;
  percentYRef: React.RefObject<HTMLInputElement | null>;
  onZoomXChange: (val: number, isLiveOnly?: boolean) => void;
  onZoomYChange: (val: number, isLiveOnly?: boolean) => void;
  storylines: StorylineItem[];
  characters: CharacterItem[];
  selectedStorylineFilter: string;
  selectedCharacterFilter: string;
  onStorylineFilterChange: (id: string) => void;
  onCharacterFilterChange: (id: string) => void;
}

function TimelineHeaderComponent({
  layoutMode,
  onLayoutModeChange,
  zoomX,
  zoomY,
  sliderXRef,
  sliderYRef,
  percentXRef,
  percentYRef,
  onZoomXChange,
  onZoomYChange,
  storylines,
  characters,
  selectedStorylineFilter,
  selectedCharacterFilter,
  onStorylineFilterChange,
  onCharacterFilterChange,
}: TimelineHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-800 bg-zinc-900/60 shrink-0 z-40">
      <div className="flex items-center gap-1.5 min-w-0 shrink-0">
        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xs p-0.5">
          <button
            type="button"
            onClick={() => onLayoutModeChange('subway')}
            title="Subway Map view (Continuous plot tracks)"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono transition cursor-pointer ${
              layoutMode === 'subway'
                ? 'bg-zinc-800 text-zinc-100 font-medium shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{t('subwayMap')}</span>
          </button>
          <button
            type="button"
            onClick={() => onLayoutModeChange('lanes')}
            title="Chapter Lanes view (Grouped by folder)"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono transition cursor-pointer ${
              layoutMode === 'lanes'
                ? 'bg-zinc-800 text-zinc-100 font-medium shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Columns className="w-3 h-3" />
            <span>{t('chapterLanes')}</span>
          </button>
        </div>

        {/* Dual-Axis Zoom Controls */}
        <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded-xs">
          {/* Width Zoom (W) */}
          <div className="flex items-center gap-1" title={t('zoomXTooltip')}>
            <span className="text-zinc-500 font-bold">W:</span>
            <button
              type="button"
              onClick={() => onZoomXChange(Math.max(0.4, Math.round((zoomX - 0.1) * 20) / 20))}
              title="Zoom out width (-5%)"
              className="w-3.5 h-3.5 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xs transition cursor-pointer select-none font-bold"
            >
              -
            </button>
            <input
              ref={sliderXRef}
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              defaultValue={zoomX}
              onInput={(e) => onZoomXChange(parseFloat(e.currentTarget.value), true)}
              onPointerUp={(e) => onZoomXChange(parseFloat(e.currentTarget.value), false)}
              onKeyUp={(e) => onZoomXChange(parseFloat(e.currentTarget.value), false)}
              className="w-11 h-1 bg-zinc-800 rounded-lg appearance-none cursor-ew-resize accent-zinc-400"
            />
            <button
              type="button"
              onClick={() => onZoomXChange(Math.min(2.5, Math.round((zoomX + 0.1) * 20) / 20))}
              title="Zoom in width (+5%)"
              className="w-3.5 h-3.5 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xs transition cursor-pointer select-none font-bold"
            >
              +
            </button>
            <input
              ref={percentXRef}
              type="text"
              defaultValue={`${Math.round(zoomX * 100)}%`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseFloat(e.currentTarget.value.replace(/[^0-9.]/g, ''));
                  if (!isNaN(val) && val >= 30 && val <= 300) {
                    onZoomXChange(val / 100);
                  }
                  e.currentTarget.blur();
                }
              }}
              onBlur={(e) => {
                const val = parseFloat(e.currentTarget.value.replace(/[^0-9.]/g, ''));
                if (!isNaN(val) && val >= 30 && val <= 300) {
                  onZoomXChange(val / 100);
                } else {
                  e.currentTarget.value = `${Math.round(zoomX * 100)}%`;
                }
              }}
              title="Click or type percentage and press Enter (e.g. 100%)"
              className="w-9 px-0.5 text-center bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-500 rounded-xs text-[9px] font-mono text-zinc-200 focus:outline-none transition"
            />
          </div>

          <div className="h-3 w-px bg-zinc-800" />

          {/* Height Zoom (H) */}
          <div className="flex items-center gap-1" title={t('zoomYTooltip')}>
            <span className="text-zinc-500 font-bold">H:</span>
            <button
              type="button"
              onClick={() => onZoomYChange(Math.max(0.5, Math.round((zoomY - 0.1) * 20) / 20))}
              title="Zoom out height (-5%)"
              className="w-3.5 h-3.5 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xs transition cursor-pointer select-none font-bold"
            >
              -
            </button>
            <input
              ref={sliderYRef}
              type="range"
              min="0.6"
              max="2.0"
              step="0.05"
              defaultValue={zoomY}
              onInput={(e) => onZoomYChange(parseFloat(e.currentTarget.value), true)}
              onPointerUp={(e) => onZoomYChange(parseFloat(e.currentTarget.value), false)}
              onKeyUp={(e) => onZoomYChange(parseFloat(e.currentTarget.value), false)}
              className="w-11 h-1 bg-zinc-800 rounded-lg appearance-none cursor-ns-resize accent-zinc-400"
            />
            <button
              type="button"
              onClick={() => onZoomYChange(Math.min(2.5, Math.round((zoomY + 0.1) * 20) / 20))}
              title="Zoom in height (+5%)"
              className="w-3.5 h-3.5 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xs transition cursor-pointer select-none font-bold"
            >
              +
            </button>
            <input
              ref={percentYRef}
              type="text"
              defaultValue={`${Math.round(zoomY * 100)}%`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseFloat(e.currentTarget.value.replace(/[^0-9.]/g, ''));
                  if (!isNaN(val) && val >= 30 && val <= 300) {
                    onZoomYChange(val / 100);
                  }
                  e.currentTarget.blur();
                }
              }}
              onBlur={(e) => {
                const val = parseFloat(e.currentTarget.value.replace(/[^0-9.]/g, ''));
                if (!isNaN(val) && val >= 30 && val <= 300) {
                  onZoomYChange(val / 100);
                } else {
                  e.currentTarget.value = `${Math.round(zoomY * 100)}%`;
                }
              }}
              title="Click or type percentage and press Enter (e.g. 100%)"
              className="w-9 px-0.5 text-center bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-500 rounded-xs text-[9px] font-mono text-zinc-200 focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Filter Dropdowns for Isolating Plots and Characters */}
      <div className="flex items-center gap-1.5 shrink-0 relative z-50">
        <div className="flex items-center gap-0.5">
          <GitMerge className="w-3 h-3 text-zinc-500" />
          <select
            value={selectedStorylineFilter}
            onChange={(e) => onStorylineFilterChange(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xs px-1.5 py-0.5 text-zinc-300 text-[10px] font-mono focus:outline-none focus:border-zinc-600 max-w-[130px] truncate cursor-pointer"
          >
            <option value="all">{t('allStorylines')}</option>
            {storylines.map((st) => (
              <option key={st.id} value={st.id}>
                {st.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-0.5">
          <Users className="w-3 h-3 text-zinc-500" />
          <select
            value={selectedCharacterFilter}
            onChange={(e) => onCharacterFilterChange(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xs px-1.5 py-0.5 text-zinc-300 text-[10px] font-mono focus:outline-none focus:border-zinc-600 max-w-[130px] truncate cursor-pointer"
          >
            <option value="all">{t('allCharacters')}</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export const TimelineHeader = memo(TimelineHeaderComponent);
