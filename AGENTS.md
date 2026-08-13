# Mercata Lens 项目协作规则

本目录是 Mercata Lens（商机镜）的唯一项目根目录，也是唯一 Git 仓库根目录。代码、产品文档、WorkBuddy 任务单和 Codex 复审记录都必须保存在本目录内，不得在目录内再创建一层应用根目录。

## 固定产品范围

- 首版只验证美国市场的宠物饮水机（US cat water fountains）。
- 核心流程必须完全免费、本地运行。
- 无后端、无登录、无云数据库、无付费 API。
- 不抓取 Amazon，不接 Amazon API 或第三方选品数据库。
- 不接入云端或本地 AI 模型。
- `review_count` 只表示评论数量，绝不表述为销量。
- 不虚构销量、GMV、ROAS、利润、竞争度或效果提升。
- 输出仅限“继续研究 / 证据不足 / 暂缓”及验证计划，不输出进货建议或爆款预测。

## 开发与交付规则

- WorkBuddy 每次只实施 `workbuddy/tasks/` 中明确指定的当前任务，不得开始下一任务。
- 开始前读取设计、实施计划、全局约束和当前任务；若冲突则停止并报告。
- 新行为遵循 RED → GREEN → focused tests → full tests → build。
- 不修改任务范围外文件；确有必要时必须在交付中说明原因。
- 不 push、不部署、不创建 PR，不擅自添加后端、抓取、API、模型或新产品范围。
- 每个任务形成一个普通 Git commit，并报告起始/结束 HEAD、Git 状态、改动文件、验证命令、真实输出、假设与限制。
- Codex 复审结论仅为 `APPROVED`、`CHANGES_REQUESTED` 或 `NEEDS_CONTEXT`。只有 `APPROVED` 后才能进入下一任务。

## 事实边界

所有公开材料必须区分示例数据、用户上传数据、用户假设、程序推导和人工验证。不得把未上线 Demo 写成生产产品，不得把未验证假设写成业务结果，并必须如实说明用户、WorkBuddy 与 Codex 的贡献。
