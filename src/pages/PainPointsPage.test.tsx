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

function stubDemoFetch() {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/demo/products.csv")) return Promise.resolve(new Response(productsCsv, { status: 200 }));
    if (url.endsWith("/demo/reviews.csv")) return Promise.resolve(new Response(reviewsCsv, { status: 200 }));
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as unknown as typeof fetch);
}

function ResearchProbe() {
  const { dataset, corrections, applyReviewCorrection, importCsv } = useResearch();
  const reviewId = dataset?.reviews[0]?.reviewId ?? "";
  return <div>
    <output data-testid="probe-correction-count">{Object.keys(corrections).length}</output>
    <button type="button" onClick={() => applyReviewCorrection(reviewId, { add: ["noise"], remove: [], reason: "Probe correction" })}>Probe apply</button>
    <button type="button" onClick={() => importCsv("", "")}>Probe failed import</button>
    <button type="button" onClick={() => importCsv(productsCsv, reviewsCsv)}>Probe successful import</button>
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
    </ResearchProvider>,
  );
}

function renderProbe() {
  return render(<ResearchProvider><ResearchProbe /></ResearchProvider>);
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
  it("renders the direct no-data fallback outside the shell", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))) as unknown as typeof fetch);
    renderDirectPage();
    await waitFor(() => expect(screen.getByText("No active review evidence is available.")).toBeVisible());
  });

  it("keeps corrections on failed import and clears them on successful replacement", async () => {
    stubDemoFetch();
    renderProbe();
    await waitFor(() => expect(screen.getByRole("button", { name: "Probe apply" })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: "Probe apply" }));
    await waitFor(() => expect(screen.getByTestId("probe-correction-count")).toHaveTextContent("1"));
    await userEvent.click(screen.getByRole("button", { name: "Probe failed import" }));
    expect(screen.getByTestId("probe-correction-count")).toHaveTextContent("1");
    await userEvent.click(screen.getByRole("button", { name: "Probe successful import" }));
    await waitFor(() => expect(screen.getByTestId("probe-correction-count")).toHaveTextContent("0"));
  });

});
