import { useState, useEffect } from 'react';
import { CharacterItem, CharacterCustomField, CharacterTag } from './types';

interface UseCharactersStateProps {
  characters: CharacterItem[];
  onChange: (characters: CharacterItem[]) => void;
  saveMode?: 'auto' | 'manual';
  onDirtyChange?: (isDirty: boolean) => void;
}

export function useCharactersState({
  characters,
  onChange,
  saveMode = 'auto',
  onDirtyChange,
}: UseCharactersStateProps) {
  // Add character state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<CharacterItem['role']>('Protagonist');
  const [newSummary, setNewSummary] = useState('');

  // Edit existing character state
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<CharacterItem['role']>('Protagonist');
  const [editSummary, setEditSummary] = useState('');
  const [editTags, setEditTags] = useState<CharacterTag[]>([]);
  const [editFields, setEditFields] = useState<CharacterCustomField[]>([]);
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const isDirty =
      saveMode === 'manual'
        ? isAdding || editingCharacterId !== null
        : isAdding && newName.trim().length > 0;
    onDirtyChange?.(isDirty);
    return () => {
      onDirtyChange?.(false);
    };
  }, [isAdding, newName, editingCharacterId, saveMode, onDirtyChange]);

  const [expandedCharacterIds, setExpandedCharacterIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedCharacterIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateActiveChar = (charId: string, updates: Partial<CharacterItem>) => {
    if (saveMode === 'auto') {
      onChange(characters.map((c) => (c.id === charId ? { ...c, ...updates } : c)));
    }
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newChar: CharacterItem = {
      id: `char-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      summary: newSummary.trim() || 'No description yet.',
      tags: [],
      fields: [],
    };
    onChange([...characters, newChar]);
    setNewName('');
    setNewSummary('');
    setNewRole('Supporting');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (editingCharacterId === id) {
      setEditingCharacterId(null);
    }
    onChange(characters.filter((c) => c.id !== id));
  };

  const handleStartEdit = (char: CharacterItem) => {
    setEditingCharacterId(char.id);
    setEditName(char.name);
    setEditRole(char.role);
    setEditSummary(char.summary);
    setEditAvatarUrl(char.avatarUrl);
    setEditTags(char.tags ? [...char.tags] : []);
    setEditFields(char.fields ? [...char.fields] : []);
  };

  const handleCancelEdit = () => {
    setEditingCharacterId(null);
  };

  const handleSaveEdit = (charId: string) => {
    if (!editName.trim()) return;
    onChange(
      characters.map((c) =>
        c.id === charId
          ? {
              ...c,
              name: editName.trim(),
              role: editRole,
              summary: editSummary.trim() || 'No description yet.',
              avatarUrl: editAvatarUrl,
              tags: editTags,
              fields: editFields,
            }
          : c
      )
    );
    setEditingCharacterId(null);
  };

  const handleAddTag = (charId: string, label: string, color: string) => {
    const newTag: CharacterTag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      color,
    };
    const nextTags = [...editTags, newTag];
    setEditTags(nextTags);
    handleUpdateActiveChar(charId, { tags: nextTags });
  };

  const handleRemoveTag = (charId: string, tagId: string) => {
    const nextTags = editTags.filter((t) => t.id !== tagId);
    setEditTags(nextTags);
    handleUpdateActiveChar(charId, { tags: nextTags });
  };

  const handleAddField = (charId: string, label: string) => {
    const newField: CharacterCustomField = {
      id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: label.trim() || 'Custom Field',
      value: '',
    };
    const nextFields = [...editFields, newField];
    setEditFields(nextFields);
    handleUpdateActiveChar(charId, { fields: nextFields });
  };

  const handleUpdateField = (
    charId: string,
    fieldId: string,
    updates: Partial<CharacterCustomField>
  ) => {
    const nextFields = editFields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f));
    setEditFields(nextFields);
    handleUpdateActiveChar(charId, { fields: nextFields });
  };

  const handleDeleteField = (charId: string, fieldId: string) => {
    const nextFields = editFields.filter((f) => f.id !== fieldId);
    setEditFields(nextFields);
    handleUpdateActiveChar(charId, { fields: nextFields });
  };

  return {
    isAdding,
    setIsAdding,
    newName,
    setNewName,
    newRole,
    setNewRole,
    newSummary,
    setNewSummary,
    editingCharacterId,
    setEditingCharacterId,
    lightboxImage,
    setLightboxImage,
    editName,
    setEditName,
    editRole,
    setEditRole,
    editSummary,
    setEditSummary,
    editTags,
    editFields,
    editAvatarUrl,
    setEditAvatarUrl,
    expandedCharacterIds,
    toggleExpand,
    handleUpdateActiveChar,
    handleAdd,
    handleDelete,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleAddTag,
    handleRemoveTag,
    handleAddField,
    handleUpdateField,
    handleDeleteField,
  };
}
