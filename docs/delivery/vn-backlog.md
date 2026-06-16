# VN Backlog

This file owns future-version candidates that are intentionally not committed
to V1-V4. Items here need evidence, user demand, and a version owner before
implementation.

## Promotion Rule

An item can move from VN to a numbered version only when it has:

- exactly one clear user job
- exactly one primary artifact owner
- exactly one gate behavior change
- a bounded evidence source
- pass and fail tests for that gate behavior
- a reason it cannot fit into the current version

Do not promote a broad theme. Promote one user job, one owner, one gate
behavior, and one pass/fail test set.

## Candidate Items

### Visual Intelligence

- deeper visual diffing
- responsive layout heuristics
- stronger placeholder and fake-polish detection
- screenshot clustering across multiple routes

Promotion risk: these can become subjective and brittle. They need reliable
evidence and warning-first behavior before becoming hard gates.

### Design System Extraction

- component inventory
- token extraction
- pattern consistency reports
- implementation handoff hints

Promotion risk: premature extraction may make a weak prototype look more mature
than it is.

Minimum promotion shape:

- user job: identify repeated UI patterns after evidence and repair loops are stable
- artifact owner: future design-system report contract
- gate behavior: warning-only consistency report
- tests: one pass fixture with repeated components, one fail fixture with
  untraceable extraction

### Collaboration And Review Operations

- reviewer assignment policies
- review history comparison
- comment export
- stakeholder approval records

Promotion risk: process tooling can hide poor core evidence if added too early.

Minimum promotion shape:

- user job: export a bounded review decision history for a stakeholder
- artifact owner: future review-operations contract
- gate behavior: no hidden chat context in exported decisions
- tests: one pass fixture with explicit source refs, one fail fixture without refs

### Automation And Repair

- safe code patch generation
- repair branch orchestration
- targeted component rewrites
- regression-driven repair loops

Promotion risk: code repair should not start until evidence, protected
features, and repair-plan routing are stable.

Minimum promotion shape:

- user job: apply one accepted repair safely
- artifact owner: future repair-automation contract
- gate behavior: patch must trace to one accepted repair-plan item
- tests: one pass fixture with a narrow patch, one fail fixture with scope
  expansion

### Manual Evidence Registration

- human-uploaded screenshots
- human-entered console/runtime notes
- external inspection links

Promotion risk: manual evidence can become unstructured opinion unless V1/V2
schemas already distinguish degraded evidence from real capture.

Minimum promotion shape:

- user job: register a human-provided artifact when automation is unavailable
- artifact owner: future evidence-registration contract
- gate behavior: manual evidence must include source, timestamp, limitation,
  and author
- tests: one pass fixture with complete metadata, one fail fixture with missing
  source or limitation

### Post-V4 Release And Distribution Extensions

- marketplace publishing beyond the first release target
- additional harness distribution channels
- upgrade and migration automation
- release telemetry and adoption reporting

Promotion risk: distribution magnifies contract drift. These items are not V4
core packaging or adapter parity; they are post-V4 extensions after fixture
tests already catch drift.

Minimum promotion shape:

- user job: extend an already validated V4 release to one additional
  distribution channel
- artifact owner: future release contract
- gate behavior: package validation must route to shared command/core modules
- tests: one pass fixture transcript, one fail fixture with private schema drift

## Rejection Rule

Reject or defer future items that:

- blur current version weight
- require subjective hard gates without reliable evidence
- depend on hidden chat context
- create a second source of truth
- make full generation the default first-user path
