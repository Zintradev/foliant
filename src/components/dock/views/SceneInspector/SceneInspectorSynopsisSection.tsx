import React, { useRef, useEffect, memo } from 'react';
import { AlignLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';
import { countWords } from '../../../../utils/textMetrics';

interface SceneInspectorSynopsisSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  synopsis: string;
  onSynopsisChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

function SceneInspectorSynopsisSection({
  isOpen,
  onToggle,
  synopsis,
  onSynopsisChange,
}: SceneInspectorSynopsisSectionProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(120, Math.min(420, scrollH))}px`;
    }
  }, [synopsis, isOpen]);

  const words = synopsis ? countWords(synopsis) : 0;

  return (
    <div className="p-3">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left group cursor-pointer"
      >
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5 group-hover:text-zinc-200 transition">
          <AlignLeft className="w-3 h-3 text-zinc-400" />
          {t('synopsisAndNotes')}
        </span>
        <div className="flex items-center gap-1.5">
          {synopsis ? (
            <span className="text-[9px] text-zinc-500 font-mono">
              {words} w
            </span>
          ) : null}
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="mt-2.5 space-y-1">
          <textarea
            ref={textareaRef}
            value={synopsis}
            onChange={onSynopsisChange}
            placeholder={t('synopsisPlaceholder')}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-sm p-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition leading-relaxed resize-y font-sans min-h-[120px] max-h-[420px] overflow-y-auto"
          />
        </div>
      )}
    </div>
  );
}

export default memo(SceneInspectorSynopsisSection);
