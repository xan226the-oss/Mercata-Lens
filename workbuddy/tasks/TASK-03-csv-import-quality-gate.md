# WorkBuddy Task 3：CSV 导入与数据质量门禁

日期：2026-08-15  
产品：Mercata Lens（商机镜）  
项目与 Git 根目录：`/Users/xanthe/Documents/Mercata Lens`  
已批准应用 HEAD：`a72ef01cf476686efacba933c372db6cea67a339`（当前 HEAD 还会包含其后的 Codex Task 3 任务单提交）

## 只实施本任务

让用户选择一份商品 CSV 和一份评论 CSV，在明确确认后导入；严格展示文件、行、字段、坏值与错误原因；评估重复、未知商品引用、样本量和价格异常值；只锁定依赖不满足的后续模块。不要实现品类统计、痛点规则、利润公式、机会评分、保存或 AI。

开始前完整阅读：

1. `AGENTS.md`
2. `docs/specs/2026-08-13-mercata-lens-design.md`
3. `docs/plans/2026-08-13-mercata-lens-implementation-plan.md` 的 Global Constraints、File Map、Task 3 与 Task 3 clarification
4. 本任务单

先报告 `git status --short --branch`、`git rev-parse HEAD`，并验证上述批准应用 HEAD 是当前 HEAD 的祖先。工作树不干净或祖先关系不成立时停止报告，不得自行 reset、覆盖或另建目录。

## 文件范围

允许创建：

- `src/data/csvImport.ts`
- `src/data/csvImport.test.ts`
- `src/domain/quality.ts`
- `src/domain/quality.test.ts`
- `src/components/StatusBanner.tsx`
- 为本任务 UI 行为创建的 focused test 文件

允许修改：

- `src/domain/types.ts`：仅增加 Task 3 类型和 `ParseIssue.file?`
- `src/pages/HomePage.tsx`
- `src/pages/QualityPage.tsx`
- `src/research/ResearchContext.tsx`
- `src/research/ResearchLayout.tsx`：仅动态数据来源徽标与依赖导航锁定
- `src/app/routes.tsx`：仅在确有必要时保持路由元数据与动态状态兼容
- `src/app/styles.css`
- `README.md`
- 受 Provider 改动直接影响的既有测试

不得修改 `docs/`、`workbuddy/`、`AGENTS.md`、Demo CSV 内容或 Task 2 解析规则，除非发现可复现回归并先停止报告。

## 类型与公共接口

在 `ParseIssue` 增加：

```ts
file?: "products" | "reviews";
```

继续使用已有四种 code，不扩展含义不明的枚举：

- 空文件/缺字段：`required`
- CSV 语法、重复表头、重复 ID、未知引用：`invalid_format`
- 类型错误：`invalid_type`
- 超范围与价格异常值：`out_of_range`

新增并导出：

```ts
type AnalysisModule = "category" | "pain_points" | "economics" | "opportunities";
type ModuleAvailability = "available" | "incomplete" | "locked";

type ImportResult =
  | { ok: true; dataset: ResearchDataset; warnings: ParseIssue[] }
  | { ok: false; issues: ParseIssue[] };

interface QualityReport {
  blockingIssues: ParseIssue[];
  warnings: ParseIssue[];
  moduleAvailability: Record<AnalysisModule, ModuleAvailability>;
  summary: {
    validProducts: number;
    validReviews: number;
    duplicateProducts: number;
    duplicateReviews: number;
  };
}

importResearchCsv(productsText: string, reviewsText: string): ImportResult;
assessQuality(dataset: ResearchDataset): QualityReport;
```

`importResearchCsv` 必须同步且确定性运行；`importedAt` 可用调用时 ISO 时间。不得读取文件名或浏览器状态。

## 已裁定的数据质量口径

### 阻塞导入/分析

- 任一文件为空、只有 BOM/空格/换行、没有数据行；
- Papa Parse 语法错误；
- 重复表头；
- Task 2 行解析错误，如必填缺失、非法数字、评分越界、非法 URL/日期；
- 重复 `product_id` 或 `review_id`；
- 评论引用不存在的 `product_id`；
- 商品 `category` 不是精确的 `Cat Water Fountain`，或同一文件存在多个 category（MVP 只验证该品类）。

失败时不得返回半成品 `ResearchDataset`，也不得替换当前研究。

### 警告但允许导入

- 少于 3 个有效商品；
- 少于 10 条与有效商品关联的有效评论；
- 至少 8 个有效商品价格时，按下述 IQR 规则识别的价格异常值。

异常值不得删除或修改。警告必须带 `file: "products"`、原 CSV 行号、`price_usd` 和原值。

### 精确计数

- `duplicateProducts` / `duplicateReviews`：每个重复 ID 在第一次出现之后的额外记录数。例如同一 ID 出现 3 次，重复数为 2。
- `validProducts`：按 ID 保留首次出现后的唯一商品数。
- `validReviews`：按 ID 保留首次出现、且 `productId` 指向已知商品的评论数。
- 行号按 CSV 计算：表头为第 1 行，第一条数据为第 2 行。Windows 换行不得破坏行号。

### 模块状态

- `category`：无商品相关阻塞问题且 `validProducts >= 3` 时 `available`，否则 `locked`。
- `pain_points`：无评论/引用相关阻塞问题且 `validReviews >= 10` 时 `available`，否则 `locked`。
- `economics`：没有可用商品或存在商品身份/品类阻塞时 `locked`；否则固定为 `incomplete`，因为 Task 6 才收集完整成本。`incomplete` 页面仍可进入。
- `opportunities`：仅当 `category` 与 `pain_points` 都为 `available` 时 `available`，否则 `locked`。
- `/` 与 `/quality` 始终可进入；`/decision` 跟随 `opportunities` 是否锁定。

### IQR 规则

仅当至少有 8 个有效商品价格时计算：

1. 价格升序排列；
2. 全体奇数时排除中位数；
3. 下半区中位数为 Q1，上半区中位数为 Q3；
4. `IQR = Q3 - Q1`；
5. 小于 `Q1 - 1.5 * IQR` 或大于 `Q3 + 1.5 * IQR` 才是异常值；
6. 边界值不算异常；`IQR === 0` 时仅把严格不同于 Q1/Q3 的值标为异常。

必须用已知输入输出测试锁定该算法。

## CSV 导入测试：先获得有效 RED

先写测试，再运行：

```bash
pnpm vitest run src/data/csvImport.test.ts src/domain/quality.test.ts
```

RED 必须来自缺少目标函数或目标断言失败，不能来自扩展名、JSX、错误 import 或测试配置。

至少覆盖：

- 引号包裹的逗号不会拆列；
- UTF-8 英文文本保留；
- Windows `\r\n` 正确解析和报告行号；
- UTF-8 BOM 可接受；
- 任一空文件失败；
- 任一只有表头、无数据行的文件失败；
- 重复表头失败且指出文件；
- 行解析错误指出文件、行、字段、坏值、消息；
- 重复商品/评论 ID 的每个额外记录及计数；
- 评论引用未知商品失败；
- 非宠物饮水机或混合品类失败；
- 有效导入返回 `sourceKind: "user_upload"`、`US`、`USD`、schema v1；
- 失败不返回 dataset；
- 少量样本可成功导入但产生样本警告与模块锁定；
- 7 个价格不做 IQR，8 个及以上按精确算法；
- 异常值仍保留在 dataset 中；
- 输入字符串不被修改。

Papa Parse 负责 CSV 词法解析，Task 2 的 `parseProductRow` / `parseReviewRow` 仍是行级业务校验的唯一权威。不得使用 Papa 动态类型推断覆盖它们。

## Context 与替换安全

扩展 `ResearchContext`，至少提供：

- 当前 dataset、source kind 和 `QualityReport`；
- `importCsv(productsText, reviewsText)`；
- 最近一次导入错误/警告；
- `loadDemo()` 用于恢复 Demo。

安全规则：

- 文件被选择时不读取、不替换数据；
- 只有用户点击原样按钮 `Import and replace current research` 才执行导入；
- 导入失败保留原 dataset、原 quality report 和原来源徽标，仅更新导入错误；
- 导入成功才原子替换 dataset 与 quality report，并将来源徽标切换为 `User upload`；
- 再次加载 Demo 后徽标恢复 `Demo data`；
- 不保存到 localStorage。

## 首页上传 UI

首页必须：

- 两个独立的 `.csv` 文件选择器，分别且明确标注 Products CSV、Reviews CSV；
- 每类最多选择一个文件；替换选择是允许的；
- 导入前显示两个文件名；缺任一文件时确认按钮禁用；
- 使用原样按钮文案 `Import and replace current research`；
- 在按钮附近明确说明成功导入会替换当前本地研究；
- 提供现有 `/demo/products.csv` 和 `/demo/reviews.csv` 下载链接，并明确标注为 synthetic sample，不是 Amazon 模板数据；
- 文件读取失败显示具体文件名和错误，不替换研究；
- 导入成功显示 source kind、商品/评论数和导入时间；
- Demo 免责声明只在 demo source 下显示；用户上传时显示“不代表销量、需求或市场份额”的对应边界文案。

不得把浏览器 `accept=".csv"` 当作唯一校验；非 `.csv` 文件名应在 UI 层拒绝并显示原因。

## 数据质量页

展示：

- 有效商品数、有效评论数、重复商品数、重复评论数；
- blocking errors 与 warnings 分区；
- 每条问题的文件、行、字段、坏值和消息；
- 四个模块的 `available / incomplete / locked`；
- 文本标签与图标共同区分状态，不能只靠颜色；
- 无问题时明确显示“未发现阻塞错误”，但不得宣称数据真实或市场有效。

`StatusBanner` 必须具有可访问的文本状态；阻塞错误用 `role="alert"`，普通状态/警告使用合适的 `role="status"` 或可读文本。

## 动态导航

- 不能依靠 CSS 伪装禁用链接；locked 模块不得仍可被正常点击进入。
- category、pain points、opportunities、decision 根据当前 quality 动态锁定；economics 没有独立路由，`incomplete` 不锁 opportunities 的规则由上文决定。
- 锁定导航显示 `Locked` 文本和原因；不能只改变颜色。
- 直接输入 locked URL 时必须显示真实的“该模块因数据证据不足而锁定”页面状态，而不是渲染分析占位内容或自动跳转到不存在的结果。

## 用户本人证据门禁：WorkBuddy 不得代做

WorkBuddy 可以在自动化测试中构造内存 CSV 字符串，但**不得**在项目中创建、填写或提交用户证据文件。

Task 3 经 Codex 代码复审通过后，用户本人必须手工制作一组坏 CSV，至少包含：

- 一个非法 rating；
- 一个重复 product_id；
- 一条评论引用未知 product_id。

该人工文件及用户解释将在复审后单独完成，不属于 WorkBuddy 本次 commit。

## 禁止范围

- 不做 Amazon 抓取/API、第三方数据接入或 AI 模型；
- 不做品类中位数/分布 UI、痛点标签、利润、机会评分或决策结论；
- 不做 localStorage、JSON 导出、登录、后端或数据库；
- 不自行制作用户人工证据；
- 不修改 Demo fixture 以方便测试；
- 不 push、不部署、不建 PR、不开始 Task 4。

## 验证与提交

依次运行并提供真实输出与退出码：

```bash
pnpm vitest run src/data/csvImport.test.ts src/domain/quality.test.ts
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
```

启动开发服务器并人工验证：

1. Demo 首页和六路由仍可加载；
2. 两文件选择和文件名显示；
3. 缺文件时按钮禁用；
4. 有效样本导入后来源切换；
5. 无效导入不替换当前研究；
6. Quality 页与动态 locked 状态；
7. 服务器停止后端口释放。

创建一个普通 commit：

```bash
git add src README.md
git commit -m "feat: validate research csv imports"
```

提交后 `git status --short` 必须为空。不得 amend 既有 commit。

## 交付格式

回复必须包含：

1. 本地路径、起始 HEAD、祖先检查与起始 Git 状态；
2. 改动文件及行为；
3. 有效 RED 命令、目标失败原因和真实摘要；
4. focused/full tests、build、lint、冻结安装与 UI 检查结果；
5. 导入阻塞、警告、计数、IQR 和模块状态的最终口径；
6. 无效导入保持原研究的验证证据；
7. 最终 commit SHA 与干净状态；
8. 假设、限制、计划偏差；
9. 明确确认未创建用户坏 CSV、未开始 Task 4。

Codex 将独立检查 diff、添加反例测试、验证 UI 与范围，不以交付自述代替验证。
