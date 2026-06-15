# Overview

> Source split from `poison_execution_plan_zh.md`.

## 0. 目标

构建 `poison` 的第一个可工作版本：一个面向 Claude Code、Codex 和 agentic workflow 的平台中立原型生成流程，可以基于 prompt、spec、PRD 或文档生成、演进、审阅和门禁高保真可运行 UI 原型。

`poison` 的架构原则是：

```text
1 skill + 3-5 modes + 1 public command + N internal tools
```

- **1 skill**：`poison` 是唯一用户入口和规则源，不拆成多个面向用户的 skill。
- **3-5 modes**：保留 `seed`、`evolve`、`full`、`review`、`harden` 五种模式；`auto` 是命令行为，不是第六种概念模式。
- **1 public command**：对外统一暴露 `poison [mode] [options]`，无论 CLI、plugin 还是 MCP adapter 都调用同一入口。
- **N internal tools**：初始化、readiness、new-run、截图、review packet、gate、state update 等是内部确定性模块，不作为用户必须记忆的多个入口。

Superpowers 是架构参照，不是照搬对象。`poison` 应借鉴其 workflow 编排、harness adapter 分层、规则硬约束和技能可测试思想，但具体目录和实现以 `poison` 的目标为准。

实施前必须遵守 [`WORKFLOW.md`](./WORKFLOW.md) 定义的通用协作顺序：先判断变更归口，再更新本实施方案或对应项目文件，确认后再进入设计、计划和实现。任何讨论导致的范围、mode、command、tool、harness、runtime 产物或 gate 变化，都不能只停留在聊天上下文里。

`poison` 必须支持两种生成节奏：

1. **Full-spec mode：完整规格模式**
   当输入文档足够完整时，一次性生成完整设计稿集合。

2. **Evolution mode：演进模式**
   当输入只是一个初始想法或部分规格时，通过受控的小切片逐步生长原型。

第一版的核心工程目标不是立刻让原型极致好看，而是先建立一个可靠、可复用、可审计的流水线，包含：

- 统一的产品上下文
- 明确的本轮执行边界
- 基于截图的审阅
- 基于 design 的前端界面完成度审计
- 结构化 reviewer 输出
- review 仲裁
- gate 门禁检查
- 版本化设计决策
- 安全的小步演进机制

---

