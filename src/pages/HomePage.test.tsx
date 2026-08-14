import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import fs from "node:fs";
import path from "node:path";
import { ResearchProvider } from "../research/ResearchContext";
import { ResearchLayout } from "../research/ResearchLayout";
import { HomePage } from "./HomePage";
import { QualityPage } from "./QualityPage";
import { CategoryPage } from "./CategoryPage";
import { PainPointsPage } from "./PainPointsPage";
import { OpportunitiesPage } from "./OpportunitiesPage";
import { DecisionPage } from "./DecisionPage";

const demoDir = path.resolve(__dirname, "../../public/demo");
const productsCsv = fs.readFileSync(path.join(demoDir, "products.csv"), "utf8");
const reviewsCsv = fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8");

function stubFetch() {
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

function NavigationProbe({ to }: { to: string }) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to)} data-testid={`navigate-${to.slice(1)}`}>
      Navigate
    </button>
  );
}

function renderResearchApp(initialEntries: string[] = ["/"]) {
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
          <NavigationProbe to="/quality" />
          <NavigationProbe to="/pain-points" />
          <NavigationProbe to="/opportunities" />
        </ResearchLayout>
      </MemoryRouter>
    </ResearchProvider>,
  );
}

function renderHome() {
  return renderResearchApp(["/"]);
}

async function settle() {
  await waitFor(() => {
    expect(document.body.textContent?.includes("Loading demo research data")).toBe(false);
  });
}

function smallProductsCsv() {
  return [
    "product_id,title,price_usd,rating,category,source_url,observed_at",
    "p1,One,20,4,Cat Water Fountain,https://example.com/p1,2026-07-01",
    "p2,Two,21,4,Cat Water Fountain,https://example.com/p2,2026-07-01",
  ].join("\n");
}

function smallReviewsCsv() {
  return [
    "review_id,product_id,rating,review_text,source_url",
    ...Array.from({ length: 5 }, (_, i) => `r${i + 1},p1,4,Works,https://example.com/r${i + 1}`),
  ].join("\n");
}

async function importSmallDataset() {
  await userEvent.upload(
    screen.getByLabelText("Products CSV") as HTMLInputElement,
    new File([smallProductsCsv()], "small-products.csv", { type: "text/csv" }),
  );
  await userEvent.upload(
    screen.getByLabelText("Reviews CSV") as HTMLInputElement,
    new File([smallReviewsCsv()], "small-reviews.csv", { type: "text/csv" }),
  );
  await userEvent.click(screen.getByTestId("import-button"));
  await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("User upload"));
}

describe("HomePage import UI", () => {
  it("shows the latest import section before any import is attempted", async () => {
    stubFetch();
    renderHome();
    await settle();
    await userEvent.click(screen.getByTestId("navigate-quality"));

    const latestAttempt = screen.getByTestId("latest-import-attempt");
    expect(latestAttempt).toHaveTextContent("No import attempted in this session");
    expect(screen.getByTestId("active-data-quality")).toHaveTextContent("Active valid dataset");
  });

  it("shows a successful User upload summary with counts and import time", async () => {
    stubFetch();
    renderHome();
    await settle();
    await userEvent.upload(
      screen.getByLabelText("Products CSV") as HTMLInputElement,
      new File([productsCsv], "uploaded-products.csv", { type: "text/csv" }),
    );
    await userEvent.upload(
      screen.getByLabelText("Reviews CSV") as HTMLInputElement,
      new File([reviewsCsv], "uploaded-reviews.csv", { type: "text/csv" }),
    );
    await userEvent.click(screen.getByTestId("import-button"));
    await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("User upload"));
    await userEvent.click(screen.getByTestId("navigate-quality"));

    const latestAttempt = screen.getByTestId("latest-import-attempt");
    expect(screen.getByTestId("latest-import-success")).toBeInTheDocument();
    expect(within(screen.getByTestId("latest-import-attempt")).getByRole("status")).toHaveTextContent(/Latest import succeeded/i);
    expect(latestAttempt).toHaveTextContent("User upload");
    expect(latestAttempt).toHaveTextContent("Imported at:");
    expect(latestAttempt).toHaveTextContent("12");
    expect(latestAttempt).toHaveTextContent("76");
    expect(latestAttempt).toHaveTextContent(/review evidence records are records, not sales/i);
  });

  it("keeps failed diagnostics when Demo loading failed and no active dataset exists", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    renderHome();
    await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("No active data"));

    const badProducts = [
      "product_id,title,price_usd,rating,category,source_url,observed_at",
      "p1,One,20,4,Cat Water Fountain,https://example.com/p1,2026-07-01",
      "p1,Duplicate,21,4,Cat Water Fountain,https://example.com/p2,2026-07-01",
      "p2,Bad rating,22,bad,Cat Water Fountain,https://example.com/p3,2026-07-01",
    ].join("\n");
    const badReviews = [
      "review_id,product_id,rating,review_text,source_url",
      "r1,missing,4,Unknown,https://example.com/r1",
      "r2,p1,4,Known,https://example.com/r2",
    ].join("\n");
    await userEvent.upload(screen.getByLabelText("Products CSV") as HTMLInputElement, new File([badProducts], "bad-products.csv"));
    await userEvent.upload(screen.getByLabelText("Reviews CSV") as HTMLInputElement, new File([badReviews], "bad-reviews.csv"));
    await userEvent.click(screen.getByTestId("import-button"));
    await userEvent.click(screen.getByTestId("navigate-quality"));

    const latestAttempt = screen.getByTestId("latest-import-attempt");
    expect(latestAttempt).toHaveTextContent(
      "No active research data is available",
    );
    expect(within(latestAttempt).getByRole("alert")).toHaveTextContent(/Import failed/i);
    expect(latestAttempt).toHaveTextContent(
      "The failed import did not create an active research dataset",
    );
    expect(latestAttempt).not.toHaveTextContent(
      "Current No active data was not replaced",
    );
    expect(latestAttempt).toHaveTextContent("3 blocking issues");
    expect(latestAttempt).toHaveTextContent("Latest import issues");
    expect(screen.getAllByTestId("issue-row")).toHaveLength(3);
    expect(screen.getByTestId("active-data-quality")).toHaveTextContent("No active research data");
    expect(screen.getByTestId("active-data-quality")).not.toHaveTextContent("Current No active data was not replaced");
  });

  it("renders the approved overview, evidence, and next-action hierarchy", async () => {
    stubFetch();
    renderHome();
    await settle();

    expect(screen.getByRole("heading", { name: "Cat Water Fountain research" })).toBeInTheDocument();
    expect(screen.getByTestId("metric-products")).toHaveTextContent("12");
    expect(screen.getByTestId("metric-reviews")).toHaveTextContent("76");
    expect(screen.getByTestId("metric-reviews")).toHaveTextContent(/evidence records/i);
    expect(screen.getByTestId("metric-source")).toHaveTextContent("Demo data");
    expect(screen.getByTestId("category-analysis-next-step")).toHaveTextContent(/available in Category overview/i);
    expect(screen.queryByTestId("price-distribution-chart")).not.toBeInTheDocument();
  });

  it("disables the import button until both files are selected", async () => {
    stubFetch();
    renderHome();
    await settle();
    const button = screen.getByTestId("import-button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await userEvent.upload(screen.getByLabelText("Products CSV") as HTMLInputElement, new File(["a"], "p.csv"));
    expect(button.disabled).toBe(true);
    await userEvent.upload(screen.getByLabelText("Reviews CSV") as HTMLInputElement, new File(["b"], "r.csv"));
    expect(button.disabled).toBe(false);
  });

  it("shows the selected file names before import", async () => {
    stubFetch();
    renderHome();
    await settle();
    await userEvent.upload(screen.getByLabelText("Products CSV") as HTMLInputElement, new File(["a"], "my-products.csv"));
    await userEvent.upload(screen.getByLabelText("Reviews CSV") as HTMLInputElement, new File(["b"], "my-reviews.csv"));
    expect(screen.getByTestId("products-file-name")).toHaveTextContent("my-products.csv");
    expect(screen.getByTestId("reviews-file-name")).toHaveTextContent("my-reviews.csv");
  });

  it("rejects non-.csv file names with a visible reason", async () => {
    stubFetch();
    renderHome();
    await settle();
    await userEvent.upload(
      screen.getByLabelText("Products CSV") as HTMLInputElement,
      new File(["a"], "data.xlsx"),
      { applyAccept: false },
    );
    expect(screen.getByTestId("products-file-name")).toHaveTextContent("No file selected");
    expect(screen.getByTestId("import-file-error")).toHaveTextContent(".csv");
  });

  it("does not show User upload when there is no active dataset", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    renderHome();
    await waitFor(() => expect(screen.getByTestId("source-badge")).toHaveTextContent("No active data"));
    expect(screen.getByTestId("source-badge")).not.toHaveTextContent("User upload");
  });

  it("keeps the demo research intact when an invalid import fails", async () => {
    stubFetch();
    renderHome();
    await settle();
    await userEvent.upload(
      screen.getByLabelText("Products CSV") as HTMLInputElement,
      new File([
        [
          "product_id,title,price_usd,rating,category,source_url,observed_at",
          "p1,One,20,4,Cat Water Fountain,https://example.com/p1,2026-07-01",
          "p1,Duplicate,21,4,Cat Water Fountain,https://example.com/p2,2026-07-01",
          "p2,Bad rating,22,bad,Cat Water Fountain,https://example.com/p3,2026-07-01",
        ].join("\n"),
      ], "bad-products.csv", { type: "text/csv" }),
    );
    await userEvent.upload(
      screen.getByLabelText("Reviews CSV") as HTMLInputElement,
      new File([
        [
          "review_id,product_id,rating,review_text,source_url",
          "r1,missing,4,Unknown,https://example.com/r1",
          "r2,p1,4,Known,https://example.com/r2",
        ].join("\n"),
      ], "reviews.csv", { type: "text/csv" }),
    );
    await userEvent.click(screen.getByTestId("import-button"));
    expect(await screen.findByTestId("import-error")).toBeInTheDocument();
    expect(screen.getByTestId("import-error")).toHaveTextContent("3 blocking issues");
    expect(screen.getByTestId("import-error")).toHaveTextContent("Current Demo data was not replaced");
    expect(screen.getByTestId("import-error")).not.toHaveTextContent("products row 4");
    expect(screen.getByRole("link", { name: /Review data quality/i })).toHaveAttribute("href", "/quality");
    expect(screen.getByTestId("source-badge")).toHaveTextContent("Demo data");
    expect(screen.getByText(/current research remains unchanged/i)).toBeInTheDocument();
  });

  it("shows all failed import diagnostics on the real QualityPage", async () => {
    stubFetch();
    renderHome();
    await settle();
    const products = [
      "product_id,title,price_usd,rating,category,source_url,observed_at",
      "p1,One,20,4,Cat Water Fountain,https://example.com/p1,2026-07-01",
      "p1,Two,21,4,Cat Water Fountain,https://example.com/p2,2026-07-01",
      "p3,Three,22,bad,Cat Water Fountain,https://example.com/p3,2026-07-01",
    ].join("\n");
    const reviews = [
      "review_id,product_id,rating,review_text,source_url",
      "r1,missing,4,Unknown,https://example.com/r1",
      "r2,p1,4,Known,https://example.com/r2",
    ].join("\n");
    await userEvent.upload(screen.getByLabelText("Products CSV") as HTMLInputElement, new File([products], "bad-products.csv"));
    await userEvent.upload(screen.getByLabelText("Reviews CSV") as HTMLInputElement, new File([reviews], "bad-reviews.csv"));
    await userEvent.click(screen.getByTestId("import-button"));
    expect(await screen.findByTestId("import-error")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("navigate-quality"));
    const latestAttempt = screen.getByTestId("latest-import-attempt");
    const activeQuality = screen.getByTestId("active-data-quality");
    expect(latestAttempt).toHaveTextContent("Latest import attempt");
    expect(latestAttempt).toHaveTextContent("3 blocking issues");
    expect(latestAttempt).toHaveTextContent("Demo data");
    expect(latestAttempt).toHaveTextContent("not replaced");
    expect(activeQuality).toHaveTextContent("Active valid dataset");
    expect(activeQuality).toHaveTextContent("Demo data");
    expect(activeQuality).toHaveTextContent("12");
    expect(activeQuality).toHaveTextContent("76");
    expect(activeQuality).toHaveTextContent(/No blocking issues in the active dataset/i);
    expect(within(latestAttempt).getAllByTestId("issue-row")).toHaveLength(3);
    expect(within(activeQuality).queryByTestId("issue-row")).not.toBeInTheDocument();
    expect(latestAttempt).toHaveTextContent("Products");
    expect(latestAttempt).toHaveTextContent("4");
    expect(latestAttempt).toHaveTextContent("3");
    expect(latestAttempt).toHaveTextContent("Reviews");
    expect(latestAttempt).toHaveTextContent("2");
    expect(latestAttempt).toHaveTextContent("rating");
    expect(latestAttempt).toHaveTextContent("product_id");
    expect(latestAttempt).toHaveTextContent("bad");
    expect(latestAttempt).toHaveTextContent("p1");
    expect(latestAttempt).toHaveTextContent("missing");
    expect(screen.getByTestId("source-badge")).toHaveTextContent("Demo data");
  });
});

describe("locked navigation", () => {
  it("locks dependent modules after importing 2 products and 5 reviews", async () => {
    stubFetch();
    renderHome();
    await settle();
    await importSmallDataset();
    expect(screen.getByTestId("step-locked-/category")).toBeInTheDocument();
    expect(screen.getByTestId("step-locked-/pain-points")).toBeInTheDocument();
    expect(screen.getByTestId("step-locked-/opportunities")).toBeInTheDocument();
    expect(screen.getByTestId("step-locked-/decision")).toBeInTheDocument();
  });

  it("shows the locked page when navigating to a locked URL through real routes", async () => {
    stubFetch();
    renderHome();
    await settle();
    await importSmallDataset();
    await userEvent.click(screen.getByTestId("navigate-pain-points"));
    expect(screen.getByTestId("locked-page")).toBeInTheDocument();
    expect(screen.getByTestId("locked-page")).toHaveTextContent(/module is locked because/i);
    expect(screen.queryByText("This step links English review evidence to pain-point labels.")).not.toBeInTheDocument();
  });

  it("shows the real QualityPage after importing low-sample data", async () => {
    stubFetch();
    renderHome();
    await settle();
    await importSmallDataset();
    await userEvent.click(screen.getByTestId("navigate-quality"));
    expect(screen.getByRole("heading", { name: "Data quality" })).toBeInTheDocument();
    expect(screen.getByTestId("module-category")).toHaveTextContent("Locked");
    expect(screen.getByTestId("module-pain_points")).toHaveTextContent("Locked");
    expect(screen.getByTestId("module-opportunities")).toHaveTextContent("Locked");
    expect(screen.getByTestId("step-locked-/decision")).toBeInTheDocument();
  });
});
