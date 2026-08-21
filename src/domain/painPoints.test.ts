import { describe, expect, it } from "vitest";
import { createResearchDataset } from "./dataset";
import type { ReviewRecord, ResearchDataset } from "./types";
import { PAIN_POINT_IDS } from "./painPointRules";
import {
  classifyReview,
  summarizePainPoints,
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
    expect(result.automaticMatches[0].rulesetVersion).toBe("1.0.0");
    expect(input.reviewText.slice(result.automaticMatches[0].start, result.automaticMatches[0].end)).toBe(result.automaticMatches[0].sourceText);
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
    expect(result.map((row) => row.id)).toEqual(PAIN_POINT_IDS);
    expect(result.every((row) => Number.isFinite(row.matchedReviewCount))).toBe(true);
    expect(result.every((row) => row.reviewFraction === null || Number.isFinite(row.reviewFraction))).toBe(true);
    expect(result.every((row) => row.reviewDenominator === 0)).toBe(true);
    expect(result.every((row) => row.reviewFraction === null)).toBe(true);
    expect(result.every((row) => Number.isNaN(row.matchedReviewCount) === false)).toBe(true);
    expect(JSON.stringify(input)).toBe(datasetBefore);
    expect(JSON.stringify(corrections)).toBe(correctionsBefore);
  });
});
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
