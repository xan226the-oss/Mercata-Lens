import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "node:fs";
import path from "node:path";
import { ResearchProvider, useResearch } from "./ResearchContext";
import type { EconomicScenario } from "../domain/types";

const demoDir = path.resolve(__dirname, "../../public/demo");
const productsCsv = fs.readFileSync(path.join(demoDir, "products.csv"), "utf8");
const reviewsCsv = fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8");
let externalEconomicScenario: EconomicScenario | null = null;

function stubDemoFetch() {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/demo/products.csv")) return Promise.resolve(new Response(productsCsv, { status: 200 }));
    if (url.endsWith("/demo/reviews.csv")) return Promise.resolve(new Response(reviewsCsv, { status: 200 }));
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as unknown as typeof fetch);
}

function Probe() {
  const research = useResearch();
  const reviewId = research.dataset?.reviews[0]?.reviewId ?? "missing";
  return (
    <div>
      <span data-testid="correction-count">{Object.keys(research.corrections ?? {}).length}</span>
      <span data-testid="stored-reason" data-reason={research.corrections?.[reviewId]?.reason ?? ""}>{research.corrections?.[reviewId]?.reason ?? ""}</span>
      <span data-testid="source-kind">{research.sourceKind ?? "none"}</span>
      <span data-testid="research-status">{research.status}</span>
      <span data-testid="apply-result" />
      <span data-testid="economic-scenarios">{JSON.stringify(research.economicScenarios)}</span>
      <button onClick={() => {
        const scenario = research.economicScenarios[1];
        if (!scenario) return;
        externalEconomicScenario = {
          ...scenario,
          inputs: { ...scenario.inputs, salePriceCents: 8888 },
          provenance: {
            ...scenario.provenance,
            salePriceCents: scenario.provenance.salePriceCents ? { ...scenario.provenance.salePriceCents, note: "External note" } : null,
          },
        };
        document.querySelector("[data-testid=apply-result]")!.textContent = String(research.replaceEconomicScenario(externalEconomicScenario));
      }}>Store external economics</button>
      <button onClick={() => {
        if (!externalEconomicScenario) return;
        externalEconomicScenario.inputs.salePriceCents = 9999;
        if (externalEconomicScenario.provenance.salePriceCents) externalEconomicScenario.provenance.salePriceCents.note = "Mutated external note";
        document.querySelector("[data-testid=apply-result]")!.textContent = JSON.stringify(research.economicScenarios[1]);
      }}>Mutate external economics</button>
      <button onClick={() => {
        const scenario = research.economicScenarios[1];
        if (!scenario) return;
        document.querySelector("[data-testid=apply-result]")!.textContent = String(research.replaceEconomicScenario({ ...scenario, id: "unknown" as EconomicScenario["id"] }));
      }}>Reject unknown economics</button>
      <button onClick={() => {
        const ok = research.applyReviewCorrection(reviewId, { add: ["noise"], remove: [], reason: "  Reviewed against source  " });
        document.querySelector("[data-testid=apply-result]")!.textContent = String(ok);
      }}>Apply valid correction</button>
      <button onClick={() => {
        const ok = research.applyReviewCorrection(reviewId, { add: ["noise"], remove: [], reason: "   " });
        document.querySelector("[data-testid=apply-result]")!.textContent = String(ok);
      }}>Apply blank correction</button>
      <button onClick={() => {
        const ok = research.applyReviewCorrection("unknown", { add: ["noise"], remove: [], reason: "Unknown" });
        document.querySelector("[data-testid=apply-result]")!.textContent = String(ok);
      }}>Apply unknown review correction</button>
      <button onClick={() => research.clearReviewCorrection(reviewId)}>Clear correction</button>
      <button onClick={() => research.clearReviewCorrection("missing")}>Clear missing correction</button>
      <button onClick={() => research.importCsv(productsCsv, reviewsCsv)}>Import valid CSV</button>
      <button onClick={() => research.importCsv("bad", "bad")}>Import invalid CSV</button>
      <button onClick={() => research.loadDemo()}>Reload failing demo</button>
    </div>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("ResearchContext current-session corrections", () => {
  it("starts empty, validates and copies corrections, then clears one entry safely", async () => {
    stubDemoFetch();
    render(<ResearchProvider><Probe /></ResearchProvider>);
    await waitFor(() => expect(screen.getByTestId("source-kind")).toHaveTextContent("demo"));
    expect(screen.getByTestId("correction-count")).toHaveTextContent("0");
    await userEvent.click(screen.getByRole("button", { name: "Apply valid correction" }));
    expect(screen.getByTestId("apply-result")).toHaveTextContent("true");
    expect(screen.getByTestId("stored-reason")).toHaveAttribute("data-reason", "  Reviewed against source  ");
    await userEvent.click(screen.getByRole("button", { name: "Apply blank correction" }));
    expect(screen.getByTestId("apply-result")).toHaveTextContent("false");
    await userEvent.click(screen.getByRole("button", { name: "Apply unknown review correction" }));
    expect(screen.getByTestId("apply-result")).toHaveTextContent("false");
    expect(screen.getByTestId("correction-count")).toHaveTextContent("1");
    await userEvent.click(screen.getByRole("button", { name: "Clear missing correction" }));
    expect(screen.getByTestId("correction-count")).toHaveTextContent("1");
    await userEvent.click(screen.getByRole("button", { name: "Clear correction" }));
    expect(screen.getByTestId("correction-count")).toHaveTextContent("0");
  });

  it("clears corrections after successful replacement and preserves them after failure", async () => {
    stubDemoFetch();
    render(<ResearchProvider><Probe /></ResearchProvider>);
    await waitFor(() => expect(screen.getByTestId("source-kind")).toHaveTextContent("demo"));
    await userEvent.click(screen.getByRole("button", { name: "Apply valid correction" }));
    await userEvent.click(screen.getByRole("button", { name: "Import invalid CSV" }));
    expect(screen.getByTestId("source-kind")).toHaveTextContent("demo");
    expect(screen.getByTestId("correction-count")).toHaveTextContent("1");
    await userEvent.click(screen.getByRole("button", { name: "Import valid CSV" }));
    await waitFor(() => expect(screen.getByTestId("source-kind")).toHaveTextContent("user_upload"));
    expect(screen.getByTestId("correction-count")).toHaveTextContent("0");
  });

  it("clears corrections at the start of a later failed Demo reload", async () => {
    stubDemoFetch();
    render(<ResearchProvider><Probe /></ResearchProvider>);
    await waitFor(() => expect(screen.getByTestId("source-kind")).toHaveTextContent("demo"));
    await userEvent.click(screen.getByRole("button", { name: "Apply valid correction" }));
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    await userEvent.click(screen.getByRole("button", { name: "Reload failing demo" }));
    expect(screen.getByTestId("correction-count")).toHaveTextContent("0");
    await waitFor(() => expect(screen.getByTestId("research-status")).toHaveTextContent("error"));
  });

  it("resets Demo scenarios, accepts known IDs with defensive copies, and rejects unknown IDs", async () => {
    stubDemoFetch();
    render(<ResearchProvider><Probe /></ResearchProvider>);
    await waitFor(() => expect(screen.getByTestId("source-kind")).toHaveTextContent("demo"));
    const initial = JSON.parse(screen.getByTestId("economic-scenarios").textContent ?? "[]") as EconomicScenario[];
    expect(initial[1]?.inputs.salePriceCents).toBe(3999);
    await userEvent.click(screen.getByRole("button", { name: "Store external economics" }));
    expect(JSON.parse(screen.getByTestId("economic-scenarios").textContent ?? "[]")[1].inputs.salePriceCents).toBe(8888);
    await userEvent.click(screen.getByRole("button", { name: "Mutate external economics" }));
    expect(screen.getByTestId("apply-result")).toHaveTextContent('"salePriceCents":8888');
    expect(screen.getByTestId("apply-result")).toHaveTextContent("External note");
    await userEvent.click(screen.getByRole("button", { name: "Reject unknown economics" }));
    expect(screen.getByTestId("apply-result")).toHaveTextContent("false");
    await userEvent.click(screen.getByRole("button", { name: "Reload failing demo" }));
    await waitFor(() => expect(screen.getByTestId("economic-scenarios").textContent).toContain("3999"));
  });

  it("preserves economics after failed import and clears them after successful replacement", async () => {
    stubDemoFetch();
    render(<ResearchProvider><Probe /></ResearchProvider>);
    await waitFor(() => expect(screen.getByTestId("source-kind")).toHaveTextContent("demo"));
    await userEvent.click(screen.getByRole("button", { name: "Store external economics" }));
    await userEvent.click(screen.getByRole("button", { name: "Import invalid CSV" }));
    expect(screen.getByTestId("economic-scenarios")).toHaveTextContent("8888");
    await userEvent.click(screen.getByRole("button", { name: "Import valid CSV" }));
    await waitFor(() => expect(screen.getByTestId("source-kind")).toHaveTextContent("user_upload"));
    const scenarios = JSON.parse(screen.getByTestId("economic-scenarios").textContent ?? "[]") as EconomicScenario[];
    expect(scenarios.every((scenario) => Object.values(scenario.inputs).every((value) => value === null))).toBe(true);
  });
});
