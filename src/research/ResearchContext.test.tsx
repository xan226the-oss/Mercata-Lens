import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "node:fs";
import path from "node:path";
import { ResearchProvider, useResearch } from "./ResearchContext";

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
});
