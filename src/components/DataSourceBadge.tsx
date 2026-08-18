import type { ReactElement } from "react";
import type { SourceKind } from "../domain/types";

export interface DataSourceBadgeProps {
  sourceKind: SourceKind;
}

const SOURCE_COPY = {
  demo: {
    label: "Synthetic demo",
    note: "Synthetic demonstration evidence; not a live market dataset.",
  },
  user_upload: {
    label: "User upload",
    note: "User-provided evidence retains its own sourcing limitations.",
  },
} satisfies Record<SourceKind, { label: string; note: string }>;

export function DataSourceBadge({ sourceKind }: DataSourceBadgeProps): ReactElement {
  const copy = SOURCE_COPY[sourceKind];
  return (
    <div className="analysis-source" data-testid="analysis-source-badge">
      <span className="analysis-source__label">{copy.label}</span>
      <span className="analysis-source__note">{copy.note}</span>
    </div>
  );
}
