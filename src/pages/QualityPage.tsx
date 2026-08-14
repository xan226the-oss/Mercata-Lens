import { useResearch } from "../research/ResearchContext";
import { StatusBanner } from "../components/StatusBanner";
import { EvidenceStatus, type EvidenceGate } from "../components/EvidenceStatus";
import { IssueTable } from "../components/IssueTable";
import { ModuleStatus } from "../components/ModuleStatus";
import { PageHeader } from "../components/PageHeader";

function sourceLabel(sourceKind: "demo" | "user_upload" | null): string {
  return sourceKind === "demo" ? "Demo data" : sourceKind === "user_upload" ? "User upload" : "No active data";
}

function evidenceGates(qualityReport: NonNullable<ReturnType<typeof useResearch>["qualityReport"]>): EvidenceGate[] {
  const productBlocking = qualityReport.blockingIssues.some((issue) => issue.file === "products");
  const reviewBlocking = qualityReport.blockingIssues.some((issue) => issue.file === "reviews");
  return [
    {
      id: "identity",
      label: "Identity and references",
      status: productBlocking || reviewBlocking ? "blocked" : "passed",
      detail: productBlocking || reviewBlocking ? "Resolve blocking record issues" : "No identity or reference blocks",
    },
    {
      id: "category-sample",
      label: "Category sample",
      status: productBlocking ? "blocked" : qualityReport.moduleAvailability.category === "available" ? "passed" : "warning",
      detail: `${qualityReport.summary.validProducts} valid products`,
    },
    {
      id: "review-sample",
      label: "Review sample",
      status: reviewBlocking ? "blocked" : qualityReport.moduleAvailability.pain_points === "available" ? "passed" : "warning",
      detail: `${qualityReport.summary.validReviews} valid review records`,
    },
  ];
}

export function QualityPage() {
  const { dataset, qualityReport, sourceKind, importState } = useResearch();
  const source = sourceLabel(sourceKind);
  const gates = qualityReport ? evidenceGates(qualityReport) : [];

  return (
    <div className="page quality-page">
      <PageHeader eyebrow="Evidence control" title="Data quality" description="Validate evidence before analysis." />

      <section className="quality-attempt" aria-labelledby="latest-import-title" data-testid="latest-import-attempt">
        <span className="section-kicker">Latest attempt</span>
        <h2 id="latest-import-title">Latest import attempt</h2>
        {!importState.ok && importState.issues.length === 0 ? (
          <p>No import attempted in this session.</p>
        ) : importState.ok ? (
          <StatusBanner tone="success" text="Latest import succeeded. This upload is now the active local research dataset." data-testid="latest-import-success">
            <p>User upload</p>
            <p>Imported at: {importState.importedAt ? new Date(importState.importedAt).toLocaleString() : "Import time unavailable"}</p>
            <p>Products reviewed: {dataset?.products.length ?? "—"}</p>
            <p>Review evidence records: {dataset?.reviews.length ?? "—"}</p>
            <p>Review evidence records are records, not sales, and this import does not establish market validity.</p>
          </StatusBanner>
        ) : (
          <div data-testid="latest-import-failure">
            <StatusBanner
              tone="error"
              text={dataset ? `Import failed · ${importState.issues.length} blocking issues · Current ${source} was not replaced.` : `Import failed · ${importState.issues.length} blocking issues · No active research data is available.`}
            >
              <p>{dataset ? "The active research remains unchanged." : "The failed import did not create an active research dataset."}</p>
            </StatusBanner>
            <IssueTable issues={importState.issues} caption="Latest import issues" />
          </div>
        )}
      </section>

      <section className="quality-active" aria-labelledby="active-quality-title" data-testid="active-data-quality">
        <span className="section-kicker">Active evidence</span>
        <h2 id="active-quality-title">Active valid dataset</h2>
        {!dataset || !qualityReport ? (
          <p>No active research data</p>
        ) : (
          <>
            <p className="quality-source">Source: {source}</p>
            <dl className="quality-summary">
              <div><dt>Valid products</dt><dd>{qualityReport.summary.validProducts}</dd></div>
              <div><dt>Valid review evidence records</dt><dd>{qualityReport.summary.validReviews}</dd></div>
              <div><dt>Duplicate products</dt><dd>{qualityReport.summary.duplicateProducts}</dd></div>
              <div><dt>Duplicate reviews</dt><dd>{qualityReport.summary.duplicateReviews}</dd></div>
            </dl>
            {qualityReport.blockingIssues.length === 0 ? (
              <StatusBanner tone="success" text="No blocking issues in the active dataset. This does not mean the data is real or market-valid." />
            ) : (
              <StatusBanner tone="error" text={`${qualityReport.blockingIssues.length} blocking issue(s) in the active dataset.`}>
                <IssueTable issues={qualityReport.blockingIssues} caption="Active dataset blocking issues" />
              </StatusBanner>
            )}
            <div className="quality-active__warnings">
              <h3>Warnings</h3>
              {qualityReport.warnings.length === 0 ? <p>No warnings.</p> : <IssueTable issues={qualityReport.warnings} caption="Active dataset warnings" />}
            </div>
            <EvidenceStatus gates={gates} />
          </>
        )}
      </section>

      {qualityReport ? <ModuleStatus availability={qualityReport.moduleAvailability} /> : <p className="module-status-unavailable">Module availability cannot be evaluated without active research data</p>}
    </div>
  );
}
