import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import type { Opportunity, OpportunityScore } from "../domain/opportunities";
import { OpportunityCard } from "./OpportunityCard";

const opportunity: Opportunity = {
  id: "easy_clean",
  name: "Easy-clean design",
  targetUser: "US cat owners",
  scenario: "A household compares an easy-clean hypothesis.",
  dimensions: [
    { dimension: "demand", value: 70, evidenceIds: ["review:r-clean"], reasoning: "Curated Demo assumption: demand.", evidenceKind: "assumption" },
    { dimension: "supply_gap", value: 60, evidenceIds: ["assumption:easy_clean:supply_gap"], reasoning: "Curated Demo assumption: supply gap.", evidenceKind: "assumption" },
    { dimension: "economics", value: 65, evidenceIds: ["economics:base"], reasoning: "Curated Demo assumption: economics.", evidenceKind: "assumption" },
    { dimension: "differentiation", value: 75, evidenceIds: ["assumption:easy_clean:differentiation"], reasoning: "Curated Demo assumption: differentiation.", evidenceKind: "assumption" },
    { dimension: "risk", value: 55, evidenceIds: ["assumption:easy_clean:risk"], reasoning: "Curated Demo assumption: risk.", evidenceKind: "assumption" },
  ],
  economics: [],
  supportEvidenceIds: ["review:r-clean"],
  oppositionEvidenceIds: ["product:p1"],
  unknowns: ["User research pending"],
};

const score: OpportunityScore = {
  opportunityId: "easy_clean",
  status: "complete",
  total: 65.75,
  contributions: opportunity.dimensions.map(({ dimension, value, evidenceIds, reasoning, evidenceKind }) => ({
    dimension,
    value: value as number,
    weight: 20,
    contribution: (value as number) / 5,
    evidenceIds,
    reasoning,
    evidenceKind,
  })),
  issues: [],
};

describe("OpportunityCard", () => {
  it("renders hypothesis context, dimensions, contributions, evidence links, and unknowns", () => {
    render(<OpportunityCard opportunity={opportunity} score={score} sourceKind="demo" onEvidenceClick={() => undefined} />);
    expect(screen.getByRole("heading", { name: "Easy-clean design" })).toBeInTheDocument();
    expect(screen.getByText("US cat owners")).toBeInTheDocument();
    expect(screen.getAllByText(/Curated Demo assumption:/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Weighted total: 65.75/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "review:r-clean" })).toHaveLength(2);
    expect(screen.getByText("product:p1")).toBeInTheDocument();
    expect(screen.getByText("User research pending")).toBeInTheDocument();
  });

  it("renders incomplete state without a fabricated score", () => {
    render(<OpportunityCard opportunity={{ ...opportunity, dimensions: opportunity.dimensions.map((dimension) => ({ ...dimension, value: null, evidenceIds: [] })) }} score={{ opportunityId: "easy_clean", status: "incomplete", total: null, contributions: [], issues: [] }} sourceKind="user_upload" onEvidenceClick={() => undefined} />);
    expect(screen.getByText("Incomplete — current-session user input required")).toBeInTheDocument();
    expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
    expect(screen.getByText("User upload evidence does not inherit Demo scores.")).toBeInTheDocument();
  });
});
