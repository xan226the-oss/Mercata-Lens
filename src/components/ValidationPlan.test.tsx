import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ValidationPlan } from "./ValidationPlan";
import type { DecisionReport } from "../domain/decision";

const report: DecisionReport = {
  status: "continue_research", ranking: { status: "no_clear_winner", winnerId: null, scores: [], issues: [] }, supportEvidenceIds: ["review:r001", "economics:base"], oppositionEvidenceIds: ["assumption:easy_clean:risk"], assumptions: ["Demo assumption"], missingData: ["Human audit"], nextActions: [{ owner: "researcher", action: "Review evidence", evidenceExpected: "A comparable record" }], continueConditions: ["Continue if evidence remains traceable"], pauseConditions: ["Pause if blocked"], stopConditions: ["Stop if contradictory"], triggeredStopConditions: [], limitations: ["Local only"],
};

describe("ValidationPlan", () => {
  it("renders actions, evidence, conditions, assumptions, missing data, and limitations", () => {
    render(<ValidationPlan report={report} onEvidenceClick={vi.fn()} />);
    expect(screen.getByText("Review evidence")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "review:r001" })).toBeInTheDocument();
    expect(screen.getByTestId("decision-assumptions")).toHaveTextContent("Demo assumption");
    expect(screen.getByTestId("decision-missing-data")).toHaveTextContent("Human audit");
    expect(screen.getByTestId("decision-limitations")).toHaveTextContent("Local only");
    expect(screen.getByTestId("decision-conditions-summary")).toHaveTextContent("Stop if contradictory");
  });
});
