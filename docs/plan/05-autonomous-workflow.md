# Autonomous Workflow

> Source split from `poison_execution_plan_zh.md`.

## 6. Protected Features Initialization：保护边界初始化

`protected-features.md` 必须在 autonomous workflow 开始时决定,不能完全依赖后续自动推断。

发起 autonomous workflow 时,orchestrator 必须向用户询问一轮保护边界:

- 哪些页面、流程或交互已经满意,本轮不能破坏。
- 哪些视觉方向、信息层级或组件行为需要保留。
- 哪些功能可以小幅打磨,但不能改变核心语义。
- 哪些内容可以自由重做。

这个询问是一轮启动确认,不是每个交互问题都问用户。确认后写入:

```text
.poison/context/protected-features.md
```

结构:

```md
# Protected Features

## Protected pages

## Protected flows

## Protected interactions

## Protected visual direction

## Soft-protected areas

## Free-to-change areas

## Source
user-initialization | run-contract | imported-design | manual-update
```

规则:

- autonomous fix 不能删除、弱化或重定义 protected items。
- 修改 soft-protected areas 必须在 `design-rationale.md` 记录原因。
- free-to-change areas 可以自治优化,但仍不能越过 run contract。
- 用户后续可以显式更新 protected list,但系统不能因为 gate 通过就自动扩大保护范围。
- reviewer 和 gate 必须检查本轮修复是否造成 protected feature regression。

## 7. Autonomous Closure Policy：默认自治闭环

`poison` 的默认行为必须是自行闭环常见交互问题和设计缺陷,不能事无巨细都要求用户决策。

默认自治闭环范围:

- 按钮层级、交互反馈、loading、error、empty state、disabled state。
- 表单校验、输入辅助、错误恢复、确认/取消路径。
- 导航回路、返回路径、状态切换、基础响应式适配。
- 对齐、间距、密度、层级、可读性、一致性、色彩冲突、信息噪音。
- 不改变产品目标、不新增业务能力、不推翻用户已确认方向的局部优化。

默认闭环流程:

```text
protected-features init -> scope assessment -> context-pack -> reviewer finding -> arbiter classification -> designer discretion or must-fix -> builder repair -> gate verification
```

可以自治修复的条件:

- finding 有 design、poison-core、run-contract、rubric、截图、runtime 或代码证据。
- 修复不改变产品目标、目标用户、核心工作流或主要功能边界。
- 修复不删除或弱化 protected feature。
- 修复不把 open question 当成 confirmed fact。
- designer 能在 `design-rationale.md` 中解释取舍。

必须升级为 user decision 的条件:

- 会改变产品目标、目标用户或核心工作流。
- 会新增、删除或重排主要功能。
- 多个方向都合理,且取舍影响品牌、定位、商业策略或长期信息架构。
- 需要确认真实业务规则、数据含义、权限、合规、运营策略或不可逆操作。
- 用户明确要求先确认。
- 现有 SoT、visual-system、design-decisions、rubrics 和证据无法收敛。

自治修复也必须留痕:

- designer 在 `design-rationale.md` 记录重要取舍。
- arbiter 在 `repair-plan.md` 标记 `autonomous-fix` 或 `needs-user-decision`。
- gate 验证修复没有越过 run contract。

## 8. Decision HTML：界面决策页

实现 `src/tools/decision-html.mjs`，由 `bin/poison.mjs` 调用。

当不确定点涉及 UI、布局、交互、视觉风格或审美取向,且无法通过 Autonomous Closure Policy 自治收敛时，必须生成 HTML 决策页，让用户看界面做选择，而不是只给文字选项。

命令：

```bash
poison decision-html --question "选择搜索栏布局" --run .poison/runs/<run-id>
```

产物：

```text
.poison/runs/<run-id>/decisions/
  001-search-layout.html
  001-search-layout.md
```

HTML 决策页必须：

- 展示 2-3 个明确方案。
- 每个方案有真实 UI 片段或页面局部 mock。
- 标注该方案适用目标、主要取舍和风险。
- 使用 shared context，不发明新目标。
- 不替代正式原型、run contract 或 visual-system。

配套 Markdown 必须记录：

```md
# Decision Prompt

## Question

## Why visual decision is needed

## Options

## User choice

## Decision to write back
```

用户选择后，必须把裁决写回 `poison_execution_plan_zh.md`、`visual-system.md`、`design-decisions.md` 或对应契约文件。

---

## 9. User Ambiguity Check：用户理解歧义检查

实现 `src/tools/user-ambiguity-check.mjs`，由 `bin/poison.mjs` 调用。

当用户查看 HTML 决策页、prototype、completion audit 或 review summary 时，需要允许用户明确反馈：

- 看不懂这个产品是要做什么
- 不知道下一步怎么用
- 对页面、文案、流程或视觉表达产生疑惑
- 发现不合理或不可信的地方
- 理解了但不认同当前方向

命令：

```bash
poison ambiguity-check --run .poison/runs/<run-id>
```

产物：

```text
.poison/runs/<run-id>/user-ambiguity-check.md
```

结构：

```md
# User Ambiguity Check

## User observed

## User understood

## User did not understand

## Confusing points

## Unreasonable points

## Direction disagreement

## Required follow-up

## Status
CLEAR | HAS_AMBIGUITY | BLOCKED
```

硬规则：

> 未处理的 user ambiguity 不能进入完成状态。它必须回写到 poison-core、run-contract、design-rationale、interaction-backlog 或 open-questions 的其中之一。

---

