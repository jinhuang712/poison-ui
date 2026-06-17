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

## Next: V3a Design Publishing

- Publish only `design/manifest.json` and `design/handoff.md` from a gated V2
  source run.
- Require `sourceRunId` and source artifact refs.
- Do not broaden into full package files, completion percentages, seed/full
  generation, or adapter maturity.
- First V3 slice is only `design/manifest.json` and `design/handoff.md` from a
  gated V2 source run.
- Keep completion percentages, seed generation, full generation, and broad
  design package expansion deferred.
- Keep V3 implementation limited to
  [V3 Design Package Mode](./docs/delivery/v3-design-package.md) and do not
  start adapter maturity work until package traceability is stable.

## Deferred: V4 And VN

- Do not implement adapter parity, package release, or distribution until V3
  publish traceability is stable.
- Keep manual evidence registration in VN. If V1 automation is unavailable, V1
  records degraded evidence or a blocked state instead of registering manual
  evidence.
- Promote VN items only when they have one user job, one artifact owner, one
  gate behavior, and pass/fail tests.
