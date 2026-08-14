import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import fs from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { RESEARCH_STEPS, STEP_ROUTES } from "./routes";
import { ResearchProvider } from "../research/ResearchContext";
import { ResearchLayout } from "../research/ResearchLayout";
import { HomePage } from "../pages/HomePage";

const demoDir = path.resolve(__dirname, "../../public/demo");
const productsCsv = fs.readFileSync(path.join(demoDir, "products.csv"), "utf8");
const reviewsCsv = fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8");

function stubDemoFetch() {
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

function RenderWithProviders({ children }: { children: ReactNode }) {
  return (
    <ResearchProvider>
      <MemoryRouter>
        <ResearchLayout>{children}</ResearchLayout>
      </MemoryRouter>
    </ResearchProvider>
  );
}

/** Let the ResearchProvider's demo load reach ready (stubbed fetch). */
async function settleProvider() {
  await waitFor(() => {
    expect(
      document.body.textContent?.includes("Loading demo research data"),
    ).toBe(false);
  });
}

describe("research step route contract", () => {
  it("defines the six canonical step paths in exact order", () => {
    expect(RESEARCH_STEPS.map((step) => step.path)).toEqual([
      "/",
      "/quality",
      "/category",
      "/pain-points",
      "/opportunities",
      "/decision",
    ]);
  });

  it("labels every step and keeps status in the allowed union", () => {
    for (const step of RESEARCH_STEPS) {
      expect(step.label.length).toBeGreaterThan(0);
      expect(["available", "locked"]).toContain(step.status);
    }
  });

  it("maps the same six paths for route rendering", () => {
    expect(STEP_ROUTES.map((route) => route.path)).toEqual(
      RESEARCH_STEPS.map((step) => step.path),
    );
  });

  it("renders persistent header, scope boundary, warning and demo badge", async () => {
    stubDemoFetch();
    render(
      <RenderWithProviders>
        <HomePage />
      </RenderWithProviders>,
    );

    await settleProvider();

    expect(screen.getByText("Mercata Lens")).toBeInTheDocument();
    expect(screen.getByText("商机镜")).toBeInTheDocument();
    expect(screen.getByText("US market")).toBeInTheDocument();
    expect(screen.getAllByText("Cat Water Fountain").length).toBeGreaterThan(0);
    expect(screen.getByText("Review count is not sales")).toBeInTheDocument();
    expect(screen.getByTestId("source-badge")).toHaveTextContent("Demo data");

    const navigation = screen.getByRole("navigation", { name: "Research steps" });
    for (const step of RESEARCH_STEPS) {
      const link = within(navigation).getByRole("link", {
        name: new RegExp(step.label, "i"),
      });
      expect(link).toHaveAttribute("href", step.path);
    }
  });

  it("does not claim any analysis is complete on placeholder pages", async () => {
    stubDemoFetch();
    for (const { Component } of STEP_ROUTES) {
      const { container } = render(
        <RenderWithProviders>
          <Component />
        </RenderWithProviders>,
      );
      await settleProvider();
      const text = container.textContent ?? "";
      expect(text).not.toMatch(/analysis complete|already completed|score|sales prediction/i);
    }
  });
});