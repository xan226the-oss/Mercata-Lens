import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReviewClassification } from "../domain/painPoints";
import type { ReviewRecord } from "../domain/types";
import { ReviewQueue, filterReviewQueueRows, type ReviewQueueRow } from "./ReviewQueue";

function review(reviewId: string, text: string): ReviewRecord {
  return { reviewId, productId: reviewId, rating: 2, reviewText: text, reviewDate: null, verifiedPurchase: null, sourceUrl: `https://example.com/${reviewId}` };
}
function classification(labels: string[], effective = labels, validity: ReviewClassification["correctionValidity"] = "none"): ReviewClassification {
  return { reviewId: "", productId: "", rulesetVersion: "1.0.0", automaticMatches: [], automaticLabels: labels as ReviewClassification["automaticLabels"], effectiveLabels: effective as ReviewClassification["effectiveLabels"], correction: validity === "applied" ? { add: [], remove: [], reason: "Manual" } : null, correctionValidity: validity, addedLabels: [], removedLabels: [] };
}
function rows(): ReviewQueueRow[] {
  return [
    { review: review("r1", "automatic"), productTitle: "One", classification: classification(["noise"]), corrected: false },
    { review: review("r2", "corrected automatic"), productTitle: "Two", classification: classification(["noise"], ["noise"], "applied"), corrected: true },
    { review: review("r3", "corrected manual only"), productTitle: "Three", classification: classification([], ["noise"], "applied"), corrected: true },
    { review: review("r4", "unmatched"), productTitle: null, classification: classification([]), corrected: false },
  ];
}

describe("ReviewQueue", () => {
  it("filters with exact status semantics and preserves dataset order", () => {
    const input = rows();
    expect(filterReviewQueueRows(input, "rule_matched", null).map((row) => row.review.reviewId)).toEqual(["r1", "r2"]);
    expect(filterReviewQueueRows(input, "corrected", null).map((row) => row.review.reviewId)).toEqual(["r2", "r3"]);
    expect(filterReviewQueueRows(input, "no_automatic_match", null).map((row) => row.review.reviewId)).toEqual(["r3", "r4"]);
    expect(filterReviewQueueRows(input, "all", "noise").map((row) => row.review.reviewId)).toEqual(["r1", "r2", "r3"]);
  });

  it("renders one table, pressed filters, corrected priority, selection, and empty state", async () => {
    const onStatusChange = vi.fn();
    const onSelect = vi.fn();
    const onShowAll = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<ReviewQueue rows={rows()} status="all" activeLabel={null} selectedReviewId="r2" disabled={false} onStatusChange={onStatusChange} onSelect={onSelect} onShowAll={onShowAll} />);
    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /r[1-4]/i }).map((button) => button.textContent)).toEqual(["r1", "r2", "r3", "r4"]);
    expect(screen.getAllByText("Corrected").some((element) => element.tagName === "TD")).toBe(true);
    expect(screen.getAllByText("noise").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "r2" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "No automatic match" }));
    expect(onStatusChange).toHaveBeenCalledWith("no_automatic_match");
    await user.click(screen.getByRole("button", { name: "r1" }));
    expect(onSelect).toHaveBeenCalledWith("r1");
    rerender(<ReviewQueue rows={[]} status="all" activeLabel="noise" selectedReviewId={null} disabled={false} onStatusChange={onStatusChange} onSelect={onSelect} onShowAll={onShowAll} />);
    expect(screen.getByText("No reviews match the current filters.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Show all reviews" }));
    expect(onShowAll).toHaveBeenCalledTimes(1);
    rerender(<ReviewQueue rows={rows()} status="all" activeLabel={null} selectedReviewId={null} disabled={true} onStatusChange={onStatusChange} onSelect={onSelect} onShowAll={onShowAll} />);
    expect(screen.getByRole("button", { name: "All" })).toBeDisabled();
  });
});
