import type { ChangeEvent, ReactElement } from "react";
import { useEffect, useState } from "react";
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
  onDraftValidityChange?: (scenarioId: string, hasInvalidDraft: boolean) => void;
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

function parseDollarCents(value: string): number | null {
  const trimmed = value.trim();
  if (!isDecimalDraft(trimmed)) return null;
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [integerPart = "", fractionPart = ""] = unsigned.split(".");
  if (fractionPart.length > 2) return null;
  const centsText = `${integerPart || "0"}${fractionPart.padEnd(2, "0")}`;
  const cents = BigInt(centsText || "0");
  const signedCents = negative ? -cents : cents;
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  const min = -max;
  if (signedCents < min || signedCents > max) return null;
  return Number(signedCents);
}

function isNonZeroDecimal(value: string): boolean {
  return /[1-9]/.test(value.replace(/^-/, "").replace(".", ""));
}

function parseRate(value: string): number | null {
  if (!isDecimalDraft(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rate = parsed / 100;
  if (rate === 0 && isNonZeroDecimal(value)) return null;
  return rate;
}

function parseDraft(value: string, kind: "dollar" | "rate"): number | null {
  if (kind === "rate") return parseRate(value);
  return parseDollarCents(value);
}

function draftError(value: string, kind: "dollar" | "rate"): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (!isDecimalDraft(trimmed)) return kind === "dollar" ? "Enter a finite dollar amount." : "Enter a finite percentage.";
  if (kind === "dollar" && trimmed.replace(/^-/, "").split(".")[1]?.length > 2) return "Use at most two decimal places for dollar amounts.";
  if (kind === "dollar" && parseDollarCents(trimmed) === null) return "Dollar amount is too large for safe cents.";
  if (kind === "rate" && parseRate(trimmed) === null) {
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) return "Enter a finite percentage.";
    if (numeric !== 0 && isNonZeroDecimal(trimmed)) return "Percentage is too small to represent safely.";
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return kind === "rate" ? "Enter a finite percentage." : "Enter a finite dollar amount.";
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

export function EconomicsEditor({ scenarios, resetKey = 0, onReplaceScenario, onDraftValidityChange }: EconomicsEditorProps): ReactElement {
  const [drafts, setDrafts] = useState<Drafts>({});
  const [draftErrors, setDraftErrors] = useState<DraftErrors>({});
  const [invalidDraftKeys, setInvalidDraftKeys] = useState<Record<string, boolean>>({});
  const [previousResetKey, setPreviousResetKey] = useState(resetKey);

  useEffect(() => {
    if (previousResetKey !== resetKey) {
      setDrafts({});
      setDraftErrors({});
      setInvalidDraftKeys({});
      setPreviousResetKey(resetKey);
      scenarios.forEach((scenario) => onDraftValidityChange?.(scenario.id, false));
    }
  }, [onDraftValidityChange, previousResetKey, resetKey, scenarios]);

  function handleChange(scenario: EconomicScenario, field: EconomicInputKey, kind: "dollar" | "rate", event: ChangeEvent<HTMLInputElement>) {
    const draftKey = `${scenario.id}:${field}`;
    const value = event.target.value;
    const error = draftError(value, kind);
    const parsed = parseDraft(value, kind);
    const isEmpty = value.trim() === "";
    const hasInvalidDraft = !isEmpty && (parsed === null || error !== null && kind === "dollar" && error.includes("two decimal"));
    setDrafts((current) => ({ ...current, [draftKey]: value }));
    setDraftErrors((current) => ({ ...current, [draftKey]: error }));
    const nextInvalidDraftKeys = { ...invalidDraftKeys, [draftKey]: hasInvalidDraft };
    setInvalidDraftKeys(nextInvalidDraftKeys);
    const scenarioHasInvalidDraft = Object.entries(nextInvalidDraftKeys).some(([key, invalid]) => key.startsWith(`${scenario.id}:`) && invalid);
    onDraftValidityChange?.(scenario.id, scenarioHasInvalidDraft);
    if (hasInvalidDraft) return;
    onReplaceScenario({
      ...scenario,
      inputs: { ...scenario.inputs, [field]: parsed },
      provenance: { ...scenario.provenance, [field]: isEmpty ? null : userProvenance() },
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
                    <input id={inputId} name={inputId} type="text" inputMode="decimal" value={value} aria-describedby={describedBy} aria-invalid={error ? "true" : "false"} onChange={(event) => handleChange(scenario, key, kind, event)} />
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
