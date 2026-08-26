import { useMemo } from "react";
import { Link } from "react-router-dom";
import { analyzeCategory } from "../domain/category";
import { useResearch } from "../research/ResearchContext";
import type { EvidenceGate } from "../components/EvidenceStatus";
import { EvidenceStatus } from "../components/EvidenceStatus";
import { ImportPanel } from "../components/ImportPanel";
import { ImportResultSummary } from "../components/ImportResultSummary";
import { MetricStrip, type MetricItem } from "../components/MetricStrip";
import { PageHeader } from "../components/PageHeader";
import { SampleDistribution } from "../components/SampleDistribution";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function formatObservedRange(observedAt: string[]): string {
  const dates = [...new Set(observedAt.map((value) => value.trim()).filter(Boolean))].sort();
  if (dates.length === 0) return "Observation dates unavailable";
  return dates.length === 1 ? `Observed ${dates[0]}` : `Observed ${dates[0]} to ${dates[dates.length - 1]}`;
}

export function HomePage() {
  const { status, dataset, sourceKind, qualityReport, importState, error, loadDemo, importCsv } = useResearch();
  const categoryAnalysis = useMemo(() => (dataset ? analyzeCategory(dataset) : null), [dataset]);
  const sourceLabel = sourceKind === "demo" ? "Demo data" : sourceKind === "user_upload" ? "User upload" : status === "loading" ? "Loading data" : "No active data";
  const metrics: MetricItem[] = dataset && categoryAnalysis
    ? [
        { id: "products", label: "Products in sample", value: categoryAnalysis.productCount, note: "Active comparison set" },
        { id: "reviews", label: "Review evidence", value: dataset.reviews.length, note: "Evidence records — not sales" },
        { id: "price-range", label: "Observed price range", value: categoryAnalysis.priceRange.min === null ? "Unavailable" : `${usd.format(categoryAnalysis.priceRange.min)} – ${usd.format(categoryAnalysis.priceRange.max!)}`, note: "Current sample only" },
        { id: "brands", label: "Provided brand labels", value: categoryAnalysis.brandShares.filter((row) => row.brand !== null).length, note: "Represented in this sample" },
      ]
    : [];

  const productBlocking = qualityReport?.blockingIssues.some((issue) => issue.file === "products") ?? false;
  const reviewBlocking = qualityReport?.blockingIssues.some((issue) => issue.file === "reviews") ?? false;
  const gates: EvidenceGate[] = qualityReport
    ? [
        { id: "identity", label: "Identity and references", status: productBlocking || reviewBlocking ? "blocked" : "passed", detail: productBlocking || reviewBlocking ? "Resolve blocking record issues" : "No identity or reference blocks" },
        { id: "category-sample", label: "Category sample", status: productBlocking ? "blocked" : qualityReport.moduleAvailability.category === "available" ? "passed" : "warning", detail: `${qualityReport.summary.validProducts} valid products` },
        { id: "review-sample", label: "Review sample", status: reviewBlocking ? "blocked" : qualityReport.moduleAvailability.pain_points === "available" ? "passed" : "warning", detail: `${qualityReport.summary.validReviews} valid review records` },
      ]
    : [];

  return (
    <div className="page home-page">
      <PageHeader
        eyebrow="Market research brief"
        title="Cat Water Fountain research"
        description="Review the active evidence before deciding whether this category deserves deeper investment."
        meta={<><span>United States market / {dataset?.category ?? "Cat Water Fountain"}</span>{dataset ? <span data-testid="home-observation-range">{formatObservedRange(dataset.products.map((product) => product.observedAt))}</span> : null}</>}
      />

      {status === "idle" ? <p aria-live="polite">Waiting to load the demo research data…</p> : null}
      {status === "loading" ? <p aria-live="polite">Loading demo research data…</p> : null}
      {status === "error" ? <div className="home-error" data-testid="home-error"><p>Demo data could not be loaded.</p>{error ? <p>{error}</p> : null}<button type="button" onClick={loadDemo}>Retry loading demo data</button></div> : null}

      {dataset ? <MetricStrip items={metrics} /> : null}

      {dataset && qualityReport && categoryAnalysis ? (
        <>
          <div className="home-analysis-grid">
            <EvidenceStatus gates={gates} />
            <section className="analysis-next-step" data-testid="category-analysis-next-step">
              <span className="section-kicker">Next analysis</span>
              <h2>Price landscape and brand structure</h2>
              {qualityReport.moduleAvailability.category === "available" ? (
                <div data-testid="home-price-distribution"><SampleDistribution id="home-price" title="Observed price distribution" description="Active comparison set only; not a total-market distribution." bands={categoryAnalysis.priceBands} productCount={categoryAnalysis.productCount} compact /><Link to="/category">Open Category overview</Link></div>
              ) : <p>Category overview is locked until the active evidence meets its requirements. Do not infer price or brand structure from this page.</p>}
            </section>
          </div>
          <section className="decision-cautions" aria-labelledby="decision-cautions-title">
            <span className="section-kicker">Decision cautions</span>
            <h2 id="decision-cautions-title">Keep the evidence boundary visible</h2>
            <ul><li>Review count is not sales.</li><li>{sourceKind === "demo" ? "Demo data is not live market data." : "User-uploaded data is not a market forecast."}</li><li>Economics is incomplete until required cost inputs exist.</li></ul>
            <p className="home-interaction-hint">Start with the data quality step, then open each available module from the left navigation.</p>
          </section>
        </>
      ) : null}

      <ImportPanel importCsv={importCsv} />
      <ImportResultSummary state={importState} sourceLabel={sourceLabel} productCount={dataset?.products.length ?? null} reviewCount={dataset?.reviews.length ?? null} />
    </div>
  );
}
