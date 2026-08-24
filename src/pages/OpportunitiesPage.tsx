import { useEffect, useMemo, useState } from "react";
import { calculateContribution, type EconomicResult } from "../domain/economics";
import { EconomicsEditor } from "../components/EconomicsEditor";
import { PageHeader } from "../components/PageHeader";
import { DataSourceBadge } from "../components/DataSourceBadge";
import { useResearch } from "../research/ResearchContext";
import type { EconomicScenario } from "../domain/types";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const FIELD_LABELS: Record<keyof EconomicScenario["inputs"], string> = {
  salePriceCents: "Sale price",
  sourcingCostCents: "Sourcing cost",
  inboundFreightCents: "Inbound freight",
  referralFeeRate: "Referral fee rate",
  fulfillmentCostCents: "Fulfillment cost",
  advertisingCostCents: "Advertising cost",
  returnLossCents: "Return-loss allowance",
  otherCostCents: "Other cost",
};

const FORMULA = "Sale price - sourcing cost - inbound freight - referral fee - fulfillment cost - advertising cost - return-loss allowance - other cost";

function costText(cents: number): string {
  return usd.format(cents / 100);
}

function referralFeeText(inputs: EconomicScenario["inputs"]): string {
  if (inputs.salePriceCents === null || inputs.referralFeeRate === null) return "Rounded referral fee unavailable until sale price and referral fee rate are both provided.";
  return `Rounded referral fee: ${costText(Math.round(inputs.salePriceCents * inputs.referralFeeRate))}.`;
}

function resultCopy(scenario: EconomicScenario, result: EconomicResult, hasInvalidDraft: boolean): string[] {
  const lines = [`${scenario.label}`, `Contribution formula: ${FORMULA}.`];
  if (hasInvalidDraft) {
    lines.push("Calculation unavailable until the invalid draft is corrected.");
  } else if (result.status === "complete") {
    lines.push(`Total costs: ${costText(result.totalCostCents)}.`, referralFeeText(scenario.inputs), `Estimated per-unit contribution: ${costText(result.contributionCents)}.`);
  } else if (result.status === "incomplete") {
    lines.push(`Known costs so far: ${costText(result.partialKnownCostsCents)}.`, `Missing fields: ${result.missingFields.map((field) => FIELD_LABELS[field]).join(", ")}.`, referralFeeText(scenario.inputs));
  } else {
    lines.push(`Invalid input: ${result.issues.map((issue) => `${FIELD_LABELS[issue.field]} — ${issue.message}`).join(" ")}.`);
  }
  return lines;
}

export function OpportunitiesPage() {
  const { status, dataset, sourceKind, economicScenarios, economicScenariosResetKey, replaceEconomicScenario } = useResearch();
  const [invalidDraftScenarioIds, setInvalidDraftScenarioIds] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    setInvalidDraftScenarioIds(new Set());
  }, [economicScenariosResetKey]);
  const results = useMemo(() => economicScenarios.map((scenario) => ({ scenario, result: calculateContribution(scenario.inputs) })), [economicScenarios]);

  const markDraftValidity = (scenarioId: string, hasInvalidDraft: boolean) => {
    setInvalidDraftScenarioIds((current) => {
      const next = new Set(current);
      if (hasInvalidDraft) next.add(scenarioId);
      else next.delete(scenarioId);
      return next;
    });
  };

  if (!dataset || !sourceKind || status !== "ready") {
    return (
      <section className="page opportunities-page" data-testid="economics-no-data">
        <PageHeader
          eyebrow="Transparent scenario worksheet"
          title="Opportunity comparison"
          description="Unit economics is available only while a validated research dataset is active."
        />
        <p>{status === "error" ? "The active research data could not be loaded. No Demo contribution is shown." : "No active research data is available yet. No Demo contribution is shown."}</p>
      </section>
    );
  }

  return (
    <div className="page opportunities-page">
      <PageHeader
        eyebrow="Transparent scenario worksheet"
        title="Opportunity comparison"
        description="Compare explicit current-session economics scenarios before later opportunity ranking is added. No ranking is calculated here."
        meta={<DataSourceBadge sourceKind={sourceKind} />}
      />
      <section className="economics-results" aria-label="Estimated contribution results">
        {results.map(({ scenario, result }) => (
          <article key={scenario.id} className="economics-result" data-testid={`economics-result-${scenario.id}`}>
            <h2>{scenario.label}</h2>
            {resultCopy(scenario, result, invalidDraftScenarioIds.has(scenario.id)).slice(1).map((line) => <p key={line}>{line}</p>)}
          </article>
        ))}
      </section>
      <EconomicsEditor resetKey={economicScenariosResetKey} scenarios={economicScenarios} onReplaceScenario={replaceEconomicScenario} onDraftValidityChange={markDraftValidity} />
    </div>
  );
}
