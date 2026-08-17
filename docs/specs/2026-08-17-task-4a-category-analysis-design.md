# Mercata Lens Task 4A: Traceable Category Analysis Design

- Date: 2026-08-17
- Approved base HEAD: `84b85bab87986a173f03a9e3abd485e39711aac9`
- Product task: Task 4, Traceable Category Overview
- This document covers: Task 4A domain analysis only

## 1. Delivery sequence

Product Task 4 is split into three independently reviewed changes:

1. Task 4A: deterministic category-analysis contracts and tests;
2. Task 4B: Category Overview UI and honest Home-page metric integration;
3. Task 4C: responsive, accessibility, manual-calculation evidence, documentation, and final visual acceptance.

Each subtask receives its own WorkBuddy task sheet, ordinary commit, and Codex review. Task 4B cannot start until Task 4A is approved. Task 4C cannot start until Task 4B is approved. Task 5 pain-point analysis remains out of scope throughout Task 4.

## 2. Task 4A goal

Create a pure, deterministic `analyzeCategory(dataset): CategoryAnalysis` domain function that describes only the products present in the active `ResearchDataset`. The result must expose the inputs and boundaries behind every statistic so later UI work can show traceable evidence.

Task 4A does not render or alter any page. It does not infer demand, competition, sales, market share, a recommended launch price, profitability, or purchasing advice.

## 3. Files and boundaries

Task 4A may:

- create `src/domain/category.ts`;
- create `src/domain/category.test.ts`;
- import existing domain types and existing deterministic test fixtures;
- minimally extend `src/domain/types.ts` only if shared exported contracts cannot be kept cleanly in `category.ts`.

Task 4A must not modify:

- `src/pages/**`;
- `src/components/**`;
- `src/research/**`;
- `src/data/**`;
- `src/app/**`;
- Demo CSV files, CSV parsing, or quality-gate behavior;
- README or visual documentation;
- dependencies or the lockfile.

It must not add persistence, a backend, scraping, external APIs, AI, pain-point rules, economics, opportunity scoring, or decision logic.

## 4. Analysis contract

`CategoryAnalysis` must provide at least:

- `productCount`;
- `medianPrice`;
- `priceRange`;
- `priceQuartiles`;
- `priceBands`;
- `ratingBands`;
- `reviewCountBands`;
- `missingReviewCount`;
- `brandShares`;
- `attributeCoverage`;
- `evidence`;
- `limitations`;
- `status`;
- `statusReasons`.

The implementation may choose exact TypeScript shapes, but every band and brand row must contain its count, share or denominator where applicable, and contributing product IDs. The top-level evidence must list all included product IDs and any excluded IDs with a reason. Task 4A must not silently drop a product.

All shares remain raw numeric fractions in the domain result. Formatting and rounding belong to Task 4B. Input records and arrays must not be mutated.

## 5. Exact statistical rules

### 5.1 Product count and prices

- `productCount` is `dataset.products.length`.
- Every valid product contributes its already-parsed finite `priceUsd`.
- Prices are sorted numerically only in a copied array.
- Odd median: the middle value.
- Even median: arithmetic mean of the two middle values.
- Empty dataset: `medianPrice` and price-range values are `null`; quartiles are `null`; `priceBands` is empty.
- Domain values are not rounded.

### 5.2 Quartiles and price bands

Quartiles use the existing quality-gate convention:

- split the sorted values into lower and upper halves;
- when the count is odd, exclude the overall median from both halves;
- Q1 is the median of the lower half;
- Q3 is the median of the upper half;
- for a single-price sample, Q1, median, and Q3 all equal that price.

Price bands are sample-relative and derived from Q1, median, and Q3:

- sort and deduplicate the three cut points;
- create ordered intervals ending at each cut point;
- membership uses an exclusive lower boundary and inclusive upper boundary;
- create a final open-ended interval only when observed prices exceed the last cut point;
- omit empty intervals;
- return no more than four bands;
- expose every numeric boundary and contributing product ID.

Consequences that must be tested:

- all band counts sum to `productCount`;
- boundary values appear in exactly one band;
- repeated quartile boundaries do not create duplicate or misleading bands;
- an all-same-price sample produces one band containing every product.

These are observed comparison-set bands. They are not market price bands and do not establish a recommended selling price.

### 5.3 Rating bands

Use these fixed descriptive intervals:

- `below_3`: rating below `3.0`;
- `3_to_below_4`: rating from `3.0` inclusive to `4.0` exclusive;
- `4_to_below_4_5`: rating from `4.0` inclusive to `4.5` exclusive;
- `4_5_to_5`: rating from `4.5` inclusive through `5.0` inclusive.

Each product appears in exactly one rating band. The thresholds are explicit product rules, not industry standards.

### 5.4 Review-count bands

Use these fixed descriptive intervals for non-null `reviewCount` values:

- `zero`: exactly `0`;
- `1_to_99`: `1` through `99`;
- `100_to_499`: `100` through `499`;
- `500_plus`: `500` and above.

Products with `reviewCount: null` are excluded from the bands and counted in `missingReviewCount`. Band counts plus `missingReviewCount` must equal `productCount`.

`reviewCount` means a displayed review count only. It must never be relabelled or interpreted as sales, customers, demand, velocity, or market share.

### 5.5 Brand shares

- Normalize only by trimming surrounding whitespace; do not merge spelling variants or change case.
- Group non-empty brand values by exact trimmed value.
- Missing or whitespace-only values form one explicit `not_provided` group.
- Every group uses all products as its denominator.
- `share = count / productCount`; for no products, return an empty array rather than `NaN`.
- Order by descending count, then by stable lexical label for ties.
- Each group exposes its contributing product IDs.

The result is represented brand share in the current sample, never market share or brand concentration in the broader market.

### 5.6 Attribute coverage

Calculate coverage for exactly:

- `brand`;
- `material`;
- `capacity`;
- `filterCost`;
- `reviewCount`.

Strings count as present only after trimming to a non-empty value. Numeric zero counts as present. For each attribute return present count, missing count, total count, raw fraction, present product IDs, and missing product IDs. With no products, coverage is `null`, not `NaN` or an invented zero-percent claim.

## 6. Evidence and limitations

The result must make calculation provenance inspectable without re-running hidden logic:

- all included product IDs;
- excluded product IDs and explicit reasons, if any;
- per-band and per-group product IDs;
- observed source kind and category;
- exact price cut points;
- denominators for shares and coverage.

Limitations are deterministic statements derived from the dataset, including when applicable:

- the analysis describes only the current sample;
- Demo data is synthetic and cannot establish a real market pattern;
- user-uploaded data retains its own sourcing limitations;
- review counts are not sales;
- missing brand or attribute values reduce coverage;
- small samples limit interpretation.

No limitation text may claim that a real market, Amazon, customer demand, or competition level was measured.

## 7. Status rule

Task 4A reuses the approved category-availability threshold:

- fewer than 3 products: `insufficient_evidence`;
- 3 or more products: `continue_research`.

`continue_research` means only that the validated sample is large enough to inspect the descriptive category overview. It does not mean the category is commercially attractive.

Task 4A does not emit `pause`. No approved descriptive-statistics rule currently justifies a negative commercial decision. The union may retain `pause` for later decision work, but tests must prevent Task 4A from inventing a pause threshold.

## 8. Required tests

Tests must be written before implementation and demonstrate RED for missing behavior. At minimum cover:

- the approved fixed six-product fixture with `medianPrice === 29.5`;
- six price-band counts summing to six;
- a brand represented by two of six products returning count `2` and share `2 / 6`;
- odd and even medians;
- empty, one-product, two-product, and three-product datasets;
- all-same-price and repeated-boundary samples;
- each exact rating boundary;
- each exact review-count boundary;
- null review-count exclusion and missing count;
- missing brand as an explicit group;
- numeric zero as present attribute data;
- coverage product IDs and denominators;
- stable ordering for tied brand counts;
- product-ID evidence for every band/group;
- Demo and user-upload limitation differences;
- `insufficient_evidence` below three products and `continue_research` at three;
- no input mutation;
- no `NaN`, `Infinity`, or fabricated fallback values.

Focused tests, the complete test suite, TypeScript build, lint, frozen-lockfile install, and `git diff --check` must pass before commit.

## 9. Acceptance boundary

Task 4A is complete only when the domain contract is deterministic, fully tested, traceable to product IDs, and independently reviewable. A passing UI or screenshot cannot substitute for exact domain tests.

Task 4A must end with one ordinary commit and a clean worktree. It must not push, deploy, create a PR, or start Task 4B, Task 4C, or Task 5.
