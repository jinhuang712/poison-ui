# Design Folder Contract

This file owns the expected `design/` folder shape that a full Poison run can
publish inside a target project.

## Purpose

`design/` is the human-facing design delivery package for a target project. It
contains the current prototype handoff, selected screenshots, screen
descriptions, interaction contracts, design decisions, implementation handoff
notes, and review outputs needed by product, design, and frontend
implementation work.

This contract describes the maximal package. Most files are optional and should
exist only when they are useful for the active run, project maturity, and handoff
needs.

## Relationship To `.poison`

`.poison/runs/<run-id>` is the audit/source evidence directory. It stores raw
run contracts, context packs, evidence, screenshots, console output, review
packets, gate reports, and tool state.

`design/` is a published human snapshot. It is optimized for people who need to
understand what should be built, not for tools that need to replay every
decision.

Publishing is one-way:

```text
.poison/runs/<run-id> -> design/
```

Poison may publish selected run results into `design/`, but it must not silently
reverse-sync edits from `design/` back into `.poison` runtime state. If a human
edits `design/`, a later Poison run must treat that edit as new input and record
the source explicitly.

Published files should identify their source run when possible:

```text
sourceRunId: 001-poisoned-demo
sourceEvidence: .poison/runs/001-poisoned-demo/review-summary.md
publishedAt: ISO-8601
```

Historical prototypes and raw evidence should be preserved in `.poison/runs`.
They may also be referenced or selectively copied into `design/` when useful for
comparison, audit, or handoff.

## Minimal Publish Package

A small review-first or hardening run may publish only:

```text
design/
  manifest.json
  handoff.md
```

V3a starts with only these two files. Wider review, screen, flow, interaction,
ADR, and handoff subtrees are optional later package expansions.

If a runnable prototype is part of the handoff, add:

```text
design/prototypes/current/
  index.html
  manifest.json
  assets/
  screenshots/
```

The minimal package must explain what is included, what is missing, and which
`.poison/runs/<run-id>` produced it.

## Maximal Top-Level Shape

Full mode or mature handoff may publish:

```text
design/
  README.md
  design-brief.md
  product-context.md
  information-architecture.md
  design-system.md
  visual-direction.md
  content-guidelines.md
  changelog.md

  prototypes/
  screens/
  flows/
  interactions/
  adrs/
  review/
  handoff/
```

Absence of a maximal file is not a failure by itself. Gate or publish checks
must decide required files from the active mode, target version, and handoff
scope.

## Entry Files

- `README.md`: delivery entrypoint. It explains what this design package covers,
  which prototype is canonical, source run IDs, and which files implementation
  should read first.
- `design-brief.md`: product goal, target users, non-goals, constraints, and
  current design scope.
- `product-context.md`: product facts distilled from Poison core and confirmed
  project context.
- `information-architecture.md`: navigation model, page map, hierarchy, and
  major content groupings.
- `design-system.md`: typography, color, spacing, density, components, states,
  tokens, and reusable visual rules.
- `visual-direction.md`: visual intent, visual memory, taste decisions, and
  explicit anti-patterns.
- `content-guidelines.md`: UI copy voice, terminology, empty/error/loading copy,
  and content conventions.
- `changelog.md`: design package changes by Poison run.

## Prototypes

```text
design/prototypes/
  current/
    index.html
    manifest.json
    assets/
    screenshots/
      desktop/
      mobile/
  runs/
    001-seed/
    002-checkout-flow/
    003-harden/
```

`current/` is the canonical prototype handoff when a runnable prototype is
published. `runs/` preserves historical prototype snapshots only when they are
useful for review, comparison, audit, or rollback explanation.

`manifest.json` should identify included pages, routes, screenshots,
`sourceRunId`, generated timestamp, and required local viewing instructions.

## Screens

```text
design/screens/
  home/
    screen.md
    states.md
    interactions.md
    screenshots/
    notes.md
  checkout/
    screen.md
    states.md
    interactions.md
    screenshots/
    notes.md
```

Each screen folder owns one page or major surface. Create a screen folder only
when the screen has enough design or handoff detail to justify its own files.

- `screen.md`: purpose, user goal, layout, content hierarchy, components, and
  acceptance notes.
- `states.md`: default, loading, empty, error, disabled, success, edge, and
  permission states relevant to the screen.
- `interactions.md`: screen-local interactions, transitions, validation, and
  response behavior.
- `screenshots/`: desktop and mobile screenshots for the screen.
- `notes.md`: implementation notes, caveats, and references.

## Flows

```text
design/flows/
  onboarding.md
  search-to-detail.md
  checkout.md
```

Flow files describe task-level journeys across screens. Create them when a
journey crosses screens, has decision points, or needs implementation handoff.
They should include the starting state, user intent, steps, decision points,
recoveries, final states, and cross-screen dependencies.

## Interactions

```text
design/interactions/
  global-navigation.md
  form-validation.md
  loading-error-empty.md
  responsive-behavior.md
```

Interaction files own cross-screen behavior. Use them for interaction contracts
that would otherwise be duplicated in multiple screen folders.

## ADRs

```text
design/adrs/
  0001-navigation-model.md
  0002-card-density.md
  0003-checkout-error-handling.md
```

Design ADRs explain decisions that are likely to be revisited. Each ADR should
include context, decision, alternatives considered, consequences, source run,
and related prototype evidence.

## Review

```text
design/review/
  latest-summary.md
  completion-report.md
  visual-review.md
  ux-review.md
  frontend-handoff-review.md
  archive/
```

Review files summarize completion audit, visual quality, UX, and frontend
handoff readiness for the design package. They can link back to `.poison/runs`
evidence and gate reports. `archive/` is optional; keep long history in
`.poison/runs` unless human readers benefit from a copied summary.

## Handoff

```text
design/handoff/
  implementation-map.md
  acceptance-checklist.md
  open-questions.md
  backlog.md
```

Handoff files translate design into implementation work:

- `implementation-map.md`: maps screens, flows, and interactions to app routes,
  components, data needs, and likely source areas.
- `acceptance-checklist.md`: testable implementation criteria.
- `open-questions.md`: unresolved product/design questions that block or affect
  implementation choices.
- `backlog.md`: lower-priority design follow-ups that should not block the
  current implementation slice.

## Publish Rules

- Do not require the maximal tree for V1 review.
- Do not copy raw evidence into `design/` unless it helps human review or
  handoff.
- Preserve source history and raw evidence in `.poison/runs` by default.
- Every published snapshot should include `sourceRunId` or an explicit "source
  unknown" note.
- If a file does not exist because the run did not need it, that is acceptable.
- If a file is required by the active publish mode, missing it must be reported
  as a publish or gate failure with a concrete next action.
