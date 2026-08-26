import type { ReactElement } from "react";
import type { DecisionReport } from "../domain/decision";

export interface ValidationPlanProps {
  report: DecisionReport;
  onEvidenceClick?: (evidenceId: string) => void;
}

function EvidenceList({ title, ids, onEvidenceClick }: { title: string; ids: readonly string[]; onEvidenceClick?: (id: string) => void }): ReactElement {
  return (
    <section className="validation-plan__evidence" aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-title`}>
      <h3 id={`${title.toLowerCase().replaceAll(" ", "-")}-title`}>{title}</h3>
      {ids.length === 0 ? <p>None recorded.</p> : <ul>{ids.map((id) => <li key={id}>{onEvidenceClick ? <button type="button" onClick={() => onEvidenceClick(id)}>{id}</button> : <span>{id}</span>}</li>)}</ul>}
    </section>
  );
}

function TextList({ title, values, testId }: { title: string; values: readonly string[]; testId?: string }): ReactElement {
  return <section className="validation-plan__list" data-testid={testId}><h3>{title}</h3>{values.length === 0 ? <p>None recorded.</p> : <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul>}</section>;
}

export function ValidationPlan({ report, onEvidenceClick }: ValidationPlanProps): ReactElement {
  return (
    <section className="validation-plan" aria-labelledby="validation-plan-title">
      <div className="validation-plan__header"><span className="section-kicker">Evidence boundaries</span><h2 id="validation-plan-title">Validation plan</h2><p>Actions remain local and evidence-led. They do not constitute sourcing, pricing, launch, or purchase advice.</p></div>
      <div className="validation-plan__grid">
        <section className="validation-plan__actions"><h3>Next actions</h3>{report.nextActions.length === 0 ? <p>None recorded.</p> : <ol>{report.nextActions.map((action, index) => <li key={`${action.owner}-${action.action}-${index}`}><strong>{action.owner}</strong><span>{action.action}</span><small>Evidence expected: {action.evidenceExpected}</small></li>)}</ol>}</section>
        <EvidenceList title="Support evidence" ids={report.supportEvidenceIds} onEvidenceClick={onEvidenceClick} />
        <EvidenceList title="Opposition evidence" ids={report.oppositionEvidenceIds} onEvidenceClick={onEvidenceClick} />
        <TextList title="Assumptions" values={report.assumptions} testId="decision-assumptions" />
        <TextList title="Missing data" values={report.missingData} testId="decision-missing-data" />
        <TextList title="Limitations" values={report.limitations} testId="decision-limitations" />
      </div>
      <div className="validation-plan__conditions" data-testid="decision-conditions-summary">
        <TextList title="Continue conditions" values={report.continueConditions} />
        <TextList title="Pause conditions" values={report.pauseConditions} />
        <TextList title="Stop conditions" values={report.stopConditions} />
      </div>
    </section>
  );
}
