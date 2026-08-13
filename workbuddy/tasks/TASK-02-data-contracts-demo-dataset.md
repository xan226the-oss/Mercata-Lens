# WorkBuddy Task 2：版本化数据合同与诚实的 Demo 数据集

日期：2026-08-14  
产品：Mercata Lens（商机镜）  
项目与 Git 根目录：`/Users/xanthe/Documents/Mercata Lens`  
已批准的应用基线：`2e24f53361d3890e87bad519a0a4f42fa23fa050`（当前 HEAD 还会包含其后的 Codex 任务单/计划修订提交）

## 只实施本任务

建立版本化领域数据合同、严格的单行解析器、可加载的策展 Demo 数据集及首页来源说明。不要实现 CSV 文件上传、跨行质量检查、统计、痛点分类、利润计算、机会评分、保存或 AI 能力。

开始前必须完整阅读：

1. `AGENTS.md`
2. `docs/specs/2026-08-13-mercata-lens-design.md`
3. `docs/plans/2026-08-13-mercata-lens-implementation-plan.md` 的 Global Constraints、File Map 和 Task 2
4. 本任务单

先报告精确 `git status --short --branch` 和 `git rev-parse HEAD`。工作树必须干净，且上述应用基线必须是当前 HEAD 的祖先；不满足时停止并报告，不能自行重置或覆盖。

## 已裁定的计划歧义

- `src/research/ResearchContext.tsx` 当前不存在，所以本任务是**创建**，不是修改。
- `ResearchState` 引用了原计划在 Task 6 才详细使用的 `EconomicScenario`。本任务仅在 `src/domain/types.ts` 定义 `EconomicInputs` 与 `EconomicScenario` 作为状态合同，使类型完整；不得实现利润公式、默认成本、情景计算或相关 UI。
- `parseProductRow` 与 `parseReviewRow` 只负责**单行字段解析**。重复 ID、评论引用未知商品、样本量和跨行质量规则属于 Task 3，不得提前实现。
- Demo CSV 是人工策展的合成 fixture，不是 Amazon 数据，不得出现 Amazon ASIN、Amazon URL、品牌冒充或任何实时市场声明。

## 文件范围

允许创建：

- `src/domain/types.ts`
- `src/domain/schemas.ts`
- `src/domain/dataset.ts`
- `src/domain/schemas.test.ts`
- `src/data/demoLoader.ts`
- `src/fixtures/testDataset.ts`
- `src/research/ResearchContext.tsx`
- `public/demo/products.csv`
- `public/demo/reviews.csv`

允许修改：

- `src/app/App.tsx`（仅为挂载 ResearchProvider）
- `src/pages/HomePage.tsx`（仅展示 Demo 数据概况、加载和错误状态）
- `README.md`（仅补充 Demo fixture 的来源真相、字段说明和运行说明）

除非测试配置确有必要且先在交付中解释，否则不得修改其他文件。不得修改 `docs/`、`workbuddy/` 或 `AGENTS.md`。

## 领域合同

在 `src/domain/types.ts` 明确定义并导出：

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
```

还需定义 `EconomicInputs`、`EconomicScenario` 和原计划规定的 `ResearchState`，但本任务只提供类型，不提供任何经济计算。

严格使用以下解析结果：

```ts
type ParseIssue = {
  row: number;
  field: string;
  code: "required" | "invalid_type" | "out_of_range" | "invalid_format";
  value: unknown;
  message: string;
};

type ParseResult<T> =
  | { ok: true; value: T; warnings: ParseIssue[]; rawDiagnostics?: Record<string, unknown> }
  | { ok: false; issues: ParseIssue[]; rawDiagnostics?: Record<string, unknown> };
```

`rawDiagnostics` 用于保留未知列，未知列不得进入领域记录或 `ResearchDataset`。若采用不同但等价的诊断字段结构，必须先说明并保持测试明确。

对外接口：

```ts
parseProductRow(row, rowNumber): ParseResult<ProductRecord>
parseReviewRow(row, rowNumber): ParseResult<ReviewRecord>
loadDemoDataset(): Promise<ResearchDataset>
```

## 严格解析规则与有效 RED

先写能成功编译但因目标函数不存在或断言不满足而失败的测试，再实现代码。RED 不得来自文件扩展名、JSX loader、错误 import 或测试配置。

测试至少覆盖：

- 商品价格字符串 `"29.99"` 解析为 `29.99`；
- 商品和评论 `rating` 必须在 1 到 5 之间，`5.1` 失败；
- `review_count` 为非负整数或空值；负数和小数失败，空值转 `null`；
- `filter_cost` 为非负有限数字或空值；
- 评论的空 `verified_purchase` 转 `null`，而不是 `false`；仅接受明确的 true/false 表示，不猜测其他值；
- 必填字段只含空白时按缺失处理；
- URL 必须为有效的 `http://` 或 `https://` URL，错误结果包含精确字段名和 CSV 行号；
- `observed_at` 与非空 `review_date` 必须是有效的 `YYYY-MM-DD` 日历日期；
- 未知列仅保留在 raw diagnostics，不进入领域状态；
- 数字必须是完整、有限的数字，不能接受 `29abc`、`Infinity` 或 `NaN`；
- 输入对象不被解析器修改。

运行并保留真实 RED：

```bash
pnpm vitest run src/domain/schemas.test.ts
```

随后实现最小逻辑转 GREEN。

## Demo 数据真实性

创建：

- 至少 12 个美国宠物饮水机合成商品；
- 至少 60 条英文合成评论；
- 每个商品至少关联一条评论；
- `product_id` 和 `review_id` 唯一；
- 所有评论引用已有商品；
- 商品 `category` 统一使用一个明确值；
- 商品每行具有 `source_url`、`observed_at`；评论每行具有 `source_url`；
- 所有 URL 使用 `https://example.com/demo/...`；
- 文本不得声称来自真实消费者，不复制真实 Amazon 评论；
- 数据内容应覆盖清洗、噪音、漏水、水泵寿命、滤芯成本、容量、宠物接受度等后续研究主题，但这里只保存原始英文文本，不打标签、不输出结论。

Demo loader 必须使用 Papa Parse 读取两个 CSV，并通过当前行解析器生成 `ResearchDataset`。若任何行解析失败，加载应失败并保留可诊断问题，不得静默跳过错误。`sourceKind` 必须为 `demo`，`market` 为 `US`，`currency` 为 `USD`，`schemaVersion` 为 `1`。

为 loader 增加测试，至少验证精确商品/评论数量、唯一性、引用完整性、统一 category、example.com 来源、schema/market/currency/sourceKind。测试可放在允许的新测试文件中；若新增 `src/data/demoLoader.test.ts`，需在交付中列明。

## 首页来源真相

`ResearchContext` 只负责加载并提供 Demo 数据的 `idle | loading | ready | error` 状态，不实现上传、保存或分析。

首页 ready 状态展示：

- 商品数；
- 评论数；
- source kind；
- imported timestamp；
- category；
- 原样免责声明：

```text
Curated demo fixture. It does not represent live Amazon inventory, sales, or current market share.
```

加载中和加载失败必须有可见、真实的界面状态；失败时不得显示伪造的 0 数量或 ready 状态。全局 `Demo data` 徽标继续保留。

README 必须说明 Demo 是人工策展的合成 fixture、不是当前 Amazon 抓取或真实消费者评论，并声明数据只能验证流程，不能证明市场需求、销量或份额。

## 禁止范围

- 不实现用户 CSV 上传或文件选择器；
- 不实现跨行数据质量门禁、重复检测或异常值规则；
- 不计算中位数、分布、痛点频率、利润或机会分数；
- 不实现 localStorage、JSON 导出或恢复；
- 不接后端、数据库、Amazon、第三方 API 或 AI 模型；
- 不新增真实品牌、ASIN、销量、GMV、ROAS或市场份额；
- 不 push、不部署、不创建 PR、不开始 Task 3。

## 验证与提交

依次运行并提供真实输出与退出码：

```bash
pnpm vitest run src/domain/schemas.test.ts
pnpm test -- --run
pnpm build
pnpm lint
```

启动 `pnpm dev`，人工确认首页 ready 状态与六个路由仍可加载，随后正常停止服务器并确认端口释放。

创建一个普通 commit：

```bash
git add src public README.md
git commit -m "feat: add versioned research dataset"
```

提交后 `git status --short` 必须为空。不要 amend Task 1 commits。

## 交付格式

回复必须包含：

1. 本地路径、起始 HEAD 与起始 Git 状态；
2. 改动文件及行为；
3. 有效 RED 的命令、目标失败原因与真实输出摘要；
4. focused/full tests、build、lint、首页与六路由检查的真实结果；
5. Demo 商品/评论精确数量及全部来源说明；
6. 最终 commit SHA 与 `git status --short`；
7. 假设、限制与任何计划偏差；
8. 明确确认未开始 Task 3。

Codex 会独立审查 diff、数据内容、来源边界和测试，不以交付自述代替验证。
