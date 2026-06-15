# Harness Adapter Contract

> Source split from `poison_execution_plan_zh.md`.

## 5. Harness Adapter Contract：双端一致性与能力降级

Claude Code 和 Codex 都是一等支持目标,但它们的可用工具能力可能不同。`poison` 的核心契约必须一致,adapter 只能处理加载、提示和能力降级。

唯一 source of truth:

```text
skills/poison/**
src/core/**
src/tools/**
bin/poison.mjs
```

adapter 只能包装这些入口:

```text
.claude-plugin/
.codex-plugin/
skills/poison/references/harness-claude.md
skills/poison/references/harness-codex.md
skills/poison/references/adapter-contract.md
```

硬规则:

- adapter 不能定义自己的 mode、review schema、gate rule、run-state、output contract、reviewer profile 或 artifact schema。
- adapter 必须调用同一套 `poison` command 或 `src/core` module。
- adapter 输出差异只能存在于 harness instruction 层,不能改变 `.poison/**` 产物格式。
- 如果当前 harness 缺少能力,必须显式降级,不能静默跳过 gate。

Capability matrix:

```text
capability                  Codex                         Claude Code
browser screenshots          likely via Playwright/tool     not guaranteed
runtime console capture      likely via Playwright/tool     not guaranteed
filesystem edits             available                     available
subagent orchestration        harness-dependent             harness-dependent
terminal command execution    available                     available
HTML decision page creation   available                     available
```

降级规则:

- 如果没有 Playwright 或浏览器能力,`poison capture` 必须输出 clear manual steps 和 `needs-manual-evidence`。
- 缺少截图时,不能执行 visual review 或声称 UI 完成;run-state 必须进入 `blocked` 或保持在可恢复状态。
- 如果 harness 不能自动读取 console,必须要求用户提供 console output 或标记 evidence 缺失。
- 如果 subagent 能力不足,可以串行运行 reviewer profiles,但必须保留 spawn voice、taxonomy subset、evidence model 和 arbiter 汇总。
- 降级路径必须写入 `context-health.md`、`run-state.json` 或对应 report,并给出 `nextRecommendedAction`。

V1 需要提供:

```text
skills/poison/references/adapter-contract.md
skills/poison/references/harness-claude.md
skills/poison/references/harness-codex.md
```

