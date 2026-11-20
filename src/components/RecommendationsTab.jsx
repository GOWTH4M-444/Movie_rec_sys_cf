'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Star,
  Users,
  Film,
  Sparkles,
  Calculator,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MOVIES, USERS } from '../data/movieDataset.js';
import {
  ALGORITHMS,
  getRecommendationsForUser,
  getPredictionBreakdown,
} from '../ml/collaborativeFiltering.js';
import DemoTour from './DemoTour.jsx';

const ALGORITHM_OPTIONS = [
  {
    id: ALGORITHMS.USER_BASED,
    label: 'User-Based CF',
    summary:
      'Finds viewers whose past ratings closely match yours and predicts scores from what they loved.',
  },
  {
    id: ALGORITHMS.ITEM_BASED,
    label: 'Item-Based CF',
    summary:
      'Finds movies that receive similar rating patterns to films you already rated highly.',
  },
  {
    id: ALGORITHMS.MATRIX_FACTORIZATION,
    label: 'Matrix Factorization (SVD)',
    summary:
      'Learns hidden taste factors across every user and movie to predict ratings with lower overall error.',
  },
];

const TOUR_STEPS = [
  {
    targetId: 'rec-user-selector',
    title: 'Pick a Sample Viewer Profile',
    description:
      'Choose any of the 20 sample users to inspect their watch history and past star ratings. The machine learning models use this history as their starting input.',
  },
  {
    targetId: 'rec-algo-switcher',
    title: 'Switch Between 3 ML Algorithms',
    description:
      'Click between User-Based CF, Item-Based CF, and Matrix Factorization (SVD) to see how each algorithm updates the predicted ratings in real time.',
  },
  {
    targetId: 'rec-results-grid',
    title: 'Read the Top 6 Predicted Movies',
    description:
      'Each card shows an unwatched movie, its predicted star rating (out of 5.0), a percentage match score, and a plain-English reason why the model selected it.',
  },
  {
    targetId: 'rec-calc-breakdown',
    title: 'Inspect How Each Rating Was Calculated',
    description:
      'Click any recommended movie card above to inspect the exact neighbor ratings, similarity weights, or hidden SVD factors behind its predicted star score.',
  },
  {
    targetId: 'rec-neighbors-panel',
    title: 'Inspect the Closest Matches',
    description:
      'See the top 3 most similar viewers (or similar movies in Item-Based mode) and the exact similarity percentage calculated by the algorithm.',
  },
];

export default function RecommendationsTab() {
  const [selectedUserId, setSelectedUserId] = useState(USERS[0].id);
  const [algorithm, setAlgorithm] = useState(ALGORITHMS.USER_BASED);
  const [selectedRecMovieId, setSelectedRecMovieId] = useState(null);
  const [breakdownExpanded, setBreakdownExpanded] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);

  const selectedUser = useMemo(
    () => USERS.find((u) => u.id === selectedUserId) || USERS[0],
    [selectedUserId]
  );

  const movieById = useMemo(
    () => Object.fromEntries(MOVIES.map((m) => [m.id, m])),
    []
  );

  const watchedHistory = useMemo(() => {
    return Object.entries(selectedUser.ratings)
      .map(([movieId, rating]) => ({
        movie: movieById[movieId],
        rating,
      }))
      .filter((entry) => Boolean(entry.movie))
      .sort((a, b) => b.rating - a.rating);
  }, [selectedUser, movieById]);

  const predictionResult = useMemo(
    () => getRecommendationsForUser(selectedUser.id, algorithm, 6),
    [selectedUser.id, algorithm]
  );

  const effectiveRecMovieId = useMemo(() => {
    if (
      selectedRecMovieId &&
      predictionResult.recommendations.some(
        (rec) => rec.movie.id === selectedRecMovieId
      )
    ) {
      return selectedRecMovieId;
    }
    return predictionResult.recommendations[0]?.movie.id || null;
  }, [selectedRecMovieId, predictionResult.recommendations]);

  const breakdown = useMemo(() => {
    if (!effectiveRecMovieId) return null;
    return getPredictionBreakdown(selectedUser.id, effectiveRecMovieId, algorithm);
  }, [selectedUser.id, effectiveRecMovieId, algorithm]);

  const activeAlgoInfo =
    ALGORITHM_OPTIONS.find((a) => a.id === algorithm) || ALGORITHM_OPTIONS[0];

  const neighborHeading =
    predictionResult.neighborType === 'movies'
      ? 'Top 3 Most Similar Movie Connections'
      : 'Top 3 Most Similar Viewers';

  const neighborCaption =
    predictionResult.neighborType === 'movies'
      ? 'Similarity Score shows how closely audiences rate two movies alike (100% means identical rating patterns).'
      : 'Similarity Score shows how closely another viewer agrees with your past ratings (100% means identical taste).';

  const handleInspectMovie = (movieId) => {
    setSelectedRecMovieId(movieId);
    setBreakdownExpanded(true);
  };

  return (
    <div className="space-y-8">
      {/* Tab Header + Mandatory Start Demo Tour Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#1E3A5F]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
            Get Recommendations
          </h1>
          <p className="text-sm text-[#CBD5E1] mt-1">
            Select a user profile and compare live movie predictions across all three Collaborative Filtering models.
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

      {/* Top Controls Row: User Selector + Algorithm Switcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* User Selector & Past Watched Movies */}
        <section
          data-tour-id="rec-user-selector"
          className="lg:col-span-5 rounded-xl bg-[#132743] border border-[#1E3A5F] p-5 flex flex-col"
        >
          <label
            htmlFor="user-profile-select"
            className="text-sm font-semibold text-[#F8FAFC] mb-2 block"
          >
            Choose a Sample User Profile
          </label>
          <select
            id="user-profile-select"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full rounded-lg bg-[#0B192C] border border-[#1E3A5F] px-3.5 py-2.5 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] mb-3"
          >
            {USERS.map((user) => (
              <option key={user.id} value={user.id} className="bg-[#0B192C]">
                {user.name}
              </option>
            ))}
          </select>

          <p className="text-sm text-[#CBD5E1] mb-4">{selectedUser.persona}</p>

          <div className="border-t border-[#1E3A5F] pt-3.5 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between text-xs text-[#93C5FD] mb-2.5">
              <span className="font-medium">Past Watched &amp; Rated Movies</span>
              <span className="font-mono tabular-nums">
                {watchedHistory.length} rated
              </span>
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1.5">
              {watchedHistory.map(({ movie, rating }) => (
                <div
                  key={movie.id}
                  className="flex items-center justify-between gap-3 py-1.5 px-2.5 rounded-md bg-[#0B192C]/70 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-[#F8FAFC] truncate block">
                      {movie.title}
                    </span>
                    <span className="text-[#CBD5E1]">
                      {movie.year} · {movie.genres.join(' / ')}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-[#38BDF8] tabular-nums whitespace-nowrap shrink-0">
                    {rating.toFixed(1)} ★
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Algorithm Switcher & Neighbor Summary */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section
            data-tour-id="rec-algo-switcher"
            className="rounded-xl bg-[#132743] border border-[#1E3A5F] p-5"
          >
            <h2 className="text-sm font-semibold text-[#F8FAFC] mb-3">
              Select Collaborative Filtering Algorithm
            </h2>

            <div
              role="group"
              aria-label="Collaborative Filtering algorithm"
              className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5"
            >
              {ALGORITHM_OPTIONS.map((opt) => {
                const isSelected = algorithm === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAlgorithm(opt.id)}
                    aria-pressed={isSelected}
                    className={`px-3.5 py-2.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                      isSelected
                        ? 'bg-[#38BDF8] text-[#0B192C] border-[#38BDF8] font-semibold'
                        : 'bg-[#0B192C] text-[#CBD5E1] border-[#1E3A5F] hover:border-[#38BDF8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <motion.p
              key={activeAlgoInfo.id}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="text-sm text-[#CBD5E1] leading-relaxed"
            >
              {activeAlgoInfo.summary}
            </motion.p>
          </section>

          {/* Neighbor Comparison Panel */}
          <section
            data-tour-id="rec-neighbors-panel"
            className="rounded-xl bg-[#132743] border border-[#1E3A5F] p-5 flex-1"
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <h2 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                {predictionResult.neighborType === 'movies' ? (
                  <Film className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                ) : (
                  <Users className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                )}
                <span>{neighborHeading}</span>
              </h2>
              <span className="font-mono text-xs text-[#93C5FD] whitespace-nowrap">
                Cosine / Latent Match
              </span>
            </div>
            <p className="text-xs text-[#CBD5E1] mb-4">{neighborCaption}</p>

            <div className="space-y-3">
              {predictionResult.neighbors.map((neighbor, index) => (
                <div
                  key={`${algorithm}-${neighbor.id}`}
                  className="py-2.5 px-3.5 rounded-lg bg-[#0B192C]/80 border border-[#1E3A5F]"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-sm font-medium text-[#F8FAFC] truncate">
                      {index + 1}. {neighbor.label}
                    </span>
                    <span className="font-mono text-sm font-semibold text-[#38BDF8] tabular-nums whitespace-nowrap shrink-0">
                      {neighbor.similarityPct}% similar
                    </span>
                  </div>

                  {/* Smooth animated similarity bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#1E3A5F] overflow-hidden mb-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${neighbor.similarityPct}%` }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="h-full bg-[#38BDF8] rounded-full"
                    />
                  </div>

                  <p className="text-xs text-[#CBD5E1]">{neighbor.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Top 6 Recommended Movies Grid */}
      <section data-tour-id="rec-results-grid">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#F8FAFC]">
              Top 6 Recommended Movies for {selectedUser.shortName}
            </h2>
            <p className="text-xs sm:text-sm text-[#CBD5E1] mt-0.5">
              Click any card to inspect the exact rating calculation below. Predicted ratings range from 1.0 to 5.0 stars.
            </p>
          </div>
          <span className="text-xs font-mono text-[#93C5FD] tabular-nums whitespace-nowrap">
            Active Model: {activeAlgoInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {predictionResult.recommendations.map((rec, idx) => {
            const isInspected = rec.movie.id === effectiveRecMovieId;
            return (
              <motion.article
                key={`${selectedUser.id}-${algorithm}-${rec.movie.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: idx * 0.04, ease: 'easeOut' }}
                onClick={() => handleInspectMovie(rec.movie.id)}
                className={`rounded-xl bg-[#132743] border p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(56,189,248,0.12)] ${
                  isInspected
                    ? 'border-[#38BDF8] ring-1 ring-[#38BDF8]/60 shadow-[0_8px_24px_rgba(56,189,248,0.14)]'
                    : 'border-[#1E3A5F] hover:border-[#38BDF8]/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="text-base font-semibold text-[#F8FAFC] leading-snug">
                      {idx + 1}. {rec.movie.title}
                    </h3>
                    <span className="font-mono text-sm font-semibold text-[#38BDF8] tabular-nums whitespace-nowrap shrink-0">
                      {rec.matchScore}% Match
                    </span>
                  </div>

                  {/* Clean unboxed metadata with middot separators */}
                  <p className="text-xs text-[#93C5FD] mb-2.5">
                    {rec.movie.year} · {rec.movie.genres.join(' / ')} · {rec.movie.director}
                  </p>

                  {/* Animated Match Score Progress Meter */}
                  <div className="w-full h-1.5 rounded-full bg-[#0B192C] overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rec.matchScore}%` }}
                      transition={{ duration: 0.4, delay: idx * 0.04, ease: 'easeOut' }}
                      className="h-full bg-[#38BDF8] rounded-full"
                    />
                  </div>

                  <p className="text-sm text-[#CBD5E1] leading-relaxed mb-4">
                    {rec.movie.summary}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-[#1E3A5F] space-y-3">
                  {/* Predicted Rating Row */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#CBD5E1]">Predicted Rating</span>
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#F8FAFC] tabular-nums">
                      <Star
                        className="w-4 h-4 text-[#38BDF8] fill-[#38BDF8]"
                        aria-hidden="true"
                      />
                      {rec.predictedRating.toFixed(1)} / 5.0
                    </span>
                  </div>

                  {/* Simple Plain-English Explanation Callout */}
                  <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] px-3 py-2 text-xs text-[#CBD5E1] flex items-start gap-2 leading-relaxed">
                    <Sparkles
                      className="w-3.5 h-3.5 text-[#93C5FD] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{rec.explanation}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInspectMovie(rec.movie.id);
                    }}
                    className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                      isInspected
                        ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8]'
                        : 'bg-[#0B192C] border-[#1E3A5F] text-[#CBD5E1] hover:border-[#38BDF8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {isInspected
                        ? 'Showing Calculation Below'
                        : 'Inspect Rating Calculation'}
                    </span>
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* Expandable "How This Rating Was Calculated" Breakdown Panel */}
      {breakdown && (
        <section
          data-tour-id="rec-calc-breakdown"
          className="rounded-xl bg-[#132743] border border-[#38BDF8]/60 overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setBreakdownExpanded((prev) => !prev)}
            aria-expanded={breakdownExpanded}
            className="w-full px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-[#1A3354]/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#38BDF8]"
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#0B192C] border border-[#38BDF8]/50 flex items-center justify-center text-[#38BDF8] shrink-0">
                <Calculator className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-[#F8FAFC] leading-snug">
                  How This Rating Was Calculated: {breakdown.movie.title}
                </h2>
                <p className="text-xs text-[#CBD5E1] mt-0.5">
                  Transparent step-by-step math for {breakdown.userShortName} using{' '}
                  <span className="text-[#93C5FD] font-medium">
                    {activeAlgoInfo.label}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <span className="font-mono text-sm font-semibold text-[#38BDF8] bg-[#0B192C] border border-[#1E3A5F] px-3 py-1 rounded-md tabular-nums">
                Predicted: {breakdown.predictedRating.toFixed(1)} ★
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#93C5FD]">
                {breakdownExpanded ? 'Hide Math' : 'Show Math'}
                {breakdownExpanded ? (
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                )}
              </span>
            </div>
          </button>

          <AnimatePresence initial={false}>
            {breakdownExpanded && (
              <motion.div
                key={`breakdown-${breakdown.movie.id}-${algorithm}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="overflow-hidden border-t border-[#1E3A5F]"
              >
                <div className="p-5 space-y-5">
                  {/* Top Formula Summary + 3 Numeric Steps */}
                  <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-4">
                    <div className="text-xs font-semibold text-[#93C5FD] mb-1.5">
                      Plain-English Prediction Formula
                    </div>
                    <p className="font-mono text-xs sm:text-sm text-[#F8FAFC] leading-relaxed tabular-nums">
                      {breakdown.formulaSummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-[#0B192C]/80 border border-[#1E3A5F] p-3.5">
                      <div className="text-xs text-[#CBD5E1] mb-1">
                        1. Starting Baseline
                      </div>
                      <div className="font-mono text-lg font-bold text-[#F8FAFC] tabular-nums">
                        {breakdown.baselineValue.toFixed(2)} ★
                      </div>
                      <div className="text-xs text-[#93C5FD] mt-0.5">
                        {breakdown.baselineLabel}
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#0B192C]/80 border border-[#1E3A5F] p-3.5">
                      <div className="text-xs text-[#CBD5E1] mb-1">
                        2. Model Adjustment
                      </div>
                      <div className="font-mono text-lg font-bold text-[#38BDF8] tabular-nums">
                        {breakdown.weightedAdjustment >= 0 ? '+' : ''}
                        {breakdown.weightedAdjustment.toFixed(2)} ★
                      </div>
                      <div className="text-xs text-[#93C5FD] mt-0.5">
                        {breakdown.contributorKind === 'neighbors'
                          ? 'Weighted shift from similar viewers'
                          : breakdown.contributorKind === 'movies'
                          ? 'Weighted shift from similar movies'
                          : 'Viewer bias + movie bias + latent match'}
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#0B192C]/80 border border-[#38BDF8]/50 p-3.5">
                      <div className="text-xs text-[#CBD5E1] mb-1">
                        3. Final Predicted Score
                      </div>
                      <div className="font-mono text-lg font-bold text-[#38BDF8] tabular-nums">
                        {breakdown.predictedRating.toFixed(1)} / 5.0 ★
                      </div>
                      <div className="text-xs text-[#93C5FD] mt-0.5">
                        Clamped to valid 1.0–5.0 star scale
                      </div>
                    </div>
                  </div>

                  {/* Detailed Contributors Table */}
                  {breakdown.contributorKind === 'neighbors' && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#F8FAFC] mb-2">
                        Exact Neighbor Ratings &amp; Similarity Weights Used
                      </h3>
                      {breakdown.contributors.length === 0 ? (
                        <p className="text-xs text-[#CBD5E1] rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-4">
                          No close neighbors had directly rated this title yet, so the model fell back to the viewer&apos;s baseline rating.
                        </p>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-[#1E3A5F]">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                              <tr className="bg-[#0B192C] border-b border-[#1E3A5F] text-xs font-semibold text-[#93C5FD]">
                                <th className="py-2.5 px-3.5">Similar Viewer</th>
                                <th className="py-2.5 px-3.5 text-right">Taste Match</th>
                                <th className="py-2.5 px-3.5 text-right">Their Rating</th>
                                <th className="py-2.5 px-3.5 text-right">Their Avg</th>
                                <th className="py-2.5 px-3.5 text-right">Above/Below Avg</th>
                                <th className="py-2.5 px-3.5 text-right">Weight</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1E3A5F]">
                              {breakdown.contributors.map((item) => (
                                <tr key={item.id} className="bg-[#0B192C]/40">
                                  <td className="py-2.5 px-3.5 font-medium text-[#F8FAFC]">
                                    {item.label}
                                    <span className="block text-[11px] text-[#CBD5E1]">
                                      {item.overlapCount} movies rated in common
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-[#38BDF8] tabular-nums">
                                    {item.similarityPct}%
                                  </td>
                                  <td className="py-2.5 px-3.5 text-right font-mono text-[#F8FAFC] tabular-nums">
                                    {item.rating.toFixed(1)} ★
                                  </td>
                                  <td className="py-2.5 px-3.5 text-right font-mono text-[#CBD5E1] tabular-nums">
                                    {item.baseline.toFixed(2)} ★
                                  </td>
                                  <td className="py-2.5 px-3.5 text-right font-mono text-[#93C5FD] tabular-nums">
                                    {item.delta >= 0 ? '+' : ''}
                                    {item.delta.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3.5 text-right font-mono text-[#CBD5E1] tabular-nums">
                                    {item.weight.toFixed(3)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {breakdown.contributorKind === 'movies' && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#F8FAFC] mb-2">
                        Similar Movies Already Rated by {breakdown.userShortName}
                      </h3>
                      {breakdown.contributors.length === 0 ? (
                        <p className="text-xs text-[#CBD5E1] rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-4">
                          Not enough co-rated movies met the similarity threshold, so the model used the movie&apos;s community average.
                        </p>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-[#1E3A5F]">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                              <tr className="bg-[#0B192C] border-b border-[#1E3A5F] text-xs font-semibold text-[#93C5FD]">
                                <th className="py-2.5 px-3.5">Watched Movie</th>
                                <th className="py-2.5 px-3.5 text-right">Item Similarity</th>
                                <th className="py-2.5 px-3.5 text-right">Viewer&apos;s Rating</th>
                                <th className="py-2.5 px-3.5 text-right">Movie Avg</th>
                                <th className="py-2.5 px-3.5 text-right">Preference Shift</th>
                                <th className="py-2.5 px-3.5 text-right">Weight</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1E3A5F]">
                              {breakdown.contributors.map((item) => (
                                <tr key={item.id} className="bg-[#0B192C]/40">
                                  <td className="py-2.5 px-3.5 font-medium text-[#F8FAFC]">
                                    {item.label}
                                    <span className="block text-[11px] text-[#CBD5E1]">
                                      {item.overlapCount} shared viewers
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-[#38BDF8] tabular-nums">
                                    {item.similarityPct}%
                                  </td>
                                  <td className="py-2.5 px-3.5 text-right font-mono text-[#F8FAFC] tabular-nums">
                                    {item.rating.toFixed(1)} ★
                                  </td>
                                  <td className="py-2.5 px-3.5 text-right font-mono text-[#CBD5E1] tabular-nums">
                                    {item.baseline.toFixed(2)} ★
                                  </td>
                                  <td className="py-2.5 px-3.5 text-right font-mono text-[#93C5FD] tabular-nums">
                                    {item.delta >= 0 ? '+' : ''}
                                    {item.delta.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3.5 text-right font-mono text-[#CBD5E1] tabular-nums">
                                    {item.weight.toFixed(3)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {breakdown.contributorKind === 'factors' && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#F8FAFC] mb-2">
                        Learned SVD Biases &amp; Hidden Taste Factors
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div className="rounded-lg bg-[#0B192C]/60 border border-[#1E3A5F] px-3.5 py-2.5 flex items-center justify-between text-xs">
                          <span className="text-[#CBD5E1]">Viewer Rating Bias</span>
                          <span className="font-mono font-semibold text-[#F8FAFC] tabular-nums">
                            {breakdown.userBias >= 0 ? '+' : ''}
                            {breakdown.userBias.toFixed(2)}
                          </span>
                        </div>
                        <div className="rounded-lg bg-[#0B192C]/60 border border-[#1E3A5F] px-3.5 py-2.5 flex items-center justify-between text-xs">
                          <span className="text-[#CBD5E1]">Movie Quality Bias</span>
                          <span className="font-mono font-semibold text-[#F8FAFC] tabular-nums">
                            {breakdown.itemBias >= 0 ? '+' : ''}
                            {breakdown.itemBias.toFixed(2)}
                          </span>
                        </div>
                        <div className="rounded-lg bg-[#0B192C]/60 border border-[#1E3A5F] px-3.5 py-2.5 flex items-center justify-between text-xs">
                          <span className="text-[#CBD5E1]">Latent Dot Product</span>
                          <span className="font-mono font-semibold text-[#38BDF8] tabular-nums">
                            {breakdown.latentDot >= 0 ? '+' : ''}
                            {breakdown.latentDot.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-[#1E3A5F]">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-[#0B192C] border-b border-[#1E3A5F] text-xs font-semibold text-[#93C5FD]">
                              <th className="py-2.5 px-3.5">Latent Dimension</th>
                              <th className="py-2.5 px-3.5 text-right">Viewer Score (p)</th>
                              <th className="py-2.5 px-3.5 text-right">Movie Score (q)</th>
                              <th className="py-2.5 px-3.5 text-right">Contribution (p × q)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E3A5F]">
                            {breakdown.contributors.map((factor) => (
                              <tr key={factor.id} className="bg-[#0B192C]/40">
                                <td className="py-2.5 px-3.5 font-medium text-[#F8FAFC]">
                                  {factor.label}
                                </td>
                                <td className="py-2.5 px-3.5 text-right font-mono text-[#CBD5E1] tabular-nums">
                                  {factor.userScore.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3.5 text-right font-mono text-[#CBD5E1] tabular-nums">
                                  {factor.movieScore.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-[#38BDF8] tabular-nums">
                                  {factor.contribution >= 0 ? '+' : ''}
                                  {factor.contribution.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      <DemoTour
        steps={TOUR_STEPS}
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </div>
  );
}
