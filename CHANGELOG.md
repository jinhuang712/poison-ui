# Changelog

All notable changes to this project will be documented here.

## Unreleased

- Implemented V4e package validation evidence with
  `docs/delivery/package-validation-report.json`, package file coverage for
  `src` and `docs`, and validation tests without publishing a release.
- Implemented V4d harness degradation matrix with
  `docs/contracts/harness-degradation-matrix.json` and tests for current local
  CLI degraded behavior without claiming cross-harness support.
- Implemented V4c first adapter-facing contract with
  `docs/contracts/adapter-command-manifest.json`, manifest/CLI consistency
  tests, and an explicit no-private-schema rule without adding a real adapter
  or package release.
- Implemented V4b fixture contract suite with a harness-local V1-V3c happy-path
  transcript, transcript runner, final state/artifact assertions, and no
  adapter matrix or packaging work.
- Implemented V4a command semantics freeze with CLI integration tests for
  help, success/failure output channels, unknown commands, missing options,
  schema-check failures, gate failures, blocked recovery metadata, and illegal
  command ordering without adapter parity or packaging work.
- Implemented V3c completion audit with `poison audit-completion`, run-local
  `completion-audit-packet.md` and `completion-report.md`, evidence-backed
  labels, schema coverage, and CLI dry-run support without percentages or
  `design/review`, screen, flow, seed, or full-generation output.
- Implemented V3b handoff package publishing with `poison publish-handoff`,
  source-mapped `design/handoff/*` files, manifest `HANDOFF_READY` status,
  schema coverage, and CLI dry-run support without completion audit, screen,
  flow, review, seed, or full-generation output.
- Implemented V3a minimal design publishing with `poison publish-design`,
  `design/manifest.json`, `design/handoff.md`, source-run traceability, schema
  coverage, and CLI dry-run support without broader package output.
- Implemented V2e visual drift reporting with `poison visual-drift`,
  `repair-rounds/001/visual-drift.json`, screenshot-backed or explicit-absence
  outputs, schema coverage, and CLI dry-run support without design publishing.
- Implemented V2e protected-feature regression checks with
  `poison regression-check`, `repair-rounds/001/regression-results.json`,
  schema coverage, and CLI dry-run support without drift or design publishing.
- Implemented post-repair capture, review, schema-check, and gate traceability
  after the bounded harden round without writing regression, drift, or design
  publishing artifacts.
- Implemented V2d bounded harden round artifacts with `poison harden`,
  `repair-rounds/001/repair-plan.md`, `repair-rounds/001/repair-plan.json`,
  `before-after-evidence.md`, `round-summary.md`, `repaired` state, schema
  coverage, and CLI dry-run support.
- Implemented V2c arbiter routing with `arbiter-routing.md`,
  `arbiter-routing.json`, `repair_routed` state, schema coverage, and CLI
  support for `arbiter-route`.
- Implemented V2b repair planning with `repair-plan.md`,
  `repair-plan.json`, `repair_planned` state, schema coverage, and CLI support
  for `repair-plan`.
- Implemented V2a protected baseline initialization with
  `protected-features.md`, `protected_ready` state, schema coverage, and CLI
  support for `init-protected-features`.
- Implemented V1d mechanical gate failure fixtures for missing referenced
  artifacts, invalid required JSON artifacts, browser pageerrors, console
  errors, and warning-level console pass behavior.
- Implemented V1b browser evidence capture with an optional Playwright adapter,
  screenshot manifest, console evidence, and degraded fallback when browser
  automation is unavailable.
- Implemented V1c review packet generation that references browser evidence
  artifacts only when present and keeps degraded runs tied to
  `degraded-evidence.md`.
- Tightened V1-VN delivery files after strict PM critique: V1 now has V1a-V1d
  gates, V2 is limited to one controlled harden loop, V3 starts with minimal
  evidence-to-design handoff publishing, V4 is deferred to adapter maturity,
  and VN promotion requires one user job, one owner, one gate, and pass/fail
  tests.
- Updated V1 review output expectations to require stable finding IDs, fix
  order, evidence refs, affected screens, and first repair recommendation while
  excluding protected-feature and visual-memory fields from V1.
- Implemented the minimal V1 review-first CLI subset for init, new-run,
  degraded capture, review, schema-check, and gate.
- Added Node built-in tests for the V1 dry-run, runtime artifact helpers,
  run-state validation, degraded evidence reporting, schema checking, and gate
  behavior.
- Expanded `skills/poison/SKILL.md` into an operational V1 entrypoint that
  routes durable behavior to contract owners.
- Completed the docs migration by moving source-of-truth, autonomous workflow,
  review process, and role details into contract owner files.
- Added V1-V4 delivery owner files and a VN backlog to keep version scope,
  weighting, gates, and sequencing explicit.
- Reduced duplicated runtime, command, adapter, review, role, tool, gate, and
  state detail in high-level docs.
- Added V0-V4 version roadmap and root progress tracking.
- Refocused V1 around review-first poison detection for vibe coding developers.
- Added a documentation index and contract owner policy under `docs/README.md`.
- Added the target-project `design/` folder delivery contract.
- Added repository structure design and root `TODO.md` ownership.
- Added architecture owner docs and source/test scaffold boundaries.
- Added implementation contract docs for commands, runtime artifacts, state,
  output schemas, evidence, review, and gates.
- Added V1 acceptance and dry-run delivery docs.
- Split planned implementation contracts into semantic documentation owners.
- Documented future `src` and `tests` ownership boundaries without implementing
  V1 commands.
- Initialized public repository scaffolding.
- Added planning documents for the `poison` UI prototype workflow.
