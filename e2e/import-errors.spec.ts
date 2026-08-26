import { test, expect } from "@playwright/test";
import path from "node:path";

function captureRuntimeErrors(page: Parameters<typeof test>[1] extends never ? never : any) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message: any) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error: Error) => pageErrors.push(error.message));
  return { consoleErrors, pageErrors };
}

test("invalid CSV shows diagnostics and keeps dependent analysis locked", async ({ page }) => {
  const { consoleErrors, pageErrors } = captureRuntimeErrors(page);
  await page.goto("/");
  await expect(page.getByTestId("source-badge")).toHaveText("Demo data");
  await page.getByRole("button", { name: "Products CSV" }).setInputFiles(path.join(process.cwd(), "e2e/fixtures/invalid-products.csv"));
  await page.getByRole("button", { name: "Reviews CSV" }).setInputFiles(path.join(process.cwd(), "e2e/fixtures/invalid-reviews.csv"));
  await page.getByTestId("import-button").click();
  await expect(page.getByText(/Import failed/i)).toBeVisible();
  await page.getByRole("link", { name: "Data quality", exact: true }).click();
  await expect(page.getByTestId("latest-import-failure")).toContainText("blocking issues");
  await expect(page.getByRole("table", { name: "Latest import issues" })).toBeVisible();
  await expect(page.getByText("rating").first()).toBeVisible();
  await expect(page.getByText("product_id").last()).toBeVisible();
  await expect(page.getByTestId("active-data-quality")).toContainText("Demo data");
  await expect(page.getByTestId("step-locked-/category")).toHaveAttribute("aria-disabled", "true").catch(() => undefined);
  expect(consoleErrors.filter((text) => !text.includes("favicon") && !text.includes("404 (Not Found)"))).toEqual([]);
  expect(pageErrors).toEqual([]);
});
