import { useEffect, useMemo, useState, type ReactElement } from "react";
import { calculateContribution, type EconomicResult } from "../domain/economics";
import { EconomicsEditor } from "../components/EconomicsEditor";
import { OpportunityCard } from "../components/OpportunityCard";
import { WeightEditor } from "../components/WeightEditor";
import { PageHeader } from "../components/PageHeader";
import { DataSourceBadge } from "../components/DataSourceBadge";
import { useResearch } from "../research/ResearchContext";
import { summarizePainPoints } from "../domain/painPoints";
import {
  rankOpportunities,
  scoreOpportunity,
  type RankingResult,
} from "../domain/opportunities";
import { createOpportunityHypotheses } from "../data/opportunityHypotheses";
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

function evidenceDetail(
  evidenceId: string,
  dataset: NonNullable<ReturnType<typeof useResearch>["dataset"]>,
  economics: readonly EconomicScenario[],
  hypotheses: ReturnType<typeof createOpportunityHypotheses>,
): ReactElement {
  const [kind, value] = evidenceId.split(":", 2);
  if (kind === "review") {
    const review = dataset.reviews.find((item) => item.reviewId === value);
    if (!review) return <span>Review evidence unavailable in the active dataset.</span>;
    return (
      <div className="opportunity-evidence-detail">
        <p><strong>Review ID:</strong> {review.reviewId}</p>
        <p><strong>Product ID:</strong> {review.productId}</p>
        <p><strong>Rating:</strong> {review.rating}</p>
        <p><strong>Review text:</strong> {review.reviewText}</p>
        <p><strong>Date:</strong> {review.reviewDate ?? "Not provided"}</p>
        <p><strong>Verified purchase:</strong> {review.verifiedPurchase === null ? "Not provided" : review.verifiedPurchase ? "Yes" : "No"}</p>
        <p><strong>Source:</strong> <a href={review.sourceUrl} target="_blank" rel="noreferrer">{review.sourceUrl}</a></p>
      </div>
    );
  }
  if (kind === "product") {
    const product = dataset.products.find((item) => item.productId === value);
    if (!product) return <span>Product evidence unavailable in the active dataset.</span>;
    return (
      <div className="opportunity-evidence-detail">
        <p><strong>Product ID:</strong> {product.productId}</p>
        <p><strong>Title:</strong> {product.title}</p>
        <p><strong>Brand:</strong> {product.brand ?? "Not provided"}</p>
        <p><strong>Price:</strong> ${product.priceUsd.toFixed(2)}</p>
        <p><strong>Rating:</strong> {product.rating}</p>
        <p><strong>Why referenced:</strong> This product record is explicitly linked by the current hypothesis; it is not treated as an opposition record unless that link is present.</p>
        <p><strong>Source:</strong> <a href={product.sourceUrl} target="_blank" rel="noreferrer">{product.sourceUrl}</a></p>
      </div>
    );
  }
  if (kind === "economics") {
    const scenario = economics.find((item) => item.id === value);
    if (!scenario) return <span>Economic scenario evidence unavailable.</span>;
    return (
      <div className="opportunity-evidence-detail">
        <p><strong>Scenario ID:</strong> {scenario.id}</p>
        <p><strong>Name:</strong> {scenario.label}</p>
        <ul>
          {Object.entries(scenario.inputs).map(([field, input]) => {
            const provenance = scenario.provenance[field as keyof EconomicScenario["inputs"]];
            return <li key={field}><strong>{FIELD_LABELS[field as keyof EconomicScenario["inputs"]]}:</strong> {input === null ? "Not provided" : String(input)}; provenance: {provenance ? `${provenance.sourceKind}/${provenance.evidenceKind} — ${provenance.note}` : "Not provided"}</li>;
          })}
        </ul>
      </div>
    );
  }
  if (kind === "assumption") {
    const [, opportunityId, dimension] = evidenceId.split(":");
    const hypothesis = hypotheses.find((item) => item.id === opportunityId);
    const entry = hypothesis?.dimensions.find((item) => item.dimension === dimension);
    return <span>{entry && hypothesis ? `${hypothesis.name} — ${dimension}; ${entry.reasoning}; evidence kind: ${entry.evidenceKind}.` : "Assumption evidence unavailable."}</span>;
  }
  return <span>Evidence reference is not recognized.</span>;
}
function rankingCopy(ranking: RankingResult, sourceKind: "demo" | "user_upload", weightsValid: boolean): string {
  if (!weightsValid) return "Ranking unavailable: weights must total exactly 100.";
  if (ranking.status === "winner") return `Domain ranking result: ${ranking.winnerId} has an exact lead of at least 3 points. This is not a recommendation or purchase conclusion.`;
  if (ranking.status === "no_clear_winner") return "Domain ranking result: no clear winner under the current-session weights.";
  return sourceKind === "user_upload"
    ? "Ranking incomplete: current-session user input is required for all five dimensions."
    : "Ranking incomplete: one or more evidence-linked hypothesis inputs are invalid.";
}

export function OpportunitiesPage() {
  const {
    status,
    dataset,
    sourceKind,
    corrections,
    economicScenarios,
    economicScenariosResetKey,
    replaceEconomicScenario,
    opportunityWeights,
    opportunityWeightsResetKey,
    replaceOpportunityWeights,
    resetOpportunityWeights,
  } = useResearch();
  const [invalidDraftScenarioIds, setInvalidDraftScenarioIds] = useState<Set<string>>(() => new Set());
  const [weightsValid, setWeightsValid] = useState(true);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const renderEvidence = (evidenceId: string) => evidenceDetail(evidenceId, dataset!, economicScenarios, hypotheses);

  useEffect(() => {
    setInvalidDraftScenarioIds(new Set());
    setWeightsValid(true);
    setSelectedEvidenceId(null);
  }, [economicScenariosResetKey, opportunityWeightsResetKey]);

  const results = useMemo(() => economicScenarios.map((scenario) => ({ scenario, result: calculateContribution(scenario.inputs) })), [economicScenarios]);
  const summaries = useMemo(() => dataset ? summarizePainPoints(dataset, corrections) : [], [dataset, corrections]);
  const hypotheses = useMemo(
    () => dataset && sourceKind ? createOpportunityHypotheses(dataset, summaries, economicScenarios) : [],
    [dataset, sourceKind, summaries, economicScenarios],
  );
  const ranking = useMemo(
    () => weightsValid && hypotheses.length === 3 ? rankOpportunities(hypotheses, opportunityWeights) : { status: "incomplete", winnerId: null, scores: [], issues: [] } as RankingResult,
    [hypotheses, opportunityWeights, weightsValid],
  );

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
        <PageHeader eyebrow="Evidence-linked comparison" title="Opportunity comparison" description="Opportunity hypotheses are available only while a validated research dataset is active." />
        <p>{status === "error" ? "The active research data could not be loaded. No Demo contribution is shown." : "No active research data is available yet. No Demo contribution is shown."}</p>
      </section>
    );
  }

  return (
    <div className="page opportunities-page">
      <PageHeader
        eyebrow="Evidence-linked comparison"
        title="Opportunity comparison"
        description="Compare bounded hypotheses, explicit weights, evidence links, and named economics scenarios. Review counts remain review counts; no market conclusion is generated."
        meta={<DataSourceBadge sourceKind={sourceKind} />}
      />

      <section className="opportunity-comparison" aria-labelledby="opportunity-comparison-title">
        <div className="opportunity-comparison__intro">
          <div>
            <h2 id="opportunity-comparison-title">Three bounded hypotheses</h2>
            <p>{rankingCopy(ranking, sourceKind, weightsValid)}</p>
          </div>
          <span className="opportunity-ranking-status" data-testid="opportunity-ranking-status">{ranking.status}</span>
        </div>
        <WeightEditor
          weights={opportunityWeights}
          onReplaceWeights={(weights) => {
            const accepted = replaceOpportunityWeights(weights);
            setWeightsValid(accepted);
            return accepted;
          }}
          onReset={() => {
            resetOpportunityWeights();
            setWeightsValid(true);
          }}
          resetKey={opportunityWeightsResetKey}
          onValidityChange={setWeightsValid}
        />
        <div className="opportunity-grid">
          {hypotheses.map((opportunity) => {
            const score = ranking.scores.find((item) => item.opportunityId === opportunity.id) ?? scoreOpportunity(opportunity, opportunityWeights);
            return <OpportunityCard key={opportunity.id} opportunity={opportunity} score={weightsValid ? score : { opportunityId: opportunity.id, status: "incomplete", total: null, contributions: [], issues: [] }} sourceKind={sourceKind} onEvidenceClick={setSelectedEvidenceId} />;
          })}
        </div>
        <div className="opportunity-evidence-focus" aria-live="polite" data-testid="selected-evidence">{selectedEvidenceId ? <><strong>{selectedEvidenceId}</strong> {renderEvidence(selectedEvidenceId)}</> : "Select an evidence reference to keep the source boundary visible."}</div>
      </section>

      <section className="economics-workspace" aria-labelledby="economics-workspace-title">
        <h2 id="economics-workspace-title">Named economics scenarios</h2>
        <section className="economics-results" aria-label="Estimated contribution results">
          {results.map(({ scenario, result }) => (
            <article key={scenario.id} className="economics-result" data-testid={`economics-result-${scenario.id}`}>
              <h3>{scenario.label}</h3>
              {resultCopy(scenario, result, invalidDraftScenarioIds.has(scenario.id)).slice(1).map((line) => <p key={line}>{line}</p>)}
            </article>
          ))}
        </section>
        <EconomicsEditor resetKey={economicScenariosResetKey} scenarios={economicScenarios} onReplaceScenario={replaceEconomicScenario} onDraftValidityChange={markDraftValidity} />
      </section>
    </div>
  );
}
