# Mercata Lens（商机镜）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在2026-08-13起两周内，完成一个完全免费、本地运行、可演示且可验证的欧美商品机会决策工作台，并沉淀可用于跨境电商AI产品求职的真实作品集证据。

**Architecture:** 使用React单页应用承载六步研究流程，领域计算采用与UI无关的纯TypeScript模块，CSV与内置示例统一转换为版本化`ResearchDataset`。浏览器本地存储研究状态，所有分析结论保留数据来源、公式、规则版本与原始记录引用；Amazon API、网页抓取和AI模型通过范围锁明确排除。

**Tech Stack:** Node.js 22.23.1、pnpm 11.19.0、React 19、TypeScript、Vite、React Router、Papa Parse、Vitest、Testing Library、Playwright、原生CSS/SVG。

## Global Constraints

- 核心功能必须完全免费运行，不需要信用卡、Amazon卖家账号、API Key、付费API、商业模型或本地模型。
- 首版只验证美国市场的宠物饮水机，不得宣称支持全部欧美市场或全部品类。
- 不实现Amazon网页抓取、Amazon生产API、第三方选品数据库、真实卖家后台或自动投放。
- `review_count`只表示评论数量，任何页面、测试数据或文档不得将其描述为销量。
- 示例数据、用户上传数据、用户填写假设和程序推导值必须有不同的来源标签。
- 缺少必要数据时显示“证据不足”，不得生成猜测值或静默忽略错误。
- 产品只输出“继续研究 / 证据不足 / 暂缓”和验证计划，不输出“必卖、爆款、立即进货”。
- 机会评分权重是可修改的产品假设，不得描述为行业标准或销量预测。
- 利润结果必须标明情景和假设；缺少必要成本时不得输出确定贡献利润。
- 每个核心计算先写失败测试，再实现最小逻辑；每个里程碑通过review后才进入下一项。
- WorkBuddy负责代码实施；用户本人必须完成业务口径确认、英文评论人工复核、用户测试、专家访谈与最终答辩。
- 不使用百应或其他公司的客户数据、Prompt、账号、内部指标或未公开材料。

---

## Two-Week Delivery Map

| 日期 | 开发主线 | 用户本人任务 | 当日可验收成果 |
| --- | --- | --- | --- |
| 08-13 | Task 1 项目基线与导航 | 用自己的话复述目标用户、核心任务、范围外能力 | 可运行六步壳、Git基线、README边界 |
| 08-14 | Task 2 数据合同与示例数据 | 审核字段含义与数据来源标记 | 可加载示例数据、类型与schema测试 |
| 08-15 | Task 3 CSV导入与质量检查 | 制作一份含错误的CSV并解释错误影响 | 上传、逐行错误、阻塞/警告门禁 |
| 08-16 | Task 4 品类概览 | 手算一个中位数和一个分布结果 | 可追溯品类统计页 |
| 08-17 | Task 5 评论痛点引擎 | 独立标注第一批25条英文评论 | 痛点频率、原文证据、纠正入口 |
| 08-18 | Task 5复核 | 独立标注第二批25条并计算混淆 | 50条人工复核基线与规则修订记录 |
| 08-19 | Task 6 利润模型 | 解释每项成本及三种情景差异 | 可验证的单位经济模型 |
| 08-20 | Task 7 机会评分 | 亲自解释五维权重及反对证据 | 三机会比较、改权重、无法排序 |
| 08-21 | Task 8 决策报告 | 写第一版继续/暂缓条件 | 可追溯验证计划与导出 |
| 08-22 | Task 9 本地保存与恢复 | 执行一次导出—清空—导入 | 可恢复研究状态、失败不误报保存 |
| 08-23 | Task 10 核心E2E与无障碍 | 按真实用户路径走查并记录卡点 | 两条E2E、键盘/错误状态门禁 |
| 08-24 | Task 11 目标用户测试 | 完成至少3名用户测试 | 测试记录、问题优先级、第一次修订 |
| 08-25 | Task 11 业务校验 | 补足5名用户；争取1名从业者评审 | 业务假设修订与证据边界 |
| 08-26 | Task 12 作品集与答辩 | 完成10分钟中文答辩与60秒英文介绍 | README、案例页、简历bullet、演示脚本 |

时间不足时，按以下顺序砍范围：额外动效 → 非核心图表 → 打印美化 → 第二种导出格式。不得砍数据错误提示、证据回看、利润假设、人工复核、用户测试或作品集真实性说明。

## Ownership and Review Protocol

### WorkBuddy owns

- 按本计划实现代码和测试；
- 每个Task使用独立、清晰的commit；
- 提交实现说明、验证命令与真实输出；
- 在被review驳回时只修已确认问题，不自行扩展范围。

### User must personally own

- 解释产品服务谁、解决什么业务决策；
- 确认字段、指标、权重和利润假设的业务含义；
- 人工复核至少50条英文评论；
- 主持或参与至少5次目标用户测试；
- 记录至少1次业务从业者校验，若两周内无法获得则如实标记未完成；
- 独立讲解一个错误数据案例、一个规则误判和一个被测试推翻的假设；
- 最终答辩中说明本人贡献、WorkBuddy/Codex贡献及未验证结果。

### Codex controller owns

- 在每个Task前给WorkBuddy发送对应任务范围；
- 检查diff、测试、业务口径和范围漂移；
- 不以WorkBuddy自述代替验证；
- 给出`APPROVED`或`CHANGES_REQUESTED`；
- 维护作品集证据边界和两周节奏。

---

## File Map

```text
Mercata Lens/                       # 项目与 Git 根目录
├── AGENTS.md
├── docs/
├── workbuddy/
├── README.md
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── index.html
├── public/
│   └── demo/
│       ├── products.csv
│       └── reviews.csv
├── e2e/
│   ├── demo-research.spec.ts
│   └── import-errors.spec.ts
└── src/
    ├── main.tsx
    ├── app/
    │   ├── App.tsx
    │   ├── routes.tsx
    │   └── styles.css
    ├── domain/
    │   ├── types.ts
    │   ├── schemas.ts
    │   ├── dataset.ts
    │   ├── quality.ts
    │   ├── category.ts
    │   ├── painPoints.ts
    │   ├── economics.ts
    │   ├── opportunities.ts
    │   ├── decision.ts
    │   └── *.test.ts
    ├── data/
    │   ├── demoLoader.ts
    │   ├── csvImport.ts
    │   ├── csvImport.test.ts
    │   ├── storage.ts
    │   └── storage.test.ts
    ├── research/
    │   ├── ResearchContext.tsx
    │   ├── ResearchLayout.tsx
    │   └── useResearch.ts
    ├── pages/
    │   ├── HomePage.tsx
    │   ├── QualityPage.tsx
    │   ├── CategoryPage.tsx
    │   ├── PainPointsPage.tsx
    │   ├── OpportunitiesPage.tsx
    │   └── DecisionPage.tsx
    ├── components/
    │   ├── DataSourceBadge.tsx
    │   ├── EvidenceDrawer.tsx
    │   ├── MetricCard.tsx
    │   ├── StepNavigation.tsx
    │   └── StatusBanner.tsx
    └── fixtures/
        ├── testDataset.ts
        └── invalidCsv.ts
```

每个领域文件只负责一种业务逻辑；页面不得复制中位数、评分、利润或标签规则。

---

### Task 1: Runnable Shell, Scope Boundary, and Git Baseline

**Date:** 2026-08-13

**Files:**
- Create: `package.json`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/routes.tsx`
- Create: `src/app/styles.css`
- Create: `src/research/ResearchLayout.tsx`
- Create: `src/pages/*.tsx`
- Create: `README.md`

**Interfaces:**
- Produces routes: `/`, `/quality`, `/category`, `/pain-points`, `/opportunities`, `/decision`.
- Produces shared step metadata: `RESEARCH_STEPS: ReadonlyArray<{ path: string; label: string; status: "available" | "locked" }>`.
- No domain calculations or sample conclusions are implemented in this task.

- [ ] **Step 1: Scaffold directly inside the explicit project root**

Run:

```bash
cd '/Users/xanthe/Documents/Mercata Lens'
pnpm create vite . --template react-ts
pnpm add react-router-dom papaparse
pnpm add -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @types/papaparse @playwright/test
```

Expected: the app exists directly under `/Users/xanthe/Documents/Mercata Lens`; do not create another nested app directory. Existing `docs/`, `workbuddy/`, and `AGENTS.md` remain untouched.

- [ ] **Step 2: Add the route contract test**

Create a test that asserts all six labels and paths exactly:

```ts
expect(RESEARCH_STEPS.map(({ path }) => path)).toEqual([
  "/",
  "/quality",
  "/category",
  "/pain-points",
  "/opportunities",
  "/decision",
]);
```

- [ ] **Step 3: Run the test and verify RED**

Run: `pnpm vitest run src/app/routes.test.ts`

Expected: FAIL because `RESEARCH_STEPS` does not exist.

- [ ] **Step 4: Implement the six-route shell**

`ResearchLayout` must display:

- Product name: `Mercata Lens` and Chinese name `商机镜`;
- Literal boundary: `Demo scope: US cat water fountains`;
- Literal data warning: `Review count is not sales`;
- Current step and navigation;
- A persistent `Demo data` badge until user imports files.

Each placeholder page must contain one sentence describing its exact responsibility and no fabricated metric.

- [ ] **Step 5: Add README scope statements**

README must state:

```text
Built: local evidence-driven research flow for one validated demo category.
Not built: Amazon scraping/API, AI model, sales prediction, real seller analytics, all-category support.
```

- [ ] **Step 6: Verify the baseline**

Run:

```bash
pnpm test -- --run
pnpm build
pnpm dev
```

Expected: tests and build exit 0; six routes load; no route claims analysis is complete.

- [ ] **Step 7: Initialize Git and commit only the app**

Run inside `/Users/xanthe/Documents/Mercata Lens`:

```bash
git init
git add .
git commit -m "chore: establish opportunity workbench baseline"
```

Do not initialize Git in any parent directory. Git root must be exactly `/Users/xanthe/Documents/Mercata Lens`.

**User evidence gate:** Without reading the spec, explain in under two minutes: target user, two-stage decision, why review count is not sales, and four explicit non-goals.

---

### Task 2: Versioned Data Contracts and Honest Demo Dataset

**Date:** 2026-08-14

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/schemas.ts`
- Create: `src/domain/dataset.ts`
- Create: `src/domain/schemas.test.ts`
- Create: `src/data/demoLoader.ts`
- Create: `src/fixtures/testDataset.ts`
- Create: `public/demo/products.csv`
- Create: `public/demo/reviews.csv`
- Modify: `src/research/ResearchContext.tsx`
- Modify: `src/pages/HomePage.tsx`

**Interfaces:**
- Produces `ProductRecord`, `ReviewRecord`, `DataProvenance`, `ResearchDataset`, `ResearchState`.
- Produces `parseProductRow(row, rowNumber): ParseResult<ProductRecord>`.
- Produces `parseReviewRow(row, rowNumber): ParseResult<ReviewRecord>`.
- Produces `loadDemoDataset(): Promise<ResearchDataset>`.

- [ ] **Step 1: Define exact domain types in a failing consumer test**

The types must include:

```ts
type SourceKind = "demo" | "user_upload";
type EvidenceKind = "observed" | "assumption" | "derived";

interface ProductRecord {
  productId: string;
  title: string;
  brand: string | null;
  priceUsd: number;
  rating: number;
  reviewCount: number | null;
  category: string;
  material: string | null;
  capacity: string | null;
  filterCost: number | null;
  sourceUrl: string;
  observedAt: string;
}

interface ReviewRecord {
  reviewId: string;
  productId: string;
  rating: number;
  reviewText: string;
  reviewDate: string | null;
  verifiedPurchase: boolean | null;
  sourceUrl: string;
}

interface ResearchDataset {
  schemaVersion: 1;
  market: "US";
  currency: "USD";
  category: string;
  sourceKind: SourceKind;
  products: ProductRecord[];
  reviews: ReviewRecord[];
  importedAt: string;
}

interface DataProvenance {
  sourceKind: SourceKind;
  evidenceKind: EvidenceKind;
  sourceUrl: string | null;
  observedAt: string | null;
  note: string;
}

interface ResearchState {
  schemaVersion: 1;
  dataset: ResearchDataset;
  corrections: Record<string, { add: string[]; remove: string[]; reason: string }>;
  economicsByOpportunity: Record<string, EconomicScenario[]>;
  weights: Record<"demand" | "supply_gap" | "economics" | "differentiation" | "risk", number>;
  decisionDraft: { continueConditions: string[]; pauseConditions: string[]; stopConditions: string[] };
  updatedAt: string;
}
```

- [ ] **Step 2: Test strict parsing**

Required test cases:

- price `"29.99"` becomes `29.99`;
- rating `5.1` fails;
- negative review count fails;
- empty optional `verified_purchase` becomes `null`, not `false`;
- invalid URL fails with field name and row number;
- unknown columns are retained only in raw diagnostic output, not domain state.

- [ ] **Step 3: Run RED**

Run: `pnpm vitest run src/domain/schemas.test.ts`

Expected: FAIL because parsing functions do not exist.

- [ ] **Step 4: Implement minimal parsing and versioned dataset**

Use explicit result objects:

```ts
type ParseIssue = {
  row: number;
  field: string;
  code: "required" | "invalid_type" | "out_of_range" | "invalid_format";
  value: unknown;
  message: string;
};

type ParseResult<T> =
  | { ok: true; value: T; warnings: ParseIssue[] }
  | { ok: false; issues: ParseIssue[] };
```

- [ ] **Step 5: Create demo data with explicit provenance**

The demo must contain at least 12 products and 60 English reviews so that three opportunities have evidence. Every row needs a source URL and observed date. If a row is synthetic for demonstration, its URL must use `https://example.com/demo/...` and README must say it is a curated demonstration fixture, not a current Amazon scrape.

- [ ] **Step 6: Display source truth on Home**

The page must show counts, source kind, imported timestamp, category and this literal disclaimer:

```text
Curated demo fixture. It does not represent live Amazon inventory, sales, or current market share.
```

- [ ] **Step 7: Verify and commit**

Run:

```bash
pnpm vitest run src/domain/schemas.test.ts
pnpm test -- --run
pnpm build
git add src public README.md
git commit -m "feat: add versioned research dataset"
```

**User evidence gate:** Review the field glossary and write one sentence for why each of `price_usd`, `rating`, `review_count`, `filter_cost`, `source_url`, and `observed_at` matters.

---

### Task 3: CSV Import and Data Quality Gate

**Date:** 2026-08-15

**Files:**
- Create: `src/data/csvImport.ts`
- Create: `src/data/csvImport.test.ts`
- Create: `src/domain/quality.ts`
- Create: `src/domain/quality.test.ts`
- Create: `src/components/StatusBanner.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/QualityPage.tsx`
- Modify: `src/research/ResearchContext.tsx`

**Interfaces:**
- Produces `importResearchCsv(productsText, reviewsText): ImportResult`.
- Produces `assessQuality(dataset): QualityReport`.
- `QualityReport` contains `blockingIssues`, `warnings`, `moduleAvailability`, and `summary`.

```ts
type ImportResult =
  | { ok: true; dataset: ResearchDataset; warnings: ParseIssue[] }
  | { ok: false; issues: ParseIssue[] };

interface QualityReport {
  blockingIssues: ParseIssue[];
  warnings: ParseIssue[];
  moduleAvailability: Record<AnalysisModule, "available" | "incomplete" | "locked">;
  summary: { validProducts: number; validReviews: number; duplicateProducts: number; duplicateReviews: number };
}
```

- [ ] **Step 1: Write CSV import RED cases**

Tests must cover quoted commas, UTF-8 English text, Windows newlines, duplicate header, empty file, unknown product reference, duplicate ID and row-number reporting.

- [ ] **Step 2: Write quality gate RED cases**

Exact availability rules:

```ts
type AnalysisModule = "category" | "pain_points" | "economics" | "opportunities";

// category requires >= 3 valid products
// pain_points requires >= 10 valid reviews linked to valid products
// economics remains available but incomplete when costs are missing
// opportunities requires category plus pain_points; otherwise locked
```

An outlier is a warning, never silently removed. Use IQR only when there are at least 8 valid prices; otherwise do not label outliers.

- [ ] **Step 3: Run RED tests**

Run:

```bash
pnpm vitest run src/data/csvImport.test.ts src/domain/quality.test.ts
```

Expected: FAIL on missing functions.

- [ ] **Step 4: Implement import and assessment**

Papa Parse handles lexical CSV parsing; domain parsers remain authoritative for business validation. Never accept Papa's inferred numbers directly.

- [ ] **Step 5: Build upload and quality UI**

The UI must:

- accept exactly one products CSV and one reviews CSV;
- show file names before import;
- require explicit `Import and replace current research` confirmation;
- show error file, row, field, bad value and message;
- distinguish blocking errors from warnings by text and icon, not color alone;
- disable navigation only for dependent modules;
- offer sample CSV downloads.

- [ ] **Step 6: Verify with a user-authored bad CSV**

User must create a file containing one invalid rating, one duplicate product ID and one review pointing to an unknown product. WorkBuddy may not create this evidence for the user.

- [ ] **Step 7: Verify and commit**

Run full tests and build, then commit:

```bash
git commit -am "feat: validate research csv imports"
```

If new files exist, stage them explicitly before commit.

**User evidence gate:** Explain which errors block analysis, which only warn, and why an outlier must remain visible.

---

### Task 4: Traceable Category Overview

**Date:** 2026-08-16

**Files:**
- Create: `src/domain/category.ts`
- Create: `src/domain/category.test.ts`
- Create: `src/components/MetricCard.tsx`
- Create: `src/components/DataSourceBadge.tsx`
- Create: `src/components/EvidenceDrawer.tsx`
- Modify: `src/pages/CategoryPage.tsx`

**Interfaces:**
- Produces `analyzeCategory(dataset): CategoryAnalysis`.
- `CategoryAnalysis` exposes `productCount`, `medianPrice`, `priceBands`, `ratingBands`, `reviewCountBands`, `brandShares`, `attributeCoverage`, `evidence`, `limitations`, and `status`.

- [ ] **Step 1: Write exact statistic tests**

Use a fixed six-product fixture and assert:

```ts
expect(result.medianPrice).toBe(29.5);
expect(result.priceBands.reduce((sum, band) => sum + band.count, 0)).toBe(6);
expect(result.brandShares[0]).toEqual({ brand: "AquaPet", count: 2, share: 2 / 6 });
```

Also test even/odd median, null review count exclusion, same-price samples and no-data status.

- [ ] **Step 2: Run RED**

Run: `pnpm vitest run src/domain/category.test.ts`

- [ ] **Step 3: Implement deterministic analysis**

Use fixed price-band definitions derived from the current sample quartiles and expose their boundaries in the result. Never call a low-count band “low competition”; label it only as “fewer products in this sample”.

- [ ] **Step 4: Build category UI**

Required visual elements:

- metric cards with calculation explanations;
- price and rating distributions;
- brand sample share;
- attribute completeness;
- evidence drawer listing included product IDs;
- limitations panel;
- status: `continue_research | insufficient_evidence | pause`.

No chart may use a truncated axis without a visible axis label.

- [ ] **Step 5: User manual calculation**

User manually calculates median price and one band count from six visible records and compares them with the app. Save the written calculation under `docs/evidence/manual-category-check.md`.

- [ ] **Step 6: Verify and commit**

Run focused/full tests and build. Commit `feat: add traceable category overview`.

---

### Task 5: Rule-Based Pain Point Evidence and Human Corrections

**Dates:** 2026-08-17 to 2026-08-18

**Files:**
- Create: `src/domain/painPoints.ts`
- Create: `src/domain/painPoints.test.ts`
- Create: `src/domain/painPointRules.ts`
- Create: `src/domain/painPointRules.test.ts`
- Modify: `src/pages/PainPointsPage.tsx`
- Modify: `src/research/ResearchContext.tsx`
- Create: `docs/evidence/review-audit.csv`
- Create: `docs/evidence/review-rule-changelog.md`

**Interfaces:**
- Produces `PAIN_POINT_RULESET_VERSION = "1.0.0"`.
- Produces `classifyReview(review, corrections): ReviewClassification`.
- Produces `summarizePainPoints(dataset, corrections): PainPointSummary[]`.
- Corrections map `reviewId` to explicitly added/removed labels and persist in research state.

- [ ] **Step 1: Define label and rule contracts**

```ts
type PainPointId =
  | "hard_to_clean"
  | "noise"
  | "leakage"
  | "pump_lifetime"
  | "filter_cost"
  | "capacity"
  | "pet_acceptance";

interface PainPointRule {
  id: PainPointId;
  labelZh: string;
  includePhrases: string[];
  excludePhrases: string[];
}
```

- [ ] **Step 2: Write RED for phrase boundaries and conflicts**

Required cases:

- `hard to clean` → `hard_to_clean`;
- `not noisy` must not be classified as a noise complaint;
- `pump died after two months` → `pump_lifetime`;
- one review can match cleaning and filter cost;
- manual removal overrides rule match;
- manual addition can add an otherwise missed label;
- empty review produces no labels.

- [ ] **Step 3: Run RED**

Run: `pnpm vitest run src/domain/painPointRules.test.ts src/domain/painPoints.test.ts`

- [ ] **Step 4: Implement normalized phrase matching**

Normalize case, punctuation and repeated whitespace. Do not add stemming or pretend semantic equivalence. Every match returns the exact phrase span and rule ID.

- [ ] **Step 5: Build evidence-first UI**

For every pain point show:

- matched review count;
- percentage of valid reviews;
- distinct product coverage;
- source English text;
- product, rating and URL;
- matched phrase;
- rule version;
- manual add/remove controls with a required reason.

- [ ] **Step 6: User audits 50 reviews personally**

`docs/evidence/review-audit.csv` columns:

```text
review_id,system_labels,human_labels,outcome,notes,auditor,date
```

`outcome` must be one of `correct`, `false_positive`, `missed_label`, `unclear`. WorkBuddy may prepare the blank file and sampling order but may not fill human labels or outcomes.

- [ ] **Step 7: Calculate the real audit baseline**

Record counts, not a cherry-picked percentage. If the rules are weak, document and revise them. Every change goes into `review-rule-changelog.md` with before/after examples.

- [ ] **Step 8: Verify and commit**

Commit code and blank evidence template first. Commit user-completed audit separately as `docs: record review classification audit` so authorship and chronology remain clear.

---

### Task 6: Unit Economics with Three Honest Scenarios

**Date:** 2026-08-19

**Files:**
- Create: `src/domain/economics.ts`
- Create: `src/domain/economics.test.ts`
- Modify: `src/pages/OpportunitiesPage.tsx`
- Create: `src/components/EconomicsEditor.tsx`

**Interfaces:**
- Produces `EconomicInputs`, `EconomicScenario`, `EconomicResult`.
- Produces `calculateContribution(inputs): EconomicResult`.
- Monetary values are integer cents internally; percentages are decimal fractions.

- [ ] **Step 1: Define cost contract**

```ts
interface EconomicInputs {
  salePriceCents: number | null;
  sourcingCostCents: number | null;
  inboundFreightCents: number | null;
  referralFeeRate: number | null;
  fulfillmentCostCents: number | null;
  advertisingCostCents: number | null;
  returnLossCents: number | null;
  otherCostCents: number | null;
}

interface EconomicScenario {
  id: "pessimistic" | "base" | "optimistic";
  label: string;
  inputs: EconomicInputs;
  provenance: Record<keyof EconomicInputs, DataProvenance | null>;
}
```

- [ ] **Step 2: Write RED for complete, incomplete and invalid inputs**

Assert exact cents, margin percentage, missing field list, negative input rejection and referral fee rounding. Use a known case where sale price is `$39.99`.

- [ ] **Step 3: Implement cents-based calculation**

The result is:

```ts
type EconomicResult =
  | { status: "complete"; contributionCents: number; marginRate: number; assumptions: string[] }
  | { status: "incomplete"; missingFields: Array<keyof EconomicInputs>; partialKnownCostsCents: number }
  | { status: "invalid"; issues: string[] };
```

- [ ] **Step 4: Build pessimistic/base/optimistic editor**

No scenario may inherit a hidden value. The UI shows each assumption, source label and sensitivity contribution. Default demo values must say `Demo assumption`, not `market cost`.

- [ ] **Step 5: User explains each cost**

User records a one-page glossary: what the cost means, who supplies it in real business, and what happens if the estimate is wrong.

- [ ] **Step 6: Verify and commit**

Commit `feat: model transparent unit economics` after focused/full tests and build.

---

### Task 7: Opportunity Scoring, Weight Editing, and No-Forced-Winner Logic

**Date:** 2026-08-20

**Files:**
- Create: `src/domain/opportunities.ts`
- Create: `src/domain/opportunities.test.ts`
- Modify: `src/pages/OpportunitiesPage.tsx`
- Create: `src/components/WeightEditor.tsx`
- Create: `src/components/OpportunityCard.tsx`

**Interfaces:**
- Produces `Opportunity`, `OpportunityDimension`, `OpportunityScore`, `RankingResult`.
- Produces `scoreOpportunity(opportunity, weights): OpportunityScore`.
- Produces `rankOpportunities(scores, tieThreshold): RankingResult`.

- [ ] **Step 1: Define dimension and source contract**

Each dimension score is 0–100 and contains evidence references:

```ts
interface DimensionScore {
  dimension: "demand" | "supply_gap" | "economics" | "differentiation" | "risk";
  value: number | null;
  evidenceIds: string[];
  reasoning: string;
  evidenceKind: EvidenceKind;
}

type OpportunityDimension = DimensionScore["dimension"];

interface Opportunity {
  id: "easy_clean" | "quiet_durable" | "low_consumables";
  name: string;
  targetUser: string;
  scenario: string;
  dimensions: DimensionScore[];
  economics: EconomicScenario[];
  supportEvidenceIds: string[];
  oppositionEvidenceIds: string[];
  unknowns: string[];
}

type OpportunityScore =
  | { status: "complete"; opportunityId: Opportunity["id"]; total: number; contributions: Record<OpportunityDimension, number> }
  | { status: "incomplete"; opportunityId: Opportunity["id"]; missingDimensions: OpportunityDimension[] };

type RankingResult =
  | { status: "winner"; opportunityId: Opportunity["id"]; scores: OpportunityScore[] }
  | { status: "no_clear_winner"; candidateIds: Opportunity["id"][]; scores: OpportunityScore[] }
  | { status: "incomplete"; scores: OpportunityScore[] };
```

- [ ] **Step 2: Write RED for weight and ranking rules**

Rules:

- weights must sum to 100;
- missing dimension makes the weighted result `incomplete`, not zero;
- default weights are 30/25/20/15/10;
- user weights are marked customized;
- if top two complete scores differ by fewer than 3 points, result is `no_clear_winner`;
- a complete score cannot outrank an incomplete score by pretending missing values are zero.

- [ ] **Step 3: Implement pure scoring and ranking**

Never derive demand or supply gap solely from review count. Demo opportunity inputs are explicit curated assumptions linked to pain-point and product evidence.

- [ ] **Step 4: Build three-opportunity comparison**

Use exact candidates:

- Easy-clean design;
- Quiet and durable design;
- Low consumables cost design.

Every card shows support, opposition, unknowns, economics and score explanation. Add a visible `Scoring model is a configurable hypothesis` label.

- [ ] **Step 5: User performs weight challenge**

User must answer: Why is demand 30 rather than 50? What changes when economics increases? Which ranking remains stable? Save under `docs/evidence/weight-sensitivity.md`.

- [ ] **Step 6: Verify and commit**

Commit `feat: compare evidence-linked opportunities`.

---

### Task 8: Decision Report and Validation Plan

**Date:** 2026-08-21

**Files:**
- Create: `src/domain/decision.ts`
- Create: `src/domain/decision.test.ts`
- Modify: `src/pages/DecisionPage.tsx`
- Create: `src/components/DecisionStatus.tsx`
- Create: `src/components/ValidationPlan.tsx`

**Interfaces:**
- Produces `buildDecisionReport(input): DecisionReport`.
- Decision statuses: `continue_research | insufficient_evidence | pause`.
- Ranking can be `winner | no_clear_winner | incomplete`.

- [ ] **Step 1: Write RED for decision truth table**

At minimum:

```text
blocking quality issue -> insufficient_evidence
pain point module unavailable -> insufficient_evidence
all economics incomplete -> insufficient_evidence
complete top score + no blocking issue -> continue_research
top two within tie threshold -> continue_research + no_clear_winner
explicit risk stop condition met -> pause
```

- [ ] **Step 2: Implement report composition**

The report contains:

```ts
interface DecisionReport {
  status: "continue_research" | "insufficient_evidence" | "pause";
  ranking: RankingResult;
  supportEvidenceIds: string[];
  oppositionEvidenceIds: string[];
  assumptions: string[];
  missingData: string[];
  nextActions: Array<{ owner: string; action: string; evidenceExpected: string }>;
  continueConditions: string[];
  pauseConditions: string[];
  stopConditions: string[];
  limitations: string[];
}

interface DecisionInput {
  quality: QualityReport;
  painPointsAvailable: boolean;
  ranking: RankingResult;
  economics: Record<Opportunity["id"], EconomicResult[]>;
  supportEvidenceIds: string[];
  oppositionEvidenceIds: string[];
  assumptions: string[];
  missingData: string[];
  userConditions: ResearchState["decisionDraft"];
  triggeredStopConditions: string[];
}

function buildDecisionReport(input: DecisionInput): DecisionReport;
```

- [ ] **Step 3: Build report UI and trace links**

Every evidence ID opens the original record or calculation explanation. Print stylesheet must keep Demo and limitation labels. Do not add an AI-written executive summary.

- [ ] **Step 4: Add JSON export**

Export includes schema version, research state, ruleset version, weights, corrections, assumptions and report. It must not export browser-internal keys.

- [ ] **Step 5: User writes initial business thresholds**

The user writes continue/pause/stop conditions before seeing the final score, then records whether the app result changed their view. This becomes portfolio evidence against hindsight bias.

- [ ] **Step 6: Verify and commit**

Commit `feat: generate evidence-based validation plans`.

---

### Task 9: Local Persistence, Import/Export, and Recovery

**Date:** 2026-08-22

**Files:**
- Create: `src/data/storage.ts`
- Create: `src/data/storage.test.ts`
- Modify: `src/research/ResearchContext.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/components/StatusBanner.tsx`

**Interfaces:**
- Produces `saveResearch(state): SaveResult`.
- Produces `restoreResearch(): RestoreResult`.
- Produces `exportResearch(state): string`.
- Produces `importResearch(json): ImportResearchResult`.

```ts
type SaveResult = { ok: true; savedAt: string } | { ok: false; reason: "unavailable" | "quota" | "serialization" };
type RestoreResult = { ok: true; state: ResearchState } | { ok: false; reason: "missing" | "invalid_json" | "schema_mismatch" | "invalid_state" };
type ImportResearchResult = { ok: true; state: ResearchState } | { ok: false; issues: string[] };
```

- [ ] **Step 1: Write RED for persistence boundaries**

Test valid restore, schema mismatch, malformed JSON, partial write, localStorage unavailable, quota failure, export round trip and corrupt correction references.

- [ ] **Step 2: Implement versioned storage**

Use one explicit key: `opportunity-workbench:research:v1`. Validate the entire envelope before returning state. Invalid storage falls back to no active research and shows a recoverable error; it must not partially hydrate.

- [ ] **Step 3: Implement truthful save UI**

Show `Saved locally` only after successful `setItem`. On failure show `Not saved — export your research to avoid losing work` and keep an enabled export action.

- [ ] **Step 4: Add reset with confirmation**

Reset clears only this app's exact storage key and returns to demo selection. Never call `localStorage.clear()`.

- [ ] **Step 5: User recovery drill**

User exports a research, resets local state, imports the file, and confirms weights, corrections, economics and decision match. Record result under `docs/evidence/recovery-drill.md`.

- [ ] **Step 6: Verify and commit**

Commit `feat: persist and recover local research`.

---

### Task 10: Core E2E, Error Path, and Accessibility Gate

**Date:** 2026-08-23

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/demo-research.spec.ts`
- Create: `e2e/import-errors.spec.ts`
- Modify: `src/app/styles.css`
- Modify: relevant components only when an evidenced accessibility defect exists

**Interfaces:**
- Protects complete demo flow and invalid import flow.
- Does not test external network services because none exist.

- [ ] **Step 1: Write the demo research E2E**

Exact flow:

```text
open home
load demo research
see Demo data and review-count warning
pass quality page
view category evidence
open one English review
apply one manual correction
edit base economics
change one scoring weight and restore defaults
reach decision report
export research
```

- [ ] **Step 2: Write invalid import E2E**

Upload fixture files containing invalid rating and unknown product reference. Assert file, row, field and blocking status appear; dependent opportunity route remains locked.

- [ ] **Step 3: Configure console-clean failure behavior**

Both specs fail on application `console.error` and `pageerror`. Do not ignore arbitrary browser errors.

- [ ] **Step 4: Verify keyboard and semantics**

Check visible focus, logical step navigation, form labels, table headers, text alternatives for status and that color is not the only error indicator. Fix only reproduced issues.

- [ ] **Step 5: Run full gates**

```bash
pnpm lint
pnpm test -- --run
pnpm build
pnpm exec playwright test
```

Expected: all exit 0 with no skipped core spec.

- [ ] **Step 6: Commit**

Commit `test: protect the complete research decision flow`.

---

### Task 11: User Research, Business Review, and Product Revision

**Dates:** 2026-08-24 to 2026-08-25

**Files:**
- Create: `docs/research/usability-script.md`
- Create: `docs/research/session-template.md`
- Create: `docs/research/session-01.md` through `session-05.md`
- Create: `docs/research/business-review.md`
- Create: `docs/research/findings.md`
- Modify: product code only for prioritized evidenced findings

**Interfaces:**
- Produces user-test evidence and a ranked product backlog.
- Does not convert participant opinion into proven market demand.

- [ ] **Step 1: Prepare a neutral test script**

Task prompt:

```text
You are considering the US cat-water-fountain category. Use this workbench to decide which of three positioning ideas deserves further research, or conclude that the evidence cannot distinguish them. Explain the evidence you used and your next action.
```

Do not tell users which opportunity the product currently ranks first.

- [ ] **Step 2: Run at least five sessions**

For every session record participant background, duration, completion, wrong interpretations, evidence opened, confidence before/after and verbatim feedback under 25 words per quote. Obtain consent before recording identifying details; otherwise anonymize.

- [ ] **Step 3: Seek one or two business reviews**

Ask a cross-border operator or seller to check scoring dimensions, missing costs, misleading public indicators and required pre-sourcing evidence. If no reviewer is available by 08-25, write `Not completed — no qualified reviewer available` rather than inventing a review.

- [ ] **Step 4: Prioritize findings**

`findings.md` table:

```text
finding | evidence count | severity | affects decision? | proposed change | accepted/rejected | reason
```

- [ ] **Step 5: Implement only top decision-blocking fixes**

Every accepted code change requires a regression test. Cosmetic preferences do not outrank evidence comprehension or calculation correctness.

- [ ] **Step 6: Re-run gates and commit**

Commit user research documents separately from code revision so it is clear which change followed which evidence.

**User evidence gate:** User personally presents one assumption that testing disproved and explains the resulting product change.

---

### Task 12: Portfolio, Resume Evidence, and Independent Defense

**Date:** 2026-08-26

**Files:**
- Modify: `README.md`
- Create: `docs/portfolio/case-study.md`
- Create: `docs/portfolio/demo-script.md`
- Create: `docs/portfolio/interview-qa.md`
- Create: `docs/portfolio/resume-bullets.md`
- Create: `docs/portfolio/contribution-log.md`

**Interfaces:**
- Produces public-safe portfolio content derived only from verified project evidence.
- Does not claim production launch or business lift.

- [ ] **Step 1: Reconcile README with shipped behavior**

README must cover:

- target user and decision;
- exact two-command local run;
- demo dataset provenance;
- built/cut rationale;
- formulas and scoring caveat;
- user research count and actual findings;
- known limitations;
- WorkBuddy/Codex assistance;
- next business validation step.

- [ ] **Step 2: Write case study using evidence states**

Every major statement is tagged in prose as one of:

- Verified by calculation/test;
- Supported by user research;
- Product hypothesis;
- Not yet validated.

- [ ] **Step 3: Create a 7-minute demo script**

Script order:

```text
problem and user
data truth and quality gate
category evidence
English review evidence and one correction
economics assumptions
three opportunities and weight sensitivity
decision and next experiment
limitations and contribution split
```

- [ ] **Step 4: Create interview Q&A**

At minimum answer:

1. Why not scrape Amazon?
2. Why is review count not sales?
3. Why use rules rather than an LLM?
4. Why are the weights not an industry standard?
5. What evidence supports the chosen opportunity?
6. What evidence argues against it?
7. Which assumption did user testing overturn?
8. What would production data integration look like?
9. What did you personally decide and verify?
10. What did WorkBuddy and Codex produce?

- [ ] **Step 5: Prepare truthful resume bullets**

Allowed draft structure:

```text
Designed and validated a local US product-opportunity research workbench for novice cross-border sellers, integrating CSV quality gates, traceable English-review evidence, configurable opportunity scoring, and three-scenario unit economics.

Conducted manual audit of 50 English reviews and usability tests with N target/adjacent users; corrected [verified rule/product issue] and documented unvalidated sales, margin, and market assumptions.
```

Replace `N` and bracketed text only with actual evidence. Do not write improvement percentages unless directly measured.

- [ ] **Step 6: Independent defense gate**

User presents for 10 minutes without reading the case study. Codex scores business understanding, data logic, AI boundary, product judgment and evidence honesty. Any section the user cannot explain becomes a learning task before resume publication.

- [ ] **Step 7: Final verification and commit**

Run fresh lint/test/build/E2E. Check all public docs for Amazon partnership claims, live data claims, sales/ROAS uplift and all-category support. Commit `docs: publish verified opportunity workbench case study`.

---

## WorkBuddy Task Packet Template

For each Task, Codex sends WorkBuddy only the relevant section plus this wrapper:

```text
Implement Task N only from the approved implementation plan.

Before editing:
1. Read the design, Global Constraints, File Map, and Task N in full.
2. Report the exact starting Git status and current HEAD.
3. Do not modify training files or implement later tasks.

Execution:
1. Follow RED → GREEN → focused tests → full tests → build.
2. Keep business calculations in domain modules, never inline in pages.
3. Preserve demo/source/assumption/derived labels.
4. If the plan is ambiguous or conflicts with the current code, stop and report the conflict; do not invent a product rule.

Handoff:
1. List changed files and behavior.
2. Provide exact commands and exit results.
3. State remaining limitations and any assumptions.
4. Create one ordinary commit with the task's specified message.
5. Do not merge, push, deploy, scrape Amazon, add an API, or start Task N+1.
```

## Review Gates after Every WorkBuddy Handoff

Codex must verify:

1. The diff stays inside the Task file boundary or explains an unavoidable shared-file change.
2. Test evidence includes an actual prior RED for new domain behavior.
3. No page duplicates domain formulas.
4. Demo values remain labelled and no business result is fabricated.
5. Missing data fails closed.
6. Accessibility and error copy are truthful.
7. `pnpm test -- --run` and `pnpm build` are freshly run.
8. Git status is clean after the task commit.

Verdicts:

- `APPROVED`: task is independently testable, truthful and within scope.
- `CHANGES_REQUESTED`: list only reproducible blocking/important findings with exact file and behavior.
- `NEEDS_CONTEXT`: the checkout, design or task boundary does not match; no code changes until corrected.

## Final Completion Criteria

The two-week sprint is complete only when:

- Six-step demo flow works locally with no paid dependency;
- Demo and uploaded CSV paths both work;
- Bad data is surfaced with row/field evidence;
- Category, pain point, economics, opportunity and decision calculations have tests;
- At least 50 English reviews have a genuine human audit;
- At least five user sessions are recorded, or the exact shortfall is disclosed;
- Business review is recorded or honestly marked unavailable;
- One research export/recovery drill passes;
- Full lint, unit, build and Playwright gates pass freshly;
- README and portfolio distinguish verified facts, hypotheses and unvalidated outcomes;
- User can independently defend the project and contribution split;
- Resume does not claim Amazon integration, production launch, business uplift or all-category support.
