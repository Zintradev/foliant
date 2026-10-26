import React, { useMemo } from 'react';
import { BookOpen, GitMerge, X, ChevronDown } from 'lucide-react';
import { useTranslation } from '../../../../i18n/translations';
import { TextNode } from '../../../../types/project';
import { AppColorSettings, COLOR_SWATCHES } from '../../../../types/settings';
import { StorylineItem } from './types';
import { COLOR_CLASSES } from './constants';

interface StorylineChaptersViewProps {
  validChapters: TextNode[];
  storylines: StorylineItem[];
  colorSettings?: AppColorSettings;
  isExpanded?: boolean;
  onSelectChapter?: (chapterId: string) => void;
  onLinkChapter: (storylineId: string, chapterId: string) => void;
  onUnlinkChapter: (storylineId: string, chapterId: string) => void;
}

export const StorylineChaptersView = React.memo(
  function StorylineChaptersView({
    validChapters,
    storylines,
    colorSettings,
    isExpanded = false,
    onSelectChapter,
    onLinkChapter,
    onUnlinkChapter,
  }: StorylineChaptersViewProps) {
    const { t } = useTranslation();

    const chapterStorylineMap = useMemo(() => {
      const map = new Map<string, StorylineItem[]>();
      for (const ch of validChapters) {
        map.set(
          ch.id,
          storylines.filter((s) => s.linkedChapterIds.includes(ch.id))
        );
      }
      return map;
    }, [validChapters, storylines]);

    if (validChapters.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500 gap-1.5">
          <BookOpen className="w-6 h-6 text-zinc-600" />
          <p className="text-xs">{t('noChaptersCreated')}</p>
        </div>
      );
    }

    return (
      <div
        className={
          isExpanded
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start'
            : 'space-y-2'
        }
      >
        {validChapters.map((chapter) => {
          const linkedStorylines = chapterStorylineMap.get(chapter.id) || [];
          const unlinkedStorylines = storylines.filter(
            (s) => !linkedStorylines.some((ls) => ls.id === s.id)
          );

          return (
            <div
              key={chapter.id}
              className="group border border-zinc-800 rounded-sm bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 p-2.5 space-y-2 transition-colors"
            >
              {/* Chapter Header */}
              <div className="flex items-center justify-between gap-2">
                <div
                  onClick={() => onSelectChapter?.(chapter.id)}
                  className="flex items-center gap-1.5 min-w-0 cursor-pointer hover:text-white transition"
                  title={t('openChapterInEditor')}
                >
                  <BookOpen className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <h3 className="text-xs font-medium text-zinc-200 truncate">
                    {chapter.title || 'Untitled Chapter'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                  {linkedStorylines.length} {linkedStorylines.length === 1 ? t('track') : t('tracks')}
                </span>
              </div>

              {/* Attached Storyline Badges */}
              {linkedStorylines.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {linkedStorylines.map((st) => {
                    const customKey = colorSettings?.storylines[st.color] ?? st.color;
                    const dotClass =
                      COLOR_SWATCHES[customKey]?.dotBg ??
                      COLOR_CLASSES[st.color]?.dot ??
                      'bg-emerald-500';
                    return (
                      <span
                        key={st.id}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] border border-zinc-750 bg-zinc-850 text-zinc-300"
                        title={st.title}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                        <span className="truncate max-w-[120px] font-medium">
                          {st.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUnlinkChapter(st.id, chapter.id)}
                          className="hover:text-red-400 text-zinc-500 ml-0.5 transition"
                          title={t('detachPlotThread')}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-500 italic">
                  {t('noStorylinesLinkedToChapter')}
                </p>
              )}

              {/* 1-Click Dropdown Selector to Attach Storylines */}
              <div className="flex items-center gap-1.5 pt-0.5 border-t border-zinc-855">
                <GitMerge className="w-3 h-3 text-zinc-500 shrink-0" />
                {unlinkedStorylines.length > 0 ? (
                  <div className="relative flex-1">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          onLinkChapter(e.target.value, chapter.id);
                        }
                      }}
                      className="w-full appearance-none bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-sm px-2 py-1 pr-6 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer transition"
                    >
                      <option value="" disabled>
                        {t('attachPlotThread')}
                      </option>
                      {unlinkedStorylines.map((st) => (
                        <option
                          key={st.id}
                          value={st.id}
                          className="bg-zinc-950 text-zinc-200"
                        >
                          {st.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-2.5 h-2.5 text-zinc-500 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                  </div>
                ) : (
                  <span className="text-[10px] text-zinc-500 italic">
                    {t('allPlotThreadsAttached')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
