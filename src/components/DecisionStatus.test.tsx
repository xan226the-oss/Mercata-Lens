import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { DecisionStatus } from "./DecisionStatus";
import type { DecisionReport } from "../domain/decision";

const base: DecisionReport = {
  status: "continue_research", ranking: { status: "no_clear_winner", winnerId: null, scores: [], issues: [] }, supportEvidenceIds: [], oppositionEvidenceIds: [], assumptions: [], missingData: [], nextActions: [], continueConditions: [], pauseConditions: [], stopConditions: [], triggeredStopConditions: [], limitations: [],
};

describe("DecisionStatus", () => {
  it.each([
    ["continue_research", "Continue research", "status"],
    ["insufficient_evidence", "Insufficient evidence", "alert"],
    ["pause", "Pause", "status"],
  ] as const)("renders %s with accessible state semantics", (status, label, role) => {
    render(<DecisionStatus report={{ ...base, status }} />);
    expect(screen.getByRole(role)).toHaveTextContent(label);
    expect(screen.getByText(/No clear winner/)).toBeInTheDocument();
  });

  it("renders an explicit trigger without turning ranking into a pause", () => {
    render(<DecisionStatus report={{ ...base, status: "pause", triggeredStopConditions: ["pause if evidence contradicts"] }} />);
    expect(screen.getByTestId("triggered-stop-conditions")).toHaveTextContent("pause if evidence contradicts");
  });
});
