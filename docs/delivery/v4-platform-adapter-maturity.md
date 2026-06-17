# V4 Platform And Adapter Maturity

This file owns V4 delivery scope. V4 makes Poison reliable across harnesses
after the product workflow is proven.

## Product Job

```text
Use the same Poison contract across Codex, Claude Code, plugins, MCP adapters, and project templates.
```

## Scope

V4 focuses on adapter parity, packaging, CI coverage, and fixture-based
contract tests after V1-V3 product workflows are stable. Command error and exit
semantics are a prerequisite carried forward from V1 foundation work; V4 freezes
them across adapters instead of inventing new workflow behavior.

## Milestone Ladder

| Slice | Status | Owns | Must-not-start gate |
|---|---|---|---|
| V4a Command semantics freeze | implemented | exit codes, output channels, state-transition failures, blocked metadata | Do not start adapter parity until the shared CLI/core semantics are stable. |
| V4b Fixture contract suite | implemented | one harness running V1-V3 fixture transcripts | Do not add adapter matrix breadth until one harness catches contract drift. |
| V4c First adapter parity | next | one additional adapter using shared command/core modules | Do not package until parity proves no behavior fork. |
| V4d Harness degradation | missing browser, console, subagent, file capability handling | Do not declare support without degradation transcripts. |
| V4e Packaging and release | package validation and release docs | Do not release while any adapter owns private schemas or hidden contracts. |

## Must Ship

- Adapter capability matrix that marks each harness as `releaseTarget: true` or
  `releaseTarget: false`.
- Frozen command error and exit semantics inherited from shared CLI/core.
- Package-ready skill references.
- Fixture-based contract tests across command, runtime, review, and gate
  artifacts.
- Harness degradation tests for missing browser, console, subagent, or file
  capabilities.
- Documentation for how adapters call the shared command/core modules.
- Package validation report.

## Current V4a Exit Criteria

- Existing V1-V3c commands have frozen success and failure output channels.
- Usage errors and illegal command ordering exit with stderr and do not mutate
  run state.
- `schema-check` failures exit with stdout diagnostics and do not mutate run
  state.
- `gate` failures from a legal reviewed state write `gate-report.md`, move to
  `blocked`, and preserve recovery metadata.
- V4a does not add adapters, packaging, release docs, package validation, or
  harness matrices.

## Current V4b Exit Criteria

- A harness-local transcript can run V1-V3c happy-path commands through the
  public CLI.
- The transcript runner verifies exit codes, stdout/stderr expectations, final
  state, and critical artifacts.
- V4b does not add adapter matrix breadth, packaging, release docs, or external
  harness parity.

## Current V4c Entry Criteria

- The first adapter must call `poison` or shared core modules instead of
  defining private schemas, modes, state transitions, or gate rules.
- Only one additional adapter or adapter-facing contract may be added in V4c.
- Package validation and release remain blocked until parity proves no behavior
  fork.

## Weighting

| Area | Weight | Rationale |
|---|---:|---|
| Contract parity | 30 | Harnesses must not fork behavior. |
| Packaging reliability | 20 | Install and loading must be predictable. |
| Error semantics | 20 | Adapters need stable failures and recovery paths. |
| CI and fixtures | 20 | Cross-harness confidence needs repeatable tests. |
| Optional deeper visual checks | 10 | Useful only when automation is reliable. |

## Hard Gates

- No adapter may define alternate modes, artifact schemas, state transitions,
  review fields, or gate rules.
- Missing automation must degrade explicitly.
- Package validation must prove skill references route to contract owners.
- CI must run fixture tests before release.
- A supported adapter must have a fixture transcript proving it calls shared
  command/core modules instead of private schemas.

## Non-Goals

- Harness-specific behavior forks.
- New design generation modes.
- Replacing V1-V3 evidence and publishing contracts.
- Hidden adapter contracts bypassing `poison` or shared core modules.

## Entry Criteria

- V3 publishing is coherent and traceable.
- Command and artifact contracts are stable.
- At least one adapter can run V1-V3 workflows without private behavior.
- `docs/delivery/v4-platform-adapter-maturity.md` defines which harnesses are
  release targets before packaging starts.

## Exit Criteria

- Poison can be installed and invoked consistently in supported harnesses.
- Adapter differences are documented as capabilities, not behavior forks.
- CI catches contract drift in commands, artifacts, and gate behavior.

## Sequencing Rule

Do not use V4 to fix product ambiguity. V4 is platform maturity; product scope
must already be settled in earlier version files.
