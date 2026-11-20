'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  Star,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { MOVIES, SANDBOX_MOVIE_IDS } from '../data/movieDataset.js';
import {
  ALGORITHMS,
  predictForNewUser,
  computeGenreAffinityProfile,
} from '../ml/collaborativeFiltering.js';
import DemoTour from './DemoTour.jsx';

const MIN_RATINGS = 3;

const TOUR_STEPS = [
  {
    targetId: 'sandbox-rating-list',
    title: 'Rate at Least 3 Popular Movies',
    description:
      'Act as a brand-new viewer by clicking 1 to 5 stars on movies you know. Giving a mix of high and low stars helps the model learn what you enjoy and what to avoid.',
  },
  {
    targetId: 'sandbox-genre-profile',
    title: 'Watch Your Live Genre Taste Profile',
    description:
      'Every star you click immediately updates your emerging affinity percentages across genres like Sci-Fi, Action, Drama, and Comedy.',
  },
  {
    targetId: 'sandbox-controls',
    title: 'Choose a Model & Generate Predictions',
    description:
      'Once you have rated at least 3 movies, pick your preferred Collaborative Filtering algorithm and click "Generate My Predictions" to run the math instantly in your browser.',
  },
  {
    targetId: 'sandbox-results',
    title: 'Explore Your Live Personalized Picks',
    description:
      'Your top 6 recommended movies appear here immediately, complete with predicted star scores, match percentages, and the viewers in our dataset who share your taste.',
  },
];

export default function LiveSandboxTab() {
  const [userRatings, setUserRatings] = useState({});
  const [algorithm, setAlgorithm] = useState(ALGORITHMS.USER_BASED);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [tourOpen, setTourOpen] = useState(false);

  const sandboxMovies = useMemo(() => {
    const byId = Object.fromEntries(MOVIES.map((m) => [m.id, m]));
    return SANDBOX_MOVIE_IDS.map((id) => byId[id]).filter(Boolean);
  }, []);

  const genreProfile = useMemo(
    () => computeGenreAffinityProfile(userRatings),
    [userRatings]
  );

  const ratedCount = Object.keys(userRatings).length;
  const isReady = ratedCount >= MIN_RATINGS;

  const handleSetRating = (movieId, stars) => {
    setUserRatings((prev) => ({
      ...prev,
      [movieId]: stars,
    }));
    setValidationError('');
  };

  const handleClearMovieRating = (movieId) => {
    setUserRatings((prev) => {
      const next = { ...prev };
      delete next[movieId];
      return next;
    });
  };

  const handleGenerate = () => {
    if (ratedCount < MIN_RATINGS) {
      setValidationError(
        `Please rate at least ${MIN_RATINGS} movies before generating recommendations (${ratedCount} of ${MIN_RATINGS} rated so far).`
      );
      return;
    }
    setValidationError('');
    const result = predictForNewUser(userRatings, algorithm, 6);
    setGeneratedResult({
      ...result,
      snapshotCount: ratedCount,
    });
  };

  const handleAlgorithmChange = (newAlgo) => {
    setAlgorithm(newAlgo);
    // If results are already shown and ratings are valid, refresh live
    if (generatedResult && ratedCount >= MIN_RATINGS) {
      const result = predictForNewUser(userRatings, newAlgo, 6);
      setGeneratedResult({
        ...result,
        snapshotCount: ratedCount,
      });
    }
  };

  const handleReset = () => {
    setUserRatings({});
    setGeneratedResult(null);
    setValidationError('');
  };

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#1E3A5F]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
            Rate &amp; Predict Live
          </h1>
          <p className="text-sm text-[#CBD5E1] mt-1">
            Test the system as a new viewer. Rate at least 3 movies below and generate instant personalized recommendations.
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

      {/* Controls & Action Bar */}
      <section
        data-tour-id="sandbox-controls"
        className="rounded-xl bg-[#132743] border border-[#1E3A5F] p-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm font-semibold text-[#F8FAFC]">
                Your Rating Progress:
              </span>
              <span className="font-mono text-sm font-semibold text-[#38BDF8] tabular-nums">
                {ratedCount} / {MIN_RATINGS} minimum rated
              </span>
              {isReady && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#93C5FD]">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Ready to predict
                </span>
              )}
            </div>
            <p className="text-xs text-[#CBD5E1]">
              Tip: Rate both movies you love (4–5 stars) and movies you dislike (1–2 stars) for sharper predictions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="sandbox-algo-select" className="sr-only">
              Select prediction algorithm
            </label>
            <select
              id="sandbox-algo-select"
              value={algorithm}
              onChange={(e) => handleAlgorithmChange(e.target.value)}
              className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] px-3 py-2.5 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#38BDF8]"
            >
              <option value={ALGORITHMS.USER_BASED}>User-Based CF</option>
              <option value={ALGORITHMS.ITEM_BASED}>Item-Based CF</option>
              <option value={ALGORITHMS.MATRIX_FACTORIZATION}>
                Matrix Factorization (SVD)
              </option>
            </select>

            <button
              type="button"
              onClick={handleReset}
              disabled={ratedCount === 0 && !generatedResult}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-[#1E3A5F] bg-[#0B192C] text-sm font-medium text-[#CBD5E1] hover:text-[#F8FAFC] hover:border-[#38BDF8] disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#38BDF8] text-[#0B192C] text-sm font-semibold hover:bg-[#7DD3FC] transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Generate My Predictions</span>
            </button>
          </div>
        </div>

        {validationError && (
          <div
            role="alert"
            className="mt-4 rounded-lg bg-[#0B192C] border border-[#38BDF8] px-4 py-3 text-sm text-[#F8FAFC] flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
            <span>{validationError}</span>
          </div>
        )}
      </section>

      {/* Main Split: Left Rating List + Right Taste Profile & Live Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Popular Movies Star Rating List */}
        <section
          data-tour-id="sandbox-rating-list"
          className="lg:col-span-6 rounded-xl bg-[#132743] border border-[#1E3A5F] p-5"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-semibold text-[#F8FAFC]">
              1. Rate Popular Movies
            </h2>
            <span className="text-xs text-[#CBD5E1]">Click 1 to 5 stars</span>
          </div>

          <div className="divide-y divide-[#1E3A5F]">
            {sandboxMovies.map((movie) => {
              const currentRating = userRatings[movie.id] || 0;
              return (
                <div
                  key={movie.id}
                  className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#F8FAFC] truncate">
                      {movie.title}
                    </div>
                    <div className="text-xs text-[#CBD5E1]">
                      {movie.year} · {movie.genres.join(' / ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="flex items-center gap-0.5"
                      role="group"
                      aria-label={`Rate ${movie.title}`}
                    >
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const isFilled = starValue <= currentRating;
                        return (
                          <motion.button
                            key={starValue}
                            type="button"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.82 }}
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 20,
                            }}
                            onClick={() => handleSetRating(movie.id, starValue)}
                            aria-label={`Rate ${movie.title} ${starValue} out of 5 stars`}
                            aria-pressed={currentRating === starValue}
                            className="p-1.5 rounded-md hover:bg-[#1E3A5F] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                          >
                            <Star
                              className={`w-4 h-4 transition-colors ${
                                isFilled
                                  ? 'text-[#38BDF8] fill-[#38BDF8]'
                                  : 'text-[#64748B]'
                              }`}
                            />
                          </motion.button>
                        );
                      })}
                    </div>

                    <span className="font-mono text-xs w-10 text-right tabular-nums text-[#93C5FD]">
                      {currentRating > 0 ? `${currentRating}.0★` : '—'}
                    </span>

                    {currentRating > 0 && (
                      <button
                        type="button"
                        onClick={() => handleClearMovieRating(movie.id)}
                        aria-label={`Clear rating for ${movie.title}`}
                        className="text-xs text-[#CBD5E1] hover:text-[#F8FAFC] underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Live Genre Taste Profile + Personalized Recommendations */}
        <div className="lg:col-span-6 space-y-6">
          {/* Your Live Genre Taste Profile */}
          <section
            data-tour-id="sandbox-genre-profile"
            className="rounded-xl bg-[#132743] border border-[#1E3A5F] p-5"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-base font-semibold text-[#F8FAFC] flex items-center gap-2">
                <BarChart3
                  className="w-4 h-4 text-[#38BDF8]"
                  aria-hidden="true"
                />
                <span>Your Live Genre Taste Profile</span>
              </h2>
              <span className="font-mono text-xs text-[#93C5FD] tabular-nums">
                {genreProfile.length}{' '}
                {genreProfile.length === 1 ? 'genre' : 'genres'} tracked
              </span>
            </div>
            <p className="text-xs text-[#CBD5E1] mb-4">
              Updates instantly with every star click to visualize your emerging taste pattern across movie genres.
            </p>

            {genreProfile.length === 0 ? (
              <div className="rounded-lg bg-[#0B192C] border border-dashed border-[#1E3A5F] px-4 py-6 text-center">
                <p className="text-xs sm:text-sm text-[#CBD5E1]">
                  Click stars on any movie to the left to watch your live genre affinity bars build in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {genreProfile.slice(0, 7).map((item) => {
                  const barColor =
                    item.affinityPct >= 75
                      ? 'bg-[#38BDF8]'
                      : item.affinityPct >= 50
                      ? 'bg-[#93C5FD]'
                      : 'bg-[#64748B]';
                  return (
                    <div key={item.genre} className="space-y-1">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-[#F8FAFC]">
                            {item.genre}
                          </span>
                          <span className="text-[#CBD5E1] text-[11px] tabular-nums">
                            ({item.avgStars.toFixed(1)}★ avg · {item.count}{' '}
                            {item.count === 1 ? 'film' : 'films'})
                          </span>
                        </div>
                        <span className="font-mono font-semibold text-[#38BDF8] tabular-nums shrink-0">
                          {item.affinityPct}%
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-[#0B192C] border border-[#1E3A5F]/70 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.affinityPct}%` }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className={`h-full rounded-full ${barColor}`}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2.5 border-t border-[#1E3A5F] text-xs text-[#CBD5E1]">
                  <span className="text-[#93C5FD] font-medium">
                    Strongest Taste Signal:{' '}
                  </span>
                  <span className="text-[#F8FAFC] font-medium">
                    {genreProfile
                      .slice(0, 2)
                      .map((g) => `${g.genre} (${g.affinityPct}%)`)
                      .join(' · ')}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Live Personalized Predictions Output */}
          <section
            data-tour-id="sandbox-results"
            className="rounded-xl bg-[#132743] border border-[#1E3A5F] p-5"
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-semibold text-[#F8FAFC]">
                2. Your Personalized Recommendations
              </h2>
              {generatedResult && (
                <span className="font-mono text-xs text-[#38BDF8] tabular-nums">
                  Based on {generatedResult.snapshotCount} ratings
                </span>
              )}
            </div>

            {!generatedResult ? (
              <div className="rounded-lg bg-[#0B192C] border border-dashed border-[#1E3A5F] p-8 text-center">
                <Sparkles
                  className="w-8 h-8 text-[#38BDF8] mx-auto mb-3"
                  aria-hidden="true"
                />
                <h3 className="text-base font-semibold text-[#F8FAFC] mb-1.5">
                  No Predictions Generated Yet
                </h3>
                <p className="text-sm text-[#CBD5E1] max-w-md mx-auto leading-relaxed">
                  Rate at least {MIN_RATINGS} movies on the left, then click{' '}
                  <strong className="text-[#F8FAFC]">
                    Generate My Predictions
                  </strong>{' '}
                  to see what Collaborative Filtering recommends specifically for your taste.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Closest Taste Neighbors Summary */}
                {generatedResult.neighbors.length > 0 && (
                  <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-3.5">
                    <div className="text-xs font-semibold text-[#93C5FD] mb-2">
                      Your Closest Match in the Dataset
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#F8FAFC] font-medium">
                        {generatedResult.neighbors[0].label}
                      </span>
                      <span className="font-mono font-semibold text-[#38BDF8] tabular-nums whitespace-nowrap">
                        {generatedResult.neighbors[0].similarityPct}% match
                      </span>
                    </div>
                    <p className="text-xs text-[#CBD5E1] mt-1">
                      {generatedResult.neighbors[0].detail}
                    </p>
                  </div>
                )}

                {/* Top 6 Predicted Movies */}
                <div className="space-y-3">
                  {generatedResult.recommendations.map((rec, idx) => (
                    <motion.article
                      key={`${algorithm}-${rec.movie.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: idx * 0.04 }}
                      className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] hover:border-[#38BDF8]/70 transition-colors p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div>
                          <h3 className="text-sm font-semibold text-[#F8FAFC]">
                            {idx + 1}. {rec.movie.title}
                          </h3>
                          <p className="text-xs text-[#93C5FD]">
                            {rec.movie.year} · {rec.movie.genres.join(' / ')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono text-sm font-semibold text-[#38BDF8] tabular-nums">
                            {rec.predictedRating.toFixed(1)} / 5.0 ★
                          </div>
                          <div className="font-mono text-xs text-[#CBD5E1] tabular-nums">
                            {rec.matchScore}% Match
                          </div>
                        </div>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-[#132743] overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${rec.matchScore}%` }}
                          transition={{ duration: 0.35, delay: idx * 0.04 }}
                          className="h-full bg-[#38BDF8] rounded-full"
                        />
                      </div>

                      <p className="text-xs text-[#CBD5E1] leading-relaxed">
                        {rec.explanation}
                      </p>
                    </motion.article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <DemoTour
        steps={TOUR_STEPS}
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </div>
  );
}
