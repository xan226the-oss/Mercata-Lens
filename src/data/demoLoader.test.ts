import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { loadDemoDataset, DEMO_CATEGORY } from "./demoLoader";

const demoDir = path.resolve(__dirname, "../../public/demo");
const productsCsv = fs.readFileSync(path.join(demoDir, "products.csv"), "utf8");
const reviewsCsv = fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8");

function stubFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/demo/products.csv")) {
        return Promise.resolve(new Response(productsCsv, { status: 200 }));
      }
      if (url.endsWith("/demo/reviews.csv")) {
        return Promise.resolve(new Response(reviewsCsv, { status: 200 }));
      }
      return Promise.resolve(new Response("not found", { status: 404 }));
    }) as unknown as typeof fetch,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadDemoDataset", () => {
  it("loads exactly 12 products from the demo products.csv", async () => {
    stubFetch();
    const result = await loadDemoDataset();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dataset.products).toHaveLength(12);
  });

  it("loads at least 60 reviews from the demo reviews.csv", async () => {
    stubFetch();
    const result = await loadDemoDataset();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dataset.reviews.length).toBeGreaterThanOrEqual(60);
  });

  it("keeps product_id and review_id globally unique", async () => {
    stubFetch();
    const result = await loadDemoDataset();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const productIds = result.dataset.products.map((p) => p.productId);
    const reviewIds = result.dataset.reviews.map((r) => r.reviewId);
    expect(new Set(productIds).size).toBe(productIds.length);
    expect(new Set(reviewIds).size).toBe(reviewIds.length);
  });

  it("keeps referential integrity: every review points to an existing product and every product has at least one review", async () => {
    stubFetch();
    const result = await loadDemoDataset();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const productIds = new Set(result.dataset.products.map((p) => p.productId));
    for (const review of result.dataset.reviews) {
      expect(productIds.has(review.productId)).toBe(true);
    }
    const covered = new Set(result.dataset.reviews.map((r) => r.productId));
    for (const product of result.dataset.products) {
      expect(covered.has(product.productId)).toBe(true);
    }
  });

  it("uses one unified category value across all products", async () => {
    stubFetch();
    const result = await loadDemoDataset();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const categories = new Set(result.dataset.products.map((p) => p.category));
    expect(categories.size).toBe(1);
    expect(result.dataset.category).toBe(DEMO_CATEGORY);
  });

  it("uses only example.com/demo URLs for every product and review", async () => {
    stubFetch();
    const result = await loadDemoDataset();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const product of result.dataset.products) {
      expect(product.sourceUrl.startsWith("https://example.com/demo/")).toBe(true);
    }
    for (const review of result.dataset.reviews) {
      expect(review.sourceUrl.startsWith("https://example.com/demo/")).toBe(true);
    }
    for (const product of result.dataset.products) {
      expect(product.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("sets schemaVersion 1, market US, currency USD and sourceKind demo", async () => {
    stubFetch();
    const result = await loadDemoDataset();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dataset.schemaVersion).toBe(1);
    expect(result.dataset.market).toBe("US");
    expect(result.dataset.currency).toBe("USD");
    expect(result.dataset.sourceKind).toBe("demo");
  });

  it("fails loudly with issues when a row is invalid (never silently skips)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/demo/products.csv")) {
          const bad = productsCsv.replace("29.99", "29.99extra");
          return Promise.resolve(new Response(bad, { status: 200 }));
        }
        if (url.endsWith("/demo/reviews.csv")) {
          return Promise.resolve(new Response(reviewsCsv, { status: 200 }));
        }
        return Promise.resolve(new Response("not found", { status: 404 }));
      }) as unknown as typeof fetch,
    );
    const result = await loadDemoDataset();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.field === "price_usd")).toBe(true);
  });
});