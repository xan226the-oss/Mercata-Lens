/**
 * Strict single-row parsers for product and review CSV records.
 * Row-level field validation only. Cross-row rules (duplicates, unknown
 * product references, sample sizes) belong to a later task.
 */
import type {
  ParseIssue,
  ParseResult,
  ProductRecord,
  ReviewRecord,
} from "./types";

export type ProductRow = Record<string, unknown>;
export type ReviewRow = Record<string, unknown>;

const PRODUCT_REQUIRED_FIELDS = [
  "product_id",
  "title",
  "price_usd",
  "rating",
  "category",
  "source_url",
  "observed_at",
] as const;

const REVIEW_REQUIRED_FIELDS = [
  "review_id",
  "product_id",
  "rating",
  "review_text",
  "source_url",
] as const;

/** A valid http(s) URL. */
function isHttpUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

/** Strict YYYY-MM-DD calendar date; rejects 2026-02-30 etc. */
function isCalendarDate(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

function isBlank(value: unknown): boolean {
  return typeof value === "string" && value.trim().length === 0;
}

/** True/false columns: required when present; empty -> null; anything else fails. */
function parseOptionalBoolean(
  field: string,
  value: unknown,
  row: number,
  issues: ParseIssue[],
): boolean | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && isBlank(value)) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
  }
  issues.push({
    row,
    field,
    code: "invalid_format",
    value,
    message: `${field} must be an explicit true or false; empty is allowed.`,
  });
  return null;
}

/** Optional non-negative finite number or empty -> null. */
function parseOptionalCount(
  field: string,
  value: unknown,
  row: number,
  issues: ParseIssue[],
  opts: { integerOnly: boolean },
): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && isBlank(value)) return null;
  if (typeof value === "number" && !Number.isFinite(value)) {
    issues.push({ row, field, code: "invalid_type", value, message: `${field} must be a finite number.` });
    return null;
  }
  if (typeof value === "string" && value.trim().toLowerCase() === "infinity") {
    issues.push({ row, field, code: "invalid_type", value, message: `${field} must be a finite number.` });
    return null;
  }
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    issues.push({ row, field, code: "invalid_type", value, message: `${field} must be a finite number.` });
    return null;
  }
  if (opts.integerOnly && !Number.isInteger(num)) {
    issues.push({ row, field, code: "invalid_type", value, message: `${field} must be a whole number.` });
    return null;
  }
  if (num < 0) {
    issues.push({ row, field, code: "out_of_range", value, message: `${field} must not be negative.` });
    return null;
  }
  return num;
}

/** Required finite number (may be fractional, e.g. price). */
function parseRequiredNumber(
  field: string,
  value: unknown,
  row: number,
  issues: ParseIssue[],
): number | null {
  if (value === null || value === undefined || isBlank(value)) {
    issues.push({ row, field, code: "required", value, message: `${field} is required.` });
    return null;
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    issues.push({ row, field, code: "invalid_type", value, message: `${field} must be a finite number.` });
    return null;
  }
  if (typeof value === "string" && value.trim().toLowerCase() === "infinity") {
    issues.push({ row, field, code: "invalid_type", value, message: `${field} must be a finite number.` });
    return null;
  }
  const num = typeof value === "number" ? value : Number(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(trimmed)) {
      issues.push({ row, field, code: "invalid_type", value, message: `${field} must be a plain number.` });
      return null;
    }
  }
  if (!Number.isFinite(num)) {
    issues.push({ row, field, code: "invalid_type", value, message: `${field} must be a finite number.` });
    return null;
  }
  if (num < 0) {
    issues.push({ row, field, code: "out_of_range", value, message: `${field} must not be negative.` });
    return null;
  }
  return num;
}

/** Rating in [1, 5]. */
function parseRating(
  field: string,
  value: unknown,
  row: number,
  issues: ParseIssue[],
): number | null {
  const num = parseRequiredNumber(field, value, row, issues);
  if (num === null) return null;
  if (num < 1 || num > 5) {
    issues.push({
      row,
      field,
      code: "out_of_range",
      value,
      message: `${field} must be between 1 and 5.`,
    });
    return null;
  }
  return num;
}

/** Required non-blank string. */
function parseRequiredString(
  field: string,
  value: unknown,
  row: number,
  issues: ParseIssue[],
): string | null {
  if (value === null || value === undefined || isBlank(value)) {
    issues.push({ row, field, code: "required", value, message: `${field} is required.` });
    return null;
  }
  return String(value).trim();
}

/** Optional string: empty -> null, otherwise trimmed string. */
function parseOptionalString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim() === "" ? null : String(value).trim();
}

/** Date columns that are required (observed_at) or optional (review_date). */
function parseDate(
  field: string,
  value: unknown,
  row: number,
  issues: ParseIssue[],
  required: boolean,
): string | null {
  if (value === null || value === undefined || isBlank(value)) {
    if (required) {
      issues.push({ row, field, code: "required", value, message: `${field} is required.` });
    }
    return null;
  }
  const text = String(value).trim();
  if (!isCalendarDate(text)) {
    issues.push({
      row,
      field,
      code: "invalid_format",
      value,
      message: `${field} must be a valid calendar date in YYYY-MM-DD format.`,
    });
    return null;
  }
  return text;
}

function parseRequiredUrl(
  field: string,
  value: unknown,
  row: number,
  issues: ParseIssue[],
): string | null {
  if (value === null || value === undefined || isBlank(value)) {
    issues.push({ row, field, code: "required", value, message: `${field} is required.` });
    return null;
  }
  const text = String(value).trim();
  if (!isHttpUrl(text)) {
    issues.push({
      row,
      field,
      code: "invalid_format",
      value,
      message: `${field} must be a valid http:// or https:// URL.`,
    });
    return null;
  }
  return text;
}

/** Extract unknown keys (not part of any known field set) into diagnostics. */
function collectUnknownColumns(
  row: ProductRow | ReviewRow,
  knownFields: readonly string[],
): Record<string, unknown> {
  const known = new Set<string>(knownFields);
  const unknown: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    if (!known.has(key)) unknown[key] = row[key];
  }
  return unknown;
}

const PRODUCT_KNOWN_FIELDS = [
  ...PRODUCT_REQUIRED_FIELDS,
  "brand",
  "review_count",
  "material",
  "capacity",
  "filter_cost",
];

export function parseProductRow(
  row: ProductRow,
  rowNumber: number,
): ParseResult<ProductRecord> {
  const issues: ParseIssue[] = [];

  const productId = parseRequiredString("product_id", row.product_id, rowNumber, issues);
  const title = parseRequiredString("title", row.title, rowNumber, issues);
  const category = parseRequiredString("category", row.category, rowNumber, issues);
  const priceUsd = parseRequiredNumber("price_usd", row.price_usd, rowNumber, issues);
  const rating = parseRating("rating", row.rating, rowNumber, issues);
  const sourceUrl = parseRequiredUrl("source_url", row.source_url, rowNumber, issues);
  const observedAt = parseDate("observed_at", row.observed_at, rowNumber, issues, true);
  const reviewCount = parseOptionalCount("review_count", row.review_count, rowNumber, issues, {
    integerOnly: true,
  });
  const filterCost = parseOptionalCount("filter_cost", row.filter_cost, rowNumber, issues, {
    integerOnly: false,
  });

  if (issues.length > 0) {
    return { ok: false, issues, rawDiagnostics: collectUnknownColumns(row, PRODUCT_KNOWN_FIELDS) };
  }

  const value: ProductRecord = {
    productId: productId!,
    title: title!,
    brand: parseOptionalString(row.brand),
    priceUsd: priceUsd!,
    rating: rating!,
    reviewCount,
    category: category!,
    material: parseOptionalString(row.material),
    capacity: parseOptionalString(row.capacity),
    filterCost,
    sourceUrl: sourceUrl!,
    observedAt: observedAt!,
  };

  return {
    ok: true,
    value,
    warnings: [],
    rawDiagnostics: collectUnknownColumns(row, PRODUCT_KNOWN_FIELDS),
  };
}

const REVIEW_KNOWN_FIELDS = [
  ...REVIEW_REQUIRED_FIELDS,
  "review_date",
  "verified_purchase",
];

export function parseReviewRow(
  row: ReviewRow,
  rowNumber: number,
): ParseResult<ReviewRecord> {
  const issues: ParseIssue[] = [];

  const reviewId = parseRequiredString("review_id", row.review_id, rowNumber, issues);
  const productId = parseRequiredString("product_id", row.product_id, rowNumber, issues);
  const reviewText = parseRequiredString("review_text", row.review_text, rowNumber, issues);
  const rating = parseRating("rating", row.rating, rowNumber, issues);
  const sourceUrl = parseRequiredUrl("source_url", row.source_url, rowNumber, issues);
  const reviewDate = parseDate("review_date", row.review_date, rowNumber, issues, false);
  const verifiedPurchase = parseOptionalBoolean(
    "verified_purchase",
    row.verified_purchase,
    rowNumber,
    issues,
  );

  if (issues.length > 0) {
    return { ok: false, issues, rawDiagnostics: collectUnknownColumns(row, REVIEW_KNOWN_FIELDS) };
  }

  const value: ReviewRecord = {
    reviewId: reviewId!,
    productId: productId!,
    rating: rating!,
    reviewText: reviewText!,
    reviewDate,
    verifiedPurchase,
    sourceUrl: sourceUrl!,
  };

  return {
    ok: true,
    value,
    warnings: [],
    rawDiagnostics: collectUnknownColumns(row, REVIEW_KNOWN_FIELDS),
  };
}