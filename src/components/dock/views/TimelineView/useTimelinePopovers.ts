import React, { useState, useRef, useEffect } from 'react';
import { Chapter } from '../../../../types/project';
import { Storyline, Character } from '../../../../types';
import { ActivePopover } from './types';

interface UseTimelinePopoversProps {
  chapters: Chapter[];
  storylines: Storyline[];
  characters: Character[];
  onUpdateChapter?: (id: string, updates: Partial<Chapter>) => void;
  onUpdateStorylines?: (storylines: Storyline[]) => void;
  onCloseMarkerPopover: () => void;
}

export function useTimelinePopovers({
  chapters,
  storylines,
  onUpdateChapter,
  onUpdateStorylines,
  onCloseMarkerPopover,
}: UseTimelinePopoversProps) {
  const [activePopover, setActivePopover] = useState<ActivePopover | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const markerPopoverRef = useRef<HTMLDivElement | null>(null);

  const [openAttachDropdown, setOpenAttachDropdown] = useState<{
    sceneId: string;
    type: 'character' | 'storyline';
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        markerPopoverRef.current &&
        !markerPopoverRef.current.contains(target) &&
        !target.closest('.marker-trigger-btn')
      ) {
        onCloseMarkerPopover();
      }
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        setActivePopover(null);
      }
      if (!target.closest('.attach-dropdown-trigger') && !target.closest('.attach-dropdown-menu')) {
        setOpenAttachDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePopover(null);
        onCloseMarkerPopover();
        setOpenAttachDropdown(null);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCloseMarkerPopover]);

  const handleOpenMarkerPopover = (
    e: React.MouseEvent,
    type: 'storyline' | 'character',
    itemId: string,
    sceneId: string
  ) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(window.innerWidth - 296, Math.max(16, rect.left));
    const y = rect.bottom + 226 > window.innerHeight ? rect.top - 226 : rect.bottom + 6;
    setActivePopover({ type, itemId, sceneId, x, y });
  };

  const handleAttachCharacter = (sceneId: string, characterId: string) => {
    const scene = chapters.find((c) => c.id === sceneId);
    if (!scene || !onUpdateChapter) return;
    const currentAttached = scene.attachedCharacterIds || [];
    if (!currentAttached.includes(characterId)) {
      onUpdateChapter(sceneId, { attachedCharacterIds: [...currentAttached, characterId] });
    }
    setOpenAttachDropdown(null);
  };

  const handleDetachCharacter = (sceneId: string, characterId: string) => {
    const scene = chapters.find((c) => c.id === sceneId);
    if (!scene || !onUpdateChapter) return;
    onUpdateChapter(sceneId, {
      attachedCharacterIds: (scene.attachedCharacterIds || []).filter((id) => id !== characterId),
    });
    setActivePopover(null);
  };

  const handleAttachStoryline = (sceneId: string, storylineId: string) => {
    const scene = chapters.find((c) => c.id === sceneId);
    if (!scene || !onUpdateChapter) return;
    const currentPlotStates = scene.plotStates || [];
    if (!currentPlotStates.some((p) => p.storylineId === storylineId)) {
      onUpdateChapter(sceneId, {
        plotStates: [...currentPlotStates, { storylineId, status: 'Active' }],
      });
    }
    if (onUpdateStorylines) {
      onUpdateStorylines(
        storylines.map((s) =>
          s.id === storylineId && !s.linkedChapterIds?.includes(sceneId)
            ? { ...s, linkedChapterIds: [...(s.linkedChapterIds || []), sceneId] }
            : s
        )
      );
    }
    setOpenAttachDropdown(null);
  };

  const handleDetachStoryline = (sceneId: string, storylineId: string) => {
    const scene = chapters.find((c) => c.id === sceneId);
    if (scene && onUpdateChapter) {
      onUpdateChapter(sceneId, {
        plotStates: (scene.plotStates || []).filter((p) => p.storylineId !== storylineId),
      });
    }
    if (onUpdateStorylines) {
      onUpdateStorylines(
        storylines.map((s) =>
          s.id === storylineId
            ? { ...s, linkedChapterIds: (s.linkedChapterIds || []).filter((id) => id !== sceneId) }
            : s
        )
      );
    }
    setActivePopover(null);
  };

  return {
    activePopover,
    setActivePopover,
    popoverRef,
    markerPopoverRef,
    openAttachDropdown,
    setOpenAttachDropdown,
    handleOpenMarkerPopover,
    handleAttachCharacter,
    handleDetachCharacter,
    handleAttachStoryline,
    handleDetachStoryline,
  };
}
