import type { ReactElement } from "react";

export interface EvidenceGate {
  id: string;
  label: string;
  status: "passed" | "warning" | "blocked";
  detail: string;
}

export function EvidenceStatus({ gates }: { gates: EvidenceGate[] }): ReactElement {
  return (
    <section className="evidence-status" aria-labelledby="evidence-status-title">
      <div className="section-heading">
        <span className="section-kicker">Evidence readiness</span>
        <h2 id="evidence-status-title">What the current dataset supports</h2>
      </div>
      <ul className="evidence-gates">
        {gates.map((gate) => (
          <li className={`evidence-gate evidence-gate--${gate.status}`} data-testid={`evidence-${gate.id}`} key={gate.id}>
            <span className="evidence-gate__icon" aria-hidden="true">
              {gate.status === "passed" ? "✓" : gate.status === "warning" ? "!" : "×"}
            </span>
            <span className="evidence-gate__copy">
              <strong>{gate.label}</strong>
              <small>{gate.detail}</small>
            </span>
            <span className="evidence-gate__state">{gate.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
