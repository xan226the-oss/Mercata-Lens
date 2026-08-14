/**
 * Data quality gate page: exact counts, blocking errors vs warnings, and
 * per-module availability. Text + icon, never color alone.
 */
import { useResearch } from "../research/ResearchContext";
import { StatusBanner } from "../components/StatusBanner";
import type { AnalysisModule, ModuleAvailability } from "../domain/types";

const MODULE_LABEL: Record<AnalysisModule, string> = {
  category: "Category overview",
  pain_points: "Customer pain points",
  economics: "Economics",
  opportunities: "Opportunity comparison",
};

function availabilityText(status: ModuleAvailability): string {
  if (status === "available") return "Available";
  if (status === "incomplete") return "Incomplete";
  return "Locked";
}

export function QualityPage() {
  const { dataset, qualityReport, sourceKind, importState } = useResearch();

  if (!dataset || !qualityReport) {
    return (
      <section className="page">
        <h1>Data quality</h1>
        {importState.error && importState.issues.length > 0 ? (
          <StatusBanner tone="error" text={`Latest import attempt failed (${importState.issues.length} issue(s)).`} data-testid="latest-import-failure">
            <p>No active research data is available.</p>
            <ul>{importState.issues.map((issue, i) => <li key={i}>[{issue.file ?? "?"} row {issue.row}] {issue.field}: {issue.message} (value: {JSON.stringify(issue.value)})</li>)}</ul>
          </StatusBanner>
        ) : null}
        {!importState.error ? <p>No research data loaded yet.</p> : null}
      </section>
    );
  }

  const { blockingIssues, warnings, moduleAvailability, summary } = qualityReport;

  return (
    <section className="page">
      <h1>Data quality</h1>

      {importState.error && importState.issues.length > 0 ? (
        <StatusBanner tone="error" text={`Latest import attempt failed (${importState.issues.length} issue(s)).`} data-testid="latest-import-failure">
          <p>The active {sourceKind === "demo" ? "Demo data" : "User upload"} research was not replaced.</p>
          <ul>
            {importState.issues.map((issue, i) => (
              <li key={i}>
                [{issue.file ?? "?"} row {issue.row}] {issue.field}: {issue.message} (value: {JSON.stringify(issue.value)})
              </li>
            ))}
          </ul>
        </StatusBanner>
      ) : null}

      <div className="quality-summary">
        <dl className="home-facts">
          <div>
            <dt>Valid products</dt>
            <dd>{summary.validProducts}</dd>
          </div>
          <div>
            <dt>Valid reviews</dt>
            <dd>{summary.validReviews}</dd>
          </div>
          <div>
            <dt>Duplicate products</dt>
            <dd>{summary.duplicateProducts}</dd>
          </div>
          <div>
            <dt>Duplicate reviews</dt>
            <dd>{summary.duplicateReviews}</dd>
          </div>
        </dl>
        <p className="quality-source">Source: {sourceKind}</p>
      </div>

      <div className="quality-modules">
        <h2>Module availability</h2>
        <ul className="quality-module-list">
          {(Object.keys(moduleAvailability) as AnalysisModule[]).map((mod) => {
            const state = moduleAvailability[mod];
            const icon =
              state === "available" ? "✅" : state === "incomplete" ? "🟡" : "🔒";
            return (
              <li key={mod} data-testid={`module-${mod}`}>
                <span className="quality-module-icon" aria-hidden="true">
                  {icon}
                </span>
                <span className="quality-module-name">{MODULE_LABEL[mod]}</span>
                <span className={`quality-module-state quality-module-state--${state}`}>
                  {availabilityText(state)}
                </span>
                {state === "locked" ? (
                  <span className="quality-module-reason">Locked until data requirements are met</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="quality-issues">
        <h2>Blocking errors</h2>
        {blockingIssues.length === 0 ? (
          <StatusBanner
            tone="success"
            text="No blocking issues found. This does not mean the data is real or market-valid."
          />
        ) : (
          <StatusBanner tone="error" text={`${blockingIssues.length} blocking issue(s).`}>
            <ul>
              {blockingIssues.map((issue, i) => (
                <li key={i} data-testid="blocking-issue">
                  [{issue.file ?? "?"} row {issue.row}] {issue.field}: {issue.message}
                  {issue.value !== undefined && issue.value !== null ? (
                    <> (value: {JSON.stringify(issue.value)})</>
                  ) : null}
                </li>
              ))}
            </ul>
          </StatusBanner>
        )}
      </div>

      <div className="quality-issues">
        <h2>Warnings</h2>
        {warnings.length === 0 ? (
          <StatusBanner tone="info" text="No warnings." />
        ) : (
          <StatusBanner tone="warning" text={`${warnings.length} warning(s).`}>
            <ul>
              {warnings.map((warning, i) => (
                <li key={i} data-testid="quality-warning">
                  [{warning.file ?? "?"} row {warning.row}] {warning.field}: {warning.message}
                  {warning.value !== undefined && warning.value !== null ? (
                    <> (value: {JSON.stringify(warning.value)})</>
                  ) : null}
                </li>
              ))}
            </ul>
          </StatusBanner>
        )}
      </div>
    </section>
  );
}