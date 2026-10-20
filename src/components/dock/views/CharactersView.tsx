import { useState } from 'react';
import {
  Plus,
  Trash2,
  UserPlus,
  Pencil,
  Check,
  X,
  Tag,
  Layers,
} from 'lucide-react';
import { CharacterItem, CharacterCustomField, CharacterTag } from '../../../types/dock';
import {
  AppColorSettings,
  COLOR_SWATCHES,
  DEFAULT_COLOR_SETTINGS,
} from '../../../types/settings';

interface CharactersViewProps {
  characters: CharacterItem[];
  onChange: (characters: CharacterItem[]) => void;
  isExpanded?: boolean;
  colorSettings?: AppColorSettings;
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

const PRESET_CHARACTER_FIELDS = [
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
}: CharactersViewProps) {
  // New character drawer state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<CharacterItem['role']>('Protagonist');
  const [newSummary, setNewSummary] = useState('');

  // Edit existing character state
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<CharacterItem['role']>('Protagonist');
  const [editSummary, setEditSummary] = useState('');
  const [editTags, setEditTags] = useState<CharacterTag[]>([]);
  const [editFields, setEditFields] = useState<CharacterCustomField[]>([]);

  // New tag draft state within editor
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState('blue');

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
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const newTag: CharacterTag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: newTagInput.trim(),
      color: selectedTagColor,
    };
    setEditTags([...editTags, newTag]);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagId: string) => {
    setEditTags(editTags.filter((t) => t.id !== tagId));
  };

  // ---------------------------------------------------------------------------
  // Modular Field Handlers
  // ---------------------------------------------------------------------------
  const handleAddField = (label: string) => {
    const newField: CharacterCustomField = {
      id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: label.trim() || 'Custom Field',
      value: '',
    };
    setEditFields([...editFields, newField]);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<CharacterCustomField>) => {
    setEditFields(
      editFields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    );
  };

  const handleDeleteField = (fieldId: string) => {
    setEditFields(editFields.filter((f) => f.id !== fieldId));
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
        {role}
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
          Cast & Characters ({characters.length})
        </span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          title="Add Character"
          className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-zinc-100 transition"
          aria-label="Add Character"
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
              placeholder="Character name..."
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
                <option value="Protagonist">Protagonist</option>
                <option value="Antagonist">Antagonist</option>
                <option value="Supporting">Supporting</option>
                <option value="Minor">Minor</option>
                <option value="__custom__">Custom Role...</option>
              </select>
              {!['Protagonist', 'Antagonist', 'Supporting', 'Minor'].includes(newRole) && (
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Mentor, Foil..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              )}
            </div>
          </div>
          <textarea
            placeholder="Quick notes, traits, backstory, or motivation..."
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            rows={2}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans leading-relaxed"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setIsAdding(false)}
              className="px-2.5 py-1 rounded-sm text-xs text-zinc-400 hover:text-zinc-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="px-3 py-1 rounded-sm text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition"
            >
              Add Character
            </button>
          </div>
        </div>
      )}

      {/* Characters List */}
      <div className="flex-1 overflow-y-auto p-3">
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-600 gap-2">
            <p className="text-xs">No characters listed yet.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline"
            >
              Create your first character profile
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
                        Edit Character Profile
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(char.id)}
                          disabled={!editName.trim()}
                          className="p-1 rounded-sm bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition"
                          title="Save character changes"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 transition"
                          title="Cancel edit"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Name & Role Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Character name..."
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
                            if (e.target.value === '__custom__') {
                              setEditRole('Mentor');
                            } else {
                              setEditRole(e.target.value);
                            }
                          }}
                          className="bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
                        >
                          <option value="Protagonist">Protagonist</option>
                          <option value="Antagonist">Antagonist</option>
                          <option value="Supporting">Supporting</option>
                          <option value="Minor">Minor</option>
                          <option value="__custom__">Custom Role...</option>
                        </select>
                        {!['Protagonist', 'Antagonist', 'Supporting', 'Minor'].includes(editRole) && (
                          <input
                            type="text"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            placeholder="Role (e.g. Mentor, Foil)..."
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                          />
                        )}
                      </div>
                    </div>

                    {/* Summary */}
                    <textarea
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      placeholder="Summary notes, persona, and core identity..."
                      rows={2}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans leading-relaxed"
                    />

                    {/* Custom Color Tags Section */}
                    <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-zinc-500" />
                          Tags ({editTags.length})
                        </span>
                      </div>

                      {/* Existing Tags Chips */}
                      {editTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {editTags.map((tag) =>
                            renderTagBadge(tag, () => handleRemoveTag(tag.id))
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
                              handleAddTag();
                            }
                          }}
                          placeholder="New tag label..."
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
                          onClick={handleAddTag}
                          disabled={!newTagInput.trim()}
                          className="px-2 py-0.5 rounded-sm text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Modular Custom Fields Section */}
                    <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5 text-zinc-500" />
                          Character Fields ({editFields.length})
                        </span>
                      </div>

                      {/* Quick Insert Preset Buttons */}
                      <div className="flex flex-wrap gap-1">
                        {PRESET_CHARACTER_FIELDS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleAddField(preset)}
                            className="px-1.5 py-0.5 rounded-xs text-[10px] bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition"
                          >
                            + {preset}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddField('Custom Field')}
                          className="px-1.5 py-0.5 rounded-xs text-[10px] bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition font-medium"
                        >
                          + Custom Field
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
                                    handleUpdateField(field.id, {
                                      label: e.target.value,
                                    })
                                  }
                                  placeholder="Field label..."
                                  className="bg-transparent hover:bg-zinc-900 focus:bg-zinc-900 px-1 py-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300 focus:text-white border border-transparent focus:border-zinc-700 rounded-xs focus:outline-none transition-colors max-w-[150px]"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteField(field.id)}
                                  className="p-0.5 text-zinc-500 hover:text-red-400 transition"
                                  title="Delete field"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <textarea
                                value={field.value}
                                onChange={(e) =>
                                  handleUpdateField(field.id, {
                                    value: e.target.value,
                                  })
                                }
                                placeholder={`Enter ${field.label.toLowerCase()} details...`}
                                rows={2}
                                className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xs px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans leading-relaxed"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Display Mode Card
              return (
                <div
                  key={char.id}
                  className="group border border-zinc-850 rounded-sm bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 transition p-3 space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Header: Name, Role Badge, Edit and Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-zinc-100 truncate block">
                          {char.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {getRoleBadge(char.role)}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(char)}
                          title="Edit character profile"
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-xs transition"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(char.id)}
                          title="Remove Character"
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-xs transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Color Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => renderTagBadge(tag))}
                      </div>
                    )}

                    {/* Summary */}
                    {char.summary && (
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
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
            className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded-sm text-[11px] font-medium text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Character</span>
          </button>
        </div>
      )}
    </div>
  );
}
