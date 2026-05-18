# User documentation

End-user docs for promptLM. AsciiDoc sources here are rendered into the
brand-styled HTML pages under `site/docs/` by
[`scripts/build-docs.mjs`](../scripts/build-docs.mjs). The output is part
of the static GitHub Pages site served from `site/`.

> **Status:** the rendering pipeline is in place but most pages have not
> been written yet. Only [`pages/index.adoc`](pages/index.adoc) — the
> landing placeholder — exists. Tracking issue:
> [#205](https://github.com/promptLM/promptlm-app/issues/205). Please
> claim a section there before authoring, so two people don't write the
> same page.

## Layout

```
docs/
├── nav.yml                       # sidebar nav structure
├── pages/
│   └── <group>/<slug>.adoc       # one .adoc file per page
├── styles/
│   └── docs.css                  # doc-specific CSS (copied to site/docs/)
└── templates/
    ├── page.html                 # brand chrome with {{title}} / {{body}} slots
    └── widgets/<name>.html       # partials referenced via widget::<name>[]
```

The brand tokens, fonts, nav, and buttons are reused from
[`site/styles.css`](../site/styles.css). Doc-specific styling lives in
`docs/styles/docs.css` and is copied next to the pages during build.

## Authoring a page

1. Add `docs/pages/<group>/<slug>.adoc`. The first line is `= Page Title`.
2. Declare these page attributes near the top:

   ```adoc
   :page-section: CORE
   :page-slug: my-page
   :page-prev-label: Previous
   :page-prev-href: previous.html
   :page-next-label: Next
   :page-next-href: next.html
   :page-description: One-sentence summary for <meta description>.
   ```

   `page-section` drives the breadcrumb; if omitted, the renderer infers
   it from `nav.yml`. `page-slug` is the output filename and must match
   the slug declared in `nav.yml` (see below).

3. Register the page in [`nav.yml`](nav.yml) by setting `slug:` on the
   matching item. Items without a slug render as non-link placeholders.

4. Run `npm run docs:build` from the repo root. The build:
    - parses each `.adoc` with [Asciidoctor.js](https://asciidoctor.org/),
    - expands `widget::<name>[]` block macros from `templates/widgets/`,
    - annotates listing blocks with `data-lang` for the CSS language strip,
    - builds the sidebar from `nav.yml` (active item via `aria-current`),
    - builds the "on this page" rail from the H2 IDs Asciidoctor emits,
    - writes `site/docs/<slug>.html`.

## Custom AsciiDoc constructs

- `[NOTE]`/`====` admonition → styled note card with the signal-deep left
  border (see `.admonitionblock.note` in `docs.css`).
- `[source,bash|typescript|...]` listings → dark code block with the
  language tag on top. Use the language id you'd expect in Markdown.
- `widget::mcp-inspector[]` → inserts the partial at
  `templates/widgets/mcp-inspector.html`. Add new widgets by dropping
  files in that directory and referencing them with the same macro.

## CI and deployment

Documentation is rebuilt and deployed automatically:

- **PRs** that touch `docs/**`, `site/**`, `scripts/build-docs.mjs`, or the
  npm manifests run `npm run docs:build` as a check
  ([.github/workflows/deploy-site.yml](../.github/workflows/deploy-site.yml)).
  A broken AsciiDoc source fails the PR before merge.
- **Pushes to `main`** that touch the same paths rebuild the docs from
  source and deploy the contents of `site/` to GitHub Pages.

`site/docs/` is gitignored — it's a build artifact. Run
`npm run docs:build` locally to populate it for preview; CI rebuilds it
on every deploy regardless of what's on disk.

## Why AsciiDoc, why this script

AsciiDoc was the explicit ask. Antora would be the heavyweight option
matching Spring's docs conventions, but the doc set is currently one
page and the static site is plain HTML in `site/` — a small Node
renderer over Asciidoctor.js fits the existing shape. If the doc set
grows past ~20 pages or starts spanning multiple components, migrating
to Antora is a clean cutover: the page sources here would move into
`docs/modules/ROOT/pages/` with minimal rewriting.
