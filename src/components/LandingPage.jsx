'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ArrowDown,
  Star,
  Users,
  Sparkles,
  Film,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { MOVIES, USERS } from '../data/movieDataset.js';
import Recommendation3DModel from './Recommendation3DModel.jsx';

/**
 * Smooth Animated Stat Counter
 * Counts smoothly from 0 to target value when scrolled into view.
 */
function AnimatedCounter({ target, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const elRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const node = elRef.current;
    if (!node) return undefined;

    const runAnimation = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const durationMs = 750;
      const startTime = performance.now();

      const step = (now) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(eased * target));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    if (typeof IntersectionObserver === 'undefined') {
      const rafId = window.requestAnimationFrame(runAnimation);
      return () => window.cancelAnimationFrame(rafId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={elRef} className="font-mono text-2xl sm:text-3xl font-semibold text-[#38BDF8] tabular-nums">
      {displayValue}
      {suffix}
    </span>
  );
}

const WORKFLOW_STEPS = [
  {
    number: '01',
    icon: Star,
    title: 'Step 1: Learn From Past Ratings',
    description:
      'Every viewer builds a simple taste history by rating movies from 1 to 5 stars — no manual movie tags or plot keywords needed.',
    example: 'Example: You rate Inception (5★) and Interstellar (5★), while rating Paddington 2 (2★).',
  },
  {
    number: '02',
    icon: Users,
    title: 'Step 2: Find Taste Neighbors',
    description:
      'Cosine Similarity compares rating patterns across all users and movies to find viewers or films that behave just like yours.',
    example: 'Example: User 7 and User 11 share an 89% taste match with your past ratings.',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Step 3: Predict Unwatched Favorites',
    description:
      'Similarity-weighted math estimates the exact star rating you would give every unwatched movie and ranks your best matches first.',
    example: 'Example: Predicted 4.8★ for Parasite — 95% Match before you ever press play.',
  },
];

const ALGORITHM_CARDS = [
  {
    icon: Users,
    badge: 'Neighborhood Similarity',
    title: 'User-Based Collaborative Filtering',
    quote: '“People who rated past movies like you also loved these unwatched films.”',
    bestWhen: 'Best used when you want transparent, easy-to-explain recommendations anchored to real taste twins.',
    detail: 'Calculates mean-centered Cosine Similarity between viewer rating profiles and averages neighbor scores.',
  },
  {
    icon: Film,
    badge: 'Item-to-Item Patterns',
    title: 'Item-Based Collaborative Filtering',
    quote: '“Because you loved Inception and Interstellar, audiences like you also rated this highly.”',
    bestWhen: 'Best used when a catalog has steady movies and new viewers are joining every day.',
    detail: 'Measures similarity between movie rating columns so each suggestion ties directly to a film you enjoyed.',
  },
  {
    icon: Layers,
    badge: 'Lowest Test Error (SVD)',
    title: 'Matrix Factorization (SVD)',
    quote: '“Let’s uncover the hidden mood, pacing, and storytelling traits behind every star rating.”',
    bestWhen: 'Best used when ratings are sparse and you want the highest overall prediction accuracy (lowest RMSE).',
    detail: 'Learns compact latent taste factors via gradient descent to predict missing cells across the entire matrix.',
  },
];

/**
 * Multi-Section Storytelling Landing Page
 *
 * Strictly free of the main application tab bar / sidebar.
 * Features Split Hero with interactive Three.js 3D Similarity Network,
 * 3-step visual workflow, deep-dive algorithm cards, animated dataset counters,
 * and clear Launch Recommendation System CTAs.
 */
export default function LandingPage({ onLaunch }) {
  const handleSmoothScroll = () => {
    const el = document.getElementById('how-it-works-steps');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="min-h-screen bg-[#0B192C] text-[#F8FAFC]">
      <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16 space-y-20">
        {/* SECTION A — SPLIT HERO WITH INTERACTIVE THREE.JS 3D NETWORK */}
        <section
          aria-label="Hero introduction"
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center"
        >
          {/* Left Column: Title, Plain-English Overview & Dual CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-block px-3.5 py-1.5 rounded-md border border-[#1E3A5F] bg-[#132743] text-[#93C5FD] text-xs sm:text-sm font-medium">
              Machine Learning Project • Collaborative Filtering
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#F8FAFC] leading-[1.14]">
              Movie Recommendation System Using Collaborative Filtering
            </h1>

            <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed">
              This interactive platform predicts which movies a viewer will enjoy by learning from
              shared rating habits across similar audiences. Compare three genuine machine learning
              algorithms, rate movies live as a new user, and inspect the exact math behind every score.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={onLaunch}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#38BDF8] text-[#0B192C] text-sm sm:text-base font-semibold hover:bg-[#7DD3FC] active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B192C] focus-visible:ring-[#38BDF8] whitespace-nowrap"
              >
                <span>Launch Recommendation System</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleSmoothScroll}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#132743] border border-[#1E3A5F] text-[#F8FAFC] text-sm sm:text-base font-medium hover:border-[#38BDF8] hover:text-[#38BDF8] transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Explore How It Works</span>
                <ArrowDown className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </motion.div>

          {/* Right Column: Interactive Three.js 3D Collaborative Filtering Network */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-3"
          >
            <Recommendation3DModel />
            <p className="text-xs sm:text-sm text-[#CBD5E1] text-center leading-relaxed px-2">
              <strong className="text-[#F8FAFC] font-medium">
                3D Collaborative Filtering Similarity Network:
              </strong>{' '}
              Light signals flow from the Active Viewer through Similar Users to predict unwatched Recommended Movies.
            </p>
          </motion.div>
        </section>

        {/* SECTION B — HOW RECOMMENDATIONS WORK IN 3 SIMPLE STEPS */}
        <section
          id="how-it-works-steps"
          aria-label="How recommendations work in 3 simple steps"
          className="scroll-mt-10 pt-4 border-t border-[#1E3A5F]"
        >
          <div className="max-w-2xl mb-8">
            <p className="text-xs font-semibold text-[#38BDF8] mb-1.5">
              Visual Workflow
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
              How Recommendations Work in 3 Simple Steps
            </h2>
            <p className="text-sm sm:text-base text-[#CBD5E1] mt-2 leading-relaxed">
              Every recommendation in this app follows a transparent three-step pipeline that anyone can follow in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WORKFLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.28, delay: idx * 0.06 }}
                  className="rounded-xl bg-[#132743] border border-[#1E3A5F] hover:border-[#38BDF8]/70 p-6 flex flex-col justify-between transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#0B192C] border border-[#1E3A5F] flex items-center justify-center text-[#38BDF8]">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#93C5FD] tabular-nums">
                        Step {step.number} of 03
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#CBD5E1] leading-relaxed mb-4">
                      {step.description}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] px-3.5 py-2.5 text-xs text-[#93C5FD] leading-relaxed">
                    {step.example}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* SECTION C — DEEP-DIVE ALGORITHM CARDS */}
        <section
          aria-label="Collaborative filtering algorithms overview"
          className="pt-4 border-t border-[#1E3A5F]"
        >
          <div className="max-w-2xl mb-8">
            <p className="text-xs font-semibold text-[#38BDF8] mb-1.5">
              Three Real Machine Learning Models
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
              Compare How Each Algorithm Thinks
            </h2>
            <p className="text-sm sm:text-base text-[#CBD5E1] mt-2 leading-relaxed">
              Inside the app, you can switch between all three models on the same viewer profile to compare their predictions live.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {ALGORITHM_CARDS.map((algo, idx) => {
              const Icon = algo.icon;
              return (
                <motion.article
                  key={algo.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.28, delay: idx * 0.06 }}
                  className="rounded-xl bg-[#132743] border border-[#1E3A5F] hover:border-[#38BDF8]/70 p-6 flex flex-col justify-between transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#0B192C] border border-[#1E3A5F] flex items-center justify-center text-[#38BDF8] shrink-0">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <span className="font-mono text-[11px] font-medium text-[#93C5FD] text-right">
                        {algo.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2.5">
                      {algo.title}
                    </h3>

                    <div className="rounded-lg bg-[#0B192C] border border-[#1E3A5F] p-3.5 mb-4">
                      <span className="block text-[11px] font-semibold text-[#38BDF8] mb-1">
                        How it thinks
                      </span>
                      <p className="text-sm text-[#F8FAFC] italic leading-relaxed">
                        {algo.quote}
                      </p>
                    </div>

                    <p className="text-sm text-[#CBD5E1] leading-relaxed mb-4">
                      {algo.detail}
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-[#1E3A5F] text-xs text-[#CBD5E1] flex items-start gap-2 leading-relaxed">
                    <CheckCircle2
                      className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{algo.bestWhen}</span>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* SECTION D — LIVE DATASET SUMMARY & BOTTOM LAUNCH BANNER */}
        <section
          aria-label="Dataset summary and launch"
          className="space-y-6 pt-4 border-t border-[#1E3A5F]"
        >
          {/* Animated 4-Stat Summary Bar */}
          <div className="rounded-xl bg-[#132743] border border-[#1E3A5F] px-6 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-[#1E3A5F]">
              <div className="flex flex-col items-center text-center">
                <AnimatedCounter target={MOVIES.length} />
                <span className="text-sm text-[#CBD5E1] mt-1">Curated Movies</span>
              </div>
              <div className="flex flex-col items-center text-center pt-4 lg:pt-0 lg:pl-6">
                <AnimatedCounter target={USERS.length} />
                <span className="text-sm text-[#CBD5E1] mt-1">Sample User Profiles</span>
              </div>
              <div className="flex flex-col items-center text-center pt-4 lg:pt-0 lg:pl-6">
                <AnimatedCounter target={3} />
                <span className="text-sm text-[#CBD5E1] mt-1">
                  Collaborative Filtering Models
                </span>
              </div>
              <div className="flex flex-col items-center text-center pt-4 lg:pt-0 lg:pl-6">
                <span className="font-mono text-2xl sm:text-3xl font-semibold text-[#38BDF8]">
                  Real-Time
                </span>
                <span className="text-sm text-[#CBD5E1] mt-1">Rating Predictions</span>
              </div>
            </div>
          </div>

          {/* Bottom Call-to-Action Banner */}
          <div className="rounded-xl bg-[#132743] border border-[#38BDF8]/60 p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold text-[#F8FAFC] mb-2">
                Ready to Explore Live Movie Predictions?
              </h2>
              <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
                Launch the workspace to compare all three algorithms, rate movies in the live sandbox, inspect the User-Item Rating Matrix, or follow the built-in interactive Demo Tours.
              </p>
            </div>

            <button
              type="button"
              onClick={onLaunch}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-[#38BDF8] text-[#0B192C] text-base font-semibold hover:bg-[#7DD3FC] active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#132743] focus-visible:ring-[#38BDF8]"
            >
              <span>Launch Recommendation System</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
