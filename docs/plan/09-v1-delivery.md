# V1 Delivery

> Source split from `poison_execution_plan_zh.md`.

## 22. 第一版验收标准

第一版完成时，以下能力必须可用。

### A. 初始化

```bash
node bin/poison.mjs init
```

创建：

```text
.poison/context/
.poison/runs/
```

以及默认上下文文件,至少包括:

```text
.poison/context/poison-core.current.md
.poison/context/protected-features.md
.poison/context/visual-system.md
.poison/context/visual-memory.md
.poison/context/user-design-taste.md
.poison/context/design-decisions.md
.poison/context/open-questions.md
```

### B. 创建新 run

```bash
node bin/poison.mjs new-run --mode seed --name test-seed
```

创建：

```text
.poison/runs/001-test-seed/
  run-state.json
  run-contract.md
  readiness-assessment.md
  context-pack.md
  sot-index.json
  context-health.md
```

`run-state.json` 初始状态必须是 `created`,并给出 `nextRecommendedAction`。

### C. Protected features initialization

```bash
node bin/poison.mjs init-protected-features --run .poison/runs/001-test-seed
```

创建或更新：

```text
.poison/context/protected-features.md
```

必须体现用户启动 autonomous workflow 时确认的一轮保护边界。

完成后 `run-state.json` 必须进入 `protected_ready`。

### D. SoT 查询

```bash
node bin/poison.mjs sot query --run .poison/runs/001-test-seed --topic "primary user action"
```

返回：

```json
{
  "answer": "...",
  "source": "...",
  "status": "CONFIRMED | UNKNOWN | CONFLICTED | OPEN"
}
```

`UNKNOWN` 必须写入 `.poison/context/open-questions.md`。`CONFLICTED` 必须写入 `.poison/runs/001-test-seed/context-health.md`。

SoT 查询发现 conflict 时,`run-state.json` 必须进入或保持 `blocked`。

### E. Scope assessment

```bash
node bin/poison.mjs assess-scope --run .poison/runs/001-test-seed
```

创建：

```text
.poison/runs/001-test-seed/scope-assessment.md
```

必须输出：

- selected depth: `fast | standard | deep`
- selected expansion: `none | breadth | depth | staged`
- selected reviewer set
- user override, if any
- token/efficiency rationale

完成后 `run-state.json` 必须进入 `scope_assessed`。

### F. 截图捕获

在本地 app 已运行时：

```bash
node bin/poison.mjs capture --url http://localhost:5173 --run .poison/runs/001-test-seed
```

创建截图和 manifest。

### G. Review packet

```bash
node bin/poison.mjs build-review-packet --run .poison/runs/001-test-seed
```

创建：

```text
.poison/runs/001-test-seed/review-packet.md
```

### H. Decision HTML

当存在视觉不确定点时：

```bash
node bin/poison.mjs decision-html --question "选择搜索栏布局" --run .poison/runs/001-test-seed
```

创建：

```text
.poison/runs/001-test-seed/decisions/001-search-layout.html
.poison/runs/001-test-seed/decisions/001-search-layout.md
```

### I. User ambiguity check

当用户查看决策页、原型或 review summary 后：

```bash
node bin/poison.mjs ambiguity-check --run .poison/runs/001-test-seed
```

创建：

```text
.poison/runs/001-test-seed/user-ambiguity-check.md
```

如果用户反馈看不懂、不会用、有疑惑或发现不合理点，必须输出 `HAS_AMBIGUITY` 或 `BLOCKED`。

如果输出 `HAS_AMBIGUITY` 或 `BLOCKED`,`run-state.json` 不能进入 `completed`。

### J. Reviewer ensemble

在有目标状态下：

```bash
node bin/poison.mjs review --run .poison/runs/001-test-seed
```

创建：

```text
.poison/runs/001-test-seed/review-summary.md
```

在无目标状态下，必须创建：

```text
.poison/runs/001-test-seed/direction-synthesis.md
```

reviewer 投票必须是一人一票，不做场景或角色加权。

blocker / major finding 必须包含 evidence level、evidence source 和 severity justification。

完成后 `run-state.json` 必须进入 `reviewed`。

### K. Schema check

```bash
node bin/poison.mjs schema-check --run .poison/runs/001-test-seed
```

必须检查关键 Markdown 产物 metadata block、必填章节、JSON 产物必填字段和 JSON parse。

缺少 schema metadata 或必填章节的关键产物不能进入 `gated`。

### L. Gate

```bash
node bin/poison.mjs gate --run .poison/runs/001-test-seed
```

创建：

```text
.poison/runs/001-test-seed/gate-report.md
```

如果 reviews 缺失，gate 可以失败，但必须清晰失败，并输出可执行的修复信息。

如果 blocker / major finding 缺少 E0-E3 证据，gate 必须失败或要求 arbiter 降级。

如果当前 harness 缺少 Playwright、browser screenshot 或 console capture,gate 必须看到明确 manual evidence、`needs-manual-evidence` 或 `blocked` 说明,不能静默通过。

gate 通过后 `run-state.json` 必须进入 `gated`;gate 失败必须进入 `repaired`、`reviewed` 或 `blocked`,并给出 `nextRecommendedAction`。

### M. Completion audit

在本地 app 已运行，且提供 design 文件时：

```bash
node bin/poison.mjs audit-completion --design docs/sample-design.md --url http://localhost:5173 --run .poison/runs/001-test-seed
```

创建：

```text
.poison/runs/001-test-seed/completion-audit-packet.md
.poison/runs/001-test-seed/completion-report.md
```

即使 design 或 runtime 信息不足，也必须输出 `BLOCKED` verdict 和缺失证据清单。

---

## 23. V1 非目标

第一版不要实现这些：

- Figma export
- pixel-perfect visual diffing
- 复杂视觉评分模型
- 自动设计系统抽取
- 除截图外的复杂浏览器交互自动化
- 远程部署
- 真实 multi-worktree merge strategy
- report 中嵌入图片
- scripts 内部调用 LLM API
- 自动根据 completion audit 直接改代码
- 无证据地估算完成度百分比

V1 应该让 Claude / Codex agents 负责智能推理，让 scripts 负责确定性的文件系统、截图和 gate 操作。

---

## 24. 工程注意事项

优先使用 Node `.mjs` modules 和一个 `bin/poison.mjs` CLI 入口，方便跨环境运行。

除非必要，不要添加重依赖。

如果没有安装 Playwright，`poison capture` 应该输出清晰提示：

```text
Playwright is required. Install with:
npm install -D playwright
npx playwright install chromium
```

不要在没有备份或版本化文件的情况下覆盖 `.poison/context/poison-core.current.md`。

Run ID 应该确定、可排序：

```text
001-seed
002-evolve-review-detail
003-full-spec
```

如果没有提供 run name，则生成：

```text
<next-number>-<mode>
```

---

## 25. 最终交付物

实现完成后，输出一份 summary：

```md
# Poison V1 Implementation Summary

## 创建的文件

## 新增脚本

## 已测试命令

## 已可用能力

## 界面完成度审计能力

## Stubbed / 尚未完整实现的能力

## 已知限制

## 推荐下一步实现方向
```

同时提供至少一组 dry-run 命令，展示如何使用新的 `poison` workflow。

---

## 26. 推荐 Dry-run 命令序列

```bash
node bin/poison.mjs init

node bin/poison.mjs new-run \
  --mode seed \
  --name test-seed

node bin/poison.mjs init-protected-features \
  --run .poison/runs/001-test-seed

node bin/poison.mjs assess-readiness \
  --input ./docs/sample-prd.md \
  --run .poison/runs/001-test-seed

node bin/poison.mjs assess-scope \
  --run .poison/runs/001-test-seed

node bin/poison.mjs build-review-packet \
  --run .poison/runs/001-test-seed

node bin/poison.mjs decision-html \
  --question "选择搜索栏布局" \
  --run .poison/runs/001-test-seed

node bin/poison.mjs ambiguity-check \
  --run .poison/runs/001-test-seed

node bin/poison.mjs audit-completion \
  --design ./docs/sample-design.md \
  --url http://localhost:5173 \
  --run .poison/runs/001-test-seed

node bin/poison.mjs schema-check \
  --run .poison/runs/001-test-seed

node bin/poison.mjs gate \
  --run .poison/runs/001-test-seed
```

如果本地 app 已经运行：

```bash
node bin/poison.mjs capture \
  --url http://localhost:5173 \
  --run .poison/runs/001-test-seed
```

