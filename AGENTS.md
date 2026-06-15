# Agent Instructions

Read and follow [WORKFLOW.md](./WORKFLOW.md) before making decisions in this repository.

This repository's product and implementation index is
[poison_execution_plan_zh.md](./poison_execution_plan_zh.md). Detailed product,
skill, command, role, runtime, and gate contracts live under [docs/plan](./docs/plan).
Do not duplicate product capabilities, skill behavior, command contracts, role
contracts, or runtime file formats in `WORKFLOW.md`, `AGENTS.md`, or `CLAUDE.md`.
Do not grow `poison_execution_plan_zh.md` back into a single huge reference.

When a discussion changes product behavior or implementation direction, update
the relevant file under `docs/plan` and keep `poison_execution_plan_zh.md` as an
index. When it changes repository-specific agent policy, update both `AGENTS.md`
and `CLAUDE.md`. When it changes only the reusable
collaboration workflow, update `WORKFLOW.md`.
