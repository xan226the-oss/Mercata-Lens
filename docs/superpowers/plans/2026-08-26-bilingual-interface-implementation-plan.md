# Mercata Lens Bilingual Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete English/Simplified Chinese presentation layer with one current-session language switch while preserving every research value, route, import contract, domain calculation, and JSON export.

**Architecture:** Add a presentation-only `LanguageProvider` above the existing `ResearchProvider`, a flat strongly typed message catalog, explicit interpolation and locale formatters, and narrowly scoped presentation adapters for stable domain values. Translate system-owned UI at render boundaries only. Keep source/user content and machine contracts unchanged.

**Tech Stack:** React 19, TypeScript 5.8, React Router 7, Vitest, Testing Library, Playwright, existing CSS. Do not add an i18n dependency.

## Global Constraints

- Approved starting point: `0d117a52694a7792140683cecfc67ee382639a90` on `main`, with a clean worktree. If implementation begins from another HEAD, verify that this commit is an ancestor and review intervening commits before editing.
- Read `AGENTS.md`, the approved design at `docs/superpowers/specs/2026-08-26-bilingual-interface-design.md`, this plan, and every file listed by the active task before editing.
- The initial language is always `en`. Refresh resets to English. Do not read or write `localStorage`, `sessionStorage`, cookies, IndexedDB, URL language parameters, files, or remote services.
- `LanguageProvider` must wrap, not sit inside, `ResearchProvider`. Switching language must not remount or reset research state.
- Do not change the six routes or create Chinese routes, duplicate pages, or duplicate mobile DOM.
- Translate only system-owned presentation text. Preserve product/review/evidence IDs, URLs, CSV column names, JSON keys/enums, product titles, brands, review text, correction reasons, decision conditions, and all other imported/user-authored strings byte-for-byte.
- JSON export must be deeply equal before and after switching language. CSV input contracts stay English.
- English messages must preserve the current approved English wording unless the approved design explicitly changes it.
- Chinese must be concise product Chinese, not literal word-for-word translation. `Mercata Lens` remains unchanged; `商机镜` remains a secondary descriptor.
- `review_count` means review count only. Never introduce sales, demand, market-share, profit, or recommendation claims beyond existing bounded copy.
- Locale formatting is presentation-only: `en-US` and `zh-CN`; USD remains explicit; calculations and stored numeric values do not change.
- Do not add dependencies or modify `package.json` / `pnpm-lock.yaml`.
- Use RED -> GREEN. Do not label test syntax/import mistakes as behavioral RED. One normal commit per task, then stop for independent Codex review.
- Keep existing desktop behavior at 1440x900 and 900x900. Preserve only the existing 390x844 no-horizontal-overflow regression; do not add new mobile product behavior.

---

## Task LANG-01: Typed i18n foundation and shared shell switch

**Files:**

- Create: `src/i18n/types.ts`
- Create: `src/i18n/messages.ts`
- Create: `src/i18n/messages.test.ts`
- Create: `src/i18n/LanguageContext.tsx`
- Create: `src/i18n/LanguageContext.test.tsx`
- Create: `src/i18n/useI18n.ts`
- Create: `src/components/LanguageSwitcher.tsx`
- Create: `src/components/LanguageSwitcher.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/routes.tsx`
- Modify: `src/app/routes.test.tsx`
- Modify: `src/research/ResearchLayout.tsx`
- Modify: `src/research/ResearchLayout.test.tsx`
- Modify: `src/app/styles.css`

### 1.1 Establish the dictionary contract with a real RED

- [ ] Create `src/i18n/messages.test.ts` first and import the not-yet-existing catalog.
- [ ] Assert that English and Chinese key sets are identical, all values are nonblank, interpolation requires all declared parameters, unknown interpolation values are not silently discarded, and lookup never returns an empty fallback.
- [ ] Include shell/navigation keys for all six routes, source states, lock states, footer, scope, switch accessible names, and the secondary brand descriptor.

Use a flat key contract so TypeScript can enforce exact parity:

```ts
export const en = {
  "brand.secondary": "商机镜",
  "nav.ariaLabel": "Research steps",
  "nav.home": "Research project",
  "nav.quality": "Data quality",
  "nav.category": "Category overview",
  "nav.painPoints": "Customer pain points",
  "nav.opportunities": "Opportunity comparison",
  "nav.decision": "Decision & validation plan",
  "language.switchToChinese": "Switch interface to Simplified Chinese",
  "language.switchToEnglish": "Switch interface to English",
  "language.controlChinese": "中文",
  "language.controlEnglish": "English",
} as const;

export type MessageKey = keyof typeof en;
export const zhCN = {
  // every key above, no extras
} satisfies Record<MessageKey, string>;
```

- [ ] Run `pnpm vitest run src/i18n/messages.test.ts` and record the valid RED: module `./messages` does not exist.

### 1.2 Implement the typed catalog, interpolation, and formatters

- [ ] Add `Language`, `MessageKey`, `MessageParams`, and locale types in `src/i18n/types.ts`.
- [ ] Implement `messages`, `translate`, and deterministic interpolation in `src/i18n/messages.ts`.
- [ ] Throw a descriptive development/test error for a missing key, blank message, or missing named parameter. Do not silently fall back to English.
- [ ] Add locale-bound helpers for counts, dates, USD, and percentages. Helpers receive raw values and return presentation strings only.

Required shape:

```ts
export type Language = "en" | "zh-CN";
export interface ParameterizedMessageParams {
  readonly "lock.reason": { readonly requirement: string };
  readonly "import.acceptedCounts": { readonly products: number; readonly reviews: number };
}

export type TranslateArgs<K extends MessageKey> =
  K extends keyof ParameterizedMessageParams
    ? [params: ParameterizedMessageParams[K]]
    : [params?: never];

export function translate<K extends MessageKey>(
  language: Language,
  key: K,
  ...args: TranslateArgs<K>
): string;

export function formatUsd(language: Language, cents: number): string;
export function formatDate(language: Language, isoDate: string): string;
export function formatPercent(language: Language, value: number): string;
export function formatCount(language: Language, value: number): string;
```

- [ ] Test `en-US` versus `zh-CN` formatting without changing the input values. Assert USD remains explicit in Chinese.
- [ ] Run the focused test and obtain GREEN.

### 1.3 Add current-session language state

- [ ] Write `LanguageContext.test.tsx` before implementation.
- [ ] Assert default `en`, switch to `zh-CN`, switch back to `en`, stable provider children, and no calls to storage APIs.
- [ ] Implement `LanguageProvider` and `useLanguage` with state owned only in memory:

```tsx
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<Language>("en");
  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
```

- [ ] Synchronize `document.documentElement.lang` to `en` or `zh-CN` for assistive technology. Test the change directly; do not use it as persistence or initial-language detection.
- [ ] Implement `useI18n()` returning `{ language, setLanguage, t, formatUsd, formatDate, formatPercent, formatCount }` bound to the current language.
- [ ] Confirm that unmount/remount resets English; do not add an effect that inspects browser locale.

### 1.4 Add the accessible shared switch and wire providers

- [ ] Write `LanguageSwitcher.test.tsx` before creating the component. Assert English UI displays `中文`, Chinese UI displays `English`, the accessible name describes the target language, Enter and Space work through the native button, and focus stays on the button.
- [ ] Implement one native button. Do not render two language buttons.

```tsx
export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  const chinese = language === "zh-CN";
  return (
    <button
      type="button"
      className="language-switcher"
      aria-pressed={chinese}
      aria-label={t(chinese ? "language.switchToEnglish" : "language.switchToChinese")}
      onClick={() => setLanguage(chinese ? "en" : "zh-CN")}
    >
      {t(chinese ? "language.controlEnglish" : "language.controlChinese")}
    </button>
  );
}
```

- [ ] Wrap the current provider order in `src/app/App.tsx` exactly as:

```tsx
<LanguageProvider>
  <ResearchProvider>
    <ResearchLayout>{/* existing routes */}</ResearchLayout>
  </ResearchProvider>
</LanguageProvider>
```

- [ ] Replace `ResearchStep.label` with a typed `labelKey: MessageKey` in `src/app/routes.tsx`; keep path and status unchanged.
- [ ] Translate all system-owned strings in `ResearchLayout`, including navigation, source labels, lock copy, scope labels, availability text, evidence rule, footer, and accessibility labels.
- [ ] Place `LanguageSwitcher` once in `.workspace-header`. Keep `Mercata Lens` literal and render the localized secondary descriptor.
- [ ] Add only `.language-switcher` and necessary header-layout styles. Do not rewrite the existing stylesheet baseline.

### 1.5 Prove shell switching does not reset research

- [ ] Extend the real `ResearchLayout.test.tsx` provider integration test to load Demo, switch to Chinese, and verify the `Synthetic demo`/source presentation changes while the same active dataset counts remain.
- [ ] Switch back to English and verify the route/path is unchanged.
- [ ] Spy on `localStorage`, `sessionStorage`, and `history.pushState` where appropriate; language switching must not call persistence or navigate.
- [ ] Update route tests for `labelKey` and both localized navigation labels.

Run:

```bash
pnpm vitest run \
  src/i18n/messages.test.ts \
  src/i18n/LanguageContext.test.tsx \
  src/components/LanguageSwitcher.test.tsx \
  src/research/ResearchLayout.test.tsx \
  src/app/routes.test.tsx
pnpm lint
git diff --check
```

Expected: all focused tests pass; TypeScript catches missing/extra translation keys; diff check is clean.

- [ ] Commit only LANG-01 files:

```bash
git add src/i18n/types.ts src/i18n/messages.ts src/i18n/messages.test.ts \
  src/i18n/LanguageContext.tsx src/i18n/LanguageContext.test.tsx src/i18n/useI18n.ts \
  src/components/LanguageSwitcher.tsx src/components/LanguageSwitcher.test.tsx \
  src/app/App.tsx src/app/routes.tsx src/app/routes.test.tsx \
  src/research/ResearchLayout.tsx src/research/ResearchLayout.test.tsx src/app/styles.css
git commit -m "feat: add bilingual application shell"
```

- [ ] Stop for independent Codex review.

---

## Task LANG-02: Localize intake, quality, category, and shared presentation adapters

**Files:**

- Create: `src/i18n/presenters.ts`
- Create: `src/i18n/presenters.test.ts`
- Modify: `src/i18n/messages.ts`
- Modify: `src/i18n/messages.test.ts`
- Modify: `src/components/PageHeader.tsx`
- Modify: `src/components/DataSourceBadge.tsx`
- Modify: `src/components/DataSourceBadge.test.tsx`
- Modify: `src/components/ImportPanel.tsx`
- Modify: `src/components/ImportResultSummary.tsx`
- Modify: `src/components/IssueTable.tsx`
- Modify: `src/components/IssueTable.test.tsx`
- Modify: `src/components/MetricCard.tsx`
- Modify: `src/components/MetricCard.test.tsx`
- Modify: `src/components/MetricStrip.tsx`
- Modify: `src/components/ModuleStatus.tsx`
- Modify: `src/components/StatusBanner.tsx`
- Modify: `src/components/EvidenceStatus.tsx`
- Modify: `src/components/SampleDistribution.tsx`
- Modify: `src/components/SampleDistribution.test.tsx`
- Modify: `src/components/EvidenceDrawer.tsx`
- Modify: `src/components/EvidenceDrawer.test.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/HomePage.test.tsx`
- Modify: `src/pages/QualityPage.tsx`
- Create: `src/pages/QualityPage.test.tsx`
- Modify: `src/pages/CategoryPage.tsx`
- Modify: `src/pages/CategoryPage.test.tsx`

### 2.1 Define stable presentation adapters with RED tests

- [ ] Add failing tests for adapters that translate structured states rather than arbitrary prose:

```ts
presentSourceKind(language, sourceKind, status)
presentModuleAvailability(language, availability)
presentImportStatus(language, status)
presentIssueCode(language, issueCode)
presentKnownField(language, field)
presentCategoryStatus(language, status)
```

- [ ] Assert known issue codes/fields have localized explanations while `field`, `badValue`, raw reason, file name, and row number remain unchanged in trace detail.
- [ ] Assert unknown diagnostics render a localized `Untranslated technical detail` label plus the exact original text. Never hide or machine-translate unknown content.
- [ ] Run `pnpm vitest run src/i18n/presenters.test.ts` and record the valid missing-module RED.

### 2.2 Implement adapters and extend both dictionaries atomically

- [ ] Add Home, import, Quality, Category, evidence, metric, distribution, table, status, and accessibility keys to English and Chinese in the same edit.
- [ ] Keep stable domain values unchanged; adapter return values are presentation strings only.
- [ ] Implement exhaustive switches with `assertNever` so new domain states cause TypeScript/test failures.

```ts
export function presentSourceKind(language: Language, source: SourceKind | null, status: ResearchStatus) {
  if (source === "demo") return translate(language, "source.demo");
  if (source === "user_upload") return translate(language, "source.userUpload");
  if (status === "loading") return translate(language, "source.loading");
  return translate(language, "source.none");
}
```

### 2.3 Localize shared components without translating evidence

- [ ] Replace system literals in every shared component listed above with `t(...)` or a presenter call.
- [ ] Preserve component props carrying source text. For example, `MetricCard` translates its own evidence label but does not mutate caller-provided value/source evidence.
- [ ] `IssueTable` must remain one semantic `<table>` and retain all five narrow-layout data labels. Translate labels/caption but keep file, row, field token, bad value, and raw reason exact.
- [ ] `EvidenceDrawer` translates headings and known statuses, not product titles, brands, IDs, dates from source, URLs, or evidence values.
- [ ] `SampleDistribution` uses locale formatters for counts/percentages while preserving band order, exact counts, zero rows, and numeric progress values.

### 2.4 Localize Home, Quality, and Category with real integration coverage

- [ ] Translate every system-owned page title, description, section heading, action, empty state, limit, link name, status, form label, and accessible name in the three pages.
- [ ] Keep the file input accept contract `.csv`, CSV field names, selected file names, imported titles/brands, and all source evidence unchanged.
- [ ] Add a real Home -> successful import -> Quality/Category integration test, switch to Chinese, and assert:
  - route stays unchanged;
  - user-upload dataset and counts remain;
  - selected filenames/source values remain exact;
  - Chinese headings/actions appear;
  - switching back restores approved English copy.
- [ ] Add failed-import coverage proving Chinese diagnostics appear but the raw bad value, field token, file name, and original technical reason remain traceable.
- [ ] Add Category coverage for localized USD/count/date/percentage presentation while product IDs and brand labels are unchanged.
- [ ] Add forbidden-claim assertions in both languages; do not introduce sales, market share, demand, or recommendation claims.

Run:

```bash
pnpm vitest run \
  src/i18n/messages.test.ts \
  src/i18n/presenters.test.ts \
  src/components/DataSourceBadge.test.tsx \
  src/components/IssueTable.test.tsx \
  src/components/MetricCard.test.tsx \
  src/components/SampleDistribution.test.tsx \
  src/components/EvidenceDrawer.test.tsx \
  src/pages/HomePage.test.tsx \
  src/pages/QualityPage.test.tsx \
  src/pages/CategoryPage.test.tsx
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

Expected: focused and full suites pass; standard build succeeds; frozen install changes neither manifest nor lockfile.

- [ ] Commit only LANG-02 files:

```bash
git add src/i18n/presenters.ts src/i18n/presenters.test.ts src/i18n/messages.ts src/i18n/messages.test.ts \
  src/components/PageHeader.tsx src/components/DataSourceBadge.tsx src/components/DataSourceBadge.test.tsx \
  src/components/ImportPanel.tsx src/components/ImportResultSummary.tsx \
  src/components/IssueTable.tsx src/components/IssueTable.test.tsx \
  src/components/MetricCard.tsx src/components/MetricCard.test.tsx src/components/MetricStrip.tsx \
  src/components/ModuleStatus.tsx src/components/StatusBanner.tsx src/components/EvidenceStatus.tsx \
  src/components/SampleDistribution.tsx src/components/SampleDistribution.test.tsx \
  src/components/EvidenceDrawer.tsx src/components/EvidenceDrawer.test.tsx \
  src/pages/HomePage.tsx src/pages/HomePage.test.tsx \
  src/pages/QualityPage.tsx src/pages/QualityPage.test.tsx \
  src/pages/CategoryPage.tsx src/pages/CategoryPage.test.tsx
git commit -m "feat: localize intake quality and category"
```

- [ ] Stop for independent Codex review.

---

## Task LANG-03: Localize Pain Points, Opportunities, and Decision without changing machine contracts

**Files:**

- Modify: `src/i18n/messages.ts`
- Modify: `src/i18n/messages.test.ts`
- Modify: `src/i18n/presenters.ts`
- Modify: `src/i18n/presenters.test.ts`
- Modify: `src/components/PainPointSummaryList.tsx`
- Modify: `src/components/PainPointSummaryList.test.tsx`
- Modify: `src/components/ReviewQueue.tsx`
- Modify: `src/components/ReviewQueue.test.tsx`
- Modify: `src/components/ReviewCorrectionPanel.tsx`
- Modify: `src/components/ReviewCorrectionPanel.test.tsx`
- Modify: `src/components/EconomicsEditor.tsx`
- Modify: `src/components/EconomicsEditor.test.tsx`
- Modify: `src/components/WeightEditor.tsx`
- Modify: `src/components/WeightEditor.test.tsx`
- Modify: `src/components/OpportunityCard.tsx`
- Modify: `src/components/OpportunityCard.test.tsx`
- Modify: `src/components/DecisionStatus.tsx`
- Modify: `src/components/DecisionStatus.test.tsx`
- Modify: `src/components/ValidationPlan.tsx`
- Modify: `src/components/ValidationPlan.test.tsx`
- Modify: `src/pages/PainPointsPage.tsx`
- Modify: `src/pages/PainPointsPage.test.tsx`
- Modify: `src/pages/OpportunitiesPage.tsx`
- Modify: `src/pages/OpportunitiesPage.test.tsx`
- Modify: `src/pages/DecisionPage.tsx`
- Modify: `src/pages/DecisionPage.test.tsx`

### 3.1 Add exhaustive domain-label presenters with RED tests

- [ ] Write failing tests for fixed presentation mappings:

```ts
presentPainPointLabel(language, painPointId)
presentQueueStatus(language, queueStatus)
presentEconomicsField(language, field)
presentEconomicsStatus(language, status)
presentOpportunityDimension(language, dimensionId)
presentRankingStatus(language, rankingStatus)
presentDecisionStatus(language, decisionStatus)
presentEvidenceKind(language, evidenceKind)
```

- [ ] Assert the adapters never alter rule IDs, ruleset versions, phrase offsets, scenario IDs, evidence IDs, ranking enum values, or condition strings.
- [ ] Add all corresponding English/Chinese keys atomically and obtain GREEN.

### 3.2 Localize the Pain Points workbench and preserve source/user text

- [ ] Translate the seven fixed pain-point display labels, summary controls, filter labels, queue headers, selection states, correction controls, help/errors, provenance headings, live-region messages, and no-data state.
- [ ] Preserve review text, review/product IDs, rule phrases, offsets, ruleset versions, source URLs, existing correction reason, and newly typed correction reason exactly.
- [ ] Keep one semantic review table and the current draft/navigation lock behavior.
- [ ] Add a real provider/page test that creates a correction and dirty draft, switches language both ways, and proves correction labels, raw reason, selected review, queue filter, active evidence, and announcement lifecycle remain unchanged.

### 3.3 Localize economics and opportunity comparison without changing numbers

- [ ] Translate scenario display names, input labels, unit help, provenance labels, draft errors, formula explanations, weight labels, ranking status, evidence headings, unknowns, limitations, and buttons.
- [ ] Keep scenario IDs, opportunity IDs, evidence IDs, raw numeric drafts, stored cents/rates, formulas, and all domain results unchanged.
- [ ] Use `formatUsd`, `formatPercent`, `formatCount`, and `formatDate` only where a value is displayed. Do not parse localized numbers; editor input grammar remains the existing dot-decimal contract.
- [ ] Preserve malformed/underflow raw draft behavior and scenario-level calculation blocking.
- [ ] Add a real provider/page test that sets economics values, opportunity weights, invalid raw draft, ranking, and selected evidence; switch languages and prove all state and underlying calculations are identical.

### 3.4 Localize Decision while keeping export byte-stable

- [ ] Translate status copy, validation-plan headings, evidence link labels, limitations, condition controls, print action, export action, and download explanation.
- [ ] Preserve all decision condition strings exactly as typed.
- [ ] Do not localize exported JSON keys, enum values, IDs, evidence text, or user-authored values.
- [ ] Capture the deterministic export before switching, switch to Chinese, capture again, and assert both deep equality after parsing and byte-identical serialized output.

```ts
const englishExport = buildDecisionExport(report);
await user.click(screen.getByRole("button", { name: "切换界面为简体中文" }));
const chineseExport = buildDecisionExport(report);
expect(chineseExport).toBe(englishExport);
```

- [ ] Test current-language print DOM: Chinese page heading/status/limitations are present in print mode, while the source badge and evidence source text remain truthful and unchanged.
- [ ] Assert no translated page introduces forbidden commercial conclusions.

Run:

```bash
pnpm vitest run \
  src/i18n/messages.test.ts \
  src/i18n/presenters.test.ts \
  src/components/PainPointSummaryList.test.tsx \
  src/components/ReviewQueue.test.tsx \
  src/components/ReviewCorrectionPanel.test.tsx \
  src/components/EconomicsEditor.test.tsx \
  src/components/WeightEditor.test.tsx \
  src/components/OpportunityCard.test.tsx \
  src/components/DecisionStatus.test.tsx \
  src/components/ValidationPlan.test.tsx \
  src/pages/PainPointsPage.test.tsx \
  src/pages/OpportunitiesPage.test.tsx \
  src/pages/DecisionPage.test.tsx
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

Expected: all tests pass; export invariance is explicit; no runtime or TypeScript warning is hidden.

- [ ] Commit only LANG-03 files:

```bash
git add src/i18n/messages.ts src/i18n/messages.test.ts src/i18n/presenters.ts src/i18n/presenters.test.ts \
  src/components/PainPointSummaryList.tsx src/components/PainPointSummaryList.test.tsx \
  src/components/ReviewQueue.tsx src/components/ReviewQueue.test.tsx \
  src/components/ReviewCorrectionPanel.tsx src/components/ReviewCorrectionPanel.test.tsx \
  src/components/EconomicsEditor.tsx src/components/EconomicsEditor.test.tsx \
  src/components/WeightEditor.tsx src/components/WeightEditor.test.tsx \
  src/components/OpportunityCard.tsx src/components/OpportunityCard.test.tsx \
  src/components/DecisionStatus.tsx src/components/DecisionStatus.test.tsx \
  src/components/ValidationPlan.tsx src/components/ValidationPlan.test.tsx \
  src/pages/PainPointsPage.tsx src/pages/PainPointsPage.test.tsx \
  src/pages/OpportunitiesPage.tsx src/pages/OpportunitiesPage.test.tsx \
  src/pages/DecisionPage.tsx src/pages/DecisionPage.test.tsx
git commit -m "feat: localize analysis and decision workspace"
```

- [ ] Stop for independent Codex review.

---

## Task LANG-04: End-to-end bilingual acceptance and documentation

**Files:**

- Modify: `e2e/demo-research.spec.ts`
- Modify: `e2e/import-errors.spec.ts`
- Create: `e2e/bilingual-interface.spec.ts`
- Modify: `README.md`
- Create: `docs/evidence/manual-bilingual-acceptance.md`
- Modify only if an acceptance defect is proven: files already allowed by LANG-01 through LANG-03; record every such repair explicitly and add a regression test.

### 4.1 Build a state-preservation E2E path before final copy review

- [ ] Add `e2e/bilingual-interface.spec.ts` with one serial stateful workflow using real application controls:
  1. start fresh and assert English;
  2. load/retain Demo and navigate through all six routes;
  3. create a pain-point correction;
  4. edit economics and opportunity weights;
  5. select evidence and enter decision conditions;
  6. switch to Chinese using keyboard Enter;
  7. revisit all six routes and prove Chinese system copy plus unchanged source/user values;
  8. switch back using keyboard Space and prove state remains;
  9. reload and prove language resets to English while product behavior follows the existing refresh contract.
- [ ] Assert the URL does not change when switching and there is exactly one language button, one page DOM, and one semantic table per existing table contract.
- [ ] Assert no writes to local/session storage and no language cookie.

### 4.2 Complete route, error, export, and print acceptance

- [ ] Extend invalid-import E2E to switch languages after diagnostics appear. Assert localized system explanation plus exact raw file/row/field/bad-value/reason evidence.
- [ ] Verify the same JSON export before and after language switching. Parse it and assert stable English keys/enums.
- [ ] Verify Decision print mode in Chinese preserves Chinese system presentation and truthful source/evidence data.
- [ ] Cover 1440x900 and 900x900 completely. At 390x844, assert only the existing no-horizontal-overflow and single-DOM regressions; do not introduce new mobile behavior.
- [ ] Fail the run on `pageerror`, React warning, act warning, duplicate-key warning, missing-translation error, application console error, and non-favicon resource failure.

Core browser assertion shape:

```ts
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 900, height: 900 },
  { width: 390, height: 844 },
]) {
  await page.setViewportSize(viewport);
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
}
```

### 4.3 Document exact product behavior and evidence limits

- [ ] Update `README.md` with:
  - English default;
  - current-session `中文`/`English` switch;
  - refresh resets English;
  - no browser persistence or translation service;
  - stable English JSON and CSV machine contracts;
  - source/user content remains untranslated;
  - existing local-only and evidence-bound product limits.
- [ ] Create `docs/evidence/manual-bilingual-acceptance.md` separating:
  - automated evidence;
  - real browser evidence;
  - items not manually verified;
  - exact date, HEAD, viewports, routes, commands, observed console/resource events, and port cleanup.
- [ ] Do not claim manual acceptance for anything not directly observed.

### 4.4 Run the complete release gate

- [ ] From a clean dependency state, run in this exact order:

```bash
pnpm vitest run \
  src/i18n/messages.test.ts \
  src/i18n/LanguageContext.test.tsx \
  src/i18n/presenters.test.ts \
  src/components/LanguageSwitcher.test.tsx \
  src/research/ResearchLayout.test.tsx \
  src/pages/HomePage.test.tsx \
  src/pages/QualityPage.test.tsx \
  src/pages/CategoryPage.test.tsx \
  src/pages/PainPointsPage.test.tsx \
  src/pages/OpportunitiesPage.test.tsx \
  src/pages/DecisionPage.test.tsx
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
pnpm exec playwright test
git diff --check
git status --short --branch
```

- [ ] Confirm `package.json` and `pnpm-lock.yaml` are unchanged.
- [ ] Search production code for forbidden persistence/network translation capabilities:

```bash
rg -n "localStorage|sessionStorage|indexedDB|document\.cookie|navigator\.language|fetch\(|axios|OpenAI|translate.*api" src
```

Expected: no bilingual implementation uses these capabilities. Existing unrelated fixture fetches must be reviewed and reported, not misrepresented as translation services.

- [ ] Search for untranslated system literals using a reviewed allowlist for product name, source/user values, technical keys, enums, and test fixtures. Do not accept a blanket regex exclusion.
- [ ] Stop Vite/Playwright-owned processes and verify the development port is released.
- [ ] Commit:

```bash
git add e2e README.md docs/evidence/manual-bilingual-acceptance.md
# Include any proven acceptance repair only with its regression test and recorded scope.
git commit -m "test: complete bilingual interface acceptance"
```

- [ ] Confirm the final worktree is clean and stop for final Codex review. Do not push, deploy, create a PR, or start another product task.

---

## Final self-review checklist

- [ ] Every requirement in the approved design sections 1-10 maps to at least one implementation step and one acceptance assertion above.
- [ ] There are no `TODO`, `TBD`, placeholder translations, blank message values, or English fallback paths.
- [ ] Every `MessageKey` used by runtime code exists in both catalogs; neither catalog has extra keys.
- [ ] Dynamic message parameters are present and source/user values are inserted unchanged.
- [ ] All stable domain types and machine contracts remain owned by existing domain modules; i18n modules contain presentation mapping only.
- [ ] Provider order is `LanguageProvider -> ResearchProvider`; switching cannot reset research state.
- [ ] Export, CSV, route, evidence ID, and enum invariance are directly tested.
- [ ] Browser acceptance covers keyboard switching, route stability, current-language print, two desktop viewports, and the existing 390px no-overflow regression.
- [ ] Each task has one normal commit and an independent review stop.
