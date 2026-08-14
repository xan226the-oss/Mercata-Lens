/**
 * Data quality gate (Task 3). Evaluates a ResearchDataset and returns
 * blocking issues, warnings, module availability, and exact counts.
 * Pure, deterministic, and independent of UI / storage.
 */
import type {
  AnalysisModule,
  ModuleAvailability,
  ParseIssue,
  QualityReport,
  ResearchDataset,
} from "./types";

const EXPECTED_CATEGORY = "Cat Water Fountain";
const MIN_PRODUCTS_FOR_CATEGORY = 3;
const MIN_REVIEWS_FOR_PAIN_POINTS = 10;
const MIN_PRICES_FOR_IQR = 8;

export function assessQuality(dataset: ResearchDataset): QualityReport {
  const blockingIssues: ParseIssue[] = [];
  const warnings: ParseIssue[] = [];

  // ---- Exact counts (first-occurrence uniqueness) ----
  const seenProducts = new Set<string>();
  const uniqueProducts = [];
  let duplicateProducts = 0;
  for (const p of dataset.products) {
    if (seenProducts.has(p.productId)) {
      duplicateProducts += 1;
      blockingIssues.push({
        row: p.csvRow ?? 0,
        field: "product_id",
        code: "invalid_format",
        value: p.productId,
        message: `Duplicate product_id "${p.productId}".`,
        file: "products",
      });
    } else {
      seenProducts.add(p.productId);
      uniqueProducts.push(p);
    }
  }

  const knownProductIds = new Set(uniqueProducts.map((p) => p.productId));

  const seenReviews = new Set<string>();
  const uniqueReviews = [];
  let duplicateReviews = 0;
  for (const r of dataset.reviews) {
    if (seenReviews.has(r.reviewId)) {
      duplicateReviews += 1;
      blockingIssues.push({
        row: r.csvRow ?? 0,
        field: "review_id",
        code: "invalid_format",
        value: r.reviewId,
        message: `Duplicate review_id "${r.reviewId}".`,
        file: "reviews",
      });
    } else {
      seenReviews.add(r.reviewId);
      if (knownProductIds.has(r.productId)) {
        uniqueReviews.push(r);
      } else {
        blockingIssues.push({
          row: r.csvRow ?? 0,
          field: "product_id",
          code: "invalid_format",
          value: r.productId,
          message: `Review references unknown product_id "${r.productId}".`,
          file: "reviews",
        });
      }
    }
  }

  // ---- Category scope (blocking) ----
  const categorySet = new Set(uniqueProducts.map((p) => p.category));
  if (categorySet.size > 1) {
    for (const p of uniqueProducts.filter((item) => item.category !== EXPECTED_CATEGORY)) {
      blockingIssues.push({
        row: p.csvRow ?? 0,
        field: "category",
        code: "invalid_format",
        value: p.category,
        message: `Category must be exactly "${EXPECTED_CATEGORY}".`,
        file: "products",
      });
    }
  } else if (categorySet.size === 1 && !categorySet.has(EXPECTED_CATEGORY)) {
    for (const p of uniqueProducts) {
      blockingIssues.push({
        row: p.csvRow ?? 0,
        field: "category",
        code: "invalid_format",
        value: p.category,
        message: `Category must be exactly "${EXPECTED_CATEGORY}".`,
        file: "products",
      });
    }
  }

  // ---- Warnings: low sample size ----
  if (uniqueProducts.length < MIN_PRODUCTS_FOR_CATEGORY) {
    warnings.push({
      row: 0,
      field: "sample_size",
      code: "required",
      value: uniqueProducts.length,
      message: `Only ${uniqueProducts.length} valid product(s); fewer than ${MIN_PRODUCTS_FOR_CATEGORY} limits category analysis.`,
      file: "products",
    });
  }
  if (uniqueReviews.length < MIN_REVIEWS_FOR_PAIN_POINTS) {
    warnings.push({
      row: 0,
      field: "sample_size",
      code: "required",
      value: uniqueReviews.length,
      message: `Only ${uniqueReviews.length} valid reviews; fewer than ${MIN_REVIEWS_FOR_PAIN_POINTS} limits pain-point analysis.`,
      file: "reviews",
    });
  }

  // ---- Warnings: price outliers via IQR (>= 8 valid prices) ----
  const prices = uniqueProducts.map((p) => p.priceUsd);
  if (prices.length >= MIN_PRICES_FOR_IQR) {
    const outlierIndexes = findIqrOutliers(prices);
    for (const idx of outlierIndexes) {
      warnings.push({
        row: uniqueProducts[idx].csvRow ?? 0,
        field: "price_usd",
        code: "out_of_range",
        value: prices[idx],
        message: `Price ${prices[idx]} is an IQR outlier in this sample (kept for review).`,
        file: "products",
      });
    }
  }

  // ---- Module availability ----
  const productBlocked = blockingIssues.some(
    (i) => i.file === "products" || i.field === "category",
  );
  const reviewBlocked = blockingIssues.some(
    (i) => i.file === "reviews" || i.field === "product_id",
  );

  const categoryAvailable = !productBlocked && uniqueProducts.length >= MIN_PRODUCTS_FOR_CATEGORY;
  const painPointsAvailable = !reviewBlocked && uniqueReviews.length >= MIN_REVIEWS_FOR_PAIN_POINTS;

  const economicsAvailable = uniqueProducts.length > 0 && !productBlocked;

  const moduleAvailability: Record<AnalysisModule, ModuleAvailability> = {
    category: categoryAvailable ? "available" : "locked",
    pain_points: painPointsAvailable ? "available" : "locked",
    economics: economicsAvailable ? "incomplete" : "locked",
    opportunities:
      categoryAvailable && painPointsAvailable ? "available" : "locked",
  };

  return {
    blockingIssues,
    warnings,
    moduleAvailability,
    summary: {
      validProducts: uniqueProducts.length,
      validReviews: uniqueReviews.length,
      duplicateProducts,
      duplicateReviews,
    },
  };
}

/**
 * IQR outlier detection per the approved algorithm.
 * Only meaningful when called with >= 8 prices (guard at call site).
 */
function findIqrOutliers(prices: number[]): number[] {
  const sorted = [...prices].sort((a, b) => a - b);
  const n = sorted.length;

  // Exclude the median when the count is odd.
  let lower: number[];
  let upper: number[];
  if (n % 2 === 1) {
    const mid = (n - 1) / 2;
    lower = sorted.slice(0, mid);
    upper = sorted.slice(mid + 1);
  } else {
    const mid = n / 2;
    lower = sorted.slice(0, mid);
    upper = sorted.slice(mid);
  }

  const q1 = median(lower);
  const q3 = median(upper);
  const iqr = q3 - q1;

  if (iqr === 0) {
    // Only values strictly different from Q1/Q3 are outliers.
    return prices
      .map((value, idx) => ({ value, idx }))
      .filter(({ value }) => value !== q1)
      .map(({ idx }) => idx);
  }

  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  return prices
    .map((value, idx) => ({ value, idx }))
    .filter(({ value }) => value < lowerFence || value > upperFence)
    .map(({ idx }) => idx);
}

function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}