## Designer response

Going with **option 3 — missing from the prototype**. The playbook is correct; the prototype is behind. I'll close that gap.

### Layout decision: tab strip below the sticky header

```
┌─ sticky header: breadcrumb · v · status · Cancel / Save draft / Save & release ┐
├─ tab strip: [Editor]  [Test]  ─────────────────────────────────────────────────┤
│                                                                                │
│   (tab body — Editor or Test, full width)                                      │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Why tab strip over the other two candidates:**

- **Slide-in right panel** loses the placeholder/model rail exactly when you need it most — testing a prompt requires visible config to know *what* you're testing. Replacing the rail with output forces context-switching every time you tweak.
- **Inline pane below Messages** sounds appealing but the Messages region needs to grow with content (long system prompts, multi-turn conversation). Pinning a Test pane below it creates a vertical squeeze where neither region has enough room. Also: scrolling between message edits and run output is fatiguing during the edit-run-tweak loop.
- **Tab strip** preserves the entire screen for whichever job the user is doing, and the toggle is one click. The cost is "you can't see messages and output simultaneously" — but the rendered-prompt preview inside the Test tab solves that (see below).

### Test tab anatomy

Three regions sharing the form's current `request` config (no separate state — testing edits the same draft):

```
┌─ Run controls ─────────────────────────────────────────────────────────────────┐
│  Model: [gpt-4.1 ▼]   Snapshot: 2025-04-14   Tool mocks: [happy-path ▼ × 2]   │
│  [▶ Run]  [⟲ Re-run last]                         unsaved draft · auto-saves  │
├─ Placeholder values (left) ─┬─ Rendered prompt (center) ─┬─ Output (right) ───┤
│                             │                            │                     │
│  question  [text input]     │  system: …                 │  ▶ assistant        │
│  chunks    [text input]     │  user:   …                 │    Lorem ipsum …    │
│  tone      [select ▼]       │  (live, with {{vars}}      │                     │
│                             │   substituted)             │  tool calls (2)     │
│  [load fixture ▼]           │                            │    search_docs(…)   │
│  [save as fixture]          │                            │    → mocked         │
│                             │                            │                     │
│                             │                            │  142ms · 412 tok    │
└─────────────────────────────┴────────────────────────────┴─────────────────────┘
┌─ Run history strip (last 10) ──────────────────────────────────────────────────┐
│  [r34·5m ✓]  [r34·8m ✓]  [r34·12m ✗]  [r33·2h ✓]  …           [diff with…]   │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Resolutions to the playbook's open questions, baked into this layout:**

| Question | Resolution |
|---|---|
| Placeholder values | Left pane — manual fill, plus fixture load/save (fixtures live next to the spec file) |
| MCP scenario selection | Header dropdown defaults to `happy-path`; per-tool override available. Reuses existing `toolConfigs` from the spec. |
| Output rendering | Right pane: assistant message + tool-call trace + cost/latency footer. Streaming if the model supports it. |
| Save semantics | Test runs against current draft. If unsaved → auto-saves a draft (shown as "draft · saving…" → "draft · saved"). No coupling with Save & release. |
| Per-run history | Bottom strip; last 10 runs persisted to `runs/` next to the spec. Older runs accessed via the detail page's executions log. |
| Cost/latency | Per-run footer in the output pane; aggregated view stays on the detail page. |

### On auto-execute (the footnote)

Acknowledged and agreed — Test stays explicit. The auto-save on Run is **save the draft**, not execute on save. Save & release never triggers a run.

### Endpoint mapping (matches the playbook, no contract change)

- Test on unsaved draft → `executePrompt(body)` (the body is the in-memory draft; no spec id yet)
- Test on saved → `executeStoredPrompt(id)` (after auto-save fires; we have an id)
- Detail → Run → `executeStoredPrompt(id)` (same shape, different entry point)

### What I'll deliver

1. Update `prompt-form.jsx` — add the tab strip, stub Test tab with all three regions and run controls (mock data, no real API call).
2. Update `form.html` §API operations — keep the table, mark Test tab as ✅ specified (no longer "deferred").
3. Add a Test-tab note to `form.html` §Notes pointing at this issue + the artboard.
4. Update `HANDOVER.md` — move Test/Run from parking lot to "in design, see issue #N."
5. Open a sibling issue for the detail-page Run CTA (smaller — same `executeStoredPrompt`, single button + run sheet modal). I'd actually lean toward making that just open the form's Test tab in a new context, so we don't design two run UIs. Worth discussing.

ETA on the prototype update: same session as the answer landing.
