/**
 * A small fixed, in-memory test dataset used by unit tests.
 * Kept separate from the public/demo CSV fixtures so tests are deterministic
 * and do not depend on file loading or network mocking.
 */
import type { ResearchDataset } from "../domain/types";
import { createResearchDataset } from "../domain/dataset";

export const FIXED_IMPORTED_AT = "2026-07-01T00:00:00.000Z";

export function buildTestDataset(overrides?: Partial<ResearchDataset>): ResearchDataset {
  const base: ResearchDataset = createResearchDataset({
    category: "Cat Water Fountain",
    sourceKind: "demo",
    importedAt: FIXED_IMPORTED_AT,
    products: [
      {
        productId: "p01",
        title: "Test Fountain Alpha",
        brand: "TestBrand",
        priceUsd: 29.99,
        rating: 4.2,
        reviewCount: 10,
        category: "Cat Water Fountain",
        material: "Stainless Steel",
        capacity: "2.5L",
        filterCost: 7.99,
        sourceUrl: "https://example.com/demo/product/p01",
        observedAt: "2026-07-01",
      },
      {
        productId: "p02",
        title: "Test Fountain Beta",
        brand: "TestBrand",
        priceUsd: 39.99,
        rating: 4.5,
        reviewCount: null,
        category: "Cat Water Fountain",
        material: "Ceramic",
        capacity: "2L",
        filterCost: null,
        sourceUrl: "https://example.com/demo/product/p02",
        observedAt: "2026-07-01",
      },
      {
        productId: "p03",
        title: "Test Fountain Gamma",
        brand: null,
        priceUsd: 24.99,
        rating: 3.8,
        reviewCount: 5,
        category: "Cat Water Fountain",
        material: "Plastic",
        capacity: null,
        filterCost: 5.99,
        sourceUrl: "https://example.com/demo/product/p03",
        observedAt: "2026-07-02",
      },
    ],
    reviews: [
      {
        reviewId: "r001",
        productId: "p01",
        rating: 5,
        reviewText: "Easy to clean and quiet.",
        reviewDate: "2026-06-01",
        verifiedPurchase: true,
        sourceUrl: "https://example.com/demo/review/r001",
      },
      {
        reviewId: "r002",
        productId: "p01",
        rating: 2,
        reviewText: "Hard to clean corners.",
        reviewDate: "2026-06-05",
        verifiedPurchase: null,
        sourceUrl: "https://example.com/demo/review/r002",
      },
      {
        reviewId: "r003",
        productId: "p02",
        rating: 4,
        reviewText: "Pump is very quiet at night.",
        reviewDate: null,
        verifiedPurchase: false,
        sourceUrl: "https://example.com/demo/review/r003",
      },
      {
        reviewId: "r004",
        productId: "p03",
        rating: 3,
        reviewText: "Filters are cheap to replace.",
        reviewDate: "2026-06-10",
        verifiedPurchase: true,
        sourceUrl: "https://example.com/demo/review/r004",
      },
    ],
  });
  return { ...base, ...overrides };
}