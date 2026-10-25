import React, { useState, useMemo, useEffect, memo } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  Search,
  MapPin,
  Shield,
  Scroll,
  Sparkles,
  X,
  Compass,
  ArrowLeft,
  Camera,
  Check,
} from 'lucide-react';
import { WorldItem } from '../../../types/dock';
import { useTranslation } from '../../../i18n/translations';

interface WorldbuildingViewProps {
  items: WorldItem[];
  onChange: (items: WorldItem[]) => void;
  isExpanded?: boolean;
  saveMode?: 'auto' | 'manual';
  onDirtyChange?: (isDirty: boolean) => void;
}

const DEFAULT_CATEGORIES: string[] = ['Location', 'Faction', 'Lore', 'Artifact'];

const CATEGORY_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    dot: string;
    badge: string;
  }
> = {
  Location: {
    icon: MapPin,
    dot: 'bg-cyan-500',
    badge: 'border-cyan-800/60 bg-cyan-950/40 text-cyan-400',
  },
  Faction: {
    icon: Shield,
    dot: 'bg-amber-500',
    badge: 'border-amber-800/60 bg-amber-950/40 text-amber-400',
  },
  Lore: {
    icon: Scroll,
    dot: 'bg-emerald-500',
    badge: 'border-emerald-800/60 bg-emerald-950/40 text-emerald-400',
  },
  Artifact: {
    icon: Sparkles,
    dot: 'bg-purple-500',
    badge: 'border-purple-800/60 bg-purple-950/40 text-purple-400',
  },
};

function getCategoryConfig(category: string): {
  icon: React.ComponentType<{ className?: string }>;
  dot: string;
  badge: string;
} {
  return (
    CATEGORY_CONFIG[category] ?? {
      icon: Compass,
      dot: 'bg-blue-500',
      badge: 'border-blue-800/60 bg-blue-950/40 text-blue-400',
    }
  );
}

function WorldbuildingViewComponent({
  items,
  onChange,
  isExpanded = false,
  saveMode = 'auto',
  onDirtyChange,
}: WorldbuildingViewProps) {
  const { t } = useTranslation();

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'Location':
        return t('catLocation');
      case 'Faction':
        return t('catFaction');
      case 'Lore':
        return t('catLore');
      case 'Artifact':
        return t('catArtifact');
      case 'All':
        return t('all');
      default:
        return category;
    }
  };

  const [selectedId, setSelectedId] = useState<string | null>(() => items[0]?.id ?? null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Manual save mode draft state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // All distinct categories present in the project plus default presets
  const allCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [items]);

  // Currently selected item for the detail editor
  const activeItem = useMemo(() => {
    return items.find((i) => i.id === selectedId) || null;
  }, [items, selectedId]);

  // Filtered items list for the master sidebar
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(q);
      const inSummary = item.summary.toLowerCase().includes(q);
      const inDesc = item.description.toLowerCase().includes(q);

      return inTitle || inSummary || inDesc;
    });
  }, [items, selectedCategory, searchQuery]);

  // Create new item and immediately select it in detail view
  const handleCreateNew = () => {
    const newItem: WorldItem = {
      id: `world-${Date.now()}`,
      title: 'New World Entity',
      category: selectedCategory === 'All' ? 'Location' : selectedCategory,
      summary: '',
      description: '',
    };
    onChange([newItem, ...items]);
    setSelectedId(newItem.id);
  };

  // Update specific fields of the active item in real-time
  const handleUpdateActive = (updates: Partial<WorldItem>) => {
    if (!activeItem) return;
    onChange(
      items.map((item) => (item.id === activeItem.id ? { ...item, ...updates } : item))
    );
  };

  // Synchronize draft state when active item changes or mounts
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

  // Delete active item and fall back to the first available item
  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const remaining = items.filter((item) => item.id !== id);
    onChange(remaining);
    if (selectedId === id) {
      setSelectedId(remaining[0]?.id ?? null);
    }
  };

  return (
    <div className="flex h-full w-full select-none bg-zinc-950 overflow-hidden font-sans text-zinc-200">
      {/* ----------------------------------------------------------------- */}
      {/* LEFT COLUMN: MASTER SIDEBAR (LIST, FILTERS, SEARCH)               */}
      {/* ----------------------------------------------------------------- */}
      <div
        className={`${
          activeItem && !isExpanded ? 'hidden md:flex' : 'flex'
        } w-full md:w-72 lg:w-80 flex-col border-r border-zinc-800 bg-zinc-950/80 shrink-0 h-full`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Globe className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span className="text-[11px] font-semibold text-zinc-200 uppercase tracking-wider font-mono truncate">
              {t('worldCodex')} ({items.length})
            </span>
          </div>

          <button
            onClick={handleCreateNew}
            title={t('addWorldItem')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition border border-zinc-700/60 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>{t('add')}</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-2.5 border-b border-zinc-800 bg-zinc-900/30 space-y-2 shrink-0">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-2 py-0.5 rounded-xs text-[10px] font-medium transition shrink-0 cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {t('all')} ({items.length})
            </button>
            {allCategories.map((cat) => {
              const count = items.filter((i) => i.category === cat).length;
              const config = getCategoryConfig(cat);
              const Icon = config.icon;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-medium transition shrink-0 border cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  <span>{getCategoryLabel(cat)}</span>
                  <span className="text-[9px] opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchLorePlaceholder')}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-sm pl-7 pr-7 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Master List of Entities */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 p-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center text-zinc-500 text-xs">
              <Compass className="w-8 h-8 text-zinc-700 mx-auto mb-2 opacity-50" />
              <p>{t('noLoreYet')}</p>
              <button
                onClick={handleCreateNew}
                className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
              >
                {t('addWorldItem')}
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = item.id === selectedId;
              const config = getCategoryConfig(item.category);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`group px-3 py-2.5 rounded-sm cursor-pointer transition flex flex-col gap-1 border ${
                    isSelected
                      ? 'bg-zinc-850/90 border-zinc-700/80 shadow-xs'
                      : 'border-transparent hover:bg-zinc-900/60 hover:border-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {(item.imageUrl || item.avatarUrl) ? (
                        <div className="w-5 h-5 rounded-xs overflow-hidden border border-zinc-800 shrink-0 bg-zinc-950">
                          <img
                            src={item.imageUrl || item.avatarUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${config.dot} shrink-0`} />
                      )}
                      <span className="text-xs font-semibold text-zinc-100 truncate">
                        {item.title || 'Untitled'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs border uppercase tracking-wider ${config.badge}`}
                      >
                        {getCategoryLabel(item.category)}
                      </span>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Delete item"
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-rose-400 transition rounded-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {item.summary && (
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* RIGHT COLUMN: DETAIL / EDITOR VIEW                                */}
      {/* ----------------------------------------------------------------- */}
      <div
        className={`${
          !activeItem ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col h-full bg-zinc-950 overflow-y-auto min-w-0`}
      >
        {activeItem ? (
          <div className="flex flex-col h-full">
            {/* Detail Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/40 shrink-0">
              <div className="flex items-center gap-2">
                {/* Mobile Back to List Button */}
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-sm"
                  title="Back to list"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${getCategoryConfig(activeItem.category).dot}`} />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    {t('worldEntityEditor')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {saveMode === 'manual' && (
                  <div className="flex items-center gap-1.5 mr-1">
                    {hasPendingChanges && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-950/40 border border-amber-900/60 px-2 py-0.5 rounded-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        {t('unconfirmedEdits')}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      disabled={!hasPendingChanges}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 rounded-sm transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      title={t('discardChanges')}
                    >
                      <X className="w-3 h-3" />
                      <span className="font-mono text-[10px]">{t('discard')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={!hasPendingChanges}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm shadow-xs transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                      title={t('saveChanges')}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span className="font-mono text-[10px]">{t('save')}</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={(e) => handleDelete(activeItem.id, e)}
                  title={t('deleteWorldItem')}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 rounded-sm transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">{t('delete')}</span>
                </button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 p-6 space-y-5 max-w-3xl">
              {/* Avatar / Portrait & Title Block */}
              <div className="flex items-start gap-4">
                <label
                  className="w-16 h-16 rounded-sm bg-zinc-950 border border-zinc-750 hover:border-zinc-500 overflow-hidden flex items-center justify-center text-zinc-300 font-bold text-base shrink-0 font-mono cursor-pointer transition relative group/avatar shadow-xs"
                  title="Upload location or entity portrait / illustration"
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
                          const base64 = reader.result as string;
                          handleUpdateActive({ imageUrl: base64, avatarUrl: base64 });
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }}
                  />
                  {(activeItem.imageUrl || activeItem.avatarUrl) ? (
                    <img
                      src={activeItem.imageUrl || activeItem.avatarUrl}
                      alt={activeItem.title}
                      className="w-full h-full object-cover transition-transform group-hover/avatar:scale-105"
                    />
                  ) : activeItem.title ? (
                    activeItem.title.charAt(0).toUpperCase()
                  ) : (
                    <Compass className="w-6 h-6 text-zinc-500" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Camera className="w-4 h-4" />
                  </div>
                </label>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                      {t('name')}
                    </label>
                    {(activeItem.imageUrl || activeItem.avatarUrl) && (
                      <button
                        type="button"
                        onClick={() => handleUpdateActive({ imageUrl: undefined, avatarUrl: undefined, imagePath: undefined })}
                        className="text-[10px] font-mono text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                      >
                        {t('removeImage')}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={saveMode === 'manual' ? draftTitle : activeItem.title}
                    onChange={(e) => {
                      if (saveMode === 'manual') {
                        setDraftTitle(e.target.value);
                        setHasPendingChanges(true);
                        onDirtyChange?.(true);
                      } else {
                        handleUpdateActive({ title: e.target.value });
                      }
                    }}
                    placeholder={t('itemNamePlaceholder')}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-sm px-3 py-2 text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition"
                  />
                </div>
              </div>

              {/* Category Selector with Custom Category Support */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  {t('categorySelect')}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={
                      DEFAULT_CATEGORIES.includes(saveMode === 'manual' ? draftCategory : activeItem.category)
                        ? (saveMode === 'manual' ? draftCategory : activeItem.category)
                        : '__custom__'
                    }
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        if (saveMode === 'manual') {
                          setDraftCategory(e.target.value);
                          setHasPendingChanges(true);
                          onDirtyChange?.(true);
                        } else {
                          handleUpdateActive({ category: e.target.value });
                        }
                      }
                    }}
                    className="bg-zinc-900 border border-zinc-800 rounded-sm px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    <option value="Location">{t('catLocation')}</option>
                    <option value="Faction">{t('catFaction')}</option>
                    <option value="Lore">{t('catLore')}</option>
                    <option value="Artifact">{t('catArtifact')}</option>
                    {!DEFAULT_CATEGORIES.includes(saveMode === 'manual' ? draftCategory : activeItem.category) && (
                      <option value="__custom__">
                        {saveMode === 'manual' ? draftCategory : activeItem.category} ({t('customBadge')})
                      </option>
                    )}
                    <option value="__custom__">+ {t('addCustomCategory')}...</option>
                  </select>

                  {(isCustomCategory || !DEFAULT_CATEGORIES.includes(saveMode === 'manual' ? draftCategory : activeItem.category)) && (
                    <div className="flex-1 min-w-[180px]">
                      <input
                        type="text"
                        value={saveMode === 'manual' ? draftCategory : activeItem.category}
                        onChange={(e) => {
                          if (saveMode === 'manual') {
                            setDraftCategory(e.target.value);
                            setHasPendingChanges(true);
                            onDirtyChange?.(true);
                          } else {
                            handleUpdateActive({ category: e.target.value });
                          }
                        }}
                        placeholder={t('customCategoryPlaceholder')}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-sm px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Summary / Logline */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  {t('summary')}
                </label>
                <textarea
                  value={saveMode === 'manual' ? draftSummary : activeItem.summary}
                  onChange={(e) => {
                    if (saveMode === 'manual') {
                      setDraftSummary(e.target.value);
                      setHasPendingChanges(true);
                      onDirtyChange?.(true);
                    } else {
                      handleUpdateActive({ summary: e.target.value });
                    }
                  }}
                  rows={2}
                  placeholder={t('itemSummaryPlaceholder')}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-sm p-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition leading-relaxed resize-y"
                />
              </div>

              {/* Comprehensive Description & Lore */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  {t('description')}
                </label>
                <textarea
                  value={saveMode === 'manual' ? draftDescription : activeItem.description}
                  onChange={(e) => {
                    if (saveMode === 'manual') {
                      setDraftDescription(e.target.value);
                      setHasPendingChanges(true);
                      onDirtyChange?.(true);
                    } else {
                      handleUpdateActive({ description: e.target.value });
                    }
                  }}
                  rows={10}
                  placeholder={t('itemDescriptionPlaceholder')}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-sm p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition leading-relaxed resize-y font-sans min-h-[180px]"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500">
            <Compass className="w-12 h-12 text-zinc-700 mb-3 opacity-60" />
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">{t('noEntriesFound')}</h3>
            <p className="text-xs text-zinc-500 max-w-sm mb-4">
              {t('emptyStateText')}
            </p>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-sm text-xs font-medium transition cursor-pointer border border-zinc-700/60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addWorldItem')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(WorldbuildingViewComponent);
