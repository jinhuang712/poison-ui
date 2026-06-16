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

| Slice | Owns | Must-not-start gate |
|---|---|---|
| V3a Evidence-to-design publish | `design/manifest.json` and `design/handoff.md` from a gated V2 run | Do not start wider package files until the manifest has `sourceRunId` and evidence refs. |
| V3b Handoff package | screens, flows, interactions, and review notes when validated | Do not start completion audit until handoff files map to source evidence. |
| V3c Completion audit | evidence-backed coverage labels only | Do not publish percentages until mapping and evidence are deterministic. |
| V3d Mode readiness | readiness decisions for design-producing modes | Do not run generation while product ambiguity is unresolved. |
| V3e Generation modes | one mode at a time, preferably `evolve` before `seed` or `full` | Do not make generation the default first-user path. |

## Must Ship

- Minimal `design/manifest.json` with `sourceRunId`, source artifact refs, and
  package status.
- Minimal `design/handoff.md` that explains implementation scope and evidence
  source.
- Optional screen, flow, interaction, ADR, review, and handoff files only after
  V3a proves traceability.
- Completion audit that maps design requirements to runtime/source evidence
  without unsupported percentages.
- Tests proving optional `design/` files are not treated as mandatory.
- Tests proving every published snapshot points back to run evidence.

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
- Package files explain implementation scope and evidence source.
- Completion audit distinguishes implemented, partial, missing, deviation, and
  blocked requirements.
- Frontend handoff points to current contracts, not hidden chat context.
- Generation modes remain blocked until publish traceability is proven.

## Sequencing Rule

Do not expand V3 into platform adapter maturity. V3 is about package quality and
traceability, not distribution, plugin packaging, or harness parity.
