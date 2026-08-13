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
  `src/app/routes.test.ts` and Vitest as the test runner.

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
src/
├── main.tsx                 # entry: mounts App under BrowserRouter
├── app/
│   ├── App.tsx              # route wiring shell
│   ├── routes.tsx           # RESEARCH_STEPS + STEP_ROUTES shared metadata
│   ├── routes.test.ts       # route contract tests
│   └── styles.css
├── research/
│   └── ResearchLayout.tsx   # persistent header, warning, step navigation
└── pages/                   # one placeholder page per step
```

## License and status

Exploratory project scaffold for product research. No production claims are
made about sales, margins, or market share. Data, statistics, CSV import,
pain-point rules, economics, scoring, and decision logic land in later
development tasks.