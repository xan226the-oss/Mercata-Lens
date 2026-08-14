import { describe, expect, it } from "vitest";
import { importResearchCsv } from "./csvImport";

const PRODUCT_HEADER =
  "product_id,title,brand,price_usd,rating,review_count,category,material,capacity,filter_cost,source_url,observed_at";
const REVIEW_HEADER =
  "review_id,product_id,rating,review_text,review_date,verified_purchase,source_url";

/** Escape a single CSV field. */
function csvCell(v: string): string {
  return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

/** products CSV text from product field arrays; header always first. */
function productsCsv(rows: Array<Record<string, string>>): string {
  const header = PRODUCT_HEADER.split(",");
  const lines = rows.map((row) =>
    header.map((h) => csvCell(row[h] ?? "")).join(","),
  );
  return [PRODUCT_HEADER, ...lines].join("\n");
}

/** reviews CSV text. */
function reviewsCsv(rows: Array<Record<string, string>>): string {
  const header = REVIEW_HEADER.split(",");
  const lines = rows.map((row) =>
    header.map((h) => csvCell(row[h] ?? "")).join(","),
  );
  return [REVIEW_HEADER, ...lines].join("\n");
}

function productRow(
  id: string,
  overrides: Record<string, string> = {},
): Record<string, string> {
  return {
    product_id: id,
    title: "Demo Fountain",
    brand: "DemoBrand",
    price_usd: "29.99",
    rating: "4.0",
    review_count: "10",
    category: "Cat Water Fountain",
    material: "Stainless Steel",
    capacity: "2.5L",
    filter_cost: "7.99",
    source_url: `https://example.com/demo/${id}`,
    observed_at: "2026-07-01",
    ...overrides,
  };
}

function reviewRow(
  id: string,
  productId: string,
  overrides: Record<string, string> = {},
): Record<string, string> {
  return {
    review_id: id,
    product_id: productId,
    rating: "4",
    review_text: "Works fine, easy to clean.",
    review_date: "2026-06-01",
    verified_purchase: "true",
    source_url: `https://example.com/demo/review/${id}`,
    ...overrides,
  };
}

const MIN_PRODUCTS = productsCsv([
  productRow("p1"),
  productRow("p2"),
  productRow("p3"),
]);
const MIN_REVIEWS = reviewsCsv(
  Array.from({ length: 10 }, (_, i) =>
    reviewRow(`r${i + 1}`, `p${(i % 3) + 1}`),
  ),
);

describe("importResearchCsv - lexical parsing", () => {
  it("keeps quoted commas inside one column", () => {
    const p = productsCsv([
      productRow("p1", { title: "Fountain, Deluxe" }),
      productRow("p2"),
      productRow("p3"),
    ]);
    const result = importResearchCsv(p, MIN_REVIEWS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dataset.products[0].title).toBe("Fountain, Deluxe");
  });

  it("preserves UTF-8 English text", () => {
    const p = productsCsv([
      productRow("p1", { title: "Café Fountain" }),
      productRow("p2"),
      productRow("p3"),
    ]);
    const result = importResearchCsv(p, MIN_REVIEWS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dataset.products[0].title).toContain("Café");
  });

  it("parses Windows CRLF and reports correct row numbers", () => {
    const p = productsCsv([
      productRow("p1"),
      productRow("p2"),
      productRow("p3"),
    ]).replace(/\n/g, "\r\n");
    const r = MIN_REVIEWS.replace(/\n/g, "\r\n");
    const result = importResearchCsv(p, r);
    expect(result.ok).toBe(true);
  });

  it("accepts a UTF-8 BOM", () => {
    const p = "\uFEFF" + productsCsv([productRow("p1"), productRow("p2"), productRow("p3")]);
    const result = importResearchCsv(p, MIN_REVIEWS);
    expect(result.ok).toBe(true);
  });

  it("allows valid product CSVs to omit every optional column", () => {
    const products = [
      "product_id,title,price_usd,rating,category,source_url,observed_at",
      "p1,Fountain One,29.99,4.0,Cat Water Fountain,https://example.com/p1,2026-07-01",
      "p2,Fountain Two,31.99,4.2,Cat Water Fountain,https://example.com/p2,2026-07-01",
      "p3,Fountain Three,35.99,4.4,Cat Water Fountain,https://example.com/p3,2026-07-01",
    ].join("\n");
    const result = importResearchCsv(products, MIN_REVIEWS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dataset.products[0]).toMatchObject({
      reviewCount: null,
      brand: null,
      material: null,
      capacity: null,
      filterCost: null,
    });
  });

  it("allows valid review CSVs to omit every optional column", () => {
    const reviews = [
      "review_id,product_id,rating,review_text,source_url",
      ...Array.from({ length: 10 }, (_, i) => `r${i + 1},p${(i % 3) + 1},4,Works fine,https://example.com/r${i + 1}`),
    ].join("\n");
    const result = importResearchCsv(MIN_PRODUCTS, reviews);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dataset.reviews[0]).toMatchObject({ reviewDate: null, verifiedPurchase: null });
  });

  it("still rejects a missing required header", () => {
    const products = [
      "product_id,title,price_usd,rating,category,source_url",
      "p1,Fountain One,29.99,4.0,Cat Water Fountain,https://example.com/p1",
    ].join("\n");
    const result = importResearchCsv(products, MIN_REVIEWS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((issue) => issue.message.includes("observed_at"))).toBe(true);
  });

  it("reports record diagnostics with their original CSV row numbers", () => {
    const products = productsCsv([
      productRow("p1"),
      productRow("p2"),
      productRow("p3"),
      productRow("p4"),
      productRow("p5"),
      productRow("p6"),
      productRow("p7"),
      productRow("p8", { price_usd: "999" }),
    ]);
    const result = importResearchCsv(products, MIN_REVIEWS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings.find((issue) => issue.field === "price_usd")).toMatchObject({ row: 9 });
  });

  it("reports duplicate IDs, unknown references, and category errors at their record rows", () => {
    const products = productsCsv([
      productRow("p1"),
      productRow("p1"),
      productRow("p3", { category: "Dog Fountain" }),
    ]);
    const reviews = reviewsCsv([
      reviewRow("r1", "p1"),
      reviewRow("r1", "p1"),
      reviewRow("r3", "missing"),
      ...Array.from({ length: 7 }, (_, i) => reviewRow(`r${i + 4}`, "p1")),
    ]);
    const result = importResearchCsv(products, reviews);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "product_id", file: "products", row: 3 }),
      expect.objectContaining({ field: "review_id", file: "reviews", row: 3 }),
      expect.objectContaining({ field: "product_id", file: "reviews", row: 4 }),
      expect.objectContaining({ field: "category", file: "products", row: 4 }),
    ]));
  });

  it("aggregates row parsing and structural issues from the same import", () => {
    const products = productsCsv([
      productRow("p1"),
      productRow("p1"),
      productRow("p3", { rating: "bad" }),
    ]);
    const reviews = reviewsCsv([
      reviewRow("r1", "missing"),
      ...Array.from({ length: 9 }, (_, i) => reviewRow(`r${i + 2}`, "p3")),
    ]);
    const result = importResearchCsv(products, reviews);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((issue) => issue.field === "rating")).toBe(true);
    expect(result.issues.some((issue) => issue.field === "product_id" && issue.file === "products")).toBe(true);
    expect(result.issues.some((issue) => issue.field === "product_id" && issue.file === "reviews")).toBe(true);
  });

  it("fails when either file is empty", () => {
    expect(importResearchCsv("", MIN_REVIEWS).ok).toBe(false);
    expect(importResearchCsv(MIN_PRODUCTS, "").ok).toBe(false);
    expect(importResearchCsv("   \n  ", MIN_REVIEWS).ok).toBe(false);
  });

  it("fails when a file has only a header and no data rows", () => {
    const result = importResearchCsv(PRODUCT_HEADER, MIN_REVIEWS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({ code: "required", file: "products" });
  });

  it("fails on duplicate headers and identifies the file", () => {
    // product_id appears twice in the header; data row still has 12 values.
    const dupHeader =
      "product_id,title,brand,price_usd,rating,review_count,category,material,capacity,filter_cost,source_url,product_id\np1,Demo Fountain,Db,29.99,4.0,10,Cat Water Fountain,SS,2.5L,7.99,https://e.com/p1,p1";
    const result = importResearchCsv(dupHeader, MIN_REVIEWS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => i.code === "invalid_format" && i.file === "products")).toBe(true);
  });

  it("detects duplicate headers with a UTF-8 BOM", () => {
    const dupHeader =
      "product_id,title,brand,price_usd,rating,review_count,category,material,capacity,filter_cost,source_url,product_id\np1,Demo Fountain,Db,29.99,4.0,10,Cat Water Fountain,SS,2.5L,7.99,https://e.com/p1,p1";
    const result = importResearchCsv("\uFEFF" + dupHeader, MIN_REVIEWS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({
      row: 1,
      code: "invalid_format",
      file: "products",
    });
  });

  it("detects duplicate headers with CRLF line endings", () => {
    const dupHeader =
      "product_id,title,brand,price_usd,rating,review_count,category,material,capacity,filter_cost,source_url,product_id\r\np1,Demo Fountain,Db,29.99,4.0,10,Cat Water Fountain,SS,2.5L,7.99,https://e.com/p1,p1";
    const result = importResearchCsv(dupHeader, MIN_REVIEWS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({
      row: 1,
      code: "invalid_format",
      file: "products",
    });
  });

  it("detects duplicate headers when a header contains a quoted comma", () => {
    // The header array is parsed as one logical record: `price_usd` appears twice.
    const dupHeader =
      '"product_id","title","brand","price,usd","rating","review_count","category","material","capacity","filter_cost","source_url","price,usd"\n' +
      "p1,\"Demo, Fountain\",Db,29.99,4.0,10,Cat Water Fountain,SS,2.5L,7.99,https://e.com/p1,29.99";
    const result = importResearchCsv(dupHeader, MIN_REVIEWS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({
      row: 1,
      code: "invalid_format",
      file: "products",
      value: "price,usd",
    });
    // And no split(",") of the raw line could ever have produced this value.
    expect(result.issues[0].value).toBe("price,usd");
  });

  it("fails on a row parsing error with file, row, field, bad value, message", () => {
    const bad = productsCsv([
      productRow("p1", { rating: "5.1" }),
      productRow("p2"),
      productRow("p3"),
    ]);
    const result = importResearchCsv(bad, MIN_REVIEWS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({
      file: "products",
      field: "rating",
      code: "out_of_range",
    });
  });

  it("fails on duplicate product_id and reports each extra occurrence", () => {
    // Only unique products exist here; reviews line up with all of them.
    const dup = productsCsv([
      productRow("p1"),
      productRow("p1"),
      productRow("p1"),
      productRow("p2"),
      productRow("p3"),
    ]);
    const reviews = reviewsCsv(
      Array.from({ length: 9 }, (_, i) => reviewRow(`r${i + 1}`, `p${(i % 3) + 1}`)),
    );
    const result = importResearchCsv(dup, reviews);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const dupIssues = result.issues.filter(
      (i) => i.field === "product_id" && i.file === "products",
    );
    expect(dupIssues).toHaveLength(2);
  });

  it("fails when a review references an unknown product_id", () => {
    const rows = [
      reviewRow("r1", "nope"),
      ...Array.from({ length: 9 }, (_, i) => reviewRow(`r${i + 2}`, "p1")),
    ];
    const result = importResearchCsv(MIN_PRODUCTS, reviewsCsv(rows));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(
      result.issues.some((i) => i.field === "product_id" && i.file === "reviews"),
    ).toBe(true);
  });

  it("fails on a non-cat-water-fountain or mixed category", () => {
    const wrong = productsCsv([
      productRow("p1", { category: "Dog Fountain" }),
      productRow("p2"),
      productRow("p3"),
    ]);
    expect(importResearchCsv(wrong, MIN_REVIEWS).ok).toBe(false);

    const mixed = productsCsv([
      productRow("p1", { category: "Dog Fountain" }),
      productRow("p2"),
      productRow("p3"),
    ]);
    expect(importResearchCsv(mixed, MIN_REVIEWS).ok).toBe(false);
  });

  it("returns no dataset on failure", () => {
    const result = importResearchCsv("", MIN_REVIEWS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect("dataset" in result).toBe(false);
  });
});

describe("importResearchCsv - success", () => {
  it("returns sourceKind user_upload, US, USD, schema v1", () => {
    const result = importResearchCsv(MIN_PRODUCTS, MIN_REVIEWS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dataset.sourceKind).toBe("user_upload");
    expect(result.dataset.market).toBe("US");
    expect(result.dataset.currency).toBe("USD");
    expect(result.dataset.schemaVersion).toBe(1);
    expect(result.dataset.category).toBe("Cat Water Fountain");
  });

  it("imports with small samples but produces sample warnings", () => {
    const smallP = productsCsv([productRow("p1"), productRow("p2")]);
    const smallR = reviewsCsv(
      Array.from({ length: 5 }, (_, i) => reviewRow(`r${i + 1}`, "p1")),
    );
    const result = importResearchCsv(smallP, smallR);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.dataset.products).toHaveLength(2);
  });

  it("keeps outlier prices in the dataset (warn only)", () => {
    const lines = productsCsv(
      [
        "10", "11", "12", "13", "14", "15", "16", "999",
      ].map((price, i) => productRow(`p${i + 1}`, { price_usd: price })),
    );
    const result = importResearchCsv(lines, MIN_REVIEWS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dataset.products.some((p) => p.priceUsd === 999)).toBe(true);
    expect(result.warnings.some((w) => w.field === "price_usd")).toBe(true);
  });

  it("does not mutate input strings", () => {
    const p = MIN_PRODUCTS;
    const r = MIN_REVIEWS;
    importResearchCsv(p, r);
    expect(p).toBe(MIN_PRODUCTS);
    expect(r).toBe(MIN_REVIEWS);
  });
});