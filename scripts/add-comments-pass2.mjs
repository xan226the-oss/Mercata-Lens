#!/usr/bin/env node
/**
 * Documentation pass 2 (2026-11-12): per-item inline comments — types,
 * ruleset entries, validation branches and algorithm steps inside larger
 * functions. Same rules as pass 1: describe existing behavior only, change
 * no logic, run tests afterwards. Idempotent via marker text.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = process.cwd() + '/';
const jobs = [];

// --- helper: build many small line-anchored insertions ---
function anchorJob(file, entries) {
  jobs.push({ file, entries });
}

// ============ src/domain/painPointRules.ts ============
anchorJob('src/domain/painPointRules.ts', [
  { find: 'export const PAIN_POINT_RULESET_VERSION = "1.0.0" as const;', before: [
    '/** Semver of the phrase ruleset; bumped whenever any phrase changes (see review-rule-changelog). */',
  ]},
  { find: 'export const PAIN_POINT_IDS = [', before: [
    '/** Stable machine IDs for the seven pain-point labels; UI copy lives separately (labelEn/labelZh). */',
  ]},
  { find: 'export interface PainPointRule {', before: [
    '/** One label rule: include phrases flag a match; overlapping exclude phrases cancel it. */',
  ]},
  { find: 'export interface PainPointMatch {', before: [
    '/** A single auditable automatic match: which phrase fired, verbatim source text and exact offsets. */',
  ]},
  { find: 'export const PAIN_POINT_RULES = [', before: [
    '/**',
    ' * The ruleset itself. Phrases are literal English n-grams observed in the',
    ' * demo corpus; negation guards ("not hard to clean") prevent the classic',
    ' * sentiment-inversion false positive. Adding/removing a phrase requires a',
    ' * version bump so historical matches stay interpretable.',
    ' */',
  ]},
  { find: '  id: "hard_to_clean",', before: ['  // Cleaning difficulty: disassembly/refit friction and cleaning time complaints.'] },
  { find: '  id: "noise",', before: ['  // Noise: pump hum and splashing volume complaints; "not noisy" excluded.'] },
  { find: '  id: "leakage",', before: ['  // Leakage: all inflections of leak; explicit no-leak denials excluded.'] },
  { find: '  id: "pump_lifetime",', before: ['  // Pump lifetime: pump death/weakening/clogging events, not general reliability.'] },
  { find: '  id: "filter_cost",', before: ['  // Filter cost: recurring replacement expense complaints, not one-off price.'] },
  { find: '  id: "capacity",', before: ['  // Capacity: undersized units and daily refill burden; "easy to refill" is not a match.'] },
  { find: '  id: "pet_acceptance",', before: ['  // Pet acceptance: pets ignoring/fearing the fountain; hardest label, fewest phrases.'] },
  { find: 'interface TextToken {', before: ['/** Lowercased word token pinned to its source offsets (audit trail stays exact). */'] },
  { find: 'interface MatchCandidate extends PainPointMatch {', before: ['/** Match plus ranking metadata for the overlap resolution below. */'] },
  { find: 'function tokenize(text: string): TextToken[] {', before: [
    '/** Split into alphanumeric tokens (punctuation ignored) keeping original offsets. */',
  ]},
  { find: 'function phraseSpans(', before: [
    '/**',
    ' * Find every occurrence of `phrase` in the token stream (exact normalized',
    ' * token equality — no stemming, no synonyms) and return its character span',
    ' * and token count in the original review text.',
    ' */',
  ]},
  { find: 'function overlaps(', before: ['/** Half-open interval intersection test. */'] },
  { find: 'export function matchPainPointRule(', before: [
    '/**',
    ' * Run one rule over one review: collect exclude spans first, then keep',
    ' * include candidates that do not overlap any exclusion. When several',
    ' * candidates overlap each other, prefer the longest phrase (most specific',
     ' * wording), then earlier declaration, then earliest position — so a review',
     ' * is never double-flagged for the same span.',
     ' */',
  ]},
  { find: 'export function matchPainPointRules(reviewText: string): PainPointMatch[] {', before: [
    '/** Run all seven rules; matches across different labels may legitimately coexist. */',
  ]},
]);

// ============ src/domain/schemas.ts (needs deeper) ============
anchorJob('src/domain/schemas.ts', [
  { find: 'const PRODUCT_REQUIRED_FIELDS = [', before: ['/** Columns a product row must carry; anything else is a blocking parse issue. */'] },
  { find: 'const REVIEW_REQUIRED_FIELDS = [', before: ['/** Columns a review row must carry (review_date optional). */'] },
]);

// ============ src/domain/category.ts deeper ============
anchorJob('src/domain/category.ts', [
  { find: 'export type CategoryStatus =', before: ['/** Bounded tri-state mirroring the decision vocabulary; never a market verdict. */'] },
  { find: 'export interface CategoryBand {', before: [
    '/**',
    ' * One distribution band with explicit boundaries and the product IDs that',
    ' * fall inside. Denominator semantics: shareOfProducts = count / productCount',
    ' * with productCount always stated alongside — never a bare percentage.',
    ' */',
  ]},
  { find: 'export interface BrandShare {', before: ['/** Brand share with denominator; "Not provided" is an explicit bucket, not hidden. */'] },
  { find: 'export interface CategoryEvidence {', before: [
    '/**',
    ' * Evidence block attached to every analysis: which products are in, which',
    ' * are out (and why), the price cut points used, and the denominator.',
    ' */',
  ]},
  { find: 'export type CategoryLimitationCode =', before: ['/** Enumerated limitation codes so the UI can render them consistently. */'] },
  { find: 'export interface CategoryAnalysis {', before: [
    '/**',
    ' * Full descriptive category snapshot. All fields are sample-relative:',
    ' * status ≥3 products allows continued descriptive research only.',
    ' */',
  ]},
  { find: 'const ratingDefinitions = [', before: [
    '/** Fixed rating bands: <3, 3–<4, 4–<4.5, 4.5–5. Edges are constant across samples. */',
  ]},
  { find: 'const reviewDefinitions = [', before: [
    '/**',
    ' * Fixed displayed-review-count bands: 0, 1–99, 100–499, 500+.',
     ' * review_count is a displayed count and is explicitly NOT sales volume.',
     ' */',
  ]},
]);

// ============ src/agent/AgentWorkspace.tsx deeper ============
anchorJob('src/agent/AgentWorkspace.tsx', [
  { find: " const [capability,setCapability]=useState<'checking'|'ready'|'disabled'|'offline'>('checking');", before: [
    ' // Gateway capability: checking (probing) → ready/disabled/offline. Drives whether input is enabled.',
  ]},
  { find: ' const revision=useMemo(()=>crypto.randomUUID(),[dataset,corrections,aspectOverrides]);', before: [
    ' // Revision bumps on any data/label change; all in-flight and past answers are bound to it.',
  ]},
  { find: ' useEffect(()=>{\n  active.current?.controller.abort();active.current=null;setPending(false);setError(null);setLegacyDirty(false);setAspectDirty(false);', before: [
    '  // On revision change: abort in-flight requests, clear error/dirty flags — stale answers can never be shown as current.',
  ]},
]);

// ============ server/agent.mjs deeper ============
anchorJob('server/agent.mjs', [
  { find: 'const labels=new Set(', before: ['// Server-side copy of the seven stable pain-point labels; corrections must stay inside this set.'] },
  { find: 'const bounded=(s,max)=>', before: ['// Non-empty string with a hard length ceiling; used on every client-supplied field.'] },
  { find: 'const fail=(code)=>{throw new Error(code);};', before: ['// Central fail helper: every validation branch throws a stable machine code, never free text.'] },
  { find: ' if(profile){', before: ['  // Profiles pin the endpoint to Bailian/DashScope chat-completions with an allowlisted model set — no arbitrary URL fetch.'] },
  { find: ' const seen=new Set();\n for(const c of b.corrections){', before: ['  // Each review can appear at most once in corrections; add/remove sets must be disjoint.'] },
  { find: ' if(b.aspectCorrections!==undefined){', before: ['  // Aspect corrections additionally validate against the topic/sentiment contract and verbatim evidence.'] },
  { find: 'const instruction=`主题和情感分别判断', before: [
    '/**',
    ' * System instruction (task framing). Key invariants: reviews are untrusted data,',
    ' * no purchase/stocking/sales advice, no fabricated numbers (statistics live in the',
    ' * deterministic UI), citations required and existence-checked, output is strict JSON.',
    ' */',
  ]},
  { find: 'const aspectInstruction=`', before: [
    '/** Topic × sentiment policy injected in trusted system context for every profile. */',
  ]},
  { find: 'const qwenInstruction=`', before: [
    '/** Profile-specific output format rules (scopeNotice channel, no digits in prose). */',
  ]},
  { find: 'const named=text=>', before: ['  // Extract explicit r### review IDs mentioned in text; global keywords reset the scope.'] },
  { find: ' const wanted=named(body.question);', before: ['  // Question-level explicit IDs win; otherwise a contiguous follow-up chain may inherit scope.'] },
  { find: " if(reply.reviewIds.some(id=>!allowedIds.has(id)))fail('unverified_response');", before: [' // Citations must belong to the currently scoped evidence set, not merely exist.'] },
]);

// ============ src/domain/opportunities.ts / decision.ts / economics.ts key points ============
anchorJob('src/domain/opportunities.ts', [
  { find: 'export function scoreOpportunities(', before: [
    '/**',
    ' * Weighted scoring across hypotheses. Weights are user-editable',
    ' * preferences; scores are comparative within the current sample and must',
    ' * be presented with that boundary, never as absolute attractiveness.',
    ' */',
  ]},
]);
anchorJob('src/domain/decision.ts', [
  { find: 'export function decide(', before: [
    '/**',
    ' * Bounded decision: consumes category/pain-point/opportunity evidence and',
    ' * returns continue_research | insufficient_evidence | pause with reasons',
    ' * and a validation plan. Structurally cannot emit purchase advice.',
    ' */',
  ]},
]);
anchorJob('src/domain/economics.ts', [
  { find: 'export function computeUnitEconomics(', before: [
    '/** Deterministic margin arithmetic over labelled user assumptions; no market-cost claims. */',
  ]},
]);

// ============ src/data/csvImport.ts deeper ============
anchorJob('src/data/csvImport.ts', [
  { find: 'export function importDataset(', before: [
    '/**',
    ' * Parse → validate rows → cross-row checks → quality gate. Blocking',
    ' * issues reject the whole import (current research is never partially',
    ' * replaced); warnings pass through unchanged (outliers are kept).',
    ' */',
  ]},
]);

// ============ src/research/ResearchContext.tsx deeper ============
anchorJob('src/research/ResearchContext.tsx', [
  { find: 'export function ResearchProvider(', before: [
    '/**',
    ' * Root provider: demo autoload, import-replace flow, correction stores and',
    ' * the revision counter that invalidates assistant answers. All state is',
    ' * in-memory; leaving the page or reloading discards the session.',
    ' */',
  ]},
]);

// ============ run ============
let changed = 0, missing = 0;
for (const job of jobs) {
  let src;
  try { src = readFileSync(ROOT + job.file, 'utf8'); } catch { missing++; console.log(`MISS ${job.file}`); continue; }
  let out = src;
  let applied = 0;
  for (const e of job.entries) {
    const idx = out.indexOf(e.find);
    if (idx === -1) { console.log(`  skip (not found): ${e.find.slice(0, 50)}...`); continue; }
    // Prevent double-insert if comment already directly above.
    const beforeChunk = out.slice(Math.max(0, idx - 300), idx);
    const firstLine = e.before[0];
    if (beforeChunk.includes(firstLine)) continue;
    out = out.slice(0, idx) + e.before.join('\n') + '\n' + out.slice(idx);
    applied++;
  }
  if (out !== src) { writeFileSync(ROOT + job.file, out); changed++; console.log(`DONE ${job.file} (+${applied})`); }
}
console.log(`\nfiles changed: ${changed}, missing: ${missing}`);
