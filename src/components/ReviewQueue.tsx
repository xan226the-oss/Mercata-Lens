import type { PainPointId } from "../domain/painPointRules";
import type { ReviewClassification } from "../domain/painPoints";
import type { ReviewRecord } from "../domain/types";

export type ReviewQueueStatus = "rule_matched" | "corrected" | "no_automatic_match" | "all";

export interface ReviewQueueRow {
  review: ReviewRecord;
  productTitle: string | null;
  classification: ReviewClassification;
  corrected: boolean;
}

export interface ReviewQueueProps {
  rows: ReviewQueueRow[];
  status: ReviewQueueStatus;
  activeLabel: PainPointId | null;
  selectedReviewId: string | null;
  disabled: boolean;
  onStatusChange: (status: ReviewQueueStatus) => void;
  onSelect: (reviewId: string) => void;
  onShowAll: () => void;
}

const STATUS_OPTIONS: Array<{ id: ReviewQueueStatus; label: string }> = [
  { id: "rule_matched", label: "Rule-matched" },
  { id: "corrected", label: "Corrected" },
  { id: "no_automatic_match", label: "No automatic match" },
  { id: "all", label: "All" },
];

export function filterReviewQueueRows(rows: readonly ReviewQueueRow[], status: ReviewQueueStatus, activeLabel: PainPointId | null): ReviewQueueRow[] {
  return rows.filter((row) => {
    const statusMatches = status === "all"
      || (status === "rule_matched" && row.classification.automaticLabels.length > 0)
      || (status === "corrected" && row.corrected)
      || (status === "no_automatic_match" && row.classification.automaticLabels.length === 0);
    return statusMatches && (activeLabel === null || row.classification.effectiveLabels.includes(activeLabel));
  });
}

function stateLabel(row: ReviewQueueRow): string {
  if (row.corrected) return "Corrected";
  if (row.classification.automaticLabels.length > 0) return "Automatic match";
  return "No automatic match";
}

export function ReviewQueue({ rows, status, activeLabel, selectedReviewId, disabled, onStatusChange, onSelect, onShowAll }: ReviewQueueProps) {
  const filteredRows = filterReviewQueueRows(rows, status, activeLabel);
  return (
    <section className="review-queue" aria-labelledby="review-queue-title">
      <div className="section-heading">
        <span className="section-kicker">Review triage</span>
        <h2 id="review-queue-title">Review queue</h2>
        <p>{filteredRows.length} reviews in this view. Click a review ID to inspect and correct its evidence.</p>
      </div>
      <div className="review-queue__filters" aria-label="Review status filters">
        {STATUS_OPTIONS.map((option) => (
          <button key={option.id} type="button" className="filter-button" aria-pressed={status === option.id} disabled={disabled} onClick={() => onStatusChange(option.id)}>{option.label}</button>
        ))}
      </div>
      {filteredRows.length === 0 ? (
        <div className="review-queue__empty" role="status">
          <p>No reviews match the current filters.</p>
          <button type="button" className="text-button" disabled={disabled} onClick={onShowAll}>Show all reviews</button>
        </div>
      ) : (
        <div className="review-queue__table-wrap">
          <table className="review-queue__table">
            <caption>Review evidence queue</caption>
            <thead><tr><th>State</th><th>Review</th><th>Product</th><th>Rating</th><th>Review excerpt</th><th>Effective labels</th></tr></thead>
            <tbody>
              {filteredRows.map((row) => {
                const selected = row.review.reviewId === selectedReviewId;
                return (
                  <tr key={row.review.reviewId} className={selected ? "review-queue__row review-queue__row--selected" : "review-queue__row"}>
                    <td data-label="State">{stateLabel(row)}</td>
                    <td data-label="Review"><button type="button" className="review-queue__select" aria-pressed={selected} disabled={disabled} onClick={() => onSelect(row.review.reviewId)}>{row.review.reviewId}</button></td>
                    <td data-label="Product">{row.productTitle ?? "Product title unavailable"}</td>
                    <td data-label="Rating">{row.review.rating}</td>
                    <td data-label="Review excerpt" className="review-queue__excerpt">{row.review.reviewText}</td>
                    <td data-label="Effective labels">{row.classification.effectiveLabels.length > 0 ? row.classification.effectiveLabels.join(", ") : "None"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
