import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import fs from "node:fs";
import path from "node:path";
import { ResearchProvider } from "./ResearchContext";
import { ResearchLayout } from "./ResearchLayout";
import { HomePage } from "../pages/HomePage";
import { QualityPage } from "../pages/QualityPage";
import { CategoryPage } from "../pages/CategoryPage";
import { PainPointsPage } from "../pages/PainPointsPage";
import { OpportunitiesPage } from "../pages/OpportunitiesPage";
import { DecisionPage } from "../pages/DecisionPage";

const demoDir = path.resolve(__dirname, "../../public/demo");
const productsCsv = fs.readFileSync(path.join(demoDir, "products.csv"), "utf8");
const reviewsCsv = fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8");

function renderApp(initialEntries: string[] = ["/"]) {
  return render(
    <ResearchProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <ResearchLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quality" element={<QualityPage />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/pain-points" element={<PainPointsPage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/decision" element={<DecisionPage />} />
          </Routes>
        </ResearchLayout>
      </MemoryRouter>
    </ResearchProvider>
  );
}

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

describe("ResearchLayout Light Slate shell", () => {
  it("renders the approved landmarks and scope after Demo is ready", async () => {
    stubDemoFetch();
    renderApp();
    await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("Demo data"));

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Research steps" })).toBeInTheDocument();
    expect(screen.getByText("US market")).toBeInTheDocument();
    expect(screen.getAllByText("Cat Water Fountain").length).toBeGreaterThan(0);
    expect(screen.getByText("Review count is not sales")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Data quality/i })).toHaveAttribute("href", "/quality");
  });

  it("resets the workspace scroll position when switching research steps", async () => {
    stubDemoFetch();
    renderApp();
    await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("Demo data"));

    const workspace = document.querySelector<HTMLElement>(".app-workspace");
    expect(workspace).not.toBeNull();
    const scrollTo = vi.fn();
    Object.defineProperty(workspace, "scrollTo", { configurable: true, value: scrollTo });

    await userEvent.click(screen.getByRole("link", { name: /Data quality/i }));

    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" }));
  });


  it("shows User upload after a successful import", async () => {
    stubDemoFetch();
    renderApp();
    await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("Demo data"));
    await userEvent.upload(
      screen.getByLabelText("Products CSV") as HTMLInputElement,
      new File([productsCsv], "products.csv", { type: "text/csv" }),
    );
    await userEvent.upload(
      screen.getByLabelText("Reviews CSV") as HTMLInputElement,
      new File([reviewsCsv], "reviews.csv", { type: "text/csv" }),
    );
    await userEvent.click(screen.getByTestId("import-button"));
    await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("User upload"));
  });

  it("shows Loading data while the Demo fetch is pending", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));
    renderApp();
    expect(screen.getByTestId("source-badge")).toHaveTextContent("Loading data");
    expect(screen.getByTestId("source-badge")).not.toHaveTextContent("User upload");
  });

  it("shows No active data after Demo loading fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    renderApp();
    await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("No active data"));
    expect(screen.getByTestId("source-badge")).not.toHaveTextContent("User upload");
  });

  it("keeps low-sample locked steps non-interactive and direct locked URLs protected", async () => {
    stubDemoFetch();
    renderApp();
    await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("Demo data"));
    const smallProducts = [
      "product_id,title,price_usd,rating,category,source_url,observed_at",
      "p1,One,20,4,Cat Water Fountain,https://example.com/p1,2026-07-01",
      "p2,Two,21,4,Cat Water Fountain,https://example.com/p2,2026-07-01",
    ].join("\n");
    const smallReviews = [
      "review_id,product_id,rating,review_text,source_url",
      ...Array.from({ length: 5 }, (_, i) => `r${i + 1},p1,4,Works,https://example.com/r${i + 1}`),
    ].join("\n");
    await userEvent.upload(screen.getByLabelText("Products CSV") as HTMLInputElement, new File([smallProducts], "small-products.csv"));
    await userEvent.upload(screen.getByLabelText("Reviews CSV") as HTMLInputElement, new File([smallReviews], "small-reviews.csv"));
    await userEvent.click(screen.getByTestId("import-button"));
    await waitFor(() => {
      expect(screen.getByTestId("source-badge")).toHaveTextContent("User upload");
    });
    const lockedCategory = screen.getByTestId("step-locked-/category");
    expect(lockedCategory).toHaveAttribute("aria-disabled", "true");
    expect(lockedCategory).toHaveTextContent("Locked");
    expect(lockedCategory).not.toHaveAttribute("href");
    expect(within(screen.getByRole("navigation", { name: "Research steps" })).queryByRole("link", { name: /Category overview/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("lock-reason")).toHaveTextContent(
      /current data does not meet its evidence requirements/i,
    );
  });
});
