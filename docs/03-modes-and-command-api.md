# Modes And Command API

> Source split from `poison_execution_plan_zh.md`.

Detailed command ownership now lives in
[docs/contracts/command-api.md](./contracts/command-api.md). This file keeps the
high-level mode and command narrative.

Contract owner note: this file is narrative orientation. If the command contract
or version roadmap conflicts with this file, the detailed owner files win and
this file should be corrected.

## 3. 模式设计

在 Skill instructions 和 scripts 中实现以下模式。

### 3.1 Auto mode：自动模式

默认模式。

orchestrator 应该检查输入，并选择以下模式之一：

```text
seed
evolve
full
review
harden
```

它必须把选择结果和原因写入：

```text
.poison/runs/<run-id>/readiness-assessment.md
```

### 3.2 Seed mode：种子模式

用于输入只是一个小想法时。

行为：

- 创建初始 `poison-core`
- 提出初始产品假设
- 生成一个小的原型骨架
- 避免生成过多页面
- 识别待确认问题
- 推荐下一个最小有价值切片

### 3.3 Evolve mode：演进模式

用于已有原型和上下文时。

行为：

- 读取当前 `poison-core`
- 读取已确认决策
- 定义窄范围 `run-contract`
- 只修改一个交互切片或小功能区域
- 保留冻结决策
- 运行结束后更新上下文

### 3.4 Full mode：完整生成模式

用于 spec 足够完整时。

行为：

- 生成完整页面清单
- 生成所有必要核心流程
- 生成主要状态
- 捕获截图
- 基于完整 spec 进行审阅
- 修复直到 gate 通过，或达到最大修复轮数

### 3.5 Review mode：只审阅模式

用于用户只想审查当前原型时。

行为：

- 不修改代码
- 捕获或读取截图
- 构建 review packet
- 运行 reviewers
- 运行 arbiter
- 输出优先级排序后的 findings

Review mode 还承担 **界面完成度审计**。当用户提供 design/spec，且项目已经完成一部分前端实现时，`poison review` 应比较：

- 已确认 design / spec / PRD
- `.poison/context/poison-core.current.md`
- 当前 `run-contract.md`
- 已实现前端路由和页面
- 截图、console output、可访问的 runtime 状态
- 必要时的小范围源码结构

输出应回答：

- 已实现了 design 的哪些页面、状态、交互和内容
- 哪些内容未实现、部分实现或偏离 design
- 哪些差距是 blocker、major、minor
- 每个差距的证据来自 design、poison core、run contract、截图、runtime 或代码中的哪一项
- 推荐下一步应该进入 `evolve`、`harden`，还是只更新 backlog

审计不直接修改代码。只有用户明确进入 `evolve` 或 `harden` 后，审计 findings 才能经过 arbiter 变成 repair plan。

### 3.6 Harden mode：打磨模式

用于产品方向已经稳定后。

行为：

- 不新增大功能
- 提升视觉 polish
- 补足交互状态
- 提升响应式质量
- 提升内容真实感
- 保留 IA 和核心工作流

---

## 4. Command API：单入口命令

V1 对外只暴露一个 executable：

```json
{
  "bin": {
    "poison": "./bin/poison.mjs"
  }
}
```

本地开发和 `npx` 场景都应走同一个入口：

```bash
node bin/poison.mjs [action-or-mode] [options]
npx poison-ui [action-or-mode] [options]
poison [action-or-mode] [options]
```

常规用户路径：

```bash
poison --input prd.md --url http://localhost:5173
poison seed --input idea.md
poison evolve --name checkout-polish --url http://localhost:5173
poison review --run .poison/runs/003-full
poison review --design docs/design.md --url http://localhost:5173 --audit completion
poison harden --run .poison/runs/004-evolve-checkout
```

V1 可以暴露少量 deterministic action 便于测试、adapter 调用和 dry-run，但它们仍然必须通过 `poison` 这个唯一 executable：

```bash
poison init
poison new-run --mode seed --name test-seed
poison init-protected-features --run .poison/runs/001-test-seed
poison assess-readiness --input ./docs/sample-prd.md --run .poison/runs/001-test-seed
poison capture --url http://localhost:5173 --run .poison/runs/001-test-seed
poison build-review-packet --run .poison/runs/001-test-seed
poison decision-html --question "选择搜索栏布局" --run .poison/runs/001-test-seed
poison audit-completion --design docs/design.md --url http://localhost:5173 --run .poison/runs/001-test-seed
poison gate --run .poison/runs/001-test-seed
poison update-state --run .poison/runs/001-test-seed
```

这些 action 是 internal tools 的命令映射，不是多个独立入口。后续 plugin 或 MCP adapter 也只能调用同一套 command/core modules。

---
