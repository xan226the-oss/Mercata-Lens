import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { RESEARCH_STEPS } from "../app/routes";
import { useResearch } from "./ResearchContext";
import { copyFor, useLanguage, type Language } from "../app/LanguageContext";
import type { ModuleAvailability } from "../domain/types";

function LockedPage({ reason, language }: { reason: string; language: Language }) {
  const isZh = language === "zh";
  return (
    <section className="locked-page" data-testid="locked-page" role="alert">
      <span className="section-kicker">{isZh ? "需要证据" : "Evidence required"}</span>
      <h1>{isZh ? "模块已锁定" : "Module locked"}</h1>
      <p>{reason}</p>
    </section>
  );
}

/** Persistent Light Slate application shell around the research flow. */
export function ResearchLayout({ children }: { children: React.ReactNode }) {
  const { status, sourceKind, qualityReport } = useResearch();
  const location = useLocation();
  const availability = qualityReport?.moduleAvailability ?? null;
  const { language, toggleLanguage } = useLanguage();
  const copy = copyFor(language);

  useEffect(() => {
    const workspace = document.querySelector<HTMLElement>(".app-workspace");
    if (workspace && typeof workspace.scrollTo === "function") {
      workspace.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } else if (workspace) {
      workspace.scrollTop = 0;
      workspace.scrollLeft = 0;
    }
  }, [location.pathname]);

  const sourceLabel =
    sourceKind === "demo"
      ? copy.demoData
      : sourceKind === "user_upload"
        ? copy.userUpload
        : status === "loading"
          ? copy.loadingData
          : copy.noActiveData;

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
    if (state === null) return language === "zh" ? "尚未加载研究数据。" : "No research data loaded yet.";
    if (state === "locked") {
      return language === "zh"
        ? "当前数据尚未满足该模块的证据要求，因此模块已锁定。"
        : "This module is locked because the current data does not meet its evidence requirements.";
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
                <span className="research-nav__label">{copy.nav[index]}</span>
                <span className="research-nav__state">{language === "zh" ? "已锁定" : "Locked"}</span>
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
                <span className="research-nav__label">{copy.nav[index]}</span>
              </NavLink>
            );
          })}
        </nav>

        <p className="evidence-rule">{copy.evidenceRule}</p>
      </aside>

      <div className="app-workspace">
        <header className="workspace-header">
          <div className="workspace-scope" aria-label={language === "zh" ? "研究范围" : "Research scope"}>
            <span>{copy.market}</span>
            <span aria-hidden="true">/</span>
            <span>{copy.category}</span>
          </div>
          <div className="workspace-header__actions">
            <button type="button" className="language-switch" onClick={toggleLanguage} aria-label={copy.languageAria}>
              <span className="language-switch__current">{language === "en" ? "EN" : "中"}</span>
              <span>{copy.languageLabel}</span>
            </button>
            <span className={`source-badge source-badge--${sourceKind ?? status}`} data-testid="source-badge">
              {sourceLabel}
            </span>
          </div>
        </header>

        {qualityReport && (
          <p className="lock-reason" data-testid="lock-reason">
            {RESEARCH_STEPS.map((step) => lockReasonFor(step.path)).filter(Boolean)[0] ??
              (language === "zh" ? "所有必需步骤均可用。" : "All required steps are available.")}
          </p>
        )}

        <main className="workspace-main">
          {lockReasonFor(location.pathname) ? (
            <LockedPage reason={lockReasonFor(location.pathname)!} language={language} />
          ) : (
            children
          )}
        </main>

        <footer className="workspace-footer">
          {copy.localResearch}
        </footer>
      </div>
    </div>
  );
}
