import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Feather, Layers, FileText } from 'lucide-react';
import { FoliantProject } from '../../../types/project';
import { useGlobalSearch, SearchScope, SearchResult } from '../../../hooks/useGlobalSearch';

export interface SearchViewProps {
  project: FoliantProject;
  activeSceneId: string;
  onSelectResult: (sceneId: string, searchTerm: string) => void;
  isExpanded?: boolean;
}

/**
 * Highlights exact query occurrences within a snippet text using the specified yellow mark class.
 */
function renderHighlightedSnippet(snippet: string, query: string): React.ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return snippet;

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = snippet.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === trimmed.toLowerCase()) {
      return (
        <mark key={index} className="bg-yellow-500/50 text-white font-medium rounded-xs px-0.5">
          {part}
        </mark>
      );
    }
    return part;
  });
}

export default function SearchView({
  project,
  activeSceneId,
  onSelectResult,
  isExpanded = false,
}: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('global');
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Compute search results via the custom search hook
  const results = useGlobalSearch(query, project, scope, activeSceneId);

  // Reset selection index when results change
  useEffect(() => {
    setSelectedResultIndex(0);
  }, [results.length, query, scope]);

  const handleResultClick = useCallback(
    (result: SearchResult, idx: number) => {
      setSelectedResultIndex(idx);
      onSelectResult(result.sceneId, query.trim());
    },
    [onSelectResult, query]
  );

  return (
    <div className={`flex flex-col h-full bg-zinc-950 text-zinc-200 select-none ${isExpanded ? 'max-w-4xl mx-auto w-full p-6' : 'p-3'}`}>
      {/* Search Input & Controls Bar */}
      <div className="flex flex-col gap-2 shrink-0 pb-3 border-b border-zinc-800/80">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manuscript (Ctrl+Shift+F)..."
            className="w-full pl-8 pr-7 py-1.5 bg-zinc-900 border border-zinc-750 rounded-md text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              title="Clear search"
              className="absolute right-2 p-0.5 text-zinc-400 hover:text-zinc-200 rounded-sm hover:bg-zinc-800 transition"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Scope Selector Row */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
            <Layers className="w-3 h-3 text-zinc-500 shrink-0" />
            <span>Scope:</span>
          </div>

          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as SearchScope)}
            aria-label="Search Scope"
            className="bg-zinc-900 border border-zinc-800 rounded-md text-[11px] text-zinc-300 px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="global">Global</option>
            <option value="current_folder">Current Folder</option>
            <option value="current_scene">Current Scene</option>
          </select>
        </div>
      </div>

      {/* Results Count Summary */}
      <div className="flex items-center justify-between py-2 text-[11px] text-zinc-400 font-mono shrink-0">
        <span>
          {query.trim() ? (
            <>
              <strong className="text-zinc-200">{results.length}</strong>{' '}
              {results.length === 1 ? 'match' : 'matches'}
            </>
          ) : (
            'Type to search...'
          )}
        </span>
        {results.length > 0 && (
          <span className="text-[10px] text-zinc-500">
            Click to jump
          </span>
        )}
      </div>

      {/* Scrollable Results List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
        {query.trim() && results.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-500 px-4">
            <FileText className="w-7 h-7 mb-2 text-zinc-600 opacity-60" />
            <p className="text-xs font-medium text-zinc-400">No matching text found</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Try searching with another word or change the scope to Global.
            </p>
          </div>
        )}

        {!query.trim() && (
          <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-500 px-4">
            <Search className="w-7 h-7 mb-2 text-zinc-600 opacity-60" />
            <p className="text-xs font-medium text-zinc-400">Search your manuscript</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Find occurrences across scenes with instant preview and jump.
            </p>
          </div>
        )}

        {results.map((result, idx) => {
          const isCurrentActive = result.sceneId === activeSceneId;
          const isSelected = idx === selectedResultIndex;

          return (
            <div
              key={`${result.sceneId}-${result.matchIndex ?? idx}`}
              onClick={() => handleResultClick(result, idx)}
              className={`p-2.5 rounded-md transition border cursor-pointer select-none text-left flex flex-col gap-1 ${
                isCurrentActive
                  ? 'bg-zinc-900 border-emerald-500/50 shadow-xs'
                  : isSelected
                  ? 'bg-zinc-900/90 border-zinc-700'
                  : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/80 hover:border-zinc-700'
              }`}
            >
              {/* Scene Title Header */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200 truncate">
                  <Feather className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{result.sceneTitle}</span>
                </div>
                {isCurrentActive && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shrink-0">
                    Active
                  </span>
                )}
              </div>

              {/* Context Snippet with Yellow Highlight */}
              <p className="text-xs text-zinc-400 font-serif leading-relaxed line-clamp-3">
                {renderHighlightedSnippet(result.snippet, query)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
