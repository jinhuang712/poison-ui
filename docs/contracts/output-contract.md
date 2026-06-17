# Output Contract

This file owns artifact metadata and lightweight schema requirements. V1 uses
the review-first subset of this contract.

V1 does not introduce complex JSON Schema. Tools should validate required
fields, required sections, and JSON parseability.

## Markdown Metadata

Key Markdown artifacts must start with:

```markdown
---
schemaVersion: 1
runId: <run-id>
artifact: <artifact-name>
status: DRAFT | READY | BLOCKED | PASS | FAIL
source: <command-or-role>
updatedAt: <ISO-8601>
---
```

## Markdown Sections

Artifacts include these sections when relevant. Empty sections must contain
`none` or an explicit reason.

```markdown
## Summary
## Inputs
## Evidence
## Decisions
## Open Questions
## Next Actions
```

`status: BLOCKED` artifacts must include a blocked reason and next action.

## JSON Metadata

Key JSON artifacts must include:

```json
{
  "schemaVersion": 1,
  "runId": "<run-id>",
  "artifact": "<artifact-name>",
  "status": "READY",
  "updatedAt": "ISO-8601",
  "artifacts": []
}
```

## Key Artifacts

V1 key artifacts:

```text
run-state.json
run-contract.md
context-health.md
review-packet.md
review-summary.md
gate-report.md
```

V2 active artifacts:

```text
protected-features.md
repair-plan.md
repair-plan.json
arbiter-routing.md
arbiter-routing.json
repair-rounds/001/repair-plan.md
repair-rounds/001/repair-plan.json
repair-rounds/001/before-after-evidence.md
repair-rounds/001/round-summary.md
repair-rounds/001/regression-results.json
repair-rounds/001/visual-drift.json
```

Later-version artifacts:

```text
design/manifest.json
design/handoff.md
design/handoff/implementation-map.md
design/handoff/acceptance-checklist.md
design/handoff/open-questions.md
design/handoff/backlog.md
context-pack.md
scope-assessment.md
design-rationale.md
user-ambiguity-check.md
direction-synthesis.md
completion-audit-packet.md
completion-report.md
```

## Schema Check

`poison schema-check --run .poison/runs/<run-id>` checks:

- Markdown metadata block presence and allowed fields.
- Required Markdown sections.
- JSON parseability.
- Required JSON fields.
- V2 repair-plan item shape, planned-only status, duplicate IDs, no embedded
  routing fields, and one-to-one mapping to V1 findings.
- V2 arbiter-routing bucket shape and one-time routing of every repair item.
- V2d repair-round shape, source repair traceability to arbiter routing, and no
  embedded regression, drift, or design publishing output.
- Post-repair review and gate preserve `repair-rounds/001` traceability without
  adding new repair-plan findings.
- V2e regression results only appear after post-repair gate, map to
  `protected-features.md` items, and do not embed drift or design publishing
  output.
- V2e visual drift results only appear after regression results. They either
  reference before/after screenshots or record an explicit evidence gap, and
  they do not embed design publishing output.
- V3a design publishing writes only `design/manifest.json` and
  `design/handoff.md`, both tied to a source run and source artifacts. Missing
  broader design package files must not fail V3a.
- V3b handoff publishing requires manifest `HANDOFF_READY`, exactly lists the
  V3a files plus handoff package files, validates each handoff file section,
  and still rejects completion percentages, screens, flows, or review package
  output.
- V3c completion audit validates run-local `completion-audit-packet.md` and
  `completion-report.md` only when those artifacts exist. The report must use
  evidence-backed labels and must not publish percentages or create
  `design/review`, screen, or flow output.

Gate must call `schema-check` or an equivalent core module. Missing schema
metadata prevents entering `gated`.
