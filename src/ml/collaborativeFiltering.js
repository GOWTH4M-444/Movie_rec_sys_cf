/**
 * Collaborative Filtering Machine Learning Engine
 *
 * Implements three genuine in-browser recommendation algorithms:
 *  1. User-Based Collaborative Filtering (Cosine Similarity + Weighted Mean)
 *  2. Item-Based Collaborative Filtering (Movie Vector Cosine Similarity)
 *  3. Matrix Factorization (SVD-style Latent Factors trained via SGD)
 *
 * Plus a deterministic hold-out evaluation module calculating real RMSE & MAE.
 */

import { MOVIES, USERS } from '../data/movieDataset.js';

export const ALGORITHMS = {
  USER_BASED: 'user-based',
  ITEM_BASED: 'item-based',
  MATRIX_FACTORIZATION: 'matrix-factorization',
};

/**
 * Clamp a predicted rating cleanly within the valid [1.0, 5.0] star range.
 * @param {number} value
 * @returns {number}
 */
export function clampRating(value) {
  if (!Number.isFinite(value)) return 3.0;
  return Math.max(1.0, Math.min(5.0, value));
}

/**
 * Compute the average rating given by a user.
 * @param {Record<string, number>} ratingsMap
 * @returns {number}
 */
export function getUserMean(ratingsMap) {
  const values = Object.values(ratingsMap);
  if (values.length === 0) return 3.5;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

/**
 * Compute true Cosine Similarity between two sparse rating maps.
 * Uses co-rated dimensions (or full shared space when requested).
 * Returns a value in [0, 1] for non-negative rating vectors (1 = identical taste).
 *
 * @param {Record<string, number>} mapA
 * @param {Record<string, number>} mapB
 * @param {{ minOverlap?: number, meanCentered?: boolean }} [options]
 * @returns {{ similarity: number, overlapCount: number }}
 */
export function cosineSimilarity(mapA, mapB, options = {}) {
  const { minOverlap = 1, meanCentered = false } = options;
  const sharedKeys = Object.keys(mapA).filter((key) => mapB[key] !== undefined);
  const overlapCount = sharedKeys.length;

  if (overlapCount < minOverlap) {
    return { similarity: 0, overlapCount };
  }

  const meanA = meanCentered ? getUserMean(mapA) : 0;
  const meanB = meanCentered ? getUserMean(mapB) : 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key of sharedKeys) {
    const a = mapA[key] - meanA;
    const b = mapB[key] - meanB;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    // If both vectors are constant and equal (e.g. both gave 5.0 to same items), treat as aligned
    if (meanCentered && overlapCount >= minOverlap) {
      let rawDot = 0;
      let rawNormA = 0;
      let rawNormB = 0;
      for (const key of sharedKeys) {
        rawDot += mapA[key] * mapB[key];
        rawNormA += mapA[key] * mapA[key];
        rawNormB += mapB[key] * mapB[key];
      }
      if (rawNormA === 0 || rawNormB === 0) return { similarity: 0, overlapCount };
      return { similarity: rawDot / (Math.sqrt(rawNormA) * Math.sqrt(rawNormB)), overlapCount };
    }
    return { similarity: 0, overlapCount };
  }

  const rawSimilarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return { similarity: rawSimilarity, overlapCount };
}

/**
 * Convert a predicted rating (1.0 - 5.0) into an intuitive Match Score percentage (0 - 99%).
 * @param {number} predictedRating
 * @returns {number}
 */
export function ratingToMatchScore(predictedRating) {
  const clamped = clampRating(predictedRating);
  return Math.min(99, Math.max(20, Math.round((clamped / 5.0) * 100)));
}

/**
 * Build a movie-to-user ratings lookup table: { [movieId]: { [userId]: rating } }
 * @param {Array<{ id: string, ratings: Record<string, number> }>} usersList
 * @returns {Record<string, Record<string, number>>}
 */
export function buildItemRatingVectors(usersList) {
  const itemVectors = {};
  for (const movie of MOVIES) {
    itemVectors[movie.id] = {};
  }
  for (const user of usersList) {
    for (const [movieId, rating] of Object.entries(user.ratings)) {
      if (!itemVectors[movieId]) itemVectors[movieId] = {};
      itemVectors[movieId][user.id] = rating;
    }
  }
  return itemVectors;
}

/**
 * 1. User-Based Collaborative Filtering
 *
 * Finds users with the most similar rating history (via mean-centered Cosine Similarity
 * with overlap confidence weighting) and computes similarity-weighted predicted ratings.
 *
 * @param {Record<string, number>} targetRatings
 * @param {{ excludeUserId?: string | null, topN?: number, usersList?: typeof USERS, moviesList?: typeof MOVIES }} [options]
 */
export function getUserBasedRecommendations(targetRatings, options = {}) {
  const {
    excludeUserId = null,
    topN = 6,
    usersList = USERS,
    moviesList = MOVIES,
  } = options;

  const targetMean = getUserMean(targetRatings);
  const candidateUsers = usersList.filter((u) => u.id !== excludeUserId);

  // Compute similarity between target user and every other user
  const similarities = candidateUsers
    .map((other) => {
      const { similarity: centeredSim, overlapCount } = cosineSimilarity(
        targetRatings,
        other.ratings,
        { minOverlap: 1, meanCentered: true }
      );
      const { similarity: rawCosine } = cosineSimilarity(
        targetRatings,
        other.ratings,
        { minOverlap: 1, meanCentered: false }
      );

      // Smooth overlap confidence so users sharing more co-rated movies earn higher trust
      const confidence = overlapCount / (overlapCount + 1.5);
      const blendedScore = Math.max(0, centeredSim) * confidence;
      const displaySimilarity = Math.max(
        0,
        Math.min(0.97, (0.68 * Math.max(0, centeredSim) + 0.32 * rawCosine) * (0.45 + 0.55 * confidence))
      );

      return {
        user: other,
        weight: blendedScore,
        rawCosine,
        displaySimilarity,
        overlapCount,
        mean: getUserMean(other.ratings),
      };
    })
    .filter((entry) => entry.overlapCount > 0)
    .sort((a, b) => b.displaySimilarity - a.displaySimilarity);

  const positiveNeighbors = similarities.filter((s) => s.weight > 0.05);
  const activeNeighbors = positiveNeighbors.length > 0 ? positiveNeighbors : similarities.slice(0, 5);

  // Predict rating for every movie the target user has NOT rated yet
  const unratedMovies = moviesList.filter((m) => targetRatings[m.id] === undefined);

  const predictions = unratedMovies.map((movie) => {
    let weightedSum = 0;
    let totalWeight = 0;
    let bestSupporter = null;

    for (const neighbor of activeNeighbors) {
      const neighborRating = neighbor.user.ratings[movie.id];
      if (neighborRating !== undefined && neighbor.weight > 0) {
        weightedSum += neighbor.weight * (neighborRating - neighbor.mean);
        totalWeight += Math.abs(neighbor.weight);

        if (
          !bestSupporter ||
          neighbor.displaySimilarity * neighborRating >
            bestSupporter.displaySimilarity * bestSupporter.rating
        ) {
          bestSupporter = {
            name: neighbor.user.shortName || neighbor.user.name,
            fullName: neighbor.user.name,
            displaySimilarity: neighbor.displaySimilarity,
            rating: neighborRating,
          };
        }
      }
    }

    // Bayesian support shrinkage rewards movies backed by multiple similar neighbors over 1-neighbor outliers
    let predicted;
    if (totalWeight > 0) {
      const shrinkage = 0.65;
      predicted = clampRating(targetMean + weightedSum / (totalWeight + shrinkage));
    } else {
      const allMovieRatings = candidateUsers
        .map((u) => u.ratings[movie.id])
        .filter((r) => r !== undefined);
      const movieAvg =
        allMovieRatings.length > 0
          ? allMovieRatings.reduce((a, b) => a + b, 0) / allMovieRatings.length
          : targetMean;
      predicted = clampRating(movieAvg);
    }

    const roundedPred = Math.round(predicted * 10) / 10;
    const matchScore = ratingToMatchScore(predicted);

    const explanation = bestSupporter
      ? `Recommended because viewers with ${Math.round(
          bestSupporter.displaySimilarity * 100
        )}% similar taste rated this ${bestSupporter.rating.toFixed(1)}★`
      : `Recommended based on overall community ratings (${roundedPred.toFixed(1)}★ average)`;

    return {
      movie,
      predictedRating: roundedPred,
      rawPredicted: predicted,
      matchScore,
      explanation,
      supporter: bestSupporter,
    };
  });

  predictions.sort((a, b) => b.rawPredicted - a.rawPredicted || b.matchScore - a.matchScore);

  const topNeighbors = similarities.slice(0, 3).map((n) => ({
    id: n.user.id,
    label: n.user.name,
    shortLabel: n.user.shortName,
    detail: n.user.persona,
    similarityPct: Math.round(n.displaySimilarity * 100),
    overlapCount: n.overlapCount,
  }));

  return {
    algorithm: ALGORITHMS.USER_BASED,
    recommendations: predictions.slice(0, topN),
    allPredictionsMap: Object.fromEntries(
      predictions.map((p) => [p.movie.id, p.predictedRating])
    ),
    neighbors: topNeighbors,
    neighborType: 'users',
  };
}

/**
 * 2. Item-Based Collaborative Filtering
 *
 * Calculates Cosine Similarity between movie rating vectors across all users.
 * Predicts how much the target user will enjoy each unrated movie based on how
 * similarly it is rated compared to movies they already watched and loved.
 *
 * @param {Record<string, number>} targetRatings
 * @param {{ excludeUserId?: string | null, topN?: number, usersList?: typeof USERS, moviesList?: typeof MOVIES }} [options]
 */
export function getItemBasedRecommendations(targetRatings, options = {}) {
  const {
    excludeUserId = null,
    topN = 6,
    usersList = USERS,
    moviesList = MOVIES,
  } = options;

  const baseUsers = usersList.filter((u) => u.id !== excludeUserId);
  const itemVectors = buildItemRatingVectors(baseUsers);
  const ratedMovieIds = Object.keys(targetRatings);
  const movieLookup = Object.fromEntries(moviesList.map((m) => [m.id, m]));
  const unratedMovies = moviesList.filter((m) => targetRatings[m.id] === undefined);

  const movieMean = (movieId) => {
    const vals = Object.values(itemVectors[movieId] || {});
    if (vals.length === 0) return 3.5;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  // Collect best item-to-item matches to highlight in the Neighbor Comparison Panel
  const itemMatchPairs = [];

  const predictions = unratedMovies.map((candidate) => {
    const candidateVec = itemVectors[candidate.id] || {};
    const candidateMean = movieMean(candidate.id);
    let weightedSum = 0;
    let totalWeight = 0;
    let bestRelated = null;

    for (const ratedId of ratedMovieIds) {
      const ratedVec = itemVectors[ratedId] || {};
      const { similarity: centeredSim, overlapCount } = cosineSimilarity(
        candidateVec,
        ratedVec,
        { minOverlap: 2, meanCentered: true }
      );
      const { similarity: rawCos } = cosineSimilarity(
        candidateVec,
        ratedVec,
        { minOverlap: 2, meanCentered: false }
      );

      if (overlapCount >= 2 && centeredSim > 0.05) {
        const confidence = Math.min(1, overlapCount / 4);
        const weight = centeredSim * confidence;
        const displaySim = Math.min(
          0.99,
          Math.max(0.1, (0.6 * centeredSim + 0.4 * rawCos) * confidence)
        );
        const ratedMean = movieMean(ratedId);
        const userRating = targetRatings[ratedId];

        weightedSum += weight * (userRating - ratedMean);
        totalWeight += Math.abs(weight);

        if (
          !bestRelated ||
          displaySim * userRating > bestRelated.displaySim * bestRelated.userRating
        ) {
          bestRelated = {
            sourceMovie: movieLookup[ratedId],
            targetMovie: candidate,
            displaySim,
            userRating,
            overlapCount,
          };
        }
      }
    }

    const predicted =
      totalWeight > 0
        ? clampRating(candidateMean + weightedSum / totalWeight)
        : clampRating(candidateMean);

    const roundedPred = Math.round(predicted * 10) / 10;
    const matchScore = ratingToMatchScore(predicted);

    if (bestRelated && bestRelated.sourceMovie) {
      itemMatchPairs.push({
        id: `${bestRelated.sourceMovie.id}-${candidate.id}`,
        label: `${candidate.title}`,
        shortLabel: candidate.title,
        detail: `Similar to "${bestRelated.sourceMovie.title}" (which you rated ${bestRelated.userRating.toFixed(
          1
        )}★)`,
        similarityPct: Math.round(bestRelated.displaySim * 100),
        overlapCount: bestRelated.overlapCount,
        predictedRating: predicted,
      });
    }

    const explanation =
      bestRelated && bestRelated.sourceMovie
        ? `Because you rated "${bestRelated.sourceMovie.title}" ${bestRelated.userRating.toFixed(
            1
          )}★ (${Math.round(bestRelated.displaySim * 100)}% similar audience ratings)`
        : `Matches popular movies in your favorite genres (${roundedPred.toFixed(1)}★ predicted)`;

    return {
      movie: candidate,
      predictedRating: roundedPred,
      rawPredicted: predicted,
      matchScore,
      explanation,
      relatedMovie: bestRelated?.sourceMovie?.title || null,
    };
  });

  predictions.sort((a, b) => b.rawPredicted - a.rawPredicted || b.matchScore - a.matchScore);

  // Pick top 3 distinct item-similarity pairs anchored to top predicted movies
  itemMatchPairs.sort(
    (a, b) => b.similarityPct * 0.6 + b.predictedRating * 8 - (a.similarityPct * 0.6 + a.predictedRating * 8)
  );

  return {
    algorithm: ALGORITHMS.ITEM_BASED,
    recommendations: predictions.slice(0, topN),
    allPredictionsMap: Object.fromEntries(
      predictions.map((p) => [p.movie.id, p.predictedRating])
    ),
    neighbors: itemMatchPairs.slice(0, 3),
    neighborType: 'movies',
  };
}

/**
 * Deterministic Pseudo-Random Number Generator (Mulberry32)
 * Guarantees reproducible Matrix Factorization weights on every run.
 */
function createSeededRng(seed = 42) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Train a Matrix Factorization (SVD-style) latent factor model using
 * Stochastic Gradient Descent (SGD) with user & item bias terms and L2 regularization.
 *
 * Model: r_hat(u, i) = globalMean + userBias[u] + itemBias[i] + dot(P[u], Q[i])
 *
 * @param {Array<{ id: string, ratings: Record<string, number> }>} usersList
 * @param {typeof MOVIES} moviesList
 * @param {{ numFactors?: number, epochs?: number, lr?: number, reg?: number, seed?: number }} [config]
 */
export function trainMatrixFactorization(usersList, moviesList, config = {}) {
  const {
    numFactors = 2,
    epochs = 220,
    lr = 0.015,
    reg = 0.06,
    seed = 2025,
  } = config;

  const rng = createSeededRng(seed);
  const userIds = usersList.map((u) => u.id);
  const movieIds = moviesList.map((m) => m.id);

  // Gather all observed (user, movie, rating) triplets
  const observations = [];
  let ratingSum = 0;
  for (const user of usersList) {
    for (const [movieId, rating] of Object.entries(user.ratings)) {
      observations.push({ userId: user.id, movieId, rating });
      ratingSum += rating;
    }
  }

  const globalMean = observations.length > 0 ? ratingSum / observations.length : 3.5;

  // Initialize latent factor vectors P (users) and Q (movies), plus biases
  const P = {};
  const userBias = {};
  for (const uid of userIds) {
    P[uid] = Array.from({ length: numFactors }, () => (rng() - 0.5) * 0.16);
    userBias[uid] = 0;
  }

  const Q = {};
  const itemBias = {};
  for (const mid of movieIds) {
    Q[mid] = Array.from({ length: numFactors }, () => (rng() - 0.5) * 0.16);
    itemBias[mid] = 0;
  }

  // Iterative SGD optimization with deterministic Fisher-Yates shuffle each epoch
  const order = observations.map((_, i) => i);
  for (let epoch = 0; epoch < epochs; epoch++) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }

    const stepLr = lr / (1 + 0.004 * epoch);
    for (let pos = 0; pos < order.length; pos++) {
      const { userId, movieId, rating } = observations[order[pos]];
      const pu = P[userId];
      const qi = Q[movieId];
      if (!pu || !qi) continue;

      let dot = 0;
      for (let k = 0; k < numFactors; k++) {
        dot += pu[k] * qi[k];
      }

      const pred = globalMean + userBias[userId] + itemBias[movieId] + dot;
      const err = rating - pred;

      // Update biases
      userBias[userId] += stepLr * (err - reg * 0.5 * userBias[userId]);
      itemBias[movieId] += stepLr * (err - reg * 0.5 * itemBias[movieId]);

      // Update latent vectors
      for (let k = 0; k < numFactors; k++) {
        const puk = pu[k];
        const qik = qi[k];
        pu[k] += stepLr * (err * qik - reg * puk);
        qi[k] += stepLr * (err * puk - reg * qik);
      }
    }
  }

  /**
   * Predict rating for any known userId + movieId
   */
  function predictKnown(userId, movieId) {
    const pu = P[userId];
    const qi = Q[movieId];
    if (!pu || !qi) return clampRating(globalMean);
    let dot = 0;
    for (let k = 0; k < numFactors; k++) {
      dot += pu[k] * qi[k];
    }
    return clampRating(globalMean + userBias[userId] + itemBias[movieId] + dot);
  }

  /**
   * Fold-in a brand-new user (from the Live Sandbox) by solving for their
   * latent vector p_new and bias via fast gradient descent on their submitted ratings,
   * while holding movie vectors Q fixed.
   */
  function foldInNewUser(newRatings) {
    const pNew = Array.from({ length: numFactors }, () => 0);
    let bNew = 0;
    const entries = Object.entries(newRatings).filter(([mid]) => Q[mid] !== undefined);
    const foldLr = 0.04;
    const foldReg = 0.1;

    for (let iter = 0; iter < 120; iter++) {
      for (const [mid, rating] of entries) {
        const qi = Q[mid];
        let dot = 0;
        for (let k = 0; k < numFactors; k++) dot += pNew[k] * qi[k];
        const pred = globalMean + bNew + itemBias[mid] + dot;
        const err = rating - pred;
        bNew += foldLr * (err - foldReg * bNew);
        for (let k = 0; k < numFactors; k++) {
          pNew[k] += foldLr * (err * qi[k] - foldReg * pNew[k]);
        }
      }
    }

    return { pNew, bNew };
  }

  return { globalMean, P, Q, userBias, itemBias, numFactors, predictKnown, foldInNewUser };
}

// Cache the trained default SVD model for instant zero-latency UI interaction
let cachedDefaultSVD = null;
export function getDefaultSVDModel() {
  if (!cachedDefaultSVD) {
    cachedDefaultSVD = trainMatrixFactorization(USERS, MOVIES);
  }
  return cachedDefaultSVD;
}

/**
 * Helper: Cosine similarity between two dense numeric arrays (latent factor vectors)
 */
function denseCosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 3. Matrix Factorization (SVD) Recommendations
 *
 * Uses learned hidden taste factors (latent vectors) to predict ratings for unrated movies.
 * Supports both existing dataset users and brand-new Live Sandbox users via fold-in.
 */
export function getMatrixFactorizationRecommendations(targetRatings, options = {}) {
  const {
    userId = null,
    topN = 6,
    usersList = USERS,
    moviesList = MOVIES,
    model = null,
  } = options;

  const svd = model || (usersList === USERS && moviesList === MOVIES ? getDefaultSVDModel() : trainMatrixFactorization(usersList, moviesList));

  let userVec;
  let uBias;
  if (userId && svd.P[userId]) {
    userVec = svd.P[userId];
    uBias = svd.userBias[userId];
  } else {
    const folded = svd.foldInNewUser(targetRatings);
    userVec = folded.pNew;
    uBias = folded.bNew;
  }

  const unratedMovies = moviesList.filter((m) => targetRatings[m.id] === undefined);

  const predictions = unratedMovies.map((movie) => {
    const qi = svd.Q[movie.id];
    let dot = 0;
    if (qi) {
      for (let k = 0; k < svd.numFactors; k++) {
        dot += userVec[k] * qi[k];
      }
    }
    const predicted = clampRating(svd.globalMean + uBias + (svd.itemBias[movie.id] || 0) + dot);
    const roundedPred = Math.round(predicted * 10) / 10;
    const matchScore = ratingToMatchScore(predicted);

    const alignmentPct = qi
      ? Math.max(52, Math.min(99, Math.round(((denseCosineSimilarity(userVec, qi) + 1) / 2) * 100)))
      : matchScore;

    const genreSummary = movie.genres.join(' & ');
    const explanation = `Hidden taste patterns align ${alignmentPct}% with your preference for ${genreSummary} stories`;

    return {
      movie,
      predictedRating: roundedPred,
      rawPredicted: predicted,
      matchScore,
      explanation,
      alignmentPct,
    };
  });

  predictions.sort((a, b) => b.rawPredicted - a.rawPredicted || b.matchScore - a.matchScore);

  // Compute top 3 closest users in latent taste space for the Neighbor Comparison Panel
  const latentNeighbors = usersList
    .filter((u) => u.id !== userId)
    .map((other) => {
      const otherVec = svd.P[other.id];
      const rawSim = otherVec ? denseCosineSimilarity(userVec, otherVec) : 0;
      const similarityPct = Math.max(10, Math.min(99, Math.round(((rawSim + 1) / 2) * 100)));
      const overlapCount = Object.keys(targetRatings).filter(
        (mid) => other.ratings[mid] !== undefined
      ).length;
      return {
        id: other.id,
        label: other.name,
        shortLabel: other.shortName,
        detail: `${other.persona} (matched in latent taste space)`,
        similarityPct,
        overlapCount,
      };
    })
    .sort((a, b) => b.similarityPct - a.similarityPct)
    .slice(0, 3);

  return {
    algorithm: ALGORITHMS.MATRIX_FACTORIZATION,
    recommendations: predictions.slice(0, topN),
    allPredictionsMap: Object.fromEntries(
      predictions.map((p) => [p.movie.id, p.predictedRating])
    ),
    neighbors: latentNeighbors,
    neighborType: 'latent-users',
  };
}

/**
 * Unified Recommendation Dispatcher for any existing user profile.
 */
export function getRecommendationsForUser(userId, algorithm = ALGORITHMS.USER_BASED, topN = 6) {
  const user = USERS.find((u) => u.id === userId) || USERS[0];
  if (algorithm === ALGORITHMS.ITEM_BASED) {
    return getItemBasedRecommendations(user.ratings, { excludeUserId: user.id, topN });
  }
  if (algorithm === ALGORITHMS.MATRIX_FACTORIZATION) {
    return getMatrixFactorizationRecommendations(user.ratings, { userId: user.id, topN });
  }
  return getUserBasedRecommendations(user.ratings, { excludeUserId: user.id, topN });
}

/**
 * Unified Recommendation Dispatcher for a brand-new user in the Live Sandbox.
 */
export function predictForNewUser(customRatings, algorithm = ALGORITHMS.USER_BASED, topN = 6) {
  if (algorithm === ALGORITHMS.ITEM_BASED) {
    return getItemBasedRecommendations(customRatings, { excludeUserId: null, topN });
  }
  if (algorithm === ALGORITHMS.MATRIX_FACTORIZATION) {
    return getMatrixFactorizationRecommendations(customRatings, { userId: null, topN });
  }
  return getUserBasedRecommendations(customRatings, { excludeUserId: null, topN });
}

/**
 * Genuine Deterministic Hold-Out Evaluation (80% Train / 20% Test Split)
 *
 * Masks every 5th observed rating across the dataset, trains / runs all three
 * Collaborative Filtering models strictly on the remaining 80%, and computes
 * real RMSE (Root Mean Squared Error) and MAE (Mean Absolute Error).
 */
let cachedMetrics = null;
export function evaluateModels() {
  if (cachedMetrics) return cachedMetrics;

  const trainUsers = [];
  const testSet = [];
  let counter = 0;

  for (const user of USERS) {
    const trainRatings = {};
    for (const [movieId, rating] of Object.entries(user.ratings)) {
      counter += 1;
      if (counter % 5 === 0) {
        testSet.push({ userId: user.id, movieId, actual: rating });
      } else {
        trainRatings[movieId] = rating;
      }
    }
    trainUsers.push({ ...user, ratings: trainRatings });
  }

  const trainUserMap = Object.fromEntries(trainUsers.map((u) => [u.id, u]));

  // Train SVD exclusively on the 80% training split
  const evalSVD = trainMatrixFactorization(trainUsers, MOVIES, {
    numFactors: 2,
    epochs: 220,
    lr: 0.015,
    reg: 0.06,
    seed: 2025,
  });

  // Precompute User-Based and Item-Based predictions per training user
  const userBasedCache = {};
  const itemBasedCache = {};
  for (const u of trainUsers) {
    userBasedCache[u.id] = getUserBasedRecommendations(u.ratings, {
      excludeUserId: u.id,
      topN: MOVIES.length,
      usersList: trainUsers,
      moviesList: MOVIES,
    }).allPredictionsMap;

    itemBasedCache[u.id] = getItemBasedRecommendations(u.ratings, {
      excludeUserId: u.id,
      topN: MOVIES.length,
      usersList: trainUsers,
      moviesList: MOVIES,
    }).allPredictionsMap;
  }

  const calcStats = (predictFn) => {
    let sqErrSum = 0;
    let absErrSum = 0;
    for (const sample of testSet) {
      const pred = predictFn(sample.userId, sample.movieId);
      const diff = pred - sample.actual;
      sqErrSum += diff * diff;
      absErrSum += Math.abs(diff);
    }
    const rmse = Math.sqrt(sqErrSum / testSet.length);
    const mae = absErrSum / testSet.length;
    return {
      rmse: Number(rmse.toFixed(3)),
      mae: Number(mae.toFixed(3)),
    };
  };

  const userStats = calcStats(
    (uid, mid) => userBasedCache[uid]?.[mid] ?? getUserMean(trainUserMap[uid].ratings)
  );
  const itemStats = calcStats(
    (uid, mid) => itemBasedCache[uid]?.[mid] ?? getUserMean(trainUserMap[uid].ratings)
  );
  const svdStats = calcStats((uid, mid) => evalSVD.predictKnown(uid, mid));

  cachedMetrics = {
    testSamples: testSet.length,
    totalRatings: counter,
    models: [
      {
        id: ALGORITHMS.USER_BASED,
        name: 'User-Based Collaborative Filtering',
        shortName: 'User-Based CF',
        rmse: userStats.rmse,
        mae: userStats.mae,
        strength: 'Easy to explain by pointing directly to similar viewers.',
      },
      {
        id: ALGORITHMS.ITEM_BASED,
        name: 'Item-Based Collaborative Filtering',
        shortName: 'Item-Based CF',
        rmse: itemStats.rmse,
        mae: itemStats.mae,
        strength: 'Stable recommendations even as new users join the platform.',
      },
      {
        id: ALGORITHMS.MATRIX_FACTORIZATION,
        name: 'Matrix Factorization (SVD)',
        shortName: 'Matrix Factorization (SVD)',
        rmse: svdStats.rmse,
        mae: svdStats.mae,
        strength: 'Discovers hidden taste patterns across genres for the lowest prediction error.',
      },
    ],
  };

  return cachedMetrics;
}

/**
 * Compute full predicted matrix for the Catalog & Rating Matrix tab.
 * Returns { known: { [userId]: { [movieId]: number } }, predicted: { [userId]: { [movieId]: number } } }
 */
let cachedFullMatrix = null;
export function getFullRatingMatrixPredictions() {
  if (cachedFullMatrix) return cachedFullMatrix;
  const svd = getDefaultSVDModel();
  const predicted = {};

  for (const user of USERS) {
    predicted[user.id] = {};
    for (const movie of MOVIES) {
      if (user.ratings[movie.id] === undefined) {
        predicted[user.id][movie.id] = Math.round(svd.predictKnown(user.id, movie.id) * 10) / 10;
      }
    }
  }

  cachedFullMatrix = predicted;
  return cachedFullMatrix;
}

/**
 * Search movies across title, director, genres, and release year with relevance ranking.
 * Exact title prefix matches rank first, followed by title substring, then genre/director/year.
 *
 * @param {string} query
 * @param {number} [limit=8]
 */
export function searchMovies(query, limit = 8) {
  const trimmed = (query || '').trim().toLowerCase();
  if (!trimmed) return [];

  const scored = [];
  for (const movie of MOVIES) {
    const titleLower = movie.title.toLowerCase();
    const directorLower = movie.director.toLowerCase();
    const yearStr = String(movie.year);
    const genresLower = movie.genres.map((g) => g.toLowerCase());

    let rank = 0;
    if (titleLower === trimmed) {
      rank = 100;
    } else if (titleLower.startsWith(trimmed)) {
      rank = 85;
    } else if (titleLower.includes(trimmed)) {
      rank = 70;
    } else if (genresLower.some((g) => g.startsWith(trimmed))) {
      rank = 55;
    } else if (directorLower.includes(trimmed) || genresLower.some((g) => g.includes(trimmed))) {
      rank = 45;
    } else if (yearStr.includes(trimmed)) {
      rank = 35;
    }

    if (rank > 0) {
      // Compute community rating for quick display in search results
      let sum = 0;
      let count = 0;
      for (const u of USERS) {
        const r = u.ratings[movie.id];
        if (r !== undefined) {
          sum += r;
          count += 1;
        }
      }
      scored.push({
        movie,
        rank,
        avgRating: count > 0 ? Number((sum / count).toFixed(2)) : 0,
        ratingCount: count,
      });
    }
  }

  scored.sort(
    (a, b) =>
      b.rank - a.rank ||
      b.avgRating - a.avgRating ||
      a.movie.title.localeCompare(b.movie.title)
  );

  return scored.slice(0, limit);
}

/**
 * Build detailed analytics for a single movie: known viewer ratings,
 * community average, average ML-predicted score for unrated viewers,
 * and top 3 most similar movies via Item-Based Cosine Similarity.
 *
 * @param {string} movieId
 */
export function getMovieInsights(movieId) {
  const movie = MOVIES.find((m) => m.id === movieId);
  if (!movie) return null;

  const predictedMatrix = getFullRatingMatrixPredictions();
  const knownRatings = [];
  let knownSum = 0;
  let predSum = 0;
  let predCount = 0;

  for (const user of USERS) {
    const rating = user.ratings[movie.id];
    if (rating !== undefined) {
      knownSum += rating;
      knownRatings.push({
        userId: user.id,
        shortName: user.shortName,
        name: user.name,
        persona: user.persona,
        rating,
      });
    } else {
      const pred = predictedMatrix[user.id]?.[movie.id];
      if (pred !== undefined) {
        predSum += pred;
        predCount += 1;
      }
    }
  }

  knownRatings.sort((a, b) => b.rating - a.rating || a.shortName.localeCompare(b.shortName));

  // Compute top 3 most similar movies using Item-Based Cosine Similarity
  const itemVectors = buildItemRatingVectors(USERS);
  const targetVec = itemVectors[movie.id] || {};

  const similarMovies = MOVIES.filter((m) => m.id !== movie.id)
    .map((other) => {
      const otherVec = itemVectors[other.id] || {};
      const { similarity: centeredSim, overlapCount } = cosineSimilarity(targetVec, otherVec, {
        minOverlap: 2,
        meanCentered: true,
      });
      const { similarity: rawCos } = cosineSimilarity(targetVec, otherVec, {
        minOverlap: 2,
        meanCentered: false,
      });
      if (overlapCount < 2) {
        return { movie: other, similarityPct: 0, overlapCount };
      }
      const confidence = overlapCount / (overlapCount + 2);
      const blended = Math.max(0, 0.6 * Math.max(0, centeredSim) + 0.4 * rawCos) * (0.45 + 0.55 * confidence);
      return {
        movie: other,
        similarityPct: Math.min(97, Math.round(blended * 100)),
        overlapCount,
      };
    })
    .filter((entry) => entry.similarityPct > 0)
    .sort((a, b) => b.similarityPct - a.similarityPct || b.overlapCount - a.overlapCount)
    .slice(0, 3);

  return {
    movie,
    avgRating: knownRatings.length > 0 ? Number((knownSum / knownRatings.length).toFixed(2)) : 0,
    ratingCount: knownRatings.length,
    unratedCount: predCount,
    avgPredictedRating: predCount > 0 ? Number((predSum / predCount).toFixed(2)) : 0,
    knownRatings,
    similarMovies,
  };
}

/**
 * Compute an exact, transparent step-by-step calculation breakdown for how a
 * predicted rating was produced for a given user, movie, and algorithm.
 *
 * @param {string} userId
 * @param {string} movieId
 * @param {string} algorithm
 */
export function getPredictionBreakdown(userId, movieId, algorithm = ALGORITHMS.USER_BASED) {
  const user = USERS.find((u) => u.id === userId) || USERS[0];
  const movie = MOVIES.find((m) => m.id === movieId);
  if (!movie) return null;

  const targetRatings = user.ratings;
  const targetMean = getUserMean(targetRatings);
  const candidateUsers = USERS.filter((u) => u.id !== user.id);

  if (algorithm === ALGORITHMS.USER_BASED) {
    const contributors = [];
    let weightedSum = 0;
    let totalWeight = 0;

    for (const other of candidateUsers) {
      const neighborRating = other.ratings[movie.id];
      if (neighborRating === undefined) continue;

      const { similarity: centeredSim, overlapCount } = cosineSimilarity(
        targetRatings,
        other.ratings,
        { minOverlap: 1, meanCentered: true }
      );
      const { similarity: rawCosine } = cosineSimilarity(
        targetRatings,
        other.ratings,
        { minOverlap: 1, meanCentered: false }
      );
      if (overlapCount === 0) continue;

      const confidence = overlapCount / (overlapCount + 1.5);
      const weight = Math.max(0, centeredSim) * confidence;
      const displaySimilarity = Math.max(
        0,
        Math.min(0.97, (0.68 * Math.max(0, centeredSim) + 0.32 * rawCosine) * (0.45 + 0.55 * confidence))
      );

      if (weight > 0.05) {
        const otherMean = getUserMean(other.ratings);
        const delta = neighborRating - otherMean;
        weightedSum += weight * delta;
        totalWeight += Math.abs(weight);

        contributors.push({
          id: other.id,
          label: other.name,
          shortLabel: other.shortName,
          rating: neighborRating,
          baseline: Number(otherMean.toFixed(2)),
          delta: Number(delta.toFixed(2)),
          similarityPct: Math.round(displaySimilarity * 100),
          weight: Number(weight.toFixed(3)),
          overlapCount,
        });
      }
    }

    contributors.sort((a, b) => b.weight - a.weight || b.rating - a.rating);
    const shrinkage = 0.65;
    const predicted =
      totalWeight > 0
        ? clampRating(targetMean + weightedSum / (totalWeight + shrinkage))
        : clampRating(targetMean);

    return {
      algorithm,
      movie,
      userShortName: user.shortName,
      baselineLabel: `${user.shortName}'s average rating`,
      baselineValue: Number(targetMean.toFixed(2)),
      weightedAdjustment: totalWeight > 0 ? Number((weightedSum / (totalWeight + shrinkage)).toFixed(2)) : 0,
      predictedRating: Math.round(predicted * 10) / 10,
      formulaSummary:
        totalWeight > 0
          ? `${targetMean.toFixed(2)} (viewer baseline) + ${(weightedSum / (totalWeight + shrinkage)).toFixed(2)} (similarity-weighted neighbor boost) = ${(Math.round(predicted * 10) / 10).toFixed(1)}★`
          : `Estimated from community average because no close neighbors rated this movie yet.`,
      contributors: contributors.slice(0, 5),
      contributorKind: 'neighbors',
    };
  }

  if (algorithm === ALGORITHMS.ITEM_BASED) {
    const itemVectors = buildItemRatingVectors(candidateUsers);
    const candidateVec = itemVectors[movie.id] || {};
    const movieMean = (mid) => {
      const vals = Object.values(itemVectors[mid] || {});
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 3.5;
    };

    const candidateMean = movieMean(movie.id);
    const movieLookup = Object.fromEntries(MOVIES.map((m) => [m.id, m]));
    const contributors = [];
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [ratedId, userRating] of Object.entries(targetRatings)) {
      const ratedVec = itemVectors[ratedId] || {};
      const { similarity: centeredSim, overlapCount } = cosineSimilarity(
        candidateVec,
        ratedVec,
        { minOverlap: 2, meanCentered: true }
      );
      const { similarity: rawCos } = cosineSimilarity(
        candidateVec,
        ratedVec,
        { minOverlap: 2, meanCentered: false }
      );

      if (overlapCount >= 2 && centeredSim > 0.05) {
        const confidence = Math.min(1, overlapCount / 4);
        const weight = centeredSim * confidence;
        const displaySim = Math.min(0.99, Math.max(0.1, (0.6 * centeredSim + 0.4 * rawCos) * confidence));
        const ratedMean = movieMean(ratedId);
        const delta = userRating - ratedMean;

        weightedSum += weight * delta;
        totalWeight += Math.abs(weight);

        const src = movieLookup[ratedId];
        if (src) {
          contributors.push({
            id: src.id,
            label: src.title,
            shortLabel: src.title,
            rating: userRating,
            baseline: Number(ratedMean.toFixed(2)),
            delta: Number(delta.toFixed(2)),
            similarityPct: Math.round(displaySim * 100),
            weight: Number(weight.toFixed(3)),
            overlapCount,
          });
        }
      }
    }

    contributors.sort((a, b) => b.weight - a.weight || b.rating - a.rating);
    const predicted =
      totalWeight > 0
        ? clampRating(candidateMean + weightedSum / totalWeight)
        : clampRating(candidateMean);
    const adjustment = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      algorithm,
      movie,
      userShortName: user.shortName,
      baselineLabel: `${movie.title}'s community average`,
      baselineValue: Number(candidateMean.toFixed(2)),
      weightedAdjustment: Number(adjustment.toFixed(2)),
      predictedRating: Math.round(predicted * 10) / 10,
      formulaSummary:
        totalWeight > 0
          ? `${candidateMean.toFixed(2)} (movie baseline) + ${adjustment.toFixed(2)} (weighted shift from similar movies you rated) = ${(Math.round(predicted * 10) / 10).toFixed(1)}★`
          : `Estimated from ${movie.title}'s community rating average (${candidateMean.toFixed(2)}★).`,
      contributors: contributors.slice(0, 5),
      contributorKind: 'movies',
    };
  }

  // Matrix Factorization (SVD)
  const svd = getDefaultSVDModel();
  const pu = svd.P[user.id] || [0, 0];
  const qi = svd.Q[movie.id] || [0, 0];
  const uBias = svd.userBias[user.id] || 0;
  const iBias = svd.itemBias[movie.id] || 0;

  let dot = 0;
  const factorTerms = [];
  for (let k = 0; k < svd.numFactors; k++) {
    const product = pu[k] * qi[k];
    dot += product;
    factorTerms.push({
      id: `factor-${k + 1}`,
      label: `Hidden Taste Factor #${k + 1}`,
      shortLabel: `Factor ${k + 1}`,
      userScore: Number(pu[k].toFixed(2)),
      movieScore: Number(qi[k].toFixed(2)),
      contribution: Number(product.toFixed(2)),
    });
  }

  const rawTotal = svd.globalMean + uBias + iBias + dot;
  const predicted = clampRating(rawTotal);

  return {
    algorithm,
    movie,
    userShortName: user.shortName,
    baselineLabel: 'Global dataset average',
    baselineValue: Number(svd.globalMean.toFixed(2)),
    userBias: Number(uBias.toFixed(2)),
    itemBias: Number(iBias.toFixed(2)),
    latentDot: Number(dot.toFixed(2)),
    weightedAdjustment: Number((uBias + iBias + dot).toFixed(2)),
    predictedRating: Math.round(predicted * 10) / 10,
    formulaSummary: `${svd.globalMean.toFixed(2)} (global avg) + ${uBias.toFixed(2)} (viewer bias) + ${iBias.toFixed(2)} (movie bias) + ${dot.toFixed(2)} (latent taste match) = ${(Math.round(predicted * 10) / 10).toFixed(1)}★`,
    contributors: factorTerms,
    contributorKind: 'factors',
  };
}

/**
 * Compute a live Genre Taste Profile from a user's submitted star ratings.
 * Returns genres sorted by affinity percentage (0-100%) for the Live Sandbox chart.
 *
 * @param {Record<string, number>} ratingsMap
 */
export function computeGenreAffinityProfile(ratingsMap) {
  const movieLookup = Object.fromEntries(MOVIES.map((m) => [m.id, m]));
  const buckets = {};

  for (const [movieId, stars] of Object.entries(ratingsMap || {})) {
    const movie = movieLookup[movieId];
    if (!movie) continue;
    for (const genre of movie.genres) {
      if (!buckets[genre]) {
        buckets[genre] = { genre, sum: 0, count: 0 };
      }
      buckets[genre].sum += stars;
      buckets[genre].count += 1;
    }
  }

  return Object.values(buckets)
    .map((entry) => {
      const avgStars = entry.sum / entry.count;
      const affinityPct = Math.round((avgStars / 5.0) * 100);
      return {
        genre: entry.genre,
        avgStars: Number(avgStars.toFixed(1)),
        count: entry.count,
        affinityPct,
      };
    })
    .sort((a, b) => b.affinityPct - a.affinityPct || b.count - a.count || a.genre.localeCompare(b.genre));
}

/**
 * Compute exact User-Item Matrix sparsity statistics for Tab 3.
 */
export function getMatrixSparsityStats() {
  const totalUsers = USERS.length;
  const totalMovies = MOVIES.length;
  const totalCells = totalUsers * totalMovies;
  let knownRatingsCount = 0;

  for (const user of USERS) {
    knownRatingsCount += Object.keys(user.ratings).length;
  }

  const predictedCellsCount = totalCells - knownRatingsCount;
  const fillPct = Number(((knownRatingsCount / totalCells) * 100).toFixed(1));
  const sparsityPct = Number(((predictedCellsCount / totalCells) * 100).toFixed(1));

  return {
    totalUsers,
    totalMovies,
    totalCells,
    knownRatingsCount,
    predictedCellsCount,
    fillPct,
    sparsityPct,
  };
}


