# Skill And Role Contracts

> Source split from `poison_execution_plan_zh.md`.

Detailed ownership lives in:

- [Role Contracts](./contracts/role-contracts.md)
- [Command API](./contracts/command-api.md)
- [Run State](./contracts/run-state.md)
- [Output Contract](./contracts/output-contract.md)
- [Review Process](./contracts/review-process.md)
- [Evidence Model](./contracts/evidence-model.md)
- [Gate Rules](./contracts/gate-rules.md)

This file keeps the high-level skill and role narrative. If role
responsibilities or contract details conflict with an owner above, the owner
file wins and this file should be corrected.

## Skill Entrypoint

`skills/poison/SKILL.md` is the user-facing skill entrypoint. It should explain
how to run Poison and where the durable contracts live. It must not become a
second source of truth for command names, run-state transitions, artifact
schemas, review fields, or gate rules.

The V1 operational command path is:

```text
init -> new-run -> capture -> review -> schema-check -> gate
```

The detailed command mapping is owned by
[Command API](./contracts/command-api.md).

## Role Model

Poison's long-term workflow uses roles for orchestration, source-of-truth
management, design, review, and arbitration. These roles can be implemented by
subagents, scripts, or adapters, but they are not separate public skills and
cannot define divergent behavior.

Durable role responsibilities are owned by
[Role Contracts](./contracts/role-contracts.md).

## Adapter Rule

Claude Code, Codex, plugins, MCP adapters, and future harness integrations must
call the same command contract or shared core modules. Harness-specific files
may describe capability degradation and invocation details only.
