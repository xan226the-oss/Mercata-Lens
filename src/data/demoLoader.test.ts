import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  DEMO_CATEGORY,
  DemoLoadError,
  loadDemoDataset,
  tryLoadDemoDataset,
} from "./demoLoader";

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

describe("loadDemoDataset (public contract returns ResearchDataset)", () => {
  it("returns a ResearchDataset with exactly 12 products", async () => {
    stubFetch();
    const dataset = await loadDemoDataset();
    expect(dataset.products).toHaveLength(12);
    expect(dataset.reviews.length).toBeGreaterThanOrEqual(60);
  });

  it("keeps product_id and review_id globally unique", async () => {
    stubFetch();
    const dataset = await loadDemoDataset();
    const productIds = dataset.products.map((p) => p.productId);
    const reviewIds = dataset.reviews.map((r) => r.reviewId);
    expect(new Set(productIds).size).toBe(productIds.length);
    expect(new Set(reviewIds).size).toBe(reviewIds.length);
  });

  it("keeps referential integrity: every review points to an existing product and every product has at least one review", async () => {
    stubFetch();
    const dataset = await loadDemoDataset();
    const productIds = new Set(dataset.products.map((p) => p.productId));
    for (const review of dataset.reviews) {
      expect(productIds.has(review.productId)).toBe(true);
    }
    const covered = new Set(dataset.reviews.map((r) => r.productId));
    for (const product of dataset.products) {
      expect(covered.has(product.productId)).toBe(true);
    }
  });

  it("uses one unified category value across all products", async () => {
    stubFetch();
    const dataset = await loadDemoDataset();
    const categories = new Set(dataset.products.map((p) => p.category));
    expect(categories.size).toBe(1);
    expect(dataset.category).toBe(DEMO_CATEGORY);
  });

  it("uses only example.com/demo URLs for every product and review", async () => {
    stubFetch();
    const dataset = await loadDemoDataset();
    for (const product of dataset.products) {
      expect(product.sourceUrl.startsWith("https://example.com/demo/")).toBe(true);
    }
    for (const review of dataset.reviews) {
      expect(review.sourceUrl.startsWith("https://example.com/demo/")).toBe(true);
    }
    for (const product of dataset.products) {
      expect(product.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("sets schemaVersion 1, market US, currency USD and sourceKind demo", async () => {
    stubFetch();
    const dataset = await loadDemoDataset();
    expect(dataset.schemaVersion).toBe(1);
    expect(dataset.market).toBe("US");
    expect(dataset.currency).toBe("USD");
    expect(dataset.sourceKind).toBe("demo");
  });

  it("throws a structured DemoLoadError with issues when a row is invalid", async () => {
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
    await expect(loadDemoDataset()).rejects.toBeInstanceOf(DemoLoadError);
    try {
      await loadDemoDataset();
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(DemoLoadError);
      const loadError = err as DemoLoadError;
      expect(loadError.issues.length).toBeGreaterThan(0);
      expect(loadError.issues.some((i) => i.field === "price_usd")).toBe(true);
    }
  });

  it("throws a structured DemoLoadError when fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("nope", { status: 500 }))) as unknown as typeof fetch,
    );
    await expect(loadDemoDataset()).rejects.toBeInstanceOf(DemoLoadError);
  });
});

describe("tryLoadDemoDataset (safe diagnostic variant)", () => {
  it("resolves ok with the dataset on success", async () => {
    stubFetch();
    const result = await tryLoadDemoDataset();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dataset.products).toHaveLength(12);
  });

  it("resolves a failure outcome with issues when a row is invalid (never throws)", async () => {
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
    const result = await tryLoadDemoDataset();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.field === "price_usd")).toBe(true);
  });

  it("resolves a failure outcome with empty issues on a fetch error (never throws)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("nope", { status: 500 }))) as unknown as typeof fetch,
    );
    const result = await tryLoadDemoDataset();
    expect(result.ok).toBe(false);
  });
});