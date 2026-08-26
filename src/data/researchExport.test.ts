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

  it("snapshots primitive and hostile CandidateIssue IDs deterministically at ranking and score levels", () => {
    const nestedId = { z: ["nested", { value: 1 }], a: true };
    const throwingProxy = new Proxy({}, { ownKeys: () => { throw new Error("blocked"); } });
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const accessor = Object.defineProperty({}, "value", { get: () => { throw new Error("getter must not run"); }, enumerable: true });
    const hostileReport: DecisionReport = {
      ...report,
      ranking: {
        status: "incomplete",
        winnerId: null,
        scores: [{ opportunityId: "easy_clean", status: "incomplete", total: null, contributions: [], issues: [
          { kind: "candidate", code: "invalid_id", id: nestedId, message: "nested" },
          { kind: "candidate", code: "invalid_id", id: 42, message: "number" },
          { kind: "candidate", code: "invalid_id", id: throwingProxy, message: "proxy" },
            { kind: "candidate", code: "invalid_id", id: circular, message: "cycle" },
            { kind: "candidate", code: "invalid_id", id: accessor, message: "accessor" },
            { kind: "candidate", code: "invalid_id", id: Symbol("id"), message: "symbol" },
        ] }],
        issues: [{ kind: "candidate", code: "invalid_id", id: "primitive", message: "primitive" }],
      },
    };
    const hostileInput = { ...input, report: hostileReport } satisfies ResearchExportInput;
    const first = buildResearchExport(hostileInput);
    const firstScoreIssues = first.report.ranking.scores[0].issues as readonly { id?: unknown }[];
    expect(firstScoreIssues[0]?.id).toEqual({ a: true, z: ["nested", { value: 1 }] });
    expect(firstScoreIssues[1]?.id).toBe(42);
    expect(firstScoreIssues.slice(2).map((issue) => issue.id)).toEqual([
      { kind: "unavailable", reason: "candidate_id_not_safely_snapshotable" },
      { kind: "unavailable", reason: "candidate_id_not_safely_snapshotable" },
      { kind: "unavailable", reason: "candidate_id_not_safely_snapshotable" },
      { kind: "unavailable", reason: "candidate_id_not_safely_snapshotable" },
    ]);
    const firstRankingIssues = first.report.ranking.issues as readonly { id?: unknown }[];
    expect(firstRankingIssues[0]?.id).toBe("primitive");
    const second = buildResearchExport(hostileInput);
    Object.defineProperty(
      firstScoreIssues[0]?.id as Record<string, unknown>,
      "z",
      { value: ["mutated"], enumerable: true, configurable: true, writable: true },
    );
    const inputScoreIssues = hostileInput.report.ranking.scores[0].issues as readonly { id?: unknown }[];
    expect(inputScoreIssues[0]?.id).toEqual({ z: ["nested", { value: 1 }], a: true });
    const secondScoreIssues = second.report.ranking.scores[0].issues as readonly { id?: unknown }[];
    expect(secondScoreIssues[0]?.id).toEqual({ a: true, z: ["nested", { value: 1 }] });
    expect(serializeResearchExport(hostileInput)).toBe(serializeResearchExport(hostileInput));
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
