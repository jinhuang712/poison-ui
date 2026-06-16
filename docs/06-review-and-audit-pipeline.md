# Review And Audit Pipeline

> Source split from `poison_execution_plan_zh.md`.

Detailed ownership lives in:

- [Review Process](./contracts/review-process.md)
- [Review Schema](./contracts/review-schema.md)
- [Evidence Model](./contracts/evidence-model.md)
- [Gate Rules](./contracts/gate-rules.md)

This file is a high-level orientation. If readiness, reviewer ensemble,
completion audit, evidence, review schema, or gate details conflict with the
contract files above, the contract files win and this file should be corrected.

## Pipeline Shape

The long-term review pipeline is:

```text
readiness assessment -> review packet -> reviewer ensemble -> arbiter summary
```

When a design/spec exists, review mode may also run completion audit:

```text
completion audit packet -> completion report -> arbiter routing
```

V1 implements the narrow review-first subset: it builds a review packet and
summary from available or degraded evidence, then runs schema-check and the
mechanical gate.

## Durable Owners

- Readiness assessment:
  [Review Process](./contracts/review-process.md#readiness-assessment)
- Review packets:
  [Review Process](./contracts/review-process.md#review-packet)
- Reviewer ensemble and depth:
  [Review Process](./contracts/review-process.md#reviewer-ensemble)
- Completion audit:
  [Review Process](./contracts/review-process.md#completion-audit)
- Evidence levels and severity:
  [Evidence Model](./contracts/evidence-model.md)
- Reviewer and summary artifact shapes:
  [Review Schema](./contracts/review-schema.md)
- Arbiter routing:
  [Review Process](./contracts/review-process.md#arbiter-rules)

## Version Scope

V1 treats visual quality, UX completeness, taxonomy coverage,
placeholder-looking content, and non-severe runtime concerns as warnings unless
they are represented by a mechanical hard-gate failure. Handoff, protected
baseline, historical visual comparison, and completion-audit concerns belong to
later versions.

Later versions may promote warnings to hard failures only after they have stable
artifact schemas, deterministic evidence, recovery paths, and tests.
