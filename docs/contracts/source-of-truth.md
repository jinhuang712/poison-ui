# Source Of Truth Contract

This file owns Poison's product context and source-of-truth query rules.

## Canonical Context

All roles use these canonical inputs:

```text
.poison/context/poison-core.current.md
.poison/runs/<run-id>/run-contract.md
```

Later-version runs can add a librarian-built shared context package:

```text
.poison/runs/<run-id>/context-pack.md
.poison/runs/<run-id>/sot-index.json
.poison/runs/<run-id>/context-health.md
```

V1 review-first can run with minimal context plus explicit context limitations.
V2+ workflows should use `context-pack.md` as the practical entrypoint for
designers, reviewers, builders, and arbiters.

## Poison Core

`poison-core.current.md` is the durable product context. It should record:

- product one-line description
- target users and non-target users
- core job-to-be-done
- core workflow
- page inventory
- information hierarchy
- domain objects
- accepted decisions
- open questions
- non-goals
- visual direction
- design constraints
- source trace

Poison core must not be rewritten from reviewer opinion or private role
context.

## Run Contract

`run-contract.md` defines the active run boundary. It should record:

- mode
- poison core version
- what the run may change
- what the run must not change
- included pages, interactions, and states
- frozen decisions
- change budget
- acceptance criteria

Designers, builders, reviewers, and arbiters cannot redefine product goals,
target users, core workflow, or active scope outside poison core, run contract,
and the current context package.

## Librarian Rule

The librarian is the only role with limited write access to factual
source-of-truth files. It can write only from:

- confirmed facts
- user decisions
- accepted design conclusions
- explicit evidence

Other roles request source-of-truth changes or use `poison sot query`.

## Query Protocol

When roles need more facts, they query instead of inventing answers:

```bash
poison sot query --run <run-id> --topic "<topic>"
```

Return shape:

```json
{
  "answer": "...",
  "source": "...",
  "status": "CONFIRMED | UNKNOWN | CONFLICTED | OPEN"
}
```

Rules:

- `CONFIRMED`: a fact and source exist.
- `UNKNOWN`: the topic is written to `.poison/context/open-questions.md`.
- `CONFLICTED`: the conflict is written to run `context-health.md`.
- `OPEN`: the fact exists but awaits user or upstream decision.
- The librarian must not invent facts to answer a query.
- Source-of-truth updates bump revision and rebuild context package when a
  context package is active.
- A reviewer ensemble must not mix different context package revisions in one
  review cycle.
