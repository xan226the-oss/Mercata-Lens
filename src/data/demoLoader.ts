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
}

export type DemoLoadOutcome = DemoLoadResult | DemoLoadFailure;

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

export async function loadDemoDataset(): Promise<DemoLoadOutcome> {
  const [productsText, reviewsText] = await Promise.all([
    fetch("/demo/products.csv").then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch /demo/products.csv: HTTP ${r.status}`);
      return r.text();
    }),
    fetch("/demo/reviews.csv").then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch /demo/reviews.csv: HTTP ${r.status}`);
      return r.text();
    }),
  ]);

  const products = parseCsv<ProductRecord>(productsText, (row, n) => parseProductRow(row, n));
  const reviews = parseCsv<ReviewRecord>(reviewsText, (row, n) => parseReviewRow(row, n));

  const issues = [...products.issues, ...reviews.issues];
  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const dataset = createResearchDataset({
    category: DEMO_CATEGORY,
    sourceKind: "demo",
    importedAt: new Date().toISOString(),
    products: products.rows,
    reviews: reviews.rows,
  });

  return { ok: true, dataset, productIssues: [], reviewIssues: [] };
}