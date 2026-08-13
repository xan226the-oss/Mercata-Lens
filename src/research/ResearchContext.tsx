/**
 * Research context: loads and exposes the Demo dataset only.
 * States: idle | loading | ready | error. No upload, save, or analysis.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ParseIssue, ResearchDataset } from "../domain/types";
import { tryLoadDemoDataset } from "../data/demoLoader";

export type ResearchStatus = "idle" | "loading" | "ready" | "error";

export interface ResearchContextValue {
  status: ResearchStatus;
  dataset: ResearchDataset | null;
  issues: ParseIssue[];
  error: string | null;
  /** Re-run the demo load. */
  loadDemo: () => void;
}

const ResearchContext = createContext<ResearchContextValue | null>(null);

export function ResearchProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ResearchStatus>("idle");
  const [dataset, setDataset] = useState<ResearchDataset | null>(null);
  const [issues, setIssues] = useState<ParseIssue[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadDemo = useMemo(
    () => () => {
      setStatus("loading");
      setDataset(null);
      setIssues([]);
      setError(null);
      tryLoadDemoDataset()
        .then((result) => {
          if (result.ok) {
            setDataset(result.dataset);
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

  useEffect(() => {
    loadDemo();
  }, [loadDemo]);

  const value = useMemo<ResearchContextValue>(
    () => ({ status, dataset, issues, error, loadDemo }),
    [status, dataset, issues, error, loadDemo],
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