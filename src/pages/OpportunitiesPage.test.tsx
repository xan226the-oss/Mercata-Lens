import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "node:fs";
import path from "node:path";
import { MemoryRouter } from "react-router-dom";
import { ResearchProvider, useResearch } from "../research/ResearchContext";
import { OpportunitiesPage } from "./OpportunitiesPage";

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

const distinctProductsCsv = productsCsv.replace("p01,ClearFlow Pet Fountain 2.5L,ClearFlow,29.99,4.2,156,Cat Water Fountain", "p901,Distinct Fountain,Distinct Brand,12.34,4.1,7,Cat Water Fountain");
const distinctReviewsCsv = reviewsCsv.replaceAll("p01", "p901");

function renderWithProvider(children: ReactNode) {
  return render(<ResearchProvider><MemoryRouter>{children}</MemoryRouter></ResearchProvider>);
}

describe("OpportunitiesPage economics workspace", () => {
  it("shows three scenarios, Demo provenance, and estimated contribution without scoring", async () => {
    stubDemoFetch();
    render(<ResearchProvider><MemoryRouter><OpportunitiesPage /></MemoryRouter></ResearchProvider>);
    await waitFor(() => expect(screen.getAllByText("Base scenario").length).toBeGreaterThan(0));

    expect(screen.getAllByRole("group")).toHaveLength(3);
    expect(screen.getAllByText(/Demo assumption:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Total costs|Known costs so far/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/score|recommended price|expected profit/i)).not.toBeInTheDocument();
  });

  it("renders an incomplete user-upload state instead of inventing a contribution", async () => {
    stubDemoFetch();
    function Probe() {
      const { importCsv } = useResearch();
      return <button onClick={() => importCsv(productsCsv, reviewsCsv)}>Upload</button>;
    }
    render(<ResearchProvider><MemoryRouter><Probe /><OpportunitiesPage /></MemoryRouter></ResearchProvider>);
    await waitFor(() => expect(screen.getAllByText("Base scenario").length).toBeGreaterThan(0));
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));
    await waitFor(() => expect(screen.getAllByText(/Missing input/).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Total costs|Known costs so far/).length).toBeGreaterThan(0);
  });

  it("proves real controlled continuous input, conversion, invalid drafts, provenance, and reset lifecycle", async () => {
    stubDemoFetch();
    const user = userEvent.setup();
    function Harness() {
      const research = useResearch();
      return <div data-testid="context-state">{JSON.stringify(research.economicScenarios)}</div>;
    }
    renderWithProvider(<><Harness /><OpportunitiesPage /></>);
    await waitFor(() => expect(screen.getAllByText("Base scenario").length).toBeGreaterThan(0));
    const base = within(screen.getByRole("group", { name: "Base scenario" }));
    const salePrice = base.getByLabelText("Sale price");
    await user.clear(salePrice);
    await user.type(salePrice, "12.34");
    expect(salePrice).toHaveValue("12.34");
    expect(screen.getByTestId("context-state")).toHaveTextContent('"salePriceCents":1234');
    expect(base.getByText(/current-session user-supplied assumption/i)).toBeVisible();
    await user.clear(salePrice);
    await user.type(salePrice, "oops");
    expect(salePrice).toHaveValue("oops");
    expect(screen.getByTestId("context-state")).not.toHaveTextContent("NaN");
    expect(screen.getByTestId("context-state")).toHaveTextContent('"salePriceCents":null');
    await user.clear(salePrice);
    await user.type(salePrice, "-2");
    expect(salePrice).toHaveValue("-2");
    expect(base.getByText("Value cannot be negative.")).toBeVisible();
    await user.clear(salePrice);
    expect(salePrice).toHaveValue("");
    expect(screen.getByTestId("context-state")).toHaveTextContent('"salePriceCents":null');
    const rate = base.getByLabelText("Referral fee rate");
    await user.clear(rate);
    await user.type(rate, "17.5");
    expect(rate).toHaveValue("17.5");
    expect(screen.getByTestId("context-state")).toHaveTextContent('"referralFeeRate":0.175');
    await user.clear(rate);
    await user.type(rate, "120");
    expect(rate).toHaveValue("120");
    expect(base.getByText("Referral fee rate must be between 0% and 100%.")).toBeVisible();
    expect(screen.getByTestId("context-state")).not.toHaveTextContent('"referralFeeRate":1.2');
  });

  it("renders formula, known costs, rounded referral fee, and scenario-linked results", async () => {
    stubDemoFetch();
    renderWithProvider(<OpportunitiesPage />);
    await waitFor(() => expect(screen.getAllByText("Base scenario").length).toBeGreaterThan(0));
    const baseResult = screen.getByTestId("economics-result-base");
    expect(baseResult).toHaveTextContent("Base scenario");
    expect(baseResult).toHaveTextContent(/Sale price - sourcing cost - inbound freight - referral fee/);
    expect(baseResult).toHaveTextContent(/Known costs|Total costs/);
    expect(baseResult).toHaveTextContent(/Rounded referral fee/);
  });

  it("renders no-data fallback without Demo contribution when isolated from a dataset", () => {
    render(<ResearchProvider><MemoryRouter><OpportunitiesPage /></MemoryRouter></ResearchProvider>);
    expect(screen.getByTestId("economics-no-data")).toBeVisible();
    expect(screen.queryByText("Demo assumption:")).not.toBeInTheDocument();
    expect(screen.queryByText(/Estimated per-unit contribution:/)).not.toBeInTheDocument();
  });

  it("preserves draft and provenance after failed import, then resets on distinct success and Demo reload", async () => {
    stubDemoFetch();
    const user = userEvent.setup();
    function Harness() {
      const research = useResearch();
      return <>
        <button onClick={() => research.importCsv("bad", "bad")}>Import invalid CSV</button>
        <button onClick={() => research.importCsv(distinctProductsCsv, distinctReviewsCsv)}>Import distinct CSV</button>
        <button onClick={research.loadDemo}>Reload Demo</button>
      </>;
    }
    renderWithProvider(<><Harness /><OpportunitiesPage /></>);
    await waitFor(() => expect(screen.getAllByText("Base scenario").length).toBeGreaterThan(0));
    const base = within(screen.getByRole("group", { name: "Base scenario" }));
    const salePrice = base.getByLabelText("Sale price");
    await user.clear(salePrice);
    await user.type(salePrice, "12.34");
    await user.click(screen.getByRole("button", { name: "Import invalid CSV" }));
    expect(salePrice).toHaveValue("12.34");
    expect(base.getByText(/current-session user-supplied assumption/i)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Import distinct CSV" }));
    await waitFor(() => expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("User upload"));
    expect(within(screen.getByRole("group", { name: "Base scenario" })).getByLabelText("Sale price")).toHaveValue("");
    expect(screen.getAllByText(/Missing input/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Reload Demo" }));
    await waitFor(() => expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("Synthetic demo"));
    expect(screen.getByRole("group", { name: "Base scenario" }).querySelector("input")!).toHaveValue("39.99");
    expect(screen.getAllByText(/Demo assumption:/).length).toBeGreaterThan(0);
  });
});
