import React, { memo } from 'react';
import { X, Trash2 } from 'lucide-react';
import {
  TimelineMarker,
  TimelineMarkerColor,
  TimelineMarkerIcon,
} from '../../../../types/dock';
import {
  MARKER_COLOR_CONFIG,
  MARKER_ICONS,
  MARKER_COLORS,
  renderMarkerIcon,
} from './constants';
import { useTranslation } from '../../../../i18n/translations';

interface TimelineMarkerModalProps {
  marker: TimelineMarker;
  markerPopoverRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onUpdate: (updates: Partial<TimelineMarker>) => void;
  onDelete: () => void;
}

function TimelineMarkerModalComponent({
  marker,
  markerPopoverRef,
  onClose,
  onUpdate,
  onDelete,
}: TimelineMarkerModalProps) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={markerPopoverRef}
        className="w-80 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl p-3 text-xs text-zinc-300 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-850">
          <div className="flex items-center gap-1.5">
            <span
              className={`p-1 rounded-xs ${
                MARKER_COLOR_CONFIG[marker.color]?.bg || 'bg-zinc-800'
              } ${MARKER_COLOR_CONFIG[marker.color]?.text || 'text-zinc-300'}`}
            >
              {renderMarkerIcon(marker.icon)}
            </span>
            <span className="font-semibold text-zinc-100 text-xs font-mono">
              {t('eventMarker')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title Input */}
        <div className="space-y-1 mb-2.5">
          <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            {t('markerLabelField')}
          </label>
          <input
            type="text"
            value={marker.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={t('markerTitlePlaceholder')}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
          />
        </div>

        {/* Description Textarea */}
        <div className="space-y-1 mb-2.5">
          <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            {t('markerNoteField')}
          </label>
          <textarea
            rows={2}
            value={marker.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder={t('markerDescriptionPlaceholder')}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xs p-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 resize-none"
          />
        </div>

        {/* Color Palette */}
        <div className="space-y-1 mb-2.5">
          <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            {t('markerCategoryField')}
          </label>
          <div className="grid grid-cols-6 gap-1">
            {MARKER_COLORS.map((colKey) => {
              const conf = MARKER_COLOR_CONFIG[colKey];
              const isSelected = marker.color === colKey;
              return (
                <button
                  key={colKey}
                  type="button"
                  aria-label={`Color: ${colKey}`}
                  title={conf.label}
                  onClick={() => onUpdate({ color: colKey })}
                  className={`h-6 rounded-xs border transition cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? `${conf.bg} border-white ring-1 ring-white/40 shadow-xs`
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: conf.hex }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon Type */}
        <div className="space-y-1 mb-3">
          <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            {t('markerIconField')}
          </label>
          <div className="flex items-center gap-1">
            {MARKER_ICONS.map((ic) => {
              const isSelected = marker.icon === ic.id;
              return (
                <button
                  key={ic.id}
                  type="button"
                  title={ic.label}
                  onClick={() => onUpdate({ icon: ic.id })}
                  className={`flex-1 py-1 rounded-xs border text-[10px] font-mono transition cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'bg-zinc-800 border-zinc-600 text-white font-medium shadow-xs'
                      : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                  }`}
                >
                  {renderMarkerIcon(ic.id, 'w-3 h-3')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-850">
          <button
            type="button"
            onClick={onDelete}
            className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-xs hover:bg-zinc-900 transition cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>{t('deleteMarker')}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xs text-[10px] font-mono transition cursor-pointer"
          >
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  );
}

export const TimelineMarkerModal = memo(TimelineMarkerModalComponent);
