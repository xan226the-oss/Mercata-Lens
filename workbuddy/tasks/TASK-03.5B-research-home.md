# WorkBuddy Task 3.5B：研究首页信息层级

日期：2026-08-14  
产品：Mercata Lens（商机镜）  
项目与 Git 根目录：`/Users/xanthe/Documents/Mercata Lens`  
已批准应用 HEAD：`b3489c5cc41ed4602bed3f7ce4d501708f0aa386`

## 只实施本任务

在已批准的 Light Slate 外壳内重排 Research project 首页，让用户按 **概览 → 证据 → 下一步行动** 阅读。把现有长文本和完整错误列表改成清晰的指标、证据状态、真实下一步和紧凑导入结果。

本任务不得修改 Data quality 页面，不得开始 Task 3.5C、Task 4 或任何真实品类统计。

## 开始前必须完整读取

1. `AGENTS.md`
2. `docs/specs/2026-08-14-mercata-lens-visual-refresh-design.md`
3. `docs/plans/2026-08-14-mercata-lens-visual-refresh-implementation-plan.md` 的 Global Constraints、File Structure 与 Task 2
4. `workbuddy/tasks/TASK-03.5B-research-home.md`
5. 当前 `src/pages/HomePage.tsx`
6. 当前 `src/pages/HomePage.test.tsx`
7. 当前 `src/research/ResearchLayout.tsx`
8. 当前 `src/research/ResearchContext.tsx`，只读以理解合同
9. 当前 `src/domain/types.ts` 与 `src/domain/quality.ts`，只读以理解现有字段和状态

开始前报告：

```bash
git rev-parse --show-toplevel
git rev-parse HEAD
git status --short --branch
git merge-base --is-ancestor b3489c5cc41ed4602bed3f7ce4d501708f0aa386 HEAD
git merge-base --is-ancestor c0e6f6df77b5d710a08e8684fd73ff848f8bebad HEAD
```

预期：根目录精确正确，两个祖先检查退出 `0`，工作树干净。否则停止并报告，不得 reset、stash、覆盖、删除或另建项目。

## 允许范围

允许创建：

- `src/components/PageHeader.tsx`
- `src/components/MetricStrip.tsx`
- `src/components/EvidenceStatus.tsx`
- `src/components/ImportPanel.tsx`
- `src/components/ImportResultSummary.tsx`
- 为上述组件创建的 focused test 文件，但只创建确有行为价值的测试

允许修改：

- `src/pages/HomePage.tsx`
- `src/pages/HomePage.test.tsx`
- `src/app/styles.css`：仅增加/调整本任务首页与组件样式
- `src/app/routes.test.tsx`：仅在首页标题或结构变化直接影响既有断言时最小适配
- `src/research/ResearchLayout.test.tsx`：仅在新首页装配直接影响测试时最小适配，不得弱化外壳断言

不得修改：

- `package.json`
- `pnpm-lock.yaml`
- `src/main.tsx`
- `src/research/ResearchLayout.tsx`
- `src/research/ResearchContext.tsx`
- `src/pages/QualityPage.tsx`
- `src/components/StatusBanner.tsx`
- `src/data/**`
- `src/domain/**`
- `public/demo/**`
- `README.md`
- `docs/**`
- `workbuddy/**`
- `AGENTS.md`

如认为必须超出范围，停止并报告，不得自行扩大。

## 业务与证据边界

首页本阶段只能展示 Task 3 已有事实：

- 来源；
- 品类；
- 导入时间；
- 商品记录数；
- 评论证据记录数；
- `QualityReport` 已给出的 blocking、warning、summary 与 module availability；
- 下一模块是否可用。

本阶段禁止展示或计算：

- 价格区间、价格中位数、价格分布图；
- 品牌数量或品牌结构；
- 从评论提取的研究主题或痛点；
- 市场规模、销量、需求、GMV、份额、ROAS；
- 综合质量分或机会评分；
- 经济性结论；
- 静态伪造图表或效果图里的示意数字。

必须继续明确：评论是 evidence records，不是客户数或销量。

## 组件接口

### PageHeader

```ts
interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  meta?: ReactNode;
}
```

纯展示组件，不读取 Context。

### MetricStrip

```ts
export interface MetricItem {
  id: "products" | "reviews" | "source" | "updated";
  label: string;
  value: string | number;
  note: string;
}

export function MetricStrip({ items }: { items: MetricItem[] }): ReactElement;
```

每项保留 `data-testid={`metric-${item.id}`}`。

### EvidenceStatus

```ts
export interface EvidenceGate {
  id: string;
  label: string;
  status: "passed" | "warning" | "blocked";
  detail: string;
}

export function EvidenceStatus({ gates }: { gates: EvidenceGate[] }): ReactElement;
```

状态必须由图标、文字和颜色共同表达，不得只有颜色。

### ImportPanel

```ts
interface ImportPanelProps {
  importCsv: (productsText: string, reviewsText: string) => void;
}
```

必须保留：

- `Products CSV` / `Reviews CSV` accessible label；
- `products-file-name` / `reviews-file-name`；
- `import-button`；
- `import-file-error`；
- 原样按钮文案 `Import and replace current research`；
- 两个 sample 下载链接；
- `.csv` 文件名校验；
- 缺任一文件时禁用按钮；
- 文件读取错误不触发导入。

组件状态必须保存真实 `File`：

```tsx
const [productsFile, setProductsFile] = useState<File | null>(null);
const [reviewsFile, setReviewsFile] = useState<File | null>(null);
```

点击导入时直接读取以上两个 File。不得通过 `document.getElementById` 重新获取文件，也不得只保存文件名。

### ImportResultSummary

```ts
interface ImportResultSummaryProps {
  state: ImportOutcomeState;
  sourceLabel: string;
  productCount: number | null;
  reviewCount: number | null;
}
```

首页只展示最新导入结果摘要，不展示完整 issue 列表。

失败时：

```text
Import failed · 3 blocking issues · Current Demo data was not replaced.
```

并提供真实 `/quality` 链接：

```text
Review data quality
```

完整文件、行号、字段、坏值、原因继续由 Quality 页面负责；本任务不得修改 Quality 页面。

成功时显示：

- User upload；
- 商品记录数；
- 评论证据记录数；
- 导入时间；
- 不代表销量、需求或市场份额的边界。

## 测试先行：有效 RED

先修改/增加测试，再运行：

```bash
pnpm vitest run src/pages/HomePage.test.tsx
```

至少新增以下首页断言：

```tsx
expect(screen.getByRole("heading", { name: "Cat Water Fountain research" })).toBeInTheDocument();
expect(screen.getByTestId("metric-products")).toHaveTextContent("12");
expect(screen.getByTestId("metric-reviews")).toHaveTextContent("76");
expect(screen.getByTestId("metric-reviews")).toHaveTextContent(/evidence records/i);
expect(screen.getByTestId("metric-source")).toHaveTextContent("Demo data");
expect(screen.getByTestId("category-analysis-next-step")).toHaveTextContent(/available in Category overview/i);
expect(screen.queryByTestId("price-distribution-chart")).not.toBeInTheDocument();
```

失败导入首页测试必须改为：

```tsx
const summary = await screen.findByTestId("import-error");
expect(summary).toHaveTextContent("3 blocking issues");
expect(summary).toHaveTextContent("Current Demo data was not replaced");
expect(summary).not.toHaveTextContent("products row 4");
expect(screen.getByRole("link", { name: /Review data quality/i })).toHaveAttribute("href", "/quality");
```

现有行为断言必须继续覆盖：

- 两文件选齐前按钮禁用；
- 显示选择的文件名；
- 拒绝非 `.csv`；
- 无数据时不显示 User upload；
- 无效导入保留 Demo；
- 真实路由下 Quality 仍显示完整3问题；
- 低样本真实锁定和路由行为不回归。

RED 必须来自新首页结构/摘要尚未实现，不能来自错误 import、测试配置、fetch 挂起或弱化旧测试。

## 首页组合要求

首页阅读顺序：

1. PageHeader；
2. MetricStrip；
3. evidence readiness；
4. honest next-step；
5. decision cautions；
6. ImportPanel；
7. ImportResultSummary 应靠近 ImportPanel。

### 页面标题

```tsx
<PageHeader
  eyebrow="Market research brief"
  title="Cat Water Fountain research"
  description="Review the active evidence before deciding whether this category deserves deeper investment."
/>
```

### 真实来源标签

```ts
const sourceLabel =
  sourceKind === "demo"
    ? "Demo data"
    : sourceKind === "user_upload"
      ? "User upload"
      : status === "loading"
        ? "Loading data"
        : "No active data";
```

### MetricStrip

dataset 存在时只构造：

```ts
const metrics: MetricItem[] = [
  {
    id: "products",
    label: "Products reviewed",
    value: dataset.products.length,
    note: "Active comparison set",
  },
  {
    id: "reviews",
    label: "Review evidence",
    value: dataset.reviews.length,
    note: "Evidence records — not sales",
  },
  {
    id: "source",
    label: "Data source",
    value: sourceLabel,
    note: "Current active research",
  },
  {
    id: "updated",
    label: "Imported",
    value: new Date(dataset.importedAt).toLocaleDateString(),
    note: "Check observation dates before use",
  },
];
```

禁止增加第五项或把 category、价格、品牌伪装成已分析指标。

### EvidenceStatus

只把现有质量结果映射成展示状态：

```ts
const productBlocking = qualityReport.blockingIssues.some(
  (issue) => issue.file === "products",
);
const reviewBlocking = qualityReport.blockingIssues.some(
  (issue) => issue.file === "reviews",
);

const gates: EvidenceGate[] = [
  {
    id: "identity",
    label: "Identity and references",
    status: productBlocking || reviewBlocking ? "blocked" : "passed",
    detail:
      productBlocking || reviewBlocking
        ? "Resolve blocking record issues"
        : "No identity or reference blocks",
  },
  {
    id: "category-sample",
    label: "Category sample",
    status: productBlocking
      ? "blocked"
      : qualityReport.moduleAvailability.category === "available"
        ? "passed"
        : "warning",
    detail: `${qualityReport.summary.validProducts} valid products`,
  },
  {
    id: "review-sample",
    label: "Review sample",
    status: reviewBlocking
      ? "blocked"
      : qualityReport.moduleAvailability.pain_points === "available"
        ? "passed"
        : "warning",
    detail: `${qualityReport.summary.validReviews} valid review records`,
  },
];
```

不得在 UI 内复制 `>=3`、`>=10` 阈值或重新实现质量判断。

### 下一步面板

在 Task 4 前必须使用诚实状态：

```tsx
<section className="analysis-next-step" data-testid="category-analysis-next-step">
  <span className="section-kicker">Next analysis</span>
  <h2>Price landscape and brand structure</h2>
  <p>Available in Category overview after its tested analysis module is implemented.</p>
</section>
```

不得渲染 `price-distribution-chart`、静态柱状图、价格范围或品牌数。

当 `qualityReport.moduleAvailability.category === "locked"` 时，同一面板必须改为显示当前证据不足和需要补充有效商品；不得提供伪可用链接。当状态为 `available` 时才提供真实 `/category` 链接。

### Decision cautions

集中展示三条：

- Review count is not sales；
- Demo data is not live market data（仅 Demo source）；
- Economics is incomplete until required cost inputs exist。

不要在多个大横幅中重复相同文案。

### 加载和错误状态

- idle/loading：保留可访问的 loading 状态；
- Demo load error：保留具体错误和 Retry；
- 无 dataset 时不得渲染空 MetricStrip 或伪造0值；
- ImportPanel 仍可使用，允许用户通过有效 CSV 建立研究。

## CSS 要求

在已有 Light Slate tokens 上实现：

- `.page-header`
- `.metric-strip`
- `.metric-item`
- `.home-analysis-grid`
- `.analysis-next-step`
- `.evidence-gates`
- `.evidence-gate`
- `.decision-cautions`
- `.import-panel`
- `.import-result-summary`

要求：

- 标题用 Lora；
- 正文、数字、标签用 IBM Plex Sans；
- 指标优先于长文本；
- 不使用渐变；
- 少量边框和低强度阴影；
- `900px` 以下分析区堆叠、指标两列；
- `560px` 以下指标一列；
- 按钮和链接 focus 清楚；
- 不增加大面积深蓝或 AI 风格装饰。

## 验证

依次运行：

```bash
pnpm vitest run src/pages/HomePage.test.tsx src/research/ResearchLayout.test.tsx src/app/routes.test.tsx
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

dev 人工验证：

1. 桌面约 `1440×900`；
2. 手机约 `390×844`，无横向溢出；
3. Demo 首页顺序与四个指标正确；
4. 不存在价格图、品牌统计或已确认痛点；
5. 有效上传仍可替换 Demo；
6. 坏 CSV 在首页仅显示摘要；
7. 进入 Quality 后仍显示完整3问题；
8. 六路由与 locked 行为不回归；
9. 控制台无运行错误；
10. 停止服务器并确认端口释放。

## 提交

提交前：

```bash
git diff --name-status
git status --short
```

只创建一个普通提交：

```bash
git add src/components/PageHeader.tsx src/components/MetricStrip.tsx src/components/EvidenceStatus.tsx src/components/ImportPanel.tsx src/components/ImportResultSummary.tsx src/pages/HomePage.tsx src/pages/HomePage.test.tsx src/app/styles.css src/app/routes.test.tsx src/research/ResearchLayout.test.tsx
git commit -m "feat: reshape the research home experience"
```

未改的文件不要强行加入。不得 amend、push、部署、建 PR。

提交后报告：

```bash
git diff --name-status b3489c5cc41ed4602bed3f7ce4d501708f0aa386..HEAD
git status --short --branch
git rev-parse HEAD
```

## 交付格式

必须包含：

1. 项目路径、起始 HEAD、起始状态、祖先检查；
2. 完整读取文件；
3. 改动文件与行为；
4. RED 真实命令和失败原因；
5. GREEN focused 与全量测试；
6. build、lint、frozen install、diff check；
7. 四指标与证据状态的真实渲染；
8. 首页失败摘要与 Quality 完整诊断的证据；
9. 桌面/手机观察和无横向溢出；
10. 六路由、locked、服务器停止证据；
11. 新 commit 的真实完整 SHA（必须由 `git rev-parse HEAD` 复制，不得手写或猜测）；
12. 最终 Git 状态；
13. 明确确认未修改 Quality/Context/data/domain，未实现价格/品牌/痛点统计，未开始 Task 4，未 push、未部署、未建 PR。
