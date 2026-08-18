import type { ReactElement } from "react";
import type { CategoryBand } from "../domain/category";

export interface SampleDistributionProps {
  id: string;
  title: string;
  description: string;
  bands: CategoryBand[];
  productCount: number;
  compact?: boolean;
  missingCount?: number;
}

const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });

export function SampleDistribution({ id, title, description, bands, productCount, compact = false, missingCount }: SampleDistributionProps): ReactElement {
  return (
    <section className={`sample-distribution${compact ? " sample-distribution--compact" : ""}`} data-testid={`distribution-${id}`} aria-labelledby={`distribution-${id}-title`}>
      <div className="section-heading">
        <span className="section-kicker">{compact ? "Sample distribution" : "Distribution"}</span>
        <h2 id={`distribution-${id}-title`}>{title}</h2>
        <p>{description}</p>
      </div>
      <p className="sample-distribution__scale">
        {productCount > 0 ? `Scale: 0 to ${productCount} products in this sample` : "Scale unavailable — no products in this sample"}
      </p>
      {missingCount !== undefined ? <p className="sample-distribution__missing">{missingCount} missing</p> : null}
      <ul className="sample-distribution__list">
        {bands.map((band) => (
          <li className="sample-distribution__row" data-testid={`distribution-${band.id}`} key={band.id}>
            <div className="sample-distribution__row-header">
              <strong>{band.label}</strong>
              <span>{band.count} / {productCount} products</span>
            </div>
            <progress aria-label={`${band.label}: ${band.count} of ${productCount} products`} max={productCount || 1} value={band.count} />
            <div className="sample-distribution__row-footer">
              <span>{band.shareOfProducts === null ? "Unavailable" : percent.format(band.shareOfProducts)}</span>
              <span>{band.productIds.length} product IDs</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
