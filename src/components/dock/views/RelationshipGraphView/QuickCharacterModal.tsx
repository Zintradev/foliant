import React, { useState, memo } from 'react';
import { X } from 'lucide-react';
import { CharacterItem } from '../../../../types/dock';
import { useTranslation } from '../../../../i18n/translations';

interface QuickCharacterModalProps {
  coords: { x: number; y: number };
  onClose: () => void;
  onSubmit: (character: CharacterItem, coords: { x: number; y: number }) => void;
}

function QuickCharacterModalComponent({
  coords,
  onClose,
  onSubmit,
}: QuickCharacterModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [role, setRole] = useState('Supporting');
  const [summary, setSummary] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newChar: CharacterItem = {
      id: `char-${Date.now()}`,
      name: name.trim(),
      role,
      summary: summary.trim(),
    };

    onSubmit(newChar, coords);
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
            {t('placeCharacterAtCursor')}
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
          <div className="space-y-0.5">
            <label className="text-[10px] font-mono text-zinc-400 uppercase">{t('name')}</label>
            <input
              type="text"
              required
              placeholder="e.g. Master Kaelen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="space-y-0.5">
            <label className="text-[10px] font-mono text-zinc-400 uppercase">{t('role')}</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xs px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="space-y-0.5">
            <label className="text-[10px] font-mono text-zinc-400 uppercase">{t('summary')}</label>
            <textarea
              rows={2}
              placeholder={t('briefRolePlaceholder')}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xs p-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-zinc-850 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded-xs transition cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xs text-[10px] font-mono transition cursor-pointer"
            >
              {t('placeCharacter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const QuickCharacterModal = memo(QuickCharacterModalComponent);
