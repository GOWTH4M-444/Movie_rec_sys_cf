# Movie Recommendation System Using Collaborative Filtering

An intuitive, production-ready Machine Learning web application that demonstrates how **Collaborative Filtering** predicts which movies a viewer will enjoy next — powered by genuine, real-time in-browser algorithms plus a matching standalone Python ML script.

---

## Simple Overview

Choosing a movie from a huge catalog can feel overwhelming. **Collaborative Filtering** solves this problem by looking at patterns in star ratings across many viewers. Instead of relying on manual movie descriptions, it learns from real viewing habits:

- If two viewers consistently rate the same movies high and the same movies low, they likely share similar taste.
- If two movies receive matching ratings from the same audiences, enjoying one predicts you will enjoy the other.
- Hidden taste dimensions (such as tone, pacing, or storytelling depth) can be discovered mathematically using **Matrix Factorization (SVD)**.

---

## Key Features

1. **Focused Project Landing Page**
   - Clean introduction summarizing *The Problem*, *The ML Solution*, *Key Algorithms*, and dataset statistics with a single **Launch Recommendation System** call to action.
2. **Get Recommendations (3 Live Collaborative Filtering Models)**
   - Choose from **20 sample user profiles** and inspect their past rated movies.
   - Switch instantly between **User-Based CF**, **Item-Based CF**, and **Matrix Factorization (SVD)**.
   - Displays the **Top 6 Recommended Movies** with predicted star ratings (`1.0–5.0`), match percentages, plain-English explanations, and the **Top 3 Most Similar Users or Movies**.
3. **Rate & Predict Live (Interactive New-User Sandbox)**
   - Act as a brand-new user by rating at least 3 popular movies (`1–5 stars`).
   - Click **Generate My Predictions** to run Collaborative Filtering live in the browser and receive instant personalized recommendations.
4. **Movie Catalog & User-Item Rating Matrix**
   - Search and filter all **44 curated movies** by title, director, or genre.
   - Explore a color-coded **User-Item Rating Matrix** distinguishing known viewer ratings from empty cells predicted by the ML model.
5. **How It Works (Plain-English Model Guide)**
   - Visual side-by-side comparison of all three algorithms.
   - Interactive **Cosine Similarity** worked example where you can adjust ratings live.
   - Real **RMSE** and **MAE** accuracy comparison table evaluated on an 80/20 hold-out split.
6. **Interactive Demo Tours on Every Tab**
   - Every navigation tab includes a **Start Demo Tour** button that spotlights each major feature step by step with plain-English explanations.

---

## How Collaborative Filtering Works (Explained Simply)

| Algorithm | Plain-English Idea | How Predictions Are Calculated |
| --- | --- | --- |
| **User-Based CF** | *"People like you also liked..."* | Measures Cosine Similarity between your ratings and every other viewer, then computes a similarity-weighted average rating for unwatched movies. |
| **Item-Based CF** | *"Because you watched X..."* | Measures Cosine Similarity between movie rating vectors across all viewers and predicts scores from movies closest to your favorites. |
| **Matrix Factorization (SVD)** | *"Finding hidden taste patterns"* | Uses Stochastic Gradient Descent (SGD) to learn compact latent taste vectors for every user and movie, multiplying them to estimate missing cells with low RMSE. |

---

## Project Folder Structure

```text
.
├── app/
│   ├── globals.css                    # Tailwind CSS & Navy/Light Blue theme base
│   ├── layout.tsx                     # Root layout, metadata, and typography
│   └── page.tsx                       # Main entry switching Landing Page and App tabs
├── src/
│   ├── data/
│   │   └── movieDataset.js            # 44 curated movies & 20 realistic user rating profiles
│   ├── ml/
│   │   ├── collaborativeFiltering.js  # Cosine Similarity, User-CF, Item-CF, SVD, RMSE/MAE
│   │   └── collaborativeFiltering.test.ts  # Unit tests for ML math and accuracy
│   └── components/
│       ├── LandingPage.jsx            # Clean front landing page (no navbar)
│       ├── Navbar.jsx                 # Top navigation bar with Home & 4 tabs
│       ├── RecommendationsTab.jsx     # Tab 1: Prediction engine & neighbor comparison
│       ├── LiveSandboxTab.jsx         # Tab 2: Interactive new-user star rating sandbox
│       ├── CatalogMatrixTab.jsx       # Tab 3: Searchable catalog & rating matrix table
│       ├── HowItWorksTab.jsx          # Tab 4: Visual guide, Cosine example & RMSE/MAE
│       └── DemoTour.jsx               # Reusable spotlight demo tour overlay
├── python_ml/
│   └── collaborative_filtering.py     # Standalone Python (pandas, numpy, scikit-learn) version
├── requirements.txt                   # Python dependencies
├── package.json                       # Web application dependencies & scripts
└── README.md                          # Project documentation
```

---

## Run Locally

### 1. Web Application (React / Next.js)

Prerequisites: **Node.js 18+** and **npm**.

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To run the ML engine unit tests:

```bash
npx tsx --test src/ml/collaborativeFiltering.test.ts
```

To create a production build:

```bash
npm run build
npm start
```

### 2. Standalone Python Reference Script

Prerequisites: **Python 3.9+**.

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Run the Collaborative Filtering demo & evaluation script
python python_ml/collaborative_filtering.py
```

This prints top recommendations for a sample viewer using **User-Based CF**, **Item-Based CF**, and **Matrix Factorization (SVD)** along with held-out **RMSE** and **MAE** scores.
