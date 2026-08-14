# Mercata Lens Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Task 3 engineering interface into the approved Light Slate commercial-analysis experience without changing CSV validation, quality thresholds, route gating, or adding Task 4 analysis.

**Architecture:** Keep `ResearchProvider` and all domain/data modules as the only source of truth. Refresh the existing `ResearchLayout`, extract reusable presentational components from the large page files, and make Home and Data quality render honest view states from the current dataset, quality report, and latest import attempt. Data-dependent Task 4 visuals remain explicit unavailable/next-step states until tested analysis contracts exist.

**Tech Stack:** React 19, TypeScript 5.8, React Router 7, Vite 6, Vitest 3, Testing Library, CSS, locally bundled `@fontsource/lora` and `@fontsource/ibm-plex-sans` font packages.

## Global Constraints

- Project root is exactly `/Users/xanthe/Documents/Mercata Lens`.
- Approved design: `docs/specs/2026-08-14-mercata-lens-visual-refresh-design.md`.
- Starting implementation must include approved Task 3 commit `2376415fe90966d94824ad47b3e69d1a83f97748` and design commit `3ee5e3b0549d196148c97b8b1777bc68adc96076` as ancestors.
- Preserve the completely local and free runtime: font files must be bundled; do not use Google Fonts, remote CSS, or runtime network font requests.
- Do not change `src/data/**`, `src/domain/**`, `ResearchContext` contracts, CSV rules, quality thresholds, or module-availability logic.
- Do not implement price statistics, brand statistics, review-theme extraction, pain-point analysis, economics, opportunity scoring, AI, backend, persistence, Amazon scraping, or APIs.
- Review records are evidence records, never customers or sales.
- Demo data never proves live demand, market size, GMV, market share, or product opportunity.
- Failed imports must continue to preserve the active dataset and quality report.
- `/` and `/quality` stay available; dependent route locking retains Task 3 behaviour.
- Use valid RED → GREEN cycles for each behavioural change; never manufacture RED through a broken test configuration.
- Do not amend existing commits, push, deploy, create a PR, or start Task 4.

---

## File Structure

### Create

- `src/components/PageHeader.tsx` — consistent page title, eyebrow, description, and optional action.
- `src/components/MetricStrip.tsx` — descriptive metric cells; contains no derivation logic.
- `src/components/EvidenceStatus.tsx` — visible Passed/Warning/Blocked evidence-gate rows.
- `src/components/ImportPanel.tsx` — CSV selection, reading, and import controls extracted from Home.
- `src/components/ImportResultSummary.tsx` — compact latest-import summary for Home.
- `src/components/IssueTable.tsx` — full structured diagnostic rendering for Data quality.
- `src/components/ModuleStatus.tsx` — module-availability presentation from `QualityReport`.
- `src/research/ResearchLayout.test.tsx` — shell/source/locking semantics independent of Home.
- `src/components/IssueTable.test.tsx` — accessible desktop-table/mobile-card diagnostic contract.

### Modify

- `package.json` and `pnpm-lock.yaml` — locally bundle the approved fonts.
- `src/main.tsx` — import local font weights.
- `src/research/ResearchLayout.tsx` — light sidebar application shell while preserving gating.
- `src/pages/HomePage.tsx` — overview/evidence/next-action hierarchy using existing data only.
- `src/pages/QualityPage.tsx` — separate latest import attempt from active valid data.
- `src/pages/HomePage.test.tsx` — preserve import behaviour and assert the refreshed hierarchy.
- `src/app/routes.test.tsx` — retain all six route contracts under the refreshed shell.
- `src/app/styles.css` — Light Slate tokens, components, responsive behaviour, and focus styles.
- `README.md` — describe the refreshed UI truthfully; do not claim Task 4 features.

### Must not modify

- `src/data/**`
- `src/domain/**`
- `public/demo/**`
- `src/research/ResearchContext.tsx` unless a newly written test proves an unavoidable presentation-state defect; stop and request review before doing so.

---

### Task 1: Local typography and Light Slate application shell

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/main.tsx`
- Modify: `src/research/ResearchLayout.tsx`
- Modify: `src/app/styles.css`
- Create: `src/research/ResearchLayout.test.tsx`
- Modify: `src/app/routes.test.tsx`

**Interfaces:**
- Consumes: `useResearch(): ResearchContextValue`, `RESEARCH_STEPS`, `ModuleAvailability`.
- Produces: the existing `ResearchLayout({ children }: { children: React.ReactNode })` signature unchanged; stable test IDs `source-badge`, `step-locked-*`, `locked-page`, and `lock-reason` remain available.

- [ ] **Step 1: Record the clean baseline**

Run:

```bash
git rev-parse --show-toplevel
git rev-parse HEAD
git status --short --branch
git merge-base --is-ancestor 2376415fe90966d94824ad47b3e69d1a83f97748 HEAD
git merge-base --is-ancestor 3ee5e3b0549d196148c97b8b1777bc68adc96076 HEAD
```

Expected: exact project root, both ancestor checks exit `0`, and no uncommitted files. If dirty, stop without resetting or deleting anything.

- [ ] **Step 2: Write shell tests before changing markup**

Create `src/research/ResearchLayout.test.tsx` with the real `ResearchProvider`, `MemoryRouter`, and the same fetch-stub pattern used by `HomePage.test.tsx`. Control Demo, loading, and error states through the returned fetch promises; do not export or bypass the private context. The focused assertions must include:

```tsx
expect(screen.getByRole("navigation", { name: "Research steps" })).toBeInTheDocument();
expect(screen.getByTestId("source-badge")).toHaveTextContent("Demo data");
expect(screen.getByText("US market")).toBeInTheDocument();
expect(screen.getByText("Cat Water Fountain")).toBeInTheDocument();
expect(screen.getByText("Review count is not sales")).toBeInTheDocument();
expect(screen.getByRole("link", { name: /Data quality/i })).toHaveAttribute("href", "/quality");
```

Add separate cases for `User upload`, `Loading data`, and `No active data`. Retain a low-sample case asserting a dependent route is non-interactive and a direct locked location renders `locked-page`.

- [ ] **Step 3: Run the focused shell tests and capture valid RED**

Run:

```bash
pnpm vitest run src/research/ResearchLayout.test.tsx src/app/routes.test.tsx
```

Expected: new semantic/header assertions fail because the current horizontal card shell does not expose the approved shell content/structure. Existing route contracts must still compile.

- [ ] **Step 4: Install local font assets**

Run:

```bash
pnpm add @fontsource/lora @fontsource/ibm-plex-sans
```

Then import only the required local weights at the top of `src/main.tsx`:

```ts
import "@fontsource/lora/500.css";
import "@fontsource/lora/600.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
```

Do not add `@import url(...)` or any other remote font request.

- [ ] **Step 5: Reshape `ResearchLayout` without changing gating logic**

Keep `sourceLabel`, `lockReasonFor`, and `moduleStateFor` behaviour. Restructure the returned markup around these stable regions:

```tsx
<div className="app-shell">
  <aside className="app-sidebar">
    <div className="app-brand">
      <span className="app-brand__name">Mercata Lens</span>
      <span className="app-brand__cn">商机镜</span>
    </div>
    <nav className="research-nav" aria-label="Research steps">
      {/* existing available/locked mapping and test IDs */}
    </nav>
    <p className="evidence-rule">Review count is not sales</p>
  </aside>
  <div className="app-workspace">
    <header className="workspace-header">
      <div className="workspace-scope">
        <span>US market</span>
        <span aria-hidden="true">/</span>
        <span>Cat Water Fountain</span>
      </div>
      <span className={`source-badge source-badge--${sourceKind ?? status}`} data-testid="source-badge">
        {sourceLabel}
      </span>
    </header>
    <main className="workspace-main">
      {lockReasonFor(location.pathname) ? <LockedPage reason={lockReasonFor(location.pathname)!} /> : children}
    </main>
    <footer className="workspace-footer">Local, free, evidence-driven research.</footer>
  </div>
</div>
```

`LockedPage` may remain inline or become a private function in the same file. Do not create a new route or change route metadata.

If extracted, use this exact private interface:

```tsx
function LockedPage({ reason }: { reason: string }) {
  return (
    <section className="locked-page" data-testid="locked-page" role="alert">
      <span className="section-kicker">Evidence required</span>
      <h1>Module locked</h1>
      <p>{reason}</p>
    </section>
  );
}
```

- [ ] **Step 6: Replace the visual foundation in `styles.css`**

Define the approved tokens at `:root`:

```css
:root {
  color-scheme: light;
  font-family: "IBM Plex Sans", system-ui, sans-serif;
  --font-display: "Lora", Georgia, serif;
  --color-canvas: #f4f6f8;
  --color-surface: #ffffff;
  --color-surface-subtle: #f8fafb;
  --color-border: #d8e0e6;
  --color-ink: #24313e;
  --color-muted: #687586;
  --color-primary: #376d9e;
  --color-primary-soft: #eaf1f7;
  --color-success: #2e7462;
  --color-warning: #9a6b1f;
  --color-danger: #a4473d;
  --radius-sm: 4px;
  --radius-md: 8px;
  --shadow-subtle: 0 8px 24px rgb(36 49 62 / 8%);
}
```

Implement `.app-shell` as a light `220px / 1fr` grid, a white sidebar, cool-grey workspace, visible active navigation, non-interactive locked navigation, and visible `:focus-visible` outlines. Do not use gradients.

- [ ] **Step 7: Run shell GREEN and regression tests**

Run:

```bash
pnpm vitest run src/research/ResearchLayout.test.tsx src/app/routes.test.tsx src/pages/HomePage.test.tsx
pnpm build
pnpm lint
```

Expected: all pass; source labels and lock behaviour remain unchanged.

- [ ] **Step 8: Commit Task 1**

```bash
git add package.json pnpm-lock.yaml src/main.tsx src/research/ResearchLayout.tsx src/research/ResearchLayout.test.tsx src/app/routes.test.tsx src/app/styles.css
git commit -m "feat: introduce light slate application shell"
```

---

### Task 2: Honest home-page hierarchy and compact import workflow

**Files:**
- Create: `src/components/PageHeader.tsx`
- Create: `src/components/MetricStrip.tsx`
- Create: `src/components/EvidenceStatus.tsx`
- Create: `src/components/ImportPanel.tsx`
- Create: `src/components/ImportResultSummary.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/HomePage.test.tsx`
- Modify: `src/app/styles.css`

**Interfaces:**
- `PageHeaderProps = { eyebrow: string; title: string; description: string; action?: ReactNode; meta?: ReactNode }`.
- `MetricItem = { label: string; value: string | number; note: string }`; `MetricStrip({ items }: { items: MetricItem[] })`.
- `EvidenceGate = { id: string; label: string; status: "passed" | "warning" | "blocked"; detail: string }`; `EvidenceStatus({ gates }: { gates: EvidenceGate[] })`.
- `ImportPanel({ importCsv }: { importCsv: (productsText: string, reviewsText: string) => void })` preserves `Products CSV`, `Reviews CSV`, `products-file-name`, `reviews-file-name`, `import-button`, and `import-file-error` contracts.
- `ImportResultSummary` consumes `ImportOutcomeState` plus current source label and renders only a concise Home summary.

- [ ] **Step 1: Strengthen Home tests for the approved hierarchy**

Add assertions to `HomePage.test.tsx` for the Demo-ready state:

```tsx
expect(screen.getByRole("heading", { name: "Cat Water Fountain research" })).toBeInTheDocument();
expect(screen.getByTestId("metric-products")).toHaveTextContent("12");
expect(screen.getByTestId("metric-reviews")).toHaveTextContent("76");
expect(screen.getByTestId("metric-reviews")).toHaveTextContent(/evidence records/i);
expect(screen.getByTestId("metric-source")).toHaveTextContent("Demo data");
expect(screen.getByTestId("category-analysis-next-step")).toHaveTextContent(/available in Category overview/i);
expect(screen.queryByTestId("price-distribution-chart")).not.toBeInTheDocument();
```

Update the failed-import Home assertion to require a compact summary and prohibit the full diagnostic list:

```tsx
const summary = await screen.findByTestId("import-error");
expect(summary).toHaveTextContent("3 blocking issues");
expect(summary).toHaveTextContent("Current Demo data was not replaced");
expect(summary).not.toHaveTextContent("products row 4");
expect(screen.getByRole("link", { name: /Review data quality/i })).toHaveAttribute("href", "/quality");
```

- [ ] **Step 2: Run Home tests and capture RED**

Run:

```bash
pnpm vitest run src/pages/HomePage.test.tsx
```

Expected: new hierarchy and compact-summary assertions fail against the current text-heavy page.

- [ ] **Step 3: Create the pure presentational components**

Implement `PageHeader`, `MetricStrip`, and `EvidenceStatus` without importing `ResearchContext` or domain functions. `MetricStrip` must attach `data-testid={`metric-${item.id}`}`; therefore use this exact item contract:

```ts
export interface MetricItem {
  id: "products" | "reviews" | "source" | "updated";
  label: string;
  value: string | number;
  note: string;
}
```

The evidence component renders text plus an icon for each state:

```tsx
<li className={`evidence-gate evidence-gate--${gate.status}`} data-testid={`evidence-${gate.id}`}>
  <span className="evidence-gate__icon" aria-hidden="true">
    {gate.status === "passed" ? "✓" : gate.status === "warning" ? "!" : "×"}
  </span>
  <span><strong>{gate.label}</strong><small>{gate.detail}</small></span>
  <span className="evidence-gate__state">{gate.status}</span>
</li>
```

- [ ] **Step 4: Extract `ImportPanel` while preserving import behaviour**

Store the actual selected `File`, not a name-only object or a later DOM lookup:

```tsx
const [productsFile, setProductsFile] = useState<File | null>(null);
const [reviewsFile, setReviewsFile] = useState<File | null>(null);

async function onImport() {
  if (!productsFile || !reviewsFile || fileError) return;
  try {
    const [productsText, reviewsText] = await Promise.all([
      readFileAsText(productsFile),
      readFileAsText(reviewsFile),
    ]);
    importCsv(productsText, reviewsText);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    setFileError(`Failed to read files: ${message}`);
  }
}
```

Keep the existing `.csv` filename guard, accessible labels, disabled-button rule, sample download links, and exact button text.

- [ ] **Step 5: Implement compact latest-import summary**

`ImportResultSummary` renders nothing before an attempt. On failure it renders:

```tsx
<StatusBanner
  tone="error"
  text={`Import failed · ${state.issues.length} blocking issues · Current ${sourceLabel} was not replaced.`}
  data-testid="import-error"
>
  <Link to="/quality">Review data quality</Link>
</StatusBanner>
```

Do not map issue rows on Home. On success, show source, product count, review count, and import time without claiming market validity.

- [ ] **Step 6: Recompose `HomePage` using existing evidence only**

Use the current context fields and derive the display-only source label exactly once:

```ts
const sourceLabel =
  sourceKind === "demo"
    ? "Demo data"
    : sourceKind === "user_upload"
      ? "User upload"
      : status === "loading"
        ? "Loading data"
        : "No active data";
```

Render these metrics:

```ts
const metrics: MetricItem[] = dataset
  ? [
      { id: "products", label: "Products reviewed", value: dataset.products.length, note: "Active comparison set" },
      { id: "reviews", label: "Review evidence", value: dataset.reviews.length, note: "Evidence records — not sales" },
      { id: "source", label: "Data source", value: sourceLabel, note: "Current active research" },
      { id: "updated", label: "Imported", value: new Date(dataset.importedAt).toLocaleDateString(), note: "Check observation dates before use" },
    ]
  : [];
```

Build evidence gates directly from `qualityReport.moduleAvailability` and summary counts; do not recalculate thresholds. Use an honest next-step panel:

```ts
const productBlocking = qualityReport.blockingIssues.some((issue) => issue.file === "products");
const reviewBlocking = qualityReport.blockingIssues.some((issue) => issue.file === "reviews");
const gates: EvidenceGate[] = [
  {
    id: "identity",
    label: "Identity and references",
    status: productBlocking || reviewBlocking ? "blocked" : "passed",
    detail: productBlocking || reviewBlocking ? "Resolve blocking record issues" : "No identity or reference blocks",
  },
  {
    id: "category-sample",
    label: "Category sample",
    status: productBlocking
      ? "blocked"
      : qualityReport.moduleAvailability.category === "available"
        ? "passed"
        : "warning",
    detail: `${qualityReport.summary.validProducts} valid products`,
  },
  {
    id: "review-sample",
    label: "Review sample",
    status: reviewBlocking
      ? "blocked"
      : qualityReport.moduleAvailability.pain_points === "available"
        ? "passed"
        : "warning",
    detail: `${qualityReport.summary.validReviews} valid review records`,
  },
];
```

This mapping presents existing quality results; it does not introduce new thresholds.

Use an honest next-step panel:

```tsx
<section className="analysis-next-step" data-testid="category-analysis-next-step">
  <span className="section-kicker">Next analysis</span>
  <h2>Price landscape and brand structure</h2>
  <p>Available in Category overview after its tested analysis module is implemented.</p>
  <Link to="/category">Open Category overview</Link>
</section>
```

If `/category` is locked, render the missing-evidence explanation instead of an active link. Do not render price bars, brand counts, or extracted themes.

- [ ] **Step 7: Add Home styles and responsive rules**

Implement `.page-header`, `.metric-strip`, `.metric-item`, `.home-analysis-grid`, `.analysis-next-step`, `.evidence-gates`, `.import-panel`, and `.import-result-summary`. At `max-width: 900px`, stack analysis panels and use two metric columns; at `max-width: 560px`, use one metric column.

- [ ] **Step 8: Run Home GREEN and regressions**

```bash
pnpm vitest run src/pages/HomePage.test.tsx src/research/ResearchLayout.test.tsx src/app/routes.test.tsx
pnpm test -- --run
pnpm build
pnpm lint
```

Expected: all pass; no data/domain files changed.

- [ ] **Step 9: Commit Task 2**

```bash
git add src/components/PageHeader.tsx src/components/MetricStrip.tsx src/components/EvidenceStatus.tsx src/components/ImportPanel.tsx src/components/ImportResultSummary.tsx src/pages/HomePage.tsx src/pages/HomePage.test.tsx src/app/styles.css
git commit -m "feat: reshape the research home experience"
```

---

### Task 3: Separate import diagnostics from active-data quality

**Files:**
- Create: `src/components/IssueTable.tsx`
- Create: `src/components/IssueTable.test.tsx`
- Create: `src/components/ModuleStatus.tsx`
- Modify: `src/pages/QualityPage.tsx`
- Modify: `src/pages/HomePage.test.tsx`
- Modify: `src/app/styles.css`

**Interfaces:**
- `IssueTable({ issues, caption }: { issues: ParseIssue[]; caption: string })` renders every issue exactly once.
- `ModuleStatus({ availability }: { availability: QualityReport["moduleAvailability"] })` uses the existing four-module contract and does not derive availability.
- Quality retains `latest-import-failure`, `module-category`, `module-pain_points`, and `module-opportunities` test IDs.

- [ ] **Step 1: Write focused IssueTable and Quality separation tests**

In `IssueTable.test.tsx`, use three issues covering products/reviews and assert:

```tsx
import { render, screen, within } from "@testing-library/react";

expect(screen.getByRole("table", { name: "Latest import issues" })).toBeInTheDocument();
expect(screen.getAllByTestId("issue-row")).toHaveLength(3);
const ratingRow = screen.getAllByTestId("issue-row")[0];
expect(within(ratingRow).getByText("Products")).toBeInTheDocument();
expect(within(ratingRow).getByText("4")).toBeInTheDocument();
expect(within(ratingRow).getByText("rating")).toBeInTheDocument();
expect(within(ratingRow).getByText('"bad"')).toBeInTheDocument();
expect(within(ratingRow).getByText("Rating must be a plain number.")).toBeInTheDocument();
```

Extend the real-route failed-import test in `HomePage.test.tsx`:

```tsx
expect(screen.getByTestId("latest-import-attempt")).toHaveTextContent("3 blocking issues");
expect(screen.getByTestId("active-data-quality")).toHaveTextContent("Demo data");
expect(screen.getByTestId("active-data-quality")).toHaveTextContent("12");
expect(within(screen.getByTestId("active-data-quality")).getByText(/No blocking issues in the active dataset/i)).toBeInTheDocument();
```

The test must demonstrate that the red failed attempt and the valid active dataset are in different labelled regions.

- [ ] **Step 2: Run focused tests and capture RED**

```bash
pnpm vitest run src/components/IssueTable.test.tsx src/pages/HomePage.test.tsx
```

Expected: missing IssueTable and region test IDs fail for the intended behaviour.

- [ ] **Step 3: Implement `IssueTable` with desktop and mobile representations**

Render one semantic table. On narrow screens, CSS converts each table row into a card-like grid while preserving the same DOM, data, caption, and column semantics. Do not duplicate the issues into a second hidden list.

```tsx
function displayFile(file: ParseIssue["file"]): string {
  return file === "products" ? "Products" : file === "reviews" ? "Reviews" : "Unknown";
}

function displayValue(value: unknown): string {
  return value === undefined ? "—" : JSON.stringify(value);
}
```

Table columns are File, Row, Field, Bad value, and Reason. Give each body row `data-testid="issue-row"`. Give every `<td>` a `data-label` matching its heading so the narrow-screen CSS can display that label inside the card row.

- [ ] **Step 4: Implement `ModuleStatus` from existing availability**

Use the fixed labels:

```ts
const MODULE_LABEL = {
  category: "Category overview",
  pain_points: "Customer pain points",
  economics: "Economics",
  opportunities: "Opportunity comparison",
} satisfies Record<AnalysisModule, string>;
```

Render state text and reason; do not use emoji as the only signal and do not calculate status locally.

- [ ] **Step 5: Recompose `QualityPage` into two explicit sections**

The order must be:

```tsx
<PageHeader eyebrow="Evidence control" title="Data quality" description="Validate evidence before analysis." />

<section aria-labelledby="latest-import-title" data-testid="latest-import-attempt">
  {/* latest import success, failure with IssueTable, or no attempt */}
</section>

<section aria-labelledby="active-quality-title" data-testid="active-data-quality">
  {/* source, valid counts, active blocking/warnings, evidence gates */}
</section>

<ModuleStatus availability={qualityReport.moduleAvailability} />
```

If no active dataset exists, latest import diagnostics still render when available and the active-data section says `No active research data`. If an import failed while Demo remains active, the failed-attempt section must never use the active dataset's green status.

- [ ] **Step 6: Add Quality and IssueTable styles**

Use a compact import-result strip, a white active-data panel, and a restrained table. At `max-width: 680px`, style `thead` as visually hidden and each `tbody tr` as a card grid; use `td::before { content: attr(data-label); }` to retain all five visible labels. Error colour appears only in the failed-attempt region and issue state, not across the whole page.

- [ ] **Step 7: Run Quality GREEN and full regressions**

```bash
pnpm vitest run src/components/IssueTable.test.tsx src/pages/HomePage.test.tsx src/research/ResearchLayout.test.tsx
pnpm test -- --run
pnpm build
pnpm lint
```

Expected: all pass; the existing three-error bad CSV remains fully visible on Quality and compact on Home.

- [ ] **Step 8: Commit Task 3**

```bash
git add src/components/IssueTable.tsx src/components/IssueTable.test.tsx src/components/ModuleStatus.tsx src/pages/QualityPage.tsx src/pages/HomePage.test.tsx src/app/styles.css
git commit -m "feat: clarify data quality evidence states"
```

---

### Task 4: Responsive, accessibility, documentation, and visual acceptance

**Files:**
- Modify: `src/app/styles.css`
- Modify: `src/research/ResearchLayout.test.tsx`
- Modify: `src/pages/HomePage.test.tsx`
- Modify: `src/components/IssueTable.test.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes all components from Tasks 1–3.
- Produces no new business or data interfaces; this task closes the visual-refresh acceptance gate.

- [ ] **Step 1: Add final accessibility assertions**

Add focused assertions for:

```tsx
expect(screen.getByRole("main")).toBeInTheDocument();
expect(screen.getByRole("navigation", { name: "Research steps" })).toBeInTheDocument();
expect(screen.getByRole("alert")).toHaveTextContent(/Import failed/i);
expect(screen.getByTestId("step-locked-/category")).toHaveAttribute("aria-disabled", "true");
expect(screen.queryByRole("link", { name: /Category overview/i })).not.toBeInTheDocument();
```

Also assert each source state has visible text and that issue diagnostics expose a caption and column headings.

- [ ] **Step 2: Run accessibility-focused tests and capture any valid RED**

```bash
pnpm vitest run src/research/ResearchLayout.test.tsx src/pages/HomePage.test.tsx src/components/IssueTable.test.tsx
```

Expected: any missing landmark, label, caption, or disabled semantic fails. If the tests are already GREEN, report them honestly as coverage additions rather than fabricated implementation RED.

- [ ] **Step 3: Complete responsive CSS**

Add these breakpoints and behaviours:

```css
@media (max-width: 900px) {
  .app-shell { grid-template-columns: 1fr; }
  .app-sidebar { position: static; border-right: 0; border-bottom: 1px solid var(--color-border); }
  .research-nav { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .home-analysis-grid { grid-template-columns: 1fr; }
  .metric-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 560px) {
  .research-nav { grid-template-columns: 1fr 1fr; }
  .metric-strip { grid-template-columns: 1fr; }
  .workspace-main { padding: 18px 14px 32px; }
}

@media (max-width: 680px) {
  .issue-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .issue-table tbody, .issue-table tr, .issue-table td { display: block; width: 100%; }
  .issue-table tr { border: 1px solid var(--color-border); padding: 12px; }
  .issue-table td::before { content: attr(data-label); display: block; color: var(--color-muted); font-size: 0.75rem; }
}
```

Ensure controls have at least `40px` usable height, focus outlines are not removed, and no required content depends on horizontal scrolling.

- [ ] **Step 4: Perform manual desktop and narrow-screen acceptance**

Start the app:

```bash
pnpm dev
```

Verify at approximately `1440×900` and `390×844`:

- Demo-ready Home;
- loading/no-data source label by controlled test evidence;
- failed import summary on Home;
- full three-issue diagnostics on Quality;
- low-sample locked navigation;
- desktop IssueTable and narrow issue cards;
- no price chart, brand count, or extracted pain-point claim before Task 4.

Record exact observations in the delivery report. Stop the server and prove the port is released.

- [ ] **Step 5: Update README truthfully**

Add a **Visual workflow** section that states:

```markdown
## Visual workflow

Mercata Lens uses a local Light Slate research workspace. The home page shows the active evidence source, descriptive record counts, evidence readiness, and the next available research step. Data quality separates the latest import attempt from the active valid dataset so a rejected upload cannot appear to replace or validate the current research.

Price distribution, brand structure, review themes, economics, and opportunity scoring are not part of the visual-refresh task. They remain unavailable until their analysis tasks provide tested contracts.
```

- [ ] **Step 6: Run the final verification gate**

```bash
pnpm vitest run src/research/ResearchLayout.test.tsx src/pages/HomePage.test.tsx src/components/IssueTable.test.tsx src/app/routes.test.tsx
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

Expected: every command exits `0`; no domain/data files changed; no dev server remains.

- [ ] **Step 7: Commit Task 4**

```bash
git add src/app/styles.css src/research/ResearchLayout.test.tsx src/pages/HomePage.test.tsx src/components/IssueTable.test.tsx README.md
git commit -m "test: verify visual refresh states"
```

- [ ] **Step 8: Produce the final delivery report**

Report:

- starting and final HEAD;
- every commit and changed file;
- valid RED and GREEN evidence per task;
- focused and full verification output;
- desktop and narrow-screen observations;
- confirmation that Task 3 behaviour remains intact;
- confirmation that no Task 4 analysis, AI, backend, persistence, scraping, push, deployment, or PR was added;
- final `git status --short --branch`.

Do not claim completion if the worktree is dirty or any required verification did not run successfully.
