import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import fs from "node:fs";
import path from "node:path";
import userEvent from "@testing-library/user-event";
import { ResearchProvider } from "../research/ResearchContext";
import { ResearchLayout } from "../research/ResearchLayout";
import { PainPointsPage } from "./PainPointsPage";

const demoDir = path.resolve(__dirname, "../../public/demo");
const productsCsv = fs.readFileSync(path.join(demoDir, "products.csv"), "utf8");
const reviewsCsv = fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8");

function stubDemoFetch() {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/demo/products.csv")) return Promise.resolve(new Response(productsCsv, { status: 200 }));
    if (url.endsWith("/demo/reviews.csv")) return Promise.resolve(new Response(reviewsCsv, { status: 200 }));
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as unknown as typeof fetch);
}

function renderPage() {
  return render(
    <ResearchProvider>
      <MemoryRouter initialEntries={["/pain-points"]}>
        <ResearchLayout>
          <Routes><Route path="/pain-points" element={<PainPointsPage />} /></Routes>
        </ResearchLayout>
      </MemoryRouter>
    </ResearchProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("PainPointsPage workbench", () => {
  it("renders bounded demo provenance, seven summaries, and the default rule-matched queue", async () => {
    stubDemoFetch();
    renderPage();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Customer pain-point evidence" })).toBeVisible());
    expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("Synthetic demo");
    expect(screen.getByText(/76 review records/i)).toBeVisible();
    expect(screen.getAllByText("Ruleset 1.0.0").length).toBeGreaterThanOrEqual(7);
    expect(screen.getAllByRole("button", { name: /reviews/i })).toHaveLength(7);
    expect(screen.getByRole("button", { name: "Rule-matched" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/actual review records/i)).toBeVisible();
    expect(document.body.textContent).not.toMatch(/Top pain point|Most important|High demand|Low competition|Recommended|opportunity ranking/i);
  });

  it("filters by effective label and exposes raw selected evidence", async () => {
    stubDemoFetch();
    renderPage();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Customer pain-point evidence" })).toBeVisible());
    await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("Demo data"));
    await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("Demo data"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Rule-matched" })).toHaveAttribute("aria-pressed", "true"));
    await userEvent.click(screen.getByRole("button", { name: /Cleaning difficulty/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true"));
    expect(screen.getByRole("button", { name: /Cleaning difficulty/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Original review" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Open supplied source URL" })).toBeVisible();
    expect(screen.getByText(/Mercata Lens has not fetched/i)).toBeVisible();
  });

  it("provides a truthful no-data fallback", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))) as unknown as typeof fetch);
    renderPage();
    await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("No active data"));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Module locked" })).toBeVisible());
    expect(screen.queryByText(/No active review evidence is available\./)).not.toBeInTheDocument();
  });
});
