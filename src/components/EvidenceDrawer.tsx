import type { ReactElement } from "react";
import type { CategoryAnalysis, CategoryBand } from "../domain/category";

export interface EvidenceDrawerProps {
  analysis: CategoryAnalysis;
}

function ids(ids: string[]): string {
  return ids.length > 0 ? ids.join(", ") : "None";
}

function boundaries(band: CategoryBand): string {
  const lower = band.lowerBound === null ? "-∞" : `${band.lowerInclusive ? "[" : "("}${band.lowerBound}`;
  const upper = band.upperBound === null ? "+∞" : `${band.upperBound}${band.upperInclusive ? "]" : ")"}`;
  return `${lower}, ${upper}`;
}

export function EvidenceDrawer({ analysis }: EvidenceDrawerProps): ReactElement {
  return (
    <details className="evidence-drawer" data-testid="category-evidence">
      <summary>Calculation evidence</summary>
      <div className="evidence-drawer__content">
        <section>
          <h3>Included products</h3>
          <p>{ids(analysis.evidence.includedProductIds)}</p>
          <p>Excluded products: {analysis.evidence.excludedProducts.length === 0 ? "None" : analysis.evidence.excludedProducts.map((item) => `${item.productId}: ${item.reason}`).join("; ")}</p>
          <p>Product denominator: {analysis.evidence.productDenominator}</p>
          <p>Category: {analysis.evidence.category}</p>
          <p>Source: {analysis.evidence.sourceKind}</p>
        </section>
        <section>
          <h3>Price cut points</h3>
          <p>Q1: {analysis.priceQuartiles.q1 ?? "Unavailable"}</p>
          <p>Median: {analysis.priceQuartiles.median ?? "Unavailable"}</p>
          <p>Q3: {analysis.priceQuartiles.q3 ?? "Unavailable"}</p>
          <p>Exact cut points: {ids(analysis.evidence.priceCutPoints.map(String))}</p>
        </section>
        {[
          ["Price bands", analysis.priceBands],
          ["Rating bands", analysis.ratingBands],
          ["Review-count bands", analysis.reviewCountBands],
        ].map(([title, bands]) => (
          <section key={String(title)}>
            <h3>{String(title)}</h3>
            <ul>
              {(bands as CategoryBand[]).map((band) => (
                <li key={band.id}><strong>{band.id}</strong>: {boundaries(band)} — {ids(band.productIds)}</li>
              ))}
            </ul>
          </section>
        ))}
        <section>
          <h3>Brand groups</h3>
          <ul>
            {analysis.brandShares.map((row) => <li key={row.brand === null ? "missing-brand" : `brand:${row.brand}`}><strong>{row.label}</strong>: {row.count} / {row.denominator} — {ids(row.productIds)}</li>)}
          </ul>
        </section>
        <section>
          <h3>Attribute coverage</h3>
          <ul>
            {analysis.attributeCoverage.map((row) => <li key={row.attribute}><strong>{row.attribute}</strong>: present IDs {ids(row.presentProductIds)}; missing IDs {ids(row.missingProductIds)}</li>)}
          </ul>
        </section>
      </div>
    </details>
  );
}
