# V2 Controlled Hardening Loop

This file owns V2 delivery scope. V2 turns V1 findings into bounded repairs
without letting Poison become an uncontrolled redesign agent.

## Product Job

```text
Now improve this prototype without breaking what already works.
```

## Scope

V2 adds protected-feature initialization, repair-plan artifacts, arbiter
routing, one bounded `harden` loop, post-repair capture, and regression checks.
It does not publish design packages and it does not introduce broad `evolve`
work. Any repair must trace to a V1 finding accepted by the arbiter.

## Milestone Ladder

| Slice | Status | Owns | Must-not-start gate |
|---|---|---|---|
| V2a Protected baseline | implemented | `protected-features.md`, update rules, source evidence | Do not start repair planning until protected items have ownership and evidence. |
| V2b Repair planning | implemented | ordered `repair-plan.md` and `repair-plan.json` from V1 finding IDs | Do not start arbiter routing until repair items map one-to-one to findings or declared backlog items. |
| V2c Arbiter routing | implemented | `currentRepair`, `backlog`, `needsUserDecision`, `rejected` only | Do not start hardening while any item is ambiguously routed. |
| V2d Single bounded harden loop | implemented | one narrow repair round artifact set | Do not start drift reporting until fresh post-repair evidence exists. |
| V2d-post Post-repair re-gate | implemented | recapture, review, schema-check, and gate after the bounded round | Do not start V2e checks until the re-gate path preserves round traceability. |
| V2e Protected regression | implemented | `repair-rounds/001/regression-results.json` after post-repair gate | Do not start visual drift until protected-feature regression checks exist. |
| V2e Visual drift | implemented | visual drift report or explicit visual evidence absence | Do not start V3 until a bounded repair can re-gate without scope expansion. |

## Must Ship

- `protected-features.md` initialization and update path.
- Repair-plan artifact generation from review findings.
- Arbiter routing from findings to current repair, backlog, user decision, or
  rejected item.
- Legal run-state path through one repair round and back through capture,
  review, and gate.
- Protected-feature regression warning or failure rules.
- Visual drift report only when before/after visual evidence exists.
- Tests for protected features, repair-plan shape, arbiter routing, state
  transitions, regression checks, and one bounded harden round.

## Current V2b Slice Exit Criteria

- `poison repair-plan --run <run-path>` accepts only `protected_ready` or an
  existing complete `repair_planned` run.
- A first successful run writes root-level `repair-plan.md` and
  `repair-plan.json`.
- `repair-plan.json` maps one repair item to each V1 `findingId`, preserves
  numeric `priorityRank` and `fixOrder`, and keeps every item in `planned`
  status.
- Schema checks reject missing repair-plan metadata, missing required repair
  fields, duplicate IDs, non-numeric ordering fields, embedded routing fields,
  or a plan that no longer maps one-to-one to the V1 findings.
- A repeat `repair-plan` on a complete `repair_planned` run preserves existing
  repair-plan artifacts and only refreshes run-state metadata.
- If a legal source run cannot produce repairs, it moves to `blocked` with
  `previousStatus`, `blockedReason`, and `nextRecommendedAction`.
- V2b must not write `currentRepair`, `backlog`, `needsUserDecision`,
  `rejected`, `repair-rounds/`, recapture, regression, or `design/` artifacts.

## Current V2c Slice Exit Criteria

- `poison arbiter-route --run <run-path>` accepts only a complete
  `repair_planned` or `repair_routed` run.
- A first successful run writes root-level `arbiter-routing.md` and
  `arbiter-routing.json`.
- Every repair-plan item is routed exactly once to `currentRepair`, `backlog`,
  `needsUserDecision`, or `rejected`.
- V2c selects one `currentRepair` for the next bounded harden slice and leaves
  harden execution to V2d.
- V2c must not write `repair-rounds/`, recapture, regression, or `design/`
  artifacts.

## Current V2d Slice Exit Criteria

- `poison harden --run <run-path>` accepts only a complete `repair_routed` or
  `repaired` run.
- A first successful run writes only `repair-rounds/001/repair-plan.md`,
  `repair-rounds/001/repair-plan.json`,
  `repair-rounds/001/before-after-evidence.md`, and
  `repair-rounds/001/round-summary.md`.
- The round consumes only `arbiter-routing.json.currentRepair`; backlog,
  `needsUserDecision`, and rejected repairs remain deferred.
- Run state moves to `repaired` with `nextRecommendedAction: capture`.
- V2d must not write regression verdicts, drift reports, or `design/`
  publishing artifacts.

## Current Post-Repair Re-Gate Exit Criteria

- After `harden`, `capture`, `review`, `schema-check`, and `gate` can run on
  the same V2 run.
- Post-repair review preserves `repair-rounds/001` traceability without adding
  new repair-plan findings.
- Schema-check continues to validate repair-round artifacts after recapture.
- Gate can return the run to `gated` while preserving round artifacts.
- This slice must not write `regression-results.json`, drift reports, or
  `design/` publishing artifacts.

## Current V2e Protected Regression Exit Criteria

- `poison regression-check --run <run-path>` accepts only a post-repair
  `gated` run that still contains `repair-rounds/001` artifacts.
- A first successful run writes
  `repair-rounds/001/regression-results.json`.
- Regression results map one check to each `protected-features.md` item. When
  no protected item has been declared, the artifact records the explicit
  `none declared yet` baseline instead of inventing a feature.
- Schema checks reject regression results before post-repair gate.
- This slice must not write drift reports or `design/` publishing artifacts.

## Current V2e Visual Drift Exit Criteria

- `poison visual-drift --run <run-path>` accepts only a post-regression
  `gated` run that still contains `repair-rounds/001` artifacts.
- A first successful run writes `repair-rounds/001/visual-drift.json`.
- If before and after screenshots both exist, the artifact references them and
  returns `NEEDS_HUMAN_REVIEW` rather than claiming an automated pixel verdict.
- If before/after screenshots are incomplete, the artifact records
  `NO_VISUAL_EVIDENCE` and an explicit evidence gap.
- This slice must not write `design/` publishing artifacts.

## Weighting

| Area | Weight | Rationale |
|---|---:|---|
| Scope control | 30 | V2 must not become broad redesign. |
| Protected-feature safety | 25 | Users need confidence existing good work survives. |
| Repair-plan quality | 20 | Findings must become ordered, executable repair work. |
| Re-capture and re-review loop | 20 | Repairs need fresh evidence. |
| Drift explanation | 5 | Useful only after before/after evidence exists. |

## Hard Gates

- No repair can exceed the active run contract.
- Protected features cannot regress without explicit user decision.
- Repair work must trace back to accepted review or arbiter output.
- Repaired runs must produce fresh evidence or explicit evidence gap.
- Gate cannot pass with unresolved `needsUserDecision` repair items.
- V2 cannot write `design/` publishing artifacts.

## Non-Goals

- Whole-product generation.
- Mandatory full `design/` tree.
- Pixel-perfect visual diffing.
- Deep multi-agent design generation.
- Broad feature implementation unrelated to accepted repair plan.
- `seed`, `full`, or broad `evolve` implementation.
- Optional slice publishing.

## Entry Criteria

- V1 real browser evidence is stable.
- V1 mechanical gate behavior is covered by tests.
- Review summaries include `findingId`, severity, evidence refs, affected
  screens, artifact path, and first repair recommendation.

## Exit Criteria

These are the full V2 exit criteria after V2e lands. They are not required for
V2d.

- A run can move from review findings to a bounded repair plan.
- V2c arbiter routing maps repair items only to `currentRepair`, `backlog`,
  `needsUserDecision`, or `rejected`.
- A repaired run can be captured, reviewed, and gated again.
- Protected features are represented explicitly and checked in the loop.
- Visual-memory drift is either absent or explained in an artifact.
- Fixture run writes `.poison/runs/<run-id>/repair-rounds/001/repair-plan.md`.
- Fixture run writes `.poison/runs/<run-id>/repair-rounds/001/repair-plan.json`.
- Fixture run writes
  `.poison/runs/<run-id>/repair-rounds/001/before-after-evidence.md`.
- Fixture run writes
  `.poison/runs/<run-id>/repair-rounds/001/regression-results.json`.
- Fixture run writes
  `.poison/runs/<run-id>/repair-rounds/001/visual-drift.json`.
- Fixture run writes `.poison/runs/<run-id>/repair-rounds/001/round-summary.md`.
- Post-repair evidence has a new timestamp or step ID distinct from the V1
  source evidence.

## Sequencing Rule

Do not start V3 full package publishing until V2 can repair a small slice
without expanding scope. Publishing before repair discipline will make the
design package look authoritative while its evidence is still unstable.
