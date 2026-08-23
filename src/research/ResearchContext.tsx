/**
 * Research context: demo loading + CSV import with a quality gate.
 * States: idle | loading | ready | error (for the demo load path);
 * import keeps its own success/error state without replacing current data
 * on failure. No save, no analysis, no AI.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  PainPointCorrection,
  PainPointCorrections,
} from "../domain/painPoints";
import type {
  ImportResult,
  ParseIssue,
  QualityReport,
  ResearchDataset,
  EconomicScenario,
} from "../domain/types";
import { createEconomicScenarios, cloneEconomicScenario } from "../data/economicScenarios";
import { tryLoadDemoDataset } from "../data/demoLoader";
import { importResearchCsv } from "../data/csvImport";
import { assessQuality } from "../domain/quality";

export type ResearchStatus = "idle" | "loading" | "ready" | "error";

export interface ImportOutcomeState {
  ok: boolean;
  issues: ParseIssue[];
  warnings: ParseIssue[];
  error: string | null;
  importedAt: string | null;
}

export interface ResearchContextValue {
  status: ResearchStatus;
  dataset: ResearchDataset | null;
  sourceKind: ResearchDataset["sourceKind"] | null;
  qualityReport: QualityReport | null;
  issues: ParseIssue[];
  error: string | null;
  /** Latest import attempt, including failure diagnostics. */
  importState: ImportOutcomeState;
  /** Re-run the demo load (replaces any upload). */
  loadDemo: () => void;
  /** Import two CSV texts; on failure the current research stays intact. */
  importCsv: (productsText: string, reviewsText: string) => void;
  corrections: PainPointCorrections;
  applyReviewCorrection: (
    reviewId: string,
    correction: PainPointCorrection,
  ) => boolean;
  clearReviewCorrection: (reviewId: string) => void;
  economicScenarios: EconomicScenario[];
  replaceEconomicScenario: (scenario: EconomicScenario) => boolean;
}

const EMPTY_IMPORT_STATE: ImportOutcomeState = {
  ok: false,
  issues: [],
  warnings: [],
  error: null,
  importedAt: null,
};

const ResearchContext = createContext<ResearchContextValue | null>(null);

export function ResearchProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ResearchStatus>("idle");
  const [dataset, setDataset] = useState<ResearchDataset | null>(null);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [issues, setIssues] = useState<ParseIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importState, setImportState] = useState<ImportOutcomeState>(EMPTY_IMPORT_STATE);
  const [corrections, setCorrections] = useState<PainPointCorrections>({});
  const [economicScenarios, setEconomicScenarios] = useState<EconomicScenario[]>(() => createEconomicScenarios("demo"));

  const replaceEconomicScenario = useCallback((scenario: EconomicScenario): boolean => {
    if (!["pessimistic", "base", "optimistic"].includes(scenario.id)) return false;
    setEconomicScenarios((current) => current.map((item) => item.id === scenario.id ? cloneEconomicScenario(scenario) : item));
    return true;
  }, []);

  const applyReviewCorrection = useCallback(
    (reviewId: string, correction: PainPointCorrection): boolean => {
      if (!dataset?.reviews.some((review) => review.reviewId === reviewId)) return false;
      if (correction.reason.trim() === "") return false;
      setCorrections((current) => ({
        ...current,
        [reviewId]: {
          add: [...correction.add],
          remove: [...correction.remove],
          reason: correction.reason,
        },
      }));
      return true;
    },
    [dataset],
  );

  const clearReviewCorrection = useCallback((reviewId: string) => {
    setCorrections((current) => {
      if (!(reviewId in current)) return current;
      const next = { ...current };
      delete next[reviewId];
      return next;
    });
  }, []);

  const loadDemo = useMemo(
    () => () => {
      setCorrections({});
      setEconomicScenarios(createEconomicScenarios("demo"));
      setStatus("loading");
      setDataset(null);
      setQualityReport(null);
      setIssues([]);
      setError(null);
      setImportState(EMPTY_IMPORT_STATE);
      tryLoadDemoDataset()
        .then((result) => {
          if (result.ok) {
            setDataset(result.dataset);
            setQualityReport(assessQuality(result.dataset));
            setStatus("ready");
          } else {
            const issues = result.issues;
            setIssues(issues);
            setError(
              issues.length > 0
                ? `Demo data failed validation (${issues.length} issue(s)).`
                : `Failed to load demo data${result.error ? `: ${result.error}` : "."}`,
            );
            setStatus("error");
          }
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          setError(`Failed to load demo data: ${message}`);
          setStatus("error");
        });
    },
    [],
  );

  const importCsv = useMemo(
    () => (productsText: string, reviewsText: string) => {
      const result: ImportResult = importResearchCsv(productsText, reviewsText);
      if (!result.ok) {
        // Keep current dataset / quality / badge; only surface the error.
        setImportState({
          ok: false,
          issues: result.issues,
          warnings: [],
          error: `Import failed with ${result.issues.length} blocking issue(s). Current research remains unchanged.`,
          importedAt: null,
        });
        return;
      }
      const nextQuality = assessQuality(result.dataset);
      setCorrections({});
      setEconomicScenarios(createEconomicScenarios("user_upload"));
      setDataset(result.dataset);
      setQualityReport(nextQuality);
      setImportState({
        ok: true,
        issues: [],
        warnings: result.warnings,
        error: null,
        importedAt: result.dataset.importedAt,
      });
      setStatus("ready");
    },
    [],
  );

  useEffect(() => {
    loadDemo();
  }, [loadDemo]);

  const sourceKind = dataset?.sourceKind ?? null;

  const value = useMemo<ResearchContextValue>(
    () => ({
      status,
      dataset,
      sourceKind,
      qualityReport,
      issues,
      error,
      importState,
      loadDemo,
      importCsv,
      corrections,
      applyReviewCorrection,
      clearReviewCorrection,
      economicScenarios,
      replaceEconomicScenario,
    }),
    [status, dataset, sourceKind, qualityReport, issues, error, importState, loadDemo, importCsv, corrections, applyReviewCorrection, clearReviewCorrection, economicScenarios, replaceEconomicScenario],
  );

  return <ResearchContext.Provider value={value}>{children}</ResearchContext.Provider>;
}

export function useResearch(): ResearchContextValue {
  const ctx = useContext(ResearchContext);
  if (!ctx) {
    throw new Error("useResearch must be used within a ResearchProvider");
  }
  return ctx;
}