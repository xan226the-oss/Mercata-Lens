# Mercata Lens Task 5A: Deterministic Pain-Point Evidence Domain Design

- Date: 2026-08-20
- Approved base HEAD: `e77b7dfc684e31ed76f33a37d7658094e6ceed94`
- Product task: Task 5, Rule-Based Pain-Point Evidence and Human Corrections
- This document covers: Task 5A domain rules, classification, aggregation, and tests only

## 1. Goal

Create pure deterministic domain contracts that classify review text with a small versioned phrase catalog and summarize the resulting evidence. Every automatic label must be reproducible from an exact source-text span. Every correction must be explicit, reasoned, and auditable.

Task 5A does not render or alter a page, place corrections in React state, write an audit result, or claim that phrase matches are confirmed customer pain points.

## 2. Files and boundaries

Task 5A may create only:

- `src/domain/painPointRules.ts`;
- `src/domain/painPointRules.test.ts`;
- `src/domain/painPoints.ts`;
- `src/domain/painPoints.test.ts`.

The new domain files may import existing types and deterministic fixtures. All Task 5A contracts should remain in the new files. If compilation proves that an existing shared type must change, WorkBuddy must stop and request a scope decision before editing it.

Task 5A must not modify:

- `src/domain/types.ts` or existing domain behavior;
- `src/pages/**`, `src/components/**`, `src/research/**`, `src/data/**`, or `src/app/**`;
- fixtures, Demo CSV, CSV parsing, or quality-gate behavior;
- README, evidence documents, dependencies, or the lockfile;
- Task 5B, Task 5C, Task 6, or later product behavior.

It must not add AI, stemming, fuzzy matching, translation, scraping, external APIs, persistence, browser storage, backend services, analytics, economics, opportunity scoring, or decision logic.

## 3. Public contracts

Task 5A exports at least:

```ts
export const PAIN_POINT_RULESET_VERSION = "1.0.0" as const;

export type PainPointId =
  | "hard_to_clean"
  | "noise"
  | "leakage"
  | "pump_lifetime"
  | "filter_cost"
  | "capacity"
  | "pet_acceptance";

export interface PainPointRule {
  id: PainPointId;
  labelEn: string;
  labelZh: string;
  includePhrases: readonly string[];
  excludePhrases: readonly string[];
}

export interface PainPointCorrection {
  add: PainPointId[];
  remove: PainPointId[];
  reason: string;
}

export type PainPointCorrections = Record<string, PainPointCorrection>;

export function classifyReview(
  review: ReviewRecord,
  corrections?: PainPointCorrections,
): ReviewClassification;

export function summarizePainPoints(
  dataset: ResearchDataset,
  corrections?: PainPointCorrections,
): PainPointSummary[];
```

The implementation may refine internal shapes, but the public result must preserve every field required below. Inputs, nested records, arrays, correction objects, and phrase catalogs must not be mutated.

## 4. Rule catalog version 1.0.0

The initial catalog is deliberately conservative and fixture-grounded. Phrases are compared as normalized token sequences; their configured spelling remains visible in evidence.

The exact display labels are:

| ID | `labelEn` | `labelZh` |
| --- | --- | --- |
| `hard_to_clean` | Cleaning difficulty | 清洁困难 |
| `noise` | Unwanted noise | 噪音问题 |
| `leakage` | Water leakage | 漏水问题 |
| `pump_lifetime` | Pump lifetime | 水泵寿命 |
| `filter_cost` | Filter replacement cost | 滤芯更换成本 |
| `capacity` | Capacity or refill burden | 容量或补水负担 |
| `pet_acceptance` | Pet acceptance | 宠物接受度 |

### 4.1 `hard_to_clean`

Include:

- `hard to clean`;
- `cleaning takes forever`;
- `pain to clean`;
- `not the easiest to clean`;
- `awkward to clean`;
- `awkward to take apart`.

Exclude:

- `not hard to clean`.

### 4.2 `noise`

Include:

- `noisy`;
- `loud splashing`;
- `not as quiet`;
- `constant hum`.

Exclude:

- `not noisy`;
- `no noise`.

### 4.3 `leakage`

Include:

- `leak`;
- `leaks`;
- `leaked`;
- `leaking`;
- `leakage`.

Exclude:

- `no leak`;
- `no leaks`;
- `no leakage`;
- `not leaking`.

### 4.4 `pump_lifetime`

Include:

- `pump died`;
- `pump stopped working`;
- `pump became weak`;
- `pump got clogged and stopped`.

Exclude: none in version 1.0.0. Positive reliability statements do not contain an approved include phrase and therefore require no broad veto.

### 4.5 `filter_cost`

Include:

- `filter replacements add up`;
- `replacement filters are pricey`;
- `recurring expense`;
- `expensive side`.

Exclude: none in version 1.0.0. Positive or neutral cost statements do not contain an approved include phrase.

### 4.6 `capacity`

Include:

- `too small`;
- `smaller than expected`;
- `needs refilling every day`;
- `refills more often`.

Exclude: none in version 1.0.0.

### 4.7 `pet_acceptance`

Include:

- `ignores it completely`;
- `was scared`;
- `only one of my three cats uses it`.

Exclude: none in version 1.0.0.

Phrase additions that merely make the Demo counts look larger are prohibited. Coverage changes require evidence from the later human audit, a documented reason, new boundary tests, and a ruleset-version change.

## 5. Text matching algorithm

### 5.1 Tokenization and normalization

Tokenize both review text and configured phrases into contiguous ASCII letter-or-digit tokens using the equivalent of `[A-Za-z0-9]+`. Lowercase tokens for comparison. Punctuation, line breaks, tabs, and repeated spaces therefore act as separators.

Each review token retains its original zero-based start offset and end-exclusive offset. A phrase matches only when all normalized phrase tokens appear contiguously and in order. No stemming or semantic substitution is allowed: `leak`, `leaks`, `leaked`, `leaking`, and `leakage` match only because each variant is explicitly configured.

For a match, `sourceText` is exactly `review.reviewText.slice(start, end)`, from the first matched token's start through the last matched token's end. Evidence must satisfy:

```ts
review.reviewText.slice(match.start, match.end) === match.sourceText
```

Empty or punctuation-only review text produces no automatic matches.

### 5.2 Exclusions

For each rule, find include and exclude spans using the same tokenizer. An exclude span suppresses an include span only when their original character ranges overlap. It does not suppress unrelated evidence elsewhere in the review.

Required consequences:

- `not noisy` does not produce `noise` even though `noisy` is an include phrase;
- `not noisy at first, but noisy after a week` retains the second `noisy` match;
- `no leaks` does not produce `leakage`;
- `no leaks before, but it leaked yesterday` retains `leaked`.

### 5.3 Overlap and ordering

Within one label, overlapping retained include spans collapse deterministically:

1. prefer the span with more normalized tokens;
2. then prefer the span with more source characters;
3. then prefer the phrase appearing earlier in the configured include list;
4. return final matches in ascending source-start order.

Exact duplicate spans appear once. Matches for different labels are independent, so a review may carry multiple labels.

## 6. Classification result

`ReviewClassification` must expose:

- `reviewId` and `productId`;
- `rulesetVersion`;
- all retained `automaticMatches`;
- deduplicated `automaticLabels` in stable catalog order;
- deduplicated `effectiveLabels` in stable catalog order;
- the applicable correction snapshot, if present;
- correction validity: `none`, `applied`, or `ignored_blank_reason`;
- labels effectively added and removed after precedence is resolved.

Every automatic match contains:

- `painPointId`;
- `ruleId`;
- configured `includePhrase`;
- exact original `sourceText`;
- zero-based `start` and end-exclusive `end`;
- `rulesetVersion`.

For version 1.0.0, `ruleId` equals the owning `PainPointId`. The separate field remains explicit so a later compatible ruleset can introduce finer-grained rule identities without changing evidence semantics.

## 7. Correction semantics

Only `corrections[review.reviewId]` applies to a review. Add/remove arrays are deduplicated and reordered into stable catalog order in the result; the input object remains unchanged.

- No correction: effective labels equal automatic labels.
- Non-blank reason: additions are unioned with automatic labels, then removals are subtracted.
- The same label in both lists: removal wins.
- Removing an absent label is a valid no-op retained in the correction snapshot.
- Adding an already automatic label is a valid no-op retained in the correction snapshot.
- A reason containing only whitespace is invalid: no additions or removals are applied, validity is `ignored_blank_reason`, and effective labels remain automatic labels.
- Corrections for other review IDs have no effect.

Task 5A is pure domain logic. It neither stores nor persists corrections.

## 8. Summary result

`summarizePainPoints` returns exactly seven `PainPointSummary` rows in catalog order, including zero-count rows. Each row exposes:

- pain-point identity and English/Chinese labels;
- ruleset version;
- `matchedReviewCount` based on effective labels;
- `reviewDenominator = dataset.reviews.length`;
- `reviewFraction = matchedReviewCount / reviewDenominator`, or `null` when the denominator is zero;
- distinct `productIds` in first-review occurrence order;
- `productCount` equal to the number of those IDs;
- one evidence item per effectively labelled review, in dataset review order.

Each evidence item contains review ID, product ID, rating, review text, review date, purchase-verification value, source URL, automatic matches for this label, whether the effective label was manually added, and the applicable non-blank correction reason. A manual-only addition has an empty automatic-match list; it must never receive an invented phrase or offset.

A manually removed automatic label does not contribute to matched count, fraction, product coverage, or active summary evidence. Its automatic match remains available from `classifyReview`, allowing Task 5B to show what was removed without corrupting the effective summary.

One review counts once within a label even if it has multiple spans. It may count once in several labels. Consequently, counts across labels are not additive.

The function treats review records in the validated `ResearchDataset` as its denominator. It must not read product `reviewCount`, discard an empty-text review from the denominator, silently deduplicate IDs, or substitute a product count. Dataset validity remains the responsibility of the existing parser and quality gate.

## 9. Required RED/GREEN coverage

Tests are written before the corresponding implementation and must preserve genuine failure evidence. At minimum cover:

### Rules and matching

- `Hard to clean` matches `hard_to_clean` with exact offsets and source slice;
- case, punctuation, newlines, tabs, and repeated whitespace normalize as specified;
- `harder to clean` does not match `hard to clean`;
- `not noisy` excludes the overlapping generic `noisy` match;
- a later separate `noisy` span in the same review still matches;
- `no leaks` excludes only the overlapping leakage match;
- a later separate `leaked` span still matches;
- `pump died after two months` matches `pump_lifetime`;
- one review can match cleaning and filter-cost labels;
- empty and punctuation-only text produce no labels;
- overlap resolution and output ordering are deterministic;
- the ruleset version is exactly `1.0.0`.

### Corrections

- valid manual removal overrides an automatic match;
- valid manual addition adds an otherwise missed label without inventing a phrase;
- removal wins when a label appears in both arrays;
- duplicate and unordered correction labels produce stable deduplicated output;
- blank-reason corrections are reported and ignored;
- correction entries for other review IDs do not apply;
- correction inputs are not mutated.

### Summaries

- all seven rows return in stable order, including zero rows;
- matched-review count uses effective labels and never double-counts multiple spans;
- denominator is the number of actual dataset review records, not product `reviewCount`;
- fraction is raw and is `null` for an empty dataset;
- distinct product coverage and evidence order are deterministic;
- a review may contribute to more than one label;
- manual additions and removals update counts and evidence correctly;
- source review text, rating, URL, optional values, rule matches, and correction reason remain traceable;
- no input dataset, review, rule catalog, or correction object is mutated;
- no `NaN`, `Infinity`, fabricated text, inferred label, sales, demand, market, or opportunity result is produced.

If an added test is already GREEN because an earlier implementation step covers it, report it as coverage confirmation rather than claiming a false RED.

## 10. Verification and acceptance boundary

Task 5A requires:

- focused rule and pain-point domain tests;
- the full test suite;
- production build;
- TypeScript lint;
- frozen-lockfile installation;
- `git diff --check`;
- strict changed-file inspection;
- one ordinary commit and a clean final worktree.

Task 5A is complete only when matching, exclusions, correction precedence, aggregation, and evidence offsets are deterministic and independently testable. Demo counts, screenshots, or a rendered page cannot substitute for domain boundary tests.

Stop after the Task 5A implementation commit. Do not amend, push, deploy, create a PR, create audit outcomes, or start Task 5B, Task 5C, Task 6, UI, Context state, persistence, economics, scoring, or decisions.
