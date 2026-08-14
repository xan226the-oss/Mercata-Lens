# WorkBuddy Task 3.5A：Light Slate 应用外壳

日期：2026-08-14  
产品：Mercata Lens（商机镜）  
项目与 Git 根目录：`/Users/xanthe/Documents/Mercata Lens`  
已批准起始 HEAD：`c0e6f6df77b5d710a08e8684fd73ff848f8bebad`

## 只实施本任务

把现有顶部卡片＋横向导航改成已批准的 **Light Slate 商业分析平台外壳**：本地字体、浅色侧栏、工作区顶部范围与真实来源状态、清晰的可用/锁定导航。

本任务只是视觉改版第 1 阶段。不得开始首页重排、Data quality 双分区、IssueTable、Task 4 品类分析或后续视觉任务。

## 开始前必须完整阅读

1. `AGENTS.md`
2. `docs/specs/2026-08-14-mercata-lens-visual-refresh-design.md`
3. `docs/plans/2026-08-14-mercata-lens-visual-refresh-implementation-plan.md` 的 Global Constraints、File Structure 与 Task 1
4. 本任务单

开始前报告并验证：

```bash
git rev-parse --show-toplevel
git rev-parse HEAD
git status --short --branch
git merge-base --is-ancestor 2376415fe90966d94824ad47b3e69d1a83f97748 HEAD
git merge-base --is-ancestor 3ee5e3b0549d196148c97b8b1777bc68adc96076 HEAD
git merge-base --is-ancestor c0e6f6df77b5d710a08e8684fd73ff848f8bebad HEAD
```

预期：Git 根目录精确正确，三个祖先检查均退出 `0`，工作树干净。若不满足，立即停止并报告；不得 reset、stash、删除、覆盖或另建项目。

## 允许范围

允许创建：

- `src/research/ResearchLayout.test.tsx`

允许修改：

- `package.json`
- `pnpm-lock.yaml`
- `src/main.tsx`
- `src/research/ResearchLayout.tsx`
- `src/app/styles.css`
- `src/app/routes.test.tsx`：仅适配外壳结构且保持原路由契约
- `src/pages/HomePage.test.tsx`：仅在外壳标记变化直接影响既有测试时作最小适配；不得删除或弱化 Task 3 行为断言

不得修改：

- `src/data/**`
- `src/domain/**`
- `src/research/ResearchContext.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/QualityPage.tsx`
- `src/components/StatusBanner.tsx`
- `public/demo/**`
- `README.md`
- `docs/**`
- `workbuddy/**`
- `AGENTS.md`

如认为必须超出允许范围，先停止并解释，不得自行扩大。

## 视觉方向锁定

采用 **A：Light Slate 商业分析平台**：

- 侧栏为白色或极浅冷灰；
- 页面背景为冷灰；
- 内容表面为白色；
- 主色为克制岩蓝；
- 标题使用 `Lora`；
- 导航、正文、按钮、标签和数字使用 `IBM Plex Sans`；
- 减少圆角与阴影；
- 不使用大面积深蓝、渐变、霓虹、发光或花哨 AI 效果；
- 状态不能只靠颜色表达。

这不是复刻浏览器效果图的像素任务。以批准设计文档和以下语义/行为为准。

## 本地字体

安装：

```bash
pnpm add @fontsource/lora @fontsource/ibm-plex-sans
```

只在 `src/main.tsx` 导入所需本地字体：

```ts
import "@fontsource/lora/500.css";
import "@fontsource/lora/600.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
```

禁止：

- Google Fonts；
- `@import url(...)`；
- CDN 字体；
- 运行时网络字体请求；
- 安装与字体无关的新生产依赖。

## 测试先行：必须先获得有效 RED

创建 `src/research/ResearchLayout.test.tsx`，使用真实：

- `ResearchProvider`；
- `MemoryRouter`；
- 与 `HomePage.test.tsx` 相同的 Demo fetch stub；
- 可控 pending/rejected fetch 验证 loading/no-data。

不得导出或绕过私有 ResearchContext，不得伪造新的业务状态合同。

至少覆盖：

1. 存在 `main` 主区域；
2. 存在 `Research steps` 导航；
3. 显示 `US market`；
4. 显示 `Cat Water Fountain`；
5. 显示 `Review count is not sales`；
6. Demo 就绪显示 `Demo data`；
7. 用户上传后显示 `User upload`；
8. Demo pending 时显示 `Loading data`；
9. Demo 失败且无数据时显示 `No active data`，绝不能显示 `User upload`；
10. `/quality` 可点击；
11. 低样本的依赖模块仍非链接并有 `aria-disabled="true"` 与 `Locked` 文本；
12. 同一 Provider 状态下进入 locked URL 仍渲染 `locked-page`；
13. 现有稳定 test ID 不变：`source-badge`、`step-locked-*`、`locked-page`、`lock-reason`。

先运行：

```bash
pnpm vitest run src/research/ResearchLayout.test.tsx src/app/routes.test.tsx
```

RED 必须来自目标外壳语义/结构尚未实现或相应断言失败，不能来自错误 import、JSX 扩展名、测试配置或 fetch 永久悬挂。保留真实输出。

## 外壳实现要求

保留现有 `ResearchLayout({ children })` 公共签名，保持 `sourceLabel`、`lockReasonFor`、`moduleStateFor` 的业务行为。

目标结构：

```tsx
<div className="app-shell">
  <aside className="app-sidebar">
    <div className="app-brand">
      <span className="app-brand__name">Mercata Lens</span>
      <span className="app-brand__cn">商机镜</span>
    </div>

    <nav className="research-nav" aria-label="Research steps">
      {/* 沿用现有六步 available / locked 映射 */}
    </nav>

    <p className="evidence-rule">Review count is not sales</p>
  </aside>

  <div className="app-workspace">
    <header className="workspace-header">
      <div className="workspace-scope">
        <span>US market</span>
        <span aria-hidden="true">/</span>
        <span>Cat Water Fountain</span>
      </div>
      <span data-testid="source-badge">{sourceLabel}</span>
    </header>

    <main className="workspace-main">
      {/* 沿用现有 direct locked URL 拦截 */}
    </main>

    <footer className="workspace-footer">
      Local, free, evidence-driven research.
    </footer>
  </div>
</div>
```

锁定页如抽成私有函数，使用：

```tsx
function LockedPage({ reason }: { reason: string }) {
  return (
    <section className="locked-page" data-testid="locked-page" role="alert">
      <span className="section-kicker">Evidence required</span>
      <h1>Module locked</h1>
      <p>{reason}</p>
    </section>
  );
}
```

禁止：

- 修改六步路径或标签；
- 通过 CSS 把真实链接伪装成锁定；
- 删除 direct locked URL 防护；
- 为视觉需要添加新业务路由；
- 把 loading/null 来源标成 User upload；
- 改动 Home/Quality 内容结构。

## CSS Token 基线

在 `:root` 使用：

```css
:root {
  color-scheme: light;
  font-family: "IBM Plex Sans", system-ui, sans-serif;
  --font-display: "Lora", Georgia, serif;
  --color-canvas: #f4f6f8;
  --color-surface: #ffffff;
  --color-surface-subtle: #f8fafb;
  --color-border: #d8e0e6;
  --color-ink: #24313e;
  --color-muted: #687586;
  --color-primary: #376d9e;
  --color-primary-soft: #eaf1f7;
  --color-success: #2e7462;
  --color-warning: #9a6b1f;
  --color-danger: #a4473d;
  --radius-sm: 4px;
  --radius-md: 8px;
  --shadow-subtle: 0 8px 24px rgb(36 49 62 / 8%);
}
```

必须实现：

- 桌面端约 `220px / 1fr` 浅色侧栏网格；
- 侧栏与主工作区明确分隔；
- active / available / locked 状态清楚；
- `:focus-visible` 明确可见；
- 现有 Home 和 Quality 内容在新外壳中仍可读；
- 不靠阴影堆叠层级；
- 无渐变。

本阶段只需保证现有页面在窄屏不溢出；完整窄屏导航重排属于视觉改版 Task 4，不要提前扩大。

## GREEN 与回归验证

依次运行并保留真实输出与退出码：

```bash
pnpm vitest run src/research/ResearchLayout.test.tsx src/app/routes.test.tsx src/pages/HomePage.test.tsx
pnpm test -- --run
pnpm build
pnpm lint
pnpm install --frozen-lockfile
git diff --check
```

启动开发服务器并人工验证：

1. `/`、`/quality`、`/category`、`/pain-points`、`/opportunities`、`/decision` 均可正常响应；
2. Demo 首页显示浅色侧栏和 `Demo data`；
3. `US market / Cat Water Fountain` 清楚可见；
4. 当前 Home 和 Quality 内容未消失；
5. 锁定状态仍不能点击；
6. 浏览器控制台无运行错误；
7. 验证后停止服务器，确认端口释放，无后台 Vite 进程。

## 提交要求

提交前：

```bash
git diff --name-status
git status --short
```

只创建一个普通提交：

```bash
git add package.json pnpm-lock.yaml src/main.tsx src/research/ResearchLayout.tsx src/research/ResearchLayout.test.tsx src/app/routes.test.tsx src/pages/HomePage.test.tsx src/app/styles.css
git commit -m "feat: introduce light slate application shell"
```

如果 `HomePage.test.tsx` 实际未改，不要强行加入。不得 amend、push、部署或建 PR。

提交后再运行：

```bash
git diff --name-status c0e6f6df77b5d710a08e8684fd73ff848f8bebad..HEAD
git status --short --branch
```

## 交付格式

回复必须包含：

1. 项目路径；
2. 起始 HEAD、起始状态与三个祖先检查；
3. 读取的设计/计划/任务文件；
4. 改动文件及每个文件的行为；
5. 字体依赖和本地导入证明；
6. RED 命令、真实失败原因和测试数量；
7. GREEN focused 与全量结果；
8. build、lint、frozen install、diff check 的真实结果；
9. 六路由和 dev server 停止证据；
10. 四种来源状态的验证；
11. 锁定导航和 direct locked URL 的验证；
12. 新 commit 完整 SHA；
13. 最终 `git status --short --branch`；
14. 明确确认未修改 Home/Quality 内容结构、未开始后续视觉任务或 Task 4、未 push、未部署、未建 PR。
