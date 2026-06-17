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

## Next: V2b Repair Planning

- Implement only the first bounded hardening slice.
- Start with repair-plan artifacts from V1 finding IDs.
- Do not start arbiter routing until repair items map one-to-one to findings or
  declared backlog items.
- Do not add optional design publishing to V2.
- Do not add broad `evolve` behavior to V2.
- Keep V2 implementation limited to
  [V2 Controlled Hardening Loop](./docs/delivery/v2-controlled-hardening.md)
  until one bounded repair loop passes end to end.

## Blocked: V3 Design Publishing

- Do not implement V3 until V2 can repair one bounded slice and re-gate it.
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
