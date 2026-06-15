# Core Runtime Contracts

> Source split from `poison_execution_plan_zh.md`.

## 2. 核心概念

`poison` 不能允许多个 agent 各自发明不同的产品理解。

所有 agent 必须共同依赖两个 canonical 文件：

```text
.poison/context/poison-core.current.md
.poison/runs/<run-id>/run-contract.md
```

同时,每个 run 必须由 librarian 生成一份共享上下文包:

```text
.poison/runs/<run-id>/context-pack.md
.poison/runs/<run-id>/sot-index.json
.poison/runs/<run-id>/context-health.md
```

`context-pack.md` 是 designer、reviewer、builder 和 arbiter 的实际读取入口。它由 `.poison/context/*`、`run-contract.md`、已确认 decisions 和证据索引构建,并带有 `context-pack@rev`。

librarian 是中立 SoT 管理角色。它拥有受限写权限,只能根据已确认事实、用户裁决、已接受设计结论或明确证据更新 `.poison/context/*`。它不能输出主观审美判断、产品方向裁决或 reviewer vote。

### 2.1 `poison-core.current.md`

这是唯一可信的产品上下文。

必须包含：

```md
# Poison Core

## 产品一句话说明

## 目标用户

## 非目标用户

## 核心 Job-to-be-done

## 核心工作流

## 页面清单

## 信息层级

## 领域对象

## 已确认决策

## 待确认问题

## 非目标 / 不做事项

## 视觉方向

## 设计约束

## 来源追踪
```

### 2.2 `run-contract.md`

这个文件定义当前 run 的边界。

必须包含：

```md
# Run Contract

## 模式
seed | evolve | full | review | harden

## Core 版本
poison-core.vN

## 本轮会修改什么

## 本轮不会修改什么

## 包含的页面

## 包含的交互

## 包含的状态

## 冻结决策

## 变更预算

## 验收标准
```

硬规则：

> designer、builder、reviewer、arbiter 都不能在 `poison-core.current.md`、`run-contract.md` 和当前 `context-pack.md` 之外重新定义产品目标、目标用户、核心工作流或范围。designer、builder、reviewer、arbiter 不能直接修改 SoT;它们只能向 librarian 提出事实变更请求、指出冲突或发起 `sot query`。

### 2.3 SoT 查询协议

designer、reviewer、builder 和 arbiter 需要更多事实信息时,不能自由对话式询问 librarian,必须通过统一入口:

```bash
poison sot query --run <run-id> --topic "primary user action"
```

返回结构:

```json
{
  "answer": "...",
  "source": "...",
  "status": "CONFIRMED | UNKNOWN | CONFLICTED | OPEN"
}
```

规则:

- `CONFIRMED`: SoT 中有明确事实和来源。
- `UNKNOWN`: SoT 中没有该事实,librarian 必须写入 `.poison/context/open-questions.md`。
- `CONFLICTED`: SoT 中存在冲突,librarian 必须写入 `.poison/runs/<run-id>/context-health.md`。
- `OPEN`: 事实存在但仍等待用户或上游决策。
- librarian 不能为回答查询而发明事实。
- SoT 更新后必须 bump revision 并重建 `context-pack.md`。
- 同一轮 reviewer ensemble 不能混用不同 `context-pack@rev`。

### 2.4 Run Lifecycle / 状态机

每个 run 必须有显式状态文件:

```text
.poison/runs/<run-id>/run-state.json
```

状态枚举:

```text
created
context_ready
protected_ready
scope_assessed
designing
prototype_ready
captured
reviewed
repaired
gated
completed
blocked
```

建议结构:

```json
{
  "runId": "001-test-seed",
  "mode": "seed",
  "status": "created",
  "previousStatus": null,
  "blockedReason": null,
  "nextRecommendedAction": "init-protected-features",
  "artifacts": [],
  "updatedAt": "ISO-8601"
}
```

状态转移规则:

- `new-run` 创建 `created`。
- librarian 生成 `context-pack.md`、`sot-index.json`、`context-health.md` 后进入 `context_ready`。
- `init-protected-features` 完成后进入 `protected_ready`。
- `assess-scope` 完成后进入 `scope_assessed`。
- designer 开始工作时进入 `designing`。
- 原型或设计产物可检查时进入 `prototype_ready`。
- `capture` 完成截图和 runtime 证据后进入 `captured`。
- reviewer ensemble 完成后进入 `reviewed`。
- repair plan 执行或确认无需修复后进入 `repaired`。
- `gate` 通过后进入 `gated`。
- final report、state update 和未处理问题检查完成后进入 `completed`。
- 信息不足、运行失败、用户 ambiguity 未处理、context conflict 或 evidence 不足时进入 `blocked`。

命令顺序硬规则:

- 没有 `context-pack.md`,不能 review。
- 没有 screenshots,不能 visual review 或声称 UI 完成。
- 有 unresolved user ambiguity,不能进入 `completed`。
- blocker / major 缺少足够 evidence,不能进入 `gated`。
- `gate` 失败只能回到 `repaired`、`reviewed` 或 `blocked`。
- completion audit 信息不足必须输出 `blocked`,不能假装完成。

### 2.5 Output Contract / 产物结构

所有关键产物必须既能给人读,也能被 gate 和后续工具做轻量解析。V1 不引入复杂 JSON Schema,只做必填字段和必填章节检查。

Markdown 产物必须包含统一 metadata block:

```md
---
schemaVersion: 1
runId: <run-id>
artifact: <artifact-name>
status: DRAFT | READY | BLOCKED | PASS | FAIL
source: <command-or-role>
updatedAt: <ISO-8601>
---
```

Markdown 产物必须按需包含以下章节。没有内容时也要写 `none` 或说明原因:

```md
## Summary
## Inputs
## Evidence
## Decisions
## Open Questions
## Next Actions
```

JSON 产物必须包含:

```json
{
  "schemaVersion": 1,
  "runId": "<run-id>",
  "artifact": "<artifact-name>",
  "status": "READY",
  "updatedAt": "ISO-8601",
  "artifacts": []
}
```

关键产物:

```text
run-state.json
run-contract.md
context-pack.md
scope-assessment.md
design-rationale.md
user-ambiguity-check.md
review-packet.md
review-summary.md
direction-synthesis.md
repair-plan.md
gate-report.md
completion-audit-packet.md
completion-report.md
```

V1 工具:

```bash
poison schema-check --run .poison/runs/<run-id>
```

规则:

- gate 必须调用 schema-check 或等价 core module。
- schema-check 只检查必填字段、必填章节和 JSON parse,不做复杂语义判断。
- 缺少 schema metadata 的产物不能进入 `gated`。
- `status: BLOCKED` 的产物必须包含 blocked reason 和 next action。
- 产物不能只写散文;关键信息必须放在固定字段或固定章节里。

---

