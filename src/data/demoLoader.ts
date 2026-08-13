/**
 * Loads the curated demo dataset from public/demo/*.csv using Papa Parse.
 * Strict row parsing: any invalid row fails the whole load with issues
 * (no silent skipping). sourceKind is always "demo".
 */
import Papa from "papaparse";
import type {
  ParseIssue,
  ParseResult,
  ProductRecord,
  ResearchDataset,
  ReviewRecord,
} from "../domain/types";
import { parseProductRow, parseReviewRow } from "../domain/schemas";
import { createResearchDataset } from "../domain/dataset";

export interface DemoLoadResult {
  ok: true;
  dataset: ResearchDataset;
  productIssues: ParseIssue[];
  reviewIssues: ParseIssue[];
}

export interface DemoLoadFailure {
  ok: false;
  issues: ParseIssue[];
  /** Present when the failure is a fetch/parse-level error with no row issues. */
  error?: string;
}

export type DemoLoadOutcome = DemoLoadResult | DemoLoadFailure;

/** Structured error thrown by loadDemoDataset on failure. */
export class DemoLoadError extends Error {
  readonly issues: ParseIssue[];
  readonly causeMessage?: string;

  constructor(issues: ParseIssue[], causeMessage?: string) {
    super(
      issues.length > 0
        ? `Demo data failed validation (${issues.length} issue(s)).`
        : `Failed to load demo data${causeMessage ? `: ${causeMessage}` : "."}`,
    );
    this.name = "DemoLoadError";
    this.issues = issues;
    this.causeMessage = causeMessage;
  }
}

export const DEMO_CATEGORY = "Cat Water Fountain";

function parseCsv<T>(
  text: string,
  rowParser: (row: Record<string, unknown>, rowNumber: number) => ParseResult<T>,
): { rows: T[]; issues: ParseIssue[] } {
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: "greedy",
  });
  if (parsed.errors.length > 0) {
    throw new Error(
      `CSV parse error: ${parsed.errors
        .map((e) => `row ${(e.row ?? 0) + 1}: ${e.message}`)
        .join("; ")}`,
    );
  }

  const rows: T[] = [];
  const issues: ParseIssue[] = [];
  parsed.data.forEach((raw, index) => {
    // Papa row index 0 is the first data row after the header.
    const csvRowNumber = index + 2; // 1 = header, so first data row is 2
    const result = rowParser(raw, csvRowNumber);
    if (result.ok) {
      rows.push(result.value as T);
    } else {
      issues.push(...result.issues);
    }
  });
  return { rows, issues };
}

/**
 * Loads the demo dataset and returns it directly.
 * On any failure (fetch error, Papa parse error, or row validation issues)
 * it throws a structured DemoLoadError carrying the diagnostics.
 */
export async function loadDemoDataset(): Promise<ResearchDataset> {
  const productsText = await fetch("/demo/products.csv").then((r) => {
    if (!r.ok) throw new DemoLoadError([], `HTTP ${r.status} fetching /demo/products.csv`);
    return r.text();
  });
  const reviewsText = await fetch("/demo/reviews.csv").then((r) => {
    if (!r.ok) throw new DemoLoadError([], `HTTP ${r.status} fetching /demo/reviews.csv`);
    return r.text();
  });

  const products = parseCsv<ProductRecord>(productsText, (row, n) => parseProductRow(row, n));
  const reviews = parseCsv<ReviewRecord>(reviewsText, (row, n) => parseReviewRow(row, n));

  const issues = [...products.issues, ...reviews.issues];
  if (issues.length > 0) {
    throw new DemoLoadError(issues);
  }

  return createResearchDataset({
    category: DEMO_CATEGORY,
    sourceKind: "demo",
    importedAt: new Date().toISOString(),
    products: products.rows,
    reviews: reviews.rows,
  });
}

/**
 * Safe variant that never throws: resolves to a discriminant outcome
 * so callers can surface row/field diagnostics without try/catch.
 */
export async function tryLoadDemoDataset(): Promise<DemoLoadOutcome> {
  try {
    const dataset = await loadDemoDataset();
    return { ok: true, dataset, productIssues: [], reviewIssues: [] };
  } catch (err: unknown) {
    if (err instanceof DemoLoadError) {
      return { ok: false, issues: err.issues };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, issues: [], error: message };
  }
}