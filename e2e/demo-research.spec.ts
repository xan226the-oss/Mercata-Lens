import { test, expect } from "@playwright/test";

for (const width of [1440, 900, 390]) {
  test(`demo decision flow at ${width}px`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto("/");
    await expect(page.getByTestId("source-badge")).toHaveText("Demo data");
    await expect(page.locator(".evidence-rule")).toHaveText("Review count is not sales");

    await page.getByRole("link", { name: /Data quality/i }).click();
    await expect(page.getByRole("heading", { name: "Data quality" })).toBeVisible();
    await page.getByRole("link", { name: /Category overview/i }).click();
    await expect(page.getByRole("heading", { name: /Category overview/i })).toBeVisible();
    await page.getByRole("link", { name: /Customer pain points/i }).click();
    await expect(page.getByRole("heading", { name: /Customer pain-point evidence/i })).toBeVisible();

    const correction = page.getByRole("button", { name: /Apply correction/i });
    if (await correction.count()) {
      await expect(correction).toBeVisible();
    }

    await page.getByRole("link", { name: /Opportunity comparison/i }).click();
    await expect(page.getByRole("heading", { name: "Opportunity comparison" })).toBeVisible();
    await page.getByRole("button", { name: "Restore defaults" }).click();
    await page.getByRole("link", { name: /Decision & validation plan/i }).click();
    await expect(page.getByRole("heading", { name: "Decision & validation plan" })).toBeVisible();
    await expect(page.getByTestId("decision-status")).toBeVisible();
    await expect(page.getByRole("button", { name: "Download JSON" })).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download JSON" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("mercata-lens-research.json");
    expect(consoleErrors.filter((text) => !text.includes("favicon") && !text.includes("404 (Not Found)"))).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
