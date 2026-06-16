# Progress

This file records current repository progress and implementation readiness. It
is intentionally short: the detailed version ladder lives in
[docs/delivery/version-roadmap.md](./docs/delivery/version-roadmap.md), and
implementation contracts live under [docs/contracts](./docs/contracts).

## Current Status

Poison is in V0 documentation and contract scaffold state.

The repository currently provides:

- Root project navigation and workflow rules.
- Split high-level docs under `docs/00-09`.
- Detailed architecture, delivery, and implementation contract owners.
- A placeholder CLI help command used as the current baseline check.
- A maximal target-project `design/` folder contract.

The repository does not yet provide functional V1 commands beyond help output.

## Current Product Direction

The first product wedge is review-first. Poison should initially help vibe
coding developers who are frustrated by AI-generated poisoned UI demos and do
not have enough design, frontend, or UI/UX background to diagnose the problem
themselves.

V1 should review an existing local prototype, record evidence, produce
actionable poison findings, and run a mechanical readiness gate. Full prototype
generation, full design package publishing, deep multi-reviewer review, and
strict subjective design gates are later-version work.

## Completed Documentation Work

- Repository structure and file ownership have been split out of the original
  execution plan.
- Root `README.md`, `TODO.md`, and `CHANGELOG.md` now exist beside the plan.
- Architecture owners exist under `docs/architecture`.
- Contract owners exist under `docs/contracts`.
- Delivery owners exist under `docs/delivery`.
- The target-project `design/` folder contract exists and is linked from root
  docs.

## Active Decisions From Critique

- Every version must have an explicit scope, non-goals, and exit criteria.
- `docs/00-09` are narrative/index files; detailed contracts under
  `docs/contracts` and `docs/delivery` win on conflict.
- `blocked` remains a run status, but it must preserve `previousStatus` and
  support explicit recovery transitions.
- V1 hard gates are mechanical. Visual quality, UX quality, taxonomy coverage,
  and frontend readiness start as warnings until later versions opt into
  stricter behavior.
- `.poison/runs/<run-id>` is audit/source evidence. `design/` is a human-facing
  published snapshot and can be partial.

## Next Gate

Before implementation starts, the next plan should target V1 review-first CLI
behavior only:

1. Implement minimal `init`, `new-run`, `capture`, `review`, `schema-check`, and
   `gate` command paths.
2. Add fixture tests for run-state transitions and degraded evidence reporting.
3. Keep full design generation and full `design/` publish out of the first
   implementation slice.
