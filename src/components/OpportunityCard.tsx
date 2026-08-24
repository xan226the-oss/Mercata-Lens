import type { ReactElement } from "react";
import type { SourceKind } from "../domain/types";
import type { Opportunity, OpportunityScore } from "../domain/opportunities";

interface OpportunityCardProps {
  opportunity: Opportunity;
  score: OpportunityScore;
  sourceKind: SourceKind;
  onEvidenceClick: (evidenceId: string) => void;
  resolveEvidence: (evidenceId: string) => ReactElement;
}

const DIMENSION_LABELS = {
  demand: "Demand",
  supply_gap: "Supply gap",
  economics: "Economics",
  differentiation: "Differentiation",
  risk: "Risk",
} as const;

export function OpportunityCard({ opportunity, score, sourceKind, onEvidenceClick, resolveEvidence }: OpportunityCardProps): ReactElement {
  return (
    <article className="opportunity-card" data-testid={`opportunity-card-${opportunity.id}`}>
      <header className="opportunity-card__header">
        <div>
          <p className="opportunity-card__eyebrow">Hypothesis</p>
          <h2>{opportunity.name}</h2>
        </div>
        {score.status === "complete" ? <strong className="opportunity-card__score">Weighted total: {score.total}</strong> : <strong className="opportunity-card__incomplete">Incomplete — current-session user input required</strong>}
      </header>
      <p className="opportunity-card__source">{sourceKind === "demo" ? "Curated Demo assumption inputs; not a market conclusion." : "User upload evidence does not inherit Demo scores."}</p>
      <dl className="opportunity-card__context">
        <div><dt>Target user</dt><dd>{opportunity.targetUser}</dd></div>
        <div><dt>Scenario</dt><dd>{opportunity.scenario}</dd></div>
      </dl>
      <section aria-labelledby={`${opportunity.id}-dimensions`}>
        <h3 id={`${opportunity.id}-dimensions`}>Dimension contributions</h3>
        <ul className="opportunity-card__dimensions">
          {opportunity.dimensions.map((dimension) => {
            const contribution = score.status === "complete" ? score.contributions.find((item) => item.dimension === dimension.dimension) : null;
            return <li key={dimension.dimension}>
              <div className="opportunity-card__dimension-heading"><strong>{DIMENSION_LABELS[dimension.dimension]}</strong><span>{dimension.value === null ? "Missing" : dimension.value}</span></div>
              <p>{dimension.reasoning}</p>
              {contribution && <p>Contribution: {contribution.contribution} at weight {contribution.weight}.</p>}
              <div className="opportunity-card__evidence-list">
                {dimension.evidenceIds.length === 0 ? <span>No evidence linked yet.</span> : dimension.evidenceIds.map((evidenceId) => <button key={evidenceId} type="button" onClick={() => onEvidenceClick(evidenceId)}>{evidenceId}</button>)}
                {dimension.evidenceIds.map((evidenceId) => <div key={`${evidenceId}-detail`} className="opportunity-card__evidence-detail">{resolveEvidence(evidenceId)}</div>)}
              </div>
            </li>;
          })}
        </ul>
      </section>
      <section className="opportunity-card__economics" aria-labelledby={`${opportunity.id}-economics`}>
        <h3 id={`${opportunity.id}-economics`}>Named economics scenarios</h3>
        <ul>
          {opportunity.economics.map((scenario) => <li key={scenario.id}>{scenario.label}</li>)}
        </ul>
      </section>
      <section className="opportunity-card__evidence" aria-label={`${opportunity.name} evidence summary`}>
        <div><h3>Support evidence</h3><div className="opportunity-card__evidence-list">{opportunity.supportEvidenceIds.length > 0 ? opportunity.supportEvidenceIds.map((id) => <button key={id} type="button" onClick={() => onEvidenceClick(id)}>{id}</button>) : "None linked yet."}</div></div>
        <div><h3>Opposition evidence</h3><div className="opportunity-card__evidence-list">{opportunity.oppositionEvidenceIds.length > 0 ? opportunity.oppositionEvidenceIds.map((id) => <button key={id} type="button" onClick={() => onEvidenceClick(id)}>{id}</button>) : "None linked yet."}</div></div>
        <div><h3>Unknowns</h3><ul>{opportunity.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}</ul></div>
      </section>
    </article>
  );
}
