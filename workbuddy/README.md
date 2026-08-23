# WorkBuddy 协作区

- `tasks/`：Codex 审核后的单任务实施说明。WorkBuddy 每次只读取并执行用户指定的一份。
- `reviews/`：Codex 对对应 commit 的复审记录。

Task 1 至 Task 5B 已由 Codex 复审通过。当前下一任务是 `tasks/TASK-05C-pain-point-acceptance.md`，但只有在 Codex 提供精确批准 HEAD 后才能开工。

其余 MVP 任务单已预先准备，但保持阻塞：

1. `tasks/TASK-06A-unit-economics-domain.md`
2. `tasks/TASK-06B-unit-economics-ui.md`
3. `tasks/TASK-07A-opportunity-scoring-domain.md`
4. `tasks/TASK-07B-opportunity-comparison-ui.md`
5. `tasks/TASK-08A-decision-domain.md`
6. `tasks/TASK-08B-decision-flow-acceptance.md`

WorkBuddy 不得因为任务单已存在而自行连续执行。每份任务单都必须等待前一任务获得 Codex `APPROVED`，并由用户转交包含真实起始 HEAD 的开工提示词。

流程：用户把当前任务交给 WorkBuddy → WorkBuddy 返回本地路径、完整交付说明和 commit SHA → Codex 独立复审 → 只有 `APPROVED` 后才生成下一任务。
