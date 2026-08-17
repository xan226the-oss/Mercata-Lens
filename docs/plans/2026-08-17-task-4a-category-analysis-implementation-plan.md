# Task 4A Traceable Category Analysis Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with strict RED → GREEN evidence. Do not start Task 4B, Task 4C, or Task 5.

**Goal:** Add a pure, deterministic, product-ID-traceable category analysis contract for the active research dataset without changing any UI.

**Architecture:** Keep all calculations in one new domain module, `src/domain/category.ts`, beside the existing parsing and quality modules. The function consumes the already-validated `ResearchDataset`, returns raw numeric values plus evidence IDs and deterministic limitations, and never mutates its input. Tests use in-memory fixtures and exercise every boundary before implementation.

**Tech Stack:** TypeScript 5, Vitest 3, React/Vite project tooling already present in the repository; no new dependency.

## Global Constraints

- The only validated first-release scope is US Cat Water Fountain research.
- `reviewCount` means review count, never sales, customers, demand, velocity, or market share.
- Describe only the active sample; do not infer market demand, competition, best launch price, profitability, or purchase advice.
- Demo data is synthetic and must not be presented as Amazon or current market evidence.
- No backend, login, persistence, scraping, external API, AI, pain-point rule, economics, opportunity scoring, or decision logic.
- Task 4A changes domain analysis and its tests only; it does not alter pages, components, context, data loading, CSS, README, Demo CSV, dependencies, or the lockfile.
- Create one ordinary implementation commit. Do not amend, push, deploy, or create a PR.

---

## File structure

- Create `src/domain/category.ts`: exported contracts, pure helpers, and `analyzeCategory(dataset)`.
- Create `src/domain/category.test.ts`: fixed fixtures and exact behavioral tests.
- Do not modify `src/domain/types.ts`; import `ResearchDataset`, `ProductRecord`, and `SourceKind` from it.

## Task 1: Implement the complete Task 4A domain contract

**Files:**

- Create: `src/domain/category.ts`
- Create: `src/domain/category.test.ts`

**Consumes:**

```ts
import type {
  ProductRecord,
  ResearchDataset,
  SourceKind,
} from "./types";
```

**Produces:**

```ts
export type CategoryStatus = "continue_research" | "insufficient_evidence" | "pause";

export type CategoryBandId =
  | `price_${number}`
  | "rating_below_3"
  | "rating_3_to_below_4"
  | "rating_4_to_below_4_5"
  | "rating_4_5_to_5"
  | "reviews_zero"
  | "reviews_1_to_99"
  | "reviews_100_to_499"
  | "reviews_500_plus";

export interface CategoryBand {
  id: CategoryBandId;
  label: string;
  lowerBound: number | null;
  lowerInclusive: boolean;
  upperBound: number | null;
  upperInclusive: boolean;
  count: number;
  shareOfProducts: number | null;
  productIds: string[];
}

export interface BrandShare {
  brand: string | null;
  label: string;
  count: number;
  shareOfProducts: number;
  productIds: string[];
}

export type CategoryAttribute =
  | "brand"
  | "material"
  | "capacity"
  | "filterCost"
  | "reviewCount";

export interface AttributeCoverage {
  attribute: CategoryAttribute;
  presentCount: number;
  missingCount: number;
  totalCount: number;
  coverage: number | null;
  presentProductIds: string[];
  missingProductIds: string[];
}

export interface CategoryEvidence {
  category: string;
  sourceKind: SourceKind;
  includedProductIds: string[];
  excludedProducts: Array<{ productId: string; reason: string }>;
}

export type CategoryLimitationCode =
  | "current_sample_only"
  | "synthetic_demo"
  | "user_supplied_source"
  | "review_count_not_sales"
  | "missing_attributes"
  | "small_sample";

export interface CategoryAnalysis {
  productCount: number;
  medianPrice: number | null;
  priceRange: { min: number | null; max: number | null };
  priceQuartiles: { q1: number | null; median: number | null; q3: number | null };
  priceBands: CategoryBand[];
  ratingBands: CategoryBand[];
  reviewCountBands: CategoryBand[];
  missingReviewCount: number;
  brandShares: BrandShare[];
  attributeCoverage: AttributeCoverage[];
  evidence: CategoryEvidence;
  limitations: Array<{ code: CategoryLimitationCode; message: string }>;
  status: CategoryStatus;
  statusReasons: string[];
}

export function analyzeCategory(dataset: ResearchDataset): CategoryAnalysis;
```

- [ ] **Step 1: Create fixed test helpers and write the first failing price tests**

In `src/domain/category.test.ts`, use complete records rather than partial objects:

```ts
import { describe, expect, it } from "vitest";
import { createResearchDataset } from "./dataset";
import type { ProductRecord, ResearchDataset } from "./types";
import { analyzeCategory } from "./category";

function product(
  productId: string,
  priceUsd: number,
  overrides: Partial<ProductRecord> = {},
): ProductRecord {
  return {
    productId,
    title: `Product ${productId}`,
    brand: `Brand ${productId}`,
    priceUsd,
    rating: 4,
    reviewCount: 100,
    category: "Cat Water Fountain",
    material: "Stainless Steel",
    capacity: "2L",
    filterCost: 5,
    sourceUrl: `https://example.com/product/${productId}`,
    observedAt: "2026-08-17",
    ...overrides,
  };
}

function dataset(
  products: ProductRecord[],
  sourceKind: ResearchDataset["sourceKind"] = "demo",
): ResearchDataset {
  return createResearchDataset({
    category: "Cat Water Fountain",
    sourceKind,
    importedAt: "2026-08-17T00:00:00.000Z",
    products,
    reviews: [],
  });
}

const sixProductDataset = dataset([
  product("p1", 10, { brand: "AquaPet" }),
  product("p2", 20, { brand: "AquaPet" }),
  product("p3", 29, { brand: "BlueFlow" }),
  product("p4", 30, { brand: "ClearDrop" }),
  product("p5", 40, { brand: "FreshPaw" }),
  product("p6", 50, { brand: "StillWater" }),
]);
```

The initial tests must assert:

```ts
const result = analyzeCategory(sixProductDataset);
expect(result.productCount).toBe(6);
expect(result.medianPrice).toBe(29.5);
expect(result.priceRange).toEqual({ min: 10, max: 50 });
expect(result.priceBands.reduce((sum, band) => sum + band.count, 0)).toBe(6);
```

Also add exact odd/even median cases, an empty dataset, one product, two products, three products, repeated quartile boundaries, all-same-price products, and an assertion that the original product order and objects remain unchanged.

- [ ] **Step 2: Run the focused test and record genuine RED**

Run:

```bash
pnpm vitest run src/domain/category.test.ts
```

Expected before implementation: FAIL because `./category` or `analyzeCategory` does not exist. Do not weaken tests to obtain RED.

- [ ] **Step 3: Add contracts and the minimal price implementation**

In `src/domain/category.ts`, add the exported contracts above and implement helpers with these exact rules:

```ts
function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function quartiles(sorted: number[]) {
  if (sorted.length === 0) return { q1: null, median: null, q3: null };
  if (sorted.length === 1) {
    return { q1: sorted[0], median: sorted[0], q3: sorted[0] };
  }
  const middle = Math.floor(sorted.length / 2);
  const lower = sorted.slice(0, middle);
  const upper = sorted.length % 2 === 1
    ? sorted.slice(middle + 1)
    : sorted.slice(middle);
  return { q1: median(lower), median: median(sorted), q3: median(upper) };
}
```

Create price bands by sorting copied `{ productId, value }` entries by value then product ID, deduplicating Q1/median/Q3, assigning `(previousCut, cut]`, omitting empty intervals, and adding `(lastCut, +∞)` only when it contains products. Each band must expose its exact boundaries and IDs. Set `shareOfProducts` to `count / productCount`, or `null` when there are no products.

- [ ] **Step 4: Run focused tests and obtain GREEN for price behavior**

Run:

```bash
pnpm vitest run src/domain/category.test.ts
```

Expected: all currently written tests PASS, with no `NaN` or mutation failure.

- [ ] **Step 5: Add failing boundary tests for rating and review-count bands**

Add products at every exact boundary and assert these memberships:

```ts
function ratingBandId(rating: number): string | undefined {
  const result = analyzeCategory(dataset([product("rating-case", 20, { rating })]));
  return result.ratingBands.find((band) =>
    band.productIds.includes("rating-case"),
  )?.id;
}

expect(ratingBandId(2.9)).toBe("rating_below_3");
expect(ratingBandId(3)).toBe("rating_3_to_below_4");
expect(ratingBandId(4)).toBe("rating_4_to_below_4_5");
expect(ratingBandId(4.5)).toBe("rating_4_5_to_5");
expect(ratingBandId(5)).toBe("rating_4_5_to_5");
```

Exercise review counts `0, 1, 99, 100, 499, 500`, plus `null`. Assert that the four review-band counts plus `missingReviewCount` equal `productCount`, and that every band exposes the expected IDs.

- [ ] **Step 6: Run focused tests and record RED for missing band behavior**

Run `pnpm vitest run src/domain/category.test.ts`.

Expected: FAIL only on the new rating/review band assertions.

- [ ] **Step 7: Implement fixed rating and review-count bands**

Return all four fixed bands in their declared order, including zero-count bands. Rating bands use `<3`, `[3,4)`, `[4,4.5)`, and `[4.5,5]`. Review bands use `0`, `[1,99]`, `[100,499]`, and `500+`. Null review counts appear only in `missingReviewCount` and missing attribute evidence. Shares use all products as the denominator and are `null` only for an empty dataset.

- [ ] **Step 8: Add failing brand and attribute-coverage tests**

Test exact trimmed brand grouping, case sensitivity, whitespace-only/missing brand as `brand: null` with label `Not provided`, descending-count ordering, lexical tie ordering, and product IDs. Assert that all brand shares sum to `1` for a non-empty dataset, including the approved fixture assertion:

```ts
expect(analyzeCategory(sixProductDataset).brandShares.find(
  (row) => row.brand === "AquaPet",
)).toMatchObject({ count: 2, shareOfProducts: 2 / 6 });
```

For `brand`, `material`, `capacity`, `filterCost`, and `reviewCount`, assert present/missing counts, raw coverage, and ID lists. Explicitly assert that numeric `0` is present and trimmed empty strings are missing. For an empty dataset assert `coverage === null`.

- [ ] **Step 9: Run focused tests and record RED for brand/coverage behavior**

Run `pnpm vitest run src/domain/category.test.ts`.

Expected: FAIL only on the new brand and coverage assertions.

- [ ] **Step 10: Implement brand shares and attribute coverage**

Trim brand strings without changing case. Use all products as the denominator. Represent missing or whitespace-only brands as one `null` group labelled `Not provided`. Sort by descending count, then `label.localeCompare` for ties. For coverage, use trimmed non-empty strings and `value !== null` for nullable numbers.

- [ ] **Step 11: Add failing evidence, limitation, and status tests**

Assert:

```ts
expect(result.evidence.includedProductIds).toEqual(sixProductIds);
expect(result.evidence.excludedProducts).toEqual([]);
expect(result.status).toBe("continue_research");
expect(analyzeCategory(twoProductDataset).status).toBe("insufficient_evidence");
expect(result.status).not.toBe("pause");
```

Require `current_sample_only` and `review_count_not_sales` for every dataset, `synthetic_demo` only for Demo data, `user_supplied_source` only for user uploads, `small_sample` below three products, and `missing_attributes` only when at least one tracked field is missing. Messages must state boundaries without market claims.

- [ ] **Step 12: Run focused tests and record RED for evidence/status behavior**

Run `pnpm vitest run src/domain/category.test.ts`.

Expected: FAIL only on the new evidence, limitations, and status assertions.

- [ ] **Step 13: Implement evidence, limitations, and status**

Include every dataset product ID and exclude none because Task 4A consumes the already-validated dataset. Return `insufficient_evidence` below three products and `continue_research` at three or more. Do not return `pause`. Add a precise reason explaining that three products only unlock descriptive inspection and do not prove commercial attractiveness.

- [ ] **Step 14: Run focused and full verification**

Run, in order:

```bash
pnpm vitest run src/domain/category.test.ts
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

Expected: every command exits `0`; the focused output shows all category tests passing; the complete suite has zero failures; install reports the lockfile is already current.

- [ ] **Step 15: Audit the implementation boundary**

Run:

```bash
git status --short
git diff --name-only
git diff -- src/domain/category.ts src/domain/category.test.ts
```

Expected before commit: only `src/domain/category.ts` and `src/domain/category.test.ts` are changed. Confirm there are no market-share, sales, demand, competition, launch-price, pain-point, economics, or recommendation claims.

- [ ] **Step 16: Commit Task 4A once**

```bash
git add src/domain/category.ts src/domain/category.test.ts
git commit -m "feat: add traceable category analysis"
git status --short --branch
```

Expected: one new ordinary commit and a clean `main` worktree. Do not amend, push, deploy, create a PR, or begin Task 4B.
