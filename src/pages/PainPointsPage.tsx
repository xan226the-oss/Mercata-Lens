import { useCallback, useEffect, useMemo, useState } from "react";
import { DataSourceBadge } from "../components/DataSourceBadge";
import { PageHeader } from "../components/PageHeader";
import { PainPointSummaryList } from "../components/PainPointSummaryList";
import { ReviewCorrectionPanel } from "../components/ReviewCorrectionPanel";
import { ReviewQueue, filterReviewQueueRows, type ReviewQueueRow, type ReviewQueueStatus } from "../components/ReviewQueue";
import { PAIN_POINT_RULESET_VERSION, type PainPointId } from "../domain/painPointRules";
import { classifyReview, summarizePainPoints, type PainPointCorrection } from "../domain/painPoints";
import { useResearch } from "../research/ResearchContext";

export function PainPointsPage() {
  const { dataset, sourceKind, corrections, applyReviewCorrection, clearReviewCorrection } = useResearch();
  const [statusFilter, setStatusFilter] = useState<ReviewQueueStatus>("rule_matched");
  const [labelFilter, setLabelFilter] = useState<PainPointId | null>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [draftDirty, setDraftDirty] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<string | null | undefined>(undefined);

  const summaries = useMemo(() => dataset ? summarizePainPoints(dataset, corrections) : [], [dataset, corrections]);
  const rows = useMemo<ReviewQueueRow[]>(() => {
    if (!dataset) return [];
    const titles = new Map(dataset.products.map((product) => [product.productId, product.title]));
    return dataset.reviews.map((review) => {
      const classification = classifyReview(review, corrections);
      return {
        review,
        productTitle: titles.get(review.productId) ?? null,
        classification,
        corrected: classification.correctionValidity === "applied",
      };
    });
  }, [dataset, corrections]);
  const filteredRows = useMemo(() => filterReviewQueueRows(rows, statusFilter, labelFilter), [rows, statusFilter, labelFilter]);
  const selectedRow = rows.find((row) => row.review.reviewId === selectedReviewId) ?? null;
  const selectedIndex = selectedRow ? filteredRows.findIndex((row) => row.review.reviewId === selectedRow.review.reviewId) : -1;

  useEffect(() => {
    setStatusFilter("rule_matched");
    setLabelFilter(null);
    setDraftDirty(false);
    setPendingSelection(undefined);
    const first = filterReviewQueueRows(rows, "rule_matched", null)[0];
    setSelectedReviewId(first?.review.reviewId ?? null);
  }, [dataset]);

  useEffect(() => {
    if (pendingSelection === undefined) return;
    setSelectedReviewId(pendingSelection);
    setPendingSelection(undefined);
  }, [pendingSelection]);

  useEffect(() => {
    if (pendingSelection !== undefined) return;
    if (selectedReviewId && filteredRows.some((row) => row.review.reviewId === selectedReviewId)) return;
    setSelectedReviewId(filteredRows[0]?.review.reviewId ?? null);
  }, [filteredRows, pendingSelection, selectedReviewId]);

  const selectFromQueue = useCallback((nextRows: ReviewQueueRow[], preferredId: string | null) => {
    const preferred = preferredId && nextRows.some((row) => row.review.reviewId === preferredId) ? preferredId : null;
    setSelectedReviewId(preferred ?? nextRows[0]?.review.reviewId ?? null);
  }, []);

  const activateSummary = useCallback((id: PainPointId) => {
    const nextRows = filterReviewQueueRows(rows, "all", id);
    setStatusFilter("all");
    setLabelFilter(id);
    selectFromQueue(nextRows, null);
  }, [rows, selectFromQueue]);

  const clearLabel = useCallback(() => {
    const nextRows = filterReviewQueueRows(rows, statusFilter, null);
    setLabelFilter(null);
    selectFromQueue(nextRows, selectedReviewId);
  }, [rows, selectFromQueue, selectedReviewId, statusFilter]);

  const changeStatus = useCallback((nextStatus: ReviewQueueStatus) => {
    const nextRows = filterReviewQueueRows(rows, nextStatus, labelFilter);
    setStatusFilter(nextStatus);
    selectFromQueue(nextRows, selectedReviewId);
  }, [labelFilter, rows, selectFromQueue, selectedReviewId]);

  const showAll = useCallback(() => {
    const nextRows = filterReviewQueueRows(rows, "all", null);
    setStatusFilter("all");
    setLabelFilter(null);
    selectFromQueue(nextRows, rows[0]?.review.reviewId ?? null);
  }, [rows, selectFromQueue]);

  const moveSelection = useCallback((direction: -1 | 1) => {
    if (draftDirty || selectedIndex < 0) return;
    const next = filteredRows[selectedIndex + direction];
    if (next) setSelectedReviewId(next.review.reviewId);
  }, [draftDirty, filteredRows, selectedIndex]);

  const applyCorrection = useCallback((reviewId: string, correction: PainPointCorrection): boolean => {
    const oldIndex = filteredRows.findIndex((row) => row.review.reviewId === reviewId);
    const nextId = filteredRows[oldIndex + 1]?.review.reviewId ?? null;
    const previousId = filteredRows[oldIndex - 1]?.review.reviewId ?? null;
    const accepted = applyReviewCorrection(reviewId, correction);
    if (!accepted) return false;
    const nextRows = filterReviewQueueRows(rows.map((row) => row.review.reviewId === reviewId ? { ...row, classification: classifyReview(row.review, { ...corrections, [reviewId]: correction }), corrected: true } : row), statusFilter, labelFilter);
    const fallback = nextId && nextRows.some((row) => row.review.reviewId === nextId) ? nextId : previousId && nextRows.some((row) => row.review.reviewId === previousId) ? previousId : reviewId && nextRows.some((row) => row.review.reviewId === reviewId) ? reviewId : nextRows[oldIndex]?.review.reviewId ?? nextRows.at(-1)?.review.reviewId ?? null;
    setPendingSelection(fallback);
    setDraftDirty(false);
    return true;
  }, [applyReviewCorrection, corrections, filteredRows, labelFilter, rows, statusFilter]);

  const clearCorrection = useCallback((reviewId: string) => {
    const oldIndex = filteredRows.findIndex((row) => row.review.reviewId === reviewId);
    const nextCorrections = { ...corrections };
    delete nextCorrections[reviewId];
    const nextRows = rows.map((row) => ({
      ...row,
      classification: classifyReview(row.review, nextCorrections),
      corrected: Boolean(nextCorrections[row.review.reviewId]),
    }));
    const nextFilteredRows = filterReviewQueueRows(nextRows, statusFilter, labelFilter);
    const sameReview = nextFilteredRows.some((row) => row.review.reviewId === reviewId)
      ? reviewId
      : nextFilteredRows[oldIndex]?.review.reviewId
        ?? nextFilteredRows.at(-1)?.review.reviewId
        ?? null;
    clearReviewCorrection(reviewId);
    setPendingSelection(sameReview);
    setDraftDirty(false);
  }, [clearReviewCorrection, corrections, filteredRows, labelFilter, rows, statusFilter]);

  if (!dataset || !sourceKind) {
    return <section className="page"><PageHeader eyebrow="Rule-matched review evidence" title="Customer pain-point evidence" description="Deterministic review signals for the active US cat water fountain sample." /><p>No active review evidence is available.</p></section>;
  }

  return (
    <section className="pain-point-page">
      <PageHeader
        eyebrow="Rule-matched review evidence"
        title="Customer pain-point evidence"
        description="Deterministic review signals for the active US cat water fountain sample."
        meta={<div className="pain-point-page__meta"><span>{dataset.category}</span><span>{dataset.reviews.length} review records</span><span>Ruleset {PAIN_POINT_RULESET_VERSION}</span><DataSourceBadge sourceKind={sourceKind} /></div>}
      />
      <section className="pain-point-boundary" aria-labelledby="pain-point-boundary-title">
        <h2 id="pain-point-boundary-title">Method and evidence boundary</h2>
        <ul>
          <li>Matching uses explicit English phrases with case, punctuation, and whitespace normalization only.</li>
          <li>One review can carry more than one label, so summary rows are not additive.</li>
          <li>The denominator is actual review records in the active dataset, not product reviewCount.</li>
          <li>{sourceKind === "demo" ? "Demo reviews are synthetic fixtures." : "User-uploaded reviews retain their own sourcing limitations."}</li>
          <li>Signals do not establish sales, demand, wider-market prevalence, severity, or a business opportunity.</li>
        </ul>
      </section>
      <div className="pain-point-workbench">
        <PainPointSummaryList summaries={summaries} activeLabel={labelFilter} disabled={draftDirty} onActivate={activateSummary} onClear={clearLabel} />
        <ReviewQueue rows={rows} status={statusFilter} activeLabel={labelFilter} selectedReviewId={selectedReviewId} disabled={draftDirty} onStatusChange={changeStatus} onSelect={setSelectedReviewId} onShowAll={showAll} />
        <ReviewCorrectionPanel row={selectedRow} hasPrevious={selectedIndex > 0} hasNext={selectedIndex >= 0 && selectedIndex < filteredRows.length - 1} onPrevious={() => moveSelection(-1)} onNext={() => moveSelection(1)} onApply={applyCorrection} onClear={clearCorrection} onDirtyChange={setDraftDirty} />
      </div>
    </section>
  );
}
