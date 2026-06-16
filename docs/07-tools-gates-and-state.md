# Tools Gates And State

> Source split from `poison_execution_plan_zh.md`.

Detailed gate ownership now lives in
[docs/contracts/gate-rules.md](./contracts/gate-rules.md). This file keeps the
high-level tools, gates, and state narrative.

Contract owner note: this file is narrative orientation. If gate or run-state
details conflict with [Gate Rules](./contracts/gate-rules.md) or
[Run State](./contracts/run-state.md), the detailed contract files win and this
file should be corrected.

## 17. Screenshot Capture：截图捕获

实现 `src/tools/capture-screenshots.mjs`，由 `bin/poison.mjs` 调用。

使用 Playwright。

命令：

```bash
poison capture --url http://localhost:5173 --run .poison/runs/<run-id>
```

行为：

- 创建 `screenshots/`
- 捕获桌面截图
- 捕获移动端截图
- 收集 console errors
- 写入 `screenshot-manifest.json`

默认 viewports：

```json
[
  { "name": "desktop", "width": 1440, "height": 1000 },
  { "name": "mobile", "width": 390, "height": 844 }
]
```

路由应来自：

```text
.poison/runs/<run-id>/screen-inventory.json
```

如果没有 route inventory，则默认捕获 `/`。

输出：

```text
.poison/runs/<run-id>/
  screenshots/
    desktop-home.png
    mobile-home.png
  screenshot-manifest.json
  console.log
```

---

## 18. Gate Checks：门禁检查

实现 `src/tools/gate.mjs`，由 `bin/poison.mjs` 调用。

命令：

```bash
poison gate --run .poison/runs/<run-id>
```

The detailed V1 hard checks and warning checks live in
[Gate Rules](./contracts/gate-rules.md). Do not treat the list below as the
current hard-gate source of truth; it is retained as a legacy full-platform
check inventory for later versions.

Legacy full-platform check inventory:

```text
- run-state.json 是否存在且状态转移合法
- 关键产物是否通过 schema-check
- poison-core.current.md 是否存在
- protected-features.md 是否存在
- user-design-taste.md 是否存在
- visual-memory.md 是否存在
- run-contract.md 是否存在
- review-packet.md 是否存在
- screenshots 是否存在
- screenshot-manifest.json 是否存在
- console.log 是否存在
- 是否没有严重 console errors
- source files 中是否没有明显 placeholder 文本
- visual-review 输出是否存在
- visual poison findings 是否使用 taxonomy word 和 terminal 输出格式
- visual quality plus 与 poison 是否分开记录
- ux-review 输出是否存在
- frontend-review 输出是否存在
- review-summary.md 是否存在
- blocker / major findings 是否有 E0-E3 证据支持
- design-rationale.md 是否存在
- user-ambiguity-check.md 是否存在，且没有未处理 ambiguity
- 如果当前 run 是 completion audit，则 completion-report.md 是否存在
- arbiter repair plan 是否存在
- 没有 protected feature regression
- 没有无解释 visual memory drift
- final report 是否存在
- gate 通过后 run-state 是否进入 `gated`
```

Placeholder detection details also live in
[Gate Rules](./contracts/gate-rules.md). In V1, placeholder-looking UI is a
warning unless the active mode opts into a stricter gate.

placeholder 检测应标记：

```text
Lorem ipsum
TODO
Sample
Placeholder
Untitled
Example Card
Your app
```

输出：

```text
.poison/runs/<run-id>/gate-report.md
```

结构：

```md
# Gate Report

## Verdict
PASS | FAIL

## Hard checks

## Warnings

## Required fixes

## Next action
```

---

## 19. State Update：状态更新

实现 `src/tools/update-state.mjs`，由 `bin/poison.mjs` 调用。

命令：

```bash
poison update-state --run .poison/runs/<run-id>
```

它应该更新：

```text
.poison/runs/<run-id>/run-state.json
.poison/context/design-decisions.md
.poison/context/open-questions.md
.poison/context/prototype-map.md
.poison/context/interaction-backlog.md
.poison/context/design-source.md
.poison/context/protected-features.md
.poison/context/visual-memory.md
.poison/context/user-design-taste.md
.poison/context/changelog.md
```

v1 可以简单处理。优先追加结构化内容，而不是激进重写。

追加格式：

```md
## Run <run-id>

### 本轮变更

### 已确认决策

### 新增问题

### Backlog items

### 产出截图

### 完成度审计摘要
```

---
