import { useState } from 'react';
import { TextNode } from '../../../../types/project';
import { TimelineMarker } from '../../../../types/dock';
import { ActiveMarkerPopoverState } from './types';

interface UseTimelineMarkersParams {
  chapters: TextNode[];
  onUpdateChapter?: (id: string, updates: Partial<TextNode>) => void;
}

export function useTimelineMarkers({
  chapters,
  onUpdateChapter,
}: UseTimelineMarkersParams) {
  const [activeMarkerPopover, setActiveMarkerPopover] = useState<ActiveMarkerPopoverState | null>(null);

  const handleAddMarker = (sceneId: string) => {
    if (!onUpdateChapter) return;
    const scene = chapters.find((c) => c.id === sceneId);
    if (!scene) return;

    const newMarker: TimelineMarker = {
      id: `marker-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: 'Key Event / Alert',
      description: '',
      icon: 'alert',
      color: 'rose',
    };

    const updated = [...(scene.markers || []), newMarker];
    onUpdateChapter(sceneId, { markers: updated });
    setActiveMarkerPopover({ sceneId, markerId: newMarker.id });
  };

  const handleUpdateMarker = (
    sceneId: string,
    markerId: string,
    updates: Partial<TimelineMarker>
  ) => {
    if (!onUpdateChapter) return;
    const scene = chapters.find((c) => c.id === sceneId);
    if (!scene) return;

    const updated = (scene.markers || []).map((m) =>
      m.id === markerId ? { ...m, ...updates } : m
    );

    onUpdateChapter(sceneId, { markers: updated });
  };

  const handleDeleteMarker = (sceneId: string, markerId: string) => {
    if (!onUpdateChapter) return;
    const scene = chapters.find((c) => c.id === sceneId);
    if (!scene) return;

    const updated = (scene.markers || []).filter((m) => m.id !== markerId);
    onUpdateChapter(sceneId, { markers: updated });
    setActiveMarkerPopover(null);
  };

  return {
    activeMarkerPopover,
    setActiveMarkerPopover,
    handleAddMarker,
    handleUpdateMarker,
    handleDeleteMarker,
  };
}
