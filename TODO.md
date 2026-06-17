# TODO

This file tracks real repository work. Keep it actionable and remove or update
items as they are completed.

## Completed: V1b Evidence Capture

- Playwright-backed screenshot and console capture is wired behind the existing
  `poison capture --url <url> --run <run>` contract.
- Browser capture writes `screenshots/capture.png`,
  `screenshot-manifest.json`, and `console.log`.
- Degraded capture remains available when Playwright is unavailable or capture
  fails.

## Completed: V1c Review Packet

- Every review finding has `findingId`, `priorityRank`, `fixOrder`,
  severity, category, evidence refs, affected screens, issue, rationale, and
  first repair recommendation.
- Review summaries do not claim visual or runtime observations without
  matching evidence artifacts.

## Completed: V1d Mechanical Gate

- Gate fails deterministically for missing referenced artifacts.
- Gate fails deterministically for invalid required V1 JSON artifacts.
- Gate fails for captured browser `pageerror` evidence and console `error`
  evidence.
- Gate does not fail on warning-level console evidence.

## Completed: V2a Protected Baseline

- `poison init-protected-features --run <run>` writes
  `protected-features.md`.
- Protected baseline records source evidence, empty initial protected items,
  update rules, and next action.
- Run state moves to `protected_ready` without creating repair-plan or design
  publishing artifacts.

## Completed: V2b Repair Planning

- `poison repair-plan --run <run>` writes `repair-plan.md` and
  `repair-plan.json`.
- Repair items map one-to-one to V1 finding IDs and stay in `planned` status.
- Run state moves to `repair_planned` without arbiter routing, harden
  execution, or design publishing.

## Completed: V2c Arbiter Routing

- `poison arbiter-route --run <run>` writes `arbiter-routing.md` and
  `arbiter-routing.json`.
- Route repair items only to `currentRepair`, `backlog`, `needsUserDecision`,
  or `rejected`.
- Run state moves to `repair_routed` without harden execution, recapture,
  regression, or design publishing.

## Completed: V2d Bounded Harden Round

- `poison harden --run <run>` writes one `repair-rounds/001` artifact set.
- The round consumes only `arbiter-routing.json.currentRepair`.
- Backlog, needs-user-decision, and rejected repairs stay deferred.
- Run state moves to `repaired` with `nextRecommendedAction: capture`.
- The round does not write regression, drift, or design publishing artifacts.

## Completed: Post-Repair Capture And Gate

- Re-capture after the bounded repair round.
- Re-review and re-gate using the fresh evidence.
- Post-repair review preserves `repair-rounds/001` traceability without adding
  new repair-plan findings.
- Post-repair gate preserves round artifacts and does not write regression,
  drift, or design publishing artifacts.

## Completed: V2e Protected Regression

- `poison regression-check --run <run>` writes
  `repair-rounds/001/regression-results.json` after post-repair gate.
- Regression results map to `protected-features.md` items and preserve
  post-repair round traceability.
- Schema checks reject regression results before post-repair gate.
- This slice does not write drift reports or design publishing artifacts.

## Completed: V2e Visual Drift

- `poison visual-drift --run <run>` writes
  `repair-rounds/001/visual-drift.json` after regression checks.
- Visual drift references before/after screenshots when both exist.
- When before/after screenshots are incomplete, visual drift records an
  explicit `NO_VISUAL_EVIDENCE` gap instead of claiming a visual comparison.
- This slice does not write design publishing artifacts.

## Completed: V3a Design Publishing

- `poison publish-design --run <run>` writes only `design/manifest.json` and
  `design/handoff.md` from a gated V2 source run.
- The manifest includes `sourceRunId`, `packageStatus`, source artifact refs,
  and the minimal file list.
- V3a does not write wider screen, flow, review, completion percentage,
  seed/full generation, or adapter-maturity output.

## Completed: V3b Handoff Package

- `poison publish-handoff --run <run>` writes only source-mapped handoff files
  under `design/handoff/`.
- The manifest moves to `packageStatus: HANDOFF_READY` and exactly lists the
  V3a files plus V3b handoff files.
- Completion percentages, seed generation, full generation, screens, flows,
  and review package expansion remain deferred.

## Completed: V3c Completion Audit

- `poison audit-completion --run <run>` writes run-local
  `completion-audit-packet.md` and `completion-report.md`.
- Completion labels are evidence-backed and do not publish percentages.
- V3c does not create `design/review`, `design/screens`, `design/flows`, seed,
  full-generation, or adapter-maturity output.

## Completed: V4a Command Semantics Freeze

- Observable CLI behavior is covered for existing V1-V3c command success and
  failure classes.
- Usage errors and illegal command order errors do not mutate run state.
- `schema-check` and `gate` failure channels and blocked metadata are frozen.

## Completed: V4b Fixture Contract Suite

- A harness-local V1-V3c happy-path fixture transcript runs through the CLI.
- The transcript runner verifies exit codes, stdout/stderr expectations, final
  run state, and completion artifacts.
- Adapter matrix breadth, package release, and external harness parity remain
  deferred.

## Completed: V4c First Adapter-Facing Contract

- `docs/contracts/adapter-command-manifest.json` maps implemented commands to
  the shared `poison` CLI entrypoint.
- Adapter private schemas and private behavior are explicitly disallowed.
- No real external adapter, package release, or broad adapter matrix was added.

## Completed: V4d Harness Degradation Matrix

- `docs/contracts/harness-degradation-matrix.json` records current local CLI
  degradation behavior.
- Tests cover browser/console degradation, missing referenced artifact
  behavior, completion percentage blocking, and no cross-harness support claim.

## Completed: V4e Package Validation Report

- `docs/delivery/package-validation-report.json` records package validation
  evidence.
- `package.json` includes the source and docs files needed by the CLI and
  contracts.
- No package release was published.

## Parked: VN Backlog

- Keep manual evidence registration in VN. If V1 automation is unavailable, V1
  records degraded evidence or a blocked state instead of registering manual
  evidence.
- Promote VN items only when they have one user job, one artifact owner, one
  gate behavior, and pass/fail tests.
