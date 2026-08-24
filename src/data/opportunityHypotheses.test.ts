import { describe, expect, it } from "vitest";
import type { ResearchDataset, ReviewRecord } from "../domain/types";
import { summarizePainPoints } from "../domain/painPoints";
import { createEconomicScenarios } from "./economicScenarios";
import {
  createOpportunityHypotheses,
  OPPORTUNITY_HYPOTHESIS_VALUES,
} from "./opportunityHypotheses";

const review = (reviewId: string, reviewText: string): ReviewRecord => ({
  reviewId,
  productId: "p1",
  rating: 3,
  reviewText,
  reviewDate: "2026-01-01",
  verifiedPurchase: true,
  sourceUrl: `https://example.com/review/${reviewId}`,
});

const dataset = (reviews: ReviewRecord[]): ResearchDataset => ({
  schemaVersion: 1,
  market: "US",
  currency: "USD",
  category: "Cat Water Fountain",
  sourceKind: "demo",
  products: [{
    productId: "p1",
    title: "Demo fountain",
    brand: "Demo brand",
    priceUsd: 29.99,
    rating: 4,
    reviewCount: reviews.length,
    category: "Cat Water Fountain",
    material: "steel",
    capacity: "2L",
    filterCost: 4,
    sourceUrl: "https://example.com/product/p1",
    observedAt: "2026-01-01",
  }],
  reviews,
  importedAt: "2026-01-01T00:00:00.000Z",
});

describe("createOpportunityHypotheses", () => {
  it("exports exact fixed hypothesis values and canonical order", () => {
    expect(OPPORTUNITY_HYPOTHESIS_VALUES).toEqual({
      easy_clean: [70, 60, 65, 75, 55],
      quiet_durable: [65, 58, 60, 70, 60],
      low_consumables: [55, 62, 70, 65, 65],
    });
  });

  it("creates three evidence-linked Demo hypotheses with explicit assumptions", () => {
    const reviews = [
      review("r-clean", "Hard to clean around the pump."),
      review("r-noise", "The fountain is noisy at night."),
      review("r-pump", "The pump died after two months."),
      review("r-filter", "Replacement filters are pricey."),
    ];
    const activeDataset = dataset(reviews);
    const summaries = summarizePainPoints(activeDataset);
    const economics = createEconomicScenarios("demo");
    const before = structuredClone({ activeDataset, summaries, economics });
    const hypotheses = createOpportunityHypotheses(activeDataset, summaries, economics);

    expect(hypotheses.map(({ id }) => id)).toEqual(["easy_clean", "quiet_durable", "low_consumables"]);
    expect(hypotheses.map(({ name }) => name)).toEqual([
      "Easy-clean design",
      "Quiet and durable design",
      "Low consumables cost design",
    ]);
    for (const hypothesis of hypotheses) {
      expect(hypothesis.targetUser).toBeTruthy();
      expect(hypothesis.scenario).toBeTruthy();
      expect(hypothesis.dimensions).toHaveLength(5);
      expect(hypothesis.dimensions.map(({ dimension }) => dimension)).toEqual([
        "demand", "supply_gap", "economics", "differentiation", "risk",
      ]);
      expect(hypothesis.dimensions.every(({ value, evidenceKind, reasoning }) =>
        typeof value === "number" && evidenceKind === "assumption" && reasoning.startsWith("Curated Demo assumption:"),
      )).toBe(true);
      expect(hypothesis.economics.map(({ id }) => id)).toEqual(["pessimistic", "base", "optimistic"]);
      expect(hypothesis.unknowns.length).toBeGreaterThan(0);
    }
    expect(hypotheses[0].supportEvidenceIds).toContain("review:r-clean");
    expect(hypotheses[1].supportEvidenceIds).toContain("review:r-noise");
    expect(hypotheses[1].supportEvidenceIds).toContain("review:r-pump");
    expect(hypotheses[2].supportEvidenceIds).toContain("review:r-filter");
    expect(hypotheses[0].dimensions.flatMap(({ evidenceIds }) => evidenceIds)).toContain("economics:base");
    expect(hypotheses[0].dimensions.flatMap(({ evidenceIds }) => evidenceIds)).toContain("assumption:easy_clean:demand");
    expect({ activeDataset, summaries, economics }).toEqual(before);
  });

  it("creates all-null incomplete hypotheses for user uploads without inheriting Demo scores", () => {
    const activeDataset = { ...dataset([]), sourceKind: "user_upload" as const };
    const economics = createEconomicScenarios("user_upload");
    const hypotheses = createOpportunityHypotheses(activeDataset, [], economics);
    expect(hypotheses).toHaveLength(3);
    expect(hypotheses.every(({ dimensions }) => dimensions.every(({ value }) => value === null))).toBe(true);
    expect(hypotheses.every(({ dimensions }) => dimensions.every(({ evidenceIds }) => evidenceIds.length === 0))).toBe(true);
    expect(hypotheses.every(({ unknowns }) => unknowns.some((unknown) => /current-session user input/i.test(unknown)))).toBe(true);
  });
});
