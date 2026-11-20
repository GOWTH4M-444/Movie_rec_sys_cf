'use client';

import React, { useEffect, useMemo } from 'react';
import { X, Star, Grid3X3, Users, Film, ArrowRight } from 'lucide-react';
import { getMovieInsights } from '../ml/collaborativeFiltering.js';

/**
 * Movie Detail Modal
 *
 * Displays complete metadata, community rating statistics, average ML-predicted
 * score for unrated viewers, Top 3 similar movies (via Item-Based Cosine Similarity),
 * and every known viewer rating — plus a 1-click "Highlight in Rating Matrix" CTA.
 *
 * @param {{
 *   movieId: string | null,
 *   onClose: () => void,
 *   onHighlightInMatrix: (movieId: string) => void,
 *   onSelectMovieDetail: (movieId: string) => void
 * }} props
 */
export default function MovieDetailModal({
  movieId,
  onClose,
  onHighlightInMatrix,
  onSelectMovieDetail,
}) {
  const insights = useMemo(
    () => (movieId ? getMovieInsights(movieId) : null),
    [movieId]
  );

  useEffect(() => {
    if (!movieId) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [movieId, onClose]);

  if (!insights) return null;

  const { movie, avgRating, ratingCount, unratedCount, avgPredictedRating, knownRatings, similarMovies } =
    insights;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-detail-title"
    >
      {/* Dimmed Backdrop */}
      <button
        type="button"
        aria-label="Close movie detail modal"
        onClick={onClose}
        className="fixed inset-0 bg-[#060F1D]/80 backdrop-blur-[2px] cursor-default"
      />

      {/* Modal Surface */}
      <div className="relative z-10 w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-xl bg-[#132743] border border-[#38BDF8]/80 shadow-2xl text-[#F8FAFC]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#132743] px-6 py-5 border-b border-[#1E3A5F] flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#93C5FD] mb-1">
              {movie.year} · {movie.genres.join(' / ')} · Directed by {movie.director}
            </p>
            <h2
              id="movie-detail-title"
              className="text-xl sm:text-2xl font-bold text-[#F8FAFC] leading-snug"
            >
              {movie.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close movie details"
            className="p-2 rounded-lg text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#1E3A5F] transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Plain-English Summary */}
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            {movie.summary}
          </p>

          {/* Key Quantitative Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-4">
              <div className="text-xs text-[#93C5FD] mb-1">
                Community Average
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xl font-bold text-[#38BDF8] tabular-nums">
                <Star className="w-4 h-4 fill-[#38BDF8] text-[#38BDF8]" aria-hidden="true" />
                <span>{avgRating.toFixed(2)} / 5.0</span>
              </div>
              <p className="text-[11px] text-[#CBD5E1] mt-1">
                Average of actual viewer scores
              </p>
            </div>

            <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-4">
              <div className="text-xs text-[#93C5FD] mb-1">
                Known Ratings
              </div>
              <div className="font-mono text-xl font-bold text-[#F8FAFC] tabular-nums">
                {ratingCount} of 20
              </div>
              <p className="text-[11px] text-[#CBD5E1] mt-1">
                {unratedCount} empty cells predicted by ML
              </p>
            </div>

            <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-4">
              <div className="text-xs text-[#93C5FD] mb-1">
                Avg ML Prediction
              </div>
              <div className="font-mono text-xl font-bold text-[#93C5FD] tabular-nums">
                ~{avgPredictedRating.toFixed(2)} ★
              </div>
              <p className="text-[11px] text-[#CBD5E1] mt-1">
                SVD estimate for unrated viewers
              </p>
            </div>
          </div>

          {/* Top 3 Most Similar Movies (Item-Based CF) */}
          {similarMovies.length > 0 && (
            <section>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                  <span>Most Similar Movies (Item-Based Cosine Similarity)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {similarMovies.map((item) => (
                  <button
                    key={item.movie.id}
                    type="button"
                    onClick={() => onSelectMovieDetail(item.movie.id)}
                    className="text-left rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-3 hover:border-[#38BDF8] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                  >
                    <div className="text-xs font-semibold text-[#F8FAFC] truncate">
                      {item.movie.title}
                    </div>
                    <div className="text-[11px] text-[#CBD5E1] mt-0.5 truncate">
                      {item.movie.year} · {item.movie.genres.join(' / ')}
                    </div>
                    <div className="font-mono text-xs font-semibold text-[#38BDF8] tabular-nums mt-2">
                      {item.similarityPct}% similar
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Known Viewer Ratings Breakdown */}
          <section>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                <span>How Sample Viewers Rated This Movie</span>
              </h3>
              <span className="font-mono text-xs text-[#93C5FD] tabular-nums">
                {knownRatings.length} ratings
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-lg border border-[#1E3A5F] divide-y divide-[#1E3A5F] bg-[#0B192C]/80">
              {knownRatings.map((entry) => (
                <div
                  key={entry.userId}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-[#F8FAFC] block truncate">
                      {entry.name}
                    </span>
                    <span className="text-[#CBD5E1] truncate block">
                      {entry.persona}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-[#38BDF8] tabular-nums whitespace-nowrap shrink-0">
                    {entry.rating.toFixed(1)} ★
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-[#132743] px-6 py-4 border-t border-[#1E3A5F] flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#1E3A5F] bg-[#0B192C] text-sm font-medium text-[#CBD5E1] hover:text-[#F8FAFC] hover:border-[#38BDF8] transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => onHighlightInMatrix(movie.id)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#38BDF8] text-[#0B192C] text-sm font-semibold hover:bg-[#7DD3FC] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            <Grid3X3 className="w-4 h-4" aria-hidden="true" />
            <span>Highlight in Rating Matrix</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
