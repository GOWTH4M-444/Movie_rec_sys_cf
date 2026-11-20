"""
Movie Recommendation System Using Collaborative Filtering (Python Reference)

Standalone implementation mirroring the browser ML engine using:
  - pandas (User-Item Rating Matrix management)
  - numpy (linear algebra & regularized SGD Matrix Factorization)
  - scikit-learn (Cosine Similarity & RMSE/MAE error metrics)

Usage:
    pip install -r requirements.txt
    python python_ml/collaborative_filtering.py
"""

from __future__ import annotations

import math
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from sklearn.metrics.pairwise import cosine_similarity


# ---------------------------------------------------------------------------
# 1. Sample Dataset (Mirrors src/data/movieDataset.js)
# ---------------------------------------------------------------------------

MOVIES: Dict[str, Tuple[str, int, str]] = {
    "m1": ("Inception", 2010, "Sci-Fi / Thriller"),
    "m2": ("Interstellar", 2014, "Sci-Fi / Drama"),
    "m3": ("The Matrix", 1999, "Sci-Fi / Action"),
    "m4": ("Arrival", 2016, "Sci-Fi / Drama"),
    "m5": ("Blade Runner 2049", 2017, "Sci-Fi / Mystery"),
    "m6": ("Ex Machina", 2014, "Sci-Fi / Thriller"),
    "m7": ("The Martian", 2015, "Sci-Fi / Adventure"),
    "m8": ("Dune", 2021, "Sci-Fi / Adventure"),
    "m9": ("Shutter Island", 2010, "Thriller / Mystery"),
    "m10": ("The Prestige", 2006, "Mystery / Drama"),
    "m11": ("Gone Girl", 2014, "Thriller / Mystery"),
    "m12": ("Se7en", 1995, "Thriller / Crime"),
    "m13": ("Knives Out", 2019, "Mystery / Comedy"),
    "m14": ("Prisoners", 2013, "Thriller / Crime"),
    "m15": ("Parasite", 2019, "Thriller / Drama"),
    "m16": ("The Dark Knight", 2008, "Action / Crime"),
    "m17": ("Mad Max: Fury Road", 2015, "Action / Adventure"),
    "m18": ("Gladiator", 2000, "Action / Drama"),
    "m19": ("John Wick", 2014, "Action / Thriller"),
    "m20": ("Spider-Man: Into the Spider-Verse", 2018, "Animation / Action"),
    "m21": ("Top Gun: Maverick", 2022, "Action / Drama"),
    "m22": ("Jurassic Park", 1993, "Adventure / Sci-Fi"),
    "m23": ("Superbad", 2007, "Comedy"),
    "m24": ("The Grand Budapest Hotel", 2014, "Comedy / Adventure"),
    "m25": ("Groundhog Day", 1993, "Comedy / Romance"),
    "m26": ("Paddington 2", 2017, "Family / Comedy"),
    "m27": ("School of Rock", 2003, "Comedy / Family"),
    "m28": ("Crazy Rich Asians", 2018, "Comedy / Romance"),
    "m29": ("Home Alone", 1990, "Family / Comedy"),
    "m30": ("Toy Story", 1995, "Animation / Family"),
    "m31": ("Finding Nemo", 2003, "Animation / Family"),
    "m32": ("Inside Out", 2015, "Animation / Family"),
    "m33": ("Coco", 2017, "Animation / Family"),
    "m34": ("Spirited Away", 2001, "Animation / Adventure"),
    "m35": ("The Incredibles", 2004, "Animation / Action"),
    "m36": ("The Shawshank Redemption", 1994, "Drama / Classics"),
    "m37": ("The Godfather", 1972, "Crime / Classics"),
    "m38": ("Forrest Gump", 1994, "Drama / Romance"),
    "m39": ("Good Will Hunting", 1997, "Drama / Classics"),
    "m40": ("12 Angry Men", 1957, "Drama / Classics"),
    "m41": ("La La Land", 2016, "Romance / Drama"),
    "m42": ("The Truman Show", 1998, "Drama / Comedy"),
    "m43": ("Whiplash", 2014, "Drama"),
    "m44": ("Pride & Prejudice", 2005, "Romance / Drama"),
}

USER_RATINGS: Dict[str, Dict[str, float]] = {
    "u1": {"m1": 5.0, "m2": 5.0, "m3": 4.5, "m6": 4.5, "m9": 5.0, "m10": 4.5, "m16": 5.0, "m12": 4.0, "m7": 4.5, "m26": 2.0, "m29": 2.5, "m31": 2.5, "m44": 2.0},
    "u2": {"m26": 5.0, "m27": 4.5, "m29": 5.0, "m30": 5.0, "m31": 5.0, "m32": 4.5, "m25": 4.5, "m24": 4.0, "m38": 4.5, "m12": 1.5, "m14": 2.0, "m5": 2.5, "m19": 2.0},
    "u3": {"m36": 5.0, "m37": 5.0, "m39": 5.0, "m40": 5.0, "m43": 4.5, "m15": 4.5, "m38": 4.5, "m42": 4.5, "m4": 4.0, "m19": 2.0, "m23": 2.0, "m17": 2.5, "m29": 2.5},
    "u4": {"m16": 5.0, "m17": 5.0, "m18": 4.5, "m19": 5.0, "m21": 4.5, "m3": 5.0, "m22": 4.5, "m1": 4.5, "m35": 4.0, "m44": 1.5, "m41": 2.0, "m26": 2.5, "m40": 3.0},
    "u5": {"m9": 5.0, "m10": 5.0, "m11": 4.5, "m12": 5.0, "m13": 4.5, "m14": 5.0, "m15": 5.0, "m5": 4.5, "m1": 4.5, "m27": 2.0, "m29": 2.0, "m30": 2.5, "m28": 2.0},
    "u6": {"m30": 5.0, "m31": 4.5, "m32": 5.0, "m33": 5.0, "m34": 5.0, "m35": 4.5, "m20": 5.0, "m26": 5.0, "m24": 4.5, "m11": 2.0, "m12": 1.5, "m19": 2.0, "m14": 1.5},
    "u7": {"m2": 5.0, "m4": 5.0, "m5": 5.0, "m6": 5.0, "m7": 4.5, "m8": 5.0, "m1": 5.0, "m3": 4.5, "m22": 4.0, "m28": 2.0, "m23": 2.0, "m44": 2.0, "m29": 2.0},
    "u8": {"m41": 5.0, "m44": 5.0, "m28": 4.5, "m25": 4.5, "m38": 5.0, "m39": 4.5, "m42": 4.5, "m24": 4.0, "m33": 4.5, "m12": 1.5, "m17": 2.0, "m19": 1.5, "m5": 2.5},
    "u9": {"m13": 5.0, "m24": 5.0, "m25": 5.0, "m23": 4.5, "m27": 4.5, "m42": 5.0, "m26": 4.5, "m15": 4.5, "m28": 4.0, "m14": 2.0, "m18": 2.5, "m8": 2.5, "m37": 3.0},
    "u10": {"m36": 5.0, "m37": 5.0, "m12": 4.5, "m14": 4.5, "m15": 5.0, "m16": 5.0, "m43": 5.0, "m40": 4.5, "m11": 4.5, "m26": 2.0, "m29": 2.0, "m31": 2.5, "m28": 2.0},
    "u11": {"m1": 5.0, "m2": 5.0, "m4": 4.5, "m5": 4.5, "m8": 5.0, "m10": 5.0, "m16": 5.0, "m14": 4.5, "m7": 4.5, "m28": 2.0, "m44": 2.0, "m29": 2.0, "m23": 2.5},
    "u12": {"m29": 5.0, "m30": 5.0, "m31": 5.0, "m32": 4.5, "m33": 4.5, "m35": 5.0, "m22": 4.5, "m27": 4.5, "m20": 4.5, "m12": 1.5, "m11": 2.0, "m14": 1.5, "m6": 2.5},
    "u13": {"m15": 5.0, "m24": 5.0, "m43": 5.0, "m41": 4.5, "m4": 4.5, "m6": 4.5, "m34": 5.0, "m42": 4.5, "m13": 4.5, "m19": 2.0, "m21": 2.5, "m23": 2.5, "m29": 2.0},
    "u14": {"m3": 5.0, "m22": 5.0, "m25": 4.5, "m29": 4.5, "m30": 4.5, "m36": 5.0, "m38": 5.0, "m39": 4.5, "m42": 4.5, "m12": 4.0, "m8": 3.0, "m5": 3.0, "m44": 2.5},
    "u15": {"m17": 5.0, "m18": 5.0, "m19": 4.5, "m21": 5.0, "m8": 4.5, "m7": 4.5, "m22": 4.5, "m16": 4.5, "m35": 4.5, "m44": 1.5, "m41": 2.0, "m28": 2.0, "m40": 2.5},
    "u16": {"m9": 4.5, "m11": 5.0, "m12": 4.5, "m14": 5.0, "m6": 4.5, "m15": 4.5, "m10": 5.0, "m43": 4.5, "m40": 4.0, "m26": 2.0, "m27": 2.0, "m31": 2.0, "m29": 1.5},
    "u17": {"m20": 5.0, "m34": 5.0, "m35": 5.0, "m30": 4.5, "m32": 4.5, "m1": 4.5, "m3": 4.5, "m7": 4.5, "m16": 4.5, "m44": 2.0, "m37": 2.5, "m11": 2.0, "m14": 2.0},
    "u18": {"m36": 5.0, "m37": 5.0, "m40": 5.0, "m39": 4.5, "m44": 4.5, "m41": 4.5, "m38": 4.0, "m42": 4.5, "m10": 4.5, "m23": 1.5, "m19": 2.0, "m29": 2.5, "m17": 2.5},
    "u19": {"m13": 5.0, "m21": 4.5, "m7": 4.5, "m25": 4.5, "m28": 4.5, "m33": 4.5, "m26": 4.5, "m20": 4.5, "m38": 4.5, "m5": 2.5, "m12": 2.0, "m14": 2.0, "m37": 2.5},
    "u20": {"m1": 5.0, "m2": 4.5, "m4": 5.0, "m6": 4.5, "m9": 4.5, "m10": 4.5, "m13": 4.5, "m15": 5.0, "m7": 4.5, "m29": 2.0, "m23": 2.0, "m28": 2.5, "m31": 2.5},
}


def build_rating_matrix(ratings_dict: Dict[str, Dict[str, float]]) -> pd.DataFrame:
    """Create a users x movies DataFrame with NaN for unrated cells."""
    df = pd.DataFrame.from_dict(ratings_dict, orient="index")
    return df.reindex(columns=list(MOVIES.keys()))


def clamp(value: float) -> float:
    return float(max(1.0, min(5.0, value)))


# ---------------------------------------------------------------------------
# 2. User-Based Collaborative Filtering
# ---------------------------------------------------------------------------

def predict_user_based(matrix: pd.DataFrame, user_id: str, movie_id: str) -> float:
    user_means = matrix.mean(axis=1)
    centered = matrix.sub(user_means, axis=0).fillna(0.0)
    sim_df = pd.DataFrame(
        cosine_similarity(centered.values),
        index=matrix.index,
        columns=matrix.index,
    )

    sims = sim_df.loc[user_id].drop(index=user_id)
    movie_col = matrix[movie_id].drop(index=user_id).dropna()

    weighted_sum = 0.0
    total_weight = 0.0
    for neighbor_id, rating in movie_col.items():
        w = max(0.0, float(sims.loc[neighbor_id]))
        if w > 0.05:
            weighted_sum += w * (rating - float(user_means.loc[neighbor_id]))
            total_weight += w

    if total_weight > 0:
        return clamp(float(user_means.loc[user_id]) + weighted_sum / total_weight)
    return clamp(float(matrix[movie_id].mean()) if not math.isnan(matrix[movie_id].mean()) else 3.5)


# ---------------------------------------------------------------------------
# 3. Item-Based Collaborative Filtering
# ---------------------------------------------------------------------------

def predict_item_based(matrix: pd.DataFrame, user_id: str, movie_id: str) -> float:
    item_means = matrix.mean(axis=0).fillna(3.5)
    centered = matrix.sub(item_means, axis=1).fillna(0.0)
    sim_df = pd.DataFrame(
        cosine_similarity(centered.T.values),
        index=matrix.columns,
        columns=matrix.columns,
    )

    rated_by_user = matrix.loc[user_id].dropna()
    weighted_sum = 0.0
    total_weight = 0.0

    for rated_movie, rating in rated_by_user.items():
        if rated_movie == movie_id:
            continue
        w = max(0.0, float(sim_df.loc[movie_id, rated_movie]))
        if w > 0.05:
            weighted_sum += w * (rating - float(item_means.loc[rated_movie]))
            total_weight += w

    if total_weight > 0:
        return clamp(float(item_means.loc[movie_id]) + weighted_sum / total_weight)
    return clamp(float(item_means.loc[movie_id]))


# ---------------------------------------------------------------------------
# 4. Matrix Factorization (SVD-Style Latent Factors via SGD)
# ---------------------------------------------------------------------------

class MatrixFactorizationSVD:
    def __init__(self, n_factors: int = 2, epochs: int = 220, lr: float = 0.015, reg: float = 0.06, seed: int = 2025):
        self.n_factors = n_factors
        self.epochs = epochs
        self.lr = lr
        self.reg = reg
        self.seed = seed

    def fit(self, matrix: pd.DataFrame) -> "MatrixFactorizationSVD":
        rng = np.random.default_rng(self.seed)
        self.user_ids = list(matrix.index)
        self.movie_ids = list(matrix.columns)
        self.user_idx = {u: i for i, u in enumerate(self.user_ids)}
        self.movie_idx = {m: j for j, m in enumerate(self.movie_ids)}

        observations = [
            (self.user_idx[u], self.movie_idx[m], float(matrix.loc[u, m]))
            for u in self.user_ids
            for m in self.movie_ids
            if not pd.isna(matrix.loc[u, m])
        ]
        self.global_mean = float(np.mean([r for _, _, r in observations]))

        self.P = (rng.random((len(self.user_ids), self.n_factors)) - 0.5) * 0.16
        self.Q = (rng.random((len(self.movie_ids), self.n_factors)) - 0.5) * 0.16
        self.b_u = np.zeros(len(self.user_ids))
        self.b_i = np.zeros(len(self.movie_ids))

        order = np.arange(len(observations))
        for epoch in range(self.epochs):
            rng.shuffle(order)
            step_lr = self.lr / (1.0 + 0.004 * epoch)
            for idx in order:
                u, i, r = observations[idx]
                pred = self.global_mean + self.b_u[u] + self.b_i[i] + float(np.dot(self.P[u], self.Q[i]))
                err = r - pred
                self.b_u[u] += step_lr * (err - 0.5 * self.reg * self.b_u[u])
                self.b_i[i] += step_lr * (err - 0.5 * self.reg * self.b_i[i])
                p_old = self.P[u].copy()
                self.P[u] += step_lr * (err * self.Q[i] - self.reg * p_old)
                self.Q[i] += step_lr * (err * p_old - self.reg * self.Q[i])
        return self

    def predict(self, user_id: str, movie_id: str) -> float:
        u = self.user_idx[user_id]
        i = self.movie_idx[movie_id]
        val = self.global_mean + self.b_u[u] + self.b_i[i] + float(np.dot(self.P[u], self.Q[i]))
        return clamp(val)


# ---------------------------------------------------------------------------
# 5. Demo Runner & 80/20 Hold-Out Accuracy Evaluation
# ---------------------------------------------------------------------------

def evaluate_models(matrix: pd.DataFrame) -> None:
    train = matrix.copy()
    test_samples: List[Tuple[str, str, float]] = []
    counter = 0

    for u in matrix.index:
        for m in matrix.columns:
            val = matrix.loc[u, m]
            if not pd.isna(val):
                counter += 1
                if counter % 5 == 0:
                    train.loc[u, m] = np.nan
                    test_samples.append((u, m, float(val)))

    svd = MatrixFactorizationSVD().fit(train)

    y_true = [actual for _, _, actual in test_samples]
    preds_user = [predict_user_based(train, u, m) for u, m, _ in test_samples]
    preds_item = [predict_item_based(train, u, m) for u, m, _ in test_samples]
    preds_svd = [svd.predict(u, m) for u, m, _ in test_samples]

    print("\n=== Hold-Out Accuracy Comparison (80/20 Split) ===")
    print(f"Evaluated on {len(test_samples)} held-out ratings (lower error is better):\n")
    for label, preds in [
        ("User-Based CF", preds_user),
        ("Item-Based CF", preds_item),
        ("Matrix Factorization (SVD)", preds_svd),
    ]:
        rmse = root_mean_squared_error(y_true, preds)
        mae = mean_absolute_error(y_true, preds)
        print(f"  {label:<28} | RMSE: {rmse:.3f} | MAE: {mae:.3f}")


def main() -> None:
    matrix = build_rating_matrix(USER_RATINGS)
    svd = MatrixFactorizationSVD().fit(matrix)

    target_user = "u1"
    unrated = [m for m in matrix.columns if pd.isna(matrix.loc[target_user, m])]

    print("=== Top 6 Recommendations for User 1 (Sci-Fi & Thriller Fan) ===")
    for name, fn in [
        ("User-Based Collaborative Filtering", lambda m: predict_user_based(matrix, target_user, m)),
        ("Item-Based Collaborative Filtering", lambda m: predict_item_based(matrix, target_user, m)),
        ("Matrix Factorization (SVD)", lambda m: svd.predict(target_user, m)),
    ]:
        scored = sorted([(m, fn(m)) for m in unrated], key=lambda x: x[1], reverse=True)[:6]
        print(f"\n{name}:")
        for rank, (mid, score) in enumerate(scored, start=1):
            title, year, genres = MOVIES[mid]
            print(f"  {rank}. {title} ({year}) [{genres}] -> Predicted: {score:.1f} / 5.0 ★")

    evaluate_models(matrix)


if __name__ == "__main__":
    main()
