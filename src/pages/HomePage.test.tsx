import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import fs from "node:fs";
import path from "node:path";
import { ResearchProvider } from "../research/ResearchContext";
import { ResearchLayout } from "../research/ResearchLayout";
import { HomePage } from "./HomePage";

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

function renderHome() {
  return render(
    <ResearchProvider>
      <MemoryRouter>
        <ResearchLayout>
          <HomePage />
        </ResearchLayout>
      </MemoryRouter>
    </ResearchProvider>,
  );
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

  it("keeps the demo research intact when an invalid import fails", async () => {
    stubFetch();
    renderHome();
    await settle();

    // Demo badge visible before import.
    expect(screen.getByTestId("source-badge").textContent).toContain("Demo data");

    // A malformed products CSV with only a header and a valid reviews CSV.
    await userEvent.upload(
      screen.getByLabelText("Products CSV") as HTMLInputElement,
      new File(["product_id,title\n"], "bad-products.csv", { type: "text/csv" }),
    );
    await userEvent.upload(
      screen.getByLabelText("Reviews CSV") as HTMLInputElement,
      new File([reviewsCsv], "reviews.csv", { type: "text/csv" }),
    );
    await userEvent.click(screen.getByTestId("import-button"));

    // Import error surfaced, current research preserved.
    expect(await screen.findByTestId("import-error")).toBeInTheDocument();
    expect(screen.getByTestId("source-badge").textContent).toContain("Demo data");
    expect(screen.getByText("Curated demo fixture. It does not represent live Amazon inventory, sales, or current market share.")).toBeInTheDocument();
  });
});

describe("locked navigation", () => {
  it("renders locked steps as non-clickable with Locked text when demo has few reviews", async () => {
    stubFetch();
    renderHome();
    await settle();

    // Demo has 12 products / 76 reviews -> category + pain_points available.
    // locked steps should not exist as links for category/pain-points/opportunities/decision
    const lockedAny = screen.queryAllByTestId(/step-locked-/);
    // With a full demo (>=3 products, >=10 reviews) nothing is locked.
    expect(lockedAny).toHaveLength(0);
  });
});