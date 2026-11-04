# 主题情感接入实施计划
在已批准方案下本会话直接执行，使用writing-plans与测试先行，不再重复请求许可。
目标：9组19标签、多情感和原文可在平台审查/纠错/统计，保持现有流程。
技术：React/TypeScript、Node gateway、Vitest/Node test/Playwright，无新增依赖。
全局约束：免费额度用完即停；仅模拟数据云调用；无其他兜底；AI标注不冒充独立人工验证；不push/deploy。

## 单次集成任务
- [x] 先写src/domain/aspects.test.ts：r005有外形正面/清洗负面，原文改变或上传时无演示标注；重复条目不重复计数；负面兼容映射按评论去重，错误证据拒绝。
- [x] 运行 npm test -- src/domain/aspects.test.ts，确认RED；实现src/domain/aspects.ts、共享目录/演示JSON和server/aspects.mjs，GREEN。
- [x] 先写组件测试：默认主题统计50条确认来源、正负中、原文、人工增改/恢复、空原因不保存、重复标签拒绝；实现AspectWorkbench和AspectEditor，ResearchContext增加session overrides，导入成功/重载清空。
- [x] 新版成为PainPointsPage默认入口，旧版按钮切回；原工作台测试显式切到旧版。商机、决策调用负面兼容汇总，JSON携带新版标注快照；助手附带新版标注并监听revision。
- [x] Node测试先覆盖打标API的非demo拒绝、恶意标签/伪引文拒绝、合法多标签/两种情感保留，再实现/api/agent/tag接口与前端触发器，默认不自动调用。
- [x] 验证命令：npm test、npm run test:agent-server、npm run build、npx playwright test。新增新版浏览器场景含390px无横向溢出。
- [x] 记录26条补标覆盖边界；若执行实时样本，首错停止，无重试，输出token及延时，声明开发样本非独立金标。
- [x] 请求代码审查，修复重要问题；记录测试/局限，普通Git提交，不push。
