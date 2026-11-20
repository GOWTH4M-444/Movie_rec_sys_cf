'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Users,
  Film,
  Layers,
  ArrowRight,
  BarChart3,
  Calculator,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import {
  cosineSimilarity,
  evaluateModels,
} from '../ml/collaborativeFiltering.js';
import DemoTour from './DemoTour.jsx';

const TOUR_STEPS = [
  {
    targetId: 'guide-model-diagram',
    title: 'Compare All Three ML Approaches',
    description:
      'Use this side-by-side diagram to explain User-Based CF, Item-Based CF, and Matrix Factorization (SVD) in simple everyday language during a demo or presentation.',
  },
  {
    targetId: 'guide-cosine-example',
    title: 'Try the Interactive Cosine Similarity Example',
    description:
      'Adjust Viewer B’s ratings on three example movies and watch the Cosine Similarity percentage update live. Notice how matching highs and lows creates a high similarity score.',
  },
  {
    targetId: 'guide-accuracy-table',
    title: 'Review Real Accuracy Metrics (RMSE & MAE)',
    description:
      'Compare actual prediction error across all three models computed on a held-out 20% test split of our dataset. Lower numbers mean predictions stay closer to real user ratings.',
  },
  {
    targetId: 'guide-quick-reference',
    title: 'Presenter Quick-Reference Accordion',
    description:
      'Need to answer Q&A questions during a presentation? Open any topic here for crisp, everyday definitions of Cold Start, Matrix Sparsity, Cosine Similarity, and RMSE vs. MAE.',
  },
];

const EXAMPLE_MOVIES = [
  { id: 'inception', title: 'Inception' },
  { id: 'interstellar', title: 'Interstellar' },
  { id: 'toy_story', title: 'Toy Story' },
];

const VIEWER_A_RATINGS = { inception: 5, interstellar: 5, toy_story: 2 };

const PRESENTER_CONCEPTS = [
  {
    id: 'cold-start',
    term: 'Cold Start Problem',
    subtitle: 'What happens when a brand-new viewer or movie has zero ratings?',
    plainEnglish:
      'Collaborative Filtering relies on past ratings to find taste neighbors. When a brand-new user signs up with zero watch history (or a brand-new movie releases with zero reviews), the model has no overlapping ratings to compare yet.',
    inThisApp:
      'Our "Rate & Predict Live" tab solves User Cold Start immediately by asking a new viewer to rate just 3 familiar movies—giving the models enough signal to fold them into the taste space right away.',
  },
  {
    id: 'matrix-sparsity',
    term: 'Matrix Sparsity',
    subtitle: 'Why most cells in a User-Movie rating table are empty',
    plainEnglish:
      'Even an avid movie fan only watches a tiny percentage of every film ever made. That means a table of Users × Movies is mostly blank spaces—often 70% to 99% empty. Scientists call this a "sparse matrix."',
    inThisApp:
      'In our 20 × 44 dataset (880 cells), ~29.5% of cells are known ratings and ~70.5% are empty. Collaborative Filtering specializes in filling those missing cells accurately without needing full histories.',
  },
  {
    id: 'cosine-similarity',
    term: 'Cosine Similarity',
    subtitle: 'Measuring taste direction instead of raw rating count',
    plainEnglish:
      'Imagine plotting two viewers’ ratings as arrows in space. Cosine Similarity measures the angle between those two arrows. If both viewers rate Sci-Fi high and Comedies low, their arrows point in the same direction (near 100%)—even if one viewer tends to be a slightly stricter critic.',
    inThisApp:
      'We apply mean-centered Cosine Similarity with overlap confidence weighting so that two viewers who agree on 6 shared movies are trusted more than two viewers who only share 1 movie.',
  },
  {
    id: 'rmse-vs-mae',
    term: 'RMSE vs. MAE',
    subtitle: 'Two ways to score how close predictions are to reality',
    plainEnglish:
      'MAE (Mean Absolute Error) is the straightforward average miss in stars—for example, 0.35 MAE means predictions are typically within a third of a star of the real score. RMSE (Root Mean Squared Error) squares errors before averaging, so it penalizes occasional huge misses much more harshly.',
    inThisApp:
      'Reporting both metrics on a held-out 20% test split proves our models are not only accurate on average (low MAE) but also avoid embarrassing wild guesses (low RMSE).',
  },
];

export default function HowItWorksTab() {
  const [viewerBRatings, setViewerBRatings] = useState({
    inception: 5,
    interstellar: 4,
    toy_story: 2,
  });
  const [openConceptId, setOpenConceptId] = useState(PRESENTER_CONCEPTS[0].id);
  const [tourOpen, setTourOpen] = useState(false);

  const metrics = useMemo(() => evaluateModels(), []);

  const workedExample = useMemo(() => {
    const { similarity } = cosineSimilarity(VIEWER_A_RATINGS, viewerBRatings, {
      minOverlap: 1,
      meanCentered: false,
    });
    const dot =
      VIEWER_A_RATINGS.inception * viewerBRatings.inception +
      VIEWER_A_RATINGS.interstellar * viewerBRatings.interstellar +
      VIEWER_A_RATINGS.toy_story * viewerBRatings.toy_story;
    const normA = Math.sqrt(5 * 5 + 5 * 5 + 2 * 2);
    const normB = Math.sqrt(
      viewerBRatings.inception ** 2 +
        viewerBRatings.interstellar ** 2 +
        viewerBRatings.toy_story ** 2
    );
    return {
      dot,
      normA,
      normB,
      similarity,
      pct: Math.round(similarity * 100),
    };
  }, [viewerBRatings]);

  const lowestRmse = Math.min(...metrics.models.map((m) => m.rmse));

  const modelCards = [
    {
      icon: Users,
      title: 'User-Based Collaborative Filtering',
      tagline: '“People like you also liked...”',
      step1: 'Find viewers whose past star ratings closely match yours.',
      step2: 'Check which unwatched movies those similar viewers rated highest.',
      step3: 'Combine their ratings into a weighted score (closer matches count more).',
    },
    {
      icon: Film,
      title: 'Item-Based Collaborative Filtering',
      tagline: '“Because you watched X...”',
      step1: 'Compare movies based on how all viewers rated them.',
      step2: 'Identify movies that consistently receive similar scores from the same people.',
      step3: 'Recommend unwatched movies that closely match your highest-rated favorites.',
    },
    {
      icon: Layers,
      title: 'Matrix Factorization (SVD)',
      tagline: '“Finding hidden taste patterns”',
      step1: 'Compress the rating table into hidden taste traits (such as mood or pacing).',
      step2: 'Learn a compact numeric profile for every viewer and every movie.',
      step3: 'Multiply viewer and movie profiles to predict missing ratings accurately.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#1E3A5F]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
            How It Works
          </h1>
          <p className="text-sm text-[#CBD5E1] mt-1">
            A plain-English visual guide to Collaborative Filtering, Cosine Similarity, and model accuracy.
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

      {/* 1. Visual Diagram Comparing the 3 Algorithms */}
      <section data-tour-id="guide-model-diagram">
        <h2 className="text-xl font-semibold text-[#F8FAFC] mb-1">
          Three Ways to Predict Your Next Movie
        </h2>
        <p className="text-sm text-[#CBD5E1] mb-5">
          All three methods rely only on user star ratings — no manual movie tags or plot keywords required.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {modelCards.map((card, cardIdx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: cardIdx * 0.06 }}
                className="rounded-xl bg-[#132743] border border-[#1E3A5F] hover:border-[#38BDF8]/60 transition-colors p-5 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0B192C] border border-[#1E3A5F] flex items-center justify-center text-[#38BDF8] shrink-0">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#F8FAFC] leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#93C5FD] font-medium">
                      {card.tagline}
                    </p>
                  </div>
                </div>

                {/* Simple 3-step visual flow */}
                <ol className="space-y-2.5 mt-2 flex-1">
                  {[card.step1, card.step2, card.step3].map((stepText, idx) => (
                    <li
                      key={stepText}
                      className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-3 text-xs text-[#CBD5E1] leading-relaxed flex items-start gap-2.5"
                    >
                      <span className="font-mono text-[#38BDF8] font-semibold shrink-0">
                        0{idx + 1}
                      </span>
                      <span>{stepText}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 2. Plain-English Cosine Similarity Worked Example */}
      <section
        data-tour-id="guide-cosine-example"
        className="rounded-xl bg-[#132743] border border-[#1E3A5F] p-6"
      >
        <div className="flex items-center gap-2.5 mb-2">
          <Calculator className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-[#F8FAFC]">
            How Cosine Similarity Measures Shared Taste
          </h2>
        </div>
        <p className="text-sm text-[#CBD5E1] leading-relaxed max-w-3xl mb-6">
          Cosine Similarity compares two viewers&apos; ratings as arrows pointing in space.
          If two viewers give high stars to the same movies and low stars to the same movies,
          their arrows point in nearly the same direction — giving a score close to{' '}
          <strong className="text-[#F8FAFC]">100%</strong>. Try changing Viewer B&apos;s stars below:
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Interactive Ratings Comparison Table */}
          <div className="lg:col-span-7 overflow-x-auto rounded-lg border border-[#1E3A5F]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B192C] border-b border-[#1E3A5F] text-xs font-semibold text-[#93C5FD]">
                  <th className="py-3 px-4">Movie</th>
                  <th className="py-3 px-4 text-center">Viewer A (Fixed)</th>
                  <th className="py-3 px-4 text-center">Viewer B (Try Adjusting)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A5F] text-sm">
                {EXAMPLE_MOVIES.map((movie) => (
                  <tr key={movie.id} className="bg-[#0B192C]/40">
                    <td className="py-3 px-4 font-medium text-[#F8FAFC]">
                      {movie.title}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[#CBD5E1] tabular-nums">
                      {VIEWER_A_RATINGS[movie.id]}.0 ★
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setViewerBRatings((prev) => ({
                                ...prev,
                                [movie.id]: val,
                              }))
                            }
                            aria-label={`Set Viewer B rating for ${movie.title} to ${val} stars`}
                            className={`w-7 h-7 rounded font-mono text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
                              viewerBRatings[movie.id] === val
                                ? 'bg-[#38BDF8] text-[#0B192C]'
                                : 'bg-[#0B192C] text-[#CBD5E1] border border-[#1E3A5F] hover:border-[#38BDF8]'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Worked Output Box */}
          <div className="lg:col-span-5 rounded-xl bg-[#0B192C] border border-[#1E3A5F] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#93C5FD]">
                Calculated Cosine Similarity
              </span>
              <span className="font-mono text-2xl font-bold text-[#38BDF8] tabular-nums">
                {workedExample.pct}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-[#1E3A5F] overflow-hidden">
              <motion.div
                animate={{ width: `${workedExample.pct}%` }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="h-full bg-[#38BDF8] rounded-full"
              />
            </div>

            <div className="pt-2 border-t border-[#1E3A5F] space-y-1.5 font-mono text-xs text-[#CBD5E1] tabular-nums">
              <div className="flex items-center justify-between">
                <span>1. Multiply &amp; Add (Dot Product):</span>
                <span className="text-[#F8FAFC]">{workedExample.dot}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. Scale by Rating Lengths:</span>
                <span className="text-[#F8FAFC]">
                  {workedExample.normA.toFixed(2)} × {workedExample.normB.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[#93C5FD]">
                <span className="inline-flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  Final Score:
                </span>
                <span className="font-semibold text-[#38BDF8]">
                  {workedExample.similarity.toFixed(3)} ({workedExample.pct}%)
                </span>
              </div>
            </div>

            <p className="text-xs text-[#CBD5E1] leading-relaxed pt-1">
              {workedExample.pct >= 95
                ? 'Very strong agreement: Viewer A and Viewer B share almost identical movie preferences.'
                : workedExample.pct >= 80
                ? 'Good agreement: these viewers enjoy many of the same movies.'
                : 'Different tastes: the model gives Viewer B much less influence when predicting for Viewer A.'}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Model Accuracy Comparison Table (Real RMSE & MAE) */}
      <section
        data-tour-id="guide-accuracy-table"
        className="rounded-xl bg-[#132743] border border-[#1E3A5F] p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-[#F8FAFC]">
              Model Accuracy Comparison (RMSE &amp; MAE)
            </h2>
          </div>
          <span className="font-mono text-xs text-[#93C5FD] tabular-nums">
            Tested on {metrics.testSamples} held-out ratings (80/20 split)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-3.5 text-xs text-[#CBD5E1] leading-relaxed">
            <strong className="text-[#F8FAFC] block mb-0.5">
              What is RMSE (Root Mean Squared Error)?
            </strong>
            Measures average prediction error in stars while penalizing larger misses more heavily.{' '}
            <span className="text-[#38BDF8]">Lower is better.</span>
          </div>
          <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-3.5 text-xs text-[#CBD5E1] leading-relaxed">
            <strong className="text-[#F8FAFC] block mb-0.5">
              What is MAE (Mean Absolute Error)?
            </strong>
            Measures the simple average star difference between predicted and actual ratings (e.g., 0.35 means off by about a third of a star).{' '}
            <span className="text-[#38BDF8]">Lower is better.</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#1E3A5F]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B192C] border-b border-[#1E3A5F] text-xs font-semibold text-[#93C5FD]">
                <th className="py-3.5 px-4">Algorithm</th>
                <th className="py-3.5 px-4 text-right">RMSE (Lower = Better)</th>
                <th className="py-3.5 px-4 text-right">MAE (Lower = Better)</th>
                <th className="py-3.5 px-4">Why Use This Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A5F] text-sm">
              {metrics.models.map((model) => {
                const isBest = model.rmse === lowestRmse;
                return (
                  <tr
                    key={model.id}
                    className={
                      isBest ? 'bg-[#0F2440]/80' : 'hover:bg-[#0B192C]/40'
                    }
                  >
                    <td className="py-3.5 px-4 font-semibold text-[#F8FAFC]">
                      <span>{model.name}</span>
                      {isBest && (
                        <span className="block text-xs font-medium text-[#38BDF8] mt-0.5">
                          Lowest prediction error on test split
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#38BDF8] tabular-nums">
                      {model.rmse.toFixed(3)} ★
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#F8FAFC] tabular-nums">
                      {model.mae.toFixed(3)} ★
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#CBD5E1] leading-relaxed">
                      {model.strength}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Presenter Quick-Reference & Key ML Concepts Accordion */}
      <section
        data-tour-id="guide-quick-reference"
        className="rounded-xl bg-[#132743] border border-[#1E3A5F] p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-[#F8FAFC]">
              Presenter Quick-Reference &amp; Key ML Concepts
            </h2>
          </div>
          <span className="font-mono text-xs text-[#93C5FD]">
            4 Core Terms Explained Simply
          </span>
        </div>
        <p className="text-sm text-[#CBD5E1] mb-5">
          Click any concept below for a clear, non-technical explanation ready to share during a demo or Q&amp;A session.
        </p>

        <div className="space-y-3">
          {PRESENTER_CONCEPTS.map((concept) => {
            const isOpen = openConceptId === concept.id;
            return (
              <div
                key={concept.id}
                className={`rounded-lg bg-[#0B192C] border transition-colors overflow-hidden ${
                  isOpen ? 'border-[#38BDF8]/70' : 'border-[#1E3A5F]'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenConceptId((prev) =>
                      prev === concept.id ? null : concept.id
                    )
                  }
                  aria-expanded={isOpen}
                  className="w-full px-4 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-[#132743]/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#38BDF8]"
                >
                  <div>
                    <div className="text-sm sm:text-base font-semibold text-[#F8FAFC]">
                      {concept.term}
                    </div>
                    <div className="text-xs text-[#93C5FD] mt-0.5">
                      {concept.subtitle}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#38BDF8] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden border-t border-[#1E3A5F]"
                    >
                      <div className="px-4 py-4 space-y-3 text-xs sm:text-sm leading-relaxed">
                        <p className="text-[#CBD5E1]">{concept.plainEnglish}</p>
                        <div className="rounded-md bg-[#132743] border border-[#1E3A5F] px-3.5 py-2.5 text-xs text-[#CBD5E1]">
                          <span className="font-semibold text-[#38BDF8]">
                            How it shows up in this app:{' '}
                          </span>
                          <span>{concept.inThisApp}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      <DemoTour
        steps={TOUR_STEPS}
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </div>
  );
}
