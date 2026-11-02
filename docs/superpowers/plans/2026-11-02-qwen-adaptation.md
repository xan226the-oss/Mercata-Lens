# Qwen适配执行计划
起始HEAD：a759859035c3619d1f6b832d8659a2fd271f65e3。当前任务TASK09的真实模型验收补充，不开始新功能。
1. server/agent.test.mjs先加profile测试：默认不添加专属参数；profile发送非思考/JSON/总输出上限；仅允许可信百炼HTTPS与qwen模型，其他禁用。运行npm run test:agent-server确认新增断言失败。
2. server/agent.mjs实现显式配置与追加字段示例，不改validateReply；.env.example记录profile。运行同一测试确认通过。
3. scripts/benchmark-agent.mjs补profile记录、逐条进度、逐条JSON保存、HTTP错误停止与失败诊断；导出纯辅助函数并通过node --test scripts/benchmark-agent.test.mjs先行验证，不允许测试连接真实接口。
4. 使用现有76条模拟数据，免费约束标志下做1条profile探针，再原12任务两遍；每组最多24次，无自动重试。profile请求仅通过进程环境启用，本地默认服务维持关闭。若HTTP拒绝立即停止，若结构/语义失败如实记录并先定位再决定修复。
5. npm run test:agent-server、npm test -- --reporter=dot、npm run build；按必要范围浏览器回归。复核真实答复与原文，保存评测报告并更新索引及任务记录。
6. 由独立reviewer只读复核代码、测试与报告边界，修复问题后形成一个普通commit；不推送、不部署，不提交.env.local。

执行结果：已完成测试先行、显式profile、固定系统说明、逐条评测及元数据白名单，Node13项、Vitest302项、Playwright7项、构建通过，代码独立复核APPROVED。最终真实24次23通过，两组真实三轮和额外浏览器三轮完成；引用链完整性仍需后续改进，未标为语义验收全部通过。报告及配图已保存至docs/evaluations/agent-pilot，且交付副本在毕设/阶段总结/2026-11-02。
