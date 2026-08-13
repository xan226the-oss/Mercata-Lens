import { describe, expect, it } from "vitest";
import { parseProductRow, parseReviewRow } from "./schemas";

describe("parseProductRow", () => {
  it('parses the price string "29.99" into the number 29.99', () => {
    const row = {
      product_id: "p1",
      title: "Demo Fountain",
      brand: "DemoBrand",
      price_usd: "29.99",
      rating: "4.2",
      review_count: "150",
      category: "Cat Water Fountain",
      material: "Stainless Steel",
      capacity: "2.5L",
      filter_cost: "7.99",
      source_url: "https://example.com/demo/p1",
      observed_at: "2026-07-01",
    };
    const result = parseProductRow(row, 2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.priceUsd).toBe(29.99);
  });

  it("rejects a product rating of 5.1 (out of range 1-5)", () => {
    const row = {
      product_id: "p1",
      title: "Demo Fountain",
      brand: null,
      price_usd: "29.99",
      rating: "5.1",
      review_count: "150",
      category: "Cat Water Fountain",
      material: null,
      capacity: null,
      filter_cost: null,
      source_url: "https://example.com/demo/p1",
      observed_at: "2026-07-01",
    };
    const result = parseProductRow(row, 3);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({ row: 3, field: "rating", code: "out_of_range" });
  });

  it("accepts empty review_count as null and rejects negatives and decimals", () => {
    const base = {
      product_id: "p2",
      title: "Demo Fountain 2",
      brand: null,
      price_usd: "39.99",
      rating: "4.0",
      category: "Cat Water Fountain",
      material: null,
      capacity: null,
      filter_cost: null,
      source_url: "https://example.com/demo/p2",
      observed_at: "2026-07-01",
    };
    const empty = parseProductRow({ ...base, review_count: "" }, 4);
    expect(empty.ok).toBe(true);
    if (!empty.ok) return;
    expect(empty.value.reviewCount).toBeNull();

    const negative = parseProductRow({ ...base, review_count: "-3" }, 5);
    expect(negative.ok).toBe(false);
    if (negative.ok) return;
    expect(negative.issues[0]).toMatchObject({ field: "review_count", code: "out_of_range" });

    const decimal = parseProductRow({ ...base, review_count: "4.5" }, 6);
    expect(decimal.ok).toBe(false);
    if (decimal.ok) return;
    expect(decimal.issues[0]).toMatchObject({ field: "review_count", code: "invalid_type" });
  });

  it("rejects non-finite or non-numeric prices like 29abc, Infinity, NaN", () => {
    const base = {
      product_id: "p3",
      title: "Demo Fountain 3",
      brand: null,
      price_usd: "29.99",
      rating: "4.0",
      review_count: null,
      category: "Cat Water Fountain",
      material: null,
      capacity: null,
      filter_cost: null,
      source_url: "https://example.com/demo/p3",
      observed_at: "2026-07-01",
    };
    for (const bad of ["29abc", "Infinity", "NaN"]) {
      const result = parseProductRow({ ...base, price_usd: bad }, 7);
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.issues[0]).toMatchObject({ field: "price_usd", code: "invalid_type" });
    }
  });

  it("treats required fields with only whitespace as missing", () => {
    const row = {
      product_id: "   ",
      title: "   ",
      brand: null,
      price_usd: "29.99",
      rating: "4.0",
      review_count: null,
      category: "Cat Water Fountain",
      material: null,
      capacity: null,
      filter_cost: null,
      source_url: "https://example.com/demo/p4",
      observed_at: "2026-07-01",
    };
    const result = parseProductRow(row, 8);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const fields = result.issues.map((i) => i.field);
    expect(fields).toContain("product_id");
    expect(fields).toContain("title");
    expect(result.issues.every((i) => i.code === "required")).toBe(true);
  });

  it("rejects an invalid URL and reports exact field and row number", () => {
    const row = {
      product_id: "p5",
      title: "Demo Fountain 5",
      brand: null,
      price_usd: "19.99",
      rating: "3.5",
      review_count: null,
      category: "Cat Water Fountain",
      material: null,
      capacity: null,
      filter_cost: null,
      source_url: "not-a-url",
      observed_at: "2026-07-01",
    };
    const result = parseProductRow(row, 9);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({
      row: 9,
      field: "source_url",
      code: "invalid_format",
      value: "not-a-url",
    });
  });

  it("rejects an invalid observed_at non-calendar date", () => {
    const row = {
      product_id: "p6",
      title: "Demo Fountain 6",
      brand: null,
      price_usd: "19.99",
      rating: "3.5",
      review_count: null,
      category: "Cat Water Fountain",
      material: null,
      capacity: null,
      filter_cost: null,
      source_url: "https://example.com/demo/p6",
      observed_at: "2026-02-30",
    };
    const result = parseProductRow(row, 10);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({ field: "observed_at", code: "invalid_format" });
  });

  it("keeps unknown columns only in rawDiagnostics, never in domain state", () => {
    const row = {
      product_id: "p7",
      title: "Demo Fountain 7",
      brand: null,
      price_usd: "29.99",
      rating: "4.0",
      review_count: null,
      category: "Cat Water Fountain",
      material: null,
      capacity: null,
      filter_cost: null,
      source_url: "https://example.com/demo/p7",
      observed_at: "2026-07-01",
      asin: "B0FAKE12345",
      sales_rank: "42",
    };
    const result = parseProductRow(row, 11);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toHaveProperty("asin");
    expect(result.value).not.toHaveProperty("sales_rank");
    expect(result.rawDiagnostics).toMatchObject({ asin: "B0FAKE12345", sales_rank: "42" });
  });

  it("does not mutate the input object", () => {
    const row = {
      product_id: "p8",
      title: "Demo Fountain 8",
      brand: null,
      price_usd: "29.99",
      rating: "4.0",
      review_count: null,
      category: "Cat Water Fountain",
      material: null,
      capacity: null,
      filter_cost: null,
      source_url: "https://example.com/demo/p8",
      observed_at: "2026-07-01",
    };
    const snapshot = JSON.stringify(row);
    parseProductRow(row, 12);
    expect(JSON.stringify(row)).toBe(snapshot);
  });
});

describe("parseReviewRow", () => {
  it("parses a valid review row into ReviewRecord", () => {
    const row = {
      review_id: "r1",
      product_id: "p1",
      rating: "5",
      review_text: "Easy to clean. No complaints.",
      review_date: "2026-06-01",
      verified_purchase: "true",
      source_url: "https://example.com/demo/reviews/r1",
    };
    const result = parseReviewRow(row, 2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.rating).toBe(5);
    expect(result.value.verifiedPurchase).toBe(true);
  });

  it("rejects a review rating of 5.1 (out of range 1-5)", () => {
    const row = {
      review_id: "r2",
      product_id: "p1",
      rating: "5.1",
      review_text: "Ok.",
      review_date: null,
      verified_purchase: null,
      source_url: "https://example.com/demo/reviews/r2",
    };
    const result = parseReviewRow(row, 3);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({ row: 3, field: "rating", code: "out_of_range" });
  });

  it("converts empty verified_purchase to null, never false", () => {
    const row = {
      review_id: "r3",
      product_id: "p1",
      rating: "4",
      review_text: "Works fine.",
      review_date: null,
      verified_purchase: "",
      source_url: "https://example.com/demo/reviews/r3",
    };
    const result = parseReviewRow(row, 4);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.verifiedPurchase).toBeNull();
  });

  it("accepts only explicit true/false representations and guesses nothing else", () => {
    const base = {
      review_id: "r4",
      product_id: "p1",
      rating: "4",
      review_text: "Good.",
      review_date: null,
      source_url: "https://example.com/demo/reviews/r4",
    };
    const t = parseReviewRow({ ...base, verified_purchase: "false" }, 5);
    expect(t.ok).toBe(true);
    if (!t.ok) return;
    expect(t.value.verifiedPurchase).toBe(false);

    const maybe = parseReviewRow({ ...base, verified_purchase: "maybe" }, 6);
    expect(maybe.ok).toBe(false);
    if (maybe.ok) return;
    expect(maybe.issues[0]).toMatchObject({ field: "verified_purchase", code: "invalid_format" });
  });

  it("rejects a non-calendar review_date", () => {
    const row = {
      review_id: "r5",
      product_id: "p1",
      rating: "3",
      review_text: "Noisy pump.",
      review_date: "2026-13-40",
      verified_purchase: null,
      source_url: "https://example.com/demo/reviews/r5",
    };
    const result = parseReviewRow(row, 7);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({ field: "review_date", code: "invalid_format" });
  });

  it("keeps unknown columns only in rawDiagnostics for reviews too", () => {
    const row = {
      review_id: "r6",
      product_id: "p1",
      rating: "4",
      review_text: "Fine.",
      review_date: null,
      verified_purchase: null,
      source_url: "https://example.com/demo/reviews/r6",
      helpful_votes: "12",
    };
    const result = parseReviewRow(row, 8);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toHaveProperty("helpful_votes");
    expect(result.rawDiagnostics).toMatchObject({ helpful_votes: "12" });
  });

  it("does not mutate the input object", () => {
    const row = {
      review_id: "r7",
      product_id: "p1",
      rating: "4",
      review_text: "Fine.",
      review_date: null,
      verified_purchase: null,
      source_url: "https://example.com/demo/reviews/r7",
    };
    const snapshot = JSON.stringify(row);
    parseReviewRow(row, 9);
    expect(JSON.stringify(row)).toBe(snapshot);
  });
});