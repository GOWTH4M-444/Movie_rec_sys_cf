'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

/**
 * Interactive Spotlight Demo Tour
 *
 * Highlights target sections (via `data-tour-id`) one step at a time with a
 * crisp Light Blue (#38BDF8) ring, dims surrounding content slightly, and
 * anchors a clean floating card near the highlighted element.
 */
export default function DemoTour({ steps = [], isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const cardRef = React.useRef(null);
  const [cardHeight, setCardHeight] = useState(268);

  const handleClose = useCallback(() => {
    setCurrentIndex(0);
    onClose();
  }, [onClose]);

  const activeStep = steps[currentIndex] || null;

  const measureTarget = useCallback(() => {
    if (!isOpen || !activeStep) {
      setTargetRect(null);
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setViewport({ width: vw, height: vh });

    if (cardRef.current) {
      const measuredH = cardRef.current.offsetHeight;
      if (measuredH > 0) setCardHeight(measuredH);
    }

    const el = document.querySelector(`[data-tour-id="${activeStep.targetId}"]`);
    if (!el) {
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
    });
  }, [isOpen, activeStep]);

  // Scroll highlighted element into comfortable view when step changes
  useEffect(() => {
    if (!isOpen || !activeStep) return;

    const el = document.querySelector(`[data-tour-id="${activeStep.targetId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Measure via rAF and again after smooth scroll settles
    const rafId = window.requestAnimationFrame(measureTarget);
    const t1 = window.setTimeout(measureTarget, 180);
    const t2 = window.setTimeout(measureTarget, 420);

    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [isOpen, activeStep, currentIndex, measureTarget]);

  // Keyboard Escape / Arrow support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < steps.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, steps.length, handleClose]);

  if (!isOpen || !activeStep) return null;

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  // Calculate smart anchored card position inside the viewport with zero clipping
  const cardWidth = Math.min(380, viewport.width - 32);
  const effectiveHeight = Math.max(cardHeight, 250);
  const pad = 20;

  let cardTop = Math.max(pad, (viewport.height - effectiveHeight) / 2);
  let cardLeft = Math.max(pad, (viewport.width - cardWidth) / 2);

  if (targetRect) {
    const spaceBelow = viewport.height - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const spaceRight = viewport.width - targetRect.right;
    const spaceLeft = targetRect.left;

    if (spaceBelow >= effectiveHeight + 24) {
      cardTop = targetRect.bottom + 16;
      const idealLeft = targetRect.left + targetRect.width / 2 - cardWidth / 2;
      cardLeft = Math.max(pad, Math.min(viewport.width - cardWidth - pad, idealLeft));
    } else if (spaceRight >= cardWidth + 28) {
      // Anchor beside tall left-column targets on desktop so nothing overlaps or clips
      cardLeft = targetRect.right + 18;
      const idealTop = targetRect.top + targetRect.height / 2 - effectiveHeight / 2;
      cardTop = Math.max(pad, Math.min(viewport.height - effectiveHeight - pad, idealTop));
    } else if (spaceLeft >= cardWidth + 28) {
      // Anchor beside tall right-column targets on desktop
      cardLeft = targetRect.left - cardWidth - 18;
      const idealTop = targetRect.top + targetRect.height / 2 - effectiveHeight / 2;
      cardTop = Math.max(pad, Math.min(viewport.height - effectiveHeight - pad, idealTop));
    } else if (spaceAbove >= effectiveHeight + 24) {
      cardTop = targetRect.top - effectiveHeight - 16;
      const idealLeft = targetRect.left + targetRect.width / 2 - cardWidth / 2;
      cardLeft = Math.max(pad, Math.min(viewport.width - cardWidth - pad, idealLeft));
    } else {
      cardTop = Math.max(pad, viewport.height - effectiveHeight - pad);
      cardLeft = Math.max(pad, (viewport.width - cardWidth) / 2);
    }
  }

  // Final safety clamp inside viewport bounds
  cardTop = Math.max(pad, Math.min(viewport.height - effectiveHeight - pad, cardTop));
  cardLeft = Math.max(pad, Math.min(viewport.width - cardWidth - pad, cardLeft));

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Demo Tour: ${activeStep.title}`}
    >
      {/* Click-outside backdrop */}
      <button
        type="button"
        aria-label="Close demo tour backdrop"
        onClick={handleClose}
        className="fixed inset-0 w-full h-full bg-transparent cursor-default"
      />

      {/* Spotlight Ring + Dimmed Surrounding Overlay */}
      {targetRect ? (
        <div
          aria-hidden="true"
          className="fixed rounded-xl pointer-events-none transition-all duration-200 ease-out"
          style={{
            top: Math.max(4, targetRect.top - 6),
            left: Math.max(4, targetRect.left - 6),
            width: Math.min(viewport.width - 8, targetRect.width + 12),
            height: Math.min(viewport.height - 8, targetRect.height + 12),
            boxShadow:
              '0 0 0 3px #38BDF8, 0 0 0 9999px rgba(6, 15, 29, 0.72)',
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-[#060F1D]/75 pointer-events-none"
        />
      )}

      {/* Anchored Floating Tour Card */}
      <div
        ref={cardRef}
        className="fixed z-10 rounded-xl bg-[#132743] border-2 border-[#38BDF8] shadow-2xl p-5 text-[#F8FAFC] transition-all duration-200 ease-out"
        style={{
          top: cardTop,
          left: cardLeft,
          width: cardWidth,
        }}
      >
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <span className="font-mono text-xs font-semibold text-[#38BDF8] tabular-nums">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close demo tour"
            className="p-1.5 rounded-md text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#1E3A5F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-base font-semibold text-[#F8FAFC] mb-2">
          {activeStep.title}
        </h3>
        <p className="text-sm text-[#CBD5E1] leading-relaxed mb-5">
          {activeStep.description}
        </p>

        {/* Step progress bar */}
        <div className="flex items-center gap-1.5 mb-4" aria-hidden="true">
          {steps.map((s, idx) => (
            <div
              key={s.targetId}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx <= currentIndex ? 'bg-[#38BDF8]' : 'bg-[#1E3A5F]'
              }`}
            />
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={isFirst}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#1E3A5F] text-[#CBD5E1] hover:text-[#F8FAFC] hover:border-[#38BDF8] disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-2 text-xs font-medium rounded-lg text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#1E3A5F]/60 transition-colors whitespace-nowrap"
              >
                Finish Tour
              </button>
            )}

            {isLast ? (
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#38BDF8] text-[#0B192C] hover:bg-[#7DD3FC] transition-colors whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Finish Tour
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(steps.length - 1, prev + 1))
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#38BDF8] text-[#0B192C] hover:bg-[#7DD3FC] transition-colors whitespace-nowrap"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
