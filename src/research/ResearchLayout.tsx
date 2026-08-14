import { NavLink, useLocation } from "react-router-dom";
import { RESEARCH_STEPS } from "../app/routes";
import { useResearch } from "./ResearchContext";
import type { ModuleAvailability } from "../domain/types";

function LockedPage({ reason }: { reason: string }) {
  return (
    <section className="locked-page" data-testid="locked-page" role="alert">
      <span className="section-kicker">Evidence required</span>
      <h1>Module locked</h1>
      <p>{reason}</p>
    </section>
  );
}

/** Persistent Light Slate application shell around the research flow. */
export function ResearchLayout({ children }: { children: React.ReactNode }) {
  const { status, sourceKind, qualityReport } = useResearch();
  const location = useLocation();
  const availability = qualityReport?.moduleAvailability ?? null;

  const sourceLabel =
    sourceKind === "demo"
      ? "Demo data"
      : sourceKind === "user_upload"
        ? "User upload"
        : status === "loading"
          ? "Loading data"
          : "No active data";

  function moduleStateFor(path: string): ModuleAvailability | null {
    if (!availability) return null;
    switch (path) {
      case "/category":
        return availability.category;
      case "/pain-points":
        return availability.pain_points;
      case "/opportunities":
      case "/decision":
        return availability.opportunities;
      default:
        return null;
    }
  }

  function lockReasonFor(path: string): string | null {
    if (path === "/" || path === "/quality") return null;
    const state = moduleStateFor(path);
    if (state === null) return "No research data loaded yet.";
    if (state === "locked") {
      return "This module is locked because the current data does not meet its evidence requirements.";
    }
    return null;
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand__name">Mercata Lens</span>
          <span className="app-brand__cn">商机镜</span>
        </div>

        <nav className="research-nav" aria-label="Research steps">
          {RESEARCH_STEPS.map((step, index) => {
            const reason = lockReasonFor(step.path);
            const locked = reason !== null;
            return locked ? (
              <span
                key={step.path}
                className="research-nav__item research-nav__item--locked"
                data-testid={`step-locked-${step.path}`}
                aria-disabled="true"
              >
                <span className="research-nav__index" aria-hidden="true">{index + 1}</span>
                <span className="research-nav__label">{step.label}</span>
                <span className="research-nav__state">Locked</span>
              </span>
            ) : (
              <NavLink
                key={step.path}
                to={step.path}
                end={step.path === "/"}
                className={({ isActive }) =>
                  `research-nav__item${isActive ? " research-nav__item--active" : ""}`
                }
              >
                <span className="research-nav__index" aria-hidden="true">{index + 1}</span>
                <span className="research-nav__label">{step.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <p className="evidence-rule">Review count is not sales</p>
      </aside>

      <div className="app-workspace">
        <header className="workspace-header">
          <div className="workspace-scope" aria-label="Research scope">
            <span>US market</span>
            <span aria-hidden="true">/</span>
            <span>Cat Water Fountain</span>
          </div>
          <span
            className={`source-badge source-badge--${sourceKind ?? status}`}
            data-testid="source-badge"
          >
            {sourceLabel}
          </span>
        </header>

        {qualityReport && (
          <p className="lock-reason" data-testid="lock-reason">
            {RESEARCH_STEPS.map((step) => lockReasonFor(step.path)).filter(Boolean)[0] ??
              "All required steps are available."}
          </p>
        )}

        <main className="workspace-main">
          {lockReasonFor(location.pathname) ? (
            <LockedPage reason={lockReasonFor(location.pathname)!} />
          ) : (
            children
          )}
        </main>

        <footer className="workspace-footer">
          Local, free, evidence-driven research.
        </footer>
      </div>
    </div>
  );
}
