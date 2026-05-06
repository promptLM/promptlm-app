# Issue #99 — Multi-scenario placeholder support (v2)

> **Supersedes the single-map model from #95.** This is the v2 follow-on we
> deferred when scoping the Test tab + Release flow. File this once #95 PR 1
> ships so it has a stable surface to graft onto.

## Title

`Test/Run v2: multi-scenario placeholders`

## Labels

`area: web-ui` · `area: backend` · `type: enhancement` · `follow-up: #95`

---

## Why

In #95 we agreed that the **scenario** (a named bundle of placeholder values +
expected behavior) is the right unit of pre-release execution. v1 shipped with
a degenerate version of that idea: **one** scenario per spec, stored in the
existing `Placeholder` model as a single `Map<String,String>`.

That gets us through PR 1 (Test tab UI) and PR 2 (real execution wire-up)
without touching the backend schema. It does not get us to where we want to
be:

- A prompt is rarely "good" against one input. It's good across a **set** of
  representative inputs — happy path, edge case, the one that used to break.
- Without named scenarios, the Test tab can't show a stable comparison
  surface ("did r34 still pass the edge-case input that r33 fixed?").
- The Diff tool currently can't say "scenario X is unchanged but scenario Y
  drifted" — it can only diff request shape.
- Repo history (the second source from Q5) is per-execution, so it
  inherits whatever placeholder snapshot was attached at run time. If those
  values aren't named, you can't group across commits.

## Scope

A scenario is **just a labeled placeholder map plus an optional notes string**.
Nothing more in v2. We are *not* shipping:

- expected-output assertions (that's eval, Pro tier)
- per-scenario tools/MCP overrides (revisit once we have telemetry on usage)
- scenario sharing across specs (would need a new top-level entity)

In scope:

- [ ] Backend: extend `Placeholders` to hold `scenarios: Scenario[]` alongside
      the existing `list[]` defaults. New shape proposed below.
- [ ] Backend: pick a default scenario per spec (`defaultScenarioId`) — used
      by the Detail page Run CTA and by `executeStoredPrompt` when no
      scenario is named in the call.
- [ ] Backend: `executeStoredPrompt` accepts an optional `scenarioId`; if
      omitted, falls back to `defaultScenarioId`, then to the legacy single
      map for back-compat.
- [ ] Web UI: Test tab gains a scenario picker above the placeholder
      column (rename column header from "Placeholder values" to "Scenario").
      Add / rename / duplicate / delete. Empty state matches today's UX
      (one auto-created `default` scenario).
- [ ] Web UI: run-history strip groups by scenario. The same revision can
      appear under multiple scenarios; that's the point.
- [ ] Web UI: Diff tool surfaces scenario adds/removes/renames as part of
      the Placeholders block.
- [ ] Migration: existing specs get a single `default` scenario auto-created
      from their `placeholder` map. Idempotent. No data loss.

Out of scope (file separately if needed):

- Bulk import of scenarios from a CSV / golden dataset
- Scenario-level access controls
- Per-scenario request overrides (e.g. different model per scenario)

## Proposed schema delta

```ts
// Existing (kept for back-compat through v2; deprecated in v3):
interface Placeholders {
  startPattern: string;        // "{{"
  endPattern: string;          // "}}"
  list: Placeholder[];         // name + defaultValue
  defaults: Record<string, string>;
}

// New:
interface Placeholders {
  startPattern: string;
  endPattern: string;
  list: Placeholder[];                   // unchanged — describes *what* a placeholder is
  scenarios: Scenario[];                 // NEW — describes *which values* to run with
  defaultScenarioId: string;             // NEW — id of the scenario used by Run/release
  // `defaults` retained, derived from scenarios[defaultScenarioId].values for back-compat
  defaults: Record<string, string>;
}

interface Scenario {
  id: string;          // stable id, kebab-case ('happy-path', 'edge-empty-chunks')
  name: string;        // human label
  values: Record<string, string>;   // same shape as today's `defaults`
  notes?: string;      // freeform — "what should this prove"
  createdAt: string;
  updatedAt: string;
}
```

`executions[]` already carries a `placeholders` snapshot per run; add an
optional `scenarioId` field so we can group history by scenario. Existing
runs without a `scenarioId` are bucketed under "untagged" in the UI.

## API surface

- `POST /prompts/{name}/scenarios` — create
- `PATCH /prompts/{name}/scenarios/{id}` — rename / edit values / notes
- `DELETE /prompts/{name}/scenarios/{id}` — block if it's the default;
  caller picks a new default first
- `POST /prompts/{name}/scenarios/{id}/run` — convenience wrapper around
  `executeStoredPrompt` that fills in placeholder values from the scenario

## UX deltas (sketches needed before PR opens)

1. **Test tab — scenario header.** Replaces the current static
   "PLACEHOLDER VALUES" column header with a small chip strip:
   `[default ✓] [edge-empty] [tone-formal] [+]`. Click to switch; long-press
   / right-click to rename / duplicate / delete.
2. **Run history strip — grouping.** Today: a flat row of run chips. v2:
   one row per scenario, label on the left, chips on the right. Empty
   scenarios show a `▶ Run once to seed history` ghost row.
3. **Diff tool — scenario rows.** Inside the Placeholders block, add a
   sub-block listing scenario ids. Renames render as `old → new`; value
   changes render as inline diff per placeholder.
4. **Detail page Run CTA.** Today it just says "Run". v2 splits into a
   primary `▶ Run default` + a secondary picker dropdown showing the
   other scenarios.

## Open questions for the dev team

- **Storage.** Keep scenarios on `Placeholders` (per spec) or break out as
  their own subresource? Per-spec is simpler; subresource opens the door to
  sharing later.
- **Naming.** "Scenario" vs. "Case" vs. "Fixture" — we've been saying
  scenario in the design docs. Lock it before the API ships.
- **Default selection.** When a user deletes the default scenario, do we
  auto-pick the most-recently-edited, or force them to choose? Lean toward
  forcing the choice — silent reassignment hides intent.

## Acceptance

- All v1 specs continue to work — the migration creates a `default`
  scenario from their existing map, and every existing call path resolves
  to that scenario.
- A user can create a second scenario, switch to it in the Test tab, run
  it, and see the run appear under the right group in the history strip.
- Diff between two revisions surfaces scenario adds / removes / renames /
  value changes.
- Release flow (#95) is unchanged from v1 — it still gates on "at least
  one Test run on the current request shape", with no requirement that
  every scenario has run. (We can tighten that later behind a setting.)

## Links

- Parent: #95 (Test/Run capability — v1 single-map)
- Related: HANDOVER.md §"What was just decided" (Q1, Q5 reframed scenarios
  as the unit of pre-release execution)
- Design context: `handoff/webui/src/prompt-form-test-tab.jsx` —
  the three-region layout this issue extends
