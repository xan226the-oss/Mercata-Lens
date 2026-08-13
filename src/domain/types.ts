/**
 * Versioned domain contracts for Mercata Lens (Task 2).
 * Types only — no parsing, no analysis, no economics calculation.
 */

export type SourceKind = "demo" | "user_upload";
export type EvidenceKind = "observed" | "assumption" | "derived";

export interface ProductRecord {
  productId: string;
  title: string;
  brand: string | null;
  priceUsd: number;
  rating: number;
  reviewCount: number | null;
  category: string;
  material: string | null;
  capacity: string | null;
  filterCost: number | null;
  sourceUrl: string;
  observedAt: string;
}

export interface ReviewRecord {
  reviewId: string;
  productId: string;
  rating: number;
  reviewText: string;
  reviewDate: string | null;
  verifiedPurchase: boolean | null;
  sourceUrl: string;
}

export interface ResearchDataset {
  schemaVersion: 1;
  market: "US";
  currency: "USD";
  category: string;
  sourceKind: SourceKind;
  products: ProductRecord[];
  reviews: ReviewRecord[];
  importedAt: string;
}

export interface DataProvenance {
  sourceKind: SourceKind;
  evidenceKind: EvidenceKind;
  sourceUrl: string | null;
  observedAt: string | null;
  note: string;
}

/**
 * Economics contract types, referenced by ResearchState.
 * Defined here for type completeness only; no economics logic exists
 * until its dedicated task. All fields remain nullable until filled in.
 */
export interface EconomicInputs {
  salePriceCents: number | null;
  sourcingCostCents: number | null;
  inboundFreightCents: number | null;
  referralFeeRate: number | null;
  fulfillmentCostCents: number | null;
  advertisingCostCents: number | null;
  returnLossCents: number | null;
  otherCostCents: number | null;
}

export interface EconomicScenario {
  id: "pessimistic" | "base" | "optimistic";
  label: string;
  inputs: EconomicInputs;
  provenance: Record<keyof EconomicInputs, DataProvenance | null>;
}

/**
 * Full research state contract (schema v1).
 * Corrections / economicsByOpportunity / weights / decisionDraft are
 * structural placeholders consumed by later tasks.
 */
export interface ResearchState {
  schemaVersion: 1;
  dataset: ResearchDataset;
  corrections: Record<string, { add: string[]; remove: string[]; reason: string }>;
  economicsByOpportunity: Record<string, EconomicScenario[]>;
  weights: Record<
    "demand" | "supply_gap" | "economics" | "differentiation" | "risk",
    number
  >;
  decisionDraft: {
    continueConditions: string[];
    pauseConditions: string[];
    stopConditions: string[];
  };
  updatedAt: string;
}

export type ParseIssueCode =
  | "required"
  | "invalid_type"
  | "out_of_range"
  | "invalid_format";

export interface ParseIssue {
  row: number;
  field: string;
  code: ParseIssueCode;
  value: unknown;
  message: string;
}

export type ParseResult<T> =
  | {
      ok: true;
      value: T;
      warnings: ParseIssue[];
      rawDiagnostics?: Record<string, unknown>;
    }
  | {
      ok: false;
      issues: ParseIssue[];
      rawDiagnostics?: Record<string, unknown>;
    };