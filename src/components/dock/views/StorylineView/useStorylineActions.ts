import { useState, useEffect, useCallback } from 'react';
import { StorylineItem, StorylineColor, StorylineField } from './types';

interface UseStorylineActionsOptions {
  storylines: StorylineItem[];
  onChange: (storylines: StorylineItem[]) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function useStorylineActions({
  storylines,
  onChange,
  onDirtyChange,
}: UseStorylineActionsOptions) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState<StorylineColor>('emerald');
  const [initialChapterId, setInitialChapterId] = useState<string>('');

  const [editingStorylineId, setEditingStorylineId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState<StorylineColor>('emerald');

  useEffect(() => {
    const isDirty = isAdding || editingStorylineId !== null;
    onDirtyChange?.(isDirty);
    return () => {
      onDirtyChange?.(false);
    };
  }, [isAdding, editingStorylineId, onDirtyChange]);

  const handleAddStoryline = useCallback(() => {
    if (!newTitle.trim()) return;
    const newStoryline: StorylineItem = {
      id: `storyline-${Date.now()}`,
      title: newTitle.trim(),
      color: newColor,
      description: newDescription.trim() || 'No description added.',
      linkedChapterIds: initialChapterId ? [initialChapterId] : [],
      fields: [],
    };
    onChange([...storylines, newStoryline]);
    setNewTitle('');
    setNewDescription('');
    setNewColor('purple');
    setInitialChapterId('');
    setIsAdding(false);
  }, [newTitle, newColor, newDescription, initialChapterId, onChange, storylines]);

  const handleStartEdit = useCallback((storyline: StorylineItem) => {
    setEditingStorylineId(storyline.id);
    setEditTitle(storyline.title);
    setEditDescription(storyline.description);
    setEditColor(storyline.color);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingStorylineId(null);
    setEditTitle('');
    setEditDescription('');
  }, []);

  const handleSaveEdit = useCallback(
    (storylineId: string) => {
      if (!editTitle.trim()) return;
      onChange(
        storylines.map((s) => {
          if (s.id !== storylineId) return s;
          return {
            ...s,
            title: editTitle.trim(),
            description: editDescription.trim(),
            color: editColor,
          };
        })
      );
      setEditingStorylineId(null);
    },
    [editTitle, editDescription, editColor, onChange, storylines]
  );

  const handleDeleteStoryline = useCallback(
    (id: string) => {
      if (editingStorylineId === id) {
        setEditingStorylineId(null);
      }
      onChange(storylines.filter((s) => s.id !== id));
    },
    [editingStorylineId, onChange, storylines]
  );

  const handleAddField = useCallback(
    (storylineId: string, label: string) => {
      const newField: StorylineField = {
        id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: label.trim() || 'Custom Field',
        value: '',
      };
      onChange(
        storylines.map((s) => {
          if (s.id !== storylineId) return s;
          return {
            ...s,
            fields: [...(s.fields || []), newField],
          };
        })
      );
    },
    [onChange, storylines]
  );

  const handleUpdateField = useCallback(
    (storylineId: string, fieldId: string, updates: Partial<StorylineField>) => {
      onChange(
        storylines.map((s) => {
          if (s.id !== storylineId) return s;
          return {
            ...s,
            fields: (s.fields || []).map((f) =>
              f.id === fieldId ? { ...f, ...updates } : f
            ),
          };
        })
      );
    },
    [onChange, storylines]
  );

  const handleDeleteField = useCallback(
    (storylineId: string, fieldId: string) => {
      onChange(
        storylines.map((s) => {
          if (s.id !== storylineId) return s;
          return {
            ...s,
            fields: (s.fields || []).filter((f) => f.id !== fieldId),
          };
        })
      );
    },
    [onChange, storylines]
  );

  const handleMoveField = useCallback(
    (storylineId: string, fieldIndex: number, direction: 'up' | 'down') => {
      onChange(
        storylines.map((s) => {
          if (s.id !== storylineId) return s;
          const fields = [...(s.fields || [])];
          const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
          if (targetIndex < 0 || targetIndex >= fields.length) return s;
          const [movedField] = fields.splice(fieldIndex, 1);
          fields.splice(targetIndex, 0, movedField);
          return { ...s, fields };
        })
      );
    },
    [onChange, storylines]
  );

  const handleLinkChapter = useCallback(
    (storylineId: string, chapterId: string) => {
      if (!chapterId) return;
      onChange(storylines.map((s) => s.id !== storylineId || s.linkedChapterIds.includes(chapterId)
        ? s
        : { ...s, linkedChapterIds: [...s.linkedChapterIds, chapterId] }
      ));
    },
    [onChange, storylines]
  );

  const handleUnlinkChapter = useCallback(
    (storylineId: string, chapterId: string) => {
      onChange(storylines.map((s) => s.id !== storylineId
        ? s
        : { ...s, linkedChapterIds: s.linkedChapterIds.filter((id) => id !== chapterId) }
      ));
    },
    [onChange, storylines]
  );

  const handleLinkWorldItem = useCallback(
    (storylineId: string, worldItemId: string) => {
      if (!worldItemId) return;
      onChange(storylines.map((s) => {
        if (s.id !== storylineId) return s;
        const currentLinks = s.linkedWorldItemIds || [];
        if (currentLinks.includes(worldItemId)) return s;
        return { ...s, linkedWorldItemIds: [...currentLinks, worldItemId] };
      }));
    },
    [onChange, storylines]
  );

  const handleUnlinkWorldItem = useCallback(
    (storylineId: string, worldItemId: string) => {
      onChange(storylines.map((s) => s.id !== storylineId
        ? s
        : { ...s, linkedWorldItemIds: (s.linkedWorldItemIds || []).filter((id) => id !== worldItemId) }
      ));
    },
    [onChange, storylines]
  );


  return {
    isAdding,
    setIsAdding,
    newTitle,
    setNewTitle,
    newDescription,
    setNewDescription,
    newColor,
    setNewColor,
    initialChapterId,
    setInitialChapterId,
    editingStorylineId,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editColor,
    setEditColor,
    handleAddStoryline,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteStoryline,
    handleAddField,
    handleUpdateField,
    handleDeleteField,
    handleMoveField,
    handleLinkChapter,
    handleUnlinkChapter,
    handleLinkWorldItem,
    handleUnlinkWorldItem,
  };
}
