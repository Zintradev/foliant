import { useState, useMemo } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  Edit3,
  Search,
  MapPin,
  Shield,
  Scroll,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Tag,
  X,
  Compass,
} from 'lucide-react';
import { WorldItem, WorldCategory } from '../../../types/dock';

interface WorldbuildingViewProps {
  items: WorldItem[];
  onChange: (items: WorldItem[]) => void;
  isExpanded?: boolean;
}

const CATEGORY_CONFIG: Record<
  WorldCategory,
  {
    icon: React.ComponentType<{ className?: string }>;
    dot: string;
  }
> = {
  Location: {
    icon: MapPin,
    dot: 'bg-cyan-500',
  },
  Faction: {
    icon: Shield,
    dot: 'bg-amber-500',
  },
  Lore: {
    icon: Scroll,
    dot: 'bg-emerald-500',
  },
  Artifact: {
    icon: Sparkles,
    dot: 'bg-purple-500',
  },
};

const CATEGORIES: WorldCategory[] = ['Location', 'Faction', 'Lore', 'Artifact'];

export default function WorldbuildingView({
  items,
  onChange,
  isExpanded = false,
}: WorldbuildingViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<WorldCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Form State for Add / Edit Drawer
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<WorldCategory>('Location');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');

  // ---------------------------------------------------------------------------
  // Card Expansion Toggle
  // ---------------------------------------------------------------------------
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Open Form for Create / Edit
  // ---------------------------------------------------------------------------
  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setCategory(selectedCategory === 'All' ? 'Location' : selectedCategory);
    setSummary('');
    setDescription('');
    setTagInput('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: WorldItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setSummary(item.summary);
    setDescription(item.description);
    setTagInput(item.tags?.join(', ') || '');
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const parsedTags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editingId) {
      onChange(
        items.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title: title.trim(),
                category,
                summary: summary.trim(),
                description: description.trim(),
                tags: parsedTags,
              }
            : item
        )
      );
    } else {
      const newItem: WorldItem = {
        id: `world-${Date.now()}`,
        title: title.trim(),
        category,
        summary: summary.trim(),
        description: description.trim(),
        tags: parsedTags,
      };
      onChange([...items, newItem]);
    }

    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(items.filter((item) => item.id !== id));
  };

  // ---------------------------------------------------------------------------
  // Filtered Items
  // ---------------------------------------------------------------------------
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
      const inTags = item.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;

      return inTitle || inSummary || inDesc || inTags;
    });
  }, [items, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col h-full select-none bg-zinc-950 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-zinc-300" />
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
            Worldbuilding & Lore ({items.length})
          </span>
        </div>

        <button
          onClick={handleOpenCreate}
          title="Create New Lore Entry"
          className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-white transition"
          aria-label="Create New Lore Entry"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category Filter Pills & Search Bar */}
      <div className="p-2 border-b border-zinc-800 bg-zinc-900/30 space-y-1.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-2 py-0.5 rounded-sm text-[10px] font-medium transition shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            All ({items.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            const config = CATEGORY_CONFIG[cat];
            const Icon = config.icon;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-medium transition shrink-0 border ${
                  isSelected
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-2.5 h-2.5" />
                <span>{cat}</span>
                <span className="text-[9px] opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Quick Search Input */}
        <div className="relative">
          <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lore entries, factions, tags..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-sm pl-7 pr-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
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

      {/* Entry Create / Edit Drawer */}
      {isFormOpen && (
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/90 space-y-2.5 animate-in fade-in duration-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200">
              {editingId ? 'Edit Lore Entry' : 'New Worldbuilding Entry'}
            </span>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Entry title (e.g. The High Archives)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              autoFocus
            />

            {/* Category Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 shrink-0">Category:</span>
              <div className="grid grid-cols-4 gap-1 flex-1">
                {CATEGORIES.map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  const Icon = config.icon;
                  const isSelected = category === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex items-center justify-center gap-1 py-1 rounded-sm text-[10px] font-medium border transition ${
                        isSelected
                          ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      <span className="truncate">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary Input */}
            <input
              type="text"
              placeholder="One-line summary..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />

            {/* Detailed Description */}
            <textarea
              placeholder="Detailed lore notes, history, cultural significance..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans"
            />

            {/* Tags Input */}
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1">
              <Tag className="w-3 h-3 text-zinc-500 shrink-0" />
              <input
                type="text"
                placeholder="Tags (comma-separated)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full bg-transparent text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setIsFormOpen(false)}
              className="px-2.5 py-1 rounded-sm text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-3 py-1 rounded-sm text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition"
            >
              {editingId ? 'Save Changes' : 'Create Entry'}
            </button>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500 gap-2">
            <Compass className="w-6 h-6 text-zinc-600" />
            <p className="text-xs font-medium text-zinc-400">No worldbuilding entries</p>
            <p className="text-[10px] text-zinc-500 max-w-[200px] leading-relaxed">
              Create cards for key locations, political factions, and lore details.
            </p>
          </div>
        ) : (
          <div
            className={
              isExpanded
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
                : 'space-y-1.5'
            }
          >
            {filteredItems.map((item) => {
              const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Lore;
              const isItemOpen = expandedIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => toggleExpand(item.id)}
                className="group border border-zinc-800 rounded-sm bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 p-2.5 space-y-1.5 transition-colors cursor-pointer"
              >
                {/* Entry Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[9px] font-mono border border-zinc-750 bg-zinc-850 text-zinc-300 shrink-0 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      <span>{item.category}</span>
                    </span>

                    <h4 className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleOpenEdit(item, e)}
                      title="Edit entry"
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-zinc-200 transition"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete entry"
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="text-zinc-500 p-0.5">
                      {isItemOpen ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {item.summary && (
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                    {item.summary}
                  </p>
                )}

                {/* Expanded Detailed Lore */}
                {isItemOpen && item.description && (
                  <div className="pt-1.5 border-t border-zinc-850 text-[11px] text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap animate-in fade-in duration-100">
                    {item.description}
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {item.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-zinc-950 text-zinc-500 border border-zinc-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Footer */}
      {!isFormOpen && (
        <div className="p-2 border-t border-zinc-800 bg-zinc-950/80">
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 rounded-sm text-[11px] font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Lore Entry</span>
          </button>
        </div>
      )}
    </div>
  );
}
