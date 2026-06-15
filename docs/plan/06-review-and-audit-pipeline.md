# Review And Audit Pipeline

> Source split from `poison_execution_plan_zh.md`.

## 10. Readiness Assessment：输入完整度评估

实现 `src/tools/assess-readiness.mjs`，由 `bin/poison.mjs` 调用。

v1 可以先用简单启发式规则。脚本应该扫描以下信号：

- 目标用户
- 页面 / screens
- 工作流
- 状态
- 权限
- 数据对象
- 视觉约束
- 平台约束
- 边界场景
- 成功标准

输出：

```md
# Readiness Assessment

## 分数
0-100

## 选择模式
seed | evolve | full | review | harden

## 判断原因

## 缺失信息

## 推荐下一步
```

启发式规则：

```text
0-30: seed
31-69: evolve
70-100: full
```

允许在 Skill instructions 中手动覆盖。

---

## 11. Review Packet：审阅包

实现 `src/tools/build-review-packet.mjs`，由 `bin/poison.mjs` 调用。

它应该生成：

```text
.poison/runs/<run-id>/review-packet.md
```

结构：

```md
# Review Packet

## Core 版本

## 当前 Run Contract

## 待审阅截图

## 相关流程

## 冻结决策

## 允许审阅范围

## 超出范围事项

## 必须遵循的输出格式
```

review packet 必须明确写出：

```md
Reviewers 可以：
- 识别对 poison-core 的违反
- 识别对 run-contract 的违反
- 识别视觉、UX、前端、覆盖度问题
- 给出具体修复建议

Reviewers 不可以：
- 重新定义目标用户
- 重新定义产品目标
- 发明新的大模块
- 推翻冻结决策
- 提出超出本轮范围的大重构
```

---

## 12. Reviewer Ensemble：审阅委员会

创建 `references/review-ensemble.md` 和 `skills/poison/reviewers/*.md`。

`poison_taxonomy_single_word_full.md` 是 visual poison 的全集标准源。实现时应同步为:

```text
skills/poison/references/poison-taxonomy.md
```

designer 和 reviewer 不要求每轮读取或检查 taxonomy 全集。orchestrator 必须为每个 reviewer 分配一个 taxonomy subset;不同 reviewer 的 subset 可以重叠,但整体 reviewer ensemble 应覆盖本轮最相关的类别。

arbiter 和 user-facing summary 可以使用 taxonomy 全集。arbiter 负责去重、汇总和判断 severity,不能因为某个 reviewer 没覆盖某类 poison 就把它当作不存在。

默认 taxonomy 类别:

```text
Core Vocabulary
Navigation / IA
Interaction
Cognition
Trust
Content / Copy
Flow / Task
Accessibility
Responsive / Device
Performance Perception
Design System
AI Prototype Specific
```

推荐 subset 分配:

```text
product-realist        Core, Flow / Task, Trust, AI Prototype Specific
ux-operator            Navigation / IA, Interaction, Cognition, Flow / Task
visual-craft           Core, Accessibility, Responsive / Device, Design System
frontend-pragmatist    Responsive / Device, Performance Perception, Accessibility, Design System
contrarian-taste       Trust, AI Prototype Specific, Content / Copy, Core
```

subset 分配是 token / attention 控制,不是权限限制。reviewer 可以报告自己 subset 之外的明显 poison,但不能假装已经全量审计 taxonomy。

V1 默认 reviewer profiles：

```text
product-realist        产品目标、价值表达、范围控制
ux-operator            流程、状态、信息架构、使用效率
visual-craft           排版、节奏、层级、审美完成度
frontend-pragmatist    runtime、响应式、实现一致性
contrarian-taste       专门找“不对劲”的地方，但必须给证据
```

每个 reviewer profile 必须包含：

```md
# Reviewer Profile

## Name

## Spawn voice template

## Personality

## Taste / Bias

## Focus Areas

## Taxonomy subset

## Anti-patterns to catch

## Questions this reviewer asks

## What this reviewer must not do
```

所有 subagent spawn 时必须输出一行 voice：

```text
<agent-id>-spawned: "<voice>"
```

voice 必须包含：

- agent id
- role 或 reviewer profile
- 个性 / 偏好 / 关注点
- 本轮目标
- 本轮不会越过的 scope
- 当前 `context-pack@rev`

示例：

```text
reviewer-03-spawned: "我是 visual-craft,我很挑剔,偏向简洁明了的设计方向;本轮目标是找出搜索栏的层级、密度和可读性问题,使用 context-pack@rev-3,不会重新定义产品目标。"
```

硬规则：

> spawn voice 只能复述 shared context 和 reviewer profile，不能引入新的目标、范围或产品假设。

### 12.1 Shared context

所有 reviewer 必须共享：

```text
.poison/context/poison-core.current.md
.poison/context/visual-system.md
.poison/context/visual-memory.md
.poison/context/design-decisions.md
.poison/context/protected-features.md
.poison/runs/<run-id>/run-contract.md
.poison/runs/<run-id>/context-pack.md
.poison/runs/<run-id>/sot-index.json
当前截图、runtime evidence、当前 mode rubrics
```

共享上下文定义目标、范围、冻结决策和证据。reviewer 不能在 shared context 之外重写产品目标。

### 12.2 Private context

每个 reviewer 读取自己的 profile。private context 只允许影响：

- 关注重点
- 审美倾向
- 提问方式
- 对风险的敏感度
- 发现问题的角度

private context 不能覆盖 shared context。

### 12.3 Resource / Depth Policy

`poison` 必须自行判断本轮资源深度,不能把 reviewer 数量和审阅深度全部交给用户手动选择。

用户显式声明优先级最高:

- `fast`: 优先速度和 token 控制
- `standard`: 平衡质量和成本
- `deep`: 优先覆盖度和风险发现

如果用户没有显式声明,orchestrator 必须根据 scope assessment 自动选择:

```text
horizontal breadth = 页面、路由、状态、组件面数量
vertical depth = 单个功能的业务复杂度、交互复杂度、状态复杂度、风险复杂度
```

横向扩容规则:

- 页面或路由较多时,增加 reviewer 覆盖面,按页面/流程分片审阅。
- 多个独立页面可以并行 reviewer,每个 reviewer 必须拿到同一个 `context-pack@rev`。
- 横向扩容不能让 reviewer 各自定义目标;只能扩大覆盖面。

纵向加深规则:

- 单个功能复杂时,不要只增加页面覆盖,而要增加同一功能的审阅深度。
- 复杂交互、关键业务路径、状态机、权限、表单、支付、数据编辑、可逆/不可逆操作等,应触发更深的 UX、product、frontend 和 edge-case 审阅。
- 纵向加深可以让多个 reviewer 审同一页面,但关注不同层面。

默认策略:

```text
small/simple      -> fast: librarian + designer + 1-2 reviewers
medium/normal    -> standard: librarian + designer + 3 reviewers
large/pages-many -> breadth expansion: 3-5 reviewers, page/flow sharding
complex/risky    -> depth expansion: 3-5 reviewers, same flow deep review
large+complex    -> staged review: breadth first, then depth on risky flows
```

每个 run 必须输出:

```text
.poison/runs/<run-id>/scope-assessment.md
```

记录:

- detected page/route count
- detected flows and critical paths
- complexity signals
- selected depth: `fast | standard | deep`
- selected expansion: `none | breadth | depth | staged`
- selected reviewer set
- user override, if any
- token/efficiency rationale

如果用户显式指定深度,orchestrator 必须遵守,但仍要记录实际风险。如果用户指定 `fast` 而系统判断风险高,必须继续 fast,同时在 `scope-assessment.md` 和 final report 中标注 skipped risk。

### 12.4 无目标状态

当 run 没有明确目标、只是探索方向时，reviewer 不投票。

输出：

```text
.poison/runs/<run-id>/direction-synthesis.md
```

结构：

```md
# Direction Synthesis

## Consensus opportunities

## Disagreements

## Promising directions

## Questions for user

## Ideas not to execute yet
```

无目标状态不能直接生成 repair plan。

### 12.5 有目标状态

当目标来自用户、run contract、completion audit 或 harden criteria 时，reviewer 一人一票。所有 reviewer 投票权相同，不按角色、场景或 mode 加权。

每个 reviewer 输出：

```md
## Vote
PASS | PASS_WITH_FIXES | FAIL | BLOCKED

## Vote reason
```

arbiter 汇总：

```text
.poison/runs/<run-id>/review-summary.md
```

结构：

```md
# Review Summary

## Target

## Vote tally

## Majority position

## Minority concerns

## Evidence-backed blockers

## Designer discretion items

## Backlog items

## Rejected personal-taste findings
```

硬规则：

> reviewer 只有 critique / vote 权。多数票不能强制新增超出 run contract 的功能，也不能剥夺 designer 在 scope 内的方案自主权。

---

## 13. Completion Audit：界面完成度审计

实现 `src/tools/build-completion-audit-packet.mjs` 和 `src/tools/write-completion-report.mjs`，由 `bin/poison.mjs` 调用。

命令：

```bash
poison review --design docs/design.md --url http://localhost:5173 --audit completion
poison audit-completion --design docs/design.md --url http://localhost:5173 --run .poison/runs/<run-id>
```

`audit-completion` 是 review mode 的确定性 action 映射，不是第六种 mode。

输入：

```text
--design <file>                  已确认 design/spec/PRD
--url <local-url>                已运行前端地址
--run <run-dir>                  当前 run
--routes <file>                  可选 route inventory
--source-root <dir>              可选前端源码根目录
```

产物：

```text
.poison/runs/<run-id>/
  completion-audit-packet.md
  completion-report.md
```

`completion-audit-packet.md` 必须包含：

```md
# Completion Audit Packet

## Design Source

## Poison Core Version

## Current Run Contract

## Implemented Routes

## Screenshots

## Runtime Evidence

## Source Evidence

## Audit Scope

## Out-of-scope

## Required Output Format
```

`completion-report.md` 必须包含：

```md
# Completion Audit Report

## Verdict
COMPLETE | PARTIAL | INCOMPLETE | BLOCKED

## Overall Completion
0-100

## Coverage Matrix
| Design requirement | Status | Evidence | Severity | Recommended next step |

## Implemented

## Partially implemented

## Missing

## Deviations from design

## Runtime and responsive issues

## Recommended next mode
evolve | harden | review | none

## Backlog candidates
```

完成度状态：

```text
implemented: design 要求已在截图/runtime/source 中得到证实
partial: 有实现痕迹，但关键状态、交互、内容或响应式缺失
missing: design 要求没有可验证实现
deviation: 实现存在，但偏离 design、poison core 或 run contract
blocked: 缺少 design、无法运行、无法截图或证据不足
```

硬规则：

> completion audit 只能基于 design、poison core、run contract、截图、runtime output 或源码证据给出结论。没有证据的主观判断不能计入完成度分数。

---

## 14. Evidence Model：证据等级

reviewer、arbiter、completion audit 和 gate 必须使用同一套证据等级。证据等级决定 finding 能否升级为 blocker 或 major。

证据等级:

```text
E0 user decision      用户明确裁决、protected-features、run-contract 冻结决策
E1 runtime/screenshot 真实截图、浏览器运行结果、console output、响应式截图
E2 source/design      代码证据、design/spec/PRD、poison-core、visual-memory、visual-system
E3 rubric/taxonomy    poison-taxonomy、completion-rubric、visual/ux/frontend rubrics
E4 reviewer opinion   reviewer taste、经验判断、方向性建议
```

severity 规则:

- `blocker` 必须至少有 E0、E1 或 E2 证据,并且影响用户完成任务、违反 run contract、破坏 protected feature、造成 trust/safety/accessibility 问题,或导致 runtime 不可用。
- `major` 必须至少有 E1、E2 或 E3 证据,并且明显影响理解、效率、视觉连续性、完成度或关键状态。
- `minor` 可以基于 E2 或 E3,用于局部质量问题和低风险改进。
- `suggestion` 可以基于 E4,但不能被 arbiter 升级为 must-fix。

证据冲突规则:

- E0 高于所有其他证据。用户明确裁决或 run contract 冻结项不能被 reviewer opinion 覆盖。
- E1 高于纯设计猜测。截图/runtime 显示的问题必须优先处理。
- E4 只能触发讨论或 designer discretion,不能单独触发 blocker、major 或 gate fail。
- 如果证据不足,输出 `BLOCKED` 或 `needs-evidence`,不要假装完成判断。

每个 finding 必须写明:

```md
- evidence level: E0 | E1 | E2 | E3 | E4
- evidence source:
- why severity is justified:
```

## 15. Reviewer 输出格式

创建 `references/review-schema.md`。

每个 reviewer 必须输出：

```md
# Review Result

## Reviewer
product-realist | ux-operator | visual-craft | frontend-pragmatist | contrarian-taste | custom

## Spawn voice
<agent-id>-spawned: "<voice>"

## Verdict
PASS | PASS_WITH_FIXES | FAIL

## Vote
PASS | PASS_WITH_FIXES | FAIL | BLOCKED

## Vote reason

## Reviewed against
- poison-core version:
- run-contract:
- reviewer profile:

## Scope compliance

## Product alignment

## Findings

### Finding 1
- severity: blocker | major | minor
- screen:
- issue:
- poison:
- antidote:
- category:
- evidence level: E0 | E1 | E2 | E3 | E4
- evidence source:
- why severity is justified:
- evidence:
- source: design | poison-core | run-contract | completion-rubric | visual-rubric | ux-rubric | frontend-rubric | screenshot | runtime | code
- recommended fix:

## Non-blocking suggestions

## Out-of-scope observations
```

硬规则：

> 一个 finding 如果不能引用 design、`poison-core`、`run-contract`、rubric、截图证据、runtime output 或代码证据，就不能被标记为 blocker。

> 每次发现 visual poison,必须在 terminal 输出: `[emoji] found poison - <poison> : <description>`。每次解决 visual poison,必须输出: `[emoji] resolved poison - <poison> : <description>`。

> visual poison finding 必须引用 `poison-taxonomy.md` 中的 poison word、healthy word 和描述模板。纯个人偏好不能伪装成 taxonomy finding。

## 15.1 Visual Quality Pluses

visual poison 是最低标准,只负责识别负向问题。`poison` 还必须维护正向加分项:

```text
skills/poison/references/visual-quality-pluses.md
.poison/context/user-design-taste.md
```

`visual-quality-pluses.md` 记录通用正向质量信号:

- strong hierarchy
- clear focal point
- purposeful density
- domain specificity
- elegant constraint
- interaction confidence
- state completeness
- responsive grace
- trust clarity
- visual memory

`user-design-taste.md` 记录用户特定偏好:

- 喜欢的产品或界面参考
- 不喜欢的风格
- 偏好的密度、色彩、圆角、动效、文案语气
- 希望避免的套路
- 已确认的 taste decisions

规则:

- visual quality plus 可以提升 design-rationale 和 final summary 的评价,但不能掩盖 blocker poison。
- user design taste 优先于 reviewer 的个人偏好,但不能覆盖可用性、可访问性、trust 和 run contract。
- reviewer 可以记录 plus,但 arbiter 负责把 plus 与 poison 分开汇总。

## 15.2 Visual Memory

`visual-memory.md` 记录当前产品已经形成的视觉事实和连续性,不是用户偏好清单。

路径:

```text
.poison/context/visual-memory.md
```

必须记录:

- confirmed density and layout rhythm
- color, radius, shadow, typography, icon style
- key component semantics
- navigation and page structure patterns
- content voice already used in UI
- accepted visual decisions by run
- reasons for any visual memory change

规则:

- designer 每轮必须读取 visual memory。
- reviewer 必须检查 drift、erosion 和 unexplained visual reset。
- 如果需要改变 visual memory,必须在 `design-rationale.md` 说明原因,并写入 `design-decisions.md`。
- visual memory 是当前产品事实;user-design-taste 是用户偏好。两者冲突时,需要由 designer 说明取舍,必要时升级为 user decision。

---

## 16. Review Arbiter：审阅仲裁

创建 `skills/poison/roles/review-arbiter.md`。

arbiter 必须：

- 合并 reviewer 输出
- 使用 `poison-taxonomy.md` 全集复核 visual poison findings
- 使用 Evidence Model 复核每个 finding 的 severity
- 汇总一人一票的 vote tally
- 在无目标状态下生成 direction synthesis，而不是 repair plan
- 去重 findings
- 拒绝超出 scope 的建议
- 降级纯个人偏好的 finding
- 重新判定严重级别
- 生成 repair plan
- 把非当前范围建议移动到 backlog
- 将 completion audit findings 分流为当前 repair、后续 backlog 或 design/open-question
- 将普通交互问题和设计缺陷优先分流为 `autonomous-fix`
- 只有触发 user decision 条件时,才分流为 `needs-user-decision`
- 将 visual poison 与 visual quality plus 分开汇总
- 将 user design taste 作为偏好裁决依据,但不能覆盖可用性、可访问性、trust 和 run contract
- 将 E4-only finding 降级为 suggestion 或 designer discretion

输出：

```text
.poison/runs/<run-id>/review-summary.md
.poison/runs/<run-id>/repair-plan.md
```

结构：

```md
# Repair Plan

## 接受的修复项

## 拒绝的 findings

## 延后处理的 backlog items

## Blockers

## Major fixes

## Minor fixes

## Autonomous fixes

## Needs user decision

## 实现顺序

## 对 Gate 的影响
```

硬规则：

> reviewers 不直接指挥 builder。builder 只应该根据 arbiter 产出的 repair plan 执行修复。

> arbiter 不能把多数审美偏好直接升级为 must fix。只有违反目标、范围、可用性、runtime、gate 或冻结决策的问题才能成为 must fix。

---

