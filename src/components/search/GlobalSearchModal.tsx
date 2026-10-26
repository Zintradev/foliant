import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Feather, CornerDownLeft, FileText, Layers } from 'lucide-react';
import { FoliantProject } from '../../types/project';
import { useGlobalSearch, SearchScope, SearchResult } from '../../hooks/useGlobalSearch';

import { renderHighlightedSnippet } from '../../utils/searchHighlight';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: FoliantProject;
  activeSceneId: string;
  onSelectResult: (sceneId: string, searchTerm: string) => void;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  project,
  activeSceneId,
  onSelectResult,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('global');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultsContainerRef = useRef<HTMLDivElement | null>(null);

  // Compute search results via the custom search hook
  const results = useGlobalSearch(query, project, scope, activeSceneId);

  // Auto-focus input and reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keep selected index within bounds when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length, query, scope]);

  // Scroll active item into view during arrow navigation
  useEffect(() => {
    if (!resultsContainerRef.current) return;
    const activeItem = resultsContainerRef.current.querySelector(
      `[data-result-index="${selectedIndex}"]`
    ) as HTMLElement | null;
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelectResult(result.sceneId, query.trim());
      onClose();
    },
    [onSelectResult, query, onClose]
  );

  // Keyboard navigation within the modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      }
    },
    [results, selectedIndex, handleSelect, onClose]
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Omnisearch"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-20 p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-zinc-900 border border-zinc-750 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Search Bar & Scope Selector */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800 bg-zinc-900/90">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across project (Ctrl+Shift+F)..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />

          {/* Scope Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as SearchScope)}
              aria-label="Search Scope"
              className="bg-zinc-800 border border-zinc-700/80 rounded-md text-xs text-zinc-200 px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="global">Global</option>
              <option value="current_folder">Current Folder</option>
              <option value="current_scene">Current Scene</option>
            </select>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results Summary Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/60 border-b border-zinc-800/80 text-[11px] text-zinc-400 font-mono">
          <span>
            {query.trim() ? (
              <>
                <strong className="text-zinc-200">{results.length}</strong>{' '}
                {results.length === 1 ? 'match' : 'matches'} found
              </>
            ) : (
              'Type to search project...'
            )}
          </span>
          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
            <span>↑↓ Navigate</span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-2.5 h-2.5" /> Select
            </span>
            <span>Esc Dismiss</span>
          </div>
        </div>

        {/* Scrollable Results List */}
        <div
          ref={resultsContainerRef}
          className="max-h-[60vh] overflow-y-auto divide-y divide-zinc-800/60 p-2"
        >
          {query.trim() && results.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-500">
              <FileText className="w-8 h-8 mb-2 text-zinc-600 opacity-60" />
              <p className="text-sm font-medium text-zinc-400">No matching text found</p>
              <p className="text-xs text-zinc-500 mt-1">
                Try searching with another word or adjust the scope to Global.
              </p>
            </div>
          )}

          {!query.trim() && (
            <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-500">
              <Search className="w-8 h-8 mb-2 text-zinc-600 opacity-60" />
              <p className="text-sm font-medium text-zinc-400">Omnisearch across your novel</p>
              <p className="text-xs text-zinc-500 mt-1">
                Searches scenes, dialogue, and prose instantly with contextual preview.
              </p>
            </div>
          )}

          {results.map((result, idx) => {
            const isSelected = idx === selectedIndex;

            return (
              <button
                key={`${result.sceneId}-${result.matchIndex ?? idx}`}
                data-result-index={idx}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex flex-col gap-1 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-zinc-800 border-l-2 border-emerald-400 shadow-sm'
                    : 'hover:bg-zinc-800/50 border-l-2 border-transparent'
                }`}
              >
                {/* Scene Name & Indicator */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 truncate">
                    <Feather className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{result.sceneTitle}</span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 shrink-0">
                      Jump <CornerDownLeft className="w-2.5 h-2.5 text-emerald-400" />
                    </span>
                  )}
                </div>

                {/* Snippet with exact highlighted match */}
                <p className="text-xs text-zinc-400 font-serif leading-relaxed line-clamp-2 mt-0.5">
                  {renderHighlightedSnippet(result.snippet, query)}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
