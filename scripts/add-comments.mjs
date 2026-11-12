#!/usr/bin/env node
/**
 * One-shot documentation pass (2026-11-12): inserts file-header comments and
 * key-function comments into source files that lack them. Idempotent: files
 * already carrying the marker header are skipped. Comments describe behavior
 * that already exists; no logic is changed. Run `npm test` after to verify.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

const ROOT = process.cwd() + '/';

/** Insert `header` before the first non-import, non-comment line of `src`. */
function insertHeader(src, header) {
  const lines = src.split('\n');
  let i = 0;
  // Skip existing comment block / blank lines at the top.
  while (i < lines.length && (lines[i].startsWith('/*') || lines[i].startsWith('*') || lines[i].startsWith('//') || lines[i].trim() === '')) {
    if (lines[i].startsWith('/*')) { while (i < lines.length && !lines[i].includes('*/')) i++; }
    i++;
  }
  // Skip imports.
  while (i < lines.length && (lines[i].startsWith('import ') || lines[i].startsWith("import\t"))) i++;
  lines.splice(i, 0, ...header.split('\n'), '');
  return lines.join('\n');
}

/** Place `comment` immediately before the line matching `anchor` (regex). */
function insertBefore(src, anchor, comment) {
  const lines = src.split('\n');
  const idx = lines.findIndex((l) => anchor.test(l));
  if (idx === -1) return src;
  lines.splice(idx, 0, ...comment.split('\n'));
  return lines.join('\n');
}

const MARKER = 'Documentation pass 2026-11-12';
const jobs = [];

// ---------- src/domain ----------
jobs.push({
  file: 'src/domain/category.ts',
  header: `/**
 * Category overview domain (Task 4C).
 * Traceable descriptive statistics for the active product sample: price
 * median/quartiles/bands, rating and review-count bands, brand shares and
 * attribute coverage. Every band keeps contributing product IDs so any number
 * shown in the UI can be audited back to source rows. Deliberately
 * descriptive-only: no market inference, no sales claims.
 * Documentation pass 2026-11-12.
 */`,
  anchors: [
    [/^function median\(/, `/** Median of a pre-sorted ascending array; null when empty. */`],
    [/^function quartiles\(/, `/** Tukey-style quartiles via median-of-halves; single value repeats itself. */`],
    [/^function band\(/, `/** Assemble one band with an explicit product-count denominator (no silent percentages). */`],
    [/^function uniqueSortedPriceCutPoints\(/, `/** Q1/median/Q3 deduplicated ascending — the only allowed price cut points. */`],
    [/^function buildPriceBands\(/, `/** Sample-relative price bands: (prevCut, cut] intervals, open top band above Q3. */`],
    [/^function buildFixedBands\(/, `/** Fixed-band builder for rating / review-count definitions (constant edges). */`],
    [/^function buildAttributeCoverage\(/, `/** Per-attribute present/missing product lists with explicit denominator. */`],
    [/^function buildBrandShares\(/, `/** Brand grouping (blank → "Not provided"), sorted by count then label. */`],
    [/^function buildLimitations\(/, `/** Mandatory limitations block; grows with demo source, missing fields, small sample. */`],
    [/^export function analyzeCategory\(/, `/** Main entry: full CategoryAnalysis for the active dataset. ≥3 products → continue, else insufficient evidence. */`],
  ],
});
jobs.push({
  file: 'src/domain/types.ts',
  header: `/**
 * Versioned domain contracts (Task 3 core).
 * Single source of truth for product/review record shapes, parse issue
 * taxonomy and the dataset envelope. Downstream modules must rely on these
 * types instead of re-declaring raw CSV rows.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/domain/quality.ts',
  header: `/**
 * Data quality gate (Task 4A).
 * Separates blocking issues (reject the import, keep current research) from
 * warnings (import proceeds, outliers are never removed). Also computes the
 * per-module availability map (available / incomplete / locked) that drives
 * evidence-gated navigation.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/domain/opportunities.ts',
  header: `/**
 * Opportunity comparison domain (Task 7A).
 * Scores candidate opportunity hypotheses against user-editable weights.
 * Scores are sample-relative and comparative only — never an absolute
 * market-size or demand claim.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/domain/decision.ts',
  header: `/**
 * Bounded decision logic (Task 8A).
 * Aggregates category, pain-point and opportunity evidence into exactly one
 * of: continue_research / insufficient_evidence / pause, plus a validation
 * plan. Structurally prevents purchase or stocking recommendations.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/domain/economics.ts',
  header: `/**
 * Unit economics domain (Task 6A).
 * Deterministic cost/margin arithmetic over user-supplied assumptions.
 * Inputs are labelled assumptions, never market facts; outputs stay local
 * and are excluded from any market claim.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/domain/painPointRules.ts',
  header: `/**
 * Versioned pain-point phrase ruleset (Task 5A), version 1.0.0.
 * Stable labels: hard_to_clean, noise, leakage, pump_lifetime, filter_cost,
 * capacity, pet_acceptance. Every automatic match retains the configured
 * phrase and exact source-text offsets so each signal is auditable.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/domain/painPoints.ts',
  header: `/**
 * Pain-point classification over review records.
 * Applies the versioned phrase ruleset and merges session-local manual
 * corrections (adds/removes with a required non-blank reason). Corrections
 * are annotations, not market facts.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/domain/aspects.ts',
  header: `/**
 * Multi-aspect topic × sentiment domain (2026-11-04).
 * Same review may carry several topics with independent, even opposite
 * sentiments per object/time. Mixed valence is a display state, not a
 * saveable sentiment value. Aligns with server/agent.mjs TOPICS contract.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/domain/dataset.ts',
  header: `/**
 * ResearchDataset envelope builder.
 * Wraps parsed products/reviews with source kind, category and observation
 * metadata so every downstream analysis can state its evidence boundary.
 * Documentation pass 2026-11-12.
 */`,
});

// ---------- src/data ----------
jobs.push({
  file: 'src/data/csvImport.ts',
  header: `/**
 * Synchronous CSV import with the quality gate (Task 4B).
 * Nothing is read until the user clicks the exact import button. A rejected
 * import leaves current research untouched; warnings do not silently clean
 * data. Data lives in browser memory only — no persistence, no upload.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/data/demoLoader.ts',
  header: `/**
 * Bundled synthetic demo dataset loader (12 products / 76 reviews).
 * Hand-curated fixture for flow demonstration only — not a real Amazon
 * scrape; review texts are not real consumer reviews.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/data/researchExport.ts',
  header: `/**
 * Local research export (decision JSON download).
 * Serializes the current decision state, aspect revisions and review
 * snapshot for offline inspection. Export happens client-side only.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/data/opportunityHypotheses.ts',
  header: `/**
 * Default opportunity hypothesis cards derived from pain-point evidence.
 * Each hypothesis keeps its evidence links so scores remain traceable.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/data/economicScenarios.ts',
  header: `/**
 * Preset economic assumption scenarios (all values are user assumptions).
 * Documentation pass 2026-11-12.
 */`,
});

// ---------- src/research ----------
jobs.push({
  file: 'src/research/ResearchContext.tsx',
  header: `/**
 * Session research state provider.
 * Owns the active dataset, import flow, legacy pain-point corrections and
 * aspect overrides. State is React memory only; nothing persists across
 * reloads. Dataset/corrections changes bump the revision used to invalidate
 * stale assistant answers.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/research/ResearchLayout.tsx',
  header: `/**
 * Light Slate shell: sidebar navigation, source badge, evidence-gated links.
 * Locked steps are visible but not clickable and explain why.
 * Documentation pass 2026-11-12.
 */`,
});

// ---------- src/agent ----------
jobs.push({
  file: 'src/agent/AgentWorkspace.tsx',
  header: `/**
 * /assistant dialogue & evidence workspace (2026-11-02+).
 * Session layer on top of the deterministic six-step research flow: model
 * answers with citation navigation, manual label correction, revision-bound
 * messages (stale answers are invalidated, never silently reused), stale
 * notices and narrow-screen Dialogue/Evidence tabs. Model responses are
 * never fabricated when the gateway is unavailable.
 * Documentation pass 2026-11-12.
 */`,
  anchors: [
    [/async function send\(\)/, `/** Sends one question; aborts and discards results if the research revision changes mid-flight. */`],
    [/useEffect\(\(\)=>\{\s*$/m, `/** Probe /api/agent/status once per statusKey change; classify ready/disabled/offline. */`],
  ],
});
jobs.push({
  file: 'src/agent/contract.ts',
  header: `/**
 * Shared client/server reply contract: message shape and verifyReply.
 * Client-side re-verification mirrors server checks — defense in depth
 * against malformed or drifted gateway responses.
 * Documentation pass 2026-11-12.
 */`,
});

// ---------- src/components (file headers) ----------
const componentHeaders = {
  'src/components/EconomicsEditor.tsx': `Editor for user-supplied unit-economics assumptions; every input is labelled an assumption.`,
  'src/components/ReviewCorrectionPanel.tsx': `Manual review-label correction panel; requires a non-blank correction reason.`,
  'src/components/WeightEditor.tsx': `Opportunity weight editor; weight changes recalculate scores client-side.`,
  'src/components/ReviewQueue.tsx': `Review browsing queue with automatic vs manual label provenance.`,
  'src/components/ImportPanel.tsx': `Local CSV selection controls; no file is read before the explicit import button.`,
  'src/components/EvidenceDrawer.tsx': `Native calculation disclosure drawer (audit-friendly "how was this computed").`,
  'src/components/OpportunityCard.tsx': `One scored opportunity hypothesis card with evidence links.`,
  'src/components/IssueTable.tsx': `Full per-row import diagnostics (blocking vs warning).`,
  'src/components/PainPointSummaryList.tsx': `Pain-point summary with per-label counts and evidence navigation.`,
  'src/components/ModuleStatus.tsx': `Per-module availability (available / incomplete / locked) rendering.`,
  'src/components/AspectWorkbench.tsx': `Topic × sentiment workbench: AI initial labels, user confirmation and overrides.`,
  'src/components/SampleDistribution.tsx': `Exact-count sample bands with explicit denominators.`,
  'src/components/ValidationPlan.tsx': `Validation plan checklist attached to the bounded decision output.`,
  'src/components/StatusBanner.tsx': `Accessible status/alert banner (role-mapped).`,
  'src/components/DecisionStatus.tsx': `Bounded decision status display (continue / insufficient / pause).`,
  'src/components/ImportResultSummary.tsx': `Concise latest-import result summary.`,
  'src/components/EvidenceStatus.tsx': `Evidence-readiness gate indicator.`,
  'src/components/MetricStrip.tsx': `Descriptive dataset metrics strip (counts, range, readiness).`,
  'src/components/MetricCard.tsx': `Single descriptive category metric card.`,
  'src/components/DataSourceBadge.tsx': `Category-analysis source boundary badge (demo vs user upload).`,
  'src/components/PageHeader.tsx': `Consistent page title and metadata header.`,
};
for (const [file, desc] of Object.entries(componentHeaders)) {
  jobs.push({ file, header: `/**\n * ${desc}\n * Documentation pass 2026-11-12.\n */` });
}

// ---------- src/pages ----------
const pageHeaders = {
  'src/pages/HomePage.tsx': `Research home: active evidence source, record counts, evidence readiness, next step.`,
  'src/pages/QualityPage.tsx': `Data quality: latest import attempt vs active valid dataset; blocking/warning split.`,
  'src/pages/CategoryPage.tsx': `Category overview: traceable descriptive statistics with disclosure drawers.`,
  'src/pages/PainPointsPage.tsx': `Pain-point workbench: automatic matches vs manual corrections, evidence-first.`,
  'src/pages/OpportunitiesPage.tsx': `Opportunity comparison: weighted scoring with editable weights and evidence links.`,
  'src/pages/DecisionPage.tsx': `Decision & validation: bounded output plus local JSON export.`,
};
for (const [file, desc] of Object.entries(pageHeaders)) {
  jobs.push({ file, header: `/**\n * ${desc}\n * Documentation pass 2026-11-12.\n */` });
}

// ---------- src/app ----------
jobs.push({
  file: 'src/app/routes.tsx',
  header: `/**
 * RESEARCH_STEPS + STEP_ROUTES: shared six-step route metadata for the
 * sidebar and evidence gating. Single source of truth for step order.
 * Documentation pass 2026-11-12.
 */`,
});
jobs.push({
  file: 'src/app/LanguageContext.tsx',
  header: `/**
 * zh/en UI language context; defaults follow the Light Slate copy deck.
 * Documentation pass 2026-11-12.
 */`,
});

// ---------- server ----------
jobs.push({
  file: 'server/agent.mjs',
  anchors: [
    [/^const rows=Papa\.parse/, `/** Canonical server-side demo reviews; the only evidence source the gateway may cite. */`],
    [/^export function validateRequest\(/, `/**\n * Validate all client-controlled context before any model call: source kind,\n * bounded question/history sizes, correction shape and per-review label sets.\n * Raw uploaded reviews are never accepted.\n */`],
    [/^export function validateReply\(/, `/**\n * Structural reply checks: bounded answer, no digits (statistics stay in the\n * deterministic UI), no purchase advice, citations must exist. Existence\n * checks do not prove semantic support — original evidence stays visible.\n */`],
    [/^function evidenceContext\(/, `/**\n * Conservative evidence scoping: explicit review IDs narrow context; plain\n * follow-ups inherit the last named scope; global questions reset to the\n * full demo sample. Prevents cross-scope citation drift in multi-turn talk.\n */`],
    [/^export async function runModel\(/, `/**\n * One model round-trip: validated request → scoped evidence context →\n * provider call (30s timeout, 100KB response cap, no redirects) →\n * validateReply → program-supplied provenance line. Any failure throws a\n * stable error code; nothing unverified reaches the client.\n */`],
    [/^export function createAgentServer\(/, `/**\n * Local HTTP gateway (127.0.0.1:8787): trusted-origin allowlist, custom\n * header requirement, 64KB request cap, JSON-only routes. Returns stable\n * error codes (422 unverified / 502 upstream / 503 not configured).\n */`],
    [/^export async function runTag\(/, `/**\n * Single-review aspect tagging: server-owned text only (callers cannot\n * supply source text), annotations must pass validateAnnotations evidence\n * checks before returning.\n */`],
  ],
});

// ---------- Run ----------
let changed = 0, skipped = 0, missing = 0;
for (const job of jobs) {
  let src;
  try { src = readFileSync(ROOT + job.file, 'utf8'); } catch { missing++; console.log(`MISS  ${job.file}`); continue; }
  if (src.includes(MARKER)) { skipped++; continue; }
  let out = src;
  if (job.header) out = insertHeader(out, job.header);
  if (job.anchors) for (const [anchor, comment] of job.anchors) out = insertBefore(out, anchor, comment);
  if (out !== src) { writeFileSync(ROOT + job.file, out); changed++; console.log(`DONE  ${basename(job.file)}`); }
  else skipped++;
}
console.log(`\nchanged=${changed} skipped=${skipped} missing=${missing}`);
