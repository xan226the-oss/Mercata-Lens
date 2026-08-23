import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

afterEach(() => vi.unstubAllGlobals());

describe("OpportunitiesPage economics workspace", () => {
  it("shows three scenarios, Demo provenance, and estimated contribution without scoring", async () => {
    stubDemoFetch();
    render(<ResearchProvider><MemoryRouter><OpportunitiesPage /></MemoryRouter></ResearchProvider>);
    await waitFor(() => expect(screen.getByText("Base scenario")).toBeVisible());

    expect(screen.getAllByRole("group")).toHaveLength(3);
    expect(screen.getAllByText(/Demo assumption:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Estimated per-unit contribution/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/score|recommended price|expected profit/i)).not.toBeInTheDocument();
  });

  it("renders an incomplete user-upload state instead of inventing a contribution", async () => {
    stubDemoFetch();
    function Probe() {
      const { importCsv } = useResearch();
      return <button onClick={() => importCsv(productsCsv, reviewsCsv)}>Upload</button>;
    }
    render(<ResearchProvider><MemoryRouter><Probe /><OpportunitiesPage /></MemoryRouter></ResearchProvider>);
    await waitFor(() => expect(screen.getByText("Base scenario")).toBeVisible());
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));
    await waitFor(() => expect(screen.getAllByText(/Missing input/).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Estimated per-unit contribution/).length).toBeGreaterThan(0);
  });
});
