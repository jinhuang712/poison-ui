# Version Roadmap

This file is an index for the version ladder. Detailed scope, gates, weights,
and exit criteria live in the per-version delivery owner files.

## First User

The first user is a vibe coding developer who can ship with AI but cannot yet
reliably judge whether an interface has good design, frontend craft, or UI/UX
quality.

Poison's first promise is:

```text
Point Poison at the current AI-made prototype, get evidence-backed findings,
and learn what to fix first.
```

## Version Principles

- Keep one active implementation milestone at a time.
- Make every version independently useful and testable.
- Treat `.poison/runs/<run-id>` as audit evidence.
- Treat `design/` as a later human-facing publish snapshot, not the early source
  of truth.
- Promote subjective design judgment to hard gates only after evidence,
  artifacts, recovery path, and pass/fail tests exist.

## Ladder

| Version | Status | User job | Owner |
|---|---|---|---|
| V0 Documentation scaffold | complete | make the repository implementable without a monolithic plan | [PROGRESS.md](../../PROGRESS.md#v0-documentation-migration) |
| V1 Review-first detector | complete | I have an AI-made local UI demo; tell me what is poisoned and what to fix first | [v1-review-first.md](./v1-review-first.md) |
| V2 Controlled hardening | active, V2e next | improve this prototype without breaking what already works | [v2-controlled-hardening.md](./v2-controlled-hardening.md) |
| V3 Design package | blocked | publish a traceable handoff from evidence-backed runs | [v3-design-package.md](./v3-design-package.md) |
| V4 Platform and adapter maturity | deferred | use the same Poison contract across harnesses | [v4-platform-adapter-maturity.md](./v4-platform-adapter-maturity.md) |
| VN Backlog | parked | future items awaiting a narrow owner and gate | [vn-backlog.md](./vn-backlog.md) |

## Current Active Sequence

1. Add V2e protected-feature regression and drift checks only after fresh
   post-repair evidence exists.
2. Keep V2 limited to one controlled hardening slice before V3.

## Must Not Start Yet

- V3 publishing before V2 performs one bounded harden loop and re-gates.
- V2e drift reporting before protected-feature regression checks exist.
- V4 adapter parity or packaging before V3 publish traceability is stable.
- VN items before they have one user job, one artifact owner, one gate behavior,
  and pass/fail tests.
