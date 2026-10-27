import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Omega, X, Search, Clock, Check } from 'lucide-react';
import {
  SymbolItem,
  SymbolCategory,
  SYMBOL_CATEGORIES,
  SYMBOLS_DATA,
} from './symbolData';

const RECENT_SYMBOLS_STORAGE_KEY = 'foliant_recent_symbols_v1';
const DEFAULT_RECENTS = ['—', '«', '»', '…', '“', '”', '¿', '¡', '†', '©', '™', '€', '§', '¶', '•', 'α'];

export interface WordSymbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSymbol: (symbol: string) => void;
}

const SymbolModalHeader = memo(function SymbolModalHeader({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-950 shrink-0">
      <div className="flex items-center gap-2">
        <Omega className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-semibold text-zinc-100 font-mono tracking-tight">
          Insert Symbol (Word Palette)
        </span>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
        title="Close (Esc)"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

const SymbolCategoryTabs = memo(function SymbolCategoryTabs({
  searchQuery,
  onSearchChange,
  activeTab,
  onSelectTab,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: SymbolCategory;
  onSelectTab: (tab: SymbolCategory) => void;
}) {
  return (
    <div className="px-5 pt-3 border-b border-zinc-800 bg-zinc-950/70 space-y-3 shrink-0">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search symbol by name, character or unicode (e.g., dash, quote, alpha)..."
          className="w-full bg-zinc-900 border border-zinc-750 rounded-sm pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition"
          autoFocus
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {SYMBOL_CATEGORIES.map((cat) => {
          const isActive = activeTab === cat.id && !searchQuery;
          return (
            <button
              key={cat.id}
              type="button"
              disabled={!!searchQuery}
              onClick={() => onSelectTab(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition -mb-[1px] whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-zinc-200 text-zinc-100 font-semibold'
                  : searchQuery
                  ? 'border-transparent text-zinc-600 cursor-not-allowed'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});

const SymbolGridBody = memo(function SymbolGridBody({
  displayedSymbols,
  selectedSymbol,
  searchQuery,
  onSelect,
  onInsert,
}: {
  displayedSymbols: SymbolItem[];
  selectedSymbol: SymbolItem | null;
  searchQuery: string;
  onSelect: (item: SymbolItem) => void;
  onInsert: (char: string) => void;
}) {
  if (displayedSymbols.length === 0) {
    return (
      <div className="p-4 overflow-y-auto flex-1 min-h-[220px] bg-zinc-950/40">
        <div className="h-40 flex flex-col items-center justify-center text-zinc-500 text-xs">
          No symbols matching &quot;{searchQuery}&quot;
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto flex-1 min-h-[220px] bg-zinc-950/40">
      <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
        {displayedSymbols.map((item, idx) => {
          const isSelected = selectedSymbol?.char === item.char;
          return (
            <button
              key={`${item.char}-${idx}`}
              type="button"
              onClick={() => onSelect(item)}
              onDoubleClick={() => onInsert(item.char)}
              title={`${item.name} (${item.code})`}
              className={`h-10 rounded-sm border flex items-center justify-center text-base font-serif transition select-none cursor-pointer group ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/50 shadow-sm'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-200 hover:text-white'
              }`}
            >
              <span className="group-hover:scale-115 transition-transform duration-100">
                {item.char}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

const RecentlyUsedSymbols = memo(function RecentlyUsedSymbols({
  recentSymbols,
  onInsert,
}: {
  recentSymbols: string[];
  onInsert: (char: string) => void;
}) {
  return (
    <div className="px-5 py-2.5 border-t border-zinc-800 bg-zinc-900/80 shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-zinc-400" />
          <span>Recently Used Symbols</span>
        </span>
        <span className="text-[10px] text-zinc-400">Click to insert directly</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {recentSymbols.map((char, i) => (
          <button
            key={`${char}-${i}`}
            type="button"
            onClick={() => onInsert(char)}
            title={`Insert '${char}'`}
            className="w-7 h-7 rounded-xs bg-zinc-950 border border-zinc-800 hover:border-zinc-650 hover:bg-zinc-800 text-zinc-200 hover:text-white flex items-center justify-center text-sm font-serif transition shrink-0 cursor-pointer active:scale-95"
          >
            {char}
          </button>
        ))}
      </div>
    </div>
  );
});

const SymbolActionBar = memo(function SymbolActionBar({
  selectedSymbol,
  onClose,
  onInsert,
}: {
  selectedSymbol: SymbolItem | null;
  onClose: () => void;
  onInsert: (char: string) => void;
}) {
  return (
    <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl font-serif text-white shrink-0 shadow-inner">
          {selectedSymbol?.char || '—'}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-zinc-100 truncate max-w-xs sm:max-w-md">
            {selectedSymbol?.name || 'Em Dash'}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            Unicode: {selectedSymbol?.code || 'U+2014'} (Double-click symbol or press Insert)
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 rounded-sm transition cursor-pointer"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => {
            if (selectedSymbol) {
              onInsert(selectedSymbol.char);
            }
          }}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-sm transition shadow-xs cursor-pointer active:scale-95"
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Insert</span>
        </button>
      </div>
    </div>
  );
});

export const WordSymbolModal = memo(function WordSymbolModal({
  isOpen,
  onClose,
  onInsertSymbol,
}: WordSymbolModalProps) {
  const [activeTab, setActiveTab] = useState<SymbolCategory>('dialogue');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolItem>(() => SYMBOLS_DATA.dialogue[0]);
  const [recentSymbols, setRecentSymbols] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_RECENTS;
    try {
      const stored = localStorage.getItem(RECENT_SYMBOLS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_RECENTS;
    } catch {
      return DEFAULT_RECENTS;
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const displayedSymbols = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      return SYMBOLS_DATA[activeTab];
    }
    const all = Object.values(SYMBOLS_DATA).flat();
    return all.filter(
      (s) =>
        s.char.toLowerCase().includes(trimmed) ||
        s.name.toLowerCase().includes(trimmed) ||
        s.code.toLowerCase().includes(trimmed)
    );
  }, [activeTab, searchQuery]);

  const handleSelect = useCallback((symbol: SymbolItem) => {
    setSelectedSymbol(symbol);
  }, []);

  const handleInsert = useCallback((char: string) => {
    onInsertSymbol(char);

    setRecentSymbols((prev) => {
      const filtered = prev.filter((c) => c !== char);
      const next = [char, ...filtered].slice(0, 16);
      try {
        localStorage.setItem(RECENT_SYMBOLS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage write non-fatal
      }
      return next;
    });
  }, [onInsertSymbol]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs select-none">
      <div
        className="bg-zinc-900 border border-zinc-750 rounded-sm shadow-2xl flex flex-col w-full max-w-2xl max-h-[85vh] overflow-hidden text-zinc-200 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <SymbolModalHeader onClose={onClose} />
        <SymbolCategoryTabs
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
        <SymbolGridBody
          displayedSymbols={displayedSymbols}
          selectedSymbol={selectedSymbol}
          searchQuery={searchQuery}
          onSelect={handleSelect}
          onInsert={handleInsert}
        />
        <RecentlyUsedSymbols
          recentSymbols={recentSymbols}
          onInsert={handleInsert}
        />
        <SymbolActionBar
          selectedSymbol={selectedSymbol}
          onClose={onClose}
          onInsert={handleInsert}
        />
      </div>
    </div>
  );
});

export default WordSymbolModal;
