# BS-2 — Brand package divergence audit

Status: pre-implementation working note. **No code changes recommended yet** —
this document feeds BS-3..BS-8.

Sources read (all paths absolute from repo root):
- `design/handoff/brand/tokens.css`
- `design/handoff/brand/HANDOVER.md`
- `design/handoff/brand/promptLM Brand & Site.html`
- `design/handoff/brand/logos.jsx`
- `design/handoff/brand/design-system.jsx`
- `design/handoff/brand/site.jsx`
- `design/handoff/shared/tokens.css`
- `design/handoff/README.md`
- `components/ui/src/prompts-v2/tokens.css`
- `components/ui/src/theme/variants.ts`
- `components/ui/src/prompts-v2/atoms/MiniLogo.tsx`
- `components/ui/src/prompts-v2/shell/AppSidebar.tsx`
- `components/ui/src/prompts-v2/shell/AppShellV2.tsx`
- `components/ui/.storybook/{main.ts, preview.tsx, preview-head.html}`
- `components/promptlm-web-ui/.storybook/preview.tsx`
- `components/promptlm-web-ui/index.html`
- `components/promptlm-web-ui/public/{favicon-32.png, favicon-192.png, favicon-512.png, apple-touch-icon.png}`
- `components/promptlm-web-ui/src/main.tsx`
- `components/promptlm-web-ui/src/components/layout/AppShellLayout.tsx`
- `apps/promptlm-webapp/src/main/resources/static/index.html`
- `site/index.html`, `site/styles.css`, `site/script.js`, `site/media/*`
- GitHub issue #111 (umbrella) and #98 (editor track) bodies

---

## 1. Source of truth

| Surface | Live file (today) | Brand drop file (new) |
|---|---|---|
| Webui CSS tokens | `components/ui/src/prompts-v2/tokens.css` | `design/handoff/brand/tokens.css` |
| Webui MUI theme | `components/ui/src/theme/variants.ts` (`lightTech`, `darkAurora`) | none — brand drop is unaware of MUI/MUI variants |
| Sidebar / app chrome | `components/ui/src/prompts-v2/shell/{AppShellV2,AppSidebar}.tsx`, `atoms/MiniLogo.tsx` | brand mark: `design/handoff/brand/logos.jsx` (`MarkGraph`, `MarkBracket`, `MarkToken`, `Wordmark`); design-system surface: `design-system.jsx` |
| Webapp HTML shell | `components/promptlm-web-ui/index.html` (Vite root) and the unrelated `apps/promptlm-webapp/src/main/resources/static/index.html` placeholder | none directly — title/copy lives implicitly in `design-system.jsx` and `site.jsx` |
| Favicons | `components/promptlm-web-ui/public/favicon-{32,192,512}.png`, `apple-touch-icon.png` | not in drop; need to be regenerated from `MarkGraph` SVG |
| Marketing site | `site/index.html`, `site/styles.css`, `site/script.js`, `site/media/{logo.png,logo-s.png,logo-horizontal.png}` | `design/handoff/brand/site.jsx` (810 LoC React landing/pricing/docs canvas) |
| Storybook chrome | `components/ui/.storybook/{main.ts, preview.tsx, preview-head.html}`, `components/promptlm-web-ui/.storybook/preview.tsx` | none directly — ride along with token/favicon changes |

**Net-new in the brand drop** (no live equivalent in the codebase to compare against):
- `design-system.jsx`, `logos.jsx`, `logo-studio.jsx`, `tweaks-panel.jsx`,
  `site.jsx`, `dashboard.jsx`, `prompt-detail.jsx`, `prompt-diff.jsx`,
  `prompt-form.jsx`, `product.jsx`, `product-v2.jsx`, `product-report.jsx`,
  `design-canvas.jsx`, `promptLM Brand & Site.html`, `HANDOVER.md`.
- The `MarkGraph` (3-node graph + cyan signal output) primary mark — the live
  `MiniLogo` is a different design ("bracket + circle"), so adopting brand
  asks us to swap the SVG.

**Byte-identical observation (call out for orchestrator):**
- `md5(design/handoff/brand/tokens.css) == md5(design/handoff/shared/tokens.css)` (`3a71344d20fc9baa08a7dc855cf069b7`).
  Translation: the brand drop's `tokens.css` is **the same artifact** that the
  designer ships under `shared/`. The webui copy at
  `components/ui/src/prompts-v2/tokens.css` differs only by an Apache-2.0
  header block and the long comment "promptLM v2 design tokens — slate ink +
  electric signal. Loaded by both @promptlm/web-ui (via main.tsx) and the
  storybook preview. Fonts (Geist, JetBrains Mono) are loaded by the host app."
  Lines 13–118 of the webui copy match lines 2–107 of the brand copy verbatim
  (verified with `diff`).

So as of this drop **the webui token surface and the brand token surface
agree on every variable value and every utility class**. The brand drop did
not change tokens; it shipped logos, marketing surfaces, and design-system
artboards. **BS-3 has nothing to change in `tokens.css`.** Any non-trivial
token change BS-3 would make is purely speculative — we should not invent
work.

---

## 2. Token diff: brand vs. `components/ui/src/prompts-v2/tokens.css`

### 2.1 Variables present on both sides — all values match

Verified by `diff` after stripping the Apache header. Every `--pl-*`
custom property is identical, including:

- **Ink ramp:** `--pl-ink-{900,800,700,600,500,400,300,200,100}`,
  `--pl-paper`, `--pl-canvas` — all OKLCH values match (e.g. `--pl-ink-900: oklch(0.16 0.02 250)`).
- **Signal ramp:** `--pl-signal`, `--pl-signal-bright`, `--pl-signal-deep`, `--pl-signal-ink`.
- **Functional accents:** `--pl-ok` (oklch 0.74 0.13 155), `--pl-warn` (0.78 0.13 75), `--pl-fail` (0.66 0.18 25).
- **Type:** `--pl-display`, `--pl-mono`.
- **Radii / shadows:** `--pl-r-{sm,md,lg}`, `--pl-shadow-{sm,md,lg}`.

### 2.2 Variables only in brand

None.

### 2.3 Variables only in webui

None — webui has zero tokens that the brand drop omits.

### 2.4 Utility classes present in both — call out for BS-3

Both files ship the same utility classes. None of these are token-table
material; they are presentational helpers used downstream. BS-3 must not drop
them just because it's renaming itself a "token PR":

- `.pl` — base layer (font-family, color, font-feature-settings).
- `.pl-mono` — JetBrains Mono helper.
- `.pl-grid-bg` — hairline 32px grid.
- `.pl-eyebrow` — uppercase mono caption.
- `.pl-btn`, `.pl-btn-primary`, `.pl-btn-ghost`, `.pl-btn-signal` — button atoms.
- `.pl-card`, `.pl-divider`.
- `@keyframes pl-pulse` + `.pl-pulse`.

These classes are referenced from the brand-drop JSX surfaces but are NOT
documented as part of the public package contract. They live in `tokens.css`
because that's the only stylesheet imported by both web-ui (`main.tsx`) and
Storybook (`.storybook/preview.tsx`). Treat them as **co-resident with the
tokens, not as tokens.**

### 2.5 Brand-only color promotion the issue forbids

The pink/purple gradient `linear-gradient(135deg, #f973ff 0%, #a855f7 100%)`
appears once in `site/index.html:11` (the `EARLY ALPHA` corner badge) and is
**not** present in either `tokens.css`. The umbrella issue (#111) is explicit:
this gradient stays brand-only. **BS-3 must NOT introduce variables like
`--pl-accent-magenta`, `--pl-gradient-alpha`, etc., to absorb this gradient.**

The `darkAurora` MUI variant in `components/ui/src/theme/variants.ts:87,99,120`
already references `#A855F7` as `secondaryMain` and as part of
`--plm-button-primary-bg` linear-gradient. That prior usage is in the `--plm-*`
namespace (not `--pl-*`), and it predates the brand drop. It's not in scope
for BS-3 to remove, but BS-4 should leave it alone.

### 2.6 Brand-drop "tweaks" surface — for awareness only

`design/handoff/brand/promptLM Brand & Site.html` ships an in-canvas tweaks
panel that mutates a wider set of variables at runtime:
`--pl-accent-2`, `--pl-accent-3`, `--pl-accent-2-soft`, `--pl-accent-3-soft`,
`--pl-signal-soft`. These are **only set via JS in the design canvas** and
are NOT in the brand `tokens.css` static file. `site.jsx` also references
them (`var(--pl-signal-soft)`, `var(--pl-accent-2-soft)`,
`var(--pl-accent-3-soft)` — see `site.jsx:252-254`, `:413`, `:540`).

BS-3 should NOT add these to webui `tokens.css` until/unless a downstream
surface in the app (not the design canvas) needs them. Otherwise the editor
track (#98) inherits five undocumented tokens that nothing on the live app
side reads. If BS-7 picks "hand-translate JSX → HTML" we will have to confront
these; if it picks "single-HTML Vite bundle keeping the tweaks panel out", we
can keep them out.

---

## 3. BS-3 adoption recommendation — design only, no code

### 3.1 Headline

**The honest answer is: BS-3 should be a near-zero diff PR.** The brand drop
did not change token values. Adopting the drop into
`components/ui/src/prompts-v2/tokens.css` literally means: nothing.

Three options for the orchestrator (decision needed — see §9):

- **Option A — "Reaffirm" (recommended).** Make BS-3 a tiny PR that updates
  only the leading comment in `components/ui/src/prompts-v2/tokens.css` to
  cite the brand drop as canonical (e.g. "Mirrors `design/handoff/brand/tokens.css` from the brand package landed in BS-1.") and adds a row to `design/handoff/README.md` pointing at brand. No `--pl-*` changes. This still satisfies "BS-3 lands first among code changes" and gives #98 a stable rebase point.
- **Option B — "Empty stub PR."** Keep the file unchanged. BS-3 lands as a
  tag-only commit. Cleanest for #98 but offers no token-PR signal.
- **Option C — "Pre-promote design-canvas extras"** (e.g.
  `--pl-signal-soft`, `--pl-accent-2`, `--pl-accent-3` and their `-soft`
  variants). Only justifiable if BS-7 is going to consume them. Adds tokens
  with no current consumer in the editor or app shell — explicit risk per #98
  blast-radius rules.

### 3.2 If we go with Option A — exact change set

- Add a one-line comment near the top of `components/ui/src/prompts-v2/tokens.css` (after the existing "promptLM v2 design tokens — slate ink + electric signal." block) noting that the file is kept in sync with `design/handoff/brand/tokens.css`.
- Do not change any `--pl-*` value.
- Do not add or remove any utility class.
- Do not touch any `@keyframes`.
- **Preserve the existing Apache-2.0 license header (lines 1–8).** Confirmed:
  the brand-drop copy has no license header, so adoption must keep webui's
  header (mandatory for OSS publishing).

### 3.3 Proposed PR ordering for the editor-track (#98) rebase

- BS-3 lands first (per #111 coordination rule).
- BS-3 keeps the diff micro (Option A) so #98 PRs only have to rebase a comment
  change. Zero risk of variable rename or color shift mid-flight.
- BS-4..BS-8 follow in any order; they don't touch `tokens.css`.

### 3.4 Variables to add / change / leave / rename

- **Add:** none.
- **Change in value:** none.
- **Leave alone:** every existing `--pl-*` custom property, every utility
  class, every keyframe.
- **Rename:** none.

### 3.5 "Do not touch" list (BS-3 explicit no-op surface)

- Apache-2.0 header (lines 1–8 of webui copy).
- `.pl`, `.pl-mono`, `.pl-grid-bg`, `.pl-eyebrow`.
- `.pl-btn`, `.pl-btn-primary`, `.pl-btn-ghost`, `.pl-btn-signal`.
- `.pl-card`, `.pl-divider`.
- `@keyframes pl-pulse`, `.pl-pulse`.
- The MUI `--plm-*` variant tokens in `components/ui/src/theme/variants.ts`
  (separate concern from `--pl-*`; not in BS-3 scope).

---

## 4. BS-4 chrome surface map

### 4.1 Files (live)

- `components/ui/src/prompts-v2/atoms/MiniLogo.tsx` — current logo SVG (bracket + circle, NOT the brand's `MarkGraph`). Default `size=22`, uses `--pl-ink-900` and `--pl-signal-deep`.
- `components/ui/src/prompts-v2/atoms/MiniLogo.stories.tsx` — Storybook coverage at `Prompts v2 / Atoms / MiniLogo`.
- `components/ui/src/prompts-v2/shell/AppSidebar.tsx` — uses `MiniLogo size={22}` next to a "promptLM" wordmark (line 138–148). Width 232px, padding 18/14.
- `components/ui/src/prompts-v2/shell/AppShellV2.tsx` — wraps `<AppSidebar />`; no logo of its own.
- `components/ui/src/prompts-v2/shell/{AppSidebar,AppShellV2}.stories.tsx`.
- `components/ui/src/prompts-v2/atoms/index.ts` — re-exports `MiniLogo`, `MiniLogoProps`.
- `components/ui/src/prompts-v2/shell/index.ts` — re-exports `AppSidebar`, `AppShellV2`.

### 4.2 Live import sites

Single primary consumer:
- `components/promptlm-web-ui/src/components/layout/AppShellLayout.tsx:18-19,132-144` — only place that imports `AppShellV2 + AppSidebar` (no other `MiniLogo` consumer outside the atoms barrel).

### 4.3 Where the brand wants the logo to land

The brand's primary mark is **`MarkGraph`** in `design/handoff/brand/logos.jsx:9-21`:
```
two ink input nodes (left), accent output node (right),
connecting lines: ink + ink + signal (the active output edge)
```
Plus a `Wordmark` lockup helper that renders `prompt<bold>LM</bold>` in
`var(--pl-display)` at the chosen size. Both Wordmark and the standalone
mark accept an `accent` prop defaulting to `var(--pl-signal-deep)`.

### 4.4 Estimated blast radius for BS-4

- Replace `MiniLogo`'s SVG body with the `MarkGraph` body (port from JSX). One
  file. Existing `size=22` default and the
  `var(--pl-ink-900)` / `var(--pl-signal-deep)` color references stay valid —
  the brand mark uses the same tokens.
- `AppSidebar` does NOT need a structural change unless the orchestrator wants
  to swap the bare "promptLM" `<span>` for the `Wordmark` lockup (recommended:
  yes — it tightens letter-spacing and treats the `LM` weight per brand).
  That's a single-file edit at lines 138–148.
- Update the matching stories to keep snapshot output sensible.
- Confirm no dark-surface usages of `MiniLogo` rely on the current bracket
  silhouette. The Storybook story renders it at four sizes against `--pl-paper`
  only.

Estimated diff: ~80–120 LoC across 2 components + 2 stories.

---

## 5. BS-5 favicon set

### 5.1 Existing files (must be regenerated as a unit)

| Path | Size | Format |
|---|---|---|
| `components/promptlm-web-ui/public/favicon-32.png` | 32×32 | PNG |
| `components/promptlm-web-ui/public/favicon-192.png` | 192×192 | PNG |
| `components/promptlm-web-ui/public/favicon-512.png` | 512×512 | PNG |
| `components/promptlm-web-ui/public/apple-touch-icon.png` | 180×180 (typical) | PNG |

The current `components/promptlm-web-ui/index.html` does **not** declare any
`<link rel="icon">` references — the Vite default behavior for `public/` is
to surface them at root URLs, but explicit `<link>` tags are missing. **BS-5
or BS-6 needs to add the `<link rel="icon">` and `<link rel="apple-touch-icon">`
declarations** when the new icons land.

### 5.2 Brand source for regeneration

- SVG source: `MarkGraph` body (`design/handoff/brand/logos.jsx:9-21`),
  rendered at solid `var(--pl-ink-900)` / `var(--pl-signal-deep)` against
  `var(--pl-paper)` background.
- The brand drop ships **no PNG/ICO assets**; favicons must be exported from a
  new SVG asset checked in alongside the PNGs (recommend
  `components/promptlm-web-ui/public/favicon.svg` as the new vector source so
  the storybook chrome can reuse it).

### 5.3 Storybook favicon

Neither `components/ui/.storybook/main.ts` nor
`components/promptlm-web-ui/.storybook/preview.tsx` configures a custom
`managerHead` / `manager-head.html` / favicon today. Storybook serves its
default favicon. BS-5 should add `manager-head.html` files (one per .storybook
config) that link `favicon.svg` so the manager UI matches the brand. See §8.

---

## 6. BS-6 webapp `index.html`

### 6.1 Two `index.html` files exist — be careful

- `components/promptlm-web-ui/index.html` — **Vite app root**, this is the one
  that ships to users. Currently contains "Lovable App" placeholder copy.
- `apps/promptlm-webapp/src/main/resources/static/index.html` — Spring Boot
  static resource, only contains
  `<title>PromptLM</title>` and a placeholder div. This file is served only
  when the bundled webui is missing (build fallback). BS-6 should also fix
  this one but the user-visible surface is the Vite root.

### 6.2 Current values (`components/promptlm-web-ui/index.html`)

- `<title>` → `Lovable App`
- `<meta name="description">` → `Lovable Generated Project`
- `<meta name="author">` → `Lovable`
- `<meta property="og:title">` → `Lovable App`
- `<meta property="og:description">` → `Lovable Generated Project`
- `<meta property="og:image">` → `https://lovable.dev/opengraph-image-p98pqg.png`
- `<meta name="twitter:site">` → `@Lovable`
- `<meta name="twitter:image">` → `https://lovable.dev/opengraph-image-p98pqg.png`

This is **scaffolding from the original Lovable export** and ships pointers
back to the lovable.dev OG image. Real privacy / brand concern.

### 6.3 Proposed values (drawn from brand drop + voice/tone)

- `<title>` → `promptLM` (or `promptLM — Prompt lifecycle for LLM products`).
- `<meta name="description">` → from the brand drop's body copy
  (`design-system.jsx:30-32`): "promptLM is a developer tool — cool slate
  neutrals, electric cyan signal..." needs to be re-cast for SEO. Suggested:
  "Open-source prompt lifecycle management — version, test, replay, regress
  prompts against any LLM."
- `<meta name="author">` → `promptLM`.
- OG/Twitter image → new file at
  `components/promptlm-web-ui/public/og-image.png` (1200×630) generated from
  the brand canvas. Brand drop does NOT ship an OG image; needs creation.
- Twitter site handle: drop or set to whatever account exists. (Open question.)
- Add `<link rel="icon">` declarations matching BS-5 outputs.

### 6.4 Apache header / Spring placeholder

The webapp's Spring static `index.html` currently has only `<title>PromptLM</title>` and no description, OG, or favicon. Bring it to parity with the brand text but keep it minimal (it's a fallback, never seen unless the Vite bundle is absent).

---

## 7. BS-7 marketing site decision

### 7.1 Sizing the two sides

- Live `site/index.html` — 586 LoC of hand-authored HTML. Pulls
  `styles.css` (1157 LoC), `script.js` (453 LoC), Font Awesome 6.4, Inter +
  JetBrains Mono via Google Fonts. Uses `media/logo-horizontal.png` (raster).
  Has the pink/purple "EARLY ALPHA" badge inline (kept brand-only per #111).
- Brand `design/handoff/brand/site.jsx` — 810 LoC of React JSX. Renders
  `Landing`, `Pricing`, `Docs` artboards inside the design canvas. Heavy use
  of `var(--pl-*)` tokens, `MarkGraph`, `Wordmark`. Includes a tweaks panel
  driven by `applyTheme()` in `promptLM Brand & Site.html`. Depends on:
  `tokens.css`, `logos.jsx`, `tweaks-panel.jsx`, fonts (Geist + JetBrains Mono +
  Fraunces + EB Garamond + IBM Plex Mono).

### 7.2 Recommendation: **hand-translate JSX → HTML.**

**Rationale (top three):**

1. **Risk surface.** The marketing site is GitHub-Pages-served with a `CNAME`
   and a current `script.js` that wires nav-toggle behavior, copy-to-clipboard,
   etc. Migrating to a Vite bundle introduces a new build step in the deploy
   pipeline (currently zero — files are committed and served verbatim).
   That's outside #111's scope and risks breaking existing pages
   (`docs.html`, etc., which also live under `site/` and are out-of-scope per
   the issue body).
2. **Coupling.** `site.jsx` reads runtime-only tokens (`--pl-signal-soft`,
   `--pl-accent-2-soft`, `--pl-accent-3-soft`) that the design canvas sets via
   JS at boot. A Vite-bundled marketing site would either need the tweaks
   panel (no — overkill) or have those token values inlined as static values
   (lossy). Hand-translation gives us the chance to inline literal final
   values and drop the tweak indirection.
3. **Token boundary.** The marketing site is the only surface the issue
   acknowledges might want a brand variant that doesn't apply elsewhere
   (#111: "if the brand needs a variant that doesn't apply to the app shell,
   add to `components/ui/src/theme/variants.ts`"). Keeping `site/` as static
   HTML/CSS lets us copy a small subset of `--pl-*` into a **scoped**
   `site/styles.css` block instead of polluting the shared token surface.

Concretely, BS-7 should:
- Translate the `Landing`/`Pricing`/`Docs` JSX surfaces in `site.jsx` to
  semantic HTML in `site/index.html` (and equivalents). Replace the
  `Inter`/`JetBrains Mono` font imports with `Geist`/`JetBrains Mono` to match
  brand.
- Replace `media/logo-horizontal.png` with a Wordmark SVG derived from
  `MarkGraph + prompt<bold>LM</bold>`.
- Inline a copy of the relevant `--pl-*` values into `site/styles.css` (NOT
  link to `prompts-v2/tokens.css` — keeps the marketing site decoupled from
  the npm workspace build).
- Keep the pink/purple `corner-badge` exactly as-is (brand-only, per #111).

### 7.3 Open about: media files

`site/media/logo*.png` — three raster sizes — will need replacements derived
from `MarkGraph + Wordmark`. None of these vector sources exist in the brand
drop yet; ask designer or render from JSX → SVG.

---

## 8. BS-8 Storybook chrome

### 8.1 Where Storybook is configured

Two Storybook installations:

| Workspace | `.storybook/` | What it shows |
|---|---|---|
| `components/ui` | `main.ts`, `preview.tsx`, `preview-head.html`, `tsconfig.json` | The brand component library (atoms, shell, prompts-v2 pages). Imports `../src/prompts-v2/tokens.css` directly. `preview-head.html` declares Geist + JetBrains Mono via Google Fonts. |
| `components/promptlm-web-ui` | `main.ts`, `preview.tsx` | App-level stories with MSW handlers. Imports `@/index.css` (which transitively loads tokens via `main.tsx`). Default theme: dark (`<ThemeProvider defaultTheme="dark">`). |

### 8.2 What changes are needed

- **Favicon.** Neither install configures one. Add `manager-head.html` to each
  `.storybook/` directory that links the BS-5 favicon SVG.
- **Title / brand.** Storybook's default title is "Storybook"; it can be
  overridden in `main.ts` via the `framework` options or by setting
  `theme` in a custom theme file (`@storybook/manager-api`). Recommend:
  - Create `components/ui/.storybook/manager.ts` with a custom Storybook theme
    using the brand tokens (`brandTitle: 'promptLM · UI'`, `brandUrl`, brand
    colors via `colorPrimary: oklch(...)` mapped to the cyan signal). Same for
    `components/promptlm-web-ui/.storybook/manager.ts`.
- **Preview head fonts.** `components/ui/.storybook/preview-head.html`
  already links Geist (400/500/600/700) and JetBrains Mono (400/500/600).
  Keep as-is — matches the brand's required type stack.
- **No token edits.** `tokens.css` is loaded via `import` in
  `preview.tsx`; no change needed there for BS-8.

### 8.3 Where it lives if BS-3 is Option A

Because BS-3 won't change tokens, BS-8 is purely additive (favicon + manager
theme files) and can land in any order after BS-5 ships the favicon SVG.

---

## 9. Open questions / decisions for the orchestrator

1. **BS-3 shape.** Option A (comment-only PR, recommended), Option B (empty
   tag PR), or Option C (pre-promote design-canvas extras into `--pl-*`)?
   This is the call that determines whether BS-3 has any token diff at all.
   See §3.
2. **Pre-promote `--pl-signal-soft` / `--pl-accent-{2,3}{,-soft}`?** Required
   if BS-7 inlines `site.jsx` token usage rather than hard-coding values. The
   issue body forbids only the pink/purple gradient; these "soft" tokens are
   not explicitly forbidden but have no live consumer. Recommend keeping them
   out of `tokens.css` and inlining literal values in `site/styles.css`.
3. **OG image asset.** Brand drop does not ship one; BS-6 needs a 1200×630
   image rendered from the brand canvas. Who produces it — designer (new
   asset) or BS-6 implementer (export from `MarkGraph + Wordmark`)?
4. **Marketing site fonts.** `site/styles.css` currently uses Inter; brand is
   Geist. Switching may shift line-heights and break the existing layout
   tuning. BS-7 needs to re-tune or accept a visual diff. Confirm acceptable.
5. **Twitter handle / social metadata.** Lovable defaults must come out; what
   replaces them? (Likely `@promptlm`, but no record in repo.)
6. **`AppSidebar` wordmark swap.** Replace bare `<span>promptLM</span>` with
   the `Wordmark` lockup in BS-4? (Recommend yes; small.)
7. **Spring static fallback `index.html`.** Bring to parity with the Vite
   `index.html` in BS-6, or leave as the bare minimum it is today? (Recommend
   minimal parity: title + description, no OG.)
8. **Designer round-trip on `MarkGraph` for favicons.** PNG raster export
   depends on the designer signing off on a single canonical SVG. Generate
   from `logos.jsx` ourselves or wait for asset?

---

## 10. Risks

### 10.1 Contract impact on `tokens.css` consumers

- **Editor track #98** rebases against BS-3. If BS-3 is Option A (comment
  only), the rebase risk is ~zero. Any value change (Option C) raises blast
  radius across `prompts-v2/*` consumers (every page in `promptlm-web-ui/src/pages/`,
  all `prompts-v2/{form,detail,catalog,...}/*` components, both
  Storybooks, and `components/promptlm-report-static/src/main.tsx` which also
  imports `prompts-v2/tokens.css`).
- The single-PR-at-a-time rule on `tokens.css` (per #111) means BS-3 must
  block / unblock #98 explicitly. Land Option A first → unblock immediately.

### 10.2 Coordination with editor track #98

- #98 PR 1 needs the file unchanged structurally. Minimal BS-3 keeps the
  rebase trivial.
- BS-4 (chrome) does not touch `tokens.css`; safe to parallelize with #98.
- BS-5/6/7/8 are entirely outside #98's surface.

### 10.3 Incidental breakage spotted while reading

- `components/promptlm-web-ui/index.html` ships a `lovable.dev` OG image at
  every page render today — minor brand/privacy issue but not a #111 risk.
- `apps/promptlm-webapp/src/main/resources/static/index.html` has zero
  meta/favicon links and ships only "PromptLM UI bundle placeholder" copy;
  if the Vite bundle ever fails to load, users see this. Out of #111 scope
  but worth a follow-up issue.
- `MiniLogo` reuses `--pl-signal-deep`/`--pl-ink-900` so the logo swap will
  inherit any future signal hue change for free; this is a feature, not a
  risk, but means BS-4 should NOT hard-code colors during the SVG port.
- `site/styles.css` is large (1157 LoC) and does not import or reference
  `tokens.css`. BS-7 hand-translation must inline final brand color values
  (not `var(--pl-*)`) to keep the marketing site self-contained.
- Fonts: brand drop's canvas HTML imports Fraunces + EB Garamond + IBM Plex
  Mono in addition to Geist + JetBrains Mono. None of the live surfaces
  currently load Fraunces/EB Garamond/IBM Plex; BS-7 should NOT pull these
  in unless `site.jsx` uses them in the section we translate. Spot-checking
  shows `site.jsx` uses only `var(--pl-display)` / `var(--pl-mono)`, so the
  extra fonts are canvas-only and can be dropped during translation.
- The `.storybook/manager-head.html` files referenced in §8 do not currently
  exist; BS-8 creates them (additive, low risk).

— end of audit —
