# Progress

This file records current repository progress and implementation readiness. The
detailed version ladder lives in
[docs/delivery/version-roadmap.md](./docs/delivery/version-roadmap.md), and
implementation contracts live under [docs/contracts](./docs/contracts).

## Current Status

Poison has moved from V0 documentation scaffold through the V1 review-first
CLI subset, the bounded V2 controlled-hardening slice, and the V3 design
package traceability slices.

The repository currently provides:

- Root project navigation and workflow rules.
- Split high-level docs under `docs/00-09`.
- Detailed architecture, delivery, and implementation contract owners.
- A V1 dependency-free CLI path for `init`, `new-run`, `capture`, `review`,
  `schema-check`, and `gate`.
- A V2a protected baseline action for `init-protected-features`.
- A V2b repair planning action for `repair-plan`.
- A V2c arbiter routing action for `arbiter-route`.
- A V2d bounded harden action for `harden` that writes one repair-round
  artifact set and returns the run to capture.
- A post-repair capture, review, schema-check, and gate path that preserves
  bounded round traceability.
- A V2e protected regression action for `regression-check` that writes
  `repair-rounds/001/regression-results.json` after post-repair gate.
- A V2e visual drift action for `visual-drift` that writes
  `repair-rounds/001/visual-drift.json` or an explicit visual evidence gap.
- A V3a minimal publishing action for `publish-design` that writes only
  `design/manifest.json` and `design/handoff.md`.
- A V3b handoff publishing action for `publish-handoff` that writes only
  source-mapped files under `design/handoff/`.
- A V3c completion audit action for `audit-completion` that writes run-local
  evidence labels without percentages or wider design package output.
- Node built-in tests for the dry-run flow, run-state handling, degraded
  evidence reporting, schema checks, and the mechanical gate.
- An operational `skills/poison/SKILL.md` entrypoint that routes behavior to
  contract owners.

The repository does not yet provide multi-reviewer review, harness degradation
matrix, screen/flow/review package expansion, or later seed/evolve/full modes.

## Active

The most recent completed implementation direction was:

- V2d bounded harden round: write `repair-rounds/001` artifacts from the
  routed `currentRepair` and return the run to capture without regression,
  drift, or design publishing.
- Post-repair re-gate: recapture, review, schema-check, and gate after the
  bounded round while preserving `repair-rounds/001` traceability.
- V2e protected regression: write regression results after post-repair gate
  without drift reports or design publishing.
- V2e visual drift: write a screenshot-backed drift report when before/after
  screenshots exist, or an explicit `NO_VISUAL_EVIDENCE` gap when they do not.
- V3a minimal design publishing: write a source-linked manifest and handoff
  from a gated V2 run without broader package output.
- V3b handoff package: write source-mapped implementation map, acceptance
  checklist, open questions, and backlog files without completion audit or
  broader design package expansion.
- V3c completion audit: write run-local audit packet and report labels without
  percentages or broader design package expansion.
- V4a command semantics freeze: lock observable CLI success/failure channels,
  illegal command-order behavior, and blocked-state recovery metadata.
- V4b fixture contract suite: run one harness-local V1-V3c happy-path
  transcript through the CLI to catch contract drift.
- V4c adapter-facing contract: publish a manifest that maps implemented
  commands to the shared CLI and disallows private adapter behavior.

Recent acceptance checks:

- Browser evidence review packets reference `screenshot-manifest.json`,
  `console.log`, and the captured screenshot.
- Degraded evidence review packets reference only `degraded-evidence.md`.
- Review summaries point findings to existing evidence artifacts.
- Gate fails on missing referenced artifacts.
- Gate fails on invalid required V1 JSON artifacts.
- Gate fails on captured `pageerror` or console `error` evidence.
- Gate does not fail on warning-level console evidence.
- `init-protected-features` writes `protected-features.md` and moves a run to
  `protected_ready`.
- V2a does not create repair-plan or `design/` publishing artifacts.
- `repair-plan` writes ordered repair artifacts mapped to V1 finding IDs and
  moves a run to `repair_planned`.
- V2b does not create `currentRepair`, `needsUserDecision`, harden output, or
  `design/` publishing artifacts.
- `arbiter-route` routes repair items to `currentRepair`, `backlog`,
  `needsUserDecision`, or `rejected` and moves a run to `repair_routed`.
- V2c does not create repair-round artifacts, recapture evidence, regression
  output, or `design/` publishing artifacts.
- `harden` writes only `repair-rounds/001/repair-plan.md`,
  `repair-rounds/001/repair-plan.json`,
  `repair-rounds/001/before-after-evidence.md`, and
  `repair-rounds/001/round-summary.md` from the routed current repair.
- V2d moves a run to `repaired` with `nextRecommendedAction: capture` and does
  not execute backlog repairs, regression/drift verdicts, or design publishing.
- Post-repair review and gate preserve `repair-rounds/001` artifacts and do
  not add new repair-plan findings, regression results, drift reports, or
  design publishing.
- `regression-check` writes `repair-rounds/001/regression-results.json` only
  after post-repair gate and maps checks to `protected-features.md` items.
- Schema-check rejects regression results before post-repair gate.
- `visual-drift` writes `repair-rounds/001/visual-drift.json` only after
  regression checks.
- Degraded runs record `NO_VISUAL_EVIDENCE` rather than a visual judgment.
- Browser-evidence runs can reference before and after screenshot paths while
  leaving the verdict as `NEEDS_HUMAN_REVIEW`.
- `publish-design` writes only `design/manifest.json` and `design/handoff.md`
  from a gated V2 source run.
- Published design output includes `sourceRunId` and source artifact refs.
- `publish-handoff` moves the manifest to `HANDOFF_READY` and keeps completion
  percentages, screens, flows, and review package output absent.
- `audit-completion` writes `completion-audit-packet.md` and
  `completion-report.md` in the run directory and keeps `design/review`,
  percentages, screens, and flows absent.
- V4a CLI semantics tests cover help, unknown command, missing `--run`,
  schema-check failure, gate failure, illegal early gate, and blocked metadata.
- V4b transcript tests cover V1-V3c command sequence, final `published` state,
  completion artifacts, and absence of `design/review`.
- V4c manifest tests cover implemented command names, `poison` adapter entry,
  and no-private-schema behavior.

## Blocked

These items must not begin implementation yet:

- V4 packaging work is blocked until degradation behavior is documented and
  tested.

## Next

Continue V4 only as a narrow harness-degradation slice:

- Document and test missing automation degradation behavior.
- Keep packaging, release, broad adapter matrix, seed/full generation, and
  screen/flow/review expansion blocked.

## Deferred

- V2 work beyond one controlled hardening slice.
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

Status: V1a-V1d implemented.

User job:

```text
I have an AI-made local UI demo. Tell me why it feels poisoned and what to fix first.
```

Implemented:

- `poison init` creates minimal `.poison/context` and `.poison/runs`.
- `poison new-run --mode review --name <name>` creates a review run with
  `run-state.json`, `run-contract.md`, and `context-health.md`.
- `poison capture --url <url> --run <run>` records browser screenshot and
  console evidence when Playwright is available, or explicit degraded evidence
  when capture is unavailable.
- `poison review --run <run>` writes `review-packet.md` and
  `review-summary.md` from the evidence artifacts that exist in the run.
- `poison schema-check --run <run>` validates required V1 JSON and Markdown
  structure.
- `poison gate --run <run>` writes `gate-report.md` and moves passing runs to
  `gated`.
- Tests cover runtime artifact helpers, run-state validation, browser evidence,
  degraded evidence reporting, evidence-aware review artifacts, schema checking,
  mechanical gate pass/fail behavior, and the V1 dry-run flow.

Remaining:

- Keep V1 focused on review-first behavior. Do not add repair loops, design
  publishing, broad generation modes, or subjective visual hard gates to V1.

Exit gate:

- V1 is ready for the next version when the dry-run works with both degraded
  evidence and real browser evidence, and the gate remains mechanical rather
  than subjective.

## V2 Controlled Hardening Loop

Status: V2a-V2d, post-repair re-gate, V2e protected regression, and V2e visual
drift implemented.

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
- Protected-feature artifacts have tests.
- Repair-plan artifacts have tests.
- Arbiter routing artifacts have tests.
- Bounded harden artifacts have tests.
- Post-repair recapture/regate behavior has tests.
- V2e protected regression behavior has tests.
- V2e visual drift behavior has tests.
- Autonomous workflow decisions are traceable to contract owners.

## V3 Design Package Mode

Status: V3a minimal evidence-to-design publishing, V3b handoff package, and
V3c completion audit implemented.

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
- Keep screen, flow, and review package expansion deferred until completion
  audit labels are evidence-backed.

Prerequisites:

- V2 repair loops are stable and evidence-backed.
- `design/` publishing is one-way from `.poison/runs` evidence.
- Optional design files do not become mandatory by accident.
- V3a minimal publishing has tests.
- V3b handoff package publishing has tests.
- V3c completion audit has tests.

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
