import type { ChangeEvent, ReactElement } from "react";
import { useEffect, useState } from "react";
import type { EconomicInputKey } from "../domain/economics";
import type { EconomicScenario } from "../domain/types";

const FIELD_DEFINITIONS: ReadonlyArray<{ key: EconomicInputKey; label: string; kind: "dollar" | "rate" }> = [
  { key: "salePriceCents", label: "Sale price", kind: "dollar" },
  { key: "sourcingCostCents", label: "Sourcing cost", kind: "dollar" },
  { key: "inboundFreightCents", label: "Inbound freight", kind: "dollar" },
  { key: "referralFeeRate", label: "Referral fee rate", kind: "rate" },
  { key: "fulfillmentCostCents", label: "Fulfillment cost", kind: "dollar" },
  { key: "advertisingCostCents", label: "Advertising cost", kind: "dollar" },
  { key: "returnLossCents", label: "Return-loss allowance", kind: "dollar" },
  { key: "otherCostCents", label: "Other cost", kind: "dollar" },
];

interface EconomicsEditorProps {
  scenarios: EconomicScenario[];
  onReplaceScenario: (scenario: EconomicScenario) => boolean;
}

function displayValue(value: number | null, kind: "dollar" | "rate"): string {
  if (value === null) return "";
  return kind === "dollar" ? (value / 100).toFixed(2) : String(value * 100);
}

function parseDraft(value: string, kind: "dollar" | "rate"): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return parsed;
  return kind === "dollar" ? Math.round(parsed * 100) : parsed / 100;
}

function draftError(value: string, kind: "dollar" | "rate"): string | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return kind === "dollar" ? "Enter a non-negative dollar amount." : "Enter a finite percentage.";
  if (parsed < 0) return "Value cannot be negative.";
  if (kind === "rate" && parsed > 100) return "Referral fee rate must be between 0% and 100%.";
  return null;
}

export function EconomicsEditor({ scenarios, onReplaceScenario }: EconomicsEditorProps): ReactElement {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setDrafts({});
  }, [scenarios]);

  function handleChange(scenario: EconomicScenario, field: EconomicInputKey, kind: "dollar" | "rate", event: ChangeEvent<HTMLInputElement>) {
    const draftKey = `${scenario.id}:${field}`;
    const value = event.target.value;
    setDrafts((current) => ({ ...current, [draftKey]: value }));
    const next = {
      ...scenario,
      inputs: { ...scenario.inputs, [field]: parseDraft(value, kind) },
      provenance: { ...scenario.provenance, [field]: scenario.provenance[field] ?? null },
    };
    onReplaceScenario(next);
  }

  return (
    <section className="economics-workspace" aria-labelledby="economics-title">
      <div className="economics-heading">
        <span className="section-kicker">Current-session input</span>
        <h2 id="economics-title">Unit economics</h2>
        <p>Inspect estimated per-unit contribution from explicit scenario assumptions. This is not realized profit or a commercial forecast.</p>
      </div>
      <div className="economics-scenarios">
        {scenarios.map((scenario) => (
          <fieldset className="economics-scenario" key={scenario.id} aria-labelledby={`economics-${scenario.id}-title`}>
            <legend id={`economics-${scenario.id}-title`}>{scenario.label}</legend>
            <div className="economics-fields">
              {FIELD_DEFINITIONS.map(({ key, label, kind }) => {
                const inputId = `economics-${scenario.id}-${key}`;
                const errorId = `${inputId}-error`;
                const draftKey = `${scenario.id}:${key}`;
                const value = drafts[draftKey] ?? displayValue(scenario.inputs[key], kind);
                const error = draftError(value, kind);
                const provenance = scenario.provenance[key];
                return (
                  <div className={`economics-field${error ? " economics-field--invalid" : ""}`} key={key}>
                    <label htmlFor={inputId}>{label}</label>
                    <input
                      id={inputId}
                      name={inputId}
                      inputMode="decimal"
                      value={value}
                      aria-describedby={error ? errorId : `${inputId}-help`}
                      aria-invalid={error ? "true" : "false"}
                      onChange={(event) => handleChange(scenario, key, kind, event)}
                    />
                    <span className="economics-field__help" id={`${inputId}-help`}>{kind === "dollar" ? "USD amount; stored as cents." : "Percentage; stored as a decimal rate."}</span>
                    {provenance ? <span className="economics-provenance">{provenance.note}</span> : <span className="economics-provenance">Missing input: enter a current-session assumption.</span>}
                    {error ? <span className="economics-error" id={errorId} role="alert">{error}</span> : null}
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </section>
  );
}
