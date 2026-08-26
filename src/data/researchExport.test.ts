import { describe, expect, it } from "vitest";
import { buildResearchExport, serializeResearchExport } from "./researchExport";
import type { ResearchExportInput } from "./researchExport";

const input = {
  dataset: { schemaVersion: 1, market: "US", currency: "USD", category: "Cat Water Fountain", sourceKind: "demo", products: [], reviews: [], importedAt: "2026-08-24T00:00:00.000Z" },
  corrections: { "r-1": { add: ["noise"], remove: [], reason: "checked" } },
  economicScenarios: [],
  weights: { demand: 30, supply_gap: 25, economics: 20, differentiation: 15, risk: 10 },
  conditions: { continueConditions: ["keep evidence traceable"], pauseConditions: [], stopConditions: [] },
  report: { status: "continue_research", ranking: { status: "no_clear_winner", winnerId: null, scores: [], issues: [] }, supportEvidenceIds: ["review:r-1"], oppositionEvidenceIds: [], assumptions: ["demo assumption"], missingData: [], nextActions: [], continueConditions: ["keep evidence traceable"], pauseConditions: [], stopConditions: [], triggeredStopConditions: [], limitations: ["bounded report"] },
  rulesetVersion: "1.0.0",
} satisfies ResearchExportInput;

describe("research export", () => {
  it("creates a deterministic versioned export without browser keys", () => {
    const first = serializeResearchExport(input);
    const second = serializeResearchExport(input);
    expect(first).toBe(second);
    const parsed = JSON.parse(first) as Record<string, unknown>;
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.datasetProvenance).toMatchObject({ sourceKind: "demo", reviewCount: 0 });
    expect(first).not.toContain("key=");
    expect(first).not.toContain("__react");
  });

  it("defensively copies nested export data", () => {
    const output = buildResearchExport(input);
    input.corrections["r-1"].add.push("noise");
    input.conditions.continueConditions.push("mutated");
    expect(output.corrections["r-1"].add).toEqual(["noise"]);
    expect(output.conditions.continueConditions).toEqual(["keep evidence traceable"]);
  });
});
