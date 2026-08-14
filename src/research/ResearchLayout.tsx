import { NavLink, useLocation } from "react-router-dom";
import { RESEARCH_STEPS } from "../app/routes";
import { useResearch } from "./ResearchContext";
import type { ModuleAvailability } from "../domain/types";

/**
 * Persistent shell around the six-step research flow.
 * Displays product identity, the exact scope boundary and data warning,
 * dynamic source badge (Demo data / User upload), and dependency-based
 * navigation locking. Locked steps are not clickable and show text + reason.
 */
export function ResearchLayout({ children }: { children: React.ReactNode }) {
  const { sourceKind, qualityReport } = useResearch();
  const location = useLocation();
  const availability = qualityReport?.moduleAvailability ?? null;

  const isDemo = sourceKind === "demo";

  /** Map each research path to the module that gates it. */
  function lockReasonFor(path: string): string | null {
    if (path === "/" || path === "/quality") return null;
    const state = moduleStateFor(path);
    if (state === null) return "No research data loaded yet.";
    if (state === "locked") {
      return "This module is locked because the current data does not meet its evidence requirements.";
    }
    return null;
  }

  function moduleStateFor(path: string): ModuleAvailability | null {
    if (!availability) return null;
    switch (path) {
      case "/category":
        return availability.category;
      case "/pain-points":
        return availability.pain_points;
      case "/opportunities":
        return availability.opportunities;
      case "/decision":
        return availability.opportunities;
      default:
        return null;
    }
  }

  return (
    <div className="research-layout">
      <header className="layout-header">
        <div className="brand">
          <span className="brand-en">Mercata Lens</span>
          <span className="brand-zh">商机镜</span>
          <span className={`badge ${isDemo ? "badge-demo" : "badge-upload"}`} data-testid="source-badge">
            {isDemo ? "Demo data" : "User upload"}
          </span>
        </div>
        <p className="scope-line">Demo scope: US cat water fountains</p>
        <p className="warning-line">Review count is not sales</p>
      </header>

      <nav className="step-nav" aria-label="Research steps">
        {RESEARCH_STEPS.map((step, index) => {
          const locked = lockReasonFor(step.path) !== null;
          const reason = lockReasonFor(step.path);
          return locked ? (
            <span
              key={step.path}
              className="step-link step-link-locked"
              data-testid={`step-locked-${step.path}`}
              aria-disabled="true"
            >
              <span className="step-index">🔒</span>
              <span className="step-label">{step.label}</span>
              <span className="step-locked-text">Locked</span>
            </span>
          ) : (
            <NavLink
              key={step.path}
              to={step.path}
              end={step.path === "/"}
              className={({ isActive }) =>
                `step-link${isActive ? " step-link-active" : ""}`
              }
              title={reason ?? undefined}
            >
              <span className="step-index">{index + 1}</span>
              <span className="step-label">{step.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {qualityReport && (
        <p className="lock-reason" data-testid="lock-reason">
          {RESEARCH_STEPS.map((s) => lockReasonFor(s.path)).filter(Boolean)[0] ?? "All required steps are available."}
        </p>
      )}

      <main className="layout-main">
        {lockReasonFor(location.pathname) ? (
          <section className="page" data-testid="locked-page" role="alert">
            <h1>Module locked</h1>
            <p>
              This module is locked because the current data does not meet its
              evidence requirements. Load a larger or valid dataset, or import
              CSV files with enough valid records before continuing.
            </p>
            <p className="lock-detail">Reason: {lockReasonFor(location.pathname)}</p>
          </section>
        ) : (
          children
        )}
      </main>

      <footer className="layout-footer">
        <span>Local, free, evidence-driven research for one demo category.</span>
      </footer>
    </div>
  );
}