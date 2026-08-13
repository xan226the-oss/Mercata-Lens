# Mercata Lens（商机镜）

A local, evidence-driven product-opportunity research workbench for novice
cross-border sellers who are shortlisting product ideas for the US market.
The first release validates exactly one demo category.

Built: local evidence-driven research flow for one validated demo category.
Not built: Amazon scraping/API, AI model, sales prediction, real seller analytics, all-category support.

## Product boundary

- `review_count` means the number of reviews, never sales volume.
- Output is limited to "continue research / insufficient evidence / pause"
  and a validation plan. The app does not recommend purchasing stock or
  predict best sellers.
- Demo values are labelled as demo; user-provided costs are treated as
  assumptions, never as market costs.
- This product has **no backend**, **no login**, and **no cloud database**:
  data processing and saving happen entirely in the browser locally.
- This is not "only HTML" — it is a single-page application built with
  **React + TypeScript** (Vite build), with route-level tests under
  `src/app/routes.test.tsx` and Vitest as the test runner.

## Six-step research flow

```text
Research project        /
Data quality            /quality
Category overview       /category
Customer pain points    /pain-points
Opportunity comparison  /opportunities
Decision & validation   /decision
```

All six routes are wired in the shell app. Each step page currently states
its one-line responsibility only; no data, statistics, scoring, or
conclusion logic is implemented yet.

## Getting started

Requirements: Node.js 22 and pnpm 11.

```bash
pnpm install
pnpm dev
```

Open the printed local URL. The app runs entirely locally.

## Verification

```bash
pnpm test -- --run   # unit + route contract tests
pnpm build           # production build (tsc + vite build)
```

## Project structure

```text
public/
└── demo/
    ├── products.csv          # curated synthetic demo products (12)
    └── reviews.csv           # curated synthetic demo reviews (76)
src/
├── main.tsx                 # entry: mounts App under BrowserRouter
├── app/
│   ├── App.tsx              # route wiring shell + ResearchProvider
│   ├── routes.tsx           # RESEARCH_STEPS + STEP_ROUTES shared metadata
│   ├── routes.test.tsx      # route contract tests
│   └── styles.css
├── domain/
│   ├── types.ts             # versioned domain contracts
│   ├── schemas.ts           # strict single-row parsers
│   └── dataset.ts           # ResearchDataset envelope builder
├── data/
│   └── demoLoader.ts        # Papa Parse demo loader
├── research/
│   ├── ResearchContext.tsx  # demo load state (idle/loading/ready/error)
│   └── ResearchLayout.tsx   # persistent header, warning, step navigation
├── fixtures/
│   └── testDataset.ts       # fixed in-memory test dataset
└── pages/                   # one placeholder page per step
```

## Demo dataset provenance

The demo data under `public/demo/` is a **hand-curated synthetic fixture**
created for demonstration only. It is **not** a current Amazon scrape and
the review texts are **not** real consumer reviews.

- All product and review URLs use `https://example.com/demo/...`.
- No real brands, Amazon ASINs, sales, GMV, ROAS, or market-share figures.
- The data can only validate the product's processing flow; it cannot prove
  market demand, sales, or share.

## Running the demo data

The app loads the demo dataset automatically on the home page:

```bash
pnpm dev
```

Open the printed local URL. The home page shows product count, review count,
source kind, imported timestamp, category, and the demo disclaimer. All six
routes remain reachable.

## License and status

Exploratory project scaffold for product research. No production claims are
made about sales, margins, or market share. Data, statistics, CSV import,
pain-point rules, economics, scoring, and decision logic land in later
development tasks.