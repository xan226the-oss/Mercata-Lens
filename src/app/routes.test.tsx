import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { RESEARCH_STEPS, STEP_ROUTES } from "./routes";
import { ResearchProvider } from "../research/ResearchContext";
import { ResearchLayout } from "../research/ResearchLayout";
import { HomePage } from "../pages/HomePage";

function RenderWithProviders({ children }: { children: ReactNode }) {
  return (
    <ResearchProvider>
      <MemoryRouter>
        <ResearchLayout>{children}</ResearchLayout>
      </MemoryRouter>
    </ResearchProvider>
  );
}

/** Let the ResearchProvider's async demo load settle to avoid act() warnings. */
async function settleProvider() {
  await waitFor(() => {
    // Once the async load settles, the "loading" placeholder disappears.
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
    render(
      <RenderWithProviders>
        <HomePage />
      </RenderWithProviders>,
    );

    await settleProvider();

    expect(screen.getByText("Mercata Lens")).toBeInTheDocument();
    expect(screen.getByText("商机镜")).toBeInTheDocument();
    expect(
      screen.getByText("Demo scope: US cat water fountains"),
    ).toBeInTheDocument();
    expect(screen.getByText("Review count is not sales")).toBeInTheDocument();
    expect(screen.getByText("Demo data")).toBeInTheDocument();

    for (const step of RESEARCH_STEPS) {
      const link = screen.getByRole("link", {
        name: new RegExp(step.label, "i"),
      });
      expect(link).toHaveAttribute("href", step.path);
    }
  });

  it("does not claim any analysis is complete on placeholder pages", async () => {
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
