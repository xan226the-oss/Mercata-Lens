import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PAIN_POINT_IDS } from "../domain/painPointRules";
import type { PainPointSummary } from "../domain/painPoints";
import { PainPointSummaryList } from "./PainPointSummaryList";

function summaries(): PainPointSummary[] {
  return PAIN_POINT_IDS.map((id, index) => ({
    id,
    labelEn: id === "hard_to_clean" ? "Cleaning difficulty" : id,
    labelZh: id,
    rulesetVersion: "1.0.0",
    matchedReviewCount: index === 1 || index === 6 ? 0 : index + 1,
    reviewDenominator: index === 6 ? 0 : 10,
    reviewFraction: index === 6 ? null : index === 1 ? 0 : (index + 1) / 10,
    productCount: index === 1 ? 1 : index,
    productIds: [],
    evidence: [],
  }));
}

describe("PainPointSummaryList", () => {
  it("renders seven stable rows with bounded display values and pressed state", () => {
    render(<PainPointSummaryList summaries={summaries()} activeLabel="hard_to_clean" disabled={false} onActivate={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getAllByRole("button", { name: /reviews/i })).toHaveLength(7);
    expect(screen.getByText("0 / 10 reviews")).toBeVisible();
    expect(screen.getByText("0%")).toBeVisible();
    expect(screen.getByText("Unavailable")).toBeVisible();
    expect(screen.getByText("1 products")).toBeVisible();
    expect(screen.getAllByText("Ruleset 1.0.0")).toHaveLength(7);
    expect(screen.getByRole("button", { name: /Cleaning difficulty/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("button", { name: /reviews/i }).map((button) => button.querySelector(".pain-point-summary__count")?.textContent?.split(" ")[0])).toEqual(["1", "0", "3", "4", "5", "6", "0"]);
  });

  it("activates, clears, exposes filter clear, and disables controls", async () => {
    const onActivate = vi.fn();
    const onClear = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<PainPointSummaryList summaries={summaries()} activeLabel={null} disabled={false} onActivate={onActivate} onClear={onClear} />);
    await user.click(screen.getByRole("button", { name: /noise/i }));
    expect(onActivate).toHaveBeenCalledWith("noise");
    rerender(<PainPointSummaryList summaries={summaries()} activeLabel="noise" disabled={false} onActivate={onActivate} onClear={onClear} />);
    expect(screen.getByRole("button", { name: "Clear signal filter" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /noise/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
    rerender(<PainPointSummaryList summaries={summaries()} activeLabel="noise" disabled={true} onActivate={onActivate} onClear={onClear} />);
    expect(screen.getByRole("button", { name: /noise/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear signal filter" })).toBeDisabled();
  });
});
