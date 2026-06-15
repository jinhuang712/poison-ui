# Skill And Role Contracts

> Source split from `poison_execution_plan_zh.md`.

## 20. Skill Entrypoint

创建 `skills/poison/SKILL.md`。

它必须清晰定义行为。

必须包含的重要规则：

```md
# Poison

Poison 基于 prompt、spec、PRD 或 documents 生成并演进高保真可运行 UI 原型。

## 不可违反规则

- 始终建立或读取 `poison-core.current.md`。
- 修改文件前始终创建 `run-contract.md`。
- 不允许 subagents 创建自己的私有产品理解。
- 每个 run 必须先由 librarian 构建 `context-pack.md`、`sot-index.json` 和 `context-health.md`。
- librarian 只能根据已确认事实、用户裁决、已接受设计结论或明确证据更新 SoT,且必须记录来源。
- designer、builder、reviewer、arbiter 不能直接修改 SoT;需要更多事实时必须使用 `poison sot query`。
- 不允许在 poison core 之外重新定义目标用户、产品目标或核心工作流。
- 发起 autonomous workflow 时必须先向用户询问一轮 protected features 并写入 `protected-features.md`。
- 除非用户明确要求 text-only planning，否则不能在没有截图的情况下宣称完成。
- 常见交互问题和设计缺陷必须默认自治闭环,不能事无巨细要求用户决策。
- 只有触发 user decision 条件时,才生成 HTML 决策页让用户看界面选择。
- `poison_taxonomy_single_word_full.md` / `poison-taxonomy.md` 是 visual poison 的最低标准全集。
- reviewer 只需检查被分配的 taxonomy subset,避免全量审查导致 token 浪费或注意力涣散。
- arbiter 和 user-facing summary 可以使用 taxonomy 全集。
- `visual-memory.md` 记录当前产品已经形成的视觉连续性,不同于 `user-design-taste.md`。
- 每次发现 visual poison 必须输出 `[emoji] found poison - <poison> : <description>`。
- 每次解决 visual poison 必须输出 `[emoji] resolved poison - <poison> : <description>`。
- visual quality plus 和 user design taste 必须与 visual poison 分开记录。
- blocker / major finding 必须有 E0-E3 证据支持;E4-only 只能是 suggestion 或 designer discretion。
- designer 是主创，不是 reviewer 的执行者；designer 可以拒绝 discretion 建议，但必须写入 design-rationale。
- user ambiguity 必须单独记录；用户看不懂、不知道怎么用、产生疑惑或发现不合理点时，不能进入完成状态。
- 必须自行判断 reviewer 资源深度；页面多时横向扩容，功能复杂时纵向加深。
- 用户显式声明 `fast | standard | deep` 时优先遵守，但必须记录被跳过的风险。
- evolve mode 下不能进行大范围重设计。
- 不能扩展到 run contract 之外。
- reviewer 意见必须经过 arbiter 接受后才能变成修复项。
- reviewer ensemble 使用一人一票；reviewer 共享目标上下文，但读取各自 profile。
- 所有 subagent spawn 时必须输出一行 voice，确认身份、偏好、本轮目标和 scope。
- 无目标状态下 reviewer 不投票，只输出方向性 review，由 arbiter 汇总 direction synthesis。
- 有目标状态下 reviewer 对目标达成度投票；多数票不能强制新增超出 run contract 的功能。
- 只有在 spec 足够完整，或用户明确要求全量生成时，才使用 full mode。
- 输入不完整或已有原型需要小步修改时，使用 evolve mode。
- 当用户要求基于 design 检查已实现前端完成度时，使用 review mode 的 completion audit 分支。
- completion audit 不修改代码，只输出证据化差距和下一步建议。
- 每个 run 必须维护 `run-state.json`,命令只能在合法状态下执行。
- 所有关键产物必须遵守 Output Contract;gate 必须检查 schema metadata 和必填章节。
- 确定性动作必须通过 `poison` command 或其 core module 执行，不能为 Claude/Codex 分叉两套流程。
```

需要包含的 workflow：

```md
## Workflow

1. 读取用户输入和已有 `.poison/context`。
2. 运行或执行 readiness assessment。
3. 选择模式：seed、evolve、full、review 或 harden。
4. 创建 run directory。
5. 创建 `run-state.json`。
6. 创建或更新 poison-core。
7. 初始化或更新 `protected-features.md`。
8. 创建 run-contract。
9. 调用 librarian 构建 `context-pack.md`、`sot-index.json` 和 `context-health.md`。
10. 运行 scope assessment,选择 reviewer depth 和 expansion 策略。
11. 构建或修改原型。
12. 写入 design-rationale。
13. 捕获截图。
14. 如需用户理解校验，生成 user-ambiguity-check。
15. 构建 review packet。
16. 运行 reviewer ensemble。
17. 运行 arbiter，生成 review summary、direction synthesis 或 repair plan。
18. 如有必要，根据 repair plan 进行修复。
19. 运行 gate。
20. 更新 state。
21. 输出 final report 和下一步确认点。
```

需要包含 harness adapter 约束：

```md
## Harness Support

- Claude Code 和 Codex 都是一等支持目标。
- harness adapter 只能解释如何调用同一套 `poison` workflow。
- adapter 不能定义不同的 mode、review schema、gate rule、run-state、output contract、artifact schema 或状态文件。
- adapter 必须声明 capability matrix,特别是 browser screenshot、console capture、Playwright、subagent orchestration。
- Codex 可以优先使用 Playwright 或本地浏览器工具;Claude Code 不保证具备这些能力。
- 如果当前 harness 不支持某个自动化能力,应降级为明确的手动步骤、`needs-manual-evidence` 或 `blocked`,而不是跳过 gate。
- 缺少 screenshot / runtime evidence 时,不能声称 UI 完成。
```

---

## 21. Role Contracts

创建以下 role contract 文件。它们可以被 Claude subagents、Codex subagents 或其他 harness adapter 包装，但本体不是独立 skill，也不是第二套入口。

### 21.1 `skills/poison/roles/orchestrator.md`

职责：

- 掌控完整 workflow
- 调用 librarian 维护 SoT 和 context-pack
- 创建 run-contract
- 调用 designer 并要求 design-rationale
- 触发 user ambiguity check
- 选择模式
- 为 reviewer ensemble 分配 taxonomy subset
- 调用 builders / reviewer ensemble
- 记录每个 subagent 的 spawn voice
- 编排 completion audit，但不能让审计结果绕过 arbiter 直接驱动修改
- 强制执行 gates
- 产出最终 summary

硬规则：

```md
You may request SoT updates, but librarian is the only role with limited write permission to factual SoT files.
```

### 21.2 `skills/poison/roles/librarian.md`

职责：

- 管理事实化 SoT
- 根据已确认事实、用户裁决、已接受设计结论或明确证据更新 `.poison/context/*`
- 为每个 run 生成 `context-pack.md`
- 生成 `sot-index.json`,记录 revision、source map 和事实来源
- 生成 `context-health.md`,记录冲突、缺失、过期和需要用户裁决的信息
- 响应 `poison sot query`
- SoT 更新后 bump revision 并重建 context pack

禁止：

- 输出主观审美判断
- 做产品方向裁决
- 参与 reviewer vote
- 为了回答查询而发明事实
- 把无来源的信息写入 SoT

输出：

```text
.poison/runs/<run-id>/context-pack.md
.poison/runs/<run-id>/sot-index.json
.poison/runs/<run-id>/context-health.md
```

查询返回：

```json
{
  "answer": "...",
  "source": "...",
  "status": "CONFIRMED | UNKNOWN | CONFLICTED | OPEN"
}
```

### 21.3 `skills/poison/roles/designer.md`

职责：

- 在 run contract 范围内提出设计方向
- 读取当前 `context-pack.md`
- 读取 `visual-memory.md`
- 读取 `user-design-taste.md`
- 参考 `visual-quality-pluses.md`
- 维护设计方案的主创意图
- 记录 design-rationale
- 接受或拒绝 reviewer discretion 建议并说明理由
- 标记需要 user decision 的歧义
- 需要更多事实时使用 `poison sot query`

禁止：

- 改写 poison-core 中的产品目标
- 直接修改 SoT
- 越过 run contract 新增功能
- 忽略 protected-features
- 无解释地破坏 visual memory
- 用个人审美覆盖 user design taste
- 把未处理 user ambiguity 当作已完成

输出：

```text
.poison/runs/<run-id>/design-rationale.md
```

### 21.4 `skills/poison/roles/reviewer.md`

职责：

- 读取 shared context
- 读取当前 `context-pack.md`
- 读取 `visual-memory.md`
- 读取指定 reviewer profile
- 读取被分配的 taxonomy subset
- spawn 时输出 voice
- 按 profile 的关注点输出 review result
- 在有目标状态下一人一票
- 在无目标状态下输出方向性 review，不投票
- 需要更多事实时使用 `poison sot query`

禁止：

- 发明新业务目标
- 重新定义用户
- 扩大 scope
- 用 private context 覆盖 shared context
- 假装已经全量审计 taxonomy
- 把 taste-only 偏好伪装成 visual poison
- 直接修改 SoT
- 直接指挥 builder 修改

### 21.5 `skills/poison/roles/review-arbiter.md`

职责：

- 协调 reviews
- 检查每个 reviewer 是否输出 spawn voice
- 使用 taxonomy 全集复核 visual poison
- 使用 Evidence Model 复核 severity
- 汇总 visual quality plus 和 user design taste
- 检查 visual memory drift / erosion
- 汇总 vote tally
- 汇总 majority position 和 minority concerns
- 拒绝超范围建议
- 生成 repair plan
- 决定当前修复项和延后 backlog
- 将 completion audit findings 转成优先级清晰的下一步建议
- 需要更多事实时使用 `poison sot query`

---

