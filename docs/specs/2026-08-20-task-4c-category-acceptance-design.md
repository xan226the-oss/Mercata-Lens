# Mercata Lens Task 4C: Category Acceptance Design

- Date: 2026-08-20
- Approved base HEAD: `9acd48bdf36d6a3d5681b0aa6c74fe45e85523cf`
- Product task: Task 4, Traceable Category Overview
- This document covers: Task 4C final responsive, accessibility, manual-calculation, README, and visual acceptance

## 1. Goal

Close Product Task 4 with evidence that the shipped Task 4A analysis and Task 4B interface are traceable, usable, responsive, and accurately documented. Task 4C is an acceptance task. It does not add another analysis capability or change any category statistic.

Task 4C produces two kinds of evidence:

1. repository evidence: focused semantic tests, a written manual calculation, and an accurate README;
2. observed evidence: real-browser checks at the approved desktop, intermediate, and mobile viewports.

## 2. Current approved baseline

The approved baseline already provides:

- `analyzeCategory(dataset)` as the only category-analysis source of truth;
- Home metrics and a compact price distribution derived from the active dataset;
- a Category Overview with source, status, four metrics, three distributions, represented brand labels, attribute coverage, calculation evidence, and limitations;
- Demo and user-upload provenance;
- evidence-gated route behavior;
- native `progress` and `details` elements;
- focused and full automated coverage for category calculations and page integration.

Task 4C must verify this baseline rather than recreate it.

## 3. Scope boundary

Task 4C may:

- create `docs/evidence/manual-category-check.md`;
- update `README.md` so it describes the current Category capability and remaining product boundaries;
- strengthen existing Category presentation tests only where a real semantic contract is missing;
- make a minimal `src/app/styles.css` correction only when a real target-viewport or focus defect is reproduced and documented;
- run real-browser acceptance and report which states were observed versus proved only through automated tests.

Task 4C must not:

- modify category statistics, quartiles, band membership, brand grouping, coverage, evidence, limitations, or status thresholds;
- modify `ResearchContext`, CSV parsing, quality gates, route availability, Demo data, fixtures, dependencies, or the lockfile;
- create a manual-calculation feature, new route, new component, chart library, export flow, or persisted audit record in the product;
- implement pain-point extraction, human correction controls, economics, opportunity scoring, decisions, AI, scraping, external APIs, backend, login, cloud storage, analytics, deployment, or Task 5.

If acceptance reveals a defect that requires a TS or TSX runtime change, WorkBuddy must stop and report the exact reproduction and proposed file. It may not enlarge the task autonomously.

## 4. Manual category calculation evidence

### 4.1 Evidence location

The manual check is a repository document at:

`docs/evidence/manual-category-check.md`

README contains only a concise description and link. The product UI does not gain a manual-calculation mode.

### 4.2 Source and reproducibility

The check uses the 12 synthetic products in `public/demo/products.csv` at the Task 4C starting commit. It must identify:

- the exact Git commit checked;
- the source file;
- all 12 product IDs and observed prices used;
- the sorting and median/quartile rule;
- the expected app output;
- the real browser observation used for comparison;
- the fact that the fixture is synthetic and the result describes only this comparison sample.

The ascending prices are:

```text
p09 24.99
p05 27.99
p01 29.99
p11 30.99
p04 32.99
p02 34.99
p07 36.99
p10 37.99
p12 38.99
p03 39.99
p08 41.99
p06 44.99
```

Using the approved Task 4A median-of-halves rule:

- Q1 = `(29.99 + 30.99) / 2 = 30.49`;
- median = `(34.99 + 36.99) / 2 = 35.99`;
- Q3 = `(38.99 + 39.99) / 2 = 39.49`.

The expected price bands are:

| Band | Count | Product IDs |
| --- | ---: | --- |
| Up to 30.49 | 3 | `p09`, `p05`, `p01` |
| >30.49 to 35.99 | 3 | `p11`, `p04`, `p02` |
| >35.99 to 39.49 | 3 | `p07`, `p10`, `p12` |
| >39.49 | 3 | `p03`, `p08`, `p06` |

The document must compare these values with the Category metric, distribution rows, scale statement, and expanded calculation evidence. A mismatch is a failed acceptance result; it must not be explained away or silently edited in the evidence document.

## 5. Accessibility acceptance

### 5.1 Automated semantic contracts

Existing tests are reviewed before any assertion is added. Task 4C adds tests only for missing contracts. The final focused coverage must establish:

- Category has a single level-one page heading and named analysis sections;
- each distribution has a visible title, description, exact count, real denominator, and accessible progress name;
- fixed zero-count rating and review-count bands remain present;
- the calculation disclosure uses native `details` and `summary` semantics and changes open state when activated;
- source and limitation text remains visible rather than tooltip-only;
- Demo and user-upload states remain distinguishable;
- locked Category behavior remains protected by the existing route tests.

An assertion that is already GREEN is reported as coverage confirmation, not a fabricated RED. Task 4C does not introduce an accessibility dependency.

### 5.2 Real keyboard acceptance

At both desktop and 390px width, verify with real keyboard input:

- available navigation links and the Home-to-Category link receive focus;
- the calculation summary receives focus and toggles with keyboard activation;
- the focus indicator is visually discernible;
- file inputs and the import button remain reachable on Home;
- no locked step becomes interactive.

The delivery report records the tested interaction and observed result. DOM presence alone is not keyboard evidence.

## 6. Responsive and visual acceptance

Use a real browser with explicit viewport overrides:

### 6.1 `1440 x 900`

- the Light Slate sidebar remains visible and does not overlap content;
- Home metrics remain a readable four-column strip;
- Home evidence and next-analysis areas retain their intended hierarchy;
- Category metrics remain four columns;
- Category distributions, brand rows, coverage rows, and evidence disclosure are readable;
- the page has no horizontal overflow.

### 6.2 `900 x 900`

- the shell switches to the approved single-column layout;
- navigation, Home analysis, and Category distribution grids reflow without overlap;
- Category metrics use two columns;
- the page has no horizontal overflow.

### 6.3 `390 x 844`

- navigation remains usable in its compact layout;
- Home and Category metrics use one column;
- distribution labels, counts, percentages, progress indicators, product-ID evidence, and limitation copy wrap without clipping;
- the calculation disclosure is operable;
- file inputs and primary controls retain approximately 40px usable height;
- required content does not rely on horizontal scrolling.

### 6.4 Console and server hygiene

Check Home and Category for application runtime errors and warnings, including React key warnings. Resource-only messages such as a favicon request must be reported separately and must not be misrepresented as an application runtime failure.

After acceptance, stop the development server and prove that its port is released. Do not commit screenshots, browser caches, generated build output, or temporary acceptance files.

## 7. States and evidence sources

The final report distinguishes observed browser evidence from automated evidence:

- Demo-ready Home and Category: real browser;
- expanded Category calculation evidence: real browser;
- desktop, intermediate, and mobile responsive behavior: real browser;
- user-upload provenance and changed analysis: automated integration test, plus browser observation only if a local non-sensitive fixture is intentionally uploaded during acceptance;
- low-sample locked Category: existing automated integration and route tests;
- loading and no-active-data states: controlled automated tests unless reproduced in the browser without altering product code;
- rejected import preserving the prior valid analysis: automated integration test, with browser observation optional.

No automated state may be reported as manually observed.

## 8. README reconciliation

README must be brought forward from the pre-Task-4 description. It must accurately state that:

- Category Overview now renders tested descriptive statistics from the active local dataset;
- Home shows the observed price range, provided-brand-label count, and compact price distribution when Category evidence is available;
- price, rating, displayed review count, represented brand labels, and attribute coverage describe only the active sample;
- calculation evidence exposes contributing product IDs and cut points;
- the Demo fixture is synthetic and user uploads retain their own sourcing limitations;
- review count is not sales;
- Customer pain points, economics, opportunity scoring, and final decision logic remain unimplemented;
- the application remains local, with no backend, login, persistence, AI, scraping, or external market API.

Update the project-structure section only as needed to include the shipped category domain and presentation files. Remove statements that now incorrectly say Category statistics remain unavailable. Do not describe acceptance evidence as production validation.

## 9. Correction policy

Acceptance is observe-first:

1. run the existing focused tests;
2. inspect current behavior in the real browser;
3. identify a concrete contract or visual defect;
4. add the smallest applicable test when the defect is testable;
5. modify only an allowed file;
6. rerun the exact reproduction and the full gate.

CSS may change only for a reproduced overflow, wrapping, focus visibility, readable sizing, or control-height defect. Every CSS change must map to a before/after observation in the delivery report. If no CSS defect is found, `src/app/styles.css` remains unchanged.

## 10. Verification gate

Task 4C requires:

- focused Category component/page tests;
- existing Home, layout, and route integration tests relevant to provenance and locked behavior;
- the full test suite;
- production build;
- TypeScript lint command;
- frozen-lockfile installation;
- `git diff --check`;
- strict changed-file and clean-worktree checks;
- real-browser acceptance at all three target viewports;
- manual-calculation comparison recorded in the evidence document.

All required commands must exit successfully. Any incomplete browser state or manual comparison remains an explicit evidence gap and blocks approval.

## 11. Acceptance and stopping point

Task 4C is complete only when:

- the written manual calculation matches the active Demo analysis and browser output;
- required semantic contracts are covered;
- Home and Category pass real responsive and keyboard acceptance;
- README matches the shipped Task 4 capability and its limitations;
- any permitted correction is minimal and evidence-backed;
- the final commit is ordinary and the worktree is clean.

Task 4C closes Product Task 4. Stop after its implementation commit and delivery report. Do not begin Task 5, push, deploy, or create a pull request.
