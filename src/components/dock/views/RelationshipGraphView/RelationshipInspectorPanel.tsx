import { useState, memo } from 'react';
import { X, Trash2, ArrowRight, ArrowLeft, ArrowLeftRight } from 'lucide-react';
import {
  CharacterRelationship,
  RelationshipColor,
  LineStrokeStyle,
  RelationshipDirection,
} from '../../../../types/dock';
import { COLOR_PALETTE } from './constants';
import { DarkColorPicker } from '../../../common/DarkColorPicker';
import { RelationshipInspectorDirectionPicker } from './RelationshipInspectorDirectionPicker';
import { useTranslation } from '../../../../i18n/translations';

interface RelationshipInspectorPanelProps {
  selectedRel: CharacterRelationship;
  sourceLabel: string;
  targetLabel: string;
  onClose: () => void;
  onUpdateRel: (updated: CharacterRelationship) => void;
  onDeleteRel: (id: string) => void;
  onResetCurve: (id: string) => void;
}

function RelationshipInspectorPanelComponent({
  selectedRel,
  sourceLabel,
  targetLabel,
  onClose,
  onUpdateRel,
  onDeleteRel,
  onResetCurve,
}: RelationshipInspectorPanelProps) {
  const { t } = useTranslation();
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);

  return (
    <div
      className="absolute top-12 right-4 z-40 w-72 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl p-3 text-xs text-zinc-300 font-sans animate-in fade-in zoom-in-95 duration-100 select-none"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850 mb-2">
        <span className="font-semibold text-zinc-100 text-xs font-mono">
          {t('relationshipInspector')}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-200 transition p-0.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {/* Connection Ends */}
        <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between bg-zinc-900/60 p-1.5 rounded-xs border border-zinc-850">
          <span className="truncate max-w-[90px] text-zinc-200">{sourceLabel}</span>
          <div className="flex items-center gap-1 text-zinc-400">
            {selectedRel.direction === 'directed' && <ArrowRight className="w-3 h-3 text-blue-400" />}
            {selectedRel.direction === 'reverse' && <ArrowLeft className="w-3 h-3 text-blue-400" />}
            {(!selectedRel.direction || selectedRel.direction === 'bidirectional') && (
              <ArrowLeftRight className="w-3 h-3 text-blue-400" />
            )}
            {selectedRel.direction === 'none' && (
              <span className="text-[10px] text-zinc-500 font-mono font-bold">—</span>
            )}
          </div>
          <span className="truncate max-w-[90px] text-zinc-200">{targetLabel}</span>
        </div>

        {/* Label Input */}
        <div className="space-y-0.5">
          <label className="text-[9px] font-mono text-zinc-500 uppercase">Label</label>
          <input
            type="text"
            value={selectedRel.label || ''}
            onChange={(e) => onUpdateRel({ ...selectedRel, label: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
          />
        </div>

        {/* Direction Selector */}
        <RelationshipInspectorDirectionPicker
          direction={selectedRel.direction}
          onChange={(dir) => onUpdateRel({ ...selectedRel, direction: dir })}
        />

        {/* Stroke Style */}
        <div className="space-y-0.5">
          <label className="text-[9px] font-mono text-zinc-500 uppercase">{t('style')}</label>
          <div className="grid grid-cols-3 gap-1">
            {(['solid', 'dashed', 'dotted'] as LineStrokeStyle[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => onUpdateRel({ ...selectedRel, style: st })}
                className={`py-1 rounded-xs border text-[9px] font-mono capitalize transition cursor-pointer ${
                  (selectedRel.style || 'solid') === st
                    ? 'bg-zinc-800 border-zinc-600 text-white font-semibold'
                    : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {st === 'solid' ? t('strokeSolid') : st === 'dashed' ? t('strokeDashed') : t('strokeDotted')}
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div className="space-y-1">
          <label className="text-[9px] font-mono text-zinc-500 uppercase">{t('color')}</label>
          <div className="grid grid-cols-4 gap-1">
            {Object.entries(COLOR_PALETTE).map(([colKey, conf]) => (
              <button
                key={colKey}
                type="button"
                onClick={() =>
                  onUpdateRel({
                    ...selectedRel,
                    color: colKey as RelationshipColor,
                    customColor: undefined,
                  })
                }
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs border text-[9px] font-mono transition cursor-pointer ${
                  !selectedRel.customColor && (selectedRel.color || 'blue') === colKey
                    ? `${conf.bg} ${conf.border} ${conf.text} font-semibold ring-1 ring-white/30`
                    : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: conf.stroke }}
                />
                <span className="capitalize text-[8px] truncate">{colKey}</span>
              </button>
            ))}
          </div>

          {/* Custom Color Selector & DarkColorPicker */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowCustomColorPicker((prev) => !prev)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs border border-zinc-750 bg-zinc-900 hover:bg-zinc-850 text-[10px] font-mono text-zinc-200 transition cursor-pointer"
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-zinc-600 shrink-0 shadow-xs"
                style={{
                  backgroundColor:
                    selectedRel.customColor ||
                    COLOR_PALETTE[selectedRel.color || 'blue']?.stroke ||
                    '#3b82f6',
                }}
              />
              <span>
                {selectedRel.customColor
                  ? selectedRel.customColor.toUpperCase()
                  : 'Custom Color...'}
              </span>
            </button>
            {selectedRel.customColor && (
              <button
                type="button"
                onClick={() => onUpdateRel({ ...selectedRel, customColor: undefined })}
                className="text-[9px] font-mono text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                title="Clear custom color"
              >
                Reset
              </button>
            )}
          </div>

          {showCustomColorPicker && (
            <div className="pt-1">
              <DarkColorPicker
                standalone
                color={
                  selectedRel.customColor ||
                  COLOR_PALETTE[selectedRel.color || 'blue']?.stroke ||
                  '#3b82f6'
                }
                onChange={(hex) => onUpdateRel({ ...selectedRel, customColor: hex })}
                onClose={() => setShowCustomColorPicker(false)}
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-0.5">
          <label className="text-[9px] font-mono text-zinc-500 uppercase">Notes</label>
          <textarea
            rows={2}
            value={selectedRel.notes || ''}
            onChange={(e) => onUpdateRel({ ...selectedRel, notes: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xs p-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 resize-none"
          />
        </div>

        {/* Curve Curvature & Label Position Reset */}
        {((selectedRel.controlOffset && (selectedRel.controlOffset.x !== 0 || selectedRel.controlOffset.y !== 0)) || (selectedRel.labelT !== undefined && Math.abs(selectedRel.labelT - 0.5) > 0.02)) && (
          <div className="pt-1 flex items-center justify-between text-[9px] font-mono text-zinc-400 bg-zinc-900/40 p-1.5 rounded-xs border border-zinc-850">
            <span className="truncate">
              {selectedRel.controlOffset ? `Bent (${selectedRel.controlOffset.x}, ${selectedRel.controlOffset.y})` : 'Positioned'}
              {selectedRel.labelT !== undefined ? ` • T: ${Math.round(selectedRel.labelT * 100)}%` : ''}
            </span>
            <button
              type="button"
              onClick={() => onResetCurve(selectedRel.id)}
              className="px-1.5 py-0.5 rounded-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer text-[8px]"
            >
              Reset
            </button>
          </div>
        )}

        {/* Delete Connection */}
        <div className="pt-1 border-t border-zinc-850 flex justify-end">
          <button
            type="button"
            onClick={() => onDeleteRel(selectedRel.id)}
            className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-xs hover:bg-zinc-900 transition cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>{t('deleteConnection')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export const RelationshipInspectorPanel = memo(RelationshipInspectorPanelComponent);
export default RelationshipInspectorPanel;
