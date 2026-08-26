import type { ReactElement } from "react";
import type { DecisionReport } from "../domain/decision";
import type { RankingResult } from "../domain/opportunities";

const STATUS_COPY = {
  continue_research: { label: "Continue research", tone: "continue", description: "Current evidence supports another validation step; it does not establish a commercial conclusion." },
  insufficient_evidence: { label: "Insufficient evidence", tone: "insufficient", description: "A required evidence gate is incomplete or blocked. Do not treat this report as a definitive result." },
  pause: { label: "Pause", tone: "pause", description: "An explicit user-authored stop condition was triggered. Review the condition and decide what evidence is needed next." },
} as const;

function rankingLabel(ranking: RankingResult): string {
  if (ranking.status === "winner") return `Leading hypothesis in the configured comparison: ${ranking.winnerId}`;
  if (ranking.status === "no_clear_winner") return "No clear winner under the current-session weights";
  return "Ranking incomplete";
}

export interface DecisionStatusProps {
  report: DecisionReport;
}

export function DecisionStatus({ report }: DecisionStatusProps): ReactElement {
  const copy = STATUS_COPY[report.status];
  return (
    <section className={`decision-status decision-status--${copy.tone}`} aria-labelledby="decision-status-title" data-testid="decision-status" role={report.status === "insufficient_evidence" ? "alert" : "status"}>
      <span className="section-kicker">Decision status</span>
      <h2 id="decision-status-title">{copy.label}</h2>
      <p>{copy.description}</p>
      <p className="decision-status__ranking"><strong>Ranking:</strong> {rankingLabel(report.ranking)}</p>
      {report.triggeredStopConditions.length > 0 ? (
        <div className="decision-status__trigger" data-testid="triggered-stop-conditions">
          <strong>Triggered stop condition</strong>
          <ul>{report.triggeredStopConditions.map((condition) => <li key={condition}>{condition}</li>)}</ul>
        </div>
      ) : null}
    </section>
  );
}
