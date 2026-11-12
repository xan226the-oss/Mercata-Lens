# Mercata Lens 设计规范（Light Slate Design Language）

版本：1.0 · 2026年11月12日
适用范围：Mercata Lens 全部界面（六步研究路由 + /assistant 对话工作台）
规范来源：从 `src/app/styles.css`（1,896 行）、`src/agent/agent.css` 与组件实现中**提取的实际值**，非设想稿。任何界面改动以本规范为准。

---

## 1 设计原则

1. **证据优先**：界面呈现的每个数字都可回溯到原始数据行；来源边界（演示样本 / 用户上传）永远可见。
2. **克制的中性基调**：Light Slate 灰蓝色系承载 90% 界面；彩色仅用于状态语义。
3. **边界即设计**：数据范围、局限性、证据门槛是界面的一部分，不是脚注。
4. **无障碍为底线**：焦点环、role=alert、aria-selected、reduced-motion 均为强制项。

## 2 色彩系统

### 2.1 基础色板（:root 设计令牌）

| 令牌 | 值 | 用途 |
|---|---|---|
| `--color-canvas` | `#f4f6f8` | 应用画布底色 |
| `--color-surface` | `#ffffff` | 卡片/面板表面 |
| `--color-surface-subtle` | `#f8fafb` | 次级表面（悬停、锁定态） |
| `--color-border` | `#d8e0e6` | 全部描边（1px 统一） |
| `--color-ink` | `#24313e` | 主文字 |
| `--color-muted` | `#687586` | 次级文字、锁定项 |
| `--color-primary` | `#376d9e` | 主操作、激活态、焦点环 |
| `--color-primary-soft` | `#eaf1f7` | 主色软底（激活导航、助手消息） |

### 2.2 语义状态色（四 tone）

| Tone | 边框 | 底色 | 文字色 | 使用场景 |
|---|---|---|---|---|
| success | `#b8d8cd` | `#edf7f3` | `#2e7462` | 模块可用、导入成功、验收通过 |
| warning | `#ead4a3` | `#fff7e6` | `#9a6b1f` | 低样本警告、离群值提示、过期内容 |
| error | `#e6c1bc` | `#fdf0ef` | `#a4473d` | 阻塞问题、校验失败 |
| info | `#c9dbe9` | `#eaf1f7` | `#245578` | 中性说明、来源声明 |

状态一律通过 `status-banner--{tone}` 组件化呈现，禁止在业务代码中硬编码状态色。

### 2.3 用色纪律

- 彩色面积占比 ≤10%；正文与数据永远使用 ink/muted。
- 品牌主色深变体 `#245578`（激活导航文字）、`#285a87`（助手按钮文字）仅从组件样式引用。

## 3 字体系统

| 角色 | 字体栈 | 权重 | 字号 |
|---|---|---|---|
| 展示字体（品牌名、页面标题） | `Lora, Georgia, serif` | 600 | 20px（品牌）/ 24px（页头） |
| 正文与界面 | `IBM Plex Sans, system-ui, sans-serif` | 400/600 | 见下表 |

字号阶梯（styles.css 实际分布）：

| 字号 | 用途 | 出现频次 |
|---|---|---|
| 24px | 页面主标题 | 1 |
| 19–20px | 区块标题、品牌名 | 5 |
| 15–16px | 强调正文、面板标题 | 5 |
| 13–14px | **界面默认正文**、导航项 | 22 |
| 11–12px | 辅助说明、元数据、徽章 | 24 |
| 10px | 角标（如 nav 的 Open 提示） | 4 |

行高：全局 `line-height: 1.5`；助手对话区 `1.6`。
字距：品牌名 `-0.02em`。

## 4 尺寸与布局

### 4.1 应用骨架

- 布局：`grid-template-columns: 220px minmax(0, 1fr)`；侧栏 sticky 全高。
- 最小视口：320px；工作台内容区最大宽度 1440px 居中。
- 助手双栏：`minmax(0,1fr) minmax(0,1fr)`，gap 20px。

### 4.2 圆角与阴影

| 令牌 | 值 | 用途 |
|---|---|---|
| `--radius-sm` | 4px | 导航项、小按钮 |
| `--radius-md` | 8px | 卡片、面板 |
| `--shadow-subtle` | `0 8px 24px rgb(36 49 62 / 8%)` | 唯一阴影，用于浮层 |

### 4.3 间距节奏

面板内边距 22px；侧栏 28px/16px；对话消息块 16px。间距不使用统一 spacing token，以 4px 基数对齐。

## 5 组件规范（28 个 BEM 块）

命名法：BEM（`block__element--modifier`），共 117 个类、28 个块。

### 5.1 导航（research-nav）

- 项高 ≥42px；左图标列 24px + 序号圆徽 22px。
- 四态：默认 / hover（右移 2px + subtle 底）/ active（primary-soft 底 + 深色文字 600）/ locked（muted + "Evidence required" 尾标 + not-allowed）。
- 锁定项必须可见但不可点，并说明锁定原因（evidence-gate）。

### 5.2 状态横幅（status-banner）

- 结构：图标 + tone 标签（"成功:"/"警告:" 等固定前缀）+ 正文 + 可选 body 列表。
- 四 tone 见 2.2；带 `role=alert`（error 时）、`data-testid=status-banner-{tone}`。
- 助手区错误提示独立样式：1px danger 边框 + 14px 内边距。

### 5.3 对话工作台（agent-workspace）

- 消息：用户消息 neutral 底（#f5f7f9），助手消息 primary-soft 底（#eaf1f7），引用按钮 4px 边距。
- 过期消息：左侧 4px warning 竖线 + 缩进（`.agent-stale`）。
- 引用块：4px primary 左边线 + #f4f6f8 底，`white-space: pre-wrap` 保留原文格式。
- 窄屏（≤1024px）：双栏变单栏 + Dialogue/Evidence tab（`aria-selected` 反白）。
- 输入：textarea 垂直伸缩、min-height 70px；发送按钮 disabled 态 opacity .55。

### 5.4 数据展示组件

- metric-card / metric-item：精确计数 + 明示分母，禁止裸百分比。
- module-status：三态 available / incomplete / locked。
- evidence-drawer：原生计算过程披露（"这个数怎么来的"）。
- sample-distribution：等宽频段 + 贡献产品 ID。

## 6 交互状态总表

| 状态 | 视觉 | 交互约束 |
|---|---|---|
| hover | subtle 底 + border + 右移/变色 | 150ms ease |
| focus-visible | 3px primary 外环，offset 3px | 全局强制，助手面板 offset 5px |
| disabled | opacity .55 + not-allowed | 保持布局占位 |
| loading | 按钮禁用 + 进行中锁 | 不允许并发重复提交 |
| error | error tone 横幅 | 保留用户输入可重试 |
| locked | muted + 原因说明 | 可见不可点 |
| stale | warning 竖线 + 缩进 | 旧结果禁止冒充当前结果 |

动效：仅 background-color / border-color / color / transform 四类 150ms transition；`prefers-reduced-motion: reduce` 时禁用平滑滚动。

## 7 文案规范（双语言）

- 默认中文，`LanguageContext` 提供 zh/en 切换；界面关键位置双语并存。
- 数据范围声明为程序固定注入：「【数据范围：内置模拟样本，不代表真实市场】」。
- 状态横幅使用固定 tone 前缀词，保证扫描可读。
- 助手正文禁用阿拉伯数字与编号（统计数字只出现在确定性 UI 层）。

## 8 无障碍清单

- [x] 全局 focus-visible 环（3px primary）
- [x] 错误横幅 role=alert
- [x] Tab 切换 aria-selected
- [x] 窄屏 Dialogue/Evidence tab 焦点管理（h2 可聚焦）
- [x] prefers-reduced-motion 适配
- [x] 装饰图标 aria-hidden
- [x] `overflow-wrap: anywhere` 防长文本溢出
- [x] 表单控件 font: inherit 继承

## 9 断点

| 断点 | 变化 |
|---|---|
| ≤560px | 移动端紧凑布局 |
| ≤680px | 表格/卡片堆叠 |
| ≤900px | 侧栏与内容重排 |
| ≤1024px | 助手双栏变单栏 + tab |
| ≤1100/1180px | 工作台栅格收窄 |
| print | 打印样式（研究报告输出） |

## 10 维护规则

1. 新增颜色/字号必须先扩充本规范的令牌表，再在样式中引用；
2. 禁止内联样式携带颜色值（组件内布局类内联除外）；
3. 修改任何视觉令牌后必须跑 `npm test`（311 项含界面快照断言）；
4. 本规范与代码同步演进，以 git 提交记录为准。
