'use client';

import React, { useState } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import GlobalMovieSearch from './GlobalMovieSearch.jsx';

export const TABS = [
  { id: 'recommendations', label: 'Get Recommendations' },
  { id: 'sandbox', label: 'Rate & Predict Live' },
  { id: 'catalog', label: 'Catalog & Matrix' },
  { id: 'how-it-works', label: 'How It Works' },
];

/**
 * Clean Main Application Top Navigation Bar
 *
 * Displayed once the user clicks "Launch Recommendation System".
 * Contains "← Home", project title, global movie search, and 4 single-line tabs.
 */
export default function Navbar({
  activeTab,
  onSelectTab,
  onGoHome,
  onSelectMovieDetail,
  onHighlightInMatrix,
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleMobileDetail = (movieId) => {
    setMobileSearchOpen(false);
    onSelectMovieDetail(movieId);
  };

  const handleMobileHighlight = (movieId) => {
    setMobileSearchOpen(false);
    onHighlightInMatrix(movieId);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0B192C]/95 backdrop-blur-sm border-b border-[#1E3A5F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Left Zone: Back to Home + Project Title */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E3A5F] bg-[#132743] text-xs sm:text-sm font-medium text-[#CBD5E1] hover:text-[#F8FAFC] hover:border-[#38BDF8] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Home</span>
            </button>

            <span className="font-display text-sm sm:text-base font-semibold text-[#F8FAFC] truncate max-w-[170px] sm:max-w-[230px] lg:max-w-[250px] xl:max-w-none whitespace-nowrap">
              Movie Recommendation System
            </span>
          </div>

          {/* Center Zone: 4 Main Navigation Tabs (Desktop) */}
          <nav
            aria-label="Main navigation"
            className="hidden lg:flex items-center gap-1.5 shrink-0"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                    isActive
                      ? 'bg-[#38BDF8] text-[#0B192C] font-semibold'
                      : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#132743]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Zone: Global Movie Search (Desktop) + Toggle Button (Mobile/Tablet) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:block w-[220px] xl:w-[260px]">
              <GlobalMovieSearch
                onSelectMovieDetail={onSelectMovieDetail}
                onHighlightInMatrix={onHighlightInMatrix}
              />
            </div>

            <button
              type="button"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              aria-label={mobileSearchOpen ? 'Close movie search' : 'Open movie search'}
              aria-expanded={mobileSearchOpen}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg border border-[#1E3A5F] bg-[#132743] text-[#38BDF8] hover:border-[#38BDF8] transition-colors cursor-pointer"
            >
              {mobileSearchOpen ? (
                <X className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Search className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Mobile Global Search Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-2.5">
            <GlobalMovieSearch
              compact
              onSelectMovieDetail={handleMobileDetail}
              onHighlightInMatrix={handleMobileHighlight}
            />
          </div>
        )}

        {/* Mobile/Tablet Tab Strip */}
        <nav
          aria-label="Mobile navigation"
          className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-2.5 -mx-1 px-1"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#38BDF8] text-[#0B192C] font-semibold'
                    : 'bg-[#132743] text-[#CBD5E1] border border-[#1E3A5F]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

