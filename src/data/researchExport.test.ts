import { describe, expect, it, vi } from "vitest";
import { buildResearchExport, downloadResearchExport, serializeResearchExport } from "./researchExport";
import type { ResearchExportInput } from "./researchExport";
import type { DecisionReport } from "../domain/decision";

const report: DecisionReport = {
  status: "continue_research",
  ranking: {
    status: "incomplete",
    winnerId: null,
    scores: [{
      opportunityId: "easy_clean",
      status: "incomplete",
      total: null,
      contributions: [{ dimension: "demand", value: 70, weight: 30, contribution: 21, evidenceIds: ["review:r-1"], reasoning: "bounded", evidenceKind: "assumption" }],
      issues: [{ kind: "candidate", code: "invalid_id", id: "issue", message: "bounded" }],
    }],
    issues: [{ kind: "candidate", code: "invalid_id", id: "ranking", message: "bounded" }],
  },
  supportEvidenceIds: ["review:r-1"],
  oppositionEvidenceIds: ["assumption:easy_clean:risk"],
  assumptions: ["demo assumption"],
  missingData: [],
  nextActions: [],
  continueConditions: ["keep evidence traceable"],
  pauseConditions: [],
  stopConditions: [],
  triggeredStopConditions: [],
  limitations: ["bounded report"],
};

const input = {
  dataset: { schemaVersion: 1, market: "US", currency: "USD", category: "Cat Water Fountain", sourceKind: "demo", products: [], reviews: [], importedAt: "2026-08-24T00:00:00.000Z" },
  corrections: { "r-1": { add: ["noise"], remove: [], reason: "checked" } },
  economicScenarios: [],
  weights: { demand: 30, supply_gap: 25, economics: 20, differentiation: 15, risk: 10 },
  conditions: { continueConditions: ["keep evidence traceable"], pauseConditions: [], stopConditions: [] },
  report,
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

  it("defensively copies every nested report collection", () => {
    const output = buildResearchExport(input);
    Object.defineProperty(output.report.oppositionEvidenceIds, output.report.oppositionEvidenceIds.length, { value: "mutated-opposition", enumerable: true, configurable: true, writable: true });
    Object.defineProperty(output.report.ranking.scores[0].contributions[0].evidenceIds, output.report.ranking.scores[0].contributions[0].evidenceIds.length, { value: "mutated-evidence", enumerable: true, configurable: true, writable: true });
    Object.defineProperty(output.report.ranking.scores[0].issues, output.report.ranking.scores[0].issues.length, { value: { kind: "candidate", code: "invalid_id", id: "mutated", message: "mutated" }, enumerable: true, configurable: true, writable: true });
    Object.defineProperty(output.report.ranking.issues, output.report.ranking.issues.length, { value: { kind: "candidate", code: "invalid_id", id: "mutated-ranking", message: "mutated" }, enumerable: true, configurable: true, writable: true });
    const second = buildResearchExport(input);
    expect(input.report.oppositionEvidenceIds).toEqual(["assumption:easy_clean:risk"]);
    expect(input.report.ranking.scores[0].contributions[0].evidenceIds).toEqual(["review:r-1"]);
    expect(input.report.ranking.scores[0].issues).toHaveLength(1);
    expect(input.report.ranking.issues).toHaveLength(1);
    expect(second.report.oppositionEvidenceIds).toEqual(["assumption:easy_clean:risk"]);
    expect(second.report.ranking.scores[0].contributions[0].evidenceIds).toEqual(["review:r-1"]);
    expect(second.report.ranking.scores[0].issues).toHaveLength(1);
    expect(second.report.ranking.issues).toHaveLength(1);
  });

  it("creates, downloads, and revokes a real JSON Blob URL", () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const remove = vi.spyOn(HTMLAnchorElement.prototype, "remove").mockImplementation(() => undefined);
    downloadResearchExport(input, "acceptance.json");
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.objectContaining({ type: "application/json" }));
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    click.mockRestore();
    remove.mockRestore();
  });
});
