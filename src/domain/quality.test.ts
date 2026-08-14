import { describe, expect, it } from "vitest";
import { assessQuality } from "./quality";
import { buildTestDataset } from "../fixtures/testDataset";
import type { ResearchDataset } from "./types";

/** 8 prices that produce a known IQR outcome. */
function datasetWithPrices(prices: number[]): ResearchDataset {
  const base = buildTestDataset();
  const products = prices.map((price, i) => ({
    ...base.products[i % base.products.length],
    productId: `q${i}`,
    priceUsd: price,
  }));
  // Give the first product a matching review so referential integrity holds.
  const reviews = prices.map((_, i) => ({
    ...base.reviews[0],
    reviewId: `qr${i}`,
    productId: `q${i}`,
  }));
  return {
    ...base,
    products,
    reviews,
  };
}

describe("assessQuality summary counts", () => {
  it("keeps record-level quality diagnostics tied to dataset row metadata", () => {
    const base = buildTestDataset();
    const report = assessQuality({
      ...base,
      products: [...base.products, { ...base.products[0], productId: "p01", csvRow: 3 }],
      reviews: [...base.reviews, { ...base.reviews[0], reviewId: "r001", csvRow: 6 }],
    });
    expect(report.blockingIssues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "product_id", row: 3 }),
      expect.objectContaining({ field: "review_id", row: 6 }),
    ]));
  });

  it("counts validProducts as unique first-occurrence products", () => {
    const base = buildTestDataset();
    const withDup = {
      ...base,
      products: [...base.products, { ...base.products[0], productId: "p01" }],
    };
    const report = assessQuality(withDup);
    expect(report.summary.duplicateProducts).toBe(1);
  });

  it("counts duplicateReviews beyond the first occurrence", () => {
    const base = buildTestDataset();
    const withDup = {
      ...base,
      reviews: [...base.reviews, { ...base.reviews[0], reviewId: "r001" }],
    };
    const report = assessQuality(withDup);
    expect(report.summary.duplicateReviews).toBe(1);
  });
});

describe("assessQuality module availability", () => {
  it("locks category when there are fewer than 3 valid products", () => {
    const base = buildTestDataset();
    const tiny = {
      ...base,
      products: base.products.slice(0, 2),
      reviews: base.reviews.slice(0, 4),
    };
    const report = assessQuality(tiny);
    expect(report.moduleAvailability.category).toBe("locked");
  });

  it("locks pain_points when there are fewer than 10 valid linked reviews", () => {
    const base = buildTestDataset();
    const report = assessQuality(base);
    // testDataset has 4 reviews -> pain_points locked
    expect(report.moduleAvailability.pain_points).toBe("locked");
    expect(report.warnings.some((w) => w.message.includes("reviews"))).toBe(true);
  });

  it("sets economics to incomplete when products exist (never locked without identity problem)", () => {
    const base = buildTestDataset();
    const report = assessQuality(base);
    expect(report.moduleAvailability.economics).toBe("incomplete");
  });

  it("sets economics to locked when there are no usable products", () => {
    const report = assessQuality({
      ...buildTestDataset(),
      products: [],
      reviews: [],
    });
    expect(report.moduleAvailability.economics).toBe("locked");
  });

  it("locks opportunities unless both category and pain_points are available", () => {
    const base = buildTestDataset();
    const report = assessQuality(base);
    expect(report.moduleAvailability.opportunities).toBe("locked");
  });
});

describe("assessQuality IQR outlier rules", () => {
  it("does not label outliers with fewer than 8 valid prices", () => {
    // 7 prices, one extreme
    const report = assessQuality(datasetWithPrices([
      10, 11, 12, 13, 14, 15, 999,
    ]));
    expect(report.warnings.filter((w) => w.field === "price_usd")).toHaveLength(0);
  });

  it("labels a price above Q3 + 1.5*IQR as an outlier warning with file/row/value", () => {
    // 8 prices: 1,2,3,4,5,6,7,100
    // sorted: [1,2,3,4,5,6,7,100]; even count -> Q1 = median of [1,2,3,4]=2.5, Q3=median of [5,6,7,100]=6.5
    // IQR=4; upper fence = 6.5+6=12.5 -> 100 is outlier
    const report = assessQuality(datasetWithPrices([1, 2, 3, 4, 5, 6, 7, 100]));
    const outliers = report.warnings.filter((w) => w.field === "price_usd");
    expect(outliers).toHaveLength(1);
    expect(outliers[0]).toMatchObject({
      file: "products",
      code: "out_of_range",
      value: 100,
    });
    // outlier stays in dataset
    expect(report.summary.validProducts).toBe(8);
  });

  it("treats boundary values as not outliers", () => {
    // sorted [1,2,3,4,5,6,7,12.5]; upper fence 12.5 -> 12.5 is boundary, not outlier
    const report = assessQuality(datasetWithPrices([1, 2, 3, 4, 5, 6, 7, 12.5]));
    const outliers = report.warnings.filter((w) => w.field === "price_usd");
    expect(outliers).toHaveLength(0);
  });

  it("when IQR is 0, only values strictly different from Q1/Q3 are outliers", () => {
    // all 8 prices equal except one: [5,5,5,5,5,5,5,99]
    // Q1=5, Q3=5, IQR=0; fences Q1-0=5, Q3+0=5 -> 99 strictly differs -> outlier
    const report = assessQuality(datasetWithPrices([5, 5, 5, 5, 5, 5, 5, 99]));
    const outliers = report.warnings.filter((w) => w.field === "price_usd");
    expect(outliers).toHaveLength(1);
    expect(outliers[0].value).toBe(99);
  });

  it("handles odd count by excluding the median before quartiles", () => {
    // 9 prices: [1,2,3,4,5,6,7,8,100]; odd -> exclude median 5
    // lower [1,2,3,4] Q1=2.5, upper [6,7,8,100] Q3=7.5; IQR=5; upper fence=7.5+7.5=15 -> 100 outlier
    const report = assessQuality(datasetWithPrices([1, 2, 3, 4, 5, 6, 7, 8, 100]));
    const outliers = report.warnings.filter((w) => w.field === "price_usd");
    expect(outliers).toHaveLength(1);
    expect(outliers[0].value).toBe(100);
  });
});

describe("assessQuality blocking issues", () => {
  it("reports category mismatches as blocking issues", () => {
    const base = buildTestDataset();
    const wrong = {
      ...base,
      products: base.products.map((p, i) =>
        i === 0 ? { ...p, category: "Dog Fountain" } : p,
      ),
    };
    const report = assessQuality(wrong);
    expect(report.blockingIssues.some((i) => i.field === "category")).toBe(true);
  });
});