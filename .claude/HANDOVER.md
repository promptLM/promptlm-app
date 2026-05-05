# Chat handover — promptLM v2 UI rework

**Repo:** `/Users/fk/dev/promptLM/promptlm-app`
**Active branch:** `feat/new-ui-design` (8 commits ahead of `main` — see `git log main..HEAD --oneline` for the list)
**Active PR:** [#94 — feat(ui,webui): v2 prompt form layout + diff route stub + legacy cleanup](https://github.com/promptLM/promptlm-app/pull/94)
**Auto mode:** on (act, don't over-plan)
**Last refresh:** after the designer's playbook drop on `2026-05-05 21:29` (which followed the prototype drop at `17:28`)

If anything contradicts the repo, trust the repo and update this file.

---

## 1. Branch state

`HEAD` is `ded4ceb`. Build/test state on `HEAD`:

- `@promptlm/ui`: `npm --workspace @promptlm/ui run build` clean; `npm --workspace @promptlm/ui test` smoke green
- `@promptlm/web-ui`: `npm --workspace @promptlm/web-ui run build` clean; `npm --workspace @promptlm/web-ui test` 61/61 green
- Acceptance tests (`acceptance-tests/`) — Playwright happy-path **not yet re-run** against the new shell; flagged in PR #94's test plan as the only outstanding check.

---

## 2. ⭐ The designer's two drops on 2026-05-05 (read first)

### 2A. The 17:28 drop — Test tab + tab strip in the JSX prototype

| Path | Status | Notes |
|---|---|---|
| `webui/src/prompt-form.jsx` | modified | Tab strip (Editor / Test) + 6-state inline Release CTA *(superseded by 2B's side rail)* |
| `webui/src/prompt-form-test-tab.jsx` | **NEW** | Three-region Test tab — placeholder values / rendered prompt preview / output — with run controls bar, run history strip, history flyover. Mounted via `window.PromptFormTestTab`. |
| `webui/index.html` | modified | Loads `prompt-form-test-tab.jsx` before `prompt-form.jsx` |

JSX has mock affordances that **must NOT ship as-is** — search the JSX for `DEMO:` and `SAMPLE_` to find them all.

### 2B. The 21:29 drop — playbook docs (Release becomes a side rail)

| Path | Status | What changed |
|---|---|---|
| `playbook/surfaces/test-tab.html` | **NEW** | Region anatomy (Q4 lock), Q3+Q5 locks, API ops, schema bindings, PR 1 / PR 2 slicing |
| `playbook/surfaces/release-flow.html` | **NEW** | ⭐ Release as a **side rail panel from the right** (~420px, semi-modal), state machine, **4 gates**, two release modes via `X-PromptLM-Release-State` header |
| `playbook/surfaces/form.html` | modified | "Save & release" → "Release" + cross-links to test-tab.html / release-flow.html |
| `playbook/index.html` | modified | Surface grid now lists Test tab + Release flow |
| `playbook/api.html` | modified | Added `releasePrompt` + `completeReleasePrompt` rows + §"Release modes" callout |
| `issue-comments/99-multi-scenario-placeholders.md` | **NEW** | Designer's full body for #99 (more accurate than the GitHub issue I filed) |

**The Release CTA in the JSX is now legacy** (inline 6-state animated button). The playbook says Release should open a **side rail panel from the right**; the button only triggers the rail. When implementing #98, build the side rail per `release-flow.html`.

#### Q3 + Q5 locks (Test tab — read these before implementing)

**Q3 — placeholder edits don't auto-save.** Placeholder *value* edits live in component state until the user clicks "Save placeholders". The Test tab can **Run** with unsaved values — they flow into the request without being persisted. Each run snapshot still records the values used.

**Q5 — `executions[]` resets on request-shape change.**

| Field changed | Resets `executions[]`? |
|---|---|
| `request.vendor`, `request.model`, `request.modelSnapshot` | ✓ resets |
| `request.parameters.*` | ✓ resets |
| `request.messages[i].content` / `.role` | ✓ resets |
| `placeholders.list[]` shape (rename / add / remove) | ✓ resets |
| `placeholders.startPattern` / `endPattern` | ✓ resets |
| **`placeholders.list[i].defaultValue`** (value edits) | ✗ does **not** reset |
| `name`, `group`, `description`, eval, MCP tools, repository url | ✗ does not reset |

Implementation needs a **request-shape hash** that excludes placeholder values but includes list shape.

#### Release flow — side rail (the 21:29 reframe)

Clicking the sticky-header `Release` button opens a panel that slides in from the right, ~420px, semi-modal. Sections: Header / Pre-release checks / Diff summary / Last test run mini-card / Action / Error block.

**4 gates (all must pass):**

| Gate | Source | Tooltip when blocked |
|---|---|---|
| Form validates clean | `validateDraft(draft).errors.length === 0` | `"Fix N error(s) before releasing"` |
| At least one Test run on current request shape | `executions[]` non-empty after most recent request edit | `"Run at least once in the Test tab before releasing"` |
| Latest test run succeeded | `executions[0].status === 'ok'` | `"Last test run failed — re-run before releasing"` |
| No unsaved placeholder edits *that affect schema* | placeholder list shape unchanged since last save (renames / adds / removes block; **value** edits OK) | `"Save placeholder schema changes first"` |

**State machine:** `idle → saving → running → released | blocked-prompt | blocked-infra`. `released` collapses the rail and shows a bottom-center toast `"Released vX.Y.Z"` (sticky 6s) with `"View execution"` action → opens last execution in Test tab Output. Blocked states keep the rail open with an error block; **no toast on failure**.

**Release modes via `X-PromptLM-Release-State` header** (existing #32/#38/#40 SPI):
- `released` — direct mode. Toast says "Released vX.Y.Z". Flow ends.
- `requested` — PR mode. Toast says "Release pending PR merge". Form re-arms a "Finalize release" affordance that calls `completeReleasePrompt(id, pr)`.

#### PR slicing convention from the designer

#98 splits explicitly into:
- **PR 1** — UI shell + side rail + state machine + gate logic + toast. Mocked save/release that always succeeds. Flag in JSX to exercise blocked states. Gated by `featureFlags.releaseFlow` (default off).
- **PR 2** — Real API wiring (`updatePromptSpec` + `releasePrompt` + `completeReleasePrompt`), real `executions[]` filtered by request-shape hash, wires #100's `getRepoHistory(name)` into the History flyover, defaults the flag to ON.

This decouples the frontend from #96's backend timing.

#### Designer's #99 body (in repo, not on GitHub yet)

Designer left a fully-written issue body at `design/handoff/issue-comments/99-multi-scenario-placeholders.md`. **Differs from what I filed on GitHub** — schema is scoped on `Placeholders` (not directly on `PromptSpec`), API surface is per-scenario subresource (`POST /prompts/{name}/scenarios`, etc.), and concrete UX deltas are spelled out. The new chat **already pasted the designer's exact body into [#99](https://github.com/promptLM/promptlm-app/issues/99)** (`gh issue edit 99 --body "$(cat …)"`). Verify by `gh issue view 99 --json body`.

Naming question (open): "scenario" vs. "case" vs. "fixture" — locked to **scenario** unless team objects.

---

## 3. What's working in the browser today

Use the preview tool (`mcp__Claude_Preview__preview_start`) with names from `.claude/launch.json`:

| Name | Port | Serves |
|---|---|---|
| `webui` | 5174 | the production webapp (Vite dev) — primary surface |
| `report-static` | 5180 | the static report build |
| `handoff-webui` | 5181 | `design/handoff/webui/` — designer prototype (HTTP-served, **don't open via file://**) |
| `handoff-playbook` | 5182 | `design/handoff/` (so you can reach `/playbook/`, `/webui/`, `/report/` side-by-side) |

Working webapp routes:
- `/prompts` — catalog (V2)
- `/prompts/:id` — detail (V2 + Run CTA + toast → execution scroll/highlight)
- `/prompts/:id/edit`, `/prompts/new` — `PromptFormShell` mounting `PromptFormPage` (V2 layout)
- `/prompts/:id/diff` — Stage 1 stub, gated by `featureFlags.promptDiff`

**Not yet in the build** (all spec'd by the prototype + playbook):
- Tab strip (Editor / Test)
- Test tab (three regions, run controls, run history)
- Release CTA + side rail + 6 flow states + 4 gates
- Pre-release execution badge on detail page
- Live `executions[]` filter by request-shape hash (Q5 lock)
- Real revision history / diff data (#76 → #78 Stage 2)
- Real execution metrics (#77 schema fields)

---

## 4. What's blocking forward progress

| Blocker | What lifts it | Tracked at |
|---|---|---|
| **Backend pre-release-execute strategy** | atomic execute → release in #32/#38 SPI | [#96](https://github.com/promptLM/promptlm-app/issues/96) |
| **Backend Execution fields** — catalog/detail metrics show stubs | latency / tokens / ok / error on the schema | [#77](https://github.com/promptLM/promptlm-app/issues/77) |
| **Backend revision history** — #78 Stage 2 blocked | `GET /api/prompts/{id}/revisions` | [#76](https://github.com/promptLM/promptlm-app/issues/76) |
| **Backend run-history API** — Test tab's history flyover stubbed | `getRepoHistory(name)` per the playbook (designer's name; my #100 used `/runs?…` — **rename to align**) | [#100](https://github.com/promptLM/promptlm-app/issues/100) |
| **v2 scenarios** — multi-input release gate is a deferred upgrade | epic | [#99](https://github.com/promptLM/promptlm-app/issues/99) |
| **Playbook docs lag the prototype** for `pre-release-execute` strategy | designer to expand `release-flow.html` (or just rely on #96's spec) | n/a — issue exists |

**Designer prototype is unblocked.** Frontend can proceed against the JSX + playbook as the source of truth.

---

## 5. Issue map (v1 critical path)

| # | Title | Status |
|---|---|---|
| [#76](https://github.com/promptLM/promptlm-app/issues/76) | Backend: revision history endpoint | open — blocks #78 Stage 2 |
| [#77](https://github.com/promptLM/promptlm-app/issues/77) | Backend: extend Execution model fields | open — unblocks real metrics |
| [#78](https://github.com/promptLM/promptlm-app/issues/78) | Webui: spec-level prompt diff view | Stage 1 (#91) shipped; Stage 2 waits on #76 |
| [#91](https://github.com/promptLM/promptlm-app/issues/91) | Webui: scaffold /prompts/:id/diff route with stub revisions | shipped (`bbaf603`) |
| [#95](https://github.com/promptLM/promptlm-app/issues/95) | Design: form execute affordance | designer dropped prototype + playbook 2026-05-05 |
| [#96](https://github.com/promptLM/promptlm-app/issues/96) | Backend: pre-release-execute strategy | open — paired with #98 PR 2 |
| [#98](https://github.com/promptLM/promptlm-app/issues/98) | Webui: Release flow (side rail) + tab strip + Test tab | open — split PR 1 (UI) + PR 2 (wiring) |
| [#100](https://github.com/promptLM/promptlm-app/issues/100) | Backend: repo-history API for Test tab | open — paired with #98 PR 2 |

**Closed/superseded:** #88 #89 #90 #92 #93 (all closed by PR #94's commits); #97 (kept open as marker until #99 schedules).

**Deferred to v2 / future:** #79 (mode switch), #80 (eval suite), #81 (CLI report), #99 (scenarios), #62/#63/#64/#65 (subsumed by #99). Run `gh issue list --state open` for the live list.

---

## 6. Architecture decisions (one-liners — full rationale on #95)

- **Detail Run vs. Form Test are different verbs.** Detail Run = post-release ("does it still work?"); Form Test = author iterating. Same backend (`executeStoredPrompt`, `executions[]`); different UI weights. Don't unify.
- **Release auto-runs.** A `PromptSpec` with empty `executions[]` is unacceptable to release. Strategy `pre-release-execute` (#96) wraps any promotion strategy with a pre-execution step, atomic, server-side.
- **Save and Test never auto-run.** Save autosave runs on every keystroke-debounce; Test is explicit. The auto-execute argument applies only to release.
- **Scenarios deferred to v2 (#99).** v1 ships against the existing single-input model (one `placeholder: Map<String,String>`). v2 introduces `scenarios[]` with `default: boolean`. v1 → v2 is monotonic.
- **Placeholder schema gap.** Today's schema only has `placeholder.list[].{name, value}`. The form prototype's `type/required/description` are UI-only — `PromptFormShell` translates them in but **drops them on save**. Acceptable per playbook §Notes ("ship lean").
- **MCP tool configs are client-side-only.** Form rail surfaces them, but the schema has no first-class field. They live as `extensions['x-promptlm.tools']` per playbook; `PromptFormShell` doesn't yet round-trip them.
- **Eval surface gated.** `featureFlags.evals` off in production. `RailEvals` renders disabled with a "Pro · soon" badge until #80 ships.

---

## 7. Design contract file map (read in order)

| Path | What it documents |
|---|---|
| `design/handoff/README.md` | Top-level deliverable; v1 vs deferred |
| `design/handoff/playbook/index.html` | Surface index — open in `handoff-playbook` server |
| `design/handoff/playbook/api.html` | Operations × surfaces, including `releasePrompt` / `completeReleasePrompt` and `X-PromptLM-Release-State` |
| `design/handoff/playbook/schema.html` | `PromptSpec` schema reference |
| `design/handoff/playbook/surfaces/{catalog,detail,form,test-tab,release-flow,diff,report}.html` | Per-surface spec |
| `design/handoff/webui/src/prompt-form.jsx` | ⭐ Form prototype — **visual contract for everything except Release CTA** (which is a side rail per `release-flow.html`) |
| `design/handoff/webui/src/prompt-form-test-tab.jsx` | ⭐ Test tab implementation reference |
| `design/handoff/webui/src/prompt-form-v1.jsx` | Backup, useful for diffing |
| `design/handoff/webui/src/{catalog-and-detail,detail-v2,prompt-detail,prompt-diff}.jsx` | Other surface prototypes |
| `design/handoff/issue-comments/99-multi-scenario-placeholders.md` | Designer's #99 body |
| `design/handoff/api-client/promptlm-api-client/` | Imported `@promptlm/api-client` source for cross-reference |

When the designer pushes another update, **read the JSX first**, then the surface HTML, then the playbook overview/api pages.

---

## 8. Code map (where the work lives)

### V2 UI library — `components/ui/src/prompts-v2/`

Sub-dirs: `atoms/`, `catalog/`, `detail/` (incl. `ExecutionsTable` with `executionRowDomId` + `highlightedId`), `diff/`, `editor/` (only `EditorTopBar`), **`form/` ⭐** (the v2 prompt form — atoms, Collapsible, sections, PromptFormPage, validation, types — does **not** yet have tab strip / Test tab / Release-flow blocks; that's #98), `forms/` (earlier atoms, kept for non-form surfaces), `report/`, `shell/`.

Tokens at `prompts-v2/tokens.css`, loaded globally by `web-ui main.tsx`.

### Webapp — `components/promptlm-web-ui/src/`

| Path | Purpose |
|---|---|
| `App.tsx` | Routes; `MuiThemeBridge` (lightTech, light-mode pinned) and Toasters |
| `main.tsx` | Imports `@promptlm/ui/prompts-v2/tokens.css` |
| `lib/featureFlags.ts` | `evals`, `mcpBindings`, `revisionHistory`, `promptDiff`, `executionMetrics`, `testRunner` — Vite env opt-in |
| `pages/PromptDetail.tsx` | V2 detail + Run CTA + toast → execution scroll/highlight |
| `pages/PromptDiff.tsx` | Stage 1 diff route (flag-gated) |
| `pages/{NewPrompt,PromptEdit}.tsx` | Mount `PromptFormShell` |
| `features/prompt-editor/PromptFormShell.tsx` | ⭐ Bridge from existing draft state to `PromptFormPage`. Translates `PromptDraftInput` ↔ `PromptFormDraft`. Wires save / save&release / cancel. **Does not yet wire the Release CTA flow states or Test tab — that's #98.** |
| `features/prompt-editor/{draftState,editorActions,validation,placeholderInsertion,types,usePromptEditorData}.ts` | Existing reducer + actions |
| `api-common/viewModels/promptsV2.ts` | `PromptSpec` → catalog/detail prop shapes (has `until #77 lands` stubs marking what to unstub) |
| `api-common/viewModels/promptDiff.ts` | Stub revisions corpus for #91 Stage 1 |

### Backend (Java)

| Path | Purpose |
|---|---|
| `components/promptlm-domain/` | Domain types (`PromptSpec`, `Execution`, etc.) |
| `components/promptlm-web-api/` | REST controllers; release SPI lives here |
| `components/promptlm-api-client/` | Generated TypeScript client (`src/generated/`); regenerate via the openapi step |
| `components/promptlm-execution{,-litellm,-springai}/` | Execute backends |
| `components/promptlm-lifecycle/` | Release orchestrator + strategy SPI from #32/#38 (where `pre-release-execute` slots in for #96) |

---

## 9. Repo conventions (the bare minimum)

- **License headers** — every TS/TSX/Java file. Pre-commit hook enforces. Copy from any existing file.
- **Commit format** — Conventional Commits (`feat(scope): …`). Scopes on this branch: `ui`, `webui`, `ui,webui`. End each commit body with `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- **Build** — `npm --workspace @promptlm/ui run build` then `npm --workspace @promptlm/web-ui run build`. UI emits `dist/`.
- **Test** — `npm --workspace @promptlm/ui test` (smoke) + `npm --workspace @promptlm/web-ui test --silent` (Vitest, 61 tests).
- **Acceptance test data-testids must survive refactors** — they live in `acceptance-tests/src/test/java/dev/promptlm/test/HappyPathUserJourneyTest.java`. Verify with `grep -rn "data-testid" components/promptlm-web-ui/src` after any form change.
- **Legacy `prompt-editor/types.ts`** — keep. Removing means rewriting the webapp's draft reducer (out of scope for the v2 layout swap).

---

## 10. Caveats / gotchas

1. **Prototype JSX ≠ current build, by design.** The Test tab, tab strip, and Release-flow side rail aren't ported into the build yet (#98). Use the prototype as visual contract.
2. **Release CTA in the JSX is legacy** — the playbook's `release-flow.html` overrides it with a side rail.
3. **`executeStoredPrompt` returns the full updated `PromptSpec`** including the freshly appended execution at `executions[0]`. Detail page Run CTA depends on this.
4. **Light mode pin** — `App.tsx` pins `next-themes` to `"light"`. Dark-mode tokens were not in the design handoff.
5. **MUI is still in the tree** for non-form surfaces (PlaceholderManager, project modals). `MuiThemeBridge` (lightTech) stays mounted until those migrate.
6. **Dependabot alerts on push** — 28 vulnerabilities (1 critical, 11 high). Unrelated to this work; surface separately.
7. **Playbook's `api.html` doesn't yet list `getRepoHistory`** — the run-history endpoint for Test tab. #100 uses my placeholder name `/runs?…`; **rename to match the designer's `getRepoHistory(name)` before backend implementation starts**.
8. **Strip the prototype's `DEMO:` and `SAMPLE_*` affordances** when porting (search the JSX). The prototype's "demo: simulate request change" toggle, hardcoded `hasTestRuns`, hardcoded Test tab badge `'3'`, "copy as fixture" stub, and resolved-value highlighting skip are all prototype-only.
9. **Center column drag-resize range** is 220–640px (default 360); collapse button reduces to a 36px vertical strip.

---

## 11. Recommended first action

There are two reasonable starting points:

### Option A — start backend #77 (safer, 1–2h)

- Smallest scope, no design dep, no #76 dep
- Immediate value — catalog sparklines and detail metrics stop showing em-dash placeholders
- View-model `api-common/viewModels/promptsV2.ts` has `until #77 lands` comments marking exactly what to unstub
- Files: `components/promptlm-domain/.../Execution.java`, OpenAPI schema, regen `@promptlm/api-client`, unstub the view-model

### Option B — start #98 PR 1 (now unblocked by the prototype + playbook)

The playbook's `release-flow.html` says #98 splits into PR 1 (UI shell + flag-gated mocks) and PR 2 (real wiring after #96 + #100).

**PR 1 deliverables** (lands first, gated by new `featureFlags.releaseFlow`):
- Tab strip (Editor / Test) — port from `prompt-form.jsx::TabStrip` lines 719–763
- `ReleaseRail` ~420px slide-in with sections per `release-flow.html` §"Side rail anatomy"; 6-state machine; **all 4 gates**; toast on success / error in rail on failure
- Test tab — port from `prompt-form-test-tab.jsx`. New blocks under `prompts-v2/form/test/`: `RunControlsBar`, `PlaceholderValuesRegion`, `RenderedPromptRegion` (with `substitute` + `renderWithHighlights` helpers), `OutputRegion`, `RunHistoryStrip`, `HistoryFlyover`. Center-column collapse + drag-resize.
- **Request-shape hash** helper for the Q5 lock — see §2B's table for which fields participate
- Pre-release execution badge on `PromptDetailHeader` — reuse `executionRowDomId` + `highlightedId` from `ded4ceb`
- Storybook coverage for tab strip both states / side rail in each of 6 release states / Test tab variants
- **Strip** the prototype's `DEMO:` + hardcoded mock affordances

**PR 2** (after #96 + #100 + #77): real `releasePrompt` + `completeReleasePrompt` wiring; real `executions[]`; real `getRepoHistory(name)` in flyover; toast "View execution" routes to Test tab Output; default flag ON.

### My recommendation

**Do A first** (1–2h, immediate user value, no design entanglement), **then start #98 PR 1 in parallel with #96**. The PR 1 / PR 2 split decouples frontend from backend timing.

Hold #98 PR 2 until #96 is in flight — there are subtle release-flow state transitions (infra-failure soft-block, "release anyway with recorded reason", PR-two-phase `completeReleasePrompt`) where mismatched assumptions waste time.

---

## 12. First-run for the new chat

```bash
cd /Users/fk/dev/promptLM/promptlm-app
git checkout feat/new-ui-design
git pull
git log main..HEAD --oneline                              # confirm 8 commits ahead
npm install                                                # if first time
npm --workspace @promptlm/ui run build
npm --workspace @promptlm/ui test                          # smoke
npm --workspace @promptlm/web-ui test --silent             # 61/61
```

For the designer prototype: start `handoff-webui` (port 5181) and `handoff-playbook` (port 5182).

In the prototype, click into Form (new) and Form (edit) → Test tab to see the design as it lands.

---

## 13. Files this session that may be untracked

(`git status` to confirm.)

- `.claude/launch.json` — added `handoff-webui` (5181) and `handoff-playbook` (5182). Useful for the team — consider committing.
- `.claude/HANDOVER.md` — this file. Per-user by default; can move to `design/handover/` if shared.

---

## 14. tldr (3 sentences)

> Branch `feat/new-ui-design` is 8 commits ahead, PR #94 open. V2 prompt form layout + diff route stub + detail Run CTA are shipped; **the designer's playbook drop on 2026-05-05 21:29** spec'd Release as a **side rail panel** (superseding the inline button in `prompt-form.jsx`), introduced **4 release gates** (validates / test-on-current-shape / latest-test-ok / no-unsaved-placeholder-schema), formalized the **Q3 + Q5 locks** for the Test tab, and split #98 into **PR 1 (UI shell, mocked)** + **PR 2 (real wiring)** — read §2B before implementing. Recommended next action: **start backend #77** (Execution model fields — smallest, independent, unblocks real metrics today); then **#98 PR 1** in parallel with backend **#96** (PR 1 lands behind `featureFlags.releaseFlow`, PR 2 turns it on once #96 + #100 are merged).
