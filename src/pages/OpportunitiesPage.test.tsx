import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "node:fs";
import path from "node:path";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { ResearchProvider, useResearch } from "../research/ResearchContext";
import { OpportunitiesPage } from "./OpportunitiesPage";

const demoDir = path.resolve(__dirname, "../../public/demo");
const productsCsv = fs.readFileSync(path.join(demoDir, "products.csv"), "utf8");
const reviewsCsv = fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8");
const distinctProductsCsv = productsCsv.replace("p01,ClearFlow Pet Fountain 2.5L,ClearFlow,29.99,4.2,156,Cat Water Fountain", "p901,Distinct Fountain,Distinct Brand,12.34,4.1,7,Cat Water Fountain");
const distinctReviewsCsv = reviewsCsv.replaceAll("p01", "p901");

function stubDemoFetch() {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/demo/products.csv")) return Promise.resolve(new Response(productsCsv, { status: 200 }));
    if (url.endsWith("/demo/reviews.csv")) return Promise.resolve(new Response(reviewsCsv, { status: 200 }));
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as unknown as typeof fetch);
}

function renderWithProvider(children: ReactNode) {
  return render(<ResearchProvider><MemoryRouter>{children}</MemoryRouter></ResearchProvider>);
}

describe("OpportunitiesPage economics workspace", () => {
  it("shows three scenarios, Demo provenance, and estimated contribution without scoring", async () => {
    stubDemoFetch();
    renderWithProvider(<OpportunitiesPage />);
    await waitFor(() => expect(screen.getAllByText("Base scenario").length).toBeGreaterThan(0));
    expect(screen.getAllByRole("group")).toHaveLength(3);
    expect(screen.getAllByText(/Demo assumption:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Total costs/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/score|recommended price|expected profit/i)).not.toBeInTheDocument();
  });

  it("renders an incomplete user-upload state instead of inventing a contribution", async () => {
    stubDemoFetch();
    function Probe() {
      const { importCsv } = useResearch();
      return <button onClick={() => importCsv(productsCsv, reviewsCsv)}>Upload</button>;
    }
    renderWithProvider(<><Probe /><OpportunitiesPage /></>);
    await waitFor(() => expect(screen.getAllByText("Base scenario").length).toBeGreaterThan(0));
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));
    await waitFor(() => expect(screen.getAllByText(/Missing input/).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Known costs so far/).length).toBeGreaterThan(0);
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
    expect(base.getByText(/domain validation will mark/i)).toBeVisible();
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
    expect(base.getByText(/domain validation will mark/i)).toBeVisible();
    expect(screen.getByTestId("context-state")).toHaveTextContent('"referralFeeRate":1.2');
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
    renderWithProvider(<OpportunitiesPage />);
    expect(screen.getByTestId("economics-no-data")).toBeVisible();
    expect(screen.queryByText("Demo assumption:")).not.toBeInTheDocument();
    expect(screen.queryByText(/Estimated per-unit contribution:/)).not.toBeInTheDocument();
  });

  it("distinguishes malformed old-value preservation from empty clearing and domain-invalid results", async () => {
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
    fireEvent.change(salePrice, { target: { value: "oops" } });
    expect(salePrice).toHaveValue("oops");
    const baseState = JSON.parse(screen.getByTestId("context-state").textContent ?? "[]").find((scenario: { id: string }) => scenario.id === "base");
    expect(baseState.inputs.salePriceCents).toBe(3999);
    expect(screen.getByTestId("economics-result-base")).toHaveTextContent("Calculation unavailable until the invalid draft is corrected.");
    expect(screen.getByTestId("economics-result-base")).not.toHaveTextContent("Estimated per-unit contribution:");
    expect(screen.getByTestId("economics-result-pessimistic")).toHaveTextContent("Estimated per-unit contribution:");
    expect(screen.getByTestId("economics-result-optimistic")).toHaveTextContent("Estimated per-unit contribution:");
    await user.clear(salePrice);
    expect(screen.getByTestId("context-state")).toHaveTextContent('"salePriceCents":null');
    expect(screen.getByTestId("economics-result-base")).toHaveTextContent("Missing fields: Sale price");
    await user.clear(salePrice);
    await user.type(salePrice, "12.34");
    expect(screen.getByTestId("economics-result-base")).toHaveTextContent("Estimated per-unit contribution:");
    await user.clear(salePrice);
    await user.type(salePrice, "-2");
    expect(screen.getByTestId("context-state")).toHaveTextContent('"salePriceCents":-200');
    expect(screen.getByTestId("economics-result-base")).toHaveTextContent("Invalid input");
    const rate = base.getByLabelText("Referral fee rate");
    await user.clear(rate);
    await user.type(rate, "120");
    expect(screen.getByTestId("context-state")).toHaveTextContent('"referralFeeRate":1.2');
    expect(screen.getByTestId("economics-result-base")).toHaveTextContent("Invalid input");
    const huge = base.getByLabelText("Other cost");
    fireEvent.change(huge, { target: { value: "1e309" } });
    expect(huge).toHaveValue("1e309");
    const baseEconomicState = JSON.parse(screen.getByTestId("context-state").textContent ?? "[]").find((scenario: { id: string }) => scenario.id === "base");
    expect(baseEconomicState.inputs.otherCostCents).toBe(49);
    expect(screen.getByTestId("economics-result-base")).toHaveTextContent("Calculation unavailable until the invalid draft is corrected.");
    expect(base.getByText(/finite dollar amount|safe cents/i)).toBeVisible();
  });

  it("clears invalid draft blocking on successful replacement and Demo reload while failed import preserves it", async () => {
    stubDemoFetch();
    const user = userEvent.setup();
    let loadDemo: (() => void) | undefined;
    function Harness() {
      const research = useResearch();
      loadDemo = research.loadDemo;
      return <>
        <button onClick={() => research.importCsv("bad", "bad")}>Import invalid CSV</button>
        <button onClick={() => research.importCsv(distinctProductsCsv, distinctReviewsCsv)}>Import distinct CSV</button>
        <button onClick={() => void loadDemo?.()}>Reload Demo directly</button>
      </>;
    }
    renderWithProvider(<><Harness /><OpportunitiesPage /></>);
    await waitFor(() => expect(screen.getAllByText("Base scenario").length).toBeGreaterThan(0));
    const base = within(screen.getByRole("group", { name: "Base scenario" }));
    const salePrice = base.getByLabelText("Sale price");
    fireEvent.change(salePrice, { target: { value: "oops" } });
    expect(screen.getByTestId("economics-result-base")).toHaveTextContent("Calculation unavailable until the invalid draft is corrected.");
    await user.click(screen.getByRole("button", { name: "Import invalid CSV" }));
    expect(salePrice).toHaveValue("oops");
    expect(screen.getByTestId("economics-result-base")).toHaveTextContent("Calculation unavailable until the invalid draft is corrected.");
    await user.click(screen.getByRole("button", { name: "Import distinct CSV" }));
    await waitFor(() => expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("User upload"));
    expect(screen.queryByText("Calculation unavailable until the invalid draft is corrected.")).not.toBeInTheDocument();
    expect(screen.getByTestId("economics-result-base")).toHaveTextContent("Missing fields:");
    expect(within(screen.getByRole("group", { name: "Base scenario" })).getByLabelText("Sale price")).toHaveValue("");
    const newBase = within(screen.getByRole("group", { name: "Base scenario" }));
    fireEvent.change(newBase.getByLabelText("Sale price"), { target: { value: "oops" } });
    expect(screen.getByTestId("economics-result-base")).toHaveTextContent("Calculation unavailable until the invalid draft is corrected.");
    await user.click(screen.getByRole("button", { name: "Reload Demo directly" }));
    await waitFor(() => expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("Synthetic demo"));
    expect(screen.queryByText("Calculation unavailable until the invalid draft is corrected.")).not.toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Base scenario" })).getByLabelText("Sale price")).toHaveValue("39.99");
    expect(screen.getByTestId("economics-result-base")).toHaveTextContent("Estimated per-unit contribution:");
  });
});
