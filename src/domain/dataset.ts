/**
 * ResearchDataset construction and helpers (Task 2).
 * Builds a versioned dataset envelope from parsed records.
 * No statistics, no cross-row quality rules — those belong to later tasks.
 */
import type {
  ProductRecord,
  ResearchDataset,
  ReviewRecord,
  SourceKind,
} from "./types";

export const DATASET_SCHEMA_VERSION = 1 as const;
export const DATASET_MARKET = "US" as const;
export const DATASET_CURRENCY = "USD" as const;

export interface CreateDatasetOptions {
  category: string;
  sourceKind: SourceKind;
  importedAt: string;
  products: ProductRecord[];
  reviews: ReviewRecord[];
}

/** Build an immutable-looking dataset envelope with the fixed v1 header. */
export function createResearchDataset(options: CreateDatasetOptions): ResearchDataset {
  return {
    schemaVersion: DATASET_SCHEMA_VERSION,
    market: DATASET_MARKET,
    currency: DATASET_CURRENCY,
    category: options.category,
    sourceKind: options.sourceKind,
    products: options.products.map((p) => Object.freeze({ ...p })),
    reviews: options.reviews.map((r) => Object.freeze({ ...r })),
    importedAt: options.importedAt,
  };
}