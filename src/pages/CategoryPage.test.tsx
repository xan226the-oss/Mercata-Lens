import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "node:fs";
import path from "node:path";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ResearchProvider } from "../research/ResearchContext";
import { ResearchLayout } from "../research/ResearchLayout";
import { CategoryPage } from "./CategoryPage";
import { HomePage } from "./HomePage";

const demoDir = path.resolve(__dirname, "../../public/demo");
const productsCsv = fs.readFileSync(path.join(demoDir, "products.csv"), "utf8");
const reviewsCsv = fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8");

function stubFetch() {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/demo/products.csv")) return Promise.resolve(new Response(productsCsv, { status: 200 }));
    if (url.endsWith("/demo/reviews.csv")) return Promise.resolve(new Response(reviewsCsv, { status: 200 }));
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as unknown as typeof fetch);
}

afterEach(() => vi.unstubAllGlobals());

function renderResearchApp(initialEntries: string[] = ["/"]) {
  return render(
    <ResearchProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <ResearchLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category" element={<CategoryPage />} />
          </Routes>
        </ResearchLayout>
      </MemoryRouter>
    </ResearchProvider>,
  );
}

function userUploadProductsCsv() {
  return [
    "product_id,title,price_usd,rating,category,source_url,observed_at,brand",
    "u1,Upload One,9,4.1,Cat Water Fountain,https://example.com/u1,2026-08-01,UploadCo",
    "u2,Upload Two,19,4.4,Cat Water Fountain,https://example.com/u2,2026-08-02,UploadCo",
    "u3,Upload Three,29,4.8,Cat Water Fountain,https://example.com/u3,2026-08-03,UploadCo",
  ].join("\n");
}

function userUploadReviewsCsv() {
  return [
    "review_id,product_id,rating,review_text,source_url",
    "ur1,u1,4,Works,https://example.com/ur1",
    "ur2,u2,4,Works,https://example.com/ur2",
    "ur3,u3,5,Works,https://example.com/ur3",
  ].join("\n");
}

async function importUserUpload() {
  await userEvent.upload(screen.getByLabelText("Products CSV") as HTMLInputElement, new File([userUploadProductsCsv()], "upload-products.csv", { type: "text/csv" }));
  await userEvent.upload(screen.getByLabelText("Reviews CSV") as HTMLInputElement, new File([userUploadReviewsCsv()], "upload-reviews.csv", { type: "text/csv" }));
  await userEvent.click(screen.getByTestId("import-button"));
  await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("User upload"));
}

describe("CategoryPage", () => {
  it("renders traceable overview sections from the active demo analysis", async () => {
    stubFetch();
    renderResearchApp(["/category"]);
    await waitFor(() => expect(screen.getByTestId("metric-card-products")).toHaveTextContent("12"));

    expect(screen.getByRole("heading", { name: "Category overview" })).toBeVisible();
    expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("Synthetic demo");
    expect(screen.getByTestId("metric-card-median-price")).toHaveTextContent("$");
    expect(screen.getByTestId("metric-card-price-range")).toHaveTextContent("$");
    expect(screen.getByTestId("metric-card-brands")).toBeVisible();
    expect(screen.getByTestId("distribution-price")).toBeVisible();
    expect(screen.getByTestId("distribution-rating")).toBeVisible();
    expect(screen.getByTestId("distribution-reviews")).toBeVisible();
    expect(screen.getByTestId("category-brand-share")).toHaveTextContent(/current sample/i);
    expect(screen.getByTestId("category-attribute-coverage")).toBeVisible();
    expect(screen.getByTestId("category-evidence")).toBeInTheDocument();
    expect(screen.getByTestId("category-limitations")).toHaveTextContent(/not sales/i);
    expect(screen.getByTestId("category-status")).toHaveTextContent("Continue research");
    expect(document.body.textContent).not.toMatch(/market share/i);
    expect(document.body.textContent).not.toMatch(/(?:low competition|high demand|best price|recommended price|sales prediction|purchase advice|bestseller)/i);
  });

  it("shows truthful User upload provenance after importing through Home", async () => {
    stubFetch();
    renderResearchApp(["/"]);
    await waitFor(() => expect(screen.getByTestId("metric-products")).toHaveTextContent("12"));
    await importUserUpload();
    await userEvent.click(screen.getByRole("link", { name: /Open Category overview/i }));
    await waitFor(() => expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("User upload"));

    expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("User upload");
    expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent(/sourcing limitations/i);
    expect(screen.getByTestId("metric-card-products")).toHaveTextContent("3");
    expect(screen.getByTestId("metric-card-price-range")).toHaveTextContent("$9.00");
    expect(screen.getByTestId("metric-card-price-range")).toHaveTextContent("$29.00");
    expect(document.body.textContent).not.toMatch(/live market|verified market|amazon/i);
  });
});
