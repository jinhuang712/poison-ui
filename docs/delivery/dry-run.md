# Dry Run

This file owns the V1 dry-run command sequence.

## Base Sequence

```bash
node bin/poison.mjs init

node bin/poison.mjs new-run \
  --mode seed \
  --name test-seed

node bin/poison.mjs init-protected-features \
  --run .poison/runs/001-test-seed

node bin/poison.mjs assess-readiness \
  --input ./docs/sample-prd.md \
  --run .poison/runs/001-test-seed

node bin/poison.mjs assess-scope \
  --run .poison/runs/001-test-seed

node bin/poison.mjs build-review-packet \
  --run .poison/runs/001-test-seed

node bin/poison.mjs decision-html \
  --question "choose search layout" \
  --run .poison/runs/001-test-seed

node bin/poison.mjs ambiguity-check \
  --run .poison/runs/001-test-seed

node bin/poison.mjs audit-completion \
  --design ./docs/sample-design.md \
  --url http://localhost:5173 \
  --run .poison/runs/001-test-seed

node bin/poison.mjs schema-check \
  --run .poison/runs/001-test-seed

node bin/poison.mjs gate \
  --run .poison/runs/001-test-seed
```

## Optional Capture

Run this when a local app is available:

```bash
node bin/poison.mjs capture \
  --url http://localhost:5173 \
  --run .poison/runs/001-test-seed
```

If Playwright or browser capability is missing, capture must produce clear
manual evidence instructions or a blocked/degraded evidence report.
