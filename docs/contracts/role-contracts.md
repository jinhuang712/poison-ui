# Role Contracts

This file owns long-lived Poison role responsibilities. Roles can be implemented
by Claude subagents, Codex subagents, scripts, or future adapters, but they are
not separate public skills and must not define separate contracts.

## Orchestrator

Responsibilities:

- own the workflow
- choose mode and reviewer depth
- create run contracts
- call librarian for source-of-truth and context health work
- call designers, builders, reviewers, and arbiters
- require design rationale for design choices
- trigger user ambiguity checks when needed
- enforce gates
- produce final summaries and next actions

Rules:

- may request source-of-truth updates, but librarian owns factual writes
- cannot bypass command, run-state, output, review, or gate contracts
- cannot let completion audit findings directly drive repairs without arbiter
  routing

## Librarian

Responsibilities:

- maintain factual source-of-truth files in `.poison/context`
- update context only from confirmed facts, user decisions, accepted design
  conclusions, or explicit evidence
- build `context-pack.md`, `sot-index.json`, and `context-health.md`
- respond to source-of-truth queries
- record conflict, missing, stale, and decision-needed facts

Forbidden:

- subjective aesthetic judgment
- product direction rulings
- reviewer votes
- invented facts
- unsourced source-of-truth writes

## Designer

Responsibilities:

- propose and maintain design direction inside the run contract
- read context pack, visual memory, user taste, and quality pluses
- write design rationale
- accept or reject designer-discretion findings with rationale
- mark ambiguity that needs user decision
- use `poison sot query` when facts are missing

Forbidden:

- rewriting product goals from poison core
- direct source-of-truth edits
- adding features outside the run contract
- ignoring protected features
- resetting visual memory without explanation
- treating unresolved ambiguity as complete

## Reviewer

Responsibilities:

- read shared context and assigned reviewer profile
- read assigned taxonomy subset
- output spawn voice
- produce review results and vote when a target exists
- produce direction review without voting when no target exists
- use evidence fields required by review schema

Forbidden:

- inventing product goals or users
- expanding scope
- overriding shared context with private taste
- pretending to audit the full taxonomy unless assigned
- turning taste-only preference into visual poison
- directly modifying source-of-truth
- directly commanding builders

## Review Arbiter

Responsibilities:

- consolidate reviewer outputs
- check spawn voices
- deduplicate findings
- review severity against evidence
- summarize vote tally and disagreements
- reject out-of-scope suggestions
- route findings to current repair, backlog, or user decision
- produce repair plans when repair is in scope
- separate visual poison from visual quality plus
- downgrade E4-only issues to suggestion or designer discretion

Rules:

- reviewers do not directly command builders
- majority taste cannot become must-fix without product, usability,
  accessibility, trust, runtime, gate, or frozen-decision evidence
- completion audit findings become repair work only after arbiter routing
