/**
 * CSV import layer (Task 3). Turns two raw CSV texts (products + reviews)
 * into a validated, deterministic ResearchDataset.
 *
 * Papa Parse handles lexical CSV parsing (quoted commas, CRLF, BOM);
 * the row parsers from Task 2 remain the single authority for business
 * field validation. Structural rules (duplicate IDs, unknown product
 * references, category scope) live here.
 */
import Papa from "papaparse";
import type {
  ImportResult,
  ParseIssue,
  ProductRecord,
  ResearchDataset,
  ReviewRecord,
} from "../domain/types";
import { parseProductRow, parseReviewRow } from "../domain/schemas";
import { createResearchDataset } from "../domain/dataset";
import { assessQuality } from "../domain/quality";

const EXPECTED_CATEGORY = "Cat Water Fountain";

type ProductRow = Record<string, unknown>;
type ReviewRow = Record<string, unknown>;

export interface CsvLexicalResult<T> {
  rows: T[];
  issues: ParseIssue[];
}

/**
 * Lexical CSV parse with structural checks shared by both files:
 * - non-empty with at least one data row (after optional BOM)
 * - no Papa syntax errors
 * - no duplicate headers
 */
function parseCsvLexically<T>(
  text: string,
  file: "products" | "reviews",
  requiredHeaders: readonly string[],
): CsvLexicalResult<T> {
  const issues: ParseIssue[] = [];

  // Strip a UTF-8 BOM if present; treat BOM/whitespace-only as empty.
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  if (clean.trim().length === 0) {
    issues.push({
      row: 0,
      field: "file",
      code: "required",
      value: "",
      message: `${file} CSV is empty or contains only whitespace/BOM.`,
      file,
    });
    return { rows: [], issues };
  }

  // Parse the first logical record with header:false to obtain the raw
  // header array. This correctly handles BOM, CRLF, quoted fields, and
  // commas inside quoted headers — unlike naive newline+split.
  const headerProbe = Papa.parse<unknown[]>(clean, {
    header: false,
    preview: 1,
    skipEmptyLines: "greedy",
  });
  if (headerProbe.errors.length > 0) {
    for (const e of headerProbe.errors) {
      issues.push({
        row: 1,
        field: "csv",
        code: "invalid_format",
        value: e.message,
        message: `CSV header error: ${e.message}`,
        file,
      });
    }
    return { rows: [], issues };
  }
  const rawHeaders = (headerProbe.data[0] ?? []).map((h) => String(h).trim());

  // Duplicate headers -> blocking error with file, row 1, field name, value.
  const headerSet = new Set<string>();
  let duplicateHeader: string | null = null;
  for (const h of rawHeaders) {
    if (headerSet.has(h)) {
      duplicateHeader = h;
      break;
    }
    headerSet.add(h);
  }
  if (duplicateHeader) {
    issues.push({
      row: 1,
      field: "csv",
      code: "invalid_format",
      value: duplicateHeader,
      message: `Duplicate header column "${duplicateHeader}".`,
      file,
    });
    return { rows: [], issues };
  }

  // Required header check from the same raw array.
  const missing = requiredHeaders.filter((h) => !headerSet.has(h));
  if (missing.length > 0) {
    issues.push({
      row: 1,
      field: "csv",
      code: "invalid_format",
      value: missing,
      message: `Missing required header(s): ${missing.join(", ")}.`,
      file,
    });
    return { rows: [], issues };
  }

  const parsed = Papa.parse<T>(clean, {
    header: true,
    skipEmptyLines: "greedy",
  });

  if (parsed.errors.length > 0) {
    for (const e of parsed.errors) {
      issues.push({
        row: (e.row ?? 0) + 2,
        field: "csv",
        code: "invalid_format",
        value: e.message,
        message: `CSV syntax error: ${e.message}`,
        file,
      });
    }
    return { rows: [], issues };
  }

  if (parsed.data.length === 0) {
    issues.push({
      row: 1,
      field: "file",
      code: "required",
      value: "",
      message: `${file} CSV has a header but no data rows.`,
      file,
    });
    return { rows: [], issues };
  }

  return { rows: parsed.data, issues };
}

const PRODUCT_REQUIRED_HEADERS = [
  "product_id",
  "title",
  "price_usd",
  "rating",
  "category",
  "source_url",
  "observed_at",
] as const;

const REVIEW_REQUIRED_HEADERS = [
  "review_id",
  "product_id",
  "rating",
  "review_text",
  "source_url",
] as const;

/**
 * Synchronous, deterministic import. Returns ok:false (never a half-built
 * dataset) on any blocking issue. Warnings carry low-sample / outlier info.
 */
export function importResearchCsv(
  productsText: string,
  reviewsText: string,
): ImportResult {
  const nowIso = new Date().toISOString();

  // 1. Lexical + structural parse of both files.
  const productLex = parseCsvLexically<ProductRow>(productsText, "products", PRODUCT_REQUIRED_HEADERS);
  const reviewLex = parseCsvLexically<ReviewRow>(reviewsText, "reviews", REVIEW_REQUIRED_HEADERS);

  const lexicalIssues = [...productLex.issues, ...reviewLex.issues];
  if (lexicalIssues.length > 0) {
    return { ok: false, issues: lexicalIssues };
  }

  // 2. Row-level business validation (Task 2 parsers are authoritative).
  const productIssues: ParseIssue[] = [];
  const reviewIssues: ParseIssue[] = [];
  const productRows: ProductRecord[] = [];
  const reviewRows: ReviewRecord[] = [];

  productLex.rows.forEach((row, index) => {
    const csvRowNumber = index + 2;
    const result = parseProductRow(row, csvRowNumber);
    if (result.ok) {
      productRows.push(result.value);
    } else {
      productIssues.push(
        ...result.issues.map((i) => ({ ...i, file: "products" as const })),
      );
    }
  });

  reviewLex.rows.forEach((row, index) => {
    const csvRowNumber = index + 2;
    const result = parseReviewRow(row, csvRowNumber);
    if (result.ok) {
      reviewRows.push(result.value);
    } else {
      reviewIssues.push(
        ...result.issues.map((i) => ({ ...i, file: "reviews" as const })),
      );
    }
  });

  const rowIssues = [...productIssues, ...reviewIssues];
  // Structural checks intentionally run on the valid subset so independent
  // duplicate/reference/category diagnostics are not hidden by row errors.
  const structuralIssues = detectStructuralIssues(productRows, reviewRows);
  const allIssues = [...rowIssues, ...structuralIssues];
  if (allIssues.length > 0) {
    return { ok: false, issues: allIssues };
  }

  // 4. Build dataset (first-occurrence uniqueness already guaranteed by
  //    structural checks; keep original order).
  const dataset: ResearchDataset = createResearchDataset({
    category: EXPECTED_CATEGORY,
    sourceKind: "user_upload",
    importedAt: nowIso,
    products: productRows,
    reviews: reviewRows,
  });

  // 5. Warnings: low sample size and price outliers (from quality gate).
  const quality = assessQuality(dataset);
  return { ok: true, dataset, warnings: quality.warnings };
}

function detectStructuralIssues(
  products: ProductRecord[],
  reviews: ReviewRecord[],
): ParseIssue[] {
  const issues: ParseIssue[] = [];

  // Duplicate product IDs.
  const seenProducts = new Set<string>();
  products.forEach((p) => {
    if (seenProducts.has(p.productId)) {
      issues.push({
        row: p.csvRow ?? 0,
        field: "product_id",
        code: "invalid_format",
        value: p.productId,
        message: `Duplicate product_id "${p.productId}".`,
        file: "products",
      });
    }
    seenProducts.add(p.productId);
  });

  // Category must be exactly the validated demo category, and uniform.
  const categoryRows = products.filter((p) => p.category !== EXPECTED_CATEGORY);
  const categorySet = new Set(products.map((p) => p.category));
  if (categorySet.size > 1) {
    for (const p of categoryRows) {
      issues.push({
        row: p.csvRow ?? 0,
        field: "category",
        code: "invalid_format",
        value: p.category,
        message: `Category must be exactly "${EXPECTED_CATEGORY}".`,
        file: "products",
      });
    }
  } else if (categorySet.size === 1 && !categorySet.has(EXPECTED_CATEGORY)) {
    for (const p of products) {
      issues.push({
        row: p.csvRow ?? 0,
        field: "category",
        code: "invalid_format",
        value: p.category,
        message: `Category must be exactly "${EXPECTED_CATEGORY}".`,
        file: "products",
      });
    }
  }

  // Known product ids for reference checks (only after products are unique).
  const knownProductIds = new Set(products.map((p) => p.productId));

  // Duplicate review IDs and unknown product references.
  const seenReviews = new Set<string>();
  reviews.forEach((r) => {
    if (seenReviews.has(r.reviewId)) {
      issues.push({
        row: r.csvRow ?? 0,
        field: "review_id",
        code: "invalid_format",
        value: r.reviewId,
        message: `Duplicate review_id "${r.reviewId}".`,
        file: "reviews",
      });
    }
    seenReviews.add(r.reviewId);

    if (!knownProductIds.has(r.productId)) {
      issues.push({
        row: r.csvRow ?? 0,
        field: "product_id",
        code: "invalid_format",
        value: r.productId,
        message: `Review references unknown product_id "${r.productId}".`,
        file: "reviews",
      });
    }
  });

  return issues;
}