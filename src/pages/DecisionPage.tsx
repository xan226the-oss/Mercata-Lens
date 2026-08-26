import { useMemo, useState, type ReactElement } from "react";
import { PageHeader } from "../components/PageHeader";
import { DataSourceBadge } from "../components/DataSourceBadge";
import { DecisionStatus } from "../components/DecisionStatus";
import { ValidationPlan } from "../components/ValidationPlan";
import { buildDecisionReport, type DecisionConditions } from "../domain/decision";
import { summarizePainPoints } from "../domain/painPoints";
import { PAIN_POINT_RULESET_VERSION } from "../domain/painPointRules";
import { calculateContribution } from "../domain/economics";
import { rankOpportunities, type OpportunityId } from "../domain/opportunities";
import { createOpportunityHypotheses } from "../data/opportunityHypotheses";
import { useResearch } from "../research/ResearchContext";
import { downloadResearchExport } from "../data/researchExport";
import type { EconomicScenario } from "../domain/types";

const CONDITION_FIELDS: ReadonlyArray<{ key: keyof DecisionConditions; label: string; help: string }> = [
  { key: "continueConditions", label: "Continue conditions", help: "One user-authored condition per line." },
  { key: "pauseConditions", label: "Pause conditions", help: "One user-authored condition per line." },
  { key: "stopConditions", label: "Stop conditions", help: "Only an exact selected stop condition can trigger Pause." },
];

const DIMENSION_LABELS: Record<string, string> = { demand: "demand", supply_gap: "supply gap", economics: "economics", differentiation: "differentiation", risk: "risk" };

function lines(value: readonly string[]): string { return value.join("\n"); }
function parseLines(value: string): string[] { return value.split("\n"); }

function evidenceDetail(evidenceId: string, dataset: NonNullable<ReturnType<typeof useResearch>["dataset"]>, scenarios: readonly EconomicScenario[], hypotheses: ReturnType<typeof createOpportunityHypotheses>): ReactElement {
  const [kind, value] = evidenceId.split(":", 2);
  if (kind === "review") {
    const review = dataset.reviews.find((item) => item.reviewId === value);
    return review ? <div><strong>Review {review.reviewId}</strong><p>{review.reviewText}</p><small>Product {review.productId}; rating {review.rating}; source: <a href={review.sourceUrl} target="_blank" rel="noreferrer">{review.sourceUrl}</a></small></div> : <span>Review evidence is unavailable in the active dataset.</span>;
  }
  if (kind === "economics") {
    const scenario = scenarios.find((item) => item.id === value);
    return scenario ? <div><strong>{scenario.label}</strong><p>Named current-session scenario inputs; values remain assumptions.</p><small>{Object.entries(scenario.inputs).map(([key, input]) => `${key}: ${input ?? "missing"}`).join("; ")}</small></div> : <span>Economic scenario evidence is unavailable.</span>;
  }
  if (kind === "assumption") {
    const [, opportunityId, dimension] = evidenceId.split(":");
    const hypothesis = hypotheses.find((item) => item.id === opportunityId);
    const entry = hypothesis?.dimensions.find((item) => item.dimension === dimension);
    return entry && hypothesis ? <div><strong>{hypothesis.name}</strong><p>{entry.reasoning}</p><small>Dimension: {DIMENSION_LABELS[dimension] ?? dimension}; kind: {entry.evidenceKind}.</small></div> : <span>Assumption evidence is unavailable.</span>;
  }
  return <span>Evidence reference is not recognized.</span>;
}

export function DecisionPage(): ReactElement {
  const { status, dataset, sourceKind, qualityReport, corrections, economicScenarios, opportunityWeights, decisionConditions, replaceDecisionConditions } = useResearch();
  const [triggeredStopConditions, setTriggeredStopConditions] = useState<string[]>([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [savedConditions, setSavedConditions] = useState<DecisionConditions>(decisionConditions);

  const summaries = useMemo(() => dataset ? summarizePainPoints(dataset, corrections) : [], [dataset, corrections]);
  const hypotheses = useMemo(() => dataset && sourceKind ? createOpportunityHypotheses(dataset, summaries, economicScenarios) : [], [dataset, sourceKind, summaries, economicScenarios]);
  const ranking = useMemo(() => hypotheses.length === 3 ? rankOpportunities(hypotheses, opportunityWeights) : { status: "incomplete", winnerId: null, scores: [], issues: [] } as const, [hypotheses, opportunityWeights]);
  const economics = useMemo(() => Object.fromEntries(hypotheses.map((hypothesis) => [hypothesis.id, hypothesis.economics.map((scenario) => calculateContribution(scenario.inputs))])) as Record<OpportunityId, ReturnType<typeof calculateContribution>[]>, [hypotheses]);
  const supportEvidenceIds = useMemo(() => [...new Set(hypotheses.flatMap((item) => item.supportEvidenceIds))], [hypotheses]);
  const oppositionEvidenceIds = useMemo(() => [...new Set(hypotheses.flatMap((item) => item.oppositionEvidenceIds))], [hypotheses]);
  const assumptions = useMemo(() => hypotheses.flatMap((item) => item.dimensions.filter((dimension) => dimension.evidenceKind === "assumption").map((dimension) => `${item.name}: ${dimension.reasoning}`)), [hypotheses]);

  const report = useMemo(() => {
    if (!qualityReport) return null;
    return buildDecisionReport({
      quality: qualityReport,
      painPointsAvailable: qualityReport.moduleAvailability.pain_points === "available",
      ranking,
      economics,
      supportEvidenceIds,
      oppositionEvidenceIds,
      assumptions,
      missingData: [],
      userConditions: savedConditions,
      triggeredStopConditions,
    });
  }, [assumptions, economics, oppositionEvidenceIds, qualityReport, ranking, savedConditions, supportEvidenceIds, triggeredStopConditions]);

  if (!dataset || !sourceKind || status !== "ready" || !qualityReport || !report) {
    return <section className="page decision-page" data-testid="decision-no-data"><PageHeader eyebrow="Decision and validation" title="Decision & validation plan" description="The report requires an active validated dataset and upstream evidence modules." /><p>No active research data is available. Complete the evidence-gated steps before opening the report.</p></section>;
  }

  const updateConditions = (key: keyof DecisionConditions, value: string) => {
    const next = { ...savedConditions, [key]: parseLines(value) };
    setSavedConditions(next);
    replaceDecisionConditions(next);
    if (key === "stopConditions") setTriggeredStopConditions((current) => current.filter((condition) => next.stopConditions.includes(condition)));
  };

  return (
    <section className="decision-page">
      <PageHeader eyebrow="Decision and validation" title="Decision & validation plan" description="Compose upstream evidence into a bounded status and validation plan. This page does not infer triggers from weighted comparisons or review text." meta={<div className="decision-page__meta"><span>{dataset.category}</span><DataSourceBadge sourceKind={sourceKind} /><span>Ruleset {PAIN_POINT_RULESET_VERSION}</span></div>} />
      <DecisionStatus report={report} />
      <section className="decision-conditions" aria-labelledby="decision-conditions-title">
        <div><span className="section-kicker">User-authored inputs</span><h2 id="decision-conditions-title">Decision conditions</h2><p>These conditions stay in current-session memory. A stop condition triggers Pause only after an explicit exact selection.</p></div>
        <div className="decision-conditions__fields">
          {CONDITION_FIELDS.map(({ key, label, help }) => {
            const id = `decision-${key}`;
            return <div className="decision-condition-field" key={key}><label htmlFor={id}>{label}</label><textarea id={id} value={lines(savedConditions[key])} aria-describedby={`${id}-help`} onChange={(event) => updateConditions(key, event.target.value)} /><small id={`${id}-help`}>{help}</small></div>;
          })}
        </div>
        <fieldset className="decision-trigger-fieldset"><legend>Explicitly triggered stop conditions</legend>{savedConditions.stopConditions.filter((condition) => condition.trim()).length === 0 ? <p>No stop conditions entered.</p> : savedConditions.stopConditions.filter((condition) => condition.trim()).map((condition) => <label key={condition}><input type="checkbox" checked={triggeredStopConditions.includes(condition)} onChange={(event) => setTriggeredStopConditions((current) => event.target.checked ? [...current, condition] : current.filter((item) => item !== condition))} />{condition}</label>)}</fieldset>
      </section>
      <ValidationPlan report={report} onEvidenceClick={setSelectedEvidenceId} />
      <section className="decision-evidence-focus" aria-live="polite" data-testid="decision-selected-evidence">{selectedEvidenceId ? <><strong>{selectedEvidenceId}</strong>{evidenceDetail(selectedEvidenceId, dataset, economicScenarios, hypotheses)}</> : "Select an evidence reference to inspect its source or calculation explanation."}</section>
      <section className="decision-export" aria-labelledby="decision-export-title"><div><span className="section-kicker">One-way local snapshot</span><h2 id="decision-export-title">Export research JSON</h2><p>Downloads a versioned snapshot. It does not import, persist, recover, or automatically save research.</p></div><button type="button" onClick={() => downloadResearchExport({ dataset, corrections, economicScenarios, weights: opportunityWeights, conditions: savedConditions, report, rulesetVersion: PAIN_POINT_RULESET_VERSION })}>Download JSON</button></section>
    </section>
  );
}
