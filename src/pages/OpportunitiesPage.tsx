import { useMemo } from "react";
import { calculateContribution } from "../domain/economics";
import { EconomicsEditor } from "../components/EconomicsEditor";
import { PageHeader } from "../components/PageHeader";
import { useResearch } from "../research/ResearchContext";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function resultCopy(scenario: ReturnType<typeof calculateContribution>): string {
  if (scenario.status === "complete") return `Estimated per-unit contribution: ${usd.format(scenario.contributionCents / 100)}.`;
  if (scenario.status === "incomplete") return `Estimated per-unit contribution unavailable. Missing input: ${scenario.missingFields.join(", ")}.`;
  return `Estimated per-unit contribution unavailable. ${scenario.issues.map((issue) => issue.message).join(" ")}`;
}

export function OpportunitiesPage() {
  const { economicScenarios, replaceEconomicScenario } = useResearch();
  const results = useMemo(() => economicScenarios.map((scenario) => ({ id: scenario.id, result: calculateContribution(scenario.inputs) })), [economicScenarios]);
  return (
    <div className="page opportunities-page">
      <PageHeader
        eyebrow="Transparent scenario worksheet"
        title="Opportunity comparison"
        description="Compare explicit current-session economics scenarios before later opportunity ranking is added. No ranking is calculated here."
      />
      <section className="economics-results" aria-label="Estimated contribution results">
        {results.map(({ id, result }) => <p key={id} data-testid={`economics-result-${id}`}>{resultCopy(result)}</p>)}
      </section>
      <EconomicsEditor scenarios={economicScenarios} onReplaceScenario={replaceEconomicScenario} />
    </div>
  );
}
