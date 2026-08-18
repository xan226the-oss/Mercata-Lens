import type { ReactElement } from "react";

export interface MetricCardProps {
  id: string;
  label: string;
  value: string | number;
  evidenceNote: string;
  calculationNote?: string;
}

export function MetricCard({ id, label, value, evidenceNote, calculationNote }: MetricCardProps): ReactElement {
  return (
    <article className="metric-card" data-testid={`metric-card-${id}`}>
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">{value}</strong>
      <span className="metric-card__evidence">{evidenceNote}</span>
      {calculationNote ? <small className="metric-card__calculation">{calculationNote}</small> : null}
    </article>
  );
}
