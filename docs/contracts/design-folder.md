# Design Folder Contract

This file owns the expected `design/` folder shape that a full Poison run can
produce inside a target project.

## Purpose

`design/` is the human-facing design delivery package for a target project. It
contains the runnable prototype, screenshots, screen descriptions, interaction
contracts, design decisions, implementation handoff notes, and review outputs
needed by product, design, and frontend implementation work.

`.poison/` remains Poison runtime state. It stores context, run contracts,
review evidence, gate reports, and tool state. `design/` can reference `.poison`
evidence, but it must not become a hidden runtime state directory.

## Top-Level Shape

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

## Entry Files

- `README.md`: delivery entrypoint. It explains what this design package covers,
  which prototype is canonical, and which files implementation should read
  first.
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

`current/` is the canonical prototype handoff. `runs/` preserves historical
prototype snapshots when they are useful for review, comparison, or audit.

`manifest.json` should identify included pages, routes, screenshots, source run
ID, generated timestamp, and required local viewing instructions.

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

Each screen folder owns one page or major surface:

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

Flow files describe task-level journeys across screens. They should include the
starting state, user intent, steps, decision points, recoveries, final states,
and cross-screen dependencies.

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
  completion-report.md
  visual-review.md
  ux-review.md
  frontend-handoff-review.md
```

Review files summarize completion audit, visual quality, UX, and frontend
handoff readiness for the design package. They can link back to `.poison/runs`
evidence and gate reports.

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

## Relationship To `.poison`

Use `.poison/` for:

- run contracts
- context packs
- SoT indexes
- review packets
- gate reports
- raw screenshots and console evidence
- tool state

Use `design/` for:

- design package entrypoints
- current prototype handoff
- screen and flow descriptions
- interaction contracts
- design ADRs
- review summaries
- implementation handoff material

When a Poison run changes the delivered design, update both `.poison` runtime
state and the relevant `design/` files. The runtime state explains how the work
was produced; the design folder explains what should be built.
