import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";

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
    if (new URL(request.url()).pathname !== "/favicon.ico") {
      resourceFailures.push(`${request.url()}: ${request.failure()?.errorText ?? "unknown"}`);
    }
  });
  return { consoleErrors, pageErrors, resourceFailures };
}

async function assertRuntimeClean(page: Page, errors: ReturnType<typeof captureRuntimeErrors>) {
  expect(errors.consoleErrors, "application console errors").toEqual([]);
  expect(errors.pageErrors, "page errors").toEqual([]);
  expect(errors.resourceFailures, "resource failures excluding exact favicon request").toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function runDemoFlow(page: Page, width: number) {
  const errors = captureRuntimeErrors(page);
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.emulateMedia({ media: "screen" });
  await page.goto("/");
  await expect(page.getByTestId("source-badge")).toHaveText("Demo data");
  await expect(page.locator(".evidence-rule")).toHaveText("Review count is not sales");

  await page.getByRole("link", { name: "Data quality", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Data quality" })).toBeVisible();
  await page.getByRole("link", { name: /Category overview/i }).click();
  await expect(page.getByRole("heading", { name: /Category overview/i })).toBeVisible();
  await page.getByRole("link", { name: /Customer pain points/i }).click();
  await expect(page.getByRole("heading", { name: /Customer pain-point evidence/i })).toBeVisible();

  await page.getByRole("button", { name: "All" }).click();
  const noise = page.getByRole("checkbox", { name: "noise" }).first();
  if (await noise.isChecked()) await noise.uncheck();
  else await noise.check();
  await page.getByLabel("Correction reason").fill("Confirmed against the supplied review text.");
  const applyCorrection = page.getByRole("button", { name: /Apply correction/i });
  await expect(applyCorrection).toBeEnabled();
  await applyCorrection.click();
  await expect(page.getByTestId("workbench-status")).toContainText("Correction applied");
  await page.getByRole("button", { name: "Corrected" }).click();
  await expect(page.getByText("Corrected").first()).toBeVisible();

  await page.getByRole("link", { name: /Opportunity comparison/i }).click();
  await expect(page.getByRole("heading", { name: "Opportunity comparison" })).toBeVisible();
  await page.getByLabel("Sale price").nth(1).fill("49.99");
  await expect(page.getByTestId("economics-result-base")).toContainText("Estimated per-unit contribution");
  await page.getByLabel("Demand weight").fill("35");
  await page.getByLabel("Supply gap weight").fill("20");
  await page.getByLabel("Economics weight").fill("20");
  await page.getByLabel("Differentiation weight").fill("15");
  await page.getByLabel("Risk weight").fill("10");
  await expect(page.getByTestId("opportunity-ranking-status")).not.toHaveText("incomplete");
  await page.getByRole("button", { name: "Restore defaults" }).click();
  await expect(page.getByLabel("Demand weight")).toHaveValue("30");
  await expect(page.getByTestId("opportunity-ranking-status")).not.toHaveText("incomplete");
  await page.getByRole("button", { name: /review:/i }).first().click();
  await expect(page.getByTestId("selected-evidence")).toContainText("Review text:");
  await page.getByRole("button", { name: /economics:/i }).first().click();
  await expect(page.getByTestId("selected-evidence")).toContainText("Scenario ID:");
  await page.getByRole("button", { name: /assumption:/i }).first().click();
  await expect(page.getByTestId("selected-evidence")).toContainText("evidence kind");
  const opposition = page.getByRole("button", { name: /review:/i }).last();
  await opposition.click();
  await expect(page.getByTestId("selected-evidence")).toBeVisible();

  await page.getByRole("link", { name: /Decision & validation plan/i }).click();
  await expect(page.getByRole("heading", { name: "Decision & validation plan" })).toBeVisible();
  await page.getByLabel("Continue conditions").fill("Continue while evidence remains traceable.\n   ");
  await page.getByLabel("Pause conditions").fill("Pause for human review.");
  await page.getByLabel("Stop conditions").fill("Stop if the evidence gate fails.\nStop if a user confirms the risk.");
  await expect(page.getByTestId("decision-conditions-summary")).toContainText("Continue while evidence remains traceable.");
  await expect(page.getByTestId("decision-status").getByRole("heading", { name: "Pause" })).not.toBeVisible();
  await page.getByLabel("Stop if the evidence gate fails.").check();
  await expect(page.getByTestId("decision-status").getByRole("heading", { name: "Pause" })).toBeVisible();
  await page.getByLabel("Stop if the evidence gate fails.").uncheck();
  await expect(page.getByTestId("decision-status").getByRole("heading", { name: "Continue research" })).toBeVisible();

  await page.getByRole("button", { name: "Download JSON" }).focus();
  await expect(page.getByRole("button", { name: "Download JSON" })).toBeFocused();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("mercata-lens-research.json");
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const payload = JSON.parse(await fs.readFile(downloadPath!, "utf8")) as Record<string, unknown>;
  expect(payload).toMatchObject({ schemaVersion: 1, rulesetVersion: "1.0.0" });
  expect(payload).toHaveProperty("datasetProvenance.sourceKind", "demo");
  expect(payload).toHaveProperty("datasetProvenance.market", "US");
  expect(payload).toHaveProperty("datasetProvenance.currency", "USD");
  expect(payload).toHaveProperty("corrections");
  expect(payload).toHaveProperty("economicsScenarios");
  expect(payload).toHaveProperty("weights");
  expect(payload).toHaveProperty("conditions");
  expect(payload).toHaveProperty("report");
  expect(payload).toHaveProperty("limitations");
  const serialized = JSON.stringify(payload);
  expect(serialized).not.toMatch(/__react|key=|browserState|importState/);
  await page.emulateMedia({ media: "print" });
  await expect(page.getByTestId("decision-status")).toBeVisible();
  await expect(page.getByTestId("decision-limitations")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download JSON" })).toBeHidden();
  await assertRuntimeClean(page, errors);
}

test("complete Demo decision flow at all required viewports", async ({ page }) => {
  for (const width of [1440, 900, 390]) await runDemoFlow(page, width);
});
