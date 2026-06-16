# Harness Adapter Contract

> Source split from `poison_execution_plan_zh.md`.

Detailed adapter ownership lives in
[Adapter Layout](./architecture/adapter-layout.md). Command behavior is owned by
[Command API](./contracts/command-api.md).

This file keeps the high-level harness contract narrative. If adapter layout,
capability degradation, command, artifact, or gate details conflict with an
owner file, the owner file wins and this file should be corrected.

## Principle

Claude Code, Codex, plugins, MCP adapters, and future harnesses are integration
surfaces. They may differ in browser, console, filesystem, terminal, and
subagent capabilities, but they must call the same Poison command contract or
shared core modules.

## Adapter Boundaries

Adapters may:

- explain how to invoke Poison in a harness
- report capability availability
- degrade missing automation into explicit degraded evidence or blocked next
  actions
- provide harness-specific loading instructions

Adapters must not:

- define alternate modes, review schemas, gate rules, run states, output
  contracts, reviewer profiles, or artifact schemas
- change `.poison/**` artifact formats
- silently skip required evidence or gate checks

## V1 Degradation

The current V1 dependency-free runtime records degraded evidence when automated
browser capture is unavailable. Future adapters can add real screenshot and
console capture behind the same `capture` contract.
