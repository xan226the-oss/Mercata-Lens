# 三模型相同协议小范围横测
用户确认qwen3.8-flash与deepseek-v4.1-flash各有1M免费额度，两个用完即停已开启，并授权测试。Plus仍有已确认免费余量。不充值、不切换付费。
目标：以已修复的证据选择和历史边界为基础，三个模型各完成同样6场景x2遍，最多36次，不自动重试，HTTP拒绝停止对应批次。仅当前内置模拟评论。固定相同提示词、非思考JSON模式、1024总输出上限、temperature=0、30秒超时。顺序执行，记录实际输入、缓存token与历史长度；不以速度替代语义，不更改产品默认模型。
实施：先写共享profile跨三模型参数及相同prompt测试观察失败；最小增加bailian-json-nonthinking profile，只允许既有百炼北京HTTPS端点与这三个模型，原有profile保持兼容；benchmark输出与原始失败保留。先Node回归再真实36次。辅助逐条审阅并写配图报告。Node/Vitest/build、独立代码复核通过后本地提交，不推送或部署，不提交密钥。
官方参数核实：2026-11-03，https://help.aliyun.com/zh/model-studio/deepseek-api 与 https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions。百炼DeepSeek采用enable_thinking，不套用DeepSeek直连的thinking参数。

执行结果：新增跨三模型测试先失败再通过；Node18、Vitest302与构建成功。三模型各12真实请求均通过，全部范围正确，T10英文原句匹配，三轮历史0/2/4。返回总usage35219Token；原始批次、汇总、辅助审阅、报告及配图已保存。独立代码复核APPROVED。默认模型未更改。
