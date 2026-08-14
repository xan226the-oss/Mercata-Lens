import type { ReactElement } from "react";

export interface MetricItem {
  id: "products" | "reviews" | "source" | "updated";
  label: string;
  value: string | number;
  note: string;
}

export function MetricStrip({ items }: { items: MetricItem[] }): ReactElement {
  return (
    <section className="metric-strip" aria-label="Research metrics">
      {items.map((item) => (
        <div className="metric-item" data-testid={`metric-${item.id}`} key={item.id}>
          <span className="metric-item__label">{item.label}</span>
          <strong className="metric-item__value">{item.value}</strong>
          <small className="metric-item__note">{item.note}</small>
        </div>
      ))}
    </section>
  );
}
