import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { MemoryRouter } from "react-router-dom";
import { ResearchProvider } from "../research/ResearchContext";
import { ResearchLayout } from "../research/ResearchLayout";
import { CategoryPage } from "./CategoryPage";

const demoDir = path.resolve(__dirname, "../../public/demo");
const productsCsv = fs.readFileSync(path.join(demoDir, "products.csv"), "utf8");
const reviewsCsv = fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8");

function stubFetch() {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/demo/products.csv")) return Promise.resolve(new Response(productsCsv, { status: 200 }));
    if (url.endsWith("/demo/reviews.csv")) return Promise.resolve(new Response(reviewsCsv, { status: 200 }));
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as unknown as typeof fetch);
}

afterEach(() => vi.unstubAllGlobals());

describe("CategoryPage", () => {
  it("renders traceable overview sections from the active demo analysis", async () => {
    stubFetch();
    render(<ResearchProvider><MemoryRouter initialEntries={["/category"]}><ResearchLayout><CategoryPage /></ResearchLayout></MemoryRouter></ResearchProvider>);
    await waitFor(() => expect(screen.getByTestId("metric-card-products")).toHaveTextContent("12"));

    expect(screen.getByRole("heading", { name: "Category overview" })).toBeVisible();
    expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("Synthetic demo");
    expect(screen.getByTestId("metric-card-median-price")).toHaveTextContent("$");
    expect(screen.getByTestId("metric-card-price-range")).toHaveTextContent("$");
    expect(screen.getByTestId("metric-card-brands")).toBeVisible();
    expect(screen.getByTestId("distribution-price")).toBeVisible();
    expect(screen.getByTestId("distribution-rating")).toBeVisible();
    expect(screen.getByTestId("distribution-reviews")).toBeVisible();
    expect(screen.getByTestId("category-brand-share")).toHaveTextContent(/current sample/i);
    expect(screen.getByTestId("category-attribute-coverage")).toBeVisible();
    expect(screen.getByTestId("category-evidence")).toBeInTheDocument();
    expect(screen.getByTestId("category-limitations")).toHaveTextContent(/not sales/i);
    expect(screen.getByTestId("category-status")).toHaveTextContent("Continue research");
    expect(document.body.textContent).not.toMatch(/(?:represents|shows|proves|establishes|is)\s+(?:market share|low competition|recommended price|best launch price|sales|purchase advice)/i);
  });
});
