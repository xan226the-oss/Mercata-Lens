import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { classifyReview, type ReviewClassification } from "../domain/painPoints";
import { PAIN_POINT_IDS } from "../domain/painPointRules";
import type { ReviewRecord } from "../domain/types";
import { ReviewCorrectionPanel, type ReviewQueueRow } from "./ReviewCorrectionPanel";

function review(text: string, overrides: Partial<ReviewRecord> = {}): ReviewRecord {
  return { reviewId: "r1", productId: "p1", rating: 2, reviewText: text, reviewDate: null, verifiedPurchase: null, sourceUrl: "https://example.com/review/r1", ...overrides };
}
function rowFor(source: ReviewRecord, correction?: ReviewClassification["correction"]): ReviewQueueRow {
  const classification = classifyReview(source, correction ? { [source.reviewId]: correction } : undefined);
  return { review: source, productTitle: null, classification, corrected: classification.correctionValidity === "applied" };
}

describe("ReviewCorrectionPanel", () => {
  it("shows raw provenance, automatic evidence, separate groups, and desired-label controls", () => {
    const source = review("Hard to clean and noisy.");
    const row = rowFor(source);
    render(<ReviewCorrectionPanel row={row} hasPrevious={false} hasNext={true} onPrevious={vi.fn()} onNext={vi.fn()} onApply={vi.fn(() => true)} onClear={vi.fn()} onDirtyChange={vi.fn()} />);
    expect(screen.getByText(source.reviewText)).toBeVisible();
    expect(screen.getByText(source.reviewId)).toBeVisible();
    expect(screen.getByText("Recorded rating").parentElement).toHaveTextContent("2");
    expect(screen.getByRole("link", { name: "Open supplied source URL" })).toHaveAttribute("href", source.sourceUrl);
    expect(screen.getByText("Hard to clean")).toBeVisible();
    expect(screen.getByText("noisy")).toBeVisible();
    expect(screen.getAllByText(/end exclusive/)).toHaveLength(2);
    expect(screen.getByText(/Mercata Lens has not fetched or independently verified/)).toBeVisible();
    expect(screen.getByRole("group", { name: "Desired effective labels" })).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(7);
    expect(screen.getByText("Automatic labels")).toBeVisible();
    expect(screen.getByText("Manually added")).toBeVisible();
    expect(screen.getByText("Manually removed")).toBeVisible();
    expect(screen.getByText("Effective labels")).toBeVisible();
  });

  it("derives catalog-ordered add/remove, validates reason, resets, applies, clears, and locks navigation while dirty", async () => {
    const source = review("Hard to clean.");
    const row = rowFor(source);
    const onApply = vi.fn(() => true);
    const onClear = vi.fn();
    const onDirtyChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<ReviewCorrectionPanel row={row} hasPrevious={true} hasNext={true} onPrevious={vi.fn()} onNext={vi.fn()} onApply={onApply} onClear={onClear} onDirtyChange={onDirtyChange} />);
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);
    expect(screen.getByRole("button", { name: "Apply correction & next" })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "Correction reason" }), "  Reason with spaces  ");
    expect(screen.getByRole("button", { name: "Apply correction & next" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Previous review" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next review" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Clear correction" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset draft" }));
    expect(screen.getByRole("button", { name: "Previous review" })).toBeEnabled();
    await user.click(checkboxes[1]);
    await user.type(screen.getByRole("textbox", { name: "Correction reason" }), "Manual reason");
    await user.click(screen.getByRole("button", { name: "Apply correction & next" }));
    expect(onApply).toHaveBeenCalledWith("r1", { add: ["noise"], remove: [], reason: "Manual reason" });
    expect(screen.getAllByRole("status").some((element) => element.textContent?.includes("Correction applied to r1."))).toBe(true);

    const correctedRow = rowFor(source, { add: ["noise"], remove: ["hard_to_clean"], reason: "Manual" });
    rerender(<ReviewCorrectionPanel row={correctedRow} hasPrevious={false} hasNext={false} onPrevious={vi.fn()} onNext={vi.fn()} onApply={onApply} onClear={onClear} onDirtyChange={onDirtyChange} />);
    expect(screen.getAllByRole("status").some((element) => element.textContent?.includes("Correction applied to r1."))).toBe(true);
    expect(screen.getByRole("button", { name: "Clear correction" })).toBeVisible();
    await user.click(screen.getAllByRole("checkbox", { name: "noise" })[0]);
    expect(screen.getByRole("button", { name: "Clear correction" })).toBeDisabled();
    expect(onClear).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Reset draft" }));
    expect(screen.getByRole("button", { name: "Clear correction" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Clear correction" }));
    expect(onClear).toHaveBeenCalledWith("r1");
    rerender(<ReviewCorrectionPanel row={rowFor(review("No automatic phrase match."))} hasPrevious={false} hasNext={false} onPrevious={vi.fn()} onNext={vi.fn()} onApply={vi.fn(() => false)} onClear={vi.fn()} onDirtyChange={onDirtyChange} />);
    expect(screen.getAllByText("No automatic phrase match.")).toHaveLength(2);
    expect(screen.getAllByText("Product title unavailable")).toHaveLength(1);
    expect(screen.getAllByText("Not provided")).toHaveLength(2);
    expect(screen.getAllByText("None").length).toBeGreaterThan(0);
    expect(PAIN_POINT_IDS).toHaveLength(7);
  });
});
