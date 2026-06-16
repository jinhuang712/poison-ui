# TODO

This file tracks real repository work. Keep it actionable and remove or update
items as they are completed.

## Next Implementation Steps

- Implement the V1 review-first CLI subset from
  `docs/delivery/v1-acceptance.md` before broader generation modes.
- Expand `skills/poison/SKILL.md` from scaffold into the operational skill
  entrypoint after contract owners are stable.
- Add tests for review-run artifact helpers, run-state validation, degraded
  evidence reporting, schema checking, and the V1 dry-run flow.
- Defer design folder publishing until V2/V3 unless the roadmap changes.

## Structural Follow-Ups

- Keep `docs/00-09` as stable high-level entries and link them to detailed
  contract owners instead of growing them.
- Reduce duplicated contract text in high-level docs whenever the matching
  `docs/contracts` owner is updated.
- Keep `.poison/context` trackable by default; only ignore generated run
  evidence such as screenshots, console logs, and temporary files.
- Keep `skills/poison/references` aligned with `docs/contracts` without making
  the skill references a second source of truth.
