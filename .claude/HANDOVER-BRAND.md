# Chat handover — promptLM Brand & Site adoption

**Repo:** `/Users/fk/dev/promptLM/promptlm-app`
**Active branch:** `feat/new-ui-design` (9 commits ahead of `main`, PR [#94](https://github.com/promptLM/promptlm-app/pull/94) open — see `.claude/HANDOVER.md` for the editor-work context)
**Auto mode:** on (act, don't over-plan)
**This doc** scopes the brand-and-site work that's about to start. The editor work is its own track in `HANDOVER.md`; the two can proceed in parallel — they touch disjoint code (marketing site at `site/` + app shell branding vs. v2 prompt form).

---

## 1. Source of truth (you must fetch this first)

The user pointed at a hosted design package:

```
https://api.anthropic.com/v1/design/h/E7PZ37RPFgO-TIbGRg0MHw?open_file=promptLM+Brand+%26amp%3B+Site.html
```

The file to implement is **`promptLM Brand & Site.html`**. The URL is at `api.anthropic.com` and behaves like an authenticated artifact host — a basic `WebFetch` from a sandboxed shell got rejected (likely auth or sandbox policy). Try one of these in order:

1. **Use a tool with credentials.** If your environment has an authenticated Anthropic API client or Claude with internet access, fetch via that.
2. **`curl` with the user's token.** If the user supplies a bearer token, `curl -L -H "Authorization: Bearer …" "<url>"` should return the package; iterate by changing `?open_file=…` per file.
3. **Ask the user to paste the file content.** Quickest unblock if 1–2 don't work. Specifically request:
   - The package's README or root listing (so you know what other files exist)
   - The full `promptLM Brand & Site.html`
   - Any token/colour/asset files referenced from inside that HTML

Once you have the content, **save it locally under `design/handoff/`** so future chats don't have to refetch:

```
design/handoff/brand/                   # propose this layout — designer's may differ
├── README.md                           # whatever shipped with the package
├── promptLM Brand & Site.html
└── (any referenced assets)
```

If the existing `design/handoff/` README has a "How to receive a drop" section, follow that convention; otherwise the layout above mirrors the existing `webui/` and `report/` siblings.

Don't commit the brand drop until the user approves — the existing `design/` dir is **untracked** and the user has been treating it as a working surface, not a versioned artifact.

---

## 2. What "Brand & Site" probably covers

Educated guess based on the file name + repo structure (confirm against the actual file):

- **Brand** — typography, colour palette, logo system, voice/tone, possibly motion / iconography. The webapp already has a `prompts-v2` token layer (`components/ui/src/prompts-v2/tokens.css`) — the brand drop will likely either confirm those tokens or override them. **Don't blindly diverge from the existing tokens — map the brand drop's tokens to the v2 token names so the editor work stays consistent.**
- **Site** — the marketing landing page (currently `site/index.html` + `site/styles.css`) and probably the docs surface (`site/docs.html`). The `site/CNAME` indicates this is hosted at a custom domain. The existing site is hand-rolled HTML/CSS/JS, no framework.

The brand drop most likely won't touch:
- The webapp's prompt editor surfaces (catalog / detail / form / diff / report) — those are governed by the editor handoff at `design/handoff/webui/` and `design/handoff/playbook/`.
- The Java backend.

But it likely *will* affect:
- App shell chrome (sidebar branding, top-bar logo) — see `components/promptlm-web-ui/src/components/layout/AppShellLayout.tsx` (or similar) and `components/ui/src/prompts-v2/shell/`.
- Favicons and OG images at `components/promptlm-web-ui/public/`.
- Storybook chrome (`components/ui/storybook-static/`).

---

## 3. Existing brand surfaces (audit these before changing anything)

### 3A. Marketing site at `site/`

```
site/
├── CNAME            # custom domain
├── index.html       # 586 LOC — landing page (hero, sections, CTA)
├── docs.html        # 313 LOC — documentation page
├── styles.css       # 1157 LOC — hand-rolled CSS, not Tailwind
├── script.js        # 453 LOC
└── media/
    ├── logo-horizontal.png
    ├── logo-s.png
    └── logo.png
```

`index.html` opens with inline `<style>` blocks that include a "corner-badge" and the linear-gradient palette `#f973ff` → `#a855f7` (pink/purple). That gradient is **not** in the v2 design tokens — it's a separate brand artifact. The brand drop will likely either codify this gradient as a token or replace it.

### 3B. App-side branding

| Path | Notes |
|---|---|
| `components/promptlm-web-ui/public/favicon-{32,192,512}.png` + `apple-touch-icon.png` | Webapp favicon set |
| `components/promptlm-web-ui/index.html` | App entry HTML — search for `<title>`, `<meta>`, OG tags |
| `components/ui/src/prompts-v2/atoms/MiniLogo.tsx` | The "pLM" mark used in the editor sticky header (see also `prompt-form.jsx::HeaderMark`). The brand drop may define a replacement. |
| `components/ui/src/prompts-v2/shell/AppShellV2.tsx` + `AppSidebar.tsx` | App chrome — left rail / top bar |
| `components/ui/storybook-static/favicon.svg` | Storybook favicon |
| `media/a83eb62e-9144-4dea-9487-204ba910aedd.png` | Repo-root brand image (what is this? rename if the brand drop has a canonical replacement) |

### 3C. Tokens (already exist; brand drop will likely interact)

- `components/ui/src/prompts-v2/tokens.css` — the v2 design tokens (`--pl-ink-*`, `--pl-paper`, `--pl-canvas`, `--pl-signal`, `--pl-ok/warn/fail`, font stacks, radii, shadows). **Read this before adopting brand colours.**
- `components/ui/src/theme/{tokens.ts,createPromptLMTheme.ts,variants.ts}` — the MUI theme that bridges `--pl-*` tokens for non-form surfaces. The brand drop may add a marketing variant or override `lightTech`.

---

## 4. Implementation playbook (proposed order)

1. **Fetch the package and unpack it locally.** Save under `design/handoff/brand/` (or wherever the package's README dictates).
2. **Read the README first.** Designers in this repo communicate scope and "ship lean" guidance via the README. Look for a "What v1 ships, what doesn't" table similar to `design/handoff/README.md` §"What ships in v1, what doesn't".
3. **Open `promptLM Brand & Site.html` in the `handoff-playbook` preview** (port 5182, configured in `.claude/launch.json`). If the file isn't reachable from there, add a launch entry: `python3 -m http.server 5183 --directory design/handoff/brand`.
4. **Audit the existing surfaces** (§3A and §3B) against the brand drop. List divergences in a working note before touching code.
5. **Adopt tokens first.** If the brand drop introduces a colour palette, propose updates to `components/ui/src/prompts-v2/tokens.css` *only* — don't sprinkle hard-coded colours through components. The editor work (`HANDOVER.md`) consumes those tokens; coordinated updates keep the two tracks consistent.
6. **Then chrome.** Logo, top-bar, favicons, OG images.
7. **Then `site/`.** Landing page + docs. The current `site/` is hand-rolled HTML; if the brand drop is React/JSX, decide whether to (a) port to a tiny static bundle (Vite single-HTML) or (b) hand-translate JSX to vanilla HTML/CSS.
8. **Don't break the editor work.** Run the editor checks after every chrome change:
   - `npm --workspace @promptlm/ui run build`
   - `npm --workspace @promptlm/ui test` (smoke)
   - `npm --workspace @promptlm/web-ui test --silent` (61/61)
   - Browser preview at `/prompts/new` to confirm the editor still looks right.

---

## 5. Relationship to the editor track (`HANDOVER.md`)

| Track | Files | PR | Independent? |
|---|---|---|---|
| **Editor** (#95 / #96 / #98 / #100 / #77 / #76) | `components/ui/src/prompts-v2/` (excluding `shell/`), `components/promptlm-web-ui/src/{features/prompt-editor,pages/Prompt*}` | already on `feat/new-ui-design` (PR #94) + future #98 PR 1 / PR 2 | mostly — touches the form / detail / diff surfaces |
| **Brand & Site** (this doc) | `site/`, `components/promptlm-web-ui/public/`, `components/promptlm-web-ui/index.html`, `components/ui/src/prompts-v2/{tokens.css,shell/}`, `components/ui/src/prompts-v2/atoms/MiniLogo.tsx` | new PR off `main` (or `feat/new-ui-design` if branch order allows) | mostly — token changes ripple into the editor |

**The shared seam is `tokens.css`.** Whoever lands changes there last needs to re-verify the other surface. Coordinate via the PR description.

If the brand drop wants a **marketing-specific theme variant** that doesn't apply to the app shell, add it to `components/ui/src/theme/variants.ts` instead of overwriting `lightTech`.

---

## 6. Repo conventions (the bare minimum)

- **License headers** — every TS/TSX/Java file. Pre-commit hook enforces. Copy from any existing file.
- **Commit format** — Conventional Commits. Use scope `site` for `site/` changes; `ui` for token/theme/chrome; `webui` for app-side branding. End each commit body with `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- **Build** — `npm --workspace @promptlm/ui run build` before any consumer changes. The site at `site/` has no build step (static HTML/CSS/JS).
- **No new dependencies** without checking `package.json` for the closest existing equivalent (the project already has shadcn + MUI + Vite + Tailwind tokens — almost any UI primitive is already covered).

---

## 7. Caveats / gotchas

1. **Auth on the design URL** — the API endpoint at `api.anthropic.com/v1/design/…` is not publicly fetchable from a sandboxed shell. Don't assume `WebFetch` will work; have a fallback (user paste, authenticated `curl`).
2. **The existing `site/` is hand-rolled.** No bundler, no framework. If the brand drop is React/JSX, you'll either need to port the app shell into the marketing site (large diff) or hand-translate (smaller diff, more discipline). Read the user's intent from the README — if it says "drop in," lean toward translation.
3. **The repo's design tokens are already established and consumed throughout the editor.** Token changes are wide-blast-radius. Read `components/ui/src/prompts-v2/tokens.css` before introducing colours.
4. **The pink/purple gradient (`#f973ff` → `#a855f7`) on `site/index.html` is brand-only.** Don't propagate it into the editor's `--pl-*` token namespace without explicit designer signoff — those tokens are slate-blue, deliberately calm for a tool surface.
5. **The CNAME at `site/CNAME`** binds this directory to a real public domain. Don't ship broken HTML — site/ deploys are likely tied to a Pages workflow somewhere (search `.github/workflows/` for a Pages deploy step before committing).
6. **The favicon set already exists at three sizes.** If the brand drop ships a new logo, regenerate the full set (`favicon-32.png`, `favicon-192.png`, `favicon-512.png`, `apple-touch-icon.png`) — don't ship a partial replacement.

---

## 8. First-action checklist

```
[ ] Fetch the design package (per §1)
[ ] Save it under design/handoff/brand/ (or whatever README dictates)
[ ] Read the README — note v1 scope, deferred items, gotchas
[ ] Diff brand tokens vs. components/ui/src/prompts-v2/tokens.css
[ ] List divergences in a working note (don't touch code yet)
[ ] Confirm scope with user before any token changes (wide blast radius)
[ ] Implement in this order: tokens → chrome → favicons → site/
[ ] Verify editor surfaces (/prompts, /prompts/:id, /prompts/new) still render after every chrome change
[ ] Open a separate PR off `feat/new-ui-design` (or `main`, depending on branch coordination)
```

---

## 9. tldr

> Branch `feat/new-ui-design` is 9 commits ahead, PR #94 open (editor work). Brand & Site is a **separate track** — fetch the package at the URL in §1 (sandboxed `WebFetch` was blocked, plan for an authenticated path or user paste), unpack under `design/handoff/brand/`, audit existing surfaces (`site/`, `components/promptlm-web-ui/public/`, `components/ui/src/prompts-v2/{tokens.css,shell/}`), then adopt tokens first, chrome second, marketing site last. The two tracks share `tokens.css` only — coordinate. Editor handover lives at `.claude/HANDOVER.md`; this is its sibling for brand work.
