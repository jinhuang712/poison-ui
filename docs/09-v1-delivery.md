# V1 Delivery

> Source split from `poison_execution_plan_zh.md`.

Detailed delivery ownership lives in:

- [Version Roadmap](./delivery/version-roadmap.md)
- [V1 Acceptance](./delivery/v1-acceptance.md)
- [Dry Run](./delivery/dry-run.md)

This file keeps the high-level V1 delivery narrative. If acceptance,
non-goals, dry-run commands, or exit criteria conflict with the delivery owner
files above, those files win and this file should be corrected.

## Product Slice

V1 is a review-first poison detector for an existing local UI prototype. It is
for vibe coding developers who can generate a demo with AI but cannot reliably
diagnose why the result feels wrong.

The workflow is:

```text
init -> new review run -> capture or record evidence gap -> review -> schema-check -> mechanical gate -> next action
```

## Implemented Subset

The current repository implements the dependency-free V1 dry-run path through:

- `bin/poison.mjs`
- `src/core/v1-runtime.mjs`
- `tests/unit/runtime-artifacts.test.mjs`
- `tests/integration/v1-dry-run.test.mjs`

It creates runtime folders, review-run artifacts, explicit degraded evidence,
review packet and summary files, schema-check output, and a mechanical gate
report.

## Remaining V1 Work

The main remaining V1 enhancement is real browser screenshot and console
capture behind the existing `capture` contract. Until that exists, V1 must keep
evidence limitations explicit and avoid claiming visual observations that were
not captured.

## Non-Goals

V1 does not include full prototype generation, full-spec mode, full `design/`
package publishing, automatic design system extraction, pixel-perfect visual
diffing, deep mandatory reviewer ensembles, automatic code repair, remote
deployment, or strict subjective visual gates.
