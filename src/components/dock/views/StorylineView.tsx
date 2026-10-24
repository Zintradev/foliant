import { useState, useMemo, useEffect } from 'react';
import {
  GitMerge,
  Plus,
  Trash2,
  BookmarkCheck,
  Link2,
  X,
  ChevronDown,
  BookOpen,
  Pencil,
  Check,
  ChevronUp,
  Layers,
  Globe,
} from 'lucide-react';
import { TextNode } from '../../../types/project';
import { StorylineItem, StorylineColor, StorylineField, WorldItem } from '../../../types/dock';
import { AppColorSettings, COLOR_SWATCHES } from '../../../types/settings';
import { useTranslation } from '../../../i18n/translations';

interface StorylineViewProps {
  storylines: StorylineItem[];
  chapters: TextNode[];
  worldItems?: WorldItem[];
  onChange: (storylines: StorylineItem[]) => void;
  onSelectChapter?: (chapterId: string) => void;
  colorSettings?: AppColorSettings;
  isExpanded?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

function CollapsibleStorylineDescription({ description }: { description: string }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = description.length > 130;

  return (
    <div className="space-y-1">
      <p
        className={`text-[11px] text-zinc-400 font-sans leading-relaxed ${
          !isExpanded && isLong ? 'line-clamp-2' : ''
        }`}
      >
        {description}
      </p>
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

type ViewMode = 'threads' | 'chapters';

const STORYLINE_COLORS: StorylineColor[] = [
  'emerald',
  'purple',
  'amber',
  'blue',
  'rose',
  'cyan',
];

const PRESET_FIELDS = [
  'Motivation',
  'Beginning',
  'Turning Point',
  'Resolution',
] as const;

const COLOR_CLASSES: Record<
  StorylineColor,
  { bg: string; border: string; text: string; dot: string }
> = {
  emerald: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-750',
    text: 'text-zinc-200',
    dot: 'bg-emerald-500',
  },
  purple: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-750',
    text: 'text-zinc-200',
    dot: 'bg-purple-500',
  },
  amber: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-750',
    text: 'text-zinc-200',
    dot: 'bg-amber-500',
  },
  blue: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-750',
    text: 'text-zinc-200',
    dot: 'bg-blue-500',
  },
  rose: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-750',
    text: 'text-zinc-200',
    dot: 'bg-rose-500',
  },
  cyan: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-750',
    text: 'text-zinc-200',
    dot: 'bg-cyan-500',
  },
};

export default function StorylineView({
  storylines,
  chapters,
  worldItems = [],
  onChange,
  onSelectChapter,
  colorSettings,
  isExpanded = false,
  onDirtyChange,
}: StorylineViewProps) {
  const { t } = useTranslation();

  const getPresetFieldLabel = (preset: typeof PRESET_FIELDS[number]): string => {
    switch (preset) {
      case 'Motivation':
        return t('fieldMotivation');
      case 'Beginning':
        return t('presetBeginning');
      case 'Turning Point':
        return t('presetTurningPoint');
      case 'Resolution':
        return t('presetResolution');
      default:
        return preset;
    }
  };

  const [viewMode, setViewMode] = useState<ViewMode>('threads');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState<StorylineColor>('emerald');
  const [initialChapterId, setInitialChapterId] = useState<string>('');

  // Filter out folder nodes for chapter linking
  const validChapters = useMemo(
    () => chapters.filter((c) => c.type !== 'folder'),
    [chapters]
  );

  // ---------------------------------------------------------------------------
  // Card Edit State
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Card Creation & Editing Handlers
  // ---------------------------------------------------------------------------
  const handleAddStoryline = () => {
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
  };

  const handleStartEdit = (storyline: StorylineItem) => {
    setEditingStorylineId(storyline.id);
    setEditTitle(storyline.title);
    setEditDescription(storyline.description);
    setEditColor(storyline.color);
  };

  const handleCancelEdit = () => {
    setEditingStorylineId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleSaveEdit = (storylineId: string) => {
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
  };

  const handleDeleteStoryline = (id: string) => {
    if (editingStorylineId === id) {
      setEditingStorylineId(null);
    }
    onChange(storylines.filter((s) => s.id !== id));
  };

  // ---------------------------------------------------------------------------
  // Modular Fields Handlers
  // ---------------------------------------------------------------------------
  const handleAddField = (storylineId: string, label: string) => {
    const newField: StorylineField = {
      id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: label.trim() || 'Custom Field',
      value: '',
    };
    onChange(
      storylines.map((s) => {
        if (s.id !== storylineId) return s;
        const existingFields = s.fields || [];
        return {
          ...s,
          fields: [...existingFields, newField],
        };
      })
    );
  };

  const handleUpdateField = (
    storylineId: string,
    fieldId: string,
    updates: Partial<StorylineField>
  ) => {
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
  };

  const handleDeleteField = (storylineId: string, fieldId: string) => {
    onChange(
      storylines.map((s) => {
        if (s.id !== storylineId) return s;
        return {
          ...s,
          fields: (s.fields || []).filter((f) => f.id !== fieldId),
        };
      })
    );
  };

  const handleMoveField = (
    storylineId: string,
    fieldIndex: number,
    direction: 'up' | 'down'
  ) => {
    onChange(
      storylines.map((s) => {
        if (s.id !== storylineId) return s;
        const fields = [...(s.fields || [])];
        const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
        if (targetIndex < 0 || targetIndex >= fields.length) return s;

        const [movedField] = fields.splice(fieldIndex, 1);
        fields.splice(targetIndex, 0, movedField);

        return {
          ...s,
          fields,
        };
      })
    );
  };

  // ---------------------------------------------------------------------------
  // Chapter Linking Handlers
  // ---------------------------------------------------------------------------
  const handleLinkChapter = (storylineId: string, chapterId: string) => {
    if (!chapterId) return;
    onChange(
      storylines.map((s) => {
        if (s.id !== storylineId) return s;
        if (s.linkedChapterIds.includes(chapterId)) return s;
        return {
          ...s,
          linkedChapterIds: [...s.linkedChapterIds, chapterId],
        };
      })
    );
  };

  const handleUnlinkChapter = (storylineId: string, chapterId: string) => {
    onChange(
      storylines.map((s) => {
        if (s.id !== storylineId) return s;
        return {
          ...s,
          linkedChapterIds: s.linkedChapterIds.filter((id) => id !== chapterId),
        };
      })
    );
  };

  // ---------------------------------------------------------------------------
  // World Item Linking Handlers
  // ---------------------------------------------------------------------------
  const handleLinkWorldItem = (storylineId: string, worldItemId: string) => {
    if (!worldItemId) return;
    onChange(
      storylines.map((s) => {
        if (s.id !== storylineId) return s;
        const currentLinks = s.linkedWorldItemIds || [];
        if (currentLinks.includes(worldItemId)) return s;
        return {
          ...s,
          linkedWorldItemIds: [...currentLinks, worldItemId],
        };
      })
    );
  };

  const handleUnlinkWorldItem = (storylineId: string, worldItemId: string) => {
    onChange(
      storylines.map((s) => {
        if (s.id !== storylineId) return s;
        return {
          ...s,
          linkedWorldItemIds: (s.linkedWorldItemIds || []).filter((id) => id !== worldItemId),
        };
      })
    );
  };

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

  return (
    <div className="flex flex-col h-full select-none bg-zinc-950 font-sans">
      {/* Header with Dual View Mode Switcher */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-sm p-0.5">
            <button
              onClick={() => setViewMode('threads')}
              title={t('storylinesAndPlots')}
              className={`px-2 py-0.5 rounded-xs text-[10px] font-medium transition cursor-pointer ${
                viewMode === 'threads'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t('storyline')} ({storylines.length})
            </button>
            <button
              onClick={() => setViewMode('chapters')}
              title={t('chaptersCount')}
              className={`px-2 py-0.5 rounded-xs text-[10px] font-medium transition cursor-pointer ${
                viewMode === 'chapters'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t('chaptersCount')} ({validChapters.length})
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          title={t('addStoryline')}
          className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-white transition cursor-pointer"
          aria-label={t('addStoryline')}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Adding Drawer */}
      {isAdding && (
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/90 space-y-2.5 animate-in fade-in duration-100">
          <input
            type="text"
            placeholder={t('storylineTitlePlaceholder')}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            autoFocus
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500">{t('color')}:</span>
              {STORYLINE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                    COLOR_CLASSES[c].dot
                  } ${
                    newColor === c
                      ? 'scale-125 ring-1 ring-zinc-300 ring-offset-1 ring-offset-zinc-900'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>

            {validChapters.length > 0 && (
              <div className="relative">
                <select
                  value={initialChapterId}
                  onChange={(e) => setInitialChapterId(e.target.value)}
                  className="appearance-none bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 pr-6 text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
                >
                  <option value="">{t('noneSelect')}</option>
                  {validChapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      Link: {ch.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-2.5 h-2.5 text-zinc-500 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
              </div>
            )}
          </div>

          <textarea
            placeholder={t('storylineGoalPlaceholder')}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans"
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setIsAdding(false)}
              className="px-2.5 py-1 rounded-sm text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleAddStoryline}
              disabled={!newTitle.trim()}
              className="px-3 py-1 rounded-sm text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition cursor-pointer"
            >
              {t('addStoryline')}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* VIEW MODE 1: BY STORYLINE THREADS */}
        {viewMode === 'threads' && (
          <>
            {storylines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500 gap-1.5">
                <GitMerge className="w-6 h-6 text-zinc-600" />
                <p className="text-xs">{t('noStorylinesYet')}</p>
                <p className="text-[10px] text-zinc-500 max-w-[200px]">
                  {t('emptyStateText')}
                </p>
              </div>
            ) : (
              <div
                className={
                  isExpanded
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start'
                    : 'space-y-3'
                }
              >
                {storylines.map((storyline) => {
                  const customKey = colorSettings?.storylines[storyline.color] ?? storyline.color;
                  const dotClass =
                    COLOR_SWATCHES[customKey]?.dotBg ??
                    COLOR_CLASSES[storyline.color]?.dot ??
                    'bg-emerald-500';
                  const unlinkedChapters = validChapters.filter(
                    (ch) => !storyline.linkedChapterIds.includes(ch.id)
                  );
                  const isEditing = editingStorylineId === storyline.id;
                  const fields = storyline.fields || [];

                  return (
                    <div
                      key={storyline.id}
                      className="group border border-zinc-800 rounded-sm bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-zinc-700/80 p-3 space-y-3 transition-colors"
                    >
                      {/* Storyline Header / Edit Mode */}
                      {isEditing ? (
                        <div className="space-y-2.5 pb-2 border-b border-zinc-800 bg-zinc-950/60 p-2.5 rounded-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                              {t('edit')} {t('storyline')}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleSaveEdit(storyline.id)}
                                title={t('save')}
                                disabled={!editTitle.trim()}
                                className="p-1 rounded-sm bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                title={t('cancelEdit')}
                                className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder={t('storylineTitlePlaceholder')}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                            autoFocus
                          />

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500">{t('color')}:</span>
                            {STORYLINE_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setEditColor(c)}
                                className={`w-3.5 h-3.5 rounded-full transition-transform ${
                                  COLOR_CLASSES[c].dot
                                } ${
                                  editColor === c
                                    ? 'scale-125 ring-1 ring-zinc-300 ring-offset-1 ring-offset-zinc-900'
                                    : 'opacity-60 hover:opacity-100'
                                }`}
                              />
                            ))}
                          </div>

                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder={t('storylineGoalPlaceholder')}
                            rows={2}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans"
                          />
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                            <h3 className="text-xs font-semibold text-zinc-100 truncate">
                              {storyline.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleStartEdit(storyline)}
                              className="p-1 rounded-sm text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
                              title={t('edit')}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteStoryline(storyline.id)}
                              className="p-1 rounded-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
                              title={t('deleteStoryline')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Description View with Accordion Show More */}
                      {!isEditing && storyline.description && (
                        <CollapsibleStorylineDescription description={storyline.description} />
                      )}

                      {/* MODULAR FIELDS / BEATS SECTION */}
                      <div className="space-y-2 pt-2 border-t border-zinc-850">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <span className="flex items-center gap-1 uppercase tracking-wider text-zinc-400">
                            <Layers className="w-2.5 h-2.5 text-zinc-500" />
                            {t('modularFields')} ({fields.length})
                          </span>
                        </div>

                        {/* Quick-Insert Preset Buttons & Custom Field */}
                        <div className="flex flex-wrap items-center gap-1">
                          {PRESET_FIELDS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleAddField(storyline.id, getPresetFieldLabel(preset))}
                              className="px-1.5 py-0.5 rounded-xs text-[10px] bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                              title={`Add ${getPresetFieldLabel(preset)} block`}
                            >
                              + {getPresetFieldLabel(preset)}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddField(storyline.id, t('customField'))}
                            className="px-1.5 py-0.5 rounded-xs text-[10px] bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition font-medium cursor-pointer"
                            title={t('addCustomModularField')}
                          >
                            + {t('customField')}
                          </button>
                        </div>

                        {/* Modular Fields List */}
                        {fields.length > 0 && (
                          <div className="space-y-2 pt-1">
                            {fields.map((field, fIdx) => (
                              <div
                                key={field.id}
                                className="group/field bg-zinc-950/80 border border-zinc-800/90 hover:border-zinc-700 rounded-sm p-2 space-y-1.5 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  {/* Editable Label */}
                                  <input
                                    type="text"
                                    value={field.label}
                                    onChange={(e) =>
                                      handleUpdateField(storyline.id, field.id, {
                                        label: e.target.value,
                                      })
                                    }
                                    placeholder={t('fieldLabelPlaceholder')}
                                    className="bg-transparent hover:bg-zinc-900 focus:bg-zinc-900 px-1 py-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300 focus:text-white border border-transparent focus:border-zinc-700 rounded-xs focus:outline-none transition-colors max-w-[160px]"
                                  />

                                  {/* Field Action Buttons: Reorder & Delete */}
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      disabled={fIdx === 0}
                                      onClick={() => handleMoveField(storyline.id, fIdx, 'up')}
                                      className="p-0.5 rounded-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition"
                                      title="Move up"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={fIdx === fields.length - 1}
                                      onClick={() => handleMoveField(storyline.id, fIdx, 'down')}
                                      className="p-0.5 rounded-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition"
                                      title="Move down"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteField(storyline.id, field.id)}
                                      className="p-0.5 rounded-xs text-zinc-500 hover:text-red-400 transition"
                                      title="Delete field"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Field Text Content Area */}
                                <textarea
                                  value={field.value}
                                  onChange={(e) =>
                                    handleUpdateField(storyline.id, field.id, {
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

                      {/* Linked Chapters Section */}
                      <div className="pt-2 border-t border-zinc-850 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                          <span className="flex items-center gap-1 uppercase tracking-wider">
                            <BookmarkCheck className="w-2.5 h-2.5 text-zinc-500" />
                            {t('linkedChapters')} ({storyline.linkedChapterIds.length})
                          </span>
                        </div>

                        {/* Linked Chapter Badges */}
                        {storyline.linkedChapterIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {storyline.linkedChapterIds.map((chId) => {
                              const ch = validChapters.find((c) => c.id === chId);
                              return (
                                <span
                                  key={chId}
                                  onClick={() => onSelectChapter?.(chId)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] border border-zinc-750 bg-zinc-850 text-zinc-300 cursor-pointer hover:border-zinc-600 hover:text-white transition"
                                  title={`Click to open ${ch?.title ?? chId}`}
                                >
                                  <span className="truncate max-w-[130px]">
                                    {ch?.title || chId}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUnlinkChapter(storyline.id, chId);
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
                                    handleLinkChapter(storyline.id, e.target.value);
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

                      {/* Linked World References Section */}
                      <div className="pt-2 border-t border-zinc-850 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                          <span className="flex items-center gap-1 uppercase tracking-wider">
                            <Globe className="w-2.5 h-2.5 text-zinc-500" />
                            {t('linkedWorldReferences')} ({(storyline.linkedWorldItemIds || []).length})
                          </span>
                        </div>

                        {/* Linked World Badges */}
                        {(storyline.linkedWorldItemIds || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(storyline.linkedWorldItemIds || []).map((worldId) => {
                              const item = worldItems.find((w) => w.id === worldId);
                              return (
                                <span
                                  key={worldId}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] border border-emerald-900/60 bg-emerald-950/40 text-emerald-300"
                                >
                                  <span className="truncate max-w-[130px]">
                                    {item?.title || worldId}
                                  </span>
                                  {item?.category && (
                                    <span className="text-[9px] opacity-60 font-mono">
                                      ({item.category})
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleUnlinkWorldItem(storyline.id, worldId)}
                                    className="hover:text-red-400 text-zinc-500 ml-0.5 transition cursor-pointer"
                                    title={t('unlinkWorldEntity')}
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-500 italic">
                            {t('noWorldEntitiesLinkedYet')}
                          </p>
                        )}

                        {/* Dropdown to Link World Items */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <Link2 className="w-3 h-3 text-zinc-500 shrink-0" />
                          {(() => {
                            const unlinkedWorld = worldItems.filter(
                              (w) => !(storyline.linkedWorldItemIds || []).includes(w.id)
                            );
                            return unlinkedWorld.length > 0 ? (
                              <div className="relative flex-1">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleLinkWorldItem(storyline.id, e.target.value);
                                    }
                                  }}
                                  className="w-full appearance-none bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-sm px-2 py-1 pr-6 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer transition"
                                >
                                  <option value="" disabled>
                                    {t('linkWorldEntity')}
                                  </option>
                                  {unlinkedWorld.map((w) => (
                                    <option
                                      key={w.id}
                                      value={w.id}
                                      className="bg-zinc-950 text-zinc-200"
                                    >
                                      {w.title} ({w.category})
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-2.5 h-2.5 text-zinc-500 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-600 italic">
                                {worldItems.length === 0
                                  ? t('noWorldEntities')
                                  : t('allWorldEntitiesLinked')}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* VIEW MODE 2: BY CHAPTERS & SCENES */}
        {viewMode === 'chapters' && (
          <>
            {validChapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500 gap-1.5">
                <BookOpen className="w-6 h-6 text-zinc-600" />
                <p className="text-xs">{t('noChaptersCreated')}</p>
              </div>
            ) : (
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
                                  onClick={() => handleUnlinkChapter(st.id, chapter.id)}
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
                                  handleLinkChapter(e.target.value, chapter.id);
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
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {!isAdding && (
        <div className="p-2 border-t border-zinc-800 bg-zinc-950/80">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded-sm text-[11px] font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addStoryline')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
