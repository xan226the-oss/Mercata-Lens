import type { PainPointId } from "../domain/painPointRules";
import type { PainPointSummary } from "../domain/painPoints";

export interface PainPointSummaryListProps {
  summaries: PainPointSummary[];
  activeLabel: PainPointId | null;
  disabled: boolean;
  onActivate: (id: PainPointId) => void;
  onClear: () => void;
}

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function PainPointSummaryList({ summaries, activeLabel, disabled, onActivate, onClear }: PainPointSummaryListProps) {
  return (
    <section className="pain-point-summary" aria-labelledby="pain-point-summary-title">
      <div className="section-heading">
        <span className="section-kicker">Signal index</span>
        <h2 id="pain-point-summary-title">Review signals</h2>
        <p>Click a signal to filter the review queue. Counts can overlap.</p>
      </div>
      <ol className="pain-point-summary__list">
        {summaries.map((summary) => {
          const active = activeLabel === summary.id;
          const percent = summary.reviewFraction === null ? "Unavailable" : percentFormatter.format(summary.reviewFraction);
          return (
            <li key={summary.id} className={active ? "pain-point-summary__item pain-point-summary__item--active" : "pain-point-summary__item"}>
              <button
                type="button"
                className="pain-point-summary__button"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => active ? onClear() : onActivate(summary.id)}
              >
                <span className="pain-point-summary__labels">
                  <strong>{summary.labelEn}</strong>
                  <small>{summary.labelZh}</small>
                </span>
                <span className="pain-point-summary__count">{summary.matchedReviewCount} / {summary.reviewDenominator} reviews</span>
                <span className="pain-point-summary__meta"><span>{percent}</span><span>{summary.productCount} products</span></span>
                <small className="pain-point-summary__version">Ruleset {summary.rulesetVersion}</small>
              </button>
            </li>
          );
        })}
      </ol>
      {activeLabel ? <button type="button" className="text-button" disabled={disabled} onClick={onClear}>Clear signal filter</button> : null}
    </section>
  );
}
