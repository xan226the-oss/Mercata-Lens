# Task 4C Category Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close Product Task 4 with a reproducible manual category calculation, accurate documentation, semantic coverage, and real-browser responsive and keyboard acceptance.

**Architecture:** Preserve Task 4A as the only statistics layer and Task 4B as the shipped presentation layer. Task 4C adds no runtime interface or business contract: it audits existing semantics, records an independent calculation under `docs/evidence`, reconciles README, and uses real-browser observations as the visual acceptance source. If a runtime or CSS defect is found, implementation stops for a new Codex-scoped repair instead of inventing a patch inside acceptance.

**Tech Stack:** React 19, TypeScript 5, React Router 7, Vitest 3, Testing Library, native HTML `progress` and `details`, Vite, Markdown, real local Chrome or the Codex in-app browser.

## Global Constraints

- Repository root is exactly `/Users/xanthe/Documents/Mercata Lens`; do not write task files outside it.
- The approved application baseline is `9acd48bdf36d6a3d5681b0aa6c74fe45e85523cf`.
- `analyzeCategory(dataset)` remains the only category-analysis source of truth.
- Do not modify statistics, quartiles, price bands, rating bands, review-count bands, brand grouping, attribute coverage, limitations, or status thresholds.
- `reviewCount` remains displayed review count only and never represents sales, customers, demand, velocity, or wider-market performance.
- Demo data remains a synthetic fixture; user-uploaded data retains its own sourcing limitations.
- Task 4C adds no manual-calculation UI, route, component, dependency, persistence, export, backend, AI, scraper, or external API.
- Do not implement pain points, human correction controls, economics, opportunity scoring, decision logic, or Task 5.
- Do not amend, push, deploy, or create a pull request.
- Create one ordinary Task 4C implementation commit after every required gate passes.

---

## File structure

**Create:**

- `docs/evidence/manual-category-check.md` — independent calculation and browser comparison for the 12-product synthetic Demo fixture.

**Modify:**

- `src/components/EvidenceDrawer.test.tsx` — assert that native disclosure activation changes its open state.
- `README.md` — reconcile shipped Category behavior, sample-only limits, evidence link, and project structure.

**Observe but do not modify:**

- `src/app/styles.css`
- `src/pages/HomePage.tsx`
- `src/pages/CategoryPage.tsx`
- `src/components/SampleDistribution.tsx`
- `src/components/EvidenceDrawer.tsx`
- all domain, data, context, fixture, Demo, dependency, and lock files.

If browser acceptance finds a defect in an observed file, stop and report it. A later Codex repair instruction may authorize a narrowly defined change; this plan does not pre-authorize a hypothetical CSS or runtime edit.

## Task 1: Lock the native evidence-disclosure contract

**Files:**

- Modify: `src/components/EvidenceDrawer.test.tsx`
- Test: `src/components/EvidenceDrawer.test.tsx`

**Interfaces:**

- Consumes: `EvidenceDrawer({ analysis }: EvidenceDrawerProps)` and a real `analyzeCategory(dataset)` result.
- Produces: no runtime interface; adds an explicit native disclosure-state regression contract.

- [ ] **Step 1: Review existing semantic coverage before editing**

Run:

```bash
pnpm vitest run \
  src/components/SampleDistribution.test.tsx \
  src/components/EvidenceDrawer.test.tsx \
  src/components/DataSourceBadge.test.tsx \
  src/pages/CategoryPage.test.tsx \
  src/pages/HomePage.test.tsx \
  src/research/ResearchLayout.test.tsx \
  src/app/routes.test.tsx
```

Expected baseline: all listed files pass. Record the exact file and test counts. Confirm that existing tests already cover progress accessible names, exact denominators, zero-count rating bands, Demo and user-upload provenance, Category sections, and locked routing.

- [ ] **Step 2: Strengthen the existing disclosure test**

In the test named `uses native details and exposes all calculation evidence after opening`, retain its real analysis fixture and add an explicit reference to the native element:

```tsx
const disclosure = screen.getByTestId("category-evidence");
expect(disclosure.tagName).toBe("DETAILS");
expect(disclosure).not.toHaveAttribute("open");
expect(screen.getByText("Calculation evidence").closest("summary")).toBeInTheDocument();

await userEvent.click(screen.getByText("Calculation evidence"));

expect(disclosure).toHaveAttribute("open");
```

Do not remove the existing assertions for product IDs, cut points, excluded products, brand groups, or attribute IDs.

- [ ] **Step 3: Run the focused test and report RED/GREEN honestly**

Run:

```bash
pnpm vitest run src/components/EvidenceDrawer.test.tsx
```

Expected on the approved baseline: PASS because native `details/summary` already implements the behavior. Report this as an existing behavior with strengthened coverage, not as a fabricated RED. If it fails, do not change runtime code; stop and report the exact failure.

- [ ] **Step 4: Re-run all Category acceptance tests**

Run the seven-file command from Step 1.

Expected: all files pass with no console warning or accessibility-query failure.

## Task 2: Perform real-browser responsive and keyboard acceptance

**Files:**

- Observe: `src/app/styles.css`
- Observe: `src/pages/HomePage.tsx`
- Observe: `src/pages/CategoryPage.tsx`
- Observe: `src/components/SampleDistribution.tsx`
- Observe: `src/components/EvidenceDrawer.tsx`

**Interfaces:**

- Consumes: the local Vite application at the URL printed by `pnpm dev`.
- Produces: exact viewport, overflow, keyboard, visible-layout, console, and server-shutdown observations for the delivery report and manual evidence document.

- [ ] **Step 1: Start one local development server**

Run from the repository root:

```bash
pnpm dev --host 127.0.0.1
```

Use the printed local URL. Do not start a second server when the first one is active.

- [ ] **Step 2: Accept Home and Category at `1440 x 900`**

Use a real browser with an explicit `1440 x 900` viewport. Verify and record:

```text
Home
- documentElement.scrollWidth <= documentElement.clientWidth
- Light Slate sidebar visible without covering main content
- four Home metric columns
- Products in sample = 12
- Review evidence = 76 and visible not-sales wording
- Observed price range = $24.99 – $44.99
- Provided brand labels = 6
- compact price distribution scale = 0 to 12 products
- Open Category overview is a real link

Category
- documentElement.scrollWidth <= documentElement.clientWidth
- four Category metric columns
- Median observed price = $35.99
- price scale = 0 to 12 products
- four price rows, each with count 3 / 12
- rating and review-count distributions visible
- represented brand labels and attribute completeness readable
- Calculation evidence summary visible
```

Open the calculation disclosure and confirm that the cut points and price-band product IDs are visible.

- [ ] **Step 3: Accept the intermediate layout at `900 x 900`**

Verify and record:

```text
- documentElement.scrollWidth <= documentElement.clientWidth on Home and Category
- shell is single-column with sidebar content above the workspace
- research navigation is usable and does not overlap
- Home analysis areas stack
- Category metric grid has two columns
- Category distribution grid has one column
- all counts and labels remain readable
```

- [ ] **Step 4: Accept the mobile layout at `390 x 844`**

Verify and record:

```text
- documentElement.scrollWidth <= documentElement.clientWidth on Home and Category
- navigation uses the compact two-column layout
- Home and Category metric grids each use one column
- file inputs have at least 40px actual height
- distribution labels, counts, percentages, and progress indicators do not clip
- expanded evidence IDs and limitations wrap inside the viewport
- no required content depends on horizontal scrolling
```

- [ ] **Step 5: Perform real keyboard checks at desktop and mobile widths**

At `1440 x 900` and `390 x 844`, use keyboard input rather than DOM mutation. Complete the Demo calculation comparison before selecting files. Use only the repository's synthetic `public/demo/products.csv` and `public/demo/reviews.csv` for the control-state check:

```text
- Tab reaches available research navigation links
- Tab reaches Open Category overview on Home
- Tab reaches Products CSV and Reviews CSV
- the disabled import button is visibly distinguishable and is skipped by normal Tab navigation
- after selecting `public/demo/products.csv` and `public/demo/reviews.csv`, the enabled import button receives focus
- Tab reaches Calculation evidence on Category
- Enter or Space toggles the native disclosure
- focus indication is visually discernible on each checked control
- locked navigation, when exercised through the existing low-sample automated test, is not an interactive link
```

Record which activation key was used and the disclosure's closed/open result. DOM presence without keyboard activation is not sufficient.

- [ ] **Step 6: Inspect console and classify messages**

Inspect Home and Category console output after navigation and disclosure interaction. Expected:

```text
- no application runtime error
- no React warning
- no duplicate-key warning
```

Report any resource-only request separately. Do not describe a resource request as an application runtime error, and do not hide it.

- [ ] **Step 7: Apply the defect gate**

If every observation passes, leave `src/app/styles.css` and all runtime files unchanged and continue.

If any overflow, focus, wrapping, sizing, keyboard, semantic, or runtime defect is observed, stop the task without editing the affected runtime or CSS file. Report:

```text
- exact URL and state
- exact viewport
- reproduction steps
- measured clientWidth and scrollWidth when relevant
- observed console message when relevant
- proposed file requiring a separately approved repair
```

- [ ] **Step 8: Stop the server and prove port release**

Stop the exact Vite process started in Step 1. Then run:

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

Expected: no listener. If Vite chose a different port, check that exact printed port instead.

## Task 3: Record the manual calculation and reconcile README

**Files:**

- Create: `docs/evidence/manual-category-check.md`
- Modify: `README.md`

**Interfaces:**

- Consumes: `public/demo/products.csv`, the approved Task 4A median-of-halves rule, and the successful browser observations from Task 2.
- Produces: a reproducible written calculation and a truthful project entry point.

- [ ] **Step 1: Create the manual calculation evidence document**

Create `docs/evidence/manual-category-check.md` with this exact structure and verified content:

```markdown
# Manual Category Check

## Scope and source

- Approved application commit checked: `9acd48bdf36d6a3d5681b0aa6c74fe45e85523cf`
- Source: `public/demo/products.csv`
- Records: 12 synthetic Demo products
- Boundary: this calculation checks the current comparison sample only. It does not validate a wider market, sales, demand, profitability, or a recommended price.

## Sorted observed prices

| Order | Product ID | Price (USD) |
| ---: | --- | ---: |
| 1 | `p09` | 24.99 |
| 2 | `p05` | 27.99 |
| 3 | `p01` | 29.99 |
| 4 | `p11` | 30.99 |
| 5 | `p04` | 32.99 |
| 6 | `p02` | 34.99 |
| 7 | `p07` | 36.99 |
| 8 | `p10` | 37.99 |
| 9 | `p12` | 38.99 |
| 10 | `p03` | 39.99 |
| 11 | `p08` | 41.99 |
| 12 | `p06` | 44.99 |

## Manual quartile calculation

The approved rule takes the median of the lower six prices for Q1, the median of all 12 prices, and the median of the upper six prices for Q3.

- Q1: `(29.99 + 30.99) / 2 = 30.49`
- Median: `(34.99 + 36.99) / 2 = 35.99`
- Q3: `(38.99 + 39.99) / 2 = 39.49`
- Observed range: `24.99 to 44.99`

## Manual price-band membership

| Band | Count | Product IDs |
| --- | ---: | --- |
| Up to 30.49 | 3 | `p09`, `p05`, `p01` |
| >30.49 to 35.99 | 3 | `p11`, `p04`, `p02` |
| >35.99 to 39.49 | 3 | `p07`, `p10`, `p12` |
| >39.49 | 3 | `p03`, `p08`, `p06` |

The four counts sum to 12, and every included product ID appears exactly once.

## Browser comparison

At `1440 x 900` on the local Category Overview, the observed median was `$35.99`, the observed price range was `$24.99 – $44.99`, the visible scale was `0 to 12 products in this sample`, and the four displayed price bands each contained `3 / 12 products`. Expanded Calculation evidence displayed cut points `30.49`, `35.99`, and `39.49` and the same contributing product IDs listed above.

Result: the manual calculation matched the application output for the synthetic Demo fixture at the recorded starting commit.

## Limitations

- The Demo fixture is synthetic and is not a current marketplace scrape.
- The check validates deterministic calculation and traceability for this fixture only.
- Review counts remain review counts and are not sales.
- The result does not establish wider-market coverage, commercial attractiveness, profitability, or purchase advice.
```

Only write the successful Browser comparison and Result sentences after observing every stated value. If any value differs, do not claim a match; stop and report the mismatch.

- [ ] **Step 2: Replace the obsolete Visual workflow text in README**

Replace the two current paragraphs under `## Visual workflow` with:

```markdown
Mercata Lens uses a local Light Slate research workspace. Home shows the active evidence source, descriptive record counts, observed price range, provided-brand-label count, evidence readiness, and a compact price distribution when Category evidence is available. Data quality keeps the latest import attempt separate from the active valid dataset, so a rejected upload cannot appear to replace current research.

Category Overview renders tested descriptive statistics for the active local sample: median and observed price range, sample-relative price bands, rating and displayed review-count bands, represented brand labels, attribute coverage, contributing product IDs, cut points, source boundaries, and limitations. The independent Demo calculation is recorded in [`docs/evidence/manual-category-check.md`](docs/evidence/manual-category-check.md).

Customer pain points, economics, opportunity scoring, and final decision logic remain unimplemented. The current category statistics do not establish wider-market coverage, sales, demand, profitability, or purchase advice.
```

- [ ] **Step 3: Reconcile README project structure**

In `## Product boundary`, replace the current backend/login/cloud bullet with:

```markdown
- This product has **no backend**, **no login**, and **no cloud database**. Data processing happens in browser memory for the current session and is not persisted.
```

This must not describe in-memory session state as saved data.

Under `src/domain/`, add:

```text
│   └── category.ts          # traceable descriptive category analysis
```

Adjust the existing tree connectors so all domain entries remain valid. Under `src/components/`, add:

```text
│   ├── MetricCard.tsx       # descriptive category metric
│   ├── SampleDistribution.tsx # exact-count sample bands
│   ├── DataSourceBadge.tsx  # category-analysis source boundary
│   ├── EvidenceDrawer.tsx   # native calculation disclosure
```

Do not remove the existing data-quality components.

- [ ] **Step 4: Reconcile the Demo and status descriptions**

Replace the paragraph after `Open the printed local URL` under `## Running the demo data` with:

```markdown
Open the printed local URL. Home shows the synthetic Demo source, 12 products, 76 review evidence records, observed price range, represented brand-label count, observation date, and compact price distribution. Category Overview exposes the corresponding descriptive statistics, exact sample denominators, contributing product IDs, cut points, and limitations.
```

Replace the final sentence under `## License and status` with:

```markdown
Category statistics and traceability are implemented for the active local sample. Customer pain points, economics, opportunity scoring, decision logic, AI, backend services, persistence, scraping, and production validation remain unimplemented.
```

- [ ] **Step 5: Check documentation truth and links**

Run:

```bash
test -f docs/evidence/manual-category-check.md
rg -n "manual-category-check|Category Overview|Customer pain points|review count|synthetic" README.md docs/evidence/manual-category-check.md
rg -n "Price distribution, brand structure, rating distribution.*remain unavailable|Data, statistics, CSV import.*land in later" README.md
git diff --check
```

Expected:

- the evidence file exists;
- the first search finds the new truthful descriptions;
- the obsolete-text search exits `1` with no matches;
- `git diff --check` exits `0`.

## Task 4: Run the final gate and create the implementation commit

**Files:**

- Verify: `src/components/EvidenceDrawer.test.tsx`
- Verify: `docs/evidence/manual-category-check.md`
- Verify: `README.md`

**Interfaces:**

- Consumes: completed Tasks 1–3.
- Produces: one reviewable Task 4C implementation commit and a clean worktree.

- [ ] **Step 1: Run focused acceptance tests**

Run:

```bash
pnpm vitest run \
  src/components/SampleDistribution.test.tsx \
  src/components/EvidenceDrawer.test.tsx \
  src/components/DataSourceBadge.test.tsx \
  src/pages/CategoryPage.test.tsx \
  src/pages/HomePage.test.tsx \
  src/research/ResearchLayout.test.tsx \
  src/app/routes.test.tsx
```

Expected: all files and tests pass.

- [ ] **Step 2: Run the full repository gate**

Run in this order:

```bash
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

Expected: every command exits `0`. Frozen installation occurs after behavior verification and does not change the lockfile.

- [ ] **Step 3: Verify exact scope**

Run:

```bash
git diff --name-status
git status --short
```

Expected changed paths:

```text
A docs/evidence/manual-category-check.md
M README.md
M src/components/EvidenceDrawer.test.tsx
```

Ordering may differ. No runtime TS/TSX, CSS, domain, data, Context, fixture, Demo, dependency, or lock file may appear.

- [ ] **Step 4: Create one ordinary Task 4C commit**

Run:

```bash
git add \
  docs/evidence/manual-category-check.md \
  README.md \
  src/components/EvidenceDrawer.test.tsx
git diff --cached --check
git commit -m "test: complete category acceptance"
```

Do not amend, push, deploy, or create a pull request.

- [ ] **Step 5: Confirm the stopping point**

Run:

```bash
git status --short --branch
git rev-parse HEAD
```

Expected: clean `main` worktree and one new ordinary commit. Stop without starting Task 5.
