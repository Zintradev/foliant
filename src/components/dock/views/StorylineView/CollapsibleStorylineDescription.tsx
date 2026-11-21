import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';

interface CollapsibleStorylineDescriptionProps {
  description: string;
}

export const CollapsibleStorylineDescription = React.memo(
  function CollapsibleStorylineDescription({
    description,
  }: CollapsibleStorylineDescriptionProps) {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const isLong = description.length > 130;

    return (
      <div className="space-y-1">
        <div
          className={`text-[11px] text-zinc-400 font-sans leading-relaxed transition-all ${
            !isExpanded && isLong
              ? 'line-clamp-2 max-h-12 overflow-hidden text-ellipsis'
              : 'max-h-48 overflow-y-auto'
          }`}
        >
          <p>{description}</p>
        </div>
        {isLong && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition flex items-center gap-0.5 cursor-pointer"
          >
            {isExpanded ? (
              <>
                {t('showLess')} <ChevronUp className="w-2.5 h-2.5" />
              </>
            ) : (
              <>
                {t('showMore')} <ChevronDown className="w-2.5 h-2.5" />
              </>
            )}
          </button>
        )}
      </div>
    );
  }
);
