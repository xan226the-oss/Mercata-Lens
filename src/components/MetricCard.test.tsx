import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  it("exposes the value and visible evidence notes", () => {
    render(
      <MetricCard
        id="median-price"
        label="Median observed price"
        value="$29.50"
        evidenceNote="Derived from 6 products"
        calculationNote="Middle two observed prices averaged"
      />,
    );

    expect(screen.getByTestId("metric-card-median-price")).toHaveTextContent("$29.50");
    expect(screen.getByText("Median observed price")).toBeVisible();
    expect(screen.getByText("Derived from 6 products")).toBeVisible();
    expect(screen.getByText("Middle two observed prices averaged")).toBeVisible();
  });
});
