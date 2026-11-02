# C方案研究对话实施计划

执行方式：当前会话顺序执行，按测试先行、聚焦验证、全量测试与构建推进；不部署、不推送。

**目标：** 实现可操作的对话与证据双栏、纠错后的结果失效、受控本地模型接口与未配置降级。
**架构：** 保留原有六步规则工作台，另设研究助手路由。前端绑定当前研究与纠错版本，本地Node服务只接受内置模拟样本引用，模型适配通过环境变量显式配置与启用。
**技术：** 现有React、TypeScript、Vitest、Playwright；Node原生HTTP与fetch，不新增服务框架。

## 全局约束与本批边界
- 模型未配置或未显式启用时不发外部请求，不以静态回答冒充模型成功。
- 模型提供结构化文本与引用，引用存在性、来源归属、数量冲突及输出边界需校验；语义支持程度仍须人工核验，不能宣称机器已证明引用支持结论。
- 首批模型功能只接受内置demo数据；上传数据仍可使用原有规则分析，不能静默发给模型。
- 不配置真实密钥、不进行任何付费调用、不部署。保留来源、限制与原有六步路径。
- 当前不实现持久化、通用工具自主规划或完整自动六状态Agent，不将手动阶段提示冒充已完成编排。
- 校验代码与服务默认只监听本机；.env类配置不入库。

## Task 1 本地接口与输出契约
文件：server/agent.mjs、server/agent.test.mjs、.env.example、package.json、vite.config.ts、.gitignore。
- [ ] 先写Node测试：未配置与未授权调用被拒绝、请求来源与大小受限、未知引用拒绝、上游失败不泄漏密钥、结构化响应引用校验。
- [ ] 执行node --test server/agent.test.mjs，确认缺失实现导致失败。
- [ ] 实现GET /api/agent/status与POST /api/agent/chat；配置MODEL_ENDPOINT、MODEL_NAME、MODEL_API_KEY和MODEL_CALLS_ENABLED=true才启用。
- [ ] 验证结构化answer/reviewIds，核对demo原文及标签快照，限制历史和字段长度、请求超时、响应体大小。
- [ ] 模型提示区分数据与指令，拒绝外部数据和未知引用；文案数字不由模型生成，统计在前端固定区域展示。
- [ ] 添加本地服务启动脚本及Vite代理，测试通过并提交。

## Task 2 前端会话与双栏
文件：src/agent/contract.ts、src/agent/contract.test.ts、src/agent/AgentWorkspace.tsx、src/agent/AgentWorkspace.test.tsx、src/agent/agent.css、src/app/App.tsx、src/research/ResearchLayout.tsx。
契约：请求question、revision、requestId、sourceKind、history、当前评论与有效标签；响应answer、reviewIds、revision、requestId。研究或纠错对象变化使旧请求失效。
- [ ] 先写测试：阻止空输入和并发、旧响应丢弃、无效引用阻断、未配置不可发送、失败保留输入、窄屏切换证据。
- [ ] 执行聚焦Vitest，确认失败，再实现最小代码。
- [ ] 复用现有分类、纠错与ResearchContext；点击引用定位原文、可返回；修改原因必填，应用后旧解释失效。
- [ ] 状态与消息均清楚区分模型结果和规则结果；历史只发送当前版本已验证结果。
- [ ] 追加/assistant路由，不改变原有六条路径契约；添加双语入口与基本文案。
- [ ] 通过聚焦测试并提交。

## Task 3 集成验证与交付
文件：e2e/agent.spec.ts、README.md、docs/evidence/agent-integration-2026-11-02.md。
- [ ] 使用本地测试替身验证三轮上下文、引用、纠错失效和超时恢复；明确这不是模型实测。
- [ ] 浏览器检查390、900、1440px下布局、引用切换、无模型降级；原有规则流程回归。
- [ ] 执行npm test、node --test server/agent.test.mjs、npm run build及适当Playwright测试。
- [ ] 审查diff与密钥边界，记录真实命令结果、局限与模型待配置事项；提交代码与验收记录。

## 真实模型验收后续
待用户提供服务商与费用授权后，在本地安全配置密钥，运行真实三轮与接口成功率、延迟、引用语义支持测试。本批不能将这些项目标记为通过。
