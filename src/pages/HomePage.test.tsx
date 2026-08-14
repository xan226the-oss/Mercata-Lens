import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import fs from "node:fs";
import path from "node:path";
import { ResearchProvider } from "../research/ResearchContext";
import { ResearchLayout } from "../research/ResearchLayout";
import { HomePage } from "./HomePage";
import { QualityPage } from "./QualityPage";

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

function renderHome(initialEntries: string[] = ["/"]) {
  return render(
    <ResearchProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <ResearchLayout>
          <HomePage />
          <LocationProbe />
        </ResearchLayout>
      </MemoryRouter>
    </ResearchProvider>,
  );
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

async function settle() {
  await waitFor(() => {
    expect(
      document.body.textContent?.includes("Loading demo research data"),
    ).toBe(false);
  });
}

describe("HomePage import UI", () => {
  it("disables the import button until both files are selected", async () => {
    stubFetch();
    renderHome();
    await settle();

    const button = screen.getByTestId("import-button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    const productsInput = screen.getByLabelText("Products CSV") as HTMLInputElement;
    await userEvent.upload(productsInput, new File(["a"], "p.csv"));
    expect(button.disabled).toBe(true);

    const reviewsInput = screen.getByLabelText("Reviews CSV") as HTMLInputElement;
    await userEvent.upload(reviewsInput, new File(["b"], "r.csv"));
    expect(button.disabled).toBe(false);
  });

  it("shows the selected file names before import", async () => {
    stubFetch();
    renderHome();
    await settle();

    await userEvent.upload(
      screen.getByLabelText("Products CSV") as HTMLInputElement,
      new File(["a"], "my-products.csv"),
    );
    await userEvent.upload(
      screen.getByLabelText("Reviews CSV") as HTMLInputElement,
      new File(["b"], "my-reviews.csv"),
    );

    expect(screen.getByTestId("products-file-name").textContent).toContain("my-products.csv");
    expect(screen.getByTestId("reviews-file-name").textContent).toContain("my-reviews.csv");
  });

  it("rejects non-.csv file names with a visible reason", async () => {
    stubFetch();
    renderHome();
    await settle();

    // applyAccept:false lets us bypass the browser accept filter so we can
    // exercise our own UI-level .csv guard.
    await userEvent.upload(
      screen.getByLabelText("Products CSV") as HTMLInputElement,
      new File(["a"], "data.xlsx"),
      { applyAccept: false },
    );
    expect(screen.getByTestId("products-file-name").textContent).toContain("No file selected");
    expect(screen.getByTestId("import-file-error").textContent).toContain(".csv");
  });

  it("shows all failed import diagnostics with values and distinguishes them from active demo data", async () => {
    stubFetch();
    renderHome();
    await settle();
    const products = "product_id,title,price_usd,rating,category,source_url,observed_at\n" +
      "p1,One,20,bad,Cat Water Fountain,https://example.com/p1,2026-07-01\n" +
      "p1,Two,21,4,Cat Water Fountain,https://example.com/p2,2026-07-01\n";
    const reviews = "review_id,product_id,rating,review_text,source_url\n" +
      "r1,missing,4,Unknown,https://example.com/r1\n";
    await userEvent.upload(screen.getByLabelText("Products CSV") as HTMLInputElement, new File([products], "bad-products.csv"));
    await userEvent.upload(screen.getByLabelText("Reviews CSV") as HTMLInputElement, new File([reviews], "bad-reviews.csv"));
    await userEvent.click(screen.getByTestId("import-button"));
    expect(await screen.findByTestId("import-error")).toHaveTextContent("bad");
    expect(screen.getByTestId("import-error")).toHaveTextContent("value");
    expect(screen.getByTestId("source-badge")).toHaveTextContent("Demo data");
    expect(screen.getByText(/current research remains unchanged/i)).toBeInTheDocument();
  });

  it("does not show User upload when there is no active dataset", () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    renderHome();
    expect(screen.getByTestId("source-badge")).toHaveTextContent("No active data");
    expect(screen.getByTestId("source-badge")).not.toHaveTextContent("User upload");
  });
  it("keeps the demo research intact when an invalid import fails", async () => {
    stubFetch();
    renderHome();
    await settle();

    expect(screen.getByTestId("source-badge").textContent).toContain("Demo data");
    await userEvent.upload(
      screen.getByLabelText("Products CSV") as HTMLInputElement,
      new File(["product_id,title\n"], "bad-products.csv", { type: "text/csv" }),
    );
    await userEvent.upload(
      screen.getByLabelText("Reviews CSV") as HTMLInputElement,
      new File([reviewsCsv], "reviews.csv", { type: "text/csv" }),
    );
    await userEvent.click(screen.getByTestId("import-button"));

    expect(await screen.findByTestId("import-error")).toBeInTheDocument();
    expect(screen.getByTestId("source-badge").textContent).toContain("Demo data");
    expect(screen.getByText("Curated demo fixture. It does not represent live Amazon inventory, sales, or current market share.")).toBeInTheDocument();
  });
});

describe("locked navigation", () => {
  it("renders the real locked state for a 2-product, 5-review dataset", async () => {
    stubFetch();
    const { container } = renderHome();
    await settle();
    const products = "product_id,title,price_usd,rating,category,source_url,observed_at\n" +
      "p1,One,20,4,Cat Water Fountain,https://example.com/p1,2026-07-01\n" +
      "p2,Two,21,4,Cat Water Fountain,https://example.com/p2,2026-07-01\n";
    const reviews = "review_id,product_id,rating,review_text,source_url\n" +
      Array.from({ length: 5 }, (_, i) => `r${i + 1},p1,4,Works,https://example.com/r${i + 1}`).join("\n");
    await userEvent.upload(screen.getByLabelText("Products CSV") as HTMLInputElement, new File([products], "small-products.csv"));
    await userEvent.upload(screen.getByLabelText("Reviews CSV") as HTMLInputElement, new File([reviews], "small-reviews.csv"));
    await userEvent.click(screen.getByTestId("import-button"));
    expect(screen.getByTestId("step-locked-/category")).toBeInTheDocument();
    expect(screen.getByTestId("step-locked-/pain-points")).toBeInTheDocument();
    expect(screen.getByTestId("step-locked-/opportunities")).toBeInTheDocument();
    expect(screen.getByTestId("step-locked-/decision")).toBeInTheDocument();
    expect(container.textContent).toContain("This module is locked because");
  });
  it("shows the locked page when directly opening a locked URL", async () => {
    stubFetch();
    renderHome(["/pain-points"]);
    await settle();
    const products = "product_id,title,price_usd,rating,category,source_url,observed_at\n" +
      "p1,One,20,4,Cat Water Fountain,https://example.com/p1,2026-07-01\n" +
      "p2,Two,21,4,Cat Water Fountain,https://example.com/p2,2026-07-01\n";
    const reviews = "review_id,product_id,rating,review_text,source_url\n" +
      Array.from({ length: 5 }, (_, i) => `r${i + 1},p1,4,Works,https://example.com/r${i + 1}`).join("\n");
    const pInput = screen.getByLabelText("Products CSV") as HTMLInputElement;
    const rInput = screen.getByLabelText("Reviews CSV") as HTMLInputElement;
    await userEvent.upload(pInput, new File([products], "small-products.csv"));
    await userEvent.upload(rInput, new File([reviews], "small-reviews.csv"));
    await userEvent.click(screen.getByTestId("import-button"));
    expect(screen.getByTestId("locked-page")).toBeInTheDocument();
    expect(screen.getByTestId("locked-page")).toHaveTextContent(/module is locked because/i);
  });
  it("renders the full demo with no locked modules", async () => {
    stubFetch();
    renderHome();
    await settle();
    expect(screen.queryAllByTestId(/step-locked-/)).toHaveLength(0);
  });

  it("shows the quality page while low-sample modules remain locked", async () => {
    stubFetch();
    render(
      <ResearchProvider>
        <MemoryRouter initialEntries={["/quality"]}>
          <ResearchLayout>
            <QualityPage />
          </ResearchLayout>
        </MemoryRouter>
      </ResearchProvider>,
    );
    await settle();
    expect(screen.getByRole("heading", { name: "Data quality" })).toBeInTheDocument();
  });

  it("keeps the /quality entry usable", async () => {
    stubFetch();
    renderHome();
    await settle();
    expect(screen.getByRole("link", { name: /Data quality/i })).toHaveAttribute("href", "/quality");
  });
});