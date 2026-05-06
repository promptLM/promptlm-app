# promptLM · report handoff

The static report regenerated on every push to `main`. It's a single-page
deliverable that lives at e.g. `https://acme.github.io/agents/` — readable
without auth, derived purely from spec files in the repo + git log.

## Routes (within the static page)

```
#/                       Repo overview — activity, timeline, latest spec diff,
                         authors, by-group catalog, models, placeholder index
#/prompts/detail         Per-prompt detail with revision history
#/diff                   Interactive diff between any two revisions
```

The overview is the entry point; the detail and diff pages are linked from it
(or directly bookmarkable).

## Files

```
report/
├── index.html              ← shell + hash router + script load order
├── shared/tokens.css       ← shared with webui
└── src/
    ├── report.jsx          ← ProductReport — the main overview (§01–§07)
    ├── prompt-detail.jsx   ← per-prompt page (same component as the webui uses)
    └── prompt-diff.jsx     ← interactive diff (same component as the webui uses)
```

`prompt-detail.jsx` and `prompt-diff.jsx` are **literal copies** of the webui
files. When integrating, share them — don't fork.

## How it's generated

The CLI command `promptlm report` is expected to:

1. Walk `prompts/**.toml`
2. Read `git log` for those paths
3. Aggregate `executions[]` (captured during dev runs / CI; see top-level README)
4. Emit a single self-contained HTML file (inlined CSS + JSX + data)

For the implementation, the JSX files in this folder are the rendering layer.
The CLI's job is producing the data; the rendering is solved.

The fixture data in each JSX file is what your generator output should look
like. The data shapes are documented in `../README.md`.

## Stubbed / unimplemented fields

The report is conservative — it only renders fields that come from spec files
or git. **No production observability is shown**, by design.

The one weak spot is `executions[]`: the §02 timeline and per-prompt
detail-page metrics depend on dev-execution capture being wired. If it isn't
yet:

- §02 Timeline still works — it's git-based, not execution-based
- §03 Spec diff still works — it's spec-based
- The per-prompt detail page will show empty execution metrics — either hide
  the §01 Dev metrics card or show "0 runs · capture not enabled"

## Hosting

Designed for GitHub Pages but works anywhere static. The page is intentionally
free of network calls beyond the React/Babel CDN scripts — once you bundle for
production (Vite single-HTML build, or rollup), there are no beacons.

## What to remove before shipping

1. The `.route-bar` in `index.html` — designer aid only.
2. Babel-standalone in production. Pre-compile the JSX with Vite/esbuild so
   the report loads instantly without the 2MB Babel transform.
3. Sample/fixture data — generator should inject real JSON.
