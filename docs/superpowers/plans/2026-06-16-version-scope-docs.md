# Version Scope Documentation Implementation Plan

Historical snapshot: this plan records the version-scope documentation pass as
it was executed. For current status, use [PROGRESS.md](../../../PROGRESS.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clarify Poison's version ladder, first-user wedge, progress state, gate scope, run-state recovery, and `design/` delivery contract before implementation starts.

**Architecture:** Keep root files as navigation and repository state, keep `docs/delivery` as version ownership, and keep `docs/contracts` as implementation-facing contracts. High-level `docs/00-09` files remain narrative indexes and must not duplicate detailed contract rules.

**Tech Stack:** Markdown documentation, existing Node scaffold check via `npm run check`, and Git history for traceability.

---

### Task 1: Add Version And Progress Owners

**Files:**
- Create: `PROGRESS.md`
- Create: `docs/README.md`
- Create: `docs/delivery/version-roadmap.md`
- Modify: `README.md`
- Modify: `poison_execution_plan_zh.md`
- Modify: `CHANGELOG.md`

- [x] **Step 1: Create `docs/delivery/version-roadmap.md`**

Write a version ladder with V0, V1, V2, V3, and V4. Each version must include status, target user job, included work, non-goals, and exit criteria.

- [x] **Step 2: Create `PROGRESS.md`**

Record the current repository status, completed documentation work, active decisions from the critique pass, and the next implementation gate.

- [x] **Step 3: Create `docs/README.md`**

Add document ownership rules and a navigation table that routes version scope, runtime contracts, design folder contract, and delivery acceptance to their owner files.

- [x] **Step 4: Update root indexes**

Update `README.md`, `poison_execution_plan_zh.md`, and `CHANGELOG.md` so the new progress and roadmap files are discoverable from the repository root.

### Task 2: Refocus Product Wedge And V1 Delivery

**Files:**
- Modify: `docs/00-overview.md`
- Modify: `docs/09-v1-delivery.md`
- Modify: `docs/delivery/v1-acceptance.md`
- Modify: `docs/delivery/dry-run.md`
- Modify: `docs/contracts/command-api.md`
- Modify: `TODO.md`

- [x] **Step 1: Add first-user wedge**

Document the first user as a vibe coding developer who lacks design, frontend, and UI/UX skill and is frustrated by AI-generated poisoned prototypes.

- [x] **Step 2: Shrink V1 to review-first**

Replace the earlier full-platform V1 checklist with review-first acceptance: initialize, capture evidence, generate review summary, produce repair plan, run schema check, run mechanical gate, and emit next actions.

- [x] **Step 3: Move broad capabilities out of V1**

Point seed/evolve/full generation, design folder publishing, ensemble review, and deep gate behavior to V2+ in the roadmap instead of keeping them as V1 requirements.

### Task 3: Repair Contracts

**Files:**
- Modify: `docs/contracts/run-state.md`
- Modify: `docs/contracts/gate-rules.md`
- Modify: `docs/contracts/design-folder.md`
- Modify: `docs/contracts/runtime-artifacts.md`
- Modify: `docs/02-core-runtime-contracts.md`
- Modify: `docs/03-modes-and-command-api.md`
- Modify: `docs/06-review-and-audit-pipeline.md`
- Modify: `docs/07-tools-gates-and-state.md`

- [x] **Step 1: Add owner notices to high-level docs**

State that detailed contract files win on conflict and that high-level documents are narrative indexes.

- [x] **Step 2: Rewrite run-state transitions**

Add a transition table with command, source state, success state, failure state, actor, idempotency, and required artifacts. Define blocked recovery through `previousStatus`.

- [x] **Step 3: Split gate hard checks from advisory checks**

Make V1 hard gate mechanical only. Move visual quality, UX completeness, placeholder heuristics, taxonomy completeness, and protected-feature regression to warnings unless a later version opts into stricter gates.

- [x] **Step 4: Make `design/` a maximal optional package**

Clarify that `.poison/runs/<run-id>` is audit/source evidence, `design/` is a one-way published human snapshot, many files are optional, and full mode may preserve history and raw evidence references.

### Task 4: Verify And Commit

**Files:**
- Check all modified files.

- [x] **Step 1: Run formatting and scaffold checks**

Run `git diff --check` and `npm run check`. Both must exit 0 before committing.

- [ ] **Step 2: Commit related files**

Stage only files modified for this documentation scope and commit with `docs: clarify version scope and product wedge`.
