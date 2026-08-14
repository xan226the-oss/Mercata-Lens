import type { ReactElement } from "react";
import type { AnalysisModule, QualityReport } from "../domain/types";

interface ModuleStatusProps {
  availability: QualityReport["moduleAvailability"];
}

const MODULE_LABEL = {
  category: "Category overview",
  pain_points: "Customer pain points",
  economics: "Economics",
  opportunities: "Opportunity comparison",
} satisfies Record<AnalysisModule, string>;

const MODULE_KEYS: AnalysisModule[] = ["category", "pain_points", "economics", "opportunities"];

function availabilityText(status: QualityReport["moduleAvailability"][AnalysisModule]): string {
  if (status === "available") return "Available";
  if (status === "incomplete") return "Incomplete";
  return "Locked";
}

function availabilityReason(status: QualityReport["moduleAvailability"][AnalysisModule]): string {
  if (status === "available") return "Current evidence requirements are met for this module.";
  if (status === "incomplete") return "Evidence is present, but required analysis inputs are still incomplete.";
  return "Locked until the current evidence requirements are met.";
}

export function ModuleStatus({ availability }: ModuleStatusProps): ReactElement {
  return (
    <section className="module-status" aria-labelledby="module-status-title">
      <span className="section-kicker">Analysis access</span>
      <h2 id="module-status-title">Module availability</h2>
      <ul className="module-status__list">
        {MODULE_KEYS.map((module) => {
          const state = availability[module];
          return (
            <li className="module-status__item" data-testid={`module-${module}`} key={module}>
              <span className={`module-status__marker module-status__marker--${state}`} aria-hidden="true">
                {state === "available" ? "✓" : state === "incomplete" ? "!" : "×"}
              </span>
              <span className="module-status__copy">
                <strong>{MODULE_LABEL[module]}</strong>
                <small>{availabilityReason(state)}</small>
              </span>
              <span className={`module-status__state module-status__state--${state}`}>{availabilityText(state)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
