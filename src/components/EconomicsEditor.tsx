import type { ChangeEvent, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import type { EconomicInputKey } from "../domain/economics";
import type { DataProvenance, EconomicScenario } from "../domain/types";

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
  resetKey?: number;
  onReplaceScenario: (scenario: EconomicScenario) => boolean;
}

type Drafts = Record<string, string>;

type DraftErrors = Record<string, string | null>;

function displayValue(value: number | null, kind: "dollar" | "rate"): string {
  if (value === null) return "";
  return kind === "dollar" ? (value / 100).toFixed(2) : String(value * 100);
}

function isDecimalDraft(value: string): boolean {
  return /^-?(?:\d+\.?\d*|\.\d+)$/.test(value.trim());
}

function parseDraft(value: string, kind: "dollar" | "rate"): number | null {
  if (value.trim() === "" || !isDecimalDraft(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (kind === "rate") return parsed / 100;
  const cents = parsed * 100;
  return Number.isSafeInteger(cents) ? cents : null;
}

function draftError(value: string, kind: "dollar" | "rate"): string | null {
  if (value.trim() === "") return null;
  if (!isDecimalDraft(value)) return kind === "dollar" ? "Enter a finite dollar amount." : "Enter a finite percentage.";
  const parsed = Number(value);
  if (kind === "dollar" && !Number.isSafeInteger(parsed * 100)) return "Dollar amount is too large or precise for safe cents.";
  if (parsed < 0) return "Value cannot be negative; domain validation will mark this input invalid.";
  if (kind === "rate" && parsed > 100) return "Referral fee rate exceeds 100%; domain validation will mark this input invalid.";
  return null;
}

function userProvenance(): DataProvenance {
  return {
    sourceKind: "user_upload",
    evidenceKind: "assumption",
    sourceUrl: null,
    observedAt: null,
    note: "Current-session user-supplied assumption.",
  };
}

export function EconomicsEditor({ scenarios, resetKey = 0, onReplaceScenario }: EconomicsEditorProps): ReactElement {
  const [drafts, setDrafts] = useState<Drafts>({});
  const [draftErrors, setDraftErrors] = useState<DraftErrors>({});
  const previousScenarios = useRef<EconomicScenario[]>(scenarios);
  const previousResetKey = useRef(resetKey);

  useEffect(() => {
    if (previousResetKey.current !== resetKey) {
      setDrafts({});
      setDraftErrors({});
      previousResetKey.current = resetKey;
    }
    previousScenarios.current = scenarios;
  }, [resetKey, scenarios]);

  function handleChange(scenario: EconomicScenario, field: EconomicInputKey, kind: "dollar" | "rate", event: ChangeEvent<HTMLInputElement>) {
    const draftKey = `${scenario.id}:${field}`;
    const value = event.target.value;
    const error = draftError(value, kind);
    const parsed = parseDraft(value, kind);
    setDrafts((current) => ({ ...current, [draftKey]: value }));
    setDraftErrors((current) => ({ ...current, [draftKey]: error }));
    const isEmpty = value.trim() === "";
    if (!isEmpty && parsed === null) return;
    const nextProvenance = isEmpty ? null : userProvenance();
    onReplaceScenario({
      ...scenario,
      inputs: { ...scenario.inputs, [field]: parsed },
      provenance: { ...scenario.provenance, [field]: nextProvenance },
    });
  }

  return (
    <section className="economics-workspace" aria-labelledby="economics-title" data-replacement-key={resetKey}>
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
                const helpId = `${inputId}-help`;
                const provenanceId = `${inputId}-provenance`;
                const errorId = `${inputId}-error`;
                const draftKey = `${scenario.id}:${key}`;
                const value = drafts[draftKey] ?? displayValue(scenario.inputs[key], kind);
                const error = draftErrors[draftKey] ?? draftError(value, kind);
                const provenance = scenario.provenance[key];
                const describedBy = [helpId, provenanceId, error ? errorId : null].filter(Boolean).join(" ");
                return (
                  <div className={`economics-field${error ? " economics-field--invalid" : ""}`} key={key}>
                    <label htmlFor={inputId}>{label}</label>
                    <input
                      id={inputId}
                      name={inputId}
                      type="text"
                      inputMode="decimal"
                      value={value}
                      aria-describedby={describedBy}
                      aria-invalid={error ? "true" : "false"}
                      onChange={(event) => handleChange(scenario, key, kind, event)}
                    />
                    <span className="economics-field__help" id={helpId}>{kind === "dollar" ? "USD amount; stored as cents." : "Percentage; stored as a decimal rate."}</span>
                    {provenance ? <span className="economics-provenance" id={provenanceId}>{provenance.note}</span> : <span className="economics-provenance" id={provenanceId}>Missing input: enter a current-session assumption.</span>}
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
