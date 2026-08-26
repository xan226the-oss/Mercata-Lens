import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

function captureRuntimeErrors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const resourceFailures: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      const location = message.location();
      if (new URL(location.url || page.url()).pathname === "/favicon.ico") return;
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    if (new URL(request.url()).pathname !== "/favicon.ico") resourceFailures.push(request.url());
  });
  return { consoleErrors, pageErrors, resourceFailures };
}

test("invalid CSV reports exact diagnostics and preserves active Demo", async ({ page }) => {
  const errors = captureRuntimeErrors(page);
  await page.goto("/");
  await expect(page.getByTestId("source-badge")).toHaveText("Demo data");
  await page.getByRole("button", { name: "Products CSV" }).setInputFiles(path.join(process.cwd(), "e2e/fixtures/invalid-products.csv"));
  await page.getByRole("button", { name: "Reviews CSV" }).setInputFiles(path.join(process.cwd(), "e2e/fixtures/invalid-reviews.csv"));
  await page.getByTestId("import-button").click();
  await expect(page.getByText(/Import failed/i)).toBeVisible();
  await page.getByRole("link", { name: "Data quality", exact: true }).click();
  await expect(page.getByTestId("latest-import-failure")).toContainText("blocking issues");
  const table = page.getByRole("table", { name: "Latest import issues" });
  await expect(table).toContainText("Products");
  await expect(table).toContainText("Reviews");
  await expect(table).toContainText("File");
  await expect(table).toContainText("Row");
  await expect(table).toContainText("Field");
  await expect(table).toContainText("rating must be between 1 and 5");
  await expect(table).toContainText("Review references unknown product_id");
  await expect(page.getByTestId("active-data-quality")).toContainText("Demo data");
  await expect(page.getByRole("link", { name: /Category overview/i })).toBeEnabled();
  expect(errors.consoleErrors).toEqual([]);
  expect(errors.pageErrors).toEqual([]);
  expect(errors.resourceFailures).toEqual([]);
});

test("invalid CSV with no active data locks dependent routes", async ({ page }) => {
  const errors = captureRuntimeErrors(page);
  await page.route("**/demo/*.csv", (route) => route.fulfill({ status: 200, contentType: "text/csv", body: "" }));
  await page.goto("/");
  await expect(page.getByTestId("source-badge")).toHaveText("No active data");
  await page.getByRole("button", { name: "Products CSV" }).setInputFiles(path.join(process.cwd(), "e2e/fixtures/invalid-products.csv"));
  await page.getByRole("button", { name: "Reviews CSV" }).setInputFiles(path.join(process.cwd(), "e2e/fixtures/invalid-reviews.csv"));
  await page.getByTestId("import-button").click();
  await expect(page.getByText(/Import failed/i)).toBeVisible();
  await expect(page.getByTestId("step-locked-/category")).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByTestId("step-locked-/pain-points")).toHaveAttribute("aria-disabled", "true");
  expect(errors.consoleErrors).toEqual([]);
  expect(errors.pageErrors).toEqual([]);
  expect(errors.resourceFailures).toEqual([]);
});
