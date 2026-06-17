# V3 Design Package Mode

This file owns V3 delivery scope. V3 publishes human-facing design handoff
artifacts from evidence-backed runs after V2 repair loops are reliable.

## Product Job

```text
Generate or consolidate a full high-fidelity design package that a frontend implementer can use.
```

## Scope

V3 starts by publishing a minimal `design/` handoff from an already gated V2
run. The package is a human-facing snapshot derived from
`.poison/runs/<run-id>` evidence; it is not a second source of truth. Broader
generation modes are introduced only after the publish path is traceable and
useful.

## Milestone Ladder

| Slice | Status | Owns | Must-not-start gate |
|---|---|---|---|
| V3a Evidence-to-design publish | implemented | `design/manifest.json` and `design/handoff.md` from a gated V2 run | Do not start wider package files until the manifest has `sourceRunId` and evidence refs. |
| V3b Handoff package | implemented | source-mapped `design/handoff/implementation-map.md`, `acceptance-checklist.md`, `open-questions.md`, and `backlog.md` | Do not start completion audit until handoff files pass schema-check. |
| V3c Completion audit | next | evidence-backed coverage labels only | Do not publish percentages until mapping and evidence are deterministic. |
| V3d Mode readiness | deferred | readiness decisions for design-producing modes | Do not run generation while product ambiguity is unresolved. |
| V3e Generation modes | deferred | one mode at a time, preferably `evolve` before `seed` or `full` | Do not make generation the default first-user path. |

## Must Ship

- Minimal `design/manifest.json` with `sourceRunId`, source artifact refs, and
  package status.
- Minimal `design/handoff.md` that explains implementation scope and evidence
  source.
- Optional screen, flow, interaction, ADR, review, and handoff files only after
  V3a proves traceability.
- V3b handoff files that map current implementation notes back to source
  artifacts without introducing broader package output.
- Completion audit labels that map design requirements to runtime/source
  evidence without unsupported percentages.
- Tests proving optional `design/` files are not treated as mandatory.
- Tests proving every published snapshot points back to run evidence.

## Current V3a Exit Criteria

- `poison publish-design --run <run-path>` accepts only a gated V2 source run
  that has repair-round, regression, and visual-drift artifacts.
- A first successful run writes only `design/manifest.json` and
  `design/handoff.md`.
- `design/manifest.json` includes `sourceRunId`, source artifact refs, and
  `packageStatus: MINIMAL_READY`.
- `design/handoff.md` names the source run and source evidence.
- V3a must not write wider screen, flow, review, completion percentage, seed,
  full-generation, or adapter-maturity output.

## Current V3b Exit Criteria

- `poison publish-handoff --run <run-path>` requires an existing V3a
  `design/manifest.json` and `design/handoff.md`.
- A successful run writes only the four files under `design/handoff/`.
- `design/manifest.json` moves to `packageStatus: HANDOFF_READY` and exactly
  lists V3a plus V3b files.
- V3b must not write completion percentages, screens, flows, review package,
  seed, full-generation, or adapter-maturity output.

## Current V3c Entry Criteria

- V3b handoff package passes `schema-check`.
- Completion audit labels can be mapped to source artifacts.
- Percentages remain blocked until a deterministic denominator exists.

## Weighting

| Area | Weight | Rationale |
|---|---:|---|
| Traceability | 30 | Published design must stay tied to run evidence. |
| Handoff usefulness | 25 | Frontend implementers need clear current scope. |
| Completion audit | 15 | Package quality depends on verified coverage. |
| Mode readiness | 10 | Generation should activate only when input supports it. |
| Scope restraint | 20 | V3 must not become broad generation before publish works. |

## Hard Gates

- `design/` output must include `sourceRunId`.
- Published files must not override `.poison/context` as the source of truth.
- Full mode cannot proceed when product context ambiguity is unresolved.
- Completion audit cannot assign percentages without deterministic evidence
  mapping.
- Missing optional design files cannot fail the package by default.

## Non-Goals

- Treating every maximal `design/` file as mandatory.
- Replacing human product decisions.
- Hidden LLM calls inside deterministic scripts.
- Publishing untraceable design artifacts.
- Making full generation the default path for first-time users.
- Shipping `seed`, `full`, or broad generation before V3a and V3b pass.

## Entry Criteria

- V2 can repair and re-gate a bounded slice.
- Protected-feature checks are reliable.
- The design-folder contract is stable enough for publishing tests.
- A source run is already gated and has evidence-backed V1 finding IDs plus V2
  repair-round artifacts.

## Exit Criteria

- V3a can publish a coherent minimal `design/` handoff package.
- V3b can publish source-mapped handoff files without broader package output.
- Package files explain implementation scope and evidence source.
- Completion audit distinguishes implemented, partial, missing, deviation, and
  blocked requirements.
- Frontend handoff points to current contracts, not hidden chat context.
- Generation modes remain blocked until publish traceability is proven.

## Sequencing Rule

Do not expand V3 into platform adapter maturity. V3 is about package quality and
traceability, not distribution, plugin packaging, or harness parity.
