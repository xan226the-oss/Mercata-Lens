import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { CategoryBand } from "../domain/category";
import { SampleDistribution } from "./SampleDistribution";

const bands: CategoryBand[] = [
  { id: "rating_below_3", label: "Below 3", lowerBound: null, lowerInclusive: false, upperBound: 3, upperInclusive: false, count: 2, shareOfProducts: 2 / 6, productIds: ["p1", "p2"] },
  { id: "rating_3_to_below_4", label: "3 to below 4", lowerBound: 3, lowerInclusive: true, upperBound: 4, upperInclusive: false, count: 1, shareOfProducts: 1 / 6, productIds: ["p3"] },
  { id: "rating_4_to_below_4_5", label: "4 to below 4.5", lowerBound: 4, lowerInclusive: true, upperBound: 4.5, upperInclusive: false, count: 0, shareOfProducts: 0, productIds: [] },
  { id: "rating_4_5_to_5", label: "4.5 to 5", lowerBound: 4.5, lowerInclusive: true, upperBound: 5, upperInclusive: true, count: 3, shareOfProducts: 3 / 6, productIds: ["p4", "p5", "p6"] },
];

describe("SampleDistribution", () => {
  it("preserves band order, zero-count rows, exact counts, shares, scale, and progress values", () => {
    render(<SampleDistribution id="rating" title="Rating distribution" description="Displayed ratings in this sample." bands={bands} productCount={6} />);

    const section = screen.getByTestId("distribution-rating");
    expect(section).toHaveTextContent("Scale: 0 to 6 products in this sample");
    expect(screen.getAllByRole("progressbar")).toHaveLength(4);
    expect(screen.getByRole("progressbar", { name: /4 to below 4.5: 0 of 6 products/i })).toHaveAttribute("value", "0");
    expect(screen.getByTestId("distribution-rating_below_3")).toHaveTextContent("2");
    expect(section.textContent?.indexOf("Below 3")).toBeLessThan(section.textContent?.indexOf("3 to below 4") ?? 0);
    expect(section).toHaveTextContent("33.3%");
  });

  it("shows missing counts and preserves exact content in compact mode", () => {
    render(<SampleDistribution id="price" title="Price distribution" description="Observed price bands." bands={bands.slice(0, 2)} productCount={6} compact missingCount={2} />);

    expect(screen.getByTestId("distribution-price")).toHaveTextContent("2 missing");
    expect(screen.getByTestId("distribution-price")).toHaveTextContent("Scale: 0 to 6 products in this sample");
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
  });
});
