# WorkBuddy Task 3.5D：响应式、无障碍、README 与最终视觉验收

日期：2026-08-14
产品：Mercata Lens（商机镜）
项目与 Git 根目录：`/Users/xanthe/Documents/Mercata Lens`
已批准应用 HEAD：`b7b82226412a39634f66a1b2fe3cfe48aa771dda`

## 只实施本任务

在已通过 Codex 复审的 Task 3.5A、3.5B、3.5C 基线上完成视觉刷新收尾：

1. 补足仍然缺失且有实际价值的无障碍行为断言；
2. 在真实桌面与窄屏视口中核验响应式布局，并只修复实际观察到的视觉或交互缺陷；
3. 如实更新 README，使文档与当前 Light Slate 工作流一致；
4. 完成最终视觉、测试、构建与仓库洁净度验收。

本任务是视觉刷新 Task 3.5 的最后一个子任务，不是产品 Task 4。不得实现或预演价格、品牌、评分分布、属性覆盖、评论主题、痛点、经济性、机会评分或决策分析。

## 开始前必须完整读取

1. `AGENTS.md`
2. `docs/specs/2026-08-14-mercata-lens-visual-refresh-design.md`
3. `docs/plans/2026-08-14-mercata-lens-visual-refresh-implementation-plan.md` 的 Global Constraints、File Structure 与 `Task 4: Responsive, accessibility, documentation, and visual acceptance`；该计划中的“Task 4”在当前任务编排中对应视觉收尾 **Task 3.5D**，不得与后续产品 Task 4 混淆
4. `workbuddy/tasks/TASK-03.5A-light-slate-shell.md`
5. `workbuddy/tasks/TASK-03.5B-research-home.md`
6. `workbuddy/tasks/TASK-03.5C-data-quality.md`
7. `workbuddy/tasks/TASK-03.5D-visual-acceptance.md`
8. 当前 `README.md`
9. 当前 `src/app/styles.css`
10. 当前 `src/research/ResearchLayout.tsx` 与 `src/research/ResearchLayout.test.tsx`
11. 当前 `src/pages/HomePage.tsx`、`src/pages/QualityPage.tsx` 与 `src/pages/HomePage.test.tsx`
12. 当前 `src/components/IssueTable.tsx` 与 `src/components/IssueTable.test.tsx`
13. 当前 `src/components/StatusBanner.tsx`、`ImportPanel.tsx`、`ImportResultSummary.tsx`、`MetricStrip.tsx`、`EvidenceStatus.tsx`、`ModuleStatus.tsx`、`PageHeader.tsx`
14. 当前 `src/app/routes.tsx` 与 `src/app/routes.test.tsx`
15. 当前 `package.json`

开始前报告并核验：

```bash
git rev-parse --show-toplevel
git rev-parse HEAD
git log -1 --format=%H -- workbuddy/tasks/TASK-03.5D-visual-acceptance.md
git status --short --branch
git merge-base --is-ancestor b7b82226412a39634f66a1b2fe3cfe48aa771dda HEAD
git merge-base --is-ancestor c0e6f6df77b5d710a08e8684fd73ff848f8bebad HEAD
```

预期：根目录精确为 `/Users/xanthe/Documents/Mercata Lens`；起始 HEAD 与“最后修改本任务单的提交”相同，即当前 HEAD 已包含本任务单；已批准应用 HEAD `b7b82226412a39634f66a1b2fe3cfe48aa771dda` 和视觉计划提交均为当前 HEAD 的祖先，两个祖先检查退出 `0`；分支为 `main`，工作树干净。任何一项不符都停止并报告；不得 reset、stash、覆盖、删除、另建仓库或另建应用目录。

## 允许范围

允许修改：

- `src/app/styles.css`：仅修复本任务真实验收发现的响应式、焦点可见性、可读性、触控尺寸或横向溢出问题
- `src/research/ResearchLayout.test.tsx`：仅补足外壳 landmark、来源状态、可用导航、锁定导航语义
- `src/pages/HomePage.test.tsx`：仅补足导入成功/失败状态的无障碍语义和视觉刷新必需状态合同
- `src/components/IssueTable.test.tsx`：仅补足 caption、列标题、窄屏单 DOM 数据标签合同
- `README.md`：仅如实描述当前视觉工作流、现有能力与未实现边界

不得创建新的产品组件、分析模块、业务合同或测试夹具。未观察到缺陷或未缺少合同的文件不得为了凑改动而编辑。

不得修改：

- `src/research/ResearchLayout.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/QualityPage.tsx`
- `src/components/*.tsx`
- `src/research/ResearchContext.tsx`
- `src/app/routes.tsx`
- `src/data/**`
- `src/domain/**`
- `src/fixtures/**`
- `public/demo/**`
- `package.json`
- `pnpm-lock.yaml`
- `docs/**`
- 其他 `workbuddy/**`
- `AGENTS.md`

如果测试或人工验收证明问题必须修改上述禁止文件，停止并报告具体复现、证据和建议文件，不得自行扩大范围或弱化测试。

## 事实与产品边界

- `review_count` 和 review evidence records 只表示评论/证据记录数量，绝不表示销量、客户数、需求或市场份额。
- Demo 数据是人工整理的合成 fixture，不是 Amazon 抓取、实时市场数据或真实消费者评论。
- User upload 只表示用户上传的本地数据，不代表数据真实、市场有效或分析结论成立。
- 当前首页只可展示已有合同提供的来源、分类、日期、商品数、评论证据记录数、证据门槛和下一步可用性。
- 不得新增价格范围、中位数、价格图、品牌数、品牌占比、评分分布、属性覆盖、评论主题、确认痛点、经济性、机会评分、进货建议或爆款预测。
- 不得新增综合质量分、市场机会分或任何未经合同与测试定义的推导。
- 不得新增 AI、后端、登录、持久化、云服务、抓取、外部 API、部署或遥测。

## 测试先行与诚实 RED

先审查现有测试，避免重复现有断言。当前代码可能已经覆盖部分或全部计划示例；只为真实缺口增加断言。

至少核验以下合同在 focused tests 中有明确覆盖：

```tsx
expect(screen.getByRole("main")).toBeInTheDocument();
expect(
  screen.getByRole("navigation", { name: "Research steps" }),
).toBeInTheDocument();
expect(screen.getByRole("alert")).toHaveTextContent(/Import failed/i);
expect(screen.getByTestId("step-locked-/category")).toHaveAttribute(
  "aria-disabled",
  "true",
);
expect(
  screen.queryByRole("link", { name: /Category overview/i }),
).not.toBeInTheDocument();
```

同时核验：

- `Demo data`、`User upload`、`Loading data`、`No active data` 四种来源状态都有可见文字；
- 可用导航仍是键盘可达的真实链接；
- 锁定导航不是链接，且同时具有 `aria-disabled="true"`、`Locked` 可见文字和缺失证据解释；
- 阻塞导入失败使用 alert 语义，成功或信息状态不伪装成阻塞错误；
- IssueTable 只有一个语义化 table，具有可访问 caption 和 `File`、`Row`、`Field`、`Bad value`、`Reason` 五个列标题；
- 每个 issue cell 具有对应 `data-label`，用于同一 DOM 在窄屏变成卡片，不复制第二份移动端问题列表。

修改测试后先运行：

```bash
pnpm vitest run src/research/ResearchLayout.test.tsx src/pages/HomePage.test.tsx src/components/IssueTable.test.tsx
```

有效 RED 只能来自真实缺失的 landmark、名称、状态文字、caption、列标题、锁定语义或导入状态语义。若新增断言第一次运行已经 GREEN，必须如实报告为“覆盖补充/现有实现已满足”，不得声称获得 RED。不得通过改错选择器、挂起 fetch、删除实现、改变测试环境或弱化旧断言制造失败。

若上述合同已经被现有测试完整覆盖，不得机械重复；记录审查结果，继续真实视口验收。

## 响应式与交互验收要求

现有 CSS 已包含 `900px`、`680px` 与 `560px` 附近的响应式规则。先在浏览器中观察，再决定是否修改；不得仅因为计划中给出示例 CSS 就重复粘贴或重写已通过规则。

必须保持：

- 约 `1440×900`：Light Slate 桌面侧栏持续可见；主内容不被侧栏覆盖；首页指标为可读的四列；主要分析区域保持合理双列；Quality issue table 五列完整可读。
- 约 `900px` 附近：外壳切为单列；侧栏成为顶部区域；导航为三列；首页分析区堆叠；指标为两列。
- 约 `390×844`：导航为两列紧凑顶部控制；指标为单列；页面内边距合理；标题、来源、按钮、文件输入、状态提示不溢出视口。
- `680px` 以下：同一个 IssueTable DOM 的每行呈卡片式；五个字段标签均可见；长坏值与原因换行；不依赖横向滚动。
- 所有可用链接、按钮和文件选择控件可通过键盘到达，`:focus-visible` 清楚可见。
- 主要按钮和导航项可用高度至少约 `40px`；禁用按钮仍可辨认。
- 状态不能只靠颜色表达；Passed、Warning、Blocked、Available、Incomplete、Locked 均保留文字或等价可读标记。
- 页面所有必需内容在目标视口内不依赖横向滚动；不得通过隐藏必需字段“解决”溢出。
- 不添加动画、渐变、霓虹、大面积深蓝、伪图表或装饰性数据。

只有在真实观察到违反上述要求时，才可最小修改 `src/app/styles.css`。每个 CSS 改动必须在交付报告中对应一个具体现象和复验结果。

## 必须验收的状态

在真实应用或可复现的受控浏览器状态中核验：

1. Demo data ready 首页；
2. User upload success；
3. Demo loading 与 No active data 的来源文字；若只能由自动化测试稳定控制，必须明确说明该项证据来自测试而不是人工目视；
4. 三问题失败导入：首页只有简洁失败摘要，Quality 显示完整三行诊断；
5. 失败导入后旧的有效 Demo data 仍然是 12 商品、76 评论证据记录，不得显示为已被失败文件替换；
6. 无 active dataset 但保留失败导入诊断；
7. 低样本 User upload 下 Category 等依赖模块锁定，`/quality` 仍可进入；
8. 桌面 IssueTable 与窄屏 issue cards；
9. 页面没有价格图、品牌统计、评分分布、属性覆盖或从评论提取的痛点结论；
10. 浏览器控制台无运行错误。

人工视觉验收必须真实设置并观察约 `1440×900` 与 `390×844` 两个视口。HTTP `200`、源码检查、User-Agent 切换或 jsdom 测试不能替代视觉验收。若当前工具无法操作真实浏览器或设置视口，必须将该项报告为未完成的证据缺口，不得宣称视觉验收通过。

启动命令：

```bash
pnpm dev
```

验收后停止开发服务器，并用端口/进程检查证明没有残留 Vite 进程。不得把临时截图、浏览器缓存或验收产物提交到仓库。

## README 更新

在 `README.md` 增加或整合 **Visual workflow** 小节，至少准确表达：

```markdown
## Visual workflow

Mercata Lens uses a local Light Slate research workspace. The home page shows the active evidence source, descriptive record counts, evidence readiness, and the next available research step. Data quality separates the latest import attempt from the active valid dataset so a rejected upload cannot appear to replace or validate the current research.

Price distribution, brand structure, rating distribution, review themes and pain points, economics, and opportunity scoring are not part of the visual-refresh task. They remain unavailable until their analysis tasks provide tested contracts.
```

同时最小修正 README 中因 Task 3.5A–C 已完成而明显过时、且与当前视觉工作流直接相关的描述，例如“所有步骤页目前只有单行职责”或组件结构只列 `StatusBanner`。不得借此重写产品路线、声称生产可用、声称 Task 4 已完成，或扩大 README 到本任务之外。

## 最终验证

按顺序运行并记录真实退出结果：

```bash
pnpm vitest run src/research/ResearchLayout.test.tsx src/pages/HomePage.test.tsx src/components/IssueTable.test.tsx src/app/routes.test.tsx
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

然后核验范围：

```bash
git diff --name-status b7b82226412a39634f66a1b2fe3cfe48aa771dda
git status --short
```

预期：所有要求执行的命令退出 `0`；只出现允许范围内的实际修改；没有 data/domain、业务组件、依赖锁文件或 Demo 数据变化；没有残留开发服务器。

`pnpm install --frozen-lockfile` 必须在测试与构建之后运行，避免把依赖安装误写成行为验证。若任何命令失败，先在允许范围内定位；无法在范围内修复则停止并报告，不得跳过或把失败写成通过。

## 提交

提交前：

```bash
git diff --name-status
git diff --check
git status --short
```

只创建一个普通实现提交，仅加入实际修改的允许文件。推荐命令（未修改的文件不要强行加入）：

```bash
git add src/app/styles.css src/research/ResearchLayout.test.tsx src/pages/HomePage.test.tsx src/components/IssueTable.test.tsx README.md
git commit -m "test: verify visual refresh states"
```

不得 amend、push、部署、创建 PR 或开始下一任务。

提交后报告：

```bash
git diff --name-status b7b82226412a39634f66a1b2fe3cfe48aa771dda..HEAD
git status --short --branch
git rev-parse HEAD
```

最终工作树必须干净，否则不得声称完成。

## 交付格式

必须包含：

1. 项目路径、起始 HEAD、分支、起始状态和两个祖先检查；
2. 完整读取文件列表；
3. 现有覆盖审查、实际新增断言及真实 RED/GREEN 情况；
4. 每个改动文件及其严格理由；
5. 四种来源文字、landmark、可用导航、锁定导航、alert/status、IssueTable caption/列标题/data-label 的证据；
6. `1440×900` 与 `390×844` 的真实观察，以及中间断点、触控高度、焦点、换行和无横向滚动结果；
7. Demo ready、User upload、loading/no-data、失败导入保留旧数据、无 active dataset、低样本 locked 的证据来源；
8. 首页失败摘要与 Quality 完整三问题诊断的分工；
9. focused tests、全量 tests、build、lint、frozen install、diff check 的命令、退出码与真实摘要；
10. 浏览器控制台、开发服务器停止和端口释放证据；
11. README 新增内容与修正的过时描述；
12. 新 commit 的真实完整 SHA、最终改动文件和最终 Git 状态；
13. 明确确认未修改允许的 CSS 以外的运行时代码，未修改 data/domain、依赖或 Demo 数据，未实现价格/品牌/评分分布/属性/痛点/经济性/机会评分，未开始产品 Task 4，未加入 AI/后端/持久化/抓取，未 push、未部署、未建 PR；
14. 所有无法完成或只能由自动化测试证明的视觉状态，必须作为限制逐项列出，不得用推断代替观察。
