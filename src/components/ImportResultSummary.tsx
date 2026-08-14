import { Link } from "react-router-dom";
import { StatusBanner } from "./StatusBanner";
import type { ImportOutcomeState } from "../research/ResearchContext";

interface ImportResultSummaryProps {
  state: ImportOutcomeState;
  sourceLabel: string;
  productCount: number | null;
  reviewCount: number | null;
}

export function ImportResultSummary({ state, sourceLabel, productCount, reviewCount }: ImportResultSummaryProps) {
  if (!state.ok && !state.error) return null;
  if (!state.ok) {
    return (
      <div className="import-result-summary">
        <StatusBanner tone="error" text={`Import failed · ${state.issues.length} blocking issues · Current ${sourceLabel} was not replaced. Current research remains unchanged.`} data-testid="import-error">
          <Link to="/quality">Review data quality</Link>
        </StatusBanner>
      </div>
    );
  }
  return (
    <div className="import-result-summary">
      <StatusBanner tone="success" text="Import succeeded. This upload is now the active local research dataset.">
        <ul>
          <li>Source: User upload</li>
          <li>Products: {productCount ?? "—"}</li>
          <li>Review evidence records: {reviewCount ?? "—"} — not sales</li>
          <li>Imported at: {state.importedAt ? new Date(state.importedAt).toLocaleString() : "—"}</li>
        </ul>
      </StatusBanner>
    </div>
  );
}
