import { useMemo } from "react";
import { analyzeCategory } from "../domain/category";
import { useResearch } from "../research/ResearchContext";
import { DataSourceBadge } from "../components/DataSourceBadge";
import { EvidenceDrawer } from "../components/EvidenceDrawer";
import { MetricCard } from "../components/MetricCard";
import { SampleDistribution } from "../components/SampleDistribution";
import { PageHeader } from "../components/PageHeader";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });

function price(value: number | null): string {
  return value === null ? "Unavailable" : usd.format(value);
}

export function CategoryPage() {
  const { dataset, sourceKind } = useResearch();
  const analysis = useMemo(() => (dataset ? analyzeCategory(dataset) : null), [dataset]);

  if (!dataset || !analysis || !sourceKind) {
    return <section className="page category-page"><h1>Category overview</h1><p>No active category evidence is available.</p></section>;
  }

  const representedBrands = analysis.brandShares.filter((row) => row.brand !== null).length;
  return (
    <div className="page category-page">
      <PageHeader
        eyebrow="Traceable category analysis"
        title="Category overview"
        description="Descriptive statistics for the active US cat water fountain sample."
        meta={<><span>{dataset.category} / United States market</span><DataSourceBadge sourceKind={sourceKind} /></>}
      />
      <section className={`category-status category-status--${analysis.status}`} data-testid="category-status" aria-labelledby="category-status-title">
        <span className="section-kicker">Analysis status</span>
        <h2 id="category-status-title">{analysis.status === "continue_research" ? "Continue research" : analysis.status === "insufficient_evidence" ? "Insufficient evidence" : "Pause"}</h2>
        <ul>{analysis.statusReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
      </section>
      <section className="category-metrics" aria-label="Category metrics">
        <MetricCard id="products" label="Products in sample" value={analysis.productCount} evidenceNote={`Derived from ${analysis.productCount} active products`} />
        <MetricCard id="median-price" label="Median observed price" value={price(analysis.medianPrice)} evidenceNote="Current sample only" calculationNote="Derived by the approved domain median rule" />
        <MetricCard id="price-range" label="Observed price range" value={`${price(analysis.priceRange.min)} – ${price(analysis.priceRange.max)}`} evidenceNote="Observed comparison set only" />
        <MetricCard id="brands" label="Provided brand labels" value={representedBrands} evidenceNote="Represented brands in this sample" />
      </section>
      <SampleDistribution id="price" title="Observed price distribution" description="Sample-relative price bands for descriptive comparison only; not a total-market distribution." bands={analysis.priceBands} productCount={analysis.productCount} />
      <div className="category-distribution-grid">
        <SampleDistribution id="rating" title="Rating distribution" description="Displayed product ratings in the active sample." bands={analysis.ratingBands} productCount={analysis.productCount} />
        <SampleDistribution id="reviews" title="Review-count distribution" description="Displayed review counts only; reviewCount is not sales." bands={analysis.reviewCountBands} productCount={analysis.productCount} missingCount={analysis.missingReviewCount} />
      </div>
      <section className="category-brand-share" data-testid="category-brand-share" aria-labelledby="category-brand-share-title">
        <div className="section-heading"><span className="section-kicker">Current sample</span><h2 id="category-brand-share-title">Represented brand labels in this sample</h2><p>These percentages describe only represented brand labels in the active sample and do not describe the wider market.</p></div>
        <ul>{analysis.brandShares.map((row) => <li key={row.brand === null ? "missing-brand" : `brand:${row.brand}`}><strong>{row.label}</strong><span>{row.count} / {row.denominator}</span><span>{percent.format(row.shareOfProducts)}</span></li>)}</ul>
      </section>
      <section className="category-attribute-coverage" data-testid="category-attribute-coverage" aria-labelledby="category-attribute-title">
        <div className="section-heading"><span className="section-kicker">Field coverage</span><h2 id="category-attribute-title">Attribute completeness</h2><p>Coverage is calculated against all products in the active sample.</p></div>
        <ul>{analysis.attributeCoverage.map((row) => <li key={row.attribute}><strong>{row.attribute}</strong><span>{row.presentCount} present / {row.missingCount} missing / {row.denominator} total</span><span>{row.coverage === null ? "Unavailable" : percent.format(row.coverage)}</span></li>)}</ul>
      </section>
      <EvidenceDrawer analysis={analysis} />
      <section className="category-limitations" data-testid="category-limitations" aria-labelledby="category-limitations-title"><span className="section-kicker">Boundaries</span><h2 id="category-limitations-title">Limitations</h2><ul>{analysis.limitations.map((limitation) => <li key={limitation.code}>{limitation.message}</li>)}</ul></section>
    </div>
  );
}
