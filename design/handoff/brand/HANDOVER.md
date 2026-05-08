# promptLM Design Session — Handover

Pick this up in a new chat. Paste this whole file as the first message.

## Project layout

```
/                           ← project root, design canvas
  promptLM Brand & Site.html  main canvas — opens with all artboards
  prompt-form.jsx             ← Prompt editor (latest, with Test tab strip)
  prompt-form-test-tab.jsx    ← Test tab UI module (NEW, not yet wired in canvas)
  product.jsx, product-v2.jsx ← Catalog + Detail + Detail v1.1
  prompt-detail.jsx           ← Per-prompt detail with revision history
  prompt-diff.jsx             ← Diff tool (two pickers)
  product-report.jsx          ← Static published report
  ... (logos, design system, brand v1/v2, tokens, design-canvas)

/handoff/                   ← deliverable for Claude Code
  README.md                 ← package overview
  HANDOVER.md               ← (this file's older version, can ignore)
  shared/tokens.css         ← copy of root tokens.css
  webui/
    index.html              ← hash-routed mini-site (Catalog · Detail · Detail v1.1 · Form edit · Form new · Diff)
    README.md               ← contracts, integration notes
    src/                    ← copies of root JSX files
      prompt-form-test-tab.jsx ← NEW (registered in index.html, but file may need a clean reload to be picked up by sandbox)
  report/
    index.html              ← report-only mini-site
    README.md
  playbook/                 ← surface-by-surface design notes
  issue-comments/           ← markdown drafts for GitHub issue replies
```

## Where we are

Brand v1 (slate + electric cyan, Geist + JetBrains Mono) is the chosen direction. Brand v2 (Lab Notebook) was explored and parked.

Logo: **Mark C2 (Graph, refined)** with cyan signal — promoted everywhere.

Product UI exists for: Catalog, Detail (read-only), Detail v1.1 (usability pass), Diff (two pickers), Form (edit + create, two-column collapsible), Report (static, repo-wide overview).

## What was just decided (issue #95 — Test/Run capability)

Six questions resolved in this round:

1. **Q1 — Pre-release execution input**: Use **scenarios** (placeholders + expected behavior) as the unit. v1 ships with a single placeholder map per spec (matches existing backend `Map<String,String>`); v2 (issue #99 to be filed) introduces multiple named scenarios.
2. **Q2 — Release CTA**: Plain **Release** button in sticky header; pre-release check happens in a side rail panel that slides in from the right.
3. **Q3 — Placeholder data path**: v1 uses the existing backend `Placeholder` model (single map). The Test tab edits placeholder values inline; saving them is a separate explicit action (no auto-save). New placeholder values can be passed to Release without first saving.
4. **Q4 — Test tab anatomy**: **Three regions** — Placeholders (left, ~280px) · Preview/Run (center, flex) · Output (right, ~360px).
5. **Q5 — Run history**: Two sources, kept distinct.
   - **`executions[]`** on the spec — last N runs of the *current* request. **Resets on any change to `request` (model, params, messages, placeholders).** Drives the Test tab's bottom run-history strip.
   - **Repo history** — past commits' executions, fetched via separate backend endpoint (TBD by dev team). Drives a "View full history" flyover from the strip.
6. **Q6 — Slicing**: **Plan B — split into 2 PRs**.
   - **PR 1**: Test tab UI + Release flow (UI shell, mock backend, no real execution).
   - **PR 2**: Wire to real backend (executeStoredPrompt, executions write-back, repo history endpoint).

## What I just built (in progress)

- ✅ `prompt-form-test-tab.jsx` written (~840 lines): three-region Test tab with placeholder editor, preview, output panel, run-history strip, history flyover, request-changed banner.
- ✅ `prompt-form.jsx` patched: tab strip below sticky header (Editor / Test), Release button replaces "Save & release", release flow state machine (idle → saving → running → released | blocked-prompt | blocked-infra), toast with "View execution" action, gate logic (Release disabled until at least one Test run).
- ✅ Both copied to `handoff/webui/src/`.
- ✅ `handoff/webui/index.html` registers the new test-tab script.
- ✅ **Sandbox 404 resolved (next session).** Fresh chat reloaded cleanly: `window.PromptFormTestTab` is defined and the Test tab renders all three regions (Placeholders · Rendered prompt · Output) plus run controls and the history strip. No script-tag changes needed — the cache quirk did not survive a reload.
- ✅ **Issue #99 draft filed** at `handoff/issue-comments/99-multi-scenario-placeholders.md`. Covers schema delta (`scenarios[]` + `defaultScenarioId`), API surface, UX deltas across Test tab / history strip / Diff / Detail Run CTA, migration plan, and open questions for the dev team. Ready to paste into GitHub.

## Open follow-ups (from earlier rounds, still TBD)
- Repo-history endpoint contract (Q5 second source) — dev team to define.
- Detail page Run CTA stays inline (decided, shipped by dev as fcb82cf).

## How to proceed in the new chat

1. Paste this file.
2. Say: "Continue the promptLM design session. Verify the Test tab loads on `#/prompts/form` in `handoff/webui/index.html`. If it 404s, debug the script registration. Then file the v2 multi-scenario follow-up issue draft."
3. Or, if Test tab is loading: "File the issue #99 draft (multi-scenario placeholder support, supersedes v1 single-map model in #95)."

## Key design tokens

- `--pl-ink-900` (oklch 0.16 0.02 250) primary text
- `--pl-signal-deep` (cyan ~oklch 0.6 0.18 230) — accents, active states
- `--pl-paper`, `--pl-canvas` — surface, background
- Type: `var(--pl-display)` (Geist), `var(--pl-mono)` (JetBrains Mono)

## Decisions log (locked)

- Brand v1 is canonical. v2 parked.
- Logo: Mark C2 + cyan signal.
- Eval is Pro / future — not part of v1 health metrics.
- Report is corpus-only, no observability claims.
- promptLM captures execution time + tokens (in/out) during dev runs — these power the Test tab and Detail page.
- `executions[]` resets on request change.
- Past-commit executions come from a separate repo-history endpoint, not from `executions[]`.

— end —
