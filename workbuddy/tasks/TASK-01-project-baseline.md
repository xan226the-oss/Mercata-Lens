# WorkBuddy Task 1：项目基线、六步导航与 Git 基线

日期：2026-08-13  
产品：Mercata Lens（商机镜）  
项目与 Git 根目录：`/Users/xanthe/Documents/Mercata Lens`

## 只实施本任务

实现一个可运行、可测试的 React 应用外壳，建立六步研究导航、产品范围提示、README 和项目 Git 基线。不要实现任何数据、统计、CSV、利润、评分或结论逻辑。

开始前必须完整阅读：

1. `AGENTS.md`
2. `docs/specs/2026-08-13-mercata-lens-design.md`
3. `docs/plans/2026-08-13-mercata-lens-implementation-plan.md` 中的 Global Constraints、File Map 和 Task 1

先报告当前目录内容、精确 Git 状态和当前 HEAD。若目录状态与任务描述冲突，停止并报告，不自行处理或另建项目目录。

## 根目录要求

- 应用直接创建在 `/Users/xanthe/Documents/Mercata Lens`。
- 不得创建 `product-opportunity-workbench/`、`mercata-lens/` 等嵌套应用目录。
- Git 仓库根目录必须精确为 `/Users/xanthe/Documents/Mercata Lens`。
- 必须保留已有的 `AGENTS.md`、`docs/` 和 `workbuddy/`。

## 文件范围

允许创建或修改：

- `package.json`、`pnpm-lock.yaml`、Vite/Vitest/TypeScript 配置、`index.html`
- `src/main.tsx`
- `src/app/App.tsx`
- `src/app/routes.tsx`
- `src/app/routes.test.ts`
- `src/app/styles.css`
- `src/research/ResearchLayout.tsx`
- `src/pages/*.tsx`
- `README.md`
- 必要的默认静态资源清理

不得修改 `docs/`、`workbuddy/` 或 `AGENTS.md`，不得实现 Task 2 及以后内容。

## 强制接口与文案

提供以下六个路由，路径必须完全一致：

```text
/
/quality
/category
/pain-points
/opportunities
/decision
```

导出共享元数据：

```ts
RESEARCH_STEPS: ReadonlyArray<{
  path: string;
  label: string;
  status: "available" | "locked";
}>
```

布局必须持续显示：

- 英文产品名 `Mercata Lens`
- 中文产品名 `商机镜`
- 原样边界文案 `Demo scope: US cat water fountains`
- 原样警示文案 `Review count is not sales`
- 当前步骤与六步导航
- `Demo data` 徽标

每个占位页面只写一句该步骤的真实职责，不展示指标、样例结论或“分析已完成”等状态。

README 必须原样包含：

```text
Built: local evidence-driven research flow for one validated demo category.
Not built: Amazon scraping/API, AI model, sales prediction, real seller analytics, all-category support.
```

并明确产品当前没有后端，数据处理与保存将在浏览器本地完成；这不是“只有 HTML”，而是 React + TypeScript 单页应用。

## TDD 与验证

1. 先创建路由契约测试，断言六个路径完全一致。
2. 在实现 `RESEARCH_STEPS` 前运行测试并保留真实 RED 输出。
3. 实现最小六路由外壳，使测试转 GREEN。
4. 运行：

```bash
pnpm test -- --run
pnpm build
pnpm dev
```

确认测试与构建退出码为 0，并人工检查六个路由可以加载。`pnpm dev` 验证后应正常停止，不要将开发服务器作为后台进程遗留。

## Git 与提交

只在项目根目录执行：

```bash
git init
git add .
git commit -m "chore: establish mercata lens baseline"
```

不要 push、部署、建 PR 或开始 Task 2。提交后 `git status --short` 必须为空。

## 交付格式

回复中必须提供：

1. 本地项目路径。
2. 起始 Git 状态与起始 HEAD。
3. 改动文件列表和实现行为。
4. RED 命令、失败原因与真实输出摘要。
5. GREEN、全量测试、构建和六路由检查命令及退出结果。
6. 最终 commit SHA。
7. 最终 `git status --short`。
8. 剩余限制与全部假设。

Codex 会独立检查，不以本交付自述代替验证。
