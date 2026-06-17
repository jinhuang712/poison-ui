# Dry Run

This file owns the V1 review-first dry-run command sequence.

## Base Sequence

```bash
node bin/poison.mjs init

node bin/poison.mjs new-run \
  --mode review \
  --name poisoned-demo

node bin/poison.mjs capture \
  --url http://localhost:5173 \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs review \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs schema-check \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs gate \
  --run .poison/runs/001-poisoned-demo
```

## V2 Controlled Hardening Slice

After the V1 gate passes, V2 may initialize the protected baseline, generate a
repair plan, route the planned repairs, write one bounded harden round, and
re-gate after post-repair capture:

```bash
node bin/poison.mjs init-protected-features \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs repair-plan \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs arbiter-route \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs harden \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs capture \
  --url http://localhost:5173 \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs review \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs schema-check \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs gate \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs regression-check \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs visual-drift \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs publish-design \
  --run .poison/runs/001-poisoned-demo

node bin/poison.mjs publish-handoff \
  --run .poison/runs/001-poisoned-demo
```

## Degraded Evidence Path

If Playwright, browser access, the local app URL, or console capture is not
available, `capture` must not silently pass. It must write an explicit degraded
evidence artifact, set `nextRecommendedAction`, and leave the run in a legal
recoverable state.

The rest of the dry-run may continue only when the review command can identify
which evidence is missing and avoids claiming UI completion.

## Later-Version Commands

These commands are intentionally outside the V1 dry-run and belong to later
versions unless the roadmap changes:

```bash
node bin/poison.mjs assess-readiness
node bin/poison.mjs assess-scope
node bin/poison.mjs decision-html
node bin/poison.mjs ambiguity-check
node bin/poison.mjs audit-completion
```
