# Modes And Command API

> Source split from `poison_execution_plan_zh.md`.

Detailed command ownership lives in
[Command API](./contracts/command-api.md). Review process and completion audit
rules live in [Review Process](./contracts/review-process.md).

This file keeps the high-level mode and command narrative. If command names,
mode activation, or deterministic action mappings conflict with contract files,
the contract files win and this file should be corrected.

## Mode Model

Long-term modes:

- `seed`: start from a small idea and create initial context/prototype direction
- `evolve`: grow an existing prototype through a narrow slice
- `full`: work from a sufficiently complete spec toward a fuller package
- `review`: inspect an existing prototype or implementation without changing
  code
- `harden`: polish a stable direction without adding major features

`auto` is command behavior, not a sixth conceptual mode. It chooses from the
real modes and records the reason in readiness output.

## V1 Mode Scope

V1 implements the review-first slice. Later modes remain roadmap work until
their contracts, artifacts, and tests are ready.

The V1 command sequence is:

```text
poison init
poison new-run --mode review --name <name>
poison capture --url <url> --run <run>
poison review --run <run>
poison schema-check --run <run>
poison gate --run <run>
```

## Single Entrypoint

All public, adapter, and deterministic action calls go through the same
executable or shared core modules. Harness adapters must not create alternate
command semantics.
