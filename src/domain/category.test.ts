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

describe("analyzeCategory price statistics", () => {
  it("calculates the approved six-product median, range, and complete price bands", () => {
    const result = analyzeCategory(sixProductDataset);

    expect(result.productCount).toBe(6);
    expect(result.medianPrice).toBe(29.5);
    expect(result.priceRange).toEqual({ min: 10, max: 50 });
    expect(result.priceQuartiles).toEqual({ q1: 20, median: 29.5, q3: 40 });
    expect(result.priceBands.reduce((sum, band) => sum + band.count, 0)).toBe(6);
    expect(result.priceBands.flatMap((band) => band.productIds)).toEqual(["p1", "p2", "p3", "p4", "p5", "p6"]);
    expect(result.priceBands.every((band) => band.shareOfProducts !== null && Number.isFinite(band.shareOfProducts))).toBe(true);
  });

  it.each([
    { name: "empty", prices: [], median: null },
    { name: "one product", prices: [10], median: 10 },
    { name: "two products", prices: [10, 20], median: 15 },
    { name: "three products", prices: [10, 20, 30], median: 20 },
    { name: "odd products", prices: [7, 12, 99, 120, 140], median: 99 },
  ])("supports $name median cases", ({ prices, median }) => {
    const result = analyzeCategory(dataset(prices.map((price, index) => product(`p${index}`, price))));
    expect(result.medianPrice).toBe(median);
  });

  it("returns null price statistics and no bands for an empty dataset", () => {
    const result = analyzeCategory(dataset([]));

    expect(result.priceRange).toEqual({ min: null, max: null });
    expect(result.priceQuartiles).toEqual({ q1: null, median: null, q3: null });
    expect(result.priceBands).toEqual([]);
  });

  it("uses one band for an all-same-price sample and deduplicates repeated cut points", () => {
    const result = analyzeCategory(dataset([
      product("same-1", 20),
      product("same-2", 20),
      product("same-3", 20),
      product("same-4", 20),
    ]));

    expect(result.priceBands).toHaveLength(1);
    expect(result.priceBands[0]).toMatchObject({
      lowerBound: null,
      upperBound: 20,
      lowerInclusive: false,
      upperInclusive: true,
      count: 4,
      productIds: ["same-1", "same-2", "same-3", "same-4"],
    });
  });

  it("assigns price-boundary products to exactly one sample-relative band", () => {
    const result = analyzeCategory(dataset([
      product("price-1", 10),
      product("price-2", 20),
      product("price-3", 30),
      product("price-4", 40),
    ]));
    const ids = result.priceBands.flatMap((band) => band.productIds);

    expect(new Set(ids).size).toBe(4);
    expect(ids).toEqual(["price-1", "price-2", "price-3", "price-4"]);
    expect(result.priceBands.every((band) => Number.isFinite(band.count))).toBe(true);
  });

  it("does not mutate product order, records, or input arrays", () => {
    const products = [product("p2", 20), product("p1", 10), product("p3", 30)];
    const input = dataset(products);
    const productSnapshot = JSON.stringify(input.products);
    const orderSnapshot = input.products.map((item) => item.productId);

    analyzeCategory(input);

    expect(JSON.stringify(input.products)).toBe(productSnapshot);
    expect(input.products.map((item) => item.productId)).toEqual(orderSnapshot);
  });
});

describe("analyzeCategory rating and review bands", () => {
  function ratingBandId(rating: number): string | undefined {
    const result = analyzeCategory(dataset([product("rating-case", 20, { rating })]));
    return result.ratingBands.find((band) => band.productIds.includes("rating-case"))?.id;
  }

  it("assigns every exact rating boundary to the approved fixed band", () => {
    expect(ratingBandId(2.9)).toBe("rating_below_3");
    expect(ratingBandId(3)).toBe("rating_3_to_below_4");
    expect(ratingBandId(4)).toBe("rating_4_to_below_4_5");
    expect(ratingBandId(4.5)).toBe("rating_4_5_to_5");
    expect(ratingBandId(5)).toBe("rating_4_5_to_5");
  });

  it("returns all fixed rating bands in order, including empty bands", () => {
    const result = analyzeCategory(dataset([product("rating-1", 20, { rating: 4.2 })]));

    expect(result.ratingBands.map((band) => band.id)).toEqual([
      "rating_below_3",
      "rating_3_to_below_4",
      "rating_4_to_below_4_5",
      "rating_4_5_to_5",
    ]);
    expect(result.ratingBands[2].productIds).toEqual(["rating-1"]);
  });

  it("assigns exact review-count boundaries and tracks null review counts", () => {
    const result = analyzeCategory(dataset([
      product("review-0", 10, { reviewCount: 0 }),
      product("review-1", 11, { reviewCount: 1 }),
      product("review-99", 12, { reviewCount: 99 }),
      product("review-100", 13, { reviewCount: 100 }),
      product("review-499", 14, { reviewCount: 499 }),
      product("review-500", 15, { reviewCount: 500 }),
      product("review-null", 16, { reviewCount: null }),
    ]));

    expect(result.reviewCountBands.map((band) => band.productIds)).toEqual([
      ["review-0"],
      ["review-1", "review-99"],
      ["review-100", "review-499"],
      ["review-500"],
    ]);
    expect(result.missingReviewCount).toBe(1);
    expect(result.missingReviewCountProductIds).toEqual(["review-null"]);
    expect(result.reviewCountBands.reduce((sum, band) => sum + band.count, 0) + result.missingReviewCount).toBe(7);
  });
});

describe("analyzeCategory brands and attribute coverage", () => {
  it("trims brands, preserves case variants, groups missing brands, and orders ties stably", () => {
    const result = analyzeCategory(dataset([
      product("brand-a", 10, { brand: " AquaPet " }),
      product("brand-b", 11, { brand: "AquaPet" }),
      product("brand-c", 12, { brand: "blueflow" }),
      product("brand-d", 13, { brand: "BlueFlow" }),
      product("brand-e", 14, { brand: "   " }),
      product("brand-f", 15, { brand: null }),
    ]));

    expect(result.brandShares).toEqual([
      { brand: "AquaPet", label: "AquaPet", count: 2, denominator: 6, shareOfProducts: 2 / 6, productIds: ["brand-a", "brand-b"] },
      { brand: null, label: "Not provided", count: 2, denominator: 6, shareOfProducts: 2 / 6, productIds: ["brand-e", "brand-f"] },
      { brand: "blueflow", label: "blueflow", count: 1, denominator: 6, shareOfProducts: 1 / 6, productIds: ["brand-c"] },
      { brand: "BlueFlow", label: "BlueFlow", count: 1, denominator: 6, shareOfProducts: 1 / 6, productIds: ["brand-d"] },
    ]);
    expect(result.brandShares.find((row) => row.brand === "AquaPet")).toMatchObject({ count: 2, denominator: 6, shareOfProducts: 2 / 6 });
    expect(result.brandShares.reduce((sum, row) => sum + row.shareOfProducts, 0)).toBeCloseTo(1);
  });

  it("reports coverage counts, denominators, IDs, and numeric zero as present", () => {
    const result = analyzeCategory(dataset([
      product("coverage-1", 10, { brand: "A", material: " ", capacity: "2L", filterCost: 0, reviewCount: 0 }),
      product("coverage-2", 11, { brand: null, material: "Steel", capacity: null, filterCost: null, reviewCount: null }),
    ]));

    expect(result.attributeCoverage).toEqual([
      { attribute: "brand", presentCount: 1, missingCount: 1, totalCount: 2, denominator: 2, coverage: 1 / 2, presentProductIds: ["coverage-1"], missingProductIds: ["coverage-2"] },
      { attribute: "material", presentCount: 1, missingCount: 1, totalCount: 2, denominator: 2, coverage: 1 / 2, presentProductIds: ["coverage-2"], missingProductIds: ["coverage-1"] },
      { attribute: "capacity", presentCount: 1, missingCount: 1, totalCount: 2, denominator: 2, coverage: 1 / 2, presentProductIds: ["coverage-1"], missingProductIds: ["coverage-2"] },
      { attribute: "filterCost", presentCount: 1, missingCount: 1, totalCount: 2, denominator: 2, coverage: 1 / 2, presentProductIds: ["coverage-1"], missingProductIds: ["coverage-2"] },
      { attribute: "reviewCount", presentCount: 1, missingCount: 1, totalCount: 2, denominator: 2, coverage: 1 / 2, presentProductIds: ["coverage-1"], missingProductIds: ["coverage-2"] },
    ]);

    expect(analyzeCategory(dataset([])).attributeCoverage.every((item) => item.coverage === null)).toBe(true);
  });
});

describe("analyzeCategory evidence, limitations, and status", () => {
  it("returns traceable demo evidence and descriptive limitations", () => {
    const result = analyzeCategory(sixProductDataset);

    expect(result.evidence).toEqual({
      category: "Cat Water Fountain",
      sourceKind: "demo",
      includedProductIds: ["p1", "p2", "p3", "p4", "p5", "p6"],
      excludedProducts: [],
      priceCutPoints: [20, 29.5, 40],
      productDenominator: 6,
    });
    expect(result.limitations.map((limitation) => limitation.code)).toContain("current_sample_only");
    expect(result.limitations.map((limitation) => limitation.code)).toContain("synthetic_demo");
    expect(result.limitations.map((limitation) => limitation.code)).toContain("review_count_not_sales");
    expect(result.status).toBe("continue_research");
    expect(result.status).not.toBe("pause");
  });

  it("distinguishes user uploads and the three-product status threshold", () => {
    const result = analyzeCategory(dataset([
      product("p1", 10),
      product("p2", 20),
      product("p3", 30),
    ], "user_upload"));
    const twoProductResult = analyzeCategory(dataset([product("p1", 10), product("p2", 20)], "user_upload"));

    expect(result.status).toBe("continue_research");
    expect(result.limitations.map((limitation) => limitation.code)).toContain("user_supplied_source");
    expect(twoProductResult.status).toBe("insufficient_evidence");
    expect(twoProductResult.limitations.map((limitation) => limitation.code)).toContain("small_sample");
    expect(twoProductResult.status).not.toBe("pause");
  });
});

describe("price band identifiers", () => {
  it("uses unique stable sequential IDs for the six-product fixture", () => {
    const result = analyzeCategory(sixProductDataset);
    const ids = result.priceBands.map((band) => band.id);

    expect(ids.length).toBe(new Set(ids).size);
    expect(ids).toEqual(["price_0", "price_1", "price_2", "price_3"]);
  });

  it.each([
    {
      name: "repeated quartile boundaries",
      products: [
        product("repeated-1", 10),
        product("repeated-2", 10),
        product("repeated-3", 20),
        product("repeated-4", 20),
        product("repeated-5", 30),
      ],
    },
    {
      name: "same-price sample",
      products: [product("same-id-1", 20), product("same-id-2", 20), product("same-id-3", 20)],
    },
  ])("does not duplicate IDs for $name", ({ products }) => {
    const ids = analyzeCategory(dataset(products)).priceBands.map((band) => band.id);

    expect(ids.length).toBe(new Set(ids).size);
  });
});
