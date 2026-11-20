import test from 'node:test';
import assert from 'node:assert/strict';
import { MOVIES, USERS, ALL_GENRES, SANDBOX_MOVIE_IDS } from '../data/movieDataset.js';
import {
  ALGORITHMS,
  clampRating,
  cosineSimilarity,
  getRecommendationsForUser,
  predictForNewUser,
  evaluateModels,
  getFullRatingMatrixPredictions,
  searchMovies,
  getMovieInsights,
  getPredictionBreakdown,
  computeGenreAffinityProfile,
  getMatrixSparsityStats,
} from './collaborativeFiltering.js';

test('dataset includes 40+ curated movies and 20 realistic users with valid 1-5 ratings', () => {
  assert.ok(MOVIES.length >= 40, `Expected >= 40 movies, got ${MOVIES.length}`);
  assert.equal(USERS.length, 20, `Expected 20 users, got ${USERS.length}`);
  assert.ok(ALL_GENRES.length >= 6, 'Expected diverse genres');
  assert.ok(SANDBOX_MOVIE_IDS.length >= 10, 'Expected at least 10 sandbox movies');

  const movieIds = new Set(MOVIES.map((m) => m.id));
  for (const user of USERS) {
    const entries = Object.entries(user.ratings);
    assert.ok(entries.length >= 10, `${user.id} should have >= 10 ratings`);
    for (const [mid, rating] of entries) {
      assert.ok(movieIds.has(mid), `Unknown movieId ${mid} for ${user.id}`);
      assert.ok(rating >= 1.0 && rating <= 5.0, `Rating out of bounds: ${rating}`);
    }
  }
});

test('cosineSimilarity calculates accurate vector similarity and handles edge cases', () => {
  const identical = cosineSimilarity({ a: 5, b: 3, c: 1 }, { a: 5, b: 3, c: 1 });
  assert.ok(Math.abs(identical.similarity - 1) < 1e-9);
  assert.equal(identical.overlapCount, 3);

  const orthogonal = cosineSimilarity({ a: 1, b: 0 }, { a: 0, b: 1 });
  assert.equal(orthogonal.similarity, 0);

  const noOverlap = cosineSimilarity({ a: 5 }, { b: 5 });
  assert.equal(noOverlap.similarity, 0);
  assert.equal(noOverlap.overlapCount, 0);

  // Manual check: dot([5, 4], [4, 5]) = 40; normA = sqrt(41), normB = sqrt(41) -> 40/41
  const manual = cosineSimilarity({ m1: 5, m2: 4 }, { m1: 4, m2: 5 });
  assert.ok(Math.abs(manual.similarity - 40 / 41) < 1e-9);
});

test('clampRating bounds predictions cleanly between 1.0 and 5.0', () => {
  assert.equal(clampRating(6.4), 5.0);
  assert.equal(clampRating(-0.5), 1.0);
  assert.equal(clampRating(4.2), 4.2);
  assert.equal(clampRating(Number.NaN), 3.0);
});

test('all 3 collaborative filtering models produce valid, distinct top-6 unrated recommendations', () => {
  const user1 = USERS[0];
  const ratedIds = new Set(Object.keys(user1.ratings));

  const userRes = getRecommendationsForUser(user1.id, ALGORITHMS.USER_BASED, 6);
  const itemRes = getRecommendationsForUser(user1.id, ALGORITHMS.ITEM_BASED, 6);
  const svdRes = getRecommendationsForUser(user1.id, ALGORITHMS.MATRIX_FACTORIZATION, 6);

  for (const res of [userRes, itemRes, svdRes]) {
    assert.equal(res.recommendations.length, 6);
    assert.equal(res.neighbors.length, 3);

    for (let i = 0; i < res.recommendations.length; i++) {
      const rec = res.recommendations[i];
      assert.ok(!ratedIds.has(rec.movie.id), `Recommended already-rated movie ${rec.movie.id}`);
      assert.ok(rec.predictedRating >= 1.0 && rec.predictedRating <= 5.0);
      assert.ok(rec.matchScore >= 20 && rec.matchScore <= 99);
      assert.ok(rec.explanation.length > 10);
      if (i > 0) {
        assert.ok(res.recommendations[i - 1].rawPredicted >= rec.rawPredicted);
      }
    }
  }

  // Ensure SVD and User-Based CF do not output identical predicted scores across all 6 items
  const userScores = userRes.recommendations.map((r) => `${r.movie.id}:${r.predictedRating}`).join(',');
  const svdScores = svdRes.recommendations.map((r) => `${r.movie.id}:${r.predictedRating}`).join(',');
  assert.notEqual(userScores, svdScores, 'Expected distinct prediction outputs across models');
});

test('predictForNewUser generates instant personalized recommendations from >= 3 ratings', () => {
  const customRatings = { m30: 5, m31: 5, m26: 5, m12: 1 };
  for (const algo of [
    ALGORITHMS.USER_BASED,
    ALGORITHMS.ITEM_BASED,
    ALGORITHMS.MATRIX_FACTORIZATION,
  ]) {
    const result = predictForNewUser(customRatings, algo, 6);
    assert.equal(result.recommendations.length, 6);
    for (const rec of result.recommendations) {
      assert.equal(customRatings[rec.movie.id as keyof typeof customRatings], undefined);
      assert.ok(rec.predictedRating >= 1.0 && rec.predictedRating <= 5.0);
    }
  }
});

test('evaluateModels computes realistic finite RMSE and MAE with SVD achieving strong accuracy', () => {
  const metrics = evaluateModels();
  assert.ok(metrics.testSamples > 30);
  assert.equal(metrics.models.length, 3);

  const byId = Object.fromEntries(metrics.models.map((m) => [m.id, m]));
  for (const m of metrics.models) {
    assert.ok(m.rmse > 0.1 && m.rmse < 2.0, `Unexpected RMSE for ${m.name}: ${m.rmse}`);
    assert.ok(m.mae > 0.1 && m.mae < 2.0, `Unexpected MAE for ${m.name}: ${m.mae}`);
    assert.ok(m.mae <= m.rmse, 'MAE must always be <= RMSE');
  }

  assert.ok(
    byId[ALGORITHMS.MATRIX_FACTORIZATION].rmse <= byId[ALGORITHMS.USER_BASED].rmse + 0.05,
    `Expected SVD RMSE (${byId[ALGORITHMS.MATRIX_FACTORIZATION].rmse}) to be competitive/lower than User-Based (${byId[ALGORITHMS.USER_BASED].rmse})`
  );
});

test('getFullRatingMatrixPredictions fills every unrated cell with clamped ratings', () => {
  const matrix = getFullRatingMatrixPredictions();
  for (const user of USERS) {
    for (const movie of MOVIES) {
      if (user.ratings[movie.id] === undefined) {
        const pred = matrix[user.id][movie.id];
        assert.ok(typeof pred === 'number' && pred >= 1.0 && pred <= 5.0);
      } else {
        assert.equal(matrix[user.id][movie.id], undefined);
      }
    }
  }
});

test('searchMovies ranks exact/prefix title matches first and searches director, genre, and year', () => {
  assert.deepEqual(searchMovies('   '), []);

  const inceptionHits = searchMovies('inception');
  assert.ok(inceptionHits.length >= 1);
  assert.equal(inceptionHits[0].movie.id, 'm1');
  assert.ok(inceptionHits[0].avgRating >= 4.0);

  const nolanHits = searchMovies('Nolan');
  assert.ok(nolanHits.length >= 3, 'Expected multiple Christopher Nolan films');

  const yearHits = searchMovies('1994');
  assert.ok(yearHits.some((h) => h.movie.title === 'The Shawshank Redemption'));
});

test('getMovieInsights returns complete rating breakdown and similar movies', () => {
  assert.equal(getMovieInsights('nonexistent'), null);

  const insights = getMovieInsights('m1');
  assert.ok(insights);
  assert.equal(insights.movie.title, 'Inception');
  assert.ok(insights.ratingCount > 0);
  assert.equal(insights.ratingCount + insights.unratedCount, USERS.length);
  assert.ok(insights.avgRating >= 1.0 && insights.avgRating <= 5.0);
  assert.ok(insights.avgPredictedRating >= 1.0 && insights.avgPredictedRating <= 5.0);
  assert.equal(insights.similarMovies.length, 3);
  for (const sim of insights.similarMovies) {
    assert.notEqual(sim.movie.id, 'm1');
    assert.ok(sim.similarityPct > 0 && sim.similarityPct <= 99);
  }
});

test('getPredictionBreakdown explains predictions transparently for all 3 models', () => {
  for (const algo of [
    ALGORITHMS.USER_BASED,
    ALGORITHMS.ITEM_BASED,
    ALGORITHMS.MATRIX_FACTORIZATION,
  ]) {
    const breakdown = getPredictionBreakdown('u1', 'm15', algo);
    assert.ok(breakdown);
    assert.equal(breakdown.movie.id, 'm15');
    assert.ok(breakdown.predictedRating >= 1.0 && breakdown.predictedRating <= 5.0);
    assert.ok(breakdown.formulaSummary.length > 15);
    assert.ok(breakdown.contributors.length > 0);
  }
});

test('computeGenreAffinityProfile calculates sorted live genre affinities', () => {
  assert.deepEqual(computeGenreAffinityProfile({}), []);
  const profile = computeGenreAffinityProfile({ m1: 5, m2: 5, m26: 2 });
  assert.ok(profile.length >= 3);
  assert.equal(profile[0].genre, 'Sci-Fi');
  assert.equal(profile[0].affinityPct, 100);
  assert.equal(profile[0].count, 2);
});

test('getMatrixSparsityStats computes exact known vs predicted cell percentages', () => {
  const stats = getMatrixSparsityStats();
  assert.equal(stats.totalCells, USERS.length * MOVIES.length);
  assert.equal(stats.knownRatingsCount + stats.predictedCellsCount, stats.totalCells);
  assert.ok(Math.abs(stats.fillPct + stats.sparsityPct - 100) < 0.2);
});


