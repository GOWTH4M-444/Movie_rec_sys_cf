'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import LandingPage from '@/src/components/LandingPage';
import Navbar from '@/src/components/Navbar';
import RecommendationsTab from '@/src/components/RecommendationsTab';
import LiveSandboxTab from '@/src/components/LiveSandboxTab';
import CatalogMatrixTab from '@/src/components/CatalogMatrixTab';
import HowItWorksTab from '@/src/components/HowItWorksTab';
import MovieDetailModal from '@/src/components/MovieDetailModal';

export default function HomePage() {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [detailMovieId, setDetailMovieId] = useState<string | null>(null);
  const [highlightedMovieId, setHighlightedMovieId] = useState<string | null>(null);

  // Allow ?autostart=1 query param to jump directly into the main application
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const rafId = window.requestAnimationFrame(() => {
        setHasLaunched(true);
      });
      return () => window.cancelAnimationFrame(rafId);
    }
    return undefined;
  }, []);

  const handleLaunch = () => {
    setHasLaunched(true);
    setActiveTab('recommendations');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleGoHome = () => {
    setHasLaunched(false);
    setDetailMovieId(null);
    setHighlightedMovieId(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSelectMovieDetail = (movieId: string) => {
    setDetailMovieId(movieId);
  };

  const handleHighlightInMatrix = (movieId: string) => {
    setDetailMovieId(null);
    setHighlightedMovieId(movieId);
    setActiveTab('catalog');
  };

  if (!hasLaunched) {
    return <LandingPage onLaunch={handleLaunch} />;
  }

  return (
    <div className="min-h-screen bg-[#0B192C] text-[#F8FAFC] flex flex-col">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onGoHome={handleGoHome}
        onSelectMovieDetail={handleSelectMovieDetail}
        onHighlightInMatrix={handleHighlightInMatrix}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === 'recommendations' && <RecommendationsTab />}
          {activeTab === 'sandbox' && <LiveSandboxTab />}
          {activeTab === 'catalog' && (
            <CatalogMatrixTab
              highlightedMovieId={highlightedMovieId}
              onClearHighlight={() => setHighlightedMovieId(null)}
              onSelectMovieDetail={handleSelectMovieDetail}
            />
          )}
          {activeTab === 'how-it-works' && <HowItWorksTab />}
        </motion.div>
      </main>

      <MovieDetailModal
        movieId={detailMovieId}
        onClose={() => setDetailMovieId(null)}
        onHighlightInMatrix={handleHighlightInMatrix}
        onSelectMovieDetail={handleSelectMovieDetail}
      />
    </div>
  );
}
