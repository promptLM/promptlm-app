# promptLM · webui handoff

The end-user web application: catalog, prompt detail, edit/usability pass, and the diff tool.

## Routes

```
#/prompts            Catalog — facets, search, sortable list
#/prompts/detail     Detail — spec view + revision history + recent dev executions
#/prompts/edit       Detail v1.1 — same data, edit-oriented affordances (sticky header,
                     compact metrics, inline messages diff)
#/prompts/form       Form (edit) — full editor for an existing prompt
#/prompts/new        Form (create) — same form, empty draft, "Create prompt" CTA
#/diff               Diff — interactive pickers, spec-level field diff
```

## Files

```
webui/
├── index.html              ← shell + hash router + script load order
├── shared/tokens.css       ← color, type, spacing tokens
└── src/
    ├── catalog-and-detail.jsx   ← PromptCatalog + first-pass PromptDetail (loaded first;
    │                              defines Mono, AppChrome, StatusDot, Tag, VendorMark,
    │                              Sparkline, MiniLogo — used by every other file)
    ├── detail-v2.jsx              ← PromptDetailV2 — usability pass; replaces the v1 detail
    │                                in production. Keep v1 only if useful as a reference.
    ├── prompt-detail.jsx          ← PromptDetailPage — fuller detail with revision history
    │                                and dev-execution metrics
    ├── prompt-diff.jsx            ← PromptDiffPage — interactive diff view
    └── prompt-form.jsx            ← PromptFormPage — create/edit form. 6 sections
                                     (Metadata, Model, Placeholders, Messages,
                                     MCP tool mocks, Evaluation plan). Validation
                                     rules mirror validation.ts in the repo.
                                     `mode` prop: 'create' or 'edit'.
```

## Sample data

Each JSX file contains its own sample data near the top — `SAMPLE_PROMPTS`,
`SAMPLE_PROMPT`, and `CORPUS` respectively. To wire to the real backend:

1. Replace each constant with a fetch from your API, keeping the SAME shape.
2. Hoist the data into a single `useSpecs()` hook that all three pages share.
3. The diff page's `CORPUS` needs revision snapshots — fetch from
   `/api/prompts/:name/revisions` or compute client-side from a stream of
   spec changes.

## Stubbed / unimplemented fields

| Field | Files | What to do |
|---|---|---|
| `metrics.runs / latency_p50_ms / p95 / tokens_in_avg / tokens_out_avg` | `prompt-detail.jsx` | Aggregate from `executions[]` once capture is wired |
| `executions[]` | `prompt-detail.jsx`, catalog row sparklines | Empty array is fine; UI degrades gracefully |
| `evalScore` column in `ExecutionTable` (catalog detail v1) | `catalog-and-detail.jsx` | **Strip the column** until evals ship — it's the only field that lies |
| `successRate` on `SAMPLE_PROMPTS[].metrics` | `catalog-and-detail.jsx` | Compute from `executions[].ok` ratio when capture lands; until then either hide or default to 1.0 with a clear "no data" tooltip |

## Component reuse map

The two detail variants (`PromptDetail` from catalog-and-detail.jsx vs.
`PromptDetailV2` from detail-v2.jsx vs. `PromptDetailPage` from prompt-detail.jsx)
exist because the design iterated. **Recommended:** ship `PromptDetailPage`
(prompt-detail.jsx) — it has the cleanest information architecture, includes
revision history, and matches the report's visual language. Discard the
other two or treat them as references.

## What to remove before merging into the real app

1. The `.route-bar` in `index.html` — that's a designer-only nav.
2. Sample data constants — replace with API calls.
3. `Mono` re-defined in multiple files — define once and import.
4. The diff page's `CORPUS` — load from API instead.
