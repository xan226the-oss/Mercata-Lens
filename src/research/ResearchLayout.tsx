import { NavLink } from "react-router-dom";
import { RESEARCH_STEPS } from "../app/routes";

/**
 * Persistent shell around the six-step research flow.
 * Displays product identity, the exact scope boundary and data warning,
 * step navigation, and a persistent Demo data badge.
 */
export function ResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="research-layout">
      <header className="layout-header">
        <div className="brand">
          <span className="brand-en">Mercata Lens</span>
          <span className="brand-zh">商机镜</span>
          <span className="badge badge-demo" data-testid="demo-badge">
            Demo data
          </span>
        </div>
        <p className="scope-line">Demo scope: US cat water fountains</p>
        <p className="warning-line">Review count is not sales</p>
      </header>

      <nav className="step-nav" aria-label="Research steps">
        {RESEARCH_STEPS.map((step, index) => (
          <NavLink
            key={step.path}
            to={step.path}
            end={step.path === "/"}
            className={({ isActive }) =>
              `step-link${isActive ? " step-link-active" : ""}`
            }
          >
            <span className="step-index">{index + 1}</span>
            <span className="step-label">{step.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="layout-main">{children}</main>

      <footer className="layout-footer">
        <span>Local, free, evidence-driven research for one demo category.</span>
      </footer>
    </div>
  );
}
