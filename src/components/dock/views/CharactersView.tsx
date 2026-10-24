import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  UserPlus,
  Pencil,
  Check,
  X,
  Tag,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Camera,
} from 'lucide-react';
import { CharacterItem, CharacterCustomField, CharacterTag } from '../../../types/dock';
import {
  AppColorSettings,
  COLOR_SWATCHES,
  DEFAULT_COLOR_SETTINGS,
} from '../../../types/settings';
import { useTranslation, getRoleLabel } from '../../../i18n/translations';

interface CharactersViewProps {
  characters: CharacterItem[];
  onChange: (characters: CharacterItem[]) => void;
  isExpanded?: boolean;
  colorSettings?: AppColorSettings;
  saveMode?: 'auto' | 'manual';
  onDirtyChange?: (isDirty: boolean) => void;
}

const TAG_COLOR_MAP: Record<
  string,
  { bg: string; border: string; text: string; dot: string }
> = {
  emerald: {
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-800/60',
    text: 'text-emerald-300',
    dot: 'bg-emerald-500',
  },
  purple: {
    bg: 'bg-purple-950/40',
    border: 'border-purple-800/60',
    text: 'text-purple-300',
    dot: 'bg-purple-500',
  },
  amber: {
    bg: 'bg-amber-950/40',
    border: 'border-amber-800/60',
    text: 'text-amber-300',
    dot: 'bg-amber-500',
  },
  blue: {
    bg: 'bg-blue-950/40',
    border: 'border-blue-800/60',
    text: 'text-blue-300',
    dot: 'bg-blue-500',
  },
  rose: {
    bg: 'bg-rose-950/40',
    border: 'border-rose-800/60',
    text: 'text-rose-300',
    dot: 'bg-rose-500',
  },
  cyan: {
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-800/60',
    text: 'text-cyan-300',
    dot: 'bg-cyan-500',
  },
  zinc: {
    bg: 'bg-zinc-850',
    border: 'border-zinc-750',
    text: 'text-zinc-300',
    dot: 'bg-zinc-400',
  },
};

export const PRESET_CHARACTER_FIELDS = [
  'Motivation',
  'Backstory',
  'Internal Conflict',
  'Appearance',
] as const;

export default function CharactersView({
  characters,
  onChange,
  isExpanded = false,
  colorSettings,
  saveMode = 'auto',
  onDirtyChange,
}: CharactersViewProps) {
  const { t } = useTranslation();

  // New character drawer state
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

  // New tag draft state within editor
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState('blue');

  // Collapsed by default: Track expanded cards
  const [expandedCharacterIds, setExpandedCharacterIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedCharacterIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Real-time updater for auto-save mode
  const handleUpdateActiveChar = (charId: string, updates: Partial<CharacterItem>) => {
    if (saveMode === 'auto') {
      onChange(characters.map((c) => (c.id === charId ? { ...c, ...updates } : c)));
    }
  };

  // ---------------------------------------------------------------------------
  // Creation Handlers
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Editing Handlers
  // ---------------------------------------------------------------------------
  const handleStartEdit = (char: CharacterItem) => {
    setEditingCharacterId(char.id);
    setEditName(char.name);
    setEditRole(char.role);
    setEditSummary(char.summary);
    setEditAvatarUrl(char.avatarUrl);
    setEditTags(char.tags ? [...char.tags] : []);
    setEditFields(char.fields ? [...char.fields] : []);
    setNewTagInput('');
    setSelectedTagColor('blue');
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

  // ---------------------------------------------------------------------------
  // Tag Management Handlers
  // ---------------------------------------------------------------------------
  const handleAddTag = (charId: string) => {
    if (!newTagInput.trim()) return;
    const newTag: CharacterTag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: newTagInput.trim(),
      color: selectedTagColor,
    };
    const nextTags = [...editTags, newTag];
    setEditTags(nextTags);
    handleUpdateActiveChar(charId, { tags: nextTags });
    setNewTagInput('');
  };

  const handleRemoveTag = (charId: string, tagId: string) => {
    const nextTags = editTags.filter((t) => t.id !== tagId);
    setEditTags(nextTags);
    handleUpdateActiveChar(charId, { tags: nextTags });
  };

  // ---------------------------------------------------------------------------
  // Modular Field Handlers
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------
  const getRoleBadge = (role: CharacterItem['role']) => {
    const roleKey = role ?? 'Minor';
    const colorKey =
      colorSettings?.roles[roleKey] ??
      DEFAULT_COLOR_SETTINGS.roles[roleKey] ??
      'zinc';
    const swatch = COLOR_SWATCHES[colorKey] ?? COLOR_SWATCHES.zinc;

    return (
      <span
        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-xs border ${swatch.badgeBg} ${swatch.badgeBorder} ${swatch.badgeText}`}
      >
        {getRoleLabel(role, t)}
      </span>
    );
  };

  const renderTagBadge = (tag: CharacterTag, onRemove?: () => void) => {
    const style = TAG_COLOR_MAP[tag.color] ?? TAG_COLOR_MAP.zinc;
    return (
      <span
        key={tag.id}
        className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-xs border ${style.bg} ${style.border} ${style.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        <span>{tag.label}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="hover:text-red-400 ml-0.5 transition"
            title="Remove tag"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full select-none bg-zinc-950 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/60">
        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
          {t('castAndCharacters')} ({characters.length})
        </span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          title={t('addCharacter')}
          className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-zinc-100 transition"
          aria-label={t('addCharacter')}
        >
          <UserPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Adding Form */}
      {isAdding && (
        <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/90 space-y-2.5 animate-in fade-in duration-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder={t('characterNamePlaceholder')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              <select
                value={
                  ['Protagonist', 'Antagonist', 'Supporting', 'Minor'].includes(newRole)
                    ? newRole
                    : '__custom__'
                }
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setNewRole('Mentor');
                  } else {
                    setNewRole(e.target.value);
                  }
                }}
                className="bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
              >
                <option value="Protagonist">{t('roleProtagonist')}</option>
                <option value="Antagonist">{t('roleAntagonist')}</option>
                <option value="Supporting">{t('roleSupporting')}</option>
                <option value="Minor">{t('roleMinor')}</option>
                <option value="__custom__">{t('roleCustom')}</option>
              </select>
              {!['Protagonist', 'Antagonist', 'Supporting', 'Minor'].includes(newRole) && (
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder={t('customRolePlaceholder')}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              )}
            </div>
          </div>
          <textarea
            placeholder={t('characterNotesPlaceholder')}
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            rows={2}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans leading-relaxed transition-all duration-200 focus:min-h-[150px]"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setIsAdding(false)}
              className="px-2.5 py-1 rounded-sm text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="px-3 py-1 rounded-sm text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition cursor-pointer"
            >
              {t('addCharacter')}
            </button>
          </div>
        </div>
      )}

      {/* Characters List */}
      <div className="flex-1 overflow-y-auto p-3">
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-600 gap-2">
            <p className="text-xs">{t('noCharactersYet')}</p>
            <button
              onClick={() => setIsAdding(true)}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
            >
              {t('addCharacter')}
            </button>
          </div>
        ) : (
          <div
            className={
              isExpanded
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 items-start'
                : 'space-y-3'
            }
          >
            {characters.map((char) => {
              const isEditing = editingCharacterId === char.id;
              const tags = char.tags || [];
              const fields = char.fields || [];

              if (isEditing) {
                return (
                  <div
                    key={char.id}
                    className="border border-zinc-700 bg-zinc-900/90 rounded-sm p-3 space-y-3 shadow-lg animate-in fade-in duration-100"
                  >
                    {/* Edit Header */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                        {t('edit')} - {char.name}
                      </span>
                      <div className="flex items-center gap-1">
                        {saveMode === 'manual' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(char.id)}
                              disabled={!editName.trim()}
                              className="p-1 rounded-sm bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition cursor-pointer"
                              title={t('save')}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                              title={t('cancelEdit')}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingCharacterId(null)}
                            className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
                            title={t('close')}
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Avatar & Name/Role Block */}
                    <div className="flex items-center gap-3">
                      <label
                        className="w-12 h-12 rounded-sm bg-zinc-950 border border-zinc-750 hover:border-zinc-500 overflow-hidden flex items-center justify-center text-zinc-300 font-bold text-sm shrink-0 font-mono cursor-pointer transition relative group/avatar shadow-xs"
                        title="Upload character portrait"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const result = reader.result as string;
                                setEditAvatarUrl(result);
                                handleUpdateActiveChar(char.id, { avatarUrl: result });
                              };
                              reader.readAsDataURL(file);
                            }
                            e.target.value = '';
                          }}
                        />
                        {editAvatarUrl ? (
                          <img
                            src={editAvatarUrl}
                            alt={editName}
                            className="w-full h-full object-cover transition-transform group-hover/avatar:scale-105"
                          />
                        ) : editName ? (
                          editName.charAt(0).toUpperCase()
                        ) : (
                          <User className="w-5 h-5 text-zinc-400" />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Camera className="w-4 h-4" />
                        </div>
                      </label>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => {
                            setEditName(e.target.value);
                            handleUpdateActiveChar(char.id, { name: e.target.value });
                          }}
                          placeholder={t('characterNamePlaceholder')}
                          className="bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                          autoFocus
                        />
                        <div className="flex items-center gap-1.5">
                          <select
                            value={
                              ['Protagonist', 'Antagonist', 'Supporting', 'Minor'].includes(editRole)
                                ? editRole
                                : '__custom__'
                            }
                            onChange={(e) => {
                              const val = e.target.value === '__custom__' ? 'Mentor' : e.target.value;
                              setEditRole(val);
                              handleUpdateActiveChar(char.id, { role: val });
                            }}
                            className="bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
                          >
                            <option value="Protagonist">{t('roleProtagonist')}</option>
                            <option value="Antagonist">{t('roleAntagonist')}</option>
                            <option value="Supporting">{t('roleSupporting')}</option>
                            <option value="Minor">{t('roleMinor')}</option>
                            <option value="__custom__">{t('roleCustom')}</option>
                          </select>
                          {!['Protagonist', 'Antagonist', 'Supporting', 'Minor'].includes(editRole) && (
                            <input
                              type="text"
                              value={editRole}
                              onChange={(e) => {
                                setEditRole(e.target.value);
                                handleUpdateActiveChar(char.id, { role: e.target.value });
                              }}
                              placeholder={t('customRolePlaceholder')}
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <textarea
                      value={editSummary}
                      onChange={(e) => {
                        setEditSummary(e.target.value);
                        handleUpdateActiveChar(char.id, { summary: e.target.value });
                      }}
                      placeholder={t('characterSummaryPlaceholder')}
                      rows={2}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans leading-relaxed transition-all duration-200 focus:min-h-[150px]"
                    />

                    {/* Custom Color Tags Section */}
                    <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-zinc-500" />
                          {t('tags')} ({editTags.length})
                        </span>
                      </div>

                      {/* Existing Tags Chips */}
                      {editTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {editTags.map((tag) =>
                            renderTagBadge(tag, () => handleRemoveTag(char.id, tag.id))
                          )}
                        </div>
                      )}

                      {/* Add Tag Row */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag(char.id);
                            }
                          }}
                          placeholder={t('newTagPlaceholder')}
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-0.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                        />

                        {/* Tag Color Picker Dots */}
                        <div className="flex items-center gap-1">
                          {Object.keys(TAG_COLOR_MAP).map((cKey) => {
                            const c = TAG_COLOR_MAP[cKey];
                            return (
                              <button
                                key={cKey}
                                type="button"
                                onClick={() => setSelectedTagColor(cKey)}
                                className={`w-3 h-3 rounded-full transition-transform ${c.dot} ${
                                  selectedTagColor === cKey
                                    ? 'scale-125 ring-1 ring-zinc-300 ring-offset-1 ring-offset-zinc-900'
                                    : 'opacity-50 hover:opacity-100'
                                }`}
                                title={cKey}
                              />
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddTag(char.id)}
                          disabled={!newTagInput.trim()}
                          className="px-2 py-0.5 rounded-sm text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition cursor-pointer"
                        >
                          {t('add')}
                        </button>
                      </div>
                    </div>

                    {/* Modular Custom Fields Section */}
                    <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5 text-zinc-500" />
                          {t('customFields')} ({editFields.length})
                        </span>
                      </div>

                      {/* Quick Insert Preset Buttons */}
                      <div className="flex flex-wrap gap-1">
                        {[
                          { key: 'Motivation', label: t('fieldMotivation') },
                          { key: 'Backstory', label: t('fieldBackstory') },
                          { key: 'Internal Conflict', label: t('fieldInternalConflict') },
                          { key: 'Appearance', label: t('fieldAppearance') },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleAddField(char.id, label)}
                            className="px-1.5 py-0.5 rounded-xs text-[10px] bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                          >
                            + {label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddField(char.id, t('customFields'))}
                          className="px-1.5 py-0.5 rounded-xs text-[10px] bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition font-medium cursor-pointer"
                        >
                          + {t('addField')}
                        </button>
                      </div>

                      {/* Fields Form List */}
                      {editFields.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {editFields.map((field) => (
                            <div
                              key={field.id}
                              className="bg-zinc-950/80 border border-zinc-800/90 rounded-sm p-2 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) =>
                                    handleUpdateField(char.id, field.id, {
                                      label: e.target.value,
                                    })
                                  }
                                  placeholder={t('fieldLabelPlaceholder')}
                                  className="bg-transparent hover:bg-zinc-900 focus:bg-zinc-900 px-1 py-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300 focus:text-white border border-transparent focus:border-zinc-700 rounded-xs focus:outline-none transition-colors max-w-[150px]"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteField(char.id, field.id)}
                                  className="p-0.5 text-zinc-500 hover:text-red-400 transition"
                                  title="Delete field"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <textarea
                                value={field.value}
                                onChange={(e) =>
                                  handleUpdateField(char.id, field.id, {
                                    value: e.target.value,
                                  })
                                }
                                placeholder={`Enter ${field.label.toLowerCase()} details...`}
                                rows={2}
                                className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xs px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans leading-relaxed transition-all duration-200 focus:min-h-[150px]"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Display Mode Card (Collapsed by default, expands on click)
              const isCardOpen = Boolean(expandedCharacterIds[char.id]);

              return (
                <div
                  key={char.id}
                  className="group border border-zinc-850 rounded-sm bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 transition overflow-hidden"
                >
                  {/* Collapsed Header Bar (Always visible) */}
                  <div
                    onClick={() => toggleExpand(char.id)}
                    className="p-2.5 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-zinc-850/50 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Avatar / Profile Image with Lightbox click */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (char.avatarUrl) {
                            setLightboxImage({ url: char.avatarUrl, title: char.name });
                          }
                        }}
                        className={`w-7 h-7 rounded-xs bg-zinc-850 border border-zinc-750 overflow-hidden flex items-center justify-center text-zinc-300 font-bold text-[10px] shrink-0 font-mono transition relative shadow-xs select-none ${
                          char.avatarUrl ? 'cursor-pointer hover:border-zinc-400 hover:ring-1 hover:ring-zinc-400/40' : ''
                        }`}
                        title={char.avatarUrl ? 'Click to view portrait' : char.name}
                      >
                        {char.avatarUrl ? (
                          <img
                            src={char.avatarUrl}
                            alt={char.name}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                          />
                        ) : char.name ? (
                          char.name.charAt(0).toUpperCase()
                        ) : (
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-zinc-100 truncate block">
                          {char.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {getRoleBadge(char.role)}

                      <button
                        type="button"
                        onClick={() => {
                          if (editingCharacterId === char.id) {
                            setEditingCharacterId(null);
                          } else {
                            handleStartEdit(char);
                          }
                        }}
                        title={t('editCharacterProfile')}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-xs transition cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(char.id)}
                        title={t('deleteCharacter')}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-xs transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(char.id)}
                        title={isCardOpen ? 'Collapse card' : 'Expand card'}
                        className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xs transition cursor-pointer"
                      >
                        {isCardOpen ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Body: Summary, Tags, and Custom Fields */}
                  {isCardOpen && (
                    <div className="p-3 pt-0 border-t border-zinc-850/60 mt-1 space-y-2.5 animate-in fade-in duration-100">
                      {/* Color Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {tags.map((tag) => renderTagBadge(tag))}
                        </div>
                      )}

                      {/* Summary */}
                      {char.summary && (
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans pt-1">
                          {char.summary}
                        </p>
                      )}

                      {/* Modular Custom Fields Display */}
                      {fields.length > 0 && (
                        <div className="pt-2 border-t border-zinc-850/80 space-y-2">
                          {fields.map((field) => (
                            <div
                              key={field.id}
                              className="bg-zinc-950/60 border border-zinc-850/70 rounded-xs p-2 space-y-0.5"
                            >
                              <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block font-medium">
                                {field.label}
                              </span>
                              <p className="text-[11px] text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                                {field.value || (
                                  <span className="text-zinc-600 italic">No notes added.</span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Add Button Footer */}
      {!isAdding && (
        <div className="p-2 border-t border-zinc-850 bg-zinc-950/80">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded-sm text-[11px] font-medium text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addCharacter')}</span>
          </button>
        </div>
      )}

      {/* Lightbox Modal for Character Portrait */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center cursor-default bg-zinc-950/90 border border-zinc-800 rounded-sm p-2 shadow-2xl"
          >
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-zinc-850 px-2">
              <span className="text-xs font-semibold text-zinc-200 truncate">{lightboxImage.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-xs hover:bg-zinc-800 transition cursor-pointer"
                title="Close lightbox"
                aria-label="Close lightbox"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center overflow-auto max-h-[80vh] w-full p-1">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-w-full max-h-[80vh] object-contain rounded-xs shadow-md select-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
