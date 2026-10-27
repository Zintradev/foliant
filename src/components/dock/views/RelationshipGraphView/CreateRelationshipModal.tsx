import React, { useState, memo } from 'react';
import { X } from 'lucide-react';
import {
  CharacterItem,
  CharacterRelationship,
  GraphJunctionNode,
  RelationshipColor,
  RelationshipType,
  LineStrokeStyle,
  RelationshipDirection,
} from '../../../../types/dock';
import { COLOR_PALETTE } from './constants';

interface CreateRelationshipModalProps {
  characters: CharacterItem[];
  junctions: GraphJunctionNode[];
  initialSourceId?: string;
  initialTargetId?: string;
  onClose: () => void;
  onSubmit: (rel: CharacterRelationship) => void;
}

function CreateRelationshipModalComponent({
  characters,
  junctions,
  initialSourceId,
  initialTargetId,
  onClose,
  onSubmit,
}: CreateRelationshipModalProps) {
  const [sourceId, setSourceId] = useState<string>(
    initialSourceId || characters[0]?.id || ''
  );
  const [targetId, setTargetId] = useState<string>(
    initialTargetId || characters[1]?.id || ''
  );
  const newType: RelationshipType = 'Alliance';
  const [label, setLabel] = useState<string>('');
  const [style, setStyle] = useState<LineStrokeStyle>('solid');
  const [color, setColor] = useState<RelationshipColor>('blue');
  const newDirection: RelationshipDirection = 'directed';
  const notes = '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;

    const newRel: CharacterRelationship = {
      id: `rel-${Date.now()}`,
      sourceId,
      targetId,
      type: newType,
      label: label.trim() || 'Connected',
      style,
      color,
      direction: newDirection,
      notes: notes.trim(),
    };

    onSubmit(newRel);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-80 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl p-4 text-xs text-zinc-300 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-zinc-850 mb-3">
          <span className="font-semibold text-zinc-100 text-xs font-mono">
            Define Character Connection
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[9px] font-mono text-zinc-400 uppercase">From</label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                {junctions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.label || 'Union Node'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-0.5">
              <label className="text-[9px] font-mono text-zinc-400 uppercase">To</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                {junctions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.label || 'Union Node'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-[9px] font-mono text-zinc-400 uppercase">Label</label>
            <input
              type="text"
              placeholder="e.g. Sworn Brothers, Nemesis..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[9px] font-mono text-zinc-400 uppercase">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as LineStrokeStyle)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>

            <div className="space-y-0.5">
              <label className="text-[9px] font-mono text-zinc-400 uppercase">Color</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value as RelationshipColor)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
              >
                {Object.entries(COLOR_PALETTE).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-850 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xs text-[10px] font-mono transition cursor-pointer"
            >
              Create Connection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const CreateRelationshipModal = memo(CreateRelationshipModalComponent);
