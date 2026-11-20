'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Grid3X3, Star, Film } from 'lucide-react';
import { searchMovies } from '../ml/collaborativeFiltering.js';

/**
 * Global Movie Search Component for the Navbar
 *
 * Lets users search any of the 44 movies from anywhere in the app and
 * immediately open its Detail View or highlight its ratings in the Matrix.
 */
export default function GlobalMovieSearch({
  onSelectMovieDetail,
  onHighlightInMatrix,
  compact = false,
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const results = useMemo(() => searchMovies(query, 7), [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  // Global "/" keyboard shortcut to focus search cleanly
  useEffect(() => {
    if (compact) return undefined;
    const handleGlobalKey = (event) => {
      const tag = document.activeElement?.tagName;
      const isTyping =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (event.key === '/' && !isTyping && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [compact]);

  const handleOpenDetail = (movieId) => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
    onSelectMovieDetail(movieId);
  };

  const handleJumpMatrix = (movieId) => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
    onHighlightInMatrix(movieId);
  };

  const handleKeyDown = (event) => {
    if (!isOpen && event.key !== 'Escape') {
      setIsOpen(true);
    }
    if (event.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = results[activeIndex] || results[0];
      if (target) {
        handleOpenDetail(target.movie.id);
      }
    }
  };

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className={`relative ${compact ? 'w-full' : 'w-full max-w-[260px] xl:max-w-[300px]'}`}
    >
      <div className="relative flex items-center">
        <Search
          className="w-4 h-4 text-[#93C5FD] absolute left-3 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search any movie in dataset"
          aria-expanded={showDropdown}
          aria-controls="global-movie-search-results"
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search movies..."
          className="w-full rounded-lg bg-[#132743] border border-[#1E3A5F] pl-9 pr-14 py-1.5 text-sm text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] transition-colors"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setActiveIndex(0);
              inputRef.current?.focus();
            }}
            aria-label="Clear movie search"
            className="absolute right-2 p-1 rounded text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#1E3A5F] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        ) : (
          !compact && (
            <kbd
              aria-hidden="true"
              className="hidden sm:inline-flex items-center justify-center absolute right-2.5 px-1.5 py-0.5 text-[11px] font-mono text-[#93C5FD] bg-[#0B192C] border border-[#1E3A5F] rounded pointer-events-none"
            >
              /
            </kbd>
          )
        )}
      </div>

      {showDropdown && (
        <div
          id="global-movie-search-results"
          role="listbox"
          aria-label="Matching movies"
          className="absolute right-0 left-0 sm:left-auto sm:w-[390px] mt-2 z-50 rounded-xl bg-[#132743] border border-[#38BDF8]/70 shadow-2xl overflow-hidden"
        >
          {results.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm font-medium text-[#F8FAFC]">
                No movies found for &ldquo;{query.trim()}&rdquo;
              </p>
              <p className="text-xs text-[#CBD5E1] mt-1">
                Try searching by title, director (e.g., Nolan), genre, or year.
              </p>
            </div>
          ) : (
            <>
              <div className="px-3.5 py-2 bg-[#0B192C] border-b border-[#1E3A5F] flex items-center justify-between text-[11px] text-[#93C5FD]">
                <span>Matching Movies ({results.length})</span>
                <span>Enter for details · Matrix to highlight</span>
              </div>

              <ul className="divide-y divide-[#1E3A5F] max-h-[340px] overflow-y-auto">
                {results.map((entry, idx) => {
                  const isHighlighted = idx === activeIndex;
                  return (
                    <li
                      key={entry.movie.id}
                      role="option"
                      aria-selected={isHighlighted}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`px-3.5 py-2.5 flex items-center justify-between gap-2.5 transition-colors ${
                        isHighlighted ? 'bg-[#1E3A5F]/75' : 'hover:bg-[#0B192C]/60'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(entry.movie.id)}
                        className="flex-1 min-w-0 text-left cursor-pointer focus-visible:outline-none focus-visible:underline"
                      >
                        <div className="flex items-center gap-2">
                          <Film
                            className="w-3.5 h-3.5 text-[#38BDF8] shrink-0"
                            aria-hidden="true"
                          />
                          <span className="text-sm font-semibold text-[#F8FAFC] truncate">
                            {entry.movie.title}
                          </span>
                        </div>
                        <div className="text-xs text-[#CBD5E1] mt-0.5 pl-5 truncate">
                          {entry.movie.year} · {entry.movie.genres.join(' / ')} ·{' '}
                          <span className="font-mono text-[#93C5FD] tabular-nums">
                            {entry.avgRating.toFixed(1)}★
                          </span>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(entry.movie.id)}
                          aria-label={`View details for ${entry.movie.title}`}
                          className="px-2.5 py-1.5 rounded-md border border-[#1E3A5F] bg-[#0B192C] text-xs font-medium text-[#F8FAFC] hover:border-[#38BDF8] hover:text-[#38BDF8] transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJumpMatrix(entry.movie.id)}
                          aria-label={`Highlight ${entry.movie.title} in rating matrix`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#38BDF8] text-[#0B192C] text-xs font-semibold hover:bg-[#7DD3FC] transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <Grid3X3 className="w-3 h-3" aria-hidden="true" />
                          <span>Matrix</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="px-3.5 py-2 bg-[#0B192C] border-t border-[#1E3A5F] flex items-center justify-between text-[11px] text-[#CBD5E1]">
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#38BDF8] fill-[#38BDF8]" aria-hidden="true" />
                  Click any movie for full rating profile
                </span>
                <span className="font-mono text-[#93C5FD]">ESC to close</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
