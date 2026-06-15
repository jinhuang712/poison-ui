# Codex 执行计划：构建 `poison` 受控演进式原型生成 Skill

> 本文件是实施方案索引，不再承载全部细节。详细契约按主题拆分在 `docs/plan/` 下。

## Mission

构建 `poison` 的第一个可工作版本：一个面向 Claude Code、Codex 和 agentic workflow 的平台中立原型生成流程，可以基于 prompt、spec、PRD 或文档生成、演进、审阅和门禁高保真可运行 UI 原型。

架构原则：

```text
1 skill + 3-5 modes + 1 public command + N internal tools
```

## Document Map

| Topic | File |
|---|---|
| Overview and goals | [docs/plan/00-overview.md](./docs/plan/00-overview.md) |
| Repository architecture | [docs/plan/01-repository-architecture.md](./docs/plan/01-repository-architecture.md) |
| Core runtime contracts | [docs/plan/02-core-runtime-contracts.md](./docs/plan/02-core-runtime-contracts.md) |
| Modes and command API | [docs/plan/03-modes-and-command-api.md](./docs/plan/03-modes-and-command-api.md) |
| Harness adapter contract | [docs/plan/04-harness-adapter-contract.md](./docs/plan/04-harness-adapter-contract.md) |
| Autonomous workflow | [docs/plan/05-autonomous-workflow.md](./docs/plan/05-autonomous-workflow.md) |
| Review and audit pipeline | [docs/plan/06-review-and-audit-pipeline.md](./docs/plan/06-review-and-audit-pipeline.md) |
| Tools, gates, and state | [docs/plan/07-tools-gates-and-state.md](./docs/plan/07-tools-gates-and-state.md) |
| Skill and role contracts | [docs/plan/08-skill-and-role-contracts.md](./docs/plan/08-skill-and-role-contracts.md) |
| V1 delivery and dry-run | [docs/plan/09-v1-delivery.md](./docs/plan/09-v1-delivery.md) |
| Visual poison taxonomy | [poison_taxonomy_single_word_full.md](./poison_taxonomy_single_word_full.md) |

## Editing Rule

Do not grow this file back into a single huge reference. Update the relevant file under `docs/plan/` and keep this index stable.

Implementation work must still follow [WORKFLOW.md](./WORKFLOW.md), [AGENTS.md](./AGENTS.md), and [CLAUDE.md](./CLAUDE.md).
