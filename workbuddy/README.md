# WorkBuddy 协作区

- `tasks/`：Codex 审核后的单任务实施说明。WorkBuddy 每次只读取并执行用户指定的一份。
- `reviews/`：Codex 对对应 commit 的复审记录。

Task 1 已由 Codex 复审通过。当前任务：`tasks/TASK-02-data-contracts-demo-dataset.md`。

流程：用户把当前任务交给 WorkBuddy → WorkBuddy 返回本地路径、完整交付说明和 commit SHA → Codex 独立复审 → 只有 `APPROVED` 后才生成下一任务。
