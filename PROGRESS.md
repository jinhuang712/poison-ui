# Progress

This file records current repository progress and implementation readiness. The
detailed version ladder lives in
[docs/delivery/version-roadmap.md](./docs/delivery/version-roadmap.md), and
implementation contracts live under [docs/contracts](./docs/contracts).

## Current Status

Poison has moved from V0 documentation scaffold into a minimal V1 review-first
CLI subset.

The repository currently provides:

- Root project navigation and workflow rules.
- Split high-level docs under `docs/00-09`.
- Detailed architecture, delivery, and implementation contract owners.
- A V1 dependency-free CLI path for `init`, `new-run`, `capture`, `review`,
  `schema-check`, and `gate`.
- Node built-in tests for the dry-run flow, run-state handling, degraded
  evidence reporting, schema checks, and the mechanical gate.
- An operational `skills/poison/SKILL.md` entrypoint that routes behavior to
  contract owners.

The repository does not yet provide real browser screenshot capture,
multi-reviewer review, repair loops, later seed/evolve/full/harden modes, or
full `design/` publishing.

## Active

Exactly one implementation direction is active now:

- V1b evidence capture: add real browser screenshot and console evidence behind
  the existing `poison capture --url <url> --run <run>` contract, while keeping
  degraded evidence explicit and review claims tied to artifacts.

Active acceptance checks:

- Degraded capture fixture still passes with explicit limitation and reason.
- Browser capture fixture writes screenshot and console evidence artifacts.

Do not start V1c/V1d implementation while V1b is active.

## Blocked

These items must not begin implementation yet:

- V2 controlled hardening implementation is blocked until V1b/V1c/V1d fixtures
  pass with real and degraded evidence.
- V3 design publishing implementation is blocked until V2 can perform one
  bounded harden loop and re-gate it.
- V4 adapter/packaging work is blocked until V3 publish traceability is stable.

## Next

When V1b evidence capture passes, move to:

- V1c review packet: generate summaries only from available evidence.
- V1d mechanical gate: deterministic pass/fail checks for missing artifacts and
  severe runtime errors.

## Deferred

- V2 protected-feature repair loops.
- V3 minimal `design/manifest.json` and `design/handoff.md` publishing.
- V4 adapter parity, package validation, and release distribution.
- Future VN backlog items such as manual evidence registration, design-system
  extraction, visual intelligence, and code repair automation.

## V0 Documentation Migration

Status: complete.

Completed:

- Root `README.md`, `TODO.md`, `CHANGELOG.md`, `PROGRESS.md`, `WORKFLOW.md`,
  `AGENTS.md`, and `CLAUDE.md` are present.
- `poison_execution_plan_zh.md` is an index instead of a monolithic reference.
- High-level `docs/00-09` files are narrative entrypoints.
- Detailed owners exist under `docs/architecture`, `docs/contracts`,
  `docs/delivery`, and `docs/decisions`.
- Contract owner files now cover source-of-truth, runtime artifacts, run state,
  output schema, command API, evidence, review process, review schema,
  autonomous workflow, role contracts, gate rules, and design-folder output.

Residual rule:

- Do not grow `poison_execution_plan_zh.md` or `docs/00-09` back into detailed
  contract references. Put durable behavior in the matching owner file.

## V1 Review-First Detector

Status: minimal subset implemented; browser evidence remains.

User job:

```text
I have an AI-made local UI demo. Tell me why it feels poisoned and what to fix first.
```

Implemented:

- `poison init` creates minimal `.poison/context` and `.poison/runs`.
- `poison new-run --mode review --name <name>` creates a review run with
  `run-state.json`, `run-contract.md`, and `context-health.md`.
- `poison capture --url <url> --run <run>` records explicit degraded evidence
  when automated browser capture is unavailable.
- `poison review --run <run>` writes `review-packet.md` and
  `review-summary.md`.
- `poison schema-check --run <run>` validates required V1 JSON and Markdown
  structure.
- `poison gate --run <run>` writes `gate-report.md` and moves passing runs to
  `gated`.
- Tests cover runtime artifact helpers, run-state validation, degraded evidence
  reporting, schema checking, gate behavior, and the V1 dry-run flow.

Remaining:

- Add Playwright-backed screenshot and console capture behind the existing
  `capture` contract.
- Add fixture coverage for successful screenshot and console evidence.
- Improve review inputs once real evidence is available.

Exit gate:

- V1 is ready when the dry-run works with both degraded evidence and real
  browser evidence, and the gate remains mechanical rather than subjective.

## V2 Controlled Hardening Loop

Status: blocked until V1 evidence, review, and gate fixtures pass.

User job:

```text
Now improve this prototype without breaking what already works.
```

Design intent:

- Initialize protected features before autonomous repair.
- Convert review findings into arbiter-approved repair plans.
- Run one bounded `harden` flow.
- Re-capture evidence after repair.
- Check protected-feature regressions first; visual drift only after before/after
  evidence exists.

Prerequisites:

- V1 browser evidence and gate checks are stable.
- Protected-feature and repair-plan artifacts have tests.
- Autonomous workflow decisions are traceable to contract owners.

## V3 Design Package Mode

Status: blocked until controlled hardening loops are reliable.

User job:

```text
Generate or consolidate a full high-fidelity design package a frontend implementer can use.
```

Design intent:

- Publish minimal `design/manifest.json` and `design/handoff.md` from a gated
  V2 run.
- Include screens, flows, interactions, review summaries, and handoff files only
  after V3a traceability works.
- Add completion audit labels only when evidence mapping is deterministic.
- Keep `seed`, `full`, and broad generation deferred until publish traceability
  is proven.

Prerequisites:

- V2 repair loops are stable and evidence-backed.
- `design/` publishing is one-way from `.poison/runs` evidence.
- Optional design files do not become mandatory by accident.

## Active Decisions From Critique

- Every version must have explicit scope, non-goals, and exit criteria.
- `docs/00-09` are narrative/index files; detailed owner files win on conflict.
- `blocked` remains a run status, but it must preserve `previousStatus` and
  support explicit recovery transitions.
- V1 hard gates are mechanical. Visual quality, UX quality, taxonomy coverage,
  frontend readiness, and placeholder concerns start as warnings until later
  versions opt into stricter behavior.
- `.poison/runs/<run-id>` is audit/source evidence. `design/` is a human-facing
  published snapshot and can be partial.
