import { useState, useEffect } from 'react';
import { WorldItem } from './types';

interface UseWorldbuildingDraftOptions {
  activeItem: WorldItem | null;
  saveMode: 'auto' | 'manual';
  onDirtyChange?: (isDirty: boolean) => void;
  onUpdateActive: (updates: Partial<WorldItem>) => void;
}

export function useWorldbuildingDraft({
  activeItem,
  saveMode,
  onDirtyChange,
  onUpdateActive,
}: UseWorldbuildingDraftOptions) {
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  useEffect(() => {
    if (activeItem) {
      setDraftTitle(activeItem.title || '');
      setDraftCategory(activeItem.category || 'Location');
      setDraftSummary(activeItem.summary || '');
      setDraftDescription(activeItem.description || '');
      setHasPendingChanges(false);
      onDirtyChange?.(false);
    }
  }, [activeItem?.id, onDirtyChange]);

  const handleSaveDraft = () => {
    if (!activeItem) return;
    handleUpdateActive({
      title: draftTitle,
      category: draftCategory,
      summary: draftSummary,
      description: draftDescription,
    });
    setHasPendingChanges(false);
    onDirtyChange?.(false);
  };

  const handleDiscardDraft = () => {
    if (!activeItem) return;
    setDraftTitle(activeItem.title || '');
    setDraftCategory(activeItem.category || 'Location');
    setDraftSummary(activeItem.summary || '');
    setDraftDescription(activeItem.description || '');
    setHasPendingChanges(false);
    onDirtyChange?.(false);
  };

  const setDirtyDraftTitle = (val: string) => {
    setDraftTitle(val);
    setHasPendingChanges(true);
    onDirtyChange?.(true);
  };

  const setDirtyDraftCategory = (val: string) => {
    setDraftCategory(val);
    setHasPendingChanges(true);
    onDirtyChange?.(true);
  };

  const setDirtyDraftSummary = (val: string) => {
    setDraftSummary(val);
    setHasPendingChanges(true);
    onDirtyChange?.(true);
  };

  const setDirtyDraftDescription = (val: string) => {
    setDraftDescription(val);
    setHasPendingChanges(true);
    onDirtyChange?.(true);
  };

  return {
    draftTitle,
    draftCategory,
    draftSummary,
    draftDescription,
    hasPendingChanges,
    setDraftTitle: setDirtyDraftTitle,
    setDraftCategory: setDirtyDraftCategory,
    setDraftSummary: setDirtyDraftSummary,
    setDraftDescription: setDirtyDraftDescription,
    handleSaveDraft,
    handleDiscardDraft,
  };
}
