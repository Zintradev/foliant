import React from 'react';
import { BookmarkCheck, Link2, X, ChevronDown } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';
import { TextNode } from '../../../../types/project';

interface StorylineLinkedChaptersSectionProps {
  storylineId: string;
  linkedChapterIds: string[];
  validChapters: TextNode[];
  onSelectChapter?: (chapterId: string) => void;
  onLinkChapter: (storylineId: string, chapterId: string) => void;
  onUnlinkChapter: (storylineId: string, chapterId: string) => void;
}

export const StorylineLinkedChaptersSection = React.memo(
  function StorylineLinkedChaptersSection({
    storylineId,
    linkedChapterIds,
    validChapters,
    onSelectChapter,
    onLinkChapter,
    onUnlinkChapter,
  }: StorylineLinkedChaptersSectionProps) {
    const { t } = useTranslation();
    const unlinkedChapters = validChapters.filter(
      (ch) => !linkedChapterIds.includes(ch.id)
    );

    return (
      <div className="pt-2 border-t border-zinc-850 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1 uppercase tracking-wider">
            <BookmarkCheck className="w-2.5 h-2.5 text-zinc-500" />
            {t('linkedChapters')} ({linkedChapterIds.length})
          </span>
        </div>

        {/* Linked Chapter Badges */}
        {linkedChapterIds.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {linkedChapterIds.map((chId) => {
              const ch = validChapters.find((c) => c.id === chId);
              return (
                <span
                  key={chId}
                  onClick={() => onSelectChapter?.(chId)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] border border-zinc-750 bg-zinc-855 text-zinc-300 cursor-pointer hover:border-zinc-600 hover:text-white transition"
                  title={`Click to open ${ch?.title ?? chId}`}
                >
                  <span className="truncate max-w-[130px]">
                    {ch?.title || chId}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnlinkChapter(storylineId, chId);
                    }}
                    className="hover:text-red-400 text-zinc-500 ml-0.5 transition"
                    title={t('unlinkChapter')}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-[10px] text-zinc-500 italic">
            {t('noChaptersLinkedYet')}
          </p>
        )}

        {/* Dropdown Selector to Link Chapters */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <Link2 className="w-3 h-3 text-zinc-500 shrink-0" />
          {unlinkedChapters.length > 0 ? (
            <div className="relative flex-1">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onLinkChapter(storylineId, e.target.value);
                  }
                }}
                className="w-full appearance-none bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-sm px-2 py-1 pr-6 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer transition"
              >
                <option value="" disabled>
                  {t('linkToChapter')}
                </option>
                {unlinkedChapters.map((ch) => (
                  <option
                    key={ch.id}
                    value={ch.id}
                    className="bg-zinc-950 text-zinc-200"
                  >
                    {ch.title || 'Untitled Chapter'}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-2.5 h-2.5 text-zinc-500 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          ) : (
            <span className="text-[10px] text-zinc-500 italic">
              {t('allChaptersLinked')}
            </span>
          )}
        </div>
      </div>
    );
  }
);
