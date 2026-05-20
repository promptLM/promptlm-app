# Shared build governance across promptLM repositories

**Status:** Proposal — for team discussion
**Author:** Fabian
**Date:** 2026-05-20

## Why now

Spring Boot versions drifted between `promptlm-app` and one of the sibling
repos last week, and the mismatch only surfaced at integration time. The
current `promptlm-parent` POM is local to `promptlm-app` and is not
inherited by the other repos (`promptlm-client-sdk`,
`promptlm-integrations`, `promptlm-test-support`,
`promptlm-gitea-artifactory`, `promptlm-evals`, …), so there is no
structural mechanism preventing the next drift.

This proposal asks the team to make three independent decisions.

---

## Decision 1 — What artifacts to ship

| Option | Summary |
|---|---|
| A. Parent POM only | One inheritable POM owns build policy *and* dependency versions. |
| **B. Parent POM + BOM (recommended)** | `promptlm-parent` owns build policy; `promptlm-bom` owns dependency versions. Internal libs inherit the parent; everyone imports the BOM. |
| C. Combined "platform" POM | One artifact does both jobs; conflates concerns. |
| D. Status quo + discipline | What we have today; the drift we just hit. |

**Recommendation: B.** Industry standard (Spring Boot, Spring Cloud,
Quarkus, AWS SDK). Build policy and dependency versions evolve at
different cadences, and external consumers can import the BOM without
being forced to inherit our compiler/plugin policy.

**Trade-off:** one extra artifact to release. Cheap once automated.

---

## Decision 2 — Release-train cadence

| Option | Summary |
|---|---|
| **Calver train (recommended)** | `2026.05.0`, `2026.05.1`, … on a predictable schedule. Spring Cloud / Jakarta EE model. |
| Semver-on-the-BOM | BOM has its own semver; majors mark breaking changes anywhere in the platform. Quarkus / Micronaut model. |
| Independent semver, no train | What we have. Combinatorial "which versions go together?" problem. |

**Recommendation: Calver, quarterly, starting once we have the parent +
BOM in place.** We don't need a train yet for two repos, but committing
to one now means the BOM has a clear cadence story before we add the
fifth library.

Soft decision — we can defer until we have >3 active downstream
consumers, but "no train at all" is the wrong answer long-term.

---

## Decision 3 — Repo layout

| Option | Summary |
|---|---|
| Monorepo for parent + BOM + all libraries | Atomic cross-repo bumps; larger repo, harder external access. |
| **Dedicated `promptlm-platform` repo (recommended)** | Parent + BOM live in their own small repo. Libraries stay independent. |
| Parent + BOM inside one library (e.g. `promptlm-core`) | One fewer repo, but couples platform release to that library. |
| Hybrid (BOM auto-derived in CI) | Most moving parts. Overkill at current scale. |

**Recommendation: dedicated `promptlm-platform` repo.** Clear ownership,
small surface, can have its own reviewers and cadence. We are not at
monorepo scale and probably won't be for a while.

---

## Migration path

**Incremental, not big-bang:**

1. Cut `promptlm-platform` repo with `promptlm-parent` (extracted from
   `promptlm-app`) and an initial `promptlm-bom`.
2. Tag `1.0.0` of both, publish to the Gitea artifactory.
3. `promptlm-app` migrates first (proves the loop).
4. Each sibling repo migrates the next time it ships a release. No
   forced cutover.
5. Once all internal repos are on the BOM, publish externally for SDK
   consumers.

---

## Open questions for the team call

1. **Diagnosis confirmation** — does everyone agree the Spring Boot
   drift was structural, not a one-off?
2. **Decision 1** — adopt parent + BOM (B)?
3. **Decision 2** — commit to a Calver train now, or defer?
4. **Decision 3** — dedicated platform repo?
5. **Ownership** — who is empowered to say "no" to dependency bumps
   that aren't part of a planned train? (Suggest: Fabian + Vitor as
   joint platform owners; one approval required.)
6. **Public vs private** — `promptlm-platform` public from day one, or
   private until the external SDK lands?
