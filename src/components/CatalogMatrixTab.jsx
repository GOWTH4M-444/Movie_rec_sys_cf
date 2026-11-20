'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  Search,
  Eye,
  EyeOff,
  Star,
  X,
  Info,
  Database,
} from 'lucide-react';
import { MOVIES, USERS, ALL_GENRES } from '../data/movieDataset.js';
import {
  getFullRatingMatrixPredictions,
  getMatrixSparsityStats,
} from '../ml/collaborativeFiltering.js';
import DemoTour from './DemoTour.jsx';

const TOUR_STEPS = [
  {
    targetId: 'catalog-search-filter',
    title: 'Search & Filter All 44 Movies',
    description:
      'Type any movie title or director, or pick a genre from the dropdown. Both the catalog table and the rating matrix below update automatically.',
  },
  {
    targetId: 'catalog-sparsity-bar',
    title: 'Understand Matrix Sparsity at a Glance',
    description:
      'Most viewers only watch a fraction of available movies. This summary bar shows how much of the 20×44 rating table is known versus empty cells predicted by ML.',
  },
  {
    targetId: 'catalog-rating-matrix',
    title: 'Inspect the User-Item Rating Matrix',
    description:
      'This grid is the heart of Collaborative Filtering. Solid blue cells show real known ratings; muted cells with a tilde (~) show empty spaces that the ML model predicts.',
  },
  {
    targetId: 'catalog-movie-list',
    title: 'Explore Movie Details & Average Ratings',
    description:
      'Review every movie in the dataset along with its release year, genre, director, average community rating, and how many sample viewers have rated it.',
  },
];

/**
 * @param {{
 *   highlightedMovieId?: string | null,
 *   onClearHighlight?: () => void,
 *   onSelectMovieDetail?: (movieId: string) => void
 * }} props
 */
export default function CatalogMatrixTab({
  highlightedMovieId = null,
  onClearHighlight = () => {},
  onSelectMovieDetail = () => {},
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [showPredictionsInMatrix, setShowPredictionsInMatrix] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);
  const matrixSectionRef = useRef(null);

  const highlightedMovie = useMemo(
    () => MOVIES.find((m) => m.id === highlightedMovieId) || null,
    [highlightedMovieId]
  );

  // Smoothly scroll the User-Item Rating Matrix into view whenever a movie is highlighted from global search
  useEffect(() => {
    if (!highlightedMovieId) return;
    const t = window.setTimeout(() => {
      matrixSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 120);
    return () => window.clearTimeout(t);
  }, [highlightedMovieId]);

  const predictedMatrix = useMemo(() => getFullRatingMatrixPredictions(), []);
  const sparsityStats = useMemo(() => getMatrixSparsityStats(), []);

  // Precompute community stats per movie
  const movieStats = useMemo(() => {
    const stats = {};
    for (const movie of MOVIES) {
      let sum = 0;
      let count = 0;
      for (const user of USERS) {
        const r = user.ratings[movie.id];
        if (r !== undefined) {
          sum += r;
          count += 1;
        }
      }
      stats[movie.id] = {
        avg: count > 0 ? sum / count : 0,
        count,
      };
    }
    return stats;
  }, []);

  const filteredMovies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MOVIES.filter((movie) => {
      const matchesGenre =
        selectedGenre === 'All' || movie.genres.includes(selectedGenre);
      const matchesSearch =
        q === '' ||
        movie.title.toLowerCase().includes(q) ||
        movie.director.toLowerCase().includes(q) ||
        movie.genres.some((g) => g.toLowerCase().includes(q));
      return matchesGenre && matchesSearch;
    });
  }, [searchQuery, selectedGenre]);

  // Display up to 10 movies in the horizontal matrix; always pin the highlighted movie first so it is immediately visible
  const matrixMovies = useMemo(() => {
    const base = filteredMovies.slice(0, 10);
    if (!highlightedMovie) return base;
    const withoutHighlighted = base.filter((m) => m.id !== highlightedMovie.id);
    return [highlightedMovie, ...withoutHighlighted].slice(0, 10);
  }, [filteredMovies, highlightedMovie]);

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#1E3A5F]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
            Movie Catalog &amp; Rating Matrix
          </h1>
          <p className="text-sm text-[#CBD5E1] mt-1">
            Browse all {MOVIES.length} curated movies and inspect the exact User-Item Rating Matrix that powers our ML models.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setTourOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#132743] border border-[#38BDF8] text-[#38BDF8] text-sm font-medium hover:bg-[#38BDF8] hover:text-[#0B192C] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
        >
          <Compass className="w-4 h-4" aria-hidden="true" />
          <span>Start Demo Tour</span>
        </button>
      </div>

      {/* Search & Genre Filter Bar */}
      <section
        data-tour-id="catalog-search-filter"
        className="rounded-xl bg-[#132743] border border-[#1E3A5F] p-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6">
            <label
              htmlFor="catalog-search-input"
              className="block text-xs font-semibold text-[#93C5FD] mb-1.5"
            >
              Search Movies by Title, Genre, or Director
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#CBD5E1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="catalog-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., Inception, Nolan, Animation..."
                className="w-full rounded-lg bg-[#0B192C] border border-[#1E3A5F] pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="catalog-genre-select"
              className="block text-xs font-semibold text-[#93C5FD] mb-1.5"
            >
              Filter by Genre
            </label>
            <select
              id="catalog-genre-select"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full rounded-lg bg-[#0B192C] border border-[#1E3A5F] px-3.5 py-2.5 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]"
            >
              <option value="All">All Genres ({MOVIES.length})</option>
              {ALL_GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3 pb-2.5">
            <span className="font-mono text-xs text-[#CBD5E1] tabular-nums whitespace-nowrap">
              {filteredMovies.length} of {MOVIES.length} movies
            </span>
            {(searchQuery !== '' || selectedGenre !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('All');
                }}
                className="text-xs font-medium text-[#38BDF8] hover:underline whitespace-nowrap cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* How to Read This Matrix & Dataset Sparsity Summary Bar */}
      <section
        data-tour-id="catalog-sparsity-bar"
        className="rounded-xl bg-[#132743] border border-[#1E3A5F] p-5 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[#F8FAFC]">
              How to Read This Matrix &amp; Dataset Sparsity
            </h2>
          </div>
          <span className="font-mono text-xs text-[#93C5FD] tabular-nums">
            {sparsityStats.totalUsers} Users × {sparsityStats.totalMovies} Movies ={' '}
            {sparsityStats.totalCells} Total Matrix Cells
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
          In real movie platforms, viewers only rate a fraction of the catalog, leaving a mostly empty grid called a{' '}
          <strong className="text-[#F8FAFC]">sparse matrix</strong>. Collaborative Filtering learns from the filled cells ({sparsityStats.fillPct}%) to accurately predict every empty cell ({sparsityStats.sparsityPct}%).
        </p>

        {/* 3 Sparsity Metric Callouts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] px-4 py-3">
            <div className="text-xs text-[#CBD5E1]">Known Ratings (Filled)</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-lg font-bold text-[#38BDF8] tabular-nums">
                {sparsityStats.knownRatingsCount}
              </span>
              <span className="font-mono text-xs text-[#93C5FD] tabular-nums">
                ({sparsityStats.fillPct}% filled)
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] px-4 py-3">
            <div className="text-xs text-[#CBD5E1]">Unrated Cells (ML Predicted)</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-lg font-bold text-[#F8FAFC] tabular-nums">
                {sparsityStats.predictedCellsCount}
              </span>
              <span className="font-mono text-xs text-[#CBD5E1] tabular-nums">
                ({sparsityStats.sparsityPct}% sparse)
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] px-4 py-3">
            <div className="text-xs text-[#CBD5E1]">Average Ratings per Viewer</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-lg font-bold text-[#93C5FD] tabular-nums">
                {(sparsityStats.knownRatingsCount / sparsityStats.totalUsers).toFixed(1)}
              </span>
              <span className="text-xs text-[#CBD5E1]">of {sparsityStats.totalMovies} movies</span>
            </div>
          </div>
        </div>

        {/* Visual Fill vs. Sparsity Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-[#38BDF8]">
              Known Ratings: {sparsityStats.fillPct}%
            </span>
            <span className="text-[#CBD5E1]">
              Empty / ML-Predicted Sparsity: {sparsityStats.sparsityPct}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#0B192C] border border-[#1E3A5F] overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sparsityStats.fillPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-[#38BDF8]"
              title={`Known Ratings: ${sparsityStats.fillPct}%`}
            />
            <div
              className="h-full flex-1 bg-[#1E3A5F]/45"
              title={`Empty / ML-Predicted Cells: ${sparsityStats.sparsityPct}%`}
            />
          </div>
        </div>
      </section>

      {/* User-Item Rating Matrix View */}
      <section
        ref={matrixSectionRef}
        data-tour-id="catalog-rating-matrix"
        className="rounded-xl bg-[#132743] border border-[#1E3A5F] p-5 scroll-mt-24"
      >
        {highlightedMovie && (
          <div
            role="status"
            className="mb-4 rounded-lg bg-[#0B192C] border border-[#38BDF8] px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="text-sm text-[#F8FAFC]">
              <span className="text-[#93C5FD] font-medium">
                Highlighted in Matrix:{' '}
              </span>
              <strong className="font-semibold">{highlightedMovie.title}</strong>{' '}
              <span className="text-[#CBD5E1] text-xs">
                ({highlightedMovie.year} · {highlightedMovie.genres.join(' / ')})
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onSelectMovieDetail(highlightedMovie.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1E3A5F] bg-[#132743] text-xs font-medium text-[#F8FAFC] hover:border-[#38BDF8] hover:text-[#38BDF8] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Info className="w-3.5 h-3.5" aria-hidden="true" />
                <span>View Details</span>
              </button>
              <button
                type="button"
                onClick={onClearHighlight}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#1E3A5F] text-xs font-medium text-[#CBD5E1] hover:text-[#F8FAFC] transition-colors cursor-pointer whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Clear Highlight</span>
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#F8FAFC]">
              User-Item Rating Matrix
            </h2>
            <p className="text-xs sm:text-sm text-[#CBD5E1] mt-0.5">
              Rows represent sample viewers and columns represent movies. Click any movie column header to open its full analytics modal.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPredictionsInMatrix((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#1E3A5F] bg-[#0B192C] text-xs font-medium text-[#F8FAFC] hover:border-[#38BDF8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {showPredictionsInMatrix ? (
              <>
                <EyeOff className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                <span>Hide ML Predictions</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                <span>Show ML Predictions</span>
              </>
            )}
          </button>
        </div>

        {/* Clear Visual Legend (dual-coded color + symbol + text) */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#CBD5E1] mb-4 pb-3 border-b border-[#1E3A5F]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-11 h-6 rounded bg-[#1E3A5F] border border-[#38BDF8] font-mono text-[11px] font-semibold text-[#F8FAFC]">
              4.5★
            </span>
            <span>Known High Rating (4.0–5.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-11 h-6 rounded bg-[#0F2440] border border-[#1E3A5F] font-mono text-[11px] font-semibold text-[#CBD5E1]">
              2.5★
            </span>
            <span>Known Lower Rating (1.0–3.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-11 h-6 rounded bg-[#0B192C] border border-dashed border-[#38BDF8]/50 font-mono text-[11px] text-[#93C5FD]">
              ~4.4
            </span>
            <span>Empty Cell (ML Predicted Score)</span>
          </div>
        </div>

        {matrixMovies.length === 0 ? (
          <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-6 text-center text-sm text-[#CBD5E1]">
            No movies match your current filter. Clear the search bar or pick another genre to inspect the matrix.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#1E3A5F]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B192C] border-b border-[#1E3A5F]">
                  <th className="sticky left-0 z-10 bg-[#0B192C] py-3 px-3.5 text-xs font-semibold text-[#93C5FD] border-r border-[#1E3A5F] min-w-[140px]">
                    Viewer Profile
                  </th>
                  {matrixMovies.map((movie) => {
                    const isColHighlighted = movie.id === highlightedMovieId;
                    return (
                      <th
                        key={movie.id}
                        className={`py-3 px-2.5 text-xs font-semibold text-center min-w-[96px] ${
                          isColHighlighted
                            ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-x border-t-2 border-x-[#38BDF8]/60 border-t-[#38BDF8]'
                            : 'text-[#F8FAFC]'
                        }`}
                        title={`${movie.title} (${movie.year})`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectMovieDetail(movie.id)}
                          className="line-clamp-2 leading-tight hover:text-[#38BDF8] transition-colors cursor-pointer mx-auto"
                        >
                          {movie.title}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A5F]">
                {USERS.slice(0, 12).map((user) => (
                  <tr key={user.id} className="hover:bg-[#0B192C]/40">
                    <td className="sticky left-0 z-10 bg-[#132743] py-2.5 px-3.5 text-xs font-medium text-[#F8FAFC] border-r border-[#1E3A5F] whitespace-nowrap">
                      {user.shortName}
                    </td>
                    {matrixMovies.map((movie) => {
                      const known = user.ratings[movie.id];
                      const predicted = predictedMatrix[user.id]?.[movie.id];
                      const isColHighlighted = movie.id === highlightedMovieId;
                      const colBgClass = isColHighlighted
                        ? 'bg-[#38BDF8]/10 border-x border-[#38BDF8]/45'
                        : '';

                      if (known !== undefined) {
                        const isHigh = known >= 4.0;
                        return (
                          <td
                            key={movie.id}
                            className={`p-1.5 text-center ${colBgClass}`}
                          >
                            <span
                              title={`${user.shortName} rated ${movie.title}: ${known.toFixed(1)} stars (Known)`}
                              className={`inline-flex items-center justify-center w-full py-1.5 rounded font-mono text-xs font-semibold tabular-nums ${
                                isColHighlighted
                                  ? 'bg-[#38BDF8] text-[#0B192C] border border-[#38BDF8]'
                                  : isHigh
                                  ? 'bg-[#1E3A5F] text-[#F8FAFC] border border-[#38BDF8]/70'
                                  : 'bg-[#0F2440] text-[#CBD5E1] border border-[#1E3A5F]'
                              }`}
                            >
                              {known.toFixed(1)}★
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={movie.id}
                          className={`p-1.5 text-center ${colBgClass}`}
                        >
                          <span
                            title={
                              showPredictionsInMatrix
                                ? `Unrated by ${user.shortName} — ML predicts ${predicted?.toFixed(1)} stars`
                                : `Unrated by ${user.shortName}`
                            }
                            className={`inline-flex items-center justify-center w-full py-1.5 rounded bg-[#0B192C] font-mono text-xs tabular-nums ${
                              isColHighlighted
                                ? 'border border-dashed border-[#38BDF8] text-[#38BDF8] font-medium'
                                : 'border border-dashed border-[#1E3A5F] text-[#93C5FD]'
                            }`}
                          >
                            {showPredictionsInMatrix && predicted !== undefined
                              ? `~${predicted.toFixed(1)}`
                              : '—'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredMovies.length > 10 && (
          <p className="text-xs text-[#CBD5E1] mt-3">
            Showing first 10 matching movies across 12 sample viewers for readability. Use the search or genre filter above to inspect specific titles in the matrix.
          </p>
        )}
      </section>

      {/* Full Searchable Movie Catalog Table */}
      <section
        data-tour-id="catalog-movie-list"
        className="rounded-xl bg-[#132743] border border-[#1E3A5F] p-5"
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold text-[#F8FAFC]">
            Movie Catalog ({filteredMovies.length})
          </h2>
          <span className="text-xs text-[#CBD5E1]">
            Click any title for full ratings &amp; similar movies
          </span>
        </div>

        {filteredMovies.length === 0 ? (
          <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-8 text-center">
            <p className="text-sm text-[#F8FAFC] font-medium mb-1">
              No matching movies found
            </p>
            <p className="text-xs text-[#CBD5E1] mb-4">
              Try a different title keyword or reset the genre filter to view all {MOVIES.length} movies.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('All');
              }}
              className="px-4 py-2 rounded-lg bg-[#38BDF8] text-[#0B192C] text-xs font-semibold cursor-pointer"
            >
              Show All Movies
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#1E3A5F]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B192C] border-b border-[#1E3A5F] text-xs font-semibold text-[#93C5FD]">
                  <th className="py-3 px-4">Movie Title</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Genres</th>
                  <th className="py-3 px-4">Director</th>
                  <th className="py-3 px-4 text-right">Avg Rating</th>
                  <th className="py-3 px-4 text-right">Ratings Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A5F] text-sm">
                {filteredMovies.map((movie) => {
                  const stat = movieStats[movie.id];
                  const isRowHighlighted = movie.id === highlightedMovieId;
                  return (
                    <tr
                      key={movie.id}
                      className={`transition-colors ${
                        isRowHighlighted
                          ? 'bg-[#38BDF8]/15'
                          : 'hover:bg-[#0B192C]/50'
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-[#F8FAFC]">
                        <button
                          type="button"
                          onClick={() => onSelectMovieDetail(movie.id)}
                          className="text-left hover:text-[#38BDF8] hover:underline transition-colors cursor-pointer"
                        >
                          {movie.title}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#CBD5E1] tabular-nums">
                        {movie.year}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#93C5FD]">
                        {movie.genres.join(' · ')}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#CBD5E1]">
                        {movie.director}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-[#38BDF8] tabular-nums whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 justify-end">
                          <Star className="w-3.5 h-3.5 fill-[#38BDF8] text-[#38BDF8]" aria-hidden="true" />
                          {stat.avg.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-[#CBD5E1] tabular-nums">
                        {stat.count} users
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DemoTour
        steps={TOUR_STEPS}
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </div>
  );
}
