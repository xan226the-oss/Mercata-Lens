import { useEffect, useMemo, useState } from "react";
import { PAIN_POINT_IDS, type PainPointId } from "../domain/painPointRules";
import type { PainPointCorrection, ReviewClassification } from "../domain/painPoints";
import type { ReviewRecord } from "../domain/types";
import type { ReviewQueueRow } from "./ReviewQueue";

export type { ReviewQueueRow } from "./ReviewQueue";

export interface ReviewCorrectionPanelProps {
  row: ReviewQueueRow | null;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onApply: (reviewId: string, correction: PainPointCorrection) => boolean;
  onClear: (reviewId: string) => void;
  onDirtyChange: (dirty: boolean) => void;
}

function labelsText(labels: readonly PainPointId[]): string {
  return labels.length > 0 ? labels.join(", ") : "None";
}

function isSameLabels(left: readonly PainPointId[], right: readonly PainPointId[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function initialLabels(classification: ReviewClassification): PainPointId[] {
  return [...classification.effectiveLabels];
}

function initialReason(classification: ReviewClassification): string {
  return classification.correction?.reason ?? "";
}

function sourceValue(review: ReviewRecord): string {
  return review.reviewDate ?? "Not provided";
}

export function ReviewCorrectionPanel({ row, hasPrevious, hasNext, onPrevious, onNext, onApply, onClear, onDirtyChange }: ReviewCorrectionPanelProps) {
  const [selectedLabels, setSelectedLabels] = useState<PainPointId[]>([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!row) {
      setSelectedLabels([]);
      setReason("");
      setError(null);
      return;
    }
    setSelectedLabels(initialLabels(row.classification));
    setReason(initialReason(row.classification));
    setError(null);
    setAnnouncement("");
  }, [row?.review.reviewId, row?.classification.correction?.reason, row?.classification.effectiveLabels.join("|")]);

  const automaticLabels = row?.classification.automaticLabels ?? [];
  const currentLabels = row?.classification.effectiveLabels ?? [];
  const draftDirty = Boolean(row) && (!isSameLabels(selectedLabels, currentLabels) || reason !== initialReason(row!.classification));
  const unchangedFromAutomatic = Boolean(row) && isSameLabels(selectedLabels, automaticLabels);
  const unchangedCurrent = Boolean(row) && isSameLabels(selectedLabels, currentLabels) && reason === initialReason(row!.classification);
  const canApply = Boolean(row) && reason.trim() !== "" && !unchangedFromAutomatic && !unchangedCurrent;
  const addedLabels = row?.classification.addedLabels ?? [];
  const removedLabels = row?.classification.removedLabels ?? [];
  const automaticMatches = row?.classification.automaticMatches ?? [];

  useEffect(() => {
    onDirtyChange(draftDirty);
  }, [draftDirty, onDirtyChange]);

  const derivedCorrection = useMemo<PainPointCorrection | null>(() => {
    if (!row) return null;
    return {
      add: PAIN_POINT_IDS.filter((id) => selectedLabels.includes(id) && !automaticLabels.includes(id)),
      remove: PAIN_POINT_IDS.filter((id) => !selectedLabels.includes(id) && automaticLabels.includes(id)),
      reason,
    };
  }, [automaticLabels, reason, row, selectedLabels]);

  if (!row) {
    return <section className="review-correction" aria-labelledby="review-correction-title"><h2 id="review-correction-title">Review evidence</h2><p>No review selected.</p></section>;
  }

  const { review } = row;
  const clear = () => {
    if (draftDirty) return;
    onClear(review.reviewId);
    setAnnouncement(`Correction cleared for ${review.reviewId}.`);
  };
  const apply = () => {
    if (!derivedCorrection) return;
    if (reason.trim() === "") {
      setError("Enter a non-blank reason before applying the correction.");
      return;
    }
    const accepted = onApply(review.reviewId, derivedCorrection);
    if (!accepted) {
      setError("The correction could not be applied to the active dataset.");
      return;
    }
    setError(null);
    setAnnouncement(`Correction applied to ${review.reviewId}.`);
  };
  const reset = () => {
    setSelectedLabels(initialLabels(row.classification));
    setReason(initialReason(row.classification));
    setError(null);
  };

  return (
    <section className="review-correction" aria-labelledby="review-correction-title">
      <div className="section-heading">
        <span className="section-kicker">Selected evidence</span>
        <h2 id="review-correction-title">Review evidence</h2>
        <p>Inspect the supplied record before adding a current-session correction.</p>
      </div>
      <div className="review-correction__navigation">
        <button type="button" className="text-button" disabled={!hasPrevious || draftDirty} onClick={onPrevious}>Previous review</button>
        <button type="button" className="text-button" disabled={!hasNext || draftDirty} onClick={onNext}>Next review</button>
      </div>
      {draftDirty ? <p className="review-correction__dirty" role="status">Apply the correction or reset this draft before moving to another review.</p> : null}
      <article className="review-correction__source">
        <h3>Original review</h3>
        <blockquote>{review.reviewText}</blockquote>
        <dl>
          <div><dt>Review ID</dt><dd>{review.reviewId}</dd></div>
          <div><dt>Product ID</dt><dd>{review.productId}</dd></div>
          <div><dt>Product</dt><dd>{row.productTitle ?? "Product title unavailable"}</dd></div>
          <div><dt>Recorded rating</dt><dd>{review.rating}</dd></div>
          <div><dt>Review date</dt><dd>{sourceValue(review)}</dd></div>
          <div><dt>Verified purchase</dt><dd>{review.verifiedPurchase === null ? "Not provided" : review.verifiedPurchase ? "Yes" : "No"}</dd></div>
          <div><dt>Source</dt><dd><a href={review.sourceUrl} target="_blank" rel="noreferrer">Open supplied source URL</a></dd></div>
        </dl>
        <p className="review-correction__caveat">Mercata Lens has not fetched or independently verified the supplied source URL.</p>
      </article>
      <div className="review-correction__evidence">
        <h3>Automatic phrase evidence</h3>
        {automaticMatches.length > 0 ? automaticMatches.map((match) => (
          <div key={`${match.painPointId}-${match.start}-${match.end}`} className="review-correction__match">
            <strong>{match.sourceText}</strong>
            <span>Configured phrase: {match.includePhrase}</span>
            <span>Rule: {match.ruleId}</span>
            <span>Offsets: {match.start}–{match.end} (end exclusive)</span>
            <span>Ruleset {match.rulesetVersion}</span>
          </div>
        )) : <p>No automatic phrase match.</p>}
      </div>
      <div className="review-correction__groups">
        <div><h3>Automatic labels</h3><p>{labelsText(automaticLabels)}</p></div>
        <div><h3>Manually added</h3><p>{labelsText(addedLabels)}</p></div>
        <div><h3>Manually removed</h3><p>{labelsText(removedLabels)}</p></div>
        <div><h3>Effective labels</h3><p>{labelsText(currentLabels)}</p></div>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); apply(); }}>
        <fieldset>
          <legend>Desired effective labels</legend>
          {PAIN_POINT_IDS.map((id) => <label key={id}><input type="checkbox" checked={selectedLabels.includes(id)} onChange={() => setSelectedLabels((current) => current.includes(id) ? current.filter((item) => item !== id) : PAIN_POINT_IDS.filter((item) => current.includes(item) || item === id))} />{id}</label>)}
        </fieldset>
        <label className="review-correction__reason" htmlFor="correction-reason">Correction reason</label>
        <textarea id="correction-reason" value={reason} aria-invalid={Boolean(error)} aria-describedby={error ? "correction-reason-error" : undefined} onChange={(event) => setReason(event.target.value)} />
        {error ? <p id="correction-reason-error" className="review-correction__error" role="alert">{error}</p> : null}
        <div className="review-correction__actions">
          <button type="submit" disabled={!canApply}>Apply correction &amp; next</button>
          <button type="button" className="text-button" disabled={!draftDirty} onClick={reset}>Reset draft</button>
          {row.classification.correctionValidity === "applied" ? <button type="button" className="text-button" disabled={draftDirty} onClick={clear}>Clear correction</button> : null}
        </div>
      </form>
      <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
    </section>
  );
}
