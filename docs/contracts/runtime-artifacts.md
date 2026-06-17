# Runtime Artifacts Contract

This file owns the runtime artifact inventory. V1 uses only the review-first
subset needed for capture, review, schema-check, and mechanical gate.

## Canonical Context

All roles use these canonical inputs:

- `.poison/context/poison-core.current.md`
- `.poison/runs/<run-id>/run-contract.md`

Later-version runs may include a librarian-built shared context package:

- `.poison/runs/<run-id>/context-pack.md`
- `.poison/runs/<run-id>/sot-index.json`
- `.poison/runs/<run-id>/context-health.md`

`context-pack.md` becomes the practical entrypoint for designers, builders,
reviewers, and arbiters once V2+ workflows need shared context packaging. It is
built from `.poison/context/*`, the current `run-contract.md`, accepted
decisions, and evidence indexes.

The target project's human-facing design deliverable belongs in `design/`, not
inside `.poison/`. `.poison/runs/<run-id>` is audit/source evidence;
`design/` is a one-way published snapshot that may be partial. See
[Design Folder Contract](./design-folder.md).

## Trackable Context Files

By default, `.poison/context` is trackable repository state.

```text
.poison/context/
  poison-core.v1.md
  poison-core.current.md
  design-decisions.md
  constraints.md
  guidelines.md
  open-questions.md
  prototype-map.md
  interaction-backlog.md
  visual-system.md
  visual-memory.md
  user-design-taste.md
  design-source.md
  changelog.md
```

## Run Directory Shape

```text
.poison/runs/<run-id>/
  run-state.json
  run-contract.md
  readiness-assessment.md
  scope-assessment.md
  context-pack.md
  sot-index.json
  context-health.md
  design-rationale.md
  user-ambiguity-check.md
  review-packet.md
  review-summary.md
  direction-synthesis.md
  repair-plan.md
  repair-plan.json
  arbiter-routing.md
  arbiter-routing.json
  gate-report.md
  completion-audit-packet.md
  completion-report.md
```

Only artifacts required by the active mode/action need to exist during an
in-progress run. Gate rules decide which missing artifacts are failures for the
current state.

V1 review-first runs require only the subset needed for capture, review,
schema-check, and mechanical gate. V2b repair-planning runs add only the
root-level `protected-features.md`, `repair-plan.md`, and `repair-plan.json`.
V2c arbiter-routing runs add only root-level `arbiter-routing.md` and
`arbiter-routing.json`. Later seed/evolve/full/harden runs may create the
broader inventory or `repair-rounds/` artifacts.

## Generated Evidence

Generated evidence can be ignored by default:

```text
.poison/runs/*/screenshots/
.poison/runs/*/console.log
.poison/runs/*/tmp/
```

The absence of generated evidence must still be represented in run reports when
the workflow needs screenshots, runtime output, or console evidence.

## SoT Updates

Only the librarian has limited write permission to factual SoT files. It may
write updates based on confirmed facts, user decisions, accepted design
conclusions, or explicit evidence. Other roles request SoT changes or use
`poison sot query`.
