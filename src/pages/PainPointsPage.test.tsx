import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import fs from "node:fs";
import path from "node:path";
import userEvent from "@testing-library/user-event";
import { ResearchProvider } from "../research/ResearchContext";
import { useResearch } from "../research/ResearchContext";
import { ResearchLayout } from "../research/ResearchLayout";
import { PainPointsPage } from "./PainPointsPage";

const demoDir = path.resolve(__dirname, "../../public/demo");
const productsCsv = fs.readFileSync(path.join(demoDir, "products.csv"), "utf8");
const reviewsCsv = fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8");
const uploadProductsCsv = `product_id,title,price_usd,rating,category,source_url,observed_at
u01,Upload Steel Fountain,29.99,4.1,Cat Water Fountain,https://example.com/upload/product/u01,2026-08-22
u02,Upload Quiet Fountain,39.99,4.4,Cat Water Fountain,https://example.com/upload/product/u02,2026-08-22
u03,Upload Compact Fountain,24.99,3.9,Cat Water Fountain,https://example.com/upload/product/u03,2026-08-22`;
const uploadReviewsCsv = `review_id,product_id,rating,review_text,review_date,verified_purchase,source_url
u-r001,u01,2,"Hard to clean and noisy.",2026-08-21,true,https://example.com/upload/review/u-r001
u-r002,u01,3,"The pump died after a week.",2026-08-20,true,https://example.com/upload/review/u-r002
u-r003,u02,4,"My cat ignores it completely.",2026-08-19,false,https://example.com/upload/review/u-r003
u-r004,u02,2,"The filter replacements add up quickly.",2026-08-18,true,https://example.com/upload/review/u-r004
u-r005,u03,3,"It leaks around the base.",2026-08-17,false,https://example.com/upload/review/u-r005
u-r006,u03,4,"The bowl is too small.",2026-08-16,true,https://example.com/upload/review/u-r006
u-r007,u01,5,"The fountain works well.",2026-08-15,true,https://example.com/upload/review/u-r007
u-r008,u02,4,"Water flow is steady.",2026-08-14,false,https://example.com/upload/review/u-r008
u-r009,u03,3,"Setup was straightforward.",2026-08-13,true,https://example.com/upload/review/u-r009
u-r010,u01,2,"Cleaning takes forever and it leaks.",2026-08-12,false,https://example.com/upload/review/u-r010`;

function stubDemoFetch() {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/demo/products.csv")) return Promise.resolve(new Response(productsCsv, { status: 200 }));
    if (url.endsWith("/demo/reviews.csv")) return Promise.resolve(new Response(reviewsCsv, { status: 200 }));
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as unknown as typeof fetch);
}

function ImportHarness() {
  const { dataset, importCsv } = useResearch();
  return <div>
    <output data-testid="harness-review-count">{dataset?.reviews.length ?? 0}</output>
    <button type="button" onClick={() => importCsv("", "")}>Harness failed import</button>
    <button type="button" onClick={() => importCsv(uploadProductsCsv, uploadReviewsCsv)}>Harness successful import</button>
  </div>;
}

function renderPage() {
  return render(
    <ResearchProvider>
      <MemoryRouter initialEntries={["/pain-points"]}>
        <ResearchLayout>
          <Routes><Route path="/pain-points" element={<PainPointsPage />} /></Routes>
        </ResearchLayout>
      </MemoryRouter>
      <ImportHarness />
    </ResearchProvider>,
  );
}

function renderDirectPage() {
  return render(
    <ResearchProvider>
      <MemoryRouter initialEntries={["/pain-points"]}>
        <Routes><Route path="/pain-points" element={<PainPointsPage />} /></Routes>
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

  it("coordinates apply, persistent announcements, filter clearing, and corrected review evidence", async () => {
    stubDemoFetch();
    renderPage();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Customer pain-point evidence" })).toBeVisible());
    const user = userEvent.setup();
    await waitFor(() => expect(screen.getAllByRole("checkbox")).toHaveLength(7));
    const noiseCheckbox = screen.getAllByRole("checkbox")[1];
    await user.click(noiseCheckbox);
    await user.type(screen.getByRole("textbox", { name: "Correction reason" }), "Manual noise annotation");
    await user.click(screen.getByRole("button", { name: "Apply correction & next" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "r002" })).toHaveAttribute("aria-pressed", "true"));
    expect(screen.getAllByRole("status").some((element) => element.textContent?.includes("Correction applied to r001."))).toBe(true);
    expect(screen.getByRole("button", { name: "Corrected" })).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "Corrected" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "r001" })).toBeVisible());
    await user.click(screen.getByRole("button", { name: "r001" }));
    expect(screen.getAllByText("noise", { exact: true }).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("No automatic phrase match.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Cleaning difficulty/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true"));
    await user.click(screen.getByRole("button", { name: "r003" }));
    await user.click(screen.getByRole("button", { name: "Clear signal filter" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "r001" })).toHaveAttribute("aria-pressed", "true"));
  });
  it("repeats the same announcement as a new live-region event", async () => {
    stubDemoFetch();
    renderPage();
    const user = userEvent.setup();
    await waitFor(() => expect(screen.getAllByRole("checkbox")).toHaveLength(7));
    await user.click(screen.getAllByRole("checkbox")[1]);
    await user.type(screen.getByRole("textbox", { name: "Correction reason" }), "Manual noise annotation");
    await user.click(screen.getByRole("button", { name: "Apply correction & next" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "r002" })).toHaveAttribute("aria-pressed", "true"));

    const status = screen.getByTestId("workbench-status");
    const firstSequence = Number(status.getAttribute("data-status-sequence"));
    const firstMessageNode = status.firstElementChild;
    expect(status).toHaveTextContent("Correction applied to r001.");

    await user.click(screen.getByRole("button", { name: "Corrected" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "r001" })).toBeVisible());
    await user.click(screen.getByRole("button", { name: "r001" }));
    await user.clear(screen.getByRole("textbox", { name: "Correction reason" }));
    await user.type(screen.getByRole("textbox", { name: "Correction reason" }), "Manual noise annotation again");
    await user.click(screen.getByRole("button", { name: "Apply correction & next" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "r001" })).toHaveAttribute("aria-pressed", "true"));
    const secondStatus = screen.getByTestId("workbench-status");
    expect(Number(secondStatus.getAttribute("data-status-sequence"))).toBeGreaterThan(firstSequence);
    expect(secondStatus).toHaveTextContent("Correction applied to r001.");
    expect(secondStatus.firstElementChild).not.toBe(firstMessageNode);
  });
  it("renders the direct no-data fallback outside the shell", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))) as unknown as typeof fetch);
    renderDirectPage();
    await waitFor(() => expect(screen.getByText("No active review evidence is available.")).toBeVisible());
  });

  it("keeps the real page correction through failed import and resets it after a distinct successful replacement", async () => {
    stubDemoFetch();
    renderPage();
    const user = userEvent.setup();
    await waitFor(() => expect(screen.getAllByRole("checkbox")).toHaveLength(7));
    await user.click(screen.getAllByRole("checkbox")[1]);
    await user.type(screen.getByRole("textbox", { name: "Correction reason" }), "Manual noise annotation");
    await user.click(screen.getByRole("button", { name: "Apply correction & next" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "r002" })).toHaveAttribute("aria-pressed", "true"));
    await user.click(screen.getByRole("button", { name: /Cleaning difficulty/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "r001" })).toHaveAttribute("aria-pressed", "true"));
    await user.click(screen.getByRole("button", { name: "Harness failed import" }));
    expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("Synthetic demo");
    expect(screen.getByText(/76 review records/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Cleaning difficulty/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "r001" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText("noise", { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("status").some((element) => element.textContent?.includes("Correction applied to r001."))).toBe(true);
    await user.click(screen.getByRole("button", { name: "Harness successful import" }));
    await waitFor(() => expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("User upload"));
    await waitFor(() => expect(screen.getByText(/10 review records/i)).toBeVisible());
    await waitFor(() => expect(screen.getByRole("button", { name: "u-r001" })).toHaveAttribute("aria-pressed", "true"));
    expect(screen.queryByRole("button", { name: "r001" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Original review" })).toBeVisible();
    expect(screen.getAllByText("u-r001", { exact: true })).toHaveLength(2);
    expect(screen.getAllByText("Hard to clean and noisy.", { exact: true })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Rule-matched" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /Cleaning difficulty/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByText("Hard to clean and noisy.")).toHaveLength(2);
    expect(screen.queryByText("Hard to clean. The inside has corners that trap slime no matter how many times I scrub.")).not.toBeInTheDocument();
    expect(screen.queryByText("Correction applied to r001.")).not.toBeInTheDocument();
    expect(screen.queryByText("Correction cleared for r001.")).not.toBeInTheDocument();
    expect(screen.getAllByText("noise", { exact: true }).length).toBeGreaterThan(0);
  });

  it("keeps the clear announcement after the only corrected row is removed", async () => {
    stubDemoFetch();
    renderPage();
    const user = userEvent.setup();
    await waitFor(() => expect(screen.getAllByRole("checkbox")).toHaveLength(7));
    await user.click(screen.getAllByRole("checkbox")[1]);
    await user.type(screen.getByRole("textbox", { name: "Correction reason" }), "Manual noise annotation");
    await user.click(screen.getByRole("button", { name: "Apply correction & next" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "r002" })).toHaveAttribute("aria-pressed", "true"));
    await user.click(screen.getByRole("button", { name: "Corrected" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "r001" })).toBeVisible());
    await user.click(screen.getByRole("button", { name: "r001" }));
    await user.click(screen.getByRole("button", { name: "Clear correction" }));
    await waitFor(() => expect(screen.getByText("No reviews match the current filters.")).toBeVisible());
    expect(screen.getByText("No review selected.")).toBeVisible();
    expect(screen.getAllByRole("status").some((element) => element.textContent?.includes("Correction cleared for r001."))).toBe(true);
  });
  it("supports a manual-only correction through All and No automatic match", async () => {
    stubDemoFetch();
    renderPage();
    const user = userEvent.setup();
    await waitFor(() => expect(screen.getAllByRole("checkbox")).toHaveLength(7));
    await user.click(screen.getByRole("button", { name: "All" }));
    await user.click(screen.getByRole("button", { name: "No automatic match" }));
    await waitFor(() => expect(screen.getByText("No automatic phrase match.")).toBeVisible());
    const manualReviewId = screen.getAllByRole("button", { name: /^r\d+$/ })[0].textContent ?? "";
    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.type(screen.getByRole("textbox", { name: "Correction reason" }), "Manual acceptance annotation");
    await user.click(screen.getByRole("button", { name: "Apply correction & next" }));
    await user.click(screen.getByRole("button", { name: "Corrected" }));
    await waitFor(() => expect(screen.getByRole("button", { name: manualReviewId ?? "" })).toBeVisible());
    await user.click(screen.getByRole("button", { name: manualReviewId ?? "" }));
    expect(screen.getByText("No automatic phrase match.")).toBeVisible();
    expect(screen.getByText("Manually added").parentElement).toHaveTextContent("hard_to_clean");
    expect(screen.getAllByText("Effective labels")[1].parentElement).toHaveTextContent("hard_to_clean");
    expect(screen.queryByText(/Configured phrase:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Rule:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Offsets:/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cleaning difficulty/i })).toHaveTextContent(/10 \/ 76 reviews/);
  });

});
