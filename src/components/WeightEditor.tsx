import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  OPPORTUNITY_DIMENSIONS,
  type OpportunityDimension,
  type OpportunityWeights,
} from "../domain/opportunities";

const LABELS: Record<OpportunityDimension, string> = {
  demand: "Demand weight",
  supply_gap: "Supply gap weight",
  economics: "Economics weight",
  differentiation: "Differentiation weight",
  risk: "Risk weight",
};

interface WeightEditorProps {
  weights: OpportunityWeights;
  onReplaceWeights: (weights: OpportunityWeights) => boolean;
  onReset: () => void;
  onValidityChange?: (valid: boolean) => void;
}

function parseDraft(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function WeightEditor({ weights, onReplaceWeights, onReset, onValidityChange }: WeightEditorProps): ReactElement {
  const [drafts, setDrafts] = useState<Record<OpportunityDimension, string>>(() =>
    Object.fromEntries(OPPORTUNITY_DIMENSIONS.map((dimension) => [dimension, String(weights[dimension])])) as Record<OpportunityDimension, string>,
  );
  const [errors, setErrors] = useState<Partial<Record<OpportunityDimension | "total", string>>>({});

  useEffect(() => {
    setDrafts((current) => Object.fromEntries(OPPORTUNITY_DIMENSIONS.map((dimension) => [dimension, current[dimension] ?? String(weights[dimension])])) as Record<OpportunityDimension, string>);
  }, [weights]);

  const parsed = useMemo(() => Object.fromEntries(OPPORTUNITY_DIMENSIONS.map((dimension) => [dimension, parseDraft(drafts[dimension])])) as Record<OpportunityDimension, number | null>, [drafts]);
  const total = OPPORTUNITY_DIMENSIONS.reduce((sum, dimension) => sum + (parsed[dimension] ?? 0), 0);
  const allFinite = OPPORTUNITY_DIMENSIONS.every((dimension) => parsed[dimension] !== null);
  const totalValid = allFinite && total === 100;

  useEffect(() => {
    onValidityChange?.(totalValid);
  }, [onValidityChange, totalValid]);

  function update(dimension: OpportunityDimension, raw: string) {
    setDrafts((current) => ({ ...current, [dimension]: raw }));
    const nextParsed = { ...parsed, [dimension]: parseDraft(raw) };
    const nextTotal = OPPORTUNITY_DIMENSIONS.reduce((sum, key) => sum + (nextParsed[key] ?? 0), 0);
    const nextAllFinite = OPPORTUNITY_DIMENSIONS.every((key) => nextParsed[key] !== null);
    const nextErrors: Partial<Record<OpportunityDimension | "total", string>> = {};
    if (parseDraft(raw) === null) nextErrors[dimension] = "Enter a finite non-negative weight.";
    if (!nextAllFinite || nextTotal !== 100) nextErrors.total = "Weights must total exactly 100 before ranking is available.";
    else {
      const candidate = nextParsed as OpportunityWeights;
      if (!onReplaceWeights(candidate)) nextErrors.total = "Weights were rejected by the scoring contract.";
    }
    setErrors(nextErrors);
  }

  function reset() {
    onReset();
    setDrafts(Object.fromEntries(OPPORTUNITY_DIMENSIONS.map((dimension) => [dimension, String(weights[dimension])])) as Record<OpportunityDimension, string>);
    setErrors({});
  }

  return (
    <section className="weight-editor" aria-labelledby="weight-editor-title">
      <div className="weight-editor__header">
        <div>
          <h2 id="weight-editor-title">Current-session scoring weights</h2>
          <p>Scoring model is a configurable hypothesis. Weights are not persisted.</p>
        </div>
        <button type="button" onClick={reset}>Restore defaults</button>
      </div>
      <div className="weight-editor__fields">
        {OPPORTUNITY_DIMENSIONS.map((dimension) => {
          const errorId = `weight-error-${dimension}`;
          return <label className="weight-field" key={dimension} htmlFor={`weight-${dimension}`}>
            <span>{LABELS[dimension]}</span>
            <input
              id={`weight-${dimension}`}
              type="text"
              role="spinbutton"
              step="any"
              value={drafts[dimension]}
              aria-invalid={errors[dimension] ? "true" : undefined}
              aria-describedby={errors[dimension] ? errorId : undefined}
              onChange={(event) => update(dimension, event.target.value)}
            />
            {errors[dimension] && <span id={errorId} className="weight-field__error">{errors[dimension]}</span>}
          </label>;
        })}
      </div>
      <p className={`weight-editor__total${totalValid ? "" : " weight-editor__total--invalid"}`} data-testid="weight-total" aria-live="polite">
        Draft total: {Number.isInteger(total) ? total : total.toFixed(2)}
      </p>
      {errors.total && <p className="weight-editor__error" id="weight-error-total">{errors.total}</p>}
    </section>
  );
}
