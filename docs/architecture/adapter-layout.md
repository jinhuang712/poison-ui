# Adapter Layout

Poison supports Claude Code and Codex as first-class harnesses without creating
separate product contracts.

## Source Of Truth

- `docs/contracts`: implementation contracts.
- `skills/poison`: agent-facing skill instructions derived from contracts.
- `src/core` and `src/tools`: deterministic implementation.
- `bin/poison.mjs`: public executable entry.

## Adapter Rule

Adapters can explain how to invoke the shared workflow in a harness. They cannot
define their own modes, review schema, gate rules, run states, output contract,
artifact schema, or reviewer profiles.

## Planned Adapter Files

- `.claude-plugin/plugin.json`
- `.codex-plugin/plugin.json`
- `skills/poison/references/harness-claude.md`
- `skills/poison/references/harness-codex.md`
- `skills/poison/references/adapter-contract.md`

## Capability Degradation

If a harness lacks browser screenshots, console capture, Playwright, or
subagent orchestration, the adapter must record the missing capability and route
to degraded evidence or `blocked`. It must not silently skip gate evidence.
