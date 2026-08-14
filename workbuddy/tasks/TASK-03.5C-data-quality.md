# WorkBuddy Task 3.5C：Data Quality 双分区与完整诊断

日期：2026-08-14
产品：Mercata Lens（商机镜）
项目与 Git 根目录：`/Users/xanthe/Documents/Mercata Lens`
已批准应用 HEAD：`e86acd3d8cc12d0b4a7ae73710ff00bb5aa03066`

## 只实施本任务

在已批准的 Light Slate 外壳和 Research Home 基线上刷新 Data quality 页面，清楚分开：

1. 最新一次导入尝试；
2. 当前仍然有效的研究数据。

失败导入必须展示完整、可追溯的诊断；当前有效数据必须继续展示来源、有效记录数、质量状态和模块可用性。失败尝试不得看起来像当前数据已经被替换或验证成功。

本任务不得开始产品 Task 4 品类统计，不得实现价格图表、品牌统计、痛点分析，也不得执行视觉刷新最终收尾任务。

## 开始前必须完整读取

1. `AGENTS.md`
2. `docs/specs/2026-08-14-mercata-lens-visual-refresh-design.md`
3. `docs/plans/2026-08-14-mercata-lens-visual-refresh-implementation-plan.md` 的 Global Constraints、File Structure 与 Task 3
4. `workbuddy/tasks/TASK-03.5C-data-quality.md`
5. 当前 `src/pages/QualityPage.tsx`
6. 当前 `src/pages/HomePage.test.tsx`
7. 当前 `src/components/PageHeader.tsx`
8. 当前 `src/components/EvidenceStatus.tsx`
9. 当前 `src/components/StatusBanner.tsx`
10. 当前 `src/research/ResearchContext.tsx`，只读以理解合同
11. 当前 `src/domain/types.ts` 与 `src/domain/quality.ts`，只读以理解现有状态
12. 当前 `src/app/styles.css`

开始前报告并核验：

```bash
git rev-parse --show-toplevel
git rev-parse HEAD
git status --short --branch
git merge-base --is-ancestor e86acd3d8cc12d0b4a7ae73710ff00bb5aa03066 HEAD
git merge-base --is-ancestor c0e6f6df77b5d710a08e8684fd73ff848f8bebad HEAD
```

预期：根目录精确正确，HEAD 起始为已批准提交，两个祖先检查退出 `0`，工作树干净。否则停止并报告，不得 reset、stash、覆盖、删除或另建项目。

## 允许范围

允许创建：

- `src/components/IssueTable.tsx`
- `src/components/IssueTable.test.tsx`
- `src/components/ModuleStatus.tsx`
- `src/components/ModuleStatus.test.tsx`：只有在测试提供独立行为价值时才创建

允许修改：

- `src/pages/QualityPage.tsx`
- `src/pages/HomePage.test.tsx`：仅增加真实路由下的 Quality 双分区与完整诊断断言
- `src/app/styles.css`：仅增加或调整本任务 Quality、IssueTable、ModuleStatus 样式
- `src/app/routes.test.tsx`：仅在 Data quality 页面标题或结构直接影响既有断言时最小适配
- `src/research/ResearchLayout.test.tsx`：仅在新 Quality 装配直接影响测试时最小适配，不得弱化外壳或锁定断言

不得修改：

- `package.json`
- `pnpm-lock.yaml`
- `src/main.tsx`
- `src/pages/HomePage.tsx`
- `src/research/ResearchLayout.tsx`
- `src/research/ResearchContext.tsx`
- `src/components/PageHeader.tsx`
- `src/components/EvidenceStatus.tsx`
- `src/components/StatusBanner.tsx`
- `src/data/**`
- `src/domain/**`
- `public/demo/**`
- `README.md`
- `docs/**`
- 其他 `workbuddy/**`
- `AGENTS.md`

如认为必须超出范围，停止并报告，不得自行扩大。

## 业务与证据边界

- 最新导入尝试与当前有效数据是两个不同状态，必须放在不同的、带标题的页面区域中。
- 失败导入只改变 `importState`，不得改变 `dataset`、`sourceKind` 或 `qualityReport`。
- 最新导入失败区域必须显示总问题数，并明确说明当前 Demo data 或 User upload 没有被替换。
- 当前有效数据区域必须显示来源、有效商品数、有效评论证据记录数、阻塞问题、警告和模块可用性。
- `review_count` 与 review records 只表示评论或证据数量，绝不表示销量、客户数或需求。
- 不得在 UI 内复制样本阈值、重新计算质量状态或创造综合质量分。
- 不得从失败导入的坏文件计算或展示任何统计。
- 不得实现价格中位数、价格分布、评分分布、品牌占比、属性覆盖、痛点、经济性或机会评分。

## 组件接口

### IssueTable

```ts
interface IssueTableProps {
  issues: ParseIssue[];
  caption: string;
}

export function IssueTable({ issues, caption }: IssueTableProps): ReactElement;
```

要求：

- 每个问题只渲染一次，不创建一份桌面表格再复制一份手机列表。
- 使用一个语义化 `<table>`，包含可访问 `<caption>`。
- 列固定为 `File`、`Row`、`Field`、`Bad value`、`Reason`。
- 每个 `<tbody>` 行保留 `data-testid="issue-row"`。
- 每个 `<td>` 使用与列名一致的 `data-label`，供窄屏卡片布局显示。
- 文件名显示为 `Products`、`Reviews` 或 `Unknown`。
- `undefined` 显示为 `—`，其他坏值使用 `JSON.stringify`，不得丢失 `0`、`false` 或空字符串。

推荐辅助函数：

```ts
function displayFile(file: ParseIssue["file"]): string {
  return file === "products"
    ? "Products"
    : file === "reviews"
      ? "Reviews"
      : "Unknown";
}

function displayValue(value: unknown): string {
  return value === undefined ? "—" : JSON.stringify(value);
}
```

### ModuleStatus

```ts
interface ModuleStatusProps {
  availability: QualityReport["moduleAvailability"];
}

export function ModuleStatus({ availability }: ModuleStatusProps): ReactElement;
```

只消费现有模块可用性，不得本地推导。固定标签：

```ts
const MODULE_LABEL = {
  category: "Category overview",
  pain_points: "Customer pain points",
  economics: "Economics",
  opportunities: "Opportunity comparison",
} satisfies Record<AnalysisModule, string>;
```

保留现有测试合同：

- `module-category`
- `module-pain_points`
- `module-economics`
- `module-opportunities`

状态必须同时用文字与视觉标记表达：`Available`、`Incomplete`、`Locked`。颜色或 emoji 不得成为唯一信息。

## 测试先行：有效 RED

先创建 `src/components/IssueTable.test.tsx`，再扩展真实路由测试。不得先实现组件。

### IssueTable focused test

使用三个固定问题，至少覆盖 Products、Reviews、字符串坏值和数字坏值。断言：

```tsx
expect(
  screen.getByRole("table", { name: "Latest import issues" }),
).toBeInTheDocument();
expect(screen.getAllByTestId("issue-row")).toHaveLength(3);

const ratingRow = screen.getAllByTestId("issue-row")[0];
expect(within(ratingRow).getByText("Products")).toBeInTheDocument();
expect(within(ratingRow).getByText("4")).toBeInTheDocument();
expect(within(ratingRow).getByText("rating")).toBeInTheDocument();
expect(within(ratingRow).getByText('"bad"')).toBeInTheDocument();
expect(
  within(ratingRow).getByText("Rating must be a plain number."),
).toBeInTheDocument();
```

同时断言五个列标题全部存在，且三个问题在页面正文中各出现一次。

### 真实路由双分区测试

在现有 `src/pages/HomePage.test.tsx` 的三问题失败导入场景中，进入真实 `/quality` 路由后增加：

```tsx
const latestAttempt = screen.getByTestId("latest-import-attempt");
const activeQuality = screen.getByTestId("active-data-quality");

expect(latestAttempt).toHaveTextContent("Latest import attempt");
expect(latestAttempt).toHaveTextContent("3 blocking issues");
expect(latestAttempt).toHaveTextContent("Demo data");
expect(latestAttempt).toHaveTextContent("not replaced");

expect(activeQuality).toHaveTextContent("Active valid dataset");
expect(activeQuality).toHaveTextContent("Demo data");
expect(activeQuality).toHaveTextContent("12");
expect(activeQuality).toHaveTextContent("76");
expect(activeQuality).toHaveTextContent(/No blocking issues in the active dataset/i);

expect(within(latestAttempt).getAllByTestId("issue-row")).toHaveLength(3);
expect(within(activeQuality).queryByTestId("issue-row")).not.toBeInTheDocument();
```

必须继续断言三个问题完整包含：文件、行号、字段、坏值和原因。不要只断言问题数量。

另加或保留以下行为覆盖：

- 未发生导入时，最新导入区域显示 `No import attempted in this session`，不得伪装成功；
- 成功导入时，最新导入区域显示成功状态和导入时间；
- 无有效 dataset 但存在失败导入时，完整诊断仍显示，当前数据区域显示 `No active research data`；
- 低样本 User upload 时，ModuleStatus 继续显示真实 Locked/Incomplete 状态；
- `/quality` 永远可进入，不受依赖模块锁定影响。

先运行：

```bash
pnpm vitest run src/components/IssueTable.test.tsx src/pages/HomePage.test.tsx
```

有效 RED 应来自缺少 `IssueTable` 或缺少 `latest-import-attempt` / `active-data-quality` 分区。不得通过错误 import、挂起 fetch、删除旧断言或破坏测试配置制造 RED。

## Quality 页面组合要求

页面顺序固定为：

1. `PageHeader`；
2. 最新导入尝试；
3. 当前有效数据；
4. 模块可用性。

### PageHeader

复用现有组件：

```tsx
<PageHeader
  eyebrow="Evidence control"
  title="Data quality"
  description="Validate evidence before analysis."
/>
```

不得在 QualityPage 内复制 PageHeader 实现。

### 最新导入尝试

区域必须始终存在：

```tsx
<section
  aria-labelledby="latest-import-title"
  data-testid="latest-import-attempt"
>
```

三种状态：

1. 尚未尝试：明确显示 `No import attempted in this session`。
2. 成功：显示 `Latest import succeeded`、`User upload`、导入时间、商品数和评论证据记录数；说明记录数不代表销量或市场有效性。
3. 失败：使用 `role="alert"` 的错误状态，显示 `Import failed · N blocking issues`、当前来源未被替换，并使用 `IssueTable` 展示完整问题。

失败区域继续保留 `data-testid="latest-import-failure"`，避免弱化既有合同。

### 当前有效数据

区域必须始终存在：

```tsx
<section
  aria-labelledby="active-quality-title"
  data-testid="active-data-quality"
>
```

无 dataset 时显示 `No active research data`，不得渲染伪造的 0 值指标。

有 dataset 时显示：

- `Active valid dataset`；
- `Demo data` 或 `User upload`；
- `summary.validProducts`；
- `summary.validReviews`，标签必须说明是 evidence records；
- `summary.duplicateProducts` 与 `summary.duplicateReviews`；
- 当前 active `blockingIssues` 与 `warnings`；
- 当 active `blockingIssues.length === 0` 时，显示 `No blocking issues in the active dataset`，并说明这不代表市场真实或商业有效。

失败导入的 issues 只能出现在最新尝试区域，不得混入当前有效数据区域。

### 模块可用性

使用 `ModuleStatus`，直接传入：

```tsx
<ModuleStatus availability={qualityReport.moduleAvailability} />
```

不得根据页面上的商品数或评论数重新判断状态。

当 `qualityReport === null` 时，不得合成一份假的 availability；显示 `Module availability cannot be evaluated without active research data`，且不渲染 `ModuleStatus`。

## CSS 与响应式要求

在已有 Light Slate tokens 上实现或调整：

- `.quality-page`
- `.quality-attempt`
- `.quality-active`
- `.quality-summary`
- `.issue-table-wrap`
- `.issue-table`
- `.module-status`
- `.module-status__list`
- `.module-status__item`

要求：

- 最新失败尝试与当前有效数据使用不同标题和明确边界，不能视觉合并。
- 红色只用于失败状态和具体问题，不得让整个当前有效数据区域变红。
- 桌面表格可读，不截断文件、行号、字段、坏值或原因。
- `680px` 以下将同一个 table DOM 的每一行改为卡片式布局；隐藏表头但保留给辅助技术读取。
- 手机卡片必须显示五个 `data-label`，不得依赖横向滚动。
- 长坏值和长原因必须换行，使用安全的 `overflow-wrap` 或等效规则。
- 所有链接和可交互元素保留清晰 `:focus-visible`。
- 不使用渐变、大面积深蓝、综合分数圆环或伪图表。

窄屏实现应遵循：

```css
@media (max-width: 680px) {
  .issue-table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .issue-table tbody,
  .issue-table tr,
  .issue-table td {
    display: block;
    width: 100%;
  }

  .issue-table tr {
    padding: 12px;
    border: 1px solid var(--color-border);
  }

  .issue-table td::before {
    content: attr(data-label);
    display: block;
    color: var(--color-muted);
    font-size: 0.75rem;
  }
}
```

可按现有样式体系调整细节，但不得复制 issues 成第二份移动端 DOM。

## 验证

依次运行：

```bash
pnpm vitest run src/components/IssueTable.test.tsx src/pages/HomePage.test.tsx src/research/ResearchLayout.test.tsx
pnpm vitest run src/pages/HomePage.test.tsx src/research/ResearchLayout.test.tsx src/app/routes.test.tsx src/components/IssueTable.test.tsx
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

dev 人工验证：

1. 桌面约 `1440×900`：最新导入与当前有效数据层级清楚，完整 IssueTable 可读；
2. 手机约 `390×844`：每个问题成为单卡片式行，五个字段标签均可见，无横向溢出；
3. Demo ready 且未尝试导入；
4. 有效 User upload 成功状态；
5. 三问题失败导入：首页仍只有摘要，Quality 显示完整三行诊断；
6. 失败导入后 active Demo data 的 12 商品、76 评论证据记录仍不变；
7. 低样本 User upload 的模块 Locked/Incomplete 状态仍正确；
8. `/quality` 可进入，依赖分析路由仍按原规则锁定；
9. 控制台无运行错误；
10. 停止服务器并确认端口释放。

如当前工具不能真实设置视口并观察渲染，只能如实报告视觉证据缺口，不得以 Mobile Safari User-Agent 或 HTTP 200 代替视觉通过。

## 提交

提交前：

```bash
git diff --name-status
git status --short
```

只创建一个普通提交：

```bash
git add src/components/IssueTable.tsx src/components/IssueTable.test.tsx src/components/ModuleStatus.tsx src/pages/QualityPage.tsx src/pages/HomePage.test.tsx src/app/styles.css
# 如果确实创建了独立测试：git add src/components/ModuleStatus.test.tsx
git commit -m "feat: clarify data quality evidence states"
```

未改文件不要强行加入。不得 amend、push、部署、建 PR。

提交后报告：

```bash
git diff --name-status e86acd3d8cc12d0b4a7ae73710ff00bb5aa03066..HEAD
git status --short --branch
git rev-parse HEAD
```

## 交付格式

必须包含：

1. 项目路径、起始 HEAD、起始状态与祖先检查；
2. 完整读取文件；
3. 真实 RED 命令与失败原因；
4. 改动文件与组件接口；
5. 最新导入尝试和当前有效数据分区证据；
6. 首页失败摘要与 Quality 完整诊断证据；
7. 无 active dataset、成功导入、失败导入和低样本状态；
8. focused、全量测试、build、lint、frozen install、diff check；
9. 桌面与手机真实观察、五字段卡片和无横向溢出；
10. 六路由、locked、控制台与服务器停止证据；
11. 新 commit 的真实完整 SHA；
12. 最终 Git 状态；
13. 明确确认未修改 HomePage、Context、data/domain、依赖和文档，未实现价格/品牌/痛点统计，未开始产品 Task 4，未 push、未部署、未建 PR。
