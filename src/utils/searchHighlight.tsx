import React from 'react';

/**
 * Highlights exact query occurrences within a snippet text using the specified yellow mark class.
 *
 * @param snippet The snippet of text containing possible matches
 * @param query The search query string
 * @returns React nodes with matches wrapped in <mark> tags
 */
export function renderHighlightedSnippet(snippet: string, query: string): React.ReactNode {
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
