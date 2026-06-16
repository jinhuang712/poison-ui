# V1 Review-First Detector

This file owns V1 delivery scope. V1 exists to make Poison useful before it
becomes a full design-generation platform.

## Product Job

```text
I have an AI-made local UI demo. Tell me why it feels poisoned and what to fix first.
```

## Scope

V1 reviews an existing local prototype. It initializes Poison runtime state,
creates an auditable review run, captures browser evidence or records why
evidence is unavailable, produces a structured review summary, checks artifact
schemas, and runs a mechanical gate.

## Milestone Ladder

| Slice | Status | Owns | Must-not-start gate |
|---|---|---|---|
| V1a Runtime skeleton | implemented minimal subset | `init`, `new-run`, legal state transitions, degraded evidence path | Do not start V1b until state/artifact/schema helpers are tested. |
| V1b Evidence capture | active implementation target | real screenshot evidence, console evidence, explicit degraded fallback | Do not start V1c until real and degraded evidence are distinguishable. |
| V1c Review packet | design ready, implementation blocked by V1b | review packet and summary generated only from available evidence | Do not start V1d until summaries cannot claim observations without matching artifacts. |
| V1d Mechanical gate | design ready, implementation blocked by V1c | schema-check, gate pass/fail, blocked-state recovery | Do not start V2 until V1d failure fixtures are passing. |

## Command Path

```bash
node bin/poison.mjs init
node bin/poison.mjs new-run --mode review --name poisoned-demo
node bin/poison.mjs capture --url http://localhost:5173 --run .poison/runs/001-poisoned-demo
node bin/poison.mjs review --run .poison/runs/001-poisoned-demo
node bin/poison.mjs schema-check --run .poison/runs/001-poisoned-demo
node bin/poison.mjs gate --run .poison/runs/001-poisoned-demo
```

## Must Ship

- Minimal `.poison/context` and `.poison/runs` initialization.
- Review run creation with `run-state.json`, `run-contract.md`, and
  `context-health.md`.
- Browser screenshot and console capture when capability exists.
- Explicit degraded evidence artifact when capture is unavailable.
- Review packet and review summary with stable finding IDs, fix order,
  severity, category, evidence refs, affected screens, rationale, and first
  repair recommendation.
- Schema check for required V1 JSON and Markdown structure.
- Mechanical gate report.
- Tests for successful evidence, degraded evidence, schema failures, gate
  failures, and legal state transitions.

## Finding Fields

Every V1 finding must include:

- `findingId`
- `priorityRank`
- `fixOrder`
- `severity`
- `category`
- `evidenceRefs`
- `affectedScreens`
- `issue`
- `why it feels poisoned`
- `firstRepairRecommendation`

V1 findings must not require protected-feature, visual-memory, frontend
handoff, completion-audit, or generation-mode fields.

## Weighting

| Area | Weight | Rationale |
|---|---:|---|
| Evidence integrity | 35 | Poison cannot claim UI findings without evidence. |
| Runtime state and artifacts | 25 | Runs must be auditable and recoverable. |
| Review usefulness | 20 | Findings must be actionable for the first user. |
| Mechanical gate reliability | 15 | V1 gate should fail only for objective reasons. |
| CLI ergonomics | 5 | Basic usability matters, but broad UX polish is later. |

## Fix Order Scoring

Use this scoring only to rank what to fix first inside V1:

| Factor | Weight | Meaning |
|---|---:|---|
| User impact | 40 | How much the issue blocks comprehension or task completion. |
| Evidence confidence | 25 | How directly the finding is supported by artifacts. |
| Repair leverage | 20 | Whether one fix improves multiple visible issues. |
| Execution risk | 15 | Whether the first repair is narrow enough for the current run. |

## Hard Gates

- Missing evidence must be represented explicitly.
- `blocked` must include `previousStatus`, `blockedReason`, and
  `nextRecommendedAction`.
- Severe captured console/runtime errors fail the gate. Severe means at least
  one browser `pageerror` or console entry with level `error`; warnings, info
  logs, and missing automation do not fail by themselves.
- Gate passing moves the run to `gated`.
- Review summary must not claim screenshot or runtime observations unless
  matching artifacts exist.

## Non-Goals

- Generating a prototype from scratch.
- Full `seed`, `evolve`, `full`, or `harden` mode.
- Automatic code repair.
- Mandatory multi-reviewer ensemble.
- Full `design/` package publishing.
- Subjective visual taste as a hard gate.

## Entry Criteria

- V0 documentation and contract owners exist.
- `bin/poison.mjs` and `src/core` can be tested with Node built-in tests.

## Exit Criteria

- Dry-run passes with degraded evidence.
- Dry-run passes with real browser evidence.
- Degraded fixture passes only when the evidence artifact declares
  `kind: degraded` or an equivalent Markdown evidence section with reason.
- Browser fixture passes only when screenshot and console evidence artifacts are
  present and the review summary references them.
- Gate fails correctly on missing artifacts and severe captured runtime errors.
- Failing fixtures write `gate-report.md` with `FAIL` and a machine-readable
  failed check ID or deterministic failure line.
- `TODO.md`, `PROGRESS.md`, and `CHANGELOG.md` agree on V1 status.

## Sequencing Rule

Do not start V2 repair loops until V1 browser evidence is reliable. Repair work
without trustworthy evidence will blur priorities and make later gates weak.
