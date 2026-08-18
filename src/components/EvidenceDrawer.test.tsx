import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { createResearchDataset } from "../domain/dataset";
import { analyzeCategory } from "../domain/category";
import { EvidenceDrawer } from "./EvidenceDrawer";

function product(productId: string, priceUsd: number, overrides: Record<string, unknown> = {}) {
  return {
    productId,
    title: `Product ${productId}`,
    brand: "AquaPet",
    priceUsd,
    rating: 4.2,
    reviewCount: 100,
    category: "Cat Water Fountain",
    material: "Steel",
    capacity: "2L",
    filterCost: 5,
    sourceUrl: `https://example.com/${productId}`,
    observedAt: "2026-08-18",
    ...overrides,
  };
}

describe("EvidenceDrawer", () => {
  it("uses native details and exposes all calculation evidence after opening", async () => {
    const dataset = createResearchDataset({
      category: "Cat Water Fountain",
      sourceKind: "demo",
      importedAt: "2026-08-18T00:00:00.000Z",
      products: [
        product("p1", 10),
        product("p2", 20, { brand: "BlueFlow", material: null, reviewCount: null }),
        product("p3", 30, { brand: null, capacity: null }),
      ],
      reviews: [],
    });
    const analysis = analyzeCategory(dataset);

    render(<EvidenceDrawer analysis={analysis} />);
    expect(screen.getByText("Calculation evidence").closest("summary")).toBeInTheDocument();
    expect(screen.getAllByText(/p1, p2, p3/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Q1:/)).toBeInTheDocument();
    expect(screen.getByText(/Excluded products: None/)).toBeInTheDocument();

    await userEvent.click(screen.getByText("Calculation evidence"));

    for (const id of ["p1", "p2", "p3", ...analysis.priceBands.flatMap((band) => band.productIds), ...analysis.ratingBands.flatMap((band) => band.productIds), ...analysis.reviewCountBands.flatMap((band) => band.productIds)]) {
      expect(screen.getAllByText(id, { exact: false }).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/AquaPet/)).toBeInTheDocument();
    expect(screen.getByText(/BlueFlow/)).toBeInTheDocument();
    expect(screen.getAllByText(/present IDs/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/missing IDs/i).length).toBeGreaterThan(0);
  });
});
