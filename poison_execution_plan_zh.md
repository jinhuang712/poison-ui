# Codex 执行计划：构建 `poison` 受控演进式原型生成 Skill

> 本文件是实施方案索引，不再承载全部细节。详细契约按主题拆分在 `docs/` 下。

## Mission

构建 `poison` 的第一个可工作版本：一个面向 Claude Code、Codex 和
agentic workflow 的平台中立 UI 原型审阅与演进流程。第一落地点不是完整
生成平台，而是帮助不懂 design、前端和 UI/UX 的 vibe coding 开发者，把
AI 一拍脑门生成的有 poison 的原型或 demo 审出来、说清楚、排优先级。

架构原则：

```text
1 skill + 3-5 modes + 1 public command + N internal tools
```

## Document Map

| Topic | File |
|---|---|
| Documentation index | [docs/README.md](./docs/README.md) |
| Current progress | [PROGRESS.md](./PROGRESS.md) |
| Overview narrative | [docs/00-overview.md](./docs/00-overview.md) |
| Repository architecture narrative | [docs/01-repository-architecture.md](./docs/01-repository-architecture.md) |
| Runtime narrative | [docs/02-core-runtime-contracts.md](./docs/02-core-runtime-contracts.md) |
| Modes and command narrative | [docs/03-modes-and-command-api.md](./docs/03-modes-and-command-api.md) |
| Harness adapter narrative | [docs/04-harness-adapter-contract.md](./docs/04-harness-adapter-contract.md) |
| Autonomous workflow narrative | [docs/05-autonomous-workflow.md](./docs/05-autonomous-workflow.md) |
| Review and audit narrative | [docs/06-review-and-audit-pipeline.md](./docs/06-review-and-audit-pipeline.md) |
| Tools, gates, and state narrative | [docs/07-tools-gates-and-state.md](./docs/07-tools-gates-and-state.md) |
| Skill and role narrative | [docs/08-skill-and-role-contracts.md](./docs/08-skill-and-role-contracts.md) |
| V1 delivery narrative | [docs/09-v1-delivery.md](./docs/09-v1-delivery.md) |
| Source and adapter architecture | [docs/architecture](./docs/architecture) |
| Implementation contracts | [docs/contracts](./docs/contracts) |
| Source of truth contract | [docs/contracts/source-of-truth.md](./docs/contracts/source-of-truth.md) |
| Review process contract | [docs/contracts/review-process.md](./docs/contracts/review-process.md) |
| Autonomous workflow contract | [docs/contracts/autonomous-workflow.md](./docs/contracts/autonomous-workflow.md) |
| Role contracts | [docs/contracts/role-contracts.md](./docs/contracts/role-contracts.md) |
| Design folder contract | [docs/contracts/design-folder.md](./docs/contracts/design-folder.md) |
| Version roadmap index | [docs/delivery/version-roadmap.md](./docs/delivery/version-roadmap.md) |
| V1 delivery owner | [docs/delivery/v1-review-first.md](./docs/delivery/v1-review-first.md) |
| V1 acceptance | [docs/delivery/v1-acceptance.md](./docs/delivery/v1-acceptance.md) |
| V1 dry-run | [docs/delivery/dry-run.md](./docs/delivery/dry-run.md) |
| V2 delivery owner | [docs/delivery/v2-controlled-hardening.md](./docs/delivery/v2-controlled-hardening.md) |
| V3 delivery owner | [docs/delivery/v3-design-package.md](./docs/delivery/v3-design-package.md) |
| V4 delivery owner | [docs/delivery/v4-platform-adapter-maturity.md](./docs/delivery/v4-platform-adapter-maturity.md) |
| VN backlog owner | [docs/delivery/vn-backlog.md](./docs/delivery/vn-backlog.md) |
| Decision log index | [docs/decisions](./docs/decisions) |
| Visual poison taxonomy | [poison_taxonomy_single_word_full.md](./poison_taxonomy_single_word_full.md) |
| Repository TODO | [TODO.md](./TODO.md) |
| Changelog | [CHANGELOG.md](./CHANGELOG.md) |

## Editing Rule

Do not grow this file back into a single huge reference. Update the relevant
file under `docs/` and keep this index stable. Version scope belongs in
`docs/delivery/version-roadmap.md`; current repository progress belongs in
`PROGRESS.md`.

Implementation work must still follow [WORKFLOW.md](./WORKFLOW.md), [AGENTS.md](./AGENTS.md), and [CLAUDE.md](./CLAUDE.md).
