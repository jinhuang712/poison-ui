# TODO

This file tracks real repository work. Keep it actionable and remove or update
items as they are completed.

## Active: V1b Evidence Capture

- Add Playwright-backed screenshot and console capture behind the existing
  `poison capture --url <url> --run <run>` contract.
- Add fixtures and tests for successful screenshot evidence and console
  evidence.
- Keep the degraded capture fixture passing with explicit limitation and reason.

## Next: V1c Review Packet

- Ensure every review finding has `findingId`, `priorityRank`, `fixOrder`,
  severity, category, evidence refs, affected screens, issue, rationale, and
  first repair recommendation.
- Ensure review summaries never claim visual or runtime observations without
  matching evidence artifacts.

## Next: V1d Mechanical Gate

- Add fixtures and tests for severe console/runtime gate failures and missing
  artifact failures.
- Keep V1 hard gates mechanical.
- Keep V1 implementation limited to [V1 Review-First Detector](./docs/delivery/v1-review-first.md)
  until browser evidence passes both degraded and successful capture tests.

## Blocked: V2 Controlled Hardening

- Do not implement V2 until V1 browser evidence, review summary, and gate
  failure fixtures pass.
- Prepare only design notes for protected-feature initialization, repair-plan
  artifacts, arbiter routing, and one bounded harden loop.
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
