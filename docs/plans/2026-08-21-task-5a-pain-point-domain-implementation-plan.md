# Task 5A Deterministic Pain-Point Evidence Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic, versioned, source-span-traceable review classification and effective-label summaries without changing any UI or persisted state.

**Architecture:** Keep the immutable catalog and token-span matcher in `src/domain/painPointRules.ts`; keep correction precedence, per-review classification, and dataset aggregation in `src/domain/painPoints.ts`. Both modules consume existing validated domain records, expose raw evidence rather than presentation strings, and remain pure. Their two test files drive behavior in four genuine RED → GREEN groups.

**Tech Stack:** TypeScript 5.8, Vitest 3, existing Mercata Lens domain contracts and Vite tooling; no new dependency.

## Global Constraints

- The only first-release research scope remains US Cat Water Fountain.
- Call outputs rule-matched pain-point evidence or review signals, never confirmed customer needs, demand, market prevalence, purchase intent, or product advice.
- Analyze actual `ReviewRecord` entries in the active validated `ResearchDataset`; never substitute product `reviewCount`.
- `reviewCount` is not sales, customers, demand, velocity, popularity, or market share.
- Demo reviews are synthetic fixtures; user uploads retain their own sourcing limitations.
- The exact seven-label catalog and order are `hard_to_clean`, `noise`, `leakage`, `pump_lifetime`, `filter_cost`, `capacity`, `pet_acceptance`.
- `PAIN_POINT_RULESET_VERSION` is exactly `"1.0.0"` for Task 5A.
- Matching normalizes ASCII letter-or-digit tokens, case, punctuation, and whitespace only. Do not add stemming, fuzzy matching, inferred synonyms, sentiment scoring, translation, or AI.
- Corrections require a non-blank reason to alter effective labels. Removal wins over addition. Task 5A calculates corrections but does not store or persist them.
- Only four new Task 5A files may change. Do not modify existing types, domain behavior, fixtures, Demo CSV, pages, components, Context, app files, CSS, README, evidence documents, dependencies, or lockfile.
- Do not implement Task 5B, Task 5C, Task 6, UI, audit outcomes, browser storage, backend services, scraping, external APIs, economics, scoring, or decisions.
- The project requires one ordinary implementation commit after the complete gate. Do not create intermediate commits, amend, push, deploy, or create a PR.

---

## File structure

- Create `src/domain/painPointRules.ts`: ruleset version, stable label catalog, public rule/match types, token-span matching, exclusions, and deterministic overlap resolution.
- Create `src/domain/painPointRules.test.ts`: exact catalog, normalization, source-offset, exclusion, overlap, multi-label, and empty-input tests.
- Create `src/domain/painPoints.ts`: correction contracts, `classifyReview`, summary/evidence contracts, and `summarizePainPoints`.
- Create `src/domain/painPoints.test.ts`: correction precedence, stable label output, denominators, product coverage, evidence provenance, empty data, and immutability tests.
- Import `ReviewRecord` and `ResearchDataset` from `src/domain/types.ts`; do not edit that file.

## Task 1: Lock the versioned catalog

**Files:**

- Create: `src/domain/painPointRules.test.ts`
- Create: `src/domain/painPointRules.ts`

**Interfaces:**

- Consumes: no new project behavior; TypeScript and Vitest only.
- Produces:

```ts
export const PAIN_POINT_RULESET_VERSION = "1.0.0" as const;
export const PAIN_POINT_IDS = [
  "hard_to_clean",
  "noise",
  "leakage",
  "pump_lifetime",
  "filter_cost",
  "capacity",
  "pet_acceptance",
] as const;
export type PainPointId = (typeof PAIN_POINT_IDS)[number];

export interface PainPointRule {
  id: PainPointId;
  labelEn: string;
  labelZh: string;
  includePhrases: readonly string[];
  excludePhrases: readonly string[];
}

export const PAIN_POINT_RULES: readonly PainPointRule[];
```

- [ ] **Step 1: Write the catalog test before the module exists**

Create `src/domain/painPointRules.test.ts` with the exact first contract:

```ts
import { describe, expect, it } from "vitest";
import {
  PAIN_POINT_IDS,
  PAIN_POINT_RULES,
  PAIN_POINT_RULESET_VERSION,
} from "./painPointRules";

describe("pain-point rule catalog", () => {
  it("exposes the approved version, stable IDs, labels, and conservative phrases", () => {
    expect(PAIN_POINT_RULESET_VERSION).toBe("1.0.0");
    expect(PAIN_POINT_IDS).toEqual([
      "hard_to_clean",
      "noise",
      "leakage",
      "pump_lifetime",
      "filter_cost",
      "capacity",
      "pet_acceptance",
    ]);
    expect(PAIN_POINT_RULES.map((rule) => rule.id)).toEqual(PAIN_POINT_IDS);
    expect(PAIN_POINT_RULES).toEqual([
      {
        id: "hard_to_clean",
        labelEn: "Cleaning difficulty",
        labelZh: "清洁困难",
        includePhrases: [
          "hard to clean",
          "cleaning takes forever",
          "pain to clean",
          "not the easiest to clean",
          "awkward to clean",
          "awkward to take apart",
        ],
        excludePhrases: ["not hard to clean"],
      },
      {
        id: "noise",
        labelEn: "Unwanted noise",
        labelZh: "噪音问题",
        includePhrases: ["noisy", "loud splashing", "not as quiet", "constant hum"],
        excludePhrases: ["not noisy", "no noise"],
      },
      {
        id: "leakage",
        labelEn: "Water leakage",
        labelZh: "漏水问题",
        includePhrases: ["leak", "leaks", "leaked", "leaking", "leakage"],
        excludePhrases: ["no leak", "no leaks", "no leakage", "not leaking"],
      },
      {
        id: "pump_lifetime",
        labelEn: "Pump lifetime",
        labelZh: "水泵寿命",
        includePhrases: [
          "pump died",
          "pump stopped working",
          "pump became weak",
          "pump got clogged and stopped",
        ],
        excludePhrases: [],
      },
      {
        id: "filter_cost",
        labelEn: "Filter replacement cost",
        labelZh: "滤芯更换成本",
        includePhrases: [
          "filter replacements add up",
          "replacement filters are pricey",
          "recurring expense",
          "expensive side",
        ],
        excludePhrases: [],
      },
      {
        id: "capacity",
        labelEn: "Capacity or refill burden",
        labelZh: "容量或补水负担",
        includePhrases: [
          "too small",
          "smaller than expected",
          "needs refilling every day",
          "refills more often",
        ],
        excludePhrases: [],
      },
      {
        id: "pet_acceptance",
        labelEn: "Pet acceptance",
        labelZh: "宠物接受度",
        includePhrases: [
          "ignores it completely",
          "was scared",
          "only one of my three cats uses it",
        ],
        excludePhrases: [],
      },
    ]);
  });
});
```

- [ ] **Step 2: Run the first focused RED**

Run:

```bash
pnpm vitest run src/domain/painPointRules.test.ts
```

Expected before implementation: exit non-zero because `./painPointRules` does not exist. Preserve the real error. Do not create a placeholder module first and do not claim a different failure as behavioral RED.

- [ ] **Step 3: Implement the immutable catalog exactly**

Create `src/domain/painPointRules.ts` with the interfaces above and the exact arrays asserted by Step 1. Declare the catalog with `as const satisfies readonly PainPointRule[]` so IDs and phrases remain immutable without widening them:

```ts
export const PAIN_POINT_RULES = [
  {
    id: "hard_to_clean",
    labelEn: "Cleaning difficulty",
    labelZh: "清洁困难",
    includePhrases: [
      "hard to clean",
      "cleaning takes forever",
      "pain to clean",
      "not the easiest to clean",
      "awkward to clean",
      "awkward to take apart",
    ],
    excludePhrases: ["not hard to clean"],
  },
  {
    id: "noise",
    labelEn: "Unwanted noise",
    labelZh: "噪音问题",
    includePhrases: ["noisy", "loud splashing", "not as quiet", "constant hum"],
    excludePhrases: ["not noisy", "no noise"],
  },
  {
    id: "leakage",
    labelEn: "Water leakage",
    labelZh: "漏水问题",
    includePhrases: ["leak", "leaks", "leaked", "leaking", "leakage"],
    excludePhrases: ["no leak", "no leaks", "no leakage", "not leaking"],
  },
  {
    id: "pump_lifetime",
    labelEn: "Pump lifetime",
    labelZh: "水泵寿命",
    includePhrases: [
      "pump died",
      "pump stopped working",
      "pump became weak",
      "pump got clogged and stopped",
    ],
    excludePhrases: [],
  },
  {
    id: "filter_cost",
    labelEn: "Filter replacement cost",
    labelZh: "滤芯更换成本",
    includePhrases: [
      "filter replacements add up",
      "replacement filters are pricey",
      "recurring expense",
      "expensive side",
    ],
    excludePhrases: [],
  },
  {
    id: "capacity",
    labelEn: "Capacity or refill burden",
    labelZh: "容量或补水负担",
    includePhrases: [
      "too small",
      "smaller than expected",
      "needs refilling every day",
      "refills more often",
    ],
    excludePhrases: [],
  },
  {
    id: "pet_acceptance",
    labelEn: "Pet acceptance",
    labelZh: "宠物接受度",
    includePhrases: [
      "ignores it completely",
      "was scared",
      "only one of my three cats uses it",
    ],
    excludePhrases: [],
  },
] as const satisfies readonly PainPointRule[];
```

- [ ] **Step 4: Run the catalog test for GREEN**

Run:

```bash
pnpm vitest run src/domain/painPointRules.test.ts
```

Expected: the catalog test passes and the version is exactly `1.0.0`.

## Task 2: Match exact normalized source spans

**Files:**

- Modify: `src/domain/painPointRules.test.ts`
- Modify: `src/domain/painPointRules.ts`

**Interfaces:**

- Consumes: `PainPointRule`, `PAIN_POINT_RULES`, and `PAIN_POINT_RULESET_VERSION` from Task 1.
- Produces:

```ts
export interface PainPointMatch {
  painPointId: PainPointId;
  ruleId: PainPointId;
  includePhrase: string;
  sourceText: string;
  start: number;
  end: number;
  rulesetVersion: typeof PAIN_POINT_RULESET_VERSION;
}

export function matchPainPointRule(
  reviewText: string,
  rule: PainPointRule,
): PainPointMatch[];

export function matchPainPointRules(reviewText: string): PainPointMatch[];
```

- [ ] **Step 1: Add failing normalization, exclusion, and traceability tests**

Extend imports in `src/domain/painPointRules.test.ts`, then add:

```ts
import type { PainPointRule } from "./painPointRules";
import { matchPainPointRule, matchPainPointRules } from "./painPointRules";

describe("matchPainPointRules", () => {
  it("matches case, punctuation, and whitespace while preserving the exact source slice", () => {
    const text = "Very HARD---to\n  clean after a week.";
    const [match] = matchPainPointRules(text).filter(
      (item) => item.painPointId === "hard_to_clean",
    );

    expect(match).toMatchObject({
      painPointId: "hard_to_clean",
      ruleId: "hard_to_clean",
      includePhrase: "hard to clean",
      sourceText: "HARD---to\n  clean",
      rulesetVersion: "1.0.0",
    });
    expect(text.slice(match.start, match.end)).toBe(match.sourceText);
  });

  it("does not stem or infer a phrase", () => {
    expect(matchPainPointRules("It is harder to clean.")).toEqual([]);
  });

  it("suppresses only an overlapping exclusion span", () => {
    const noise = matchPainPointRules(
      "It was not noisy at first, but the pump became noisy after a week.",
    ).filter((item) => item.painPointId === "noise");
    const leakage = matchPainPointRules(
      "There were no leaks before, but it leaked yesterday.",
    ).filter((item) => item.painPointId === "leakage");

    expect(noise.map((item) => item.sourceText)).toEqual(["noisy"]);
    expect(leakage.map((item) => item.sourceText)).toEqual(["leaked"]);
    expect(matchPainPointRules("Not noisy. No leaks.")).toEqual([]);
  });

  it("matches pump lifetime and more than one label in one review", () => {
    expect(matchPainPointRules("Pump died after two months.").map(
      (item) => item.painPointId,
    )).toEqual(["pump_lifetime"]);

    expect(matchPainPointRules(
      "Hard to clean, and filter replacements add up.",
    ).map((item) => item.painPointId)).toEqual([
      "hard_to_clean",
      "filter_cost",
    ]);
  });

  it("returns no matches for empty or punctuation-only text", () => {
    expect(matchPainPointRules("")).toEqual([]);
    expect(matchPainPointRules("... -- !!!")).toEqual([]);
  });

  it("does not mutate the configured rule catalog", () => {
    const before = JSON.stringify(PAIN_POINT_RULES);
    matchPainPointRules("Hard to clean and noisy.");
    expect(JSON.stringify(PAIN_POINT_RULES)).toBe(before);
  });

  it("prefers the longest overlapping include and returns source order", () => {
    const rule: PainPointRule = {
      id: "noise",
      labelEn: "Unwanted noise",
      labelZh: "噪音问题",
      includePhrases: ["hum", "constant hum"],
      excludePhrases: [],
    };

    expect(matchPainPointRule("Hum, then a constant hum.", rule).map(
      ({ includePhrase, sourceText }) => ({ includePhrase, sourceText }),
    )).toEqual([
      { includePhrase: "hum", sourceText: "Hum" },
      { includePhrase: "constant hum", sourceText: "constant hum" },
    ]);
  });
});
```

- [ ] **Step 2: Run focused tests and record the matcher RED**

Run:

```bash
pnpm vitest run src/domain/painPointRules.test.ts
```

Expected: exit non-zero because the matcher exports are missing. The catalog test must remain GREEN.

- [ ] **Step 3: Implement token mapping and phrase-span discovery**

Add private helpers to `src/domain/painPointRules.ts`:

```ts
interface TextToken {
  normalized: string;
  start: number;
  end: number;
}

interface MatchCandidate extends PainPointMatch {
  phraseIndex: number;
  tokenCount: number;
}

function tokenize(text: string): TextToken[] {
  return [...text.matchAll(/[A-Za-z0-9]+/g)].map((match) => ({
    normalized: match[0].toLowerCase(),
    start: match.index!,
    end: match.index! + match[0].length,
  }));
}

function phraseSpans(
  reviewText: string,
  reviewTokens: TextToken[],
  phrase: string,
): Array<{ start: number; end: number; sourceText: string; tokenCount: number }> {
  const phraseTokens = tokenize(phrase).map((token) => token.normalized);
  if (phraseTokens.length === 0) return [];

  const spans: Array<{
    start: number;
    end: number;
    sourceText: string;
    tokenCount: number;
  }> = [];
  for (let startIndex = 0; startIndex <= reviewTokens.length - phraseTokens.length; startIndex += 1) {
    const matches = phraseTokens.every(
      (token, offset) => reviewTokens[startIndex + offset].normalized === token,
    );
    if (!matches) continue;
    const first = reviewTokens[startIndex];
    const last = reviewTokens[startIndex + phraseTokens.length - 1];
    spans.push({
      start: first.start,
      end: last.end,
      sourceText: reviewText.slice(first.start, last.end),
      tokenCount: phraseTokens.length,
    });
  }
  return spans;
}

function overlaps(
  left: { start: number; end: number },
  right: { start: number; end: number },
): boolean {
  return left.start < right.end && right.start < left.end;
}
```

Use explicit local array typing where strict TypeScript inference requires it. Do not use `any`, mutate input strings/catalogs, or normalize the returned `sourceText`.

- [ ] **Step 4: Implement exclusion and deterministic overlap resolution**

Implement `matchPainPointRule` with these operations:

```ts
export function matchPainPointRule(
  reviewText: string,
  rule: PainPointRule,
): PainPointMatch[] {
  const reviewTokens = tokenize(reviewText);
  if (reviewTokens.length === 0) return [];

  const exclusions = rule.excludePhrases.flatMap((phrase) =>
    phraseSpans(reviewText, reviewTokens, phrase),
  );
  const candidates: MatchCandidate[] = rule.includePhrases.flatMap(
    (includePhrase, phraseIndex) =>
      phraseSpans(reviewText, reviewTokens, includePhrase).map((span) => ({
        painPointId: rule.id,
        ruleId: rule.id,
        includePhrase,
        sourceText: span.sourceText,
        start: span.start,
        end: span.end,
        rulesetVersion: PAIN_POINT_RULESET_VERSION,
        phraseIndex,
        tokenCount: span.tokenCount,
      })),
  ).filter((candidate) => !exclusions.some((excluded) => overlaps(candidate, excluded)));

  const preferred = [...candidates].sort(
    (a, b) =>
      b.tokenCount - a.tokenCount ||
      (b.end - b.start) - (a.end - a.start) ||
      a.phraseIndex - b.phraseIndex ||
      a.start - b.start,
  );
  const selected: MatchCandidate[] = [];
  for (const candidate of preferred) {
    if (!selected.some((existing) => overlaps(candidate, existing))) {
      selected.push(candidate);
    }
  }

  return selected
    .sort((a, b) => a.start - b.start)
    .map((candidate) => ({
      painPointId: candidate.painPointId,
      ruleId: candidate.ruleId,
      includePhrase: candidate.includePhrase,
      sourceText: candidate.sourceText,
      start: candidate.start,
      end: candidate.end,
      rulesetVersion: candidate.rulesetVersion,
    }));
}

export function matchPainPointRules(reviewText: string): PainPointMatch[] {
  return PAIN_POINT_RULES.flatMap((rule) => matchPainPointRule(reviewText, rule));
}
```

- [ ] **Step 5: Run the rule suite for GREEN**

Run:

```bash
pnpm vitest run src/domain/painPointRules.test.ts
```

Expected: both catalog and matcher groups pass, exact source slicing succeeds, and exclusions do not hide later separate evidence.

## Task 3: Classify reviews with reasoned correction precedence

**Files:**

- Create: `src/domain/painPoints.test.ts`
- Create: `src/domain/painPoints.ts`

**Interfaces:**

- Consumes:

```ts
import type { ReviewRecord, ResearchDataset } from "./types";
import {
  PAIN_POINT_IDS,
  PAIN_POINT_RULES,
  PAIN_POINT_RULESET_VERSION,
  matchPainPointRules,
  type PainPointId,
  type PainPointMatch,
} from "./painPointRules";
```

- Produces:

```ts
export interface PainPointCorrection {
  add: PainPointId[];
  remove: PainPointId[];
  reason: string;
}

export type PainPointCorrections = Record<string, PainPointCorrection>;
export type CorrectionValidity = "none" | "applied" | "ignored_blank_reason";

export interface ReviewClassification {
  reviewId: string;
  productId: string;
  rulesetVersion: typeof PAIN_POINT_RULESET_VERSION;
  automaticMatches: PainPointMatch[];
  automaticLabels: PainPointId[];
  effectiveLabels: PainPointId[];
  correction: PainPointCorrection | null;
  correctionValidity: CorrectionValidity;
  addedLabels: PainPointId[];
  removedLabels: PainPointId[];
}

export function classifyReview(
  review: ReviewRecord,
  corrections?: PainPointCorrections,
): ReviewClassification;
```

- [ ] **Step 1: Write correction tests before `painPoints.ts` exists**

Create `src/domain/painPoints.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ReviewRecord } from "./types";
import {
  classifyReview,
  type PainPointCorrections,
} from "./painPoints";

function review(
  reviewId: string,
  productId: string,
  reviewText: string,
  overrides: Partial<ReviewRecord> = {},
): ReviewRecord {
  return {
    reviewId,
    productId,
    rating: 2,
    reviewText,
    reviewDate: "2026-08-20",
    verifiedPurchase: true,
    sourceUrl: `https://example.com/review/${reviewId}`,
    ...overrides,
  };
}

describe("classifyReview corrections", () => {
  it("applies addition, then lets removal win without deleting automatic evidence", () => {
    const input = review("r1", "p1", "Hard to clean.");
    const result = classifyReview(input, {
      r1: {
        add: ["noise", "hard_to_clean", "noise"],
        remove: ["hard_to_clean", "hard_to_clean"],
        reason: "Human review of the source text",
      },
    });

    expect(result.automaticLabels).toEqual(["hard_to_clean"]);
    expect(result.automaticMatches).toHaveLength(1);
    expect(result.effectiveLabels).toEqual(["noise"]);
    expect(result.addedLabels).toEqual(["noise"]);
    expect(result.removedLabels).toEqual(["hard_to_clean"]);
    expect(result.correctionValidity).toBe("applied");
    expect(result.correction).toEqual({
      add: ["hard_to_clean", "noise"],
      remove: ["hard_to_clean"],
      reason: "Human review of the source text",
    });
  });

  it("ignores a blank-reason correction and ignores corrections for other reviews", () => {
    const input = review("r1", "p1", "Hard to clean.");
    const blank = classifyReview(input, {
      r1: { add: ["noise"], remove: ["hard_to_clean"], reason: "   " },
    });
    const other = classifyReview(input, {
      r2: { add: ["noise"], remove: [], reason: "Different review" },
    });

    expect(blank.correctionValidity).toBe("ignored_blank_reason");
    expect(blank.effectiveLabels).toEqual(["hard_to_clean"]);
    expect(blank.addedLabels).toEqual([]);
    expect(blank.removedLabels).toEqual([]);
    expect(other.correctionValidity).toBe("none");
    expect(other.correction).toBeNull();
    expect(other.effectiveLabels).toEqual(["hard_to_clean"]);
  });

  it("retains valid no-op requests but reports only effective label changes", () => {
    const result = classifyReview(review("r1", "p1", "Hard to clean."), {
      r1: {
        add: ["hard_to_clean", "hard_to_clean"],
        remove: ["noise", "noise"],
        reason: "Checked both labels against the source",
      },
    });

    expect(result.correction).toEqual({
      add: ["hard_to_clean"],
      remove: ["noise"],
      reason: "Checked both labels against the source",
    });
    expect(result.effectiveLabels).toEqual(["hard_to_clean"]);
    expect(result.addedLabels).toEqual([]);
    expect(result.removedLabels).toEqual([]);
  });

  it("does not mutate the review or correction inputs", () => {
    const input = review("r1", "p1", "Hard to clean.");
    const corrections: PainPointCorrections = {
      r1: { add: ["noise", "noise"], remove: [], reason: "Manual" },
    };
    const reviewBefore = JSON.stringify(input);
    const correctionsBefore = JSON.stringify(corrections);

    classifyReview(input, corrections);

    expect(JSON.stringify(input)).toBe(reviewBefore);
    expect(JSON.stringify(corrections)).toBe(correctionsBefore);
  });
});
```

- [ ] **Step 2: Run the classifier RED**

Run:

```bash
pnpm vitest run src/domain/painPointRules.test.ts src/domain/painPoints.test.ts
```

Expected: rule tests remain GREEN and the new suite fails because `./painPoints` does not exist.

- [ ] **Step 3: Implement stable label helpers and correction snapshots**

Create `src/domain/painPoints.ts` with the contracts above and these helpers:

```ts
function stableLabels(labels: readonly PainPointId[]): PainPointId[] {
  const selected = new Set(labels);
  return PAIN_POINT_IDS.filter((id) => selected.has(id));
}

function correctionSnapshot(correction: PainPointCorrection): PainPointCorrection {
  return {
    add: stableLabels(correction.add),
    remove: stableLabels(correction.remove),
    reason: correction.reason,
  };
}
```

Do not trim or rewrite the recorded reason; use `reason.trim()` only to decide validity. This preserves exactly what the human entered while rejecting whitespace-only reasons.

- [ ] **Step 4: Implement `classifyReview` exactly**

```ts
export function classifyReview(
  review: ReviewRecord,
  corrections: PainPointCorrections = {},
): ReviewClassification {
  const automaticMatches = matchPainPointRules(review.reviewText);
  const automaticLabels = stableLabels(
    automaticMatches.map((match) => match.painPointId),
  );
  const sourceCorrection = corrections[review.reviewId];

  if (!sourceCorrection) {
    return {
      reviewId: review.reviewId,
      productId: review.productId,
      rulesetVersion: PAIN_POINT_RULESET_VERSION,
      automaticMatches,
      automaticLabels,
      effectiveLabels: [...automaticLabels],
      correction: null,
      correctionValidity: "none",
      addedLabels: [],
      removedLabels: [],
    };
  }

  const correction = correctionSnapshot(sourceCorrection);
  if (correction.reason.trim() === "") {
    return {
      reviewId: review.reviewId,
      productId: review.productId,
      rulesetVersion: PAIN_POINT_RULESET_VERSION,
      automaticMatches,
      automaticLabels,
      effectiveLabels: [...automaticLabels],
      correction,
      correctionValidity: "ignored_blank_reason",
      addedLabels: [],
      removedLabels: [],
    };
  }

  const effectiveSet = new Set<PainPointId>([...automaticLabels, ...correction.add]);
  for (const id of correction.remove) effectiveSet.delete(id);
  const effectiveLabels = stableLabels([...effectiveSet]);
  return {
    reviewId: review.reviewId,
    productId: review.productId,
    rulesetVersion: PAIN_POINT_RULESET_VERSION,
    automaticMatches,
    automaticLabels,
    effectiveLabels,
    correction,
    correctionValidity: "applied",
    addedLabels: effectiveLabels.filter((id) => !automaticLabels.includes(id)),
    removedLabels: automaticLabels.filter((id) => !effectiveLabels.includes(id)),
  };
}
```

- [ ] **Step 5: Run the classifier suite for GREEN**

Run:

```bash
pnpm vitest run src/domain/painPointRules.test.ts src/domain/painPoints.test.ts
```

Expected: rule and correction tests pass. No correction changes `automaticMatches`.

## Task 4: Aggregate effective evidence without inventing denominators

**Files:**

- Modify: `src/domain/painPoints.test.ts`
- Modify: `src/domain/painPoints.ts`

**Interfaces:**

- Consumes: `classifyReview`, `PAIN_POINT_RULES`, and existing `ResearchDataset` review records.
- Produces:

```ts
export interface PainPointEvidenceItem {
  reviewId: string;
  productId: string;
  rating: number;
  reviewText: string;
  reviewDate: string | null;
  verifiedPurchase: boolean | null;
  sourceUrl: string;
  automaticMatches: PainPointMatch[];
  manuallyAdded: boolean;
  correctionReason: string | null;
}

export interface PainPointSummary {
  id: PainPointId;
  labelEn: string;
  labelZh: string;
  rulesetVersion: typeof PAIN_POINT_RULESET_VERSION;
  matchedReviewCount: number;
  reviewDenominator: number;
  reviewFraction: number | null;
  productCount: number;
  productIds: string[];
  evidence: PainPointEvidenceItem[];
}

export function summarizePainPoints(
  dataset: ResearchDataset,
  corrections?: PainPointCorrections,
): PainPointSummary[];
```

- [ ] **Step 1: Add failing summary and provenance tests**

First update the imports at the top of `src/domain/painPoints.test.ts` to the complete set needed by both classifier and summary tests:

```ts
import { describe, expect, it } from "vitest";
import { createResearchDataset } from "./dataset";
import type { ReviewRecord, ResearchDataset } from "./types";
import { PAIN_POINT_IDS } from "./painPointRules";
import {
  classifyReview,
  summarizePainPoints,
  type PainPointCorrections,
} from "./painPoints";
```

Add this dataset helper immediately after the existing `review` helper:

```ts
function dataset(reviews: ReviewRecord[]): ResearchDataset {
  return createResearchDataset({
    category: "Cat Water Fountain",
    sourceKind: "demo",
    importedAt: "2026-08-20T00:00:00.000Z",
    products: [
      {
        productId: "p1",
        title: "Fountain One",
        brand: "Test",
        priceUsd: 20,
        rating: 4,
        reviewCount: 999,
        category: "Cat Water Fountain",
        material: "Steel",
        capacity: "2L",
        filterCost: 5,
        sourceUrl: "https://example.com/product/p1",
        observedAt: "2026-08-20",
      },
      {
        productId: "p2",
        title: "Fountain Two",
        brand: "Test",
        priceUsd: 30,
        rating: 4,
        reviewCount: 1,
        category: "Cat Water Fountain",
        material: "Ceramic",
        capacity: "3L",
        filterCost: null,
        sourceUrl: "https://example.com/product/p2",
        observedAt: "2026-08-20",
      },
    ],
    reviews,
  });
}
```

Then append the summary tests:

```ts
describe("summarizePainPoints", () => {
  it("returns all labels in order and counts review records rather than product reviewCount", () => {
    const input = dataset([
      review("r1", "p1", "Hard to clean. Hard to clean."),
      review("r2", "p1", "Hard to clean and filter replacements add up."),
      review("r3", "p2", "Quiet and easy to clean.", {
        rating: 5,
        reviewDate: null,
        verifiedPurchase: null,
      }),
    ]);
    const result = summarizePainPoints(input);

    expect(result.map((row) => row.id)).toEqual(PAIN_POINT_IDS);
    expect(result).toHaveLength(7);
    expect(result.find((row) => row.id === "hard_to_clean")).toMatchObject({
      matchedReviewCount: 2,
      reviewDenominator: 3,
      reviewFraction: 2 / 3,
      productCount: 1,
      productIds: ["p1"],
    });
    expect(result.find((row) => row.id === "filter_cost")).toMatchObject({
      matchedReviewCount: 1,
      reviewDenominator: 3,
      reviewFraction: 1 / 3,
    });
    expect(result.find((row) => row.id === "capacity")).toMatchObject({
      matchedReviewCount: 0,
      reviewDenominator: 3,
      reviewFraction: 0,
      productCount: 0,
      productIds: [],
      evidence: [],
    });
  });

  it("keeps exact review provenance and stable dataset order", () => {
    const sourceReview = review("r1", "p1", "The pump died after two months.", {
      rating: 1,
      reviewDate: null,
      verifiedPurchase: false,
      sourceUrl: "https://example.com/source/r1",
    });
    const row = summarizePainPoints(dataset([sourceReview])).find(
      (item) => item.id === "pump_lifetime",
    );

    expect(row?.evidence).toEqual([
      {
        reviewId: "r1",
        productId: "p1",
        rating: 1,
        reviewText: "The pump died after two months.",
        reviewDate: null,
        verifiedPurchase: false,
        sourceUrl: "https://example.com/source/r1",
        automaticMatches: [
          expect.objectContaining({
            painPointId: "pump_lifetime",
            includePhrase: "pump died",
            sourceText: "pump died",
          }),
        ],
        manuallyAdded: false,
        correctionReason: null,
      },
    ]);
  });

  it("applies manual additions and removals to active summary evidence", () => {
    const input = dataset([
      review("r1", "p1", "Hard to clean."),
      review("r2", "p2", "No configured capacity phrase."),
    ]);
    const result = summarizePainPoints(input, {
      r1: { add: [], remove: ["hard_to_clean"], reason: "Positive context on review" },
      r2: { add: ["capacity"], remove: [], reason: "Explicit refill burden in context" },
    });

    expect(result.find((row) => row.id === "hard_to_clean")).toMatchObject({
      matchedReviewCount: 0,
      evidence: [],
    });
    expect(result.find((row) => row.id === "capacity")?.evidence).toEqual([
      expect.objectContaining({
        reviewId: "r2",
        automaticMatches: [],
        manuallyAdded: true,
        correctionReason: "Explicit refill burden in context",
      }),
    ]);
  });

  it("deduplicates product coverage in first-review occurrence order", () => {
    const row = summarizePainPoints(dataset([
      review("r1", "p2", "Hard to clean."),
      review("r2", "p2", "Hard to clean."),
      review("r3", "p1", "Hard to clean."),
    ])).find((item) => item.id === "hard_to_clean");

    expect(row).toMatchObject({
      matchedReviewCount: 3,
      productCount: 2,
      productIds: ["p2", "p1"],
    });
    expect(row?.evidence.map((item) => item.reviewId)).toEqual(["r1", "r2", "r3"]);
  });

  it("uses null fractions for no reviews and does not mutate any input", () => {
    const input = dataset([]);
    const corrections: PainPointCorrections = {
      missing: { add: ["noise"], remove: [], reason: "Unused" },
    };
    const datasetBefore = JSON.stringify(input);
    const correctionsBefore = JSON.stringify(corrections);
    const result = summarizePainPoints(input, corrections);

    expect(result).toHaveLength(7);
    expect(result.every((row) => row.reviewDenominator === 0)).toBe(true);
    expect(result.every((row) => row.reviewFraction === null)).toBe(true);
    expect(result.every((row) => Number.isNaN(row.matchedReviewCount) === false)).toBe(true);
    expect(JSON.stringify(input)).toBe(datasetBefore);
    expect(JSON.stringify(corrections)).toBe(correctionsBefore);
  });
});
```

The first test deliberately gives products displayed `reviewCount` values of `999` and `1`; the asserted denominator remains exactly three actual review records.

- [ ] **Step 2: Run focused tests and record the summary RED**

Run:

```bash
pnpm vitest run src/domain/painPointRules.test.ts src/domain/painPoints.test.ts
```

Expected: classifier behavior stays GREEN and summary assertions fail because `summarizePainPoints` and its result contracts are not implemented.

- [ ] **Step 3: Implement summary rows in stable catalog order**

Add the summary interfaces and implement:

```ts
export function summarizePainPoints(
  dataset: ResearchDataset,
  corrections: PainPointCorrections = {},
): PainPointSummary[] {
  const classifications = dataset.reviews.map((review) => ({
    review,
    classification: classifyReview(review, corrections),
  }));
  const reviewDenominator = dataset.reviews.length;

  return PAIN_POINT_RULES.map((rule) => {
    const evidence: PainPointEvidenceItem[] = classifications
      .filter(({ classification }) => classification.effectiveLabels.includes(rule.id))
      .map(({ review, classification }) => {
        const manuallyAdded = classification.addedLabels.includes(rule.id);
        return {
          reviewId: review.reviewId,
          productId: review.productId,
          rating: review.rating,
          reviewText: review.reviewText,
          reviewDate: review.reviewDate,
          verifiedPurchase: review.verifiedPurchase,
          sourceUrl: review.sourceUrl,
          automaticMatches: classification.automaticMatches.filter(
            (match) => match.painPointId === rule.id,
          ),
          manuallyAdded,
          correctionReason: manuallyAdded
            ? classification.correction?.reason ?? null
            : null,
        };
      });
    const productIds = [...new Set(evidence.map((item) => item.productId))];

    return {
      id: rule.id,
      labelEn: rule.labelEn,
      labelZh: rule.labelZh,
      rulesetVersion: PAIN_POINT_RULESET_VERSION,
      matchedReviewCount: evidence.length,
      reviewDenominator,
      reviewFraction: reviewDenominator === 0 ? null : evidence.length / reviewDenominator,
      productCount: productIds.length,
      productIds,
      evidence,
    };
  });
}
```

Do not filter empty review text from the denominator, sort by count, deduplicate dataset review IDs, look up product `reviewCount`, format percentages, or invent evidence for a manual-only addition.

- [ ] **Step 4: Run both focused suites for GREEN**

Run:

```bash
pnpm vitest run src/domain/painPointRules.test.ts src/domain/painPoints.test.ts
```

Expected: every Task 5A test passes. Counts are review-level, product IDs are distinct, and zero-denominator fractions are `null`.

## Task 5: Harden the complete contract and commit once

**Files:**

- Modify: `src/domain/painPointRules.test.ts` only if a required design assertion is still absent.
- Modify: `src/domain/painPoints.test.ts` only if a required design assertion is still absent.
- Inspect: `src/domain/painPointRules.ts`
- Inspect: `src/domain/painPoints.ts`

**Interfaces:**

- Consumes: the complete Task 5A API from Tasks 1–4.
- Produces: one verified Task 5A implementation commit; no new behavior beyond the approved design.

- [ ] **Step 1: Perform a design-coverage test audit**

Confirm the focused tests explicitly establish all of the following. Add a concrete assertion to the relevant existing test only when it is genuinely absent:

```ts
expect(classification.rulesetVersion).toBe("1.0.0");
expect(classification.automaticMatches.every((match) =>
  reviewText.slice(match.start, match.end) === match.sourceText
)).toBe(true);
expect(new Set(classification.effectiveLabels).size).toBe(
  classification.effectiveLabels.length,
);
expect(summaries.map((row) => row.id)).toEqual(PAIN_POINT_IDS);
expect(summaries.every((row) => Number.isFinite(row.matchedReviewCount))).toBe(true);
expect(summaries.every((row) =>
  row.reviewFraction === null || Number.isFinite(row.reviewFraction)
)).toBe(true);
```

Also confirm there is an explicit test for: exact phrase boundaries, separate post-exclusion matches, multi-label reviews, blank correction reasons, add/remove conflict, no-op deduplication, manual-only evidence with no phrase, zero rows, distinct product coverage, nullable provenance fields, and no mutation. Do not add duplicate assertions merely to increase the test count.

- [ ] **Step 2: Run the complete focused gate**

Run:

```bash
pnpm vitest run src/domain/painPointRules.test.ts src/domain/painPoints.test.ts
```

Expected: both test files pass with zero failures. If Step 1 added an assertion that is already GREEN, report it truthfully as coverage confirmation, not a new RED.

- [ ] **Step 3: Run the full repository gate in order**

```bash
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

Expected: every command exits `0`; the complete suite has zero failures; build and TypeScript checks succeed; frozen install reports the lockfile is current; diff check prints no error.

Do not replace `pnpm build` with a different Vite command unless the environment blocks it. If an environment safety mechanism blocks the exact command, stop and report the exact output rather than presenting a substitute as the required build.

- [ ] **Step 4: Audit changed files and forbidden claims**

Run:

```bash
git status --short
git diff --name-only
git diff -- src/domain/painPointRules.ts src/domain/painPointRules.test.ts src/domain/painPoints.ts src/domain/painPoints.test.ts
```

Expected before commit: exactly these four files are new and no existing file changed:

```text
src/domain/painPointRules.test.ts
src/domain/painPointRules.ts
src/domain/painPoints.test.ts
src/domain/painPoints.ts
```

Run the repository's available search command over the four files for disallowed implementation concepts. Search results inside negative test assertions or explicit limitation comments must be interpreted, not blindly deleted:

```bash
rg -n "localStorage|indexedDB|fetch\(|axios|OpenAI|market share|sales|demand|opportunity|profit|recommend" \
  src/domain/painPointRules.ts src/domain/painPointRules.test.ts \
  src/domain/painPoints.ts src/domain/painPoints.test.ts
```

Expected: no runtime implementation of persistence, network access, AI, commercial inference, economics, or recommendations. If `rg` is unavailable, use a truthful equivalent and report the substitution.

- [ ] **Step 5: Commit Task 5A once and stop**

```bash
git add \
  src/domain/painPointRules.ts \
  src/domain/painPointRules.test.ts \
  src/domain/painPoints.ts \
  src/domain/painPoints.test.ts
git commit -m "feat: add traceable pain point evidence"
git status --short --branch
git rev-parse HEAD
```

Expected: one ordinary commit and a clean `main` worktree. Stop immediately. Do not amend, push, deploy, create a PR, fill audit outcomes, modify Context/UI, or begin Task 5B, Task 5C, Task 6, economics, opportunity scoring, or decision work.

## Delivery report contract

WorkBuddy must report:

1. repository root, starting HEAD, branch, and clean starting state;
2. required ancestor-check exit codes from the later Task 5A task sheet;
3. exact files created and confirmation that no prohibited file changed;
4. genuine RED output for catalog, matcher, classifier, and summary groups, distinguishing already-GREEN coverage from behavioral RED;
5. exact focused/full/build/lint/install/diff-check results and exit codes;
6. exact tokenization, exclusion, overlap, correction, denominator, empty-data, and immutability behavior;
7. final commit SHA/message and clean Git status;
8. explicit confirmation that Task 5B, Task 5C, Task 6, UI, Context, audit outcomes, persistence, economics, scoring, AI, backend, scraping, external APIs, push, deployment, and PR creation were not started.
