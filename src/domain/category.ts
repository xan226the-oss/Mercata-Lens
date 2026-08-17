import type { ProductRecord, ResearchDataset, SourceKind } from "./types";

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
  denominator: number;
  shareOfProducts: number;
  productIds: string[];
}

export type CategoryAttribute = "brand" | "material" | "capacity" | "filterCost" | "reviewCount";

export interface AttributeCoverage {
  attribute: CategoryAttribute;
  presentCount: number;
  missingCount: number;
  totalCount: number;
  denominator: number;
  coverage: number | null;
  presentProductIds: string[];
  missingProductIds: string[];
}

export interface CategoryEvidence {
  category: string;
  sourceKind: SourceKind;
  includedProductIds: string[];
  excludedProducts: Array<{ productId: string; reason: string }>;
  priceCutPoints: number[];
  productDenominator: number;
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
  missingReviewCountProductIds: string[];
  brandShares: BrandShare[];
  attributeCoverage: AttributeCoverage[];
  evidence: CategoryEvidence;
  limitations: Array<{ code: CategoryLimitationCode; message: string }>;
  status: CategoryStatus;
  statusReasons: string[];
}

interface ValueWithProductId {
  value: number;
  productId: string;
}

function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function quartiles(sorted: number[]): { q1: number | null; median: number | null; q3: number | null } {
  if (sorted.length === 0) return { q1: null, median: null, q3: null };
  if (sorted.length === 1) return { q1: sorted[0], median: sorted[0], q3: sorted[0] };

  const middle = Math.floor(sorted.length / 2);
  const lower = sorted.slice(0, middle);
  const upper = sorted.length % 2 === 1 ? sorted.slice(middle + 1) : sorted.slice(middle);
  return { q1: median(lower), median: median(sorted), q3: median(upper) };
}

function band(
  id: CategoryBandId,
  label: string,
  lowerBound: number | null,
  lowerInclusive: boolean,
  upperBound: number | null,
  upperInclusive: boolean,
  values: ValueWithProductId[],
  productCount: number,
): CategoryBand {
  const productIds = values.map(({ productId }) => productId);
  return {
    id,
    label,
    lowerBound,
    lowerInclusive,
    upperBound,
    upperInclusive,
    count: productIds.length,
    shareOfProducts: productCount === 0 ? null : productIds.length / productCount,
    productIds,
  };
}

function uniqueSortedPriceCutPoints(priceQuartiles: { q1: number | null; median: number | null; q3: number | null }): number[] {
  return [priceQuartiles.q1, priceQuartiles.median, priceQuartiles.q3]
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b)
    .filter((value, index, values) => index === 0 || value !== values[index - 1]);
}

function buildPriceBands(
  entries: ValueWithProductId[],
  priceQuartiles: { q1: number | null; median: number | null; q3: number | null },
  productCount: number,
): CategoryBand[] {
  if (entries.length === 0) return [];

  const cutPoints = uniqueSortedPriceCutPoints(priceQuartiles);

  const sortedEntries = [...entries].sort((a, b) => a.value - b.value || a.productId.localeCompare(b.productId));
  const bands: CategoryBand[] = [];
  let previousCut: number | null = null;

  for (const cutPoint of cutPoints) {
    const values = sortedEntries.filter(({ value }) =>
      previousCut === null ? value <= cutPoint : value > previousCut && value <= cutPoint,
    );
    if (values.length > 0) {
      bands.push(
        band(
          `price_${cutPoint}`,
          previousCut === null ? `Up to ${cutPoint}` : `>${previousCut} to ${cutPoint}`,
          previousCut,
          false,
          cutPoint,
          true,
          values,
          productCount,
        ),
      );
    }
    previousCut = cutPoint;
  }

  const aboveLastCut = sortedEntries.filter(({ value }) => value > (previousCut as number));
  if (previousCut !== null && aboveLastCut.length > 0) {
    bands.push(
      band(
        `price_${previousCut}`,
        `>${previousCut}`,
        previousCut,
        false,
        null,
        false,
        aboveLastCut,
        productCount,
      ),
    );
  }
  return bands;
}

function buildFixedBands(
  products: ProductRecord[],
  productCount: number,
  definitions: Array<{
    id: CategoryBandId;
    label: string;
    lowerBound: number | null;
    lowerInclusive: boolean;
    upperBound: number | null;
    upperInclusive: boolean;
    matches: (product: ProductRecord) => boolean;
  }>,
  value: (product: ProductRecord) => number,
): CategoryBand[] {
  return definitions.map((definition) =>
    band(
      definition.id,
      definition.label,
      definition.lowerBound,
      definition.lowerInclusive,
      definition.upperBound,
      definition.upperInclusive,
      products
        .filter(definition.matches)
        .map((product) => ({ productId: product.productId, value: value(product) })),
      productCount,
    ),
  );
}

const ratingDefinitions = [
  {
    id: "rating_below_3" as const,
    label: "Below 3",
    lowerBound: null,
    lowerInclusive: false,
    upperBound: 3,
    upperInclusive: false,
    matches: (product: ProductRecord) => product.rating < 3,
  },
  {
    id: "rating_3_to_below_4" as const,
    label: "3 to below 4",
    lowerBound: 3,
    lowerInclusive: true,
    upperBound: 4,
    upperInclusive: false,
    matches: (product: ProductRecord) => product.rating >= 3 && product.rating < 4,
  },
  {
    id: "rating_4_to_below_4_5" as const,
    label: "4 to below 4.5",
    lowerBound: 4,
    lowerInclusive: true,
    upperBound: 4.5,
    upperInclusive: false,
    matches: (product: ProductRecord) => product.rating >= 4 && product.rating < 4.5,
  },
  {
    id: "rating_4_5_to_5" as const,
    label: "4.5 to 5",
    lowerBound: 4.5,
    lowerInclusive: true,
    upperBound: 5,
    upperInclusive: true,
    matches: (product: ProductRecord) => product.rating >= 4.5 && product.rating <= 5,
  },
];

const reviewDefinitions = [
  {
    id: "reviews_zero" as const,
    label: "0",
    lowerBound: 0,
    lowerInclusive: true,
    upperBound: 0,
    upperInclusive: true,
    matches: (product: ProductRecord) => product.reviewCount === 0,
  },
  {
    id: "reviews_1_to_99" as const,
    label: "1 to 99",
    lowerBound: 1,
    lowerInclusive: true,
    upperBound: 99,
    upperInclusive: true,
    matches: (product: ProductRecord) => product.reviewCount !== null && product.reviewCount >= 1 && product.reviewCount <= 99,
  },
  {
    id: "reviews_100_to_499" as const,
    label: "100 to 499",
    lowerBound: 100,
    lowerInclusive: true,
    upperBound: 499,
    upperInclusive: true,
    matches: (product: ProductRecord) => product.reviewCount !== null && product.reviewCount >= 100 && product.reviewCount <= 499,
  },
  {
    id: "reviews_500_plus" as const,
    label: "500+",
    lowerBound: 500,
    lowerInclusive: true,
    upperBound: null,
    upperInclusive: false,
    matches: (product: ProductRecord) => product.reviewCount !== null && product.reviewCount >= 500,
  },
];

function isPresent(value: string | number | null): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value !== null;
}

function getAttributeValue(product: ProductRecord, attribute: CategoryAttribute): string | number | null {
  return product[attribute];
}

function buildAttributeCoverage(products: ProductRecord[]): AttributeCoverage[] {
  const attributes: CategoryAttribute[] = ["brand", "material", "capacity", "filterCost", "reviewCount"];
  return attributes.map((attribute) => {
    const presentProductIds: string[] = [];
    const missingProductIds: string[] = [];
    for (const product of products) {
      if (isPresent(getAttributeValue(product, attribute))) presentProductIds.push(product.productId);
      else missingProductIds.push(product.productId);
    }
  return {
    attribute,
    presentCount: presentProductIds.length,
    missingCount: missingProductIds.length,
      totalCount: products.length,
      denominator: products.length,
      coverage: products.length === 0 ? null : presentProductIds.length / products.length,
    presentProductIds,
    missingProductIds,
  };
  });
}

function buildBrandShares(products: ProductRecord[]): BrandShare[] {
  const groups = new Map<string | null, string[]>();
  for (const product of products) {
    const normalized = product.brand === null || product.brand.trim() === "" ? null : product.brand.trim();
    const productIds = groups.get(normalized) ?? [];
    productIds.push(product.productId);
    groups.set(normalized, productIds);
  }

  return [...groups.entries()]
    .map(([brand, productIds]) => ({
      brand,
      label: brand ?? "Not provided",
      count: productIds.length,
      denominator: products.length,
      shareOfProducts: products.length === 0 ? 0 : productIds.length / products.length,
      productIds,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function buildLimitations(dataset: ResearchDataset, products: ProductRecord[], coverage: AttributeCoverage[]) {
  const limitations: Array<{ code: CategoryLimitationCode; message: string }> = [
    { code: "current_sample_only", message: "This analysis describes only products in the current sample." },
    { code: "review_count_not_sales", message: "reviewCount is a displayed review count and is not sales." },
  ];
  if (dataset.sourceKind === "demo") {
    limitations.push({ code: "synthetic_demo", message: "Demo data is synthetic and cannot establish a real market pattern." });
  } else {
    limitations.push({ code: "user_supplied_source", message: "User-uploaded data retains its own sourcing limitations." });
  }
  if (coverage.some((item) => item.missingCount > 0)) {
    limitations.push({ code: "missing_attributes", message: "Missing brand or attribute values reduce coverage." });
  }
  if (products.length < 3) {
    limitations.push({ code: "small_sample", message: "Fewer than 3 products limits descriptive inspection." });
  }
  return limitations;
}

export function analyzeCategory(dataset: ResearchDataset): CategoryAnalysis {
  const products = dataset.products;
  const productCount = products.length;
  const priceEntries = products.map(({ productId, priceUsd }) => ({ productId, value: priceUsd }));
  const sortedPrices = priceEntries.map(({ value }) => value).sort((a, b) => a - b);
  const priceQuartiles = quartiles(sortedPrices);
  const coverage = buildAttributeCoverage(products);
  const status: CategoryStatus = productCount >= 3 ? "continue_research" : "insufficient_evidence";
  const statusReasons = productCount >= 3
    ? ["At least 3 products are available for descriptive category inspection; this does not establish commercial attractiveness."]
    : [`Only ${productCount} product(s) are available; fewer than 3 products is insufficient for descriptive category inspection.`];

  return {
    productCount,
    medianPrice: priceQuartiles.median,
    priceRange: {
      min: sortedPrices.length === 0 ? null : sortedPrices[0],
      max: sortedPrices.length === 0 ? null : sortedPrices[sortedPrices.length - 1],
    },
    priceQuartiles,
    priceBands: buildPriceBands(priceEntries, priceQuartiles, productCount),
    ratingBands: buildFixedBands(products, productCount, ratingDefinitions, (product) => product.rating),
    reviewCountBands: buildFixedBands(
      products,
      productCount,
      reviewDefinitions,
      (product) => product.reviewCount ?? 0,
    ),
    missingReviewCount: products.filter((product) => product.reviewCount === null).length,
    missingReviewCountProductIds: products
      .filter((product) => product.reviewCount === null)
      .map((product) => product.productId),
    brandShares: buildBrandShares(products),
    attributeCoverage: coverage,
    evidence: {
      category: dataset.category,
      sourceKind: dataset.sourceKind,
      includedProductIds: products.map((product) => product.productId),
      excludedProducts: [],
      priceCutPoints: uniqueSortedPriceCutPoints(priceQuartiles),
      productDenominator: productCount,
    },
    limitations: buildLimitations(dataset, products, coverage),
    status,
    statusReasons,
  };
}
