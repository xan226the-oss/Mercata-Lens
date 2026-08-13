import type { ComponentType } from "react";
import type { RouteObject } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { QualityPage } from "../pages/QualityPage";
import { CategoryPage } from "../pages/CategoryPage";
import { PainPointsPage } from "../pages/PainPointsPage";
import { OpportunitiesPage } from "../pages/OpportunitiesPage";
import { DecisionPage } from "../pages/DecisionPage";

export type StepStatus = "available" | "locked";

export interface ResearchStep {
  path: string;
  label: string;
  status: StepStatus;
}

/**
 * Shared step metadata for the six-step research flow.
 * All steps are available in this shell; nothing is locked yet.
 * No domain logic exists at this task stage.
 */
export const RESEARCH_STEPS: ReadonlyArray<ResearchStep> = [
  { path: "/", label: "Research project", status: "available" },
  { path: "/quality", label: "Data quality", status: "available" },
  { path: "/category", label: "Category overview", status: "available" },
  { path: "/pain-points", label: "Customer pain points", status: "available" },
  { path: "/opportunities", label: "Opportunity comparison", status: "available" },
  { path: "/decision", label: "Decision & validation plan", status: "available" },
];

export const STEP_ROUTES: ReadonlyArray<{
  path: string;
  Component: ComponentType;
}> = [
  { path: "/", Component: HomePage },
  { path: "/quality", Component: QualityPage },
  { path: "/category", Component: CategoryPage },
  { path: "/pain-points", Component: PainPointsPage },
  { path: "/opportunities", Component: OpportunitiesPage },
  { path: "/decision", Component: DecisionPage },
];

export const researchRoutes: RouteObject[] = STEP_ROUTES.map(({ path, Component }) =>
  path === "/"
    ? { index: true, element: <Component /> }
    : { path, element: <Component /> },
);