import { describe, expect, it } from "vitest";
import Papa from "papaparse";
import fs from "node:fs";
import path from "node:path";
import { importResearchCsv } from "../data/csvImport";
import { classifyReview } from "./painPoints";
import { PAIN_POINT_IDS } from "./painPointRules";

type AuditRow = {
  review_id: string;
  system_labels: string;
  human_labels: string;
  outcome: string;
  notes: string;
  auditor: string;
  date: string;
};

const demoDir = path.resolve(__dirname, "../../public/demo");
const evidencePath = path.resolve(__dirname, "../../docs/evidence/review-audit.csv");
const productsCsv = fs.readFileSync(path.join(demoDir, "products.csv"), "utf8");
const reviewsCsv = fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8");

function readAudit(): { rows: AuditRow[]; fields: string[] } {
  const text = fs.readFileSync(evidencePath, "utf8");
  const parsed = Papa.parse<AuditRow>(text, { header: true, skipEmptyLines: true });
  expect(parsed.errors).toEqual([]);
  return { rows: parsed.data, fields: parsed.meta.fields ?? [] };
}

describe("pain-point audit handoff", () => {
  it("contains the exact deterministic 50-review blank audit contract", () => {
    const imported = importResearchCsv(productsCsv, reviewsCsv);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;

    const { rows, fields } = readAudit();
    const expectedHeaders = [
      "review_id",
      "system_labels",
      "human_labels",
      "outcome",
      "notes",
      "auditor",
      "date",
    ];
    expect(fields).toEqual(expectedHeaders);
    expect(rows).toHaveLength(50);
    expect(new Set(rows.map((row) => row.review_id)).size).toBe(50);

    const expectedReviews = imported.dataset.reviews.slice(0, 50);
    expect(rows.map((row) => row.review_id)).toEqual(
      expectedReviews.map((review) => review.reviewId),
    );

    expect(rows.map((row) => row.system_labels.split("|").filter(Boolean))).toEqual(
      expectedReviews.map((review) => {
        const labels = classifyReview(review).automaticLabels;
        expect(labels).toEqual(PAIN_POINT_IDS.filter((id) => labels.includes(id)));
        return labels;
      }),
    );

    for (const row of rows) {
      expect(row.human_labels).toBe("");
      expect(row.outcome).toBe("");
      expect(row.notes).toBe("");
      expect(row.auditor).toBe("");
      expect(row.date).toBe("");
    }
  });

  it("keeps the Demo source files unchanged while validating the handoff", () => {
    const productsBefore = fs.readFileSync(path.join(demoDir, "products.csv"), "utf8");
    const reviewsBefore = fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8");
    readAudit();
    expect(fs.readFileSync(path.join(demoDir, "products.csv"), "utf8")).toBe(productsBefore);
    expect(fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8")).toBe(reviewsBefore);
  });
});
