import { describe, expect, it } from "vitest";
import type { ResearchDataset, ReviewRecord } from "../domain/types";
import { summarizePainPoints } from "../domain/painPoints";
import { createEconomicScenarios } from "./economicScenarios";
import { createOpportunityHypotheses, OPPORTUNITY_HYPOTHESIS_VALUES } from "./opportunityHypotheses";

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

  it("creates evidence-linked Demo hypotheses with explicit assumptions", () => {
    const activeDataset = dataset([
      review("r-clean", "Hard to clean around the pump."),
      review("r-noise", "The fountain is noisy at night."),
      review("r-pump", "The pump died after two months."),
      review("r-filter", "Replacement filters are pricey."),
    ]);
    const summaries = summarizePainPoints(activeDataset);
    const economics = createEconomicScenarios("demo");
    const before = structuredClone({ activeDataset, summaries, economics });
    const hypotheses = createOpportunityHypotheses(activeDataset, summaries, economics);
    expect(hypotheses.map(({ id }) => id)).toEqual(["easy_clean", "quiet_durable", "low_consumables"]);
    expect(hypotheses.map(({ name }) => name)).toEqual(["Easy-clean design", "Quiet and durable design", "Low consumables cost design"]);
    for (const hypothesis of hypotheses) {
      expect(hypothesis.dimensions).toHaveLength(5);
      expect(hypothesis.dimensions.every(({ value, evidenceKind, reasoning, evidenceIds }) => typeof value === "number" && evidenceKind === "assumption" && reasoning.startsWith("Curated Demo assumption:") && evidenceIds.some((id) => id === `assumption:${hypothesis.id}:demand` || id === `assumption:${hypothesis.id}:supply_gap` || id === `assumption:${hypothesis.id}:economics` || id === `assumption:${hypothesis.id}:differentiation` || id === `assumption:${hypothesis.id}:risk`))).toBe(true);
      expect(hypothesis.economics.map(({ id }) => id)).toEqual(["pessimistic", "base", "optimistic"]);
    }
    expect(hypotheses[1].supportEvidenceIds).toEqual(["review:r-noise", "review:r-pump", "economics:base", "assumption:quiet_durable:demand"]);
    expect(hypotheses[0].oppositionEvidenceIds).toEqual(["assumption:easy_clean:risk"]);
    expect({ activeDataset, summaries, economics }).toEqual(before);
  });

  it("selects the earliest active-dataset review across quiet pain points", () => {
    const pumpFirst = dataset([review("r-pump-first", "The pump died quickly."), review("r-noise-later", "The fountain is noisy at night.")]);
    const noiseFirst = dataset([review("r-noise-first", "The fountain is noisy at night."), review("r-pump-later", "The pump died quickly.")]);
    expect(createOpportunityHypotheses(pumpFirst, summarizePainPoints(pumpFirst), createEconomicScenarios("demo"))[1].supportEvidenceIds[0]).toBe("review:r-pump-first");
    expect(createOpportunityHypotheses(noiseFirst, summarizePainPoints(noiseFirst), createEconomicScenarios("demo"))[1].supportEvidenceIds[0]).toBe("review:r-noise-first");
  });

  it("creates all-null incomplete hypotheses for user uploads without inheriting Demo scores", () => {
    const activeDataset = { ...dataset([]), sourceKind: "user_upload" as const };
    const hypotheses = createOpportunityHypotheses(activeDataset, [], createEconomicScenarios("user_upload"));
    expect(hypotheses).toHaveLength(3);
    expect(hypotheses.every(({ dimensions }) => dimensions.every(({ value, evidenceIds }) => value === null && evidenceIds.length === 0))).toBe(true);
    expect(hypotheses.every(({ unknowns }) => unknowns.some((unknown) => /current-session user input/i.test(unknown)))).toBe(true);
  });
});
