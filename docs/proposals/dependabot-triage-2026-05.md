# Dependabot triage — 2026-05

**Status:** Triage report (no code changes proposed)
**Author:** Fabian (assisted)
**Date:** 2026-05-20
**Branch:** `security/dependabot-triage-2026-05`
**Alerts source:** `gh api /repos/promptLM/promptlm-app/dependabot/alerts?state=open` (33 alerts on `main`)

## Executive summary

- All 33 open alerts are in the **JavaScript (npm)** and **Python (pip/uv)** trees. **Zero Java/Maven alerts** — the Spring Boot 4.0.6 / Spring AI / Modulith stack has no open Dependabot findings today. The PR #231 parent-POM extraction is therefore **independent** of this triage; the platform BOM does not need to land first.
- The single **critical** alert is `handlebars 4.7.8` (GHSA-2w6w-674q-4c4q, CVSS 9.8). It is a **dev-only transitive** under `openapi-typescript-codegen` in the API-client codegen workspace and never reaches a deployed artifact. Fix is `handlebars >= 4.7.9`, applicable via an `npm overrides` block in root `package.json` — trivial change, no Spring Boot dependency.
- **All 13 high alerts** are in npm or Playwright manifests. None block on Spring Boot. The two that need slightly more care are (a) bumping `vite` 5.x → 6.4.2+ in `promptlm-web-ui` and `promptlm-report-static` (which pulls Storybook 8 → 9), and (b) bumping `picomatch`/`fast-uri`/`rollup` via overrides because they are deep transitives of Vite/Storybook.
- **Two alerts (`skills-ref/uv.lock`, #39 + #40) are stale-path false positives** — that lock file was deleted by commit `8e9d878` ("Cleanup", 2026-05-11). The same versions are still vulnerable in the current `.agents/skills/skills-ref/uv.lock` (alerts #35, #36), so the underlying issue is real, but #39/#40 should be dismissed once Dependabot rescans (or manually, with reason "fix_started").
- The pip/uv alerts (`Pygments`, `pytest`) only live under the `skills-ref/` agent skill repo. They have **no impact on the deployed Spring Boot application**; `skills-ref` is an agent-tooling submodule, not part of the webapp runtime.

## Counts

### By severity

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High     | 13 |
| Moderate | 16 |
| Low      | 3 |
| **Total** | **33** |

### By root package (after deduping cross-manifest hits)

| Package           | Ecosystem | Alerts | Highest severity |
|-------------------|-----------|--------|------------------|
| handlebars        | npm       | 7      | Critical         |
| vite              | npm       | 5      | High             |
| picomatch         | npm       | 5      | High             |
| storybook         | npm       | 2      | High             |
| fast-uri          | npm       | 2      | High             |
| lodash            | npm       | 2      | High             |
| postcss           | npm       | 2      | Moderate         |
| pytest            | pip       | 2      | Moderate         |
| Pygments          | pip       | 2      | Low              |
| esbuild           | npm       | 1      | Moderate         |
| playwright        | npm       | 1      | High             |
| rollup            | npm       | 1      | High             |
| yaml (npm v1.10.2) | npm      | 1      | Moderate         |

### By dependency scope

| Scope        | Count |
|--------------|-------|
| development  | 23    |
| runtime      | 10    |

### By directness (Maven scope = N/A, all alerts are JS/Python)

| Class                    | Count | Notes |
|--------------------------|-------|-------|
| Direct dev-dep           | 4     | playwright (acceptance-tests), storybook (web-ui), vite (web-ui, report-static, tokens-preview), esbuild (web-ui), postcss (web-ui) |
| Direct prod-dep          | 1     | yaml@^2 (root package.json) — note: alert is for a different yaml@1 transitive, not this one |
| Transitive (workspace)   | 28    | handlebars/lodash/picomatch/fast-uri/rollup/etc. via vite, storybook, openapi-typescript-codegen, recharts, json-schema-to-typescript |

## Per-package sections

### 1. handlebars — 7 alerts incl. the only Critical

| # | Severity | GHSA | Summary |
|---|----------|------|---------|
| 21 | **Critical** (9.8) | GHSA-2w6w-674q-4c4q | JavaScript Injection via AST Type Confusion |
| 22 | High (8.1) | GHSA-3mfm-83xf-c92r | JS Injection via AST Type Confusion (@partial-block) |
| 24 | High (8.1) | GHSA-xhpv-hc6g-r9c6 | JS Injection via dynamic partial object |
| 25 | High (8.2) | GHSA-xjpj-3mr7-gcpf | JS Injection in CLI Precompiler |
| 17 | Moderate (4.7) | GHSA-2qvq-rjwj-gvw9 | Prototype Pollution → XSS via Partial Template Injection |
| 27 | Moderate (4.8) | GHSA-7rx3-28cr-v5wh | Prototype Method Access Control Gap (__lookupSetter__) |
| 26 | Low (3.7) | GHSA-442j-39wm-28r2 | Property Access Validation Bypass in container.lookup |

- **Manifest:** root `package-lock.json` → `node_modules/handlebars@4.7.8`
- **Parent:** dev-dep `openapi-typescript-codegen@0.30.0` declared in `components/promptlm-api-client/package.json`. handlebars is dev-only (`"dev": true` in lock).
- **Reachability:** `openapi-typescript-codegen` runs at codegen time (`npm run contracts:generate`) to produce the TS client. It is not shipped in any deployed artifact. The handlebars CVEs require attacker-controlled template input, which we do not feed (we use the codegen's own embedded templates). **Risk: low-medium in practice; CVSS-high on paper.**
- **Recommended fix:** add an `npm overrides` block in root `package.json` pinning `handlebars >= 4.7.9`. `openapi-typescript-codegen` declares `handlebars: ^4.7.7`, so 4.7.9 is in-range and should just work.
  ```json
  "overrides": { "handlebars": "^4.7.9" }
  ```
- **Effort:** trivial.
- **Spring Boot dependency:** none.

### 2. vite — 5 alerts

| # | Severity | GHSA | Summary | Affected manifest |
|---|----------|------|---------|-------------------|
| 8 | High | GHSA-p9ff-h696-f583 | Arbitrary File Read via Dev Server WebSocket | tokens-preview (vite 6.4.1) |
| 30 | Moderate | GHSA-4w7w-66w2-5vf9 | Path Traversal in Optimized Deps `.map` | root lock (vite 5.4.21) |
| 9 | Moderate | GHSA-4w7w-66w2-5vf9 | (same) | tokens-preview |
| 3 | Moderate | GHSA-4w7w-66w2-5vf9 | (same) | promptlm-web-ui |
| 34 | Moderate | GHSA-4w7w-66w2-5vf9 | (same) | promptlm-report-static |

- **Direct dev-dep** in three workspaces:
  - `components/promptlm-web-ui/package.json`: `"vite": "^5.4.19"` (resolves 5.4.21)
  - `components/promptlm-report-static/package.json`: `"vite": "^5.4.19"`
  - `components/ui/examples/tokens-preview/package.json`: `"vite": "^6.1.0"` (already on 6.x)
- **Patched version:** 6.4.2 (for the `<= 6.4.1` branch) — so the **5.x users need a major bump 5 → 6**. The 6.x user (tokens-preview) only needs a patch bump 6.4.1 → 6.4.2.
- **Coupling with Storybook:** `promptlm-web-ui` pins `storybook@8.6.15` + `@storybook/react-vite@8.6.15`, which officially supports vite 4.x/5.x. Storybook 9.x supports vite 6.x. So the 5→6 bump in `promptlm-web-ui` is **paired with the storybook 8→9 bump** (see §4).
- **Reachability of high alert:** dev-server-only (path traversal/file-read via dev WebSocket). Only matters if `vite dev` or `vite preview` is exposed beyond localhost. Production builds (`vite build`) are not affected.
- **Recommended fix:**
  - tokens-preview: bump `vite` to `^6.4.2` (in-range, patch bump). Trivial.
  - promptlm-report-static: bump `vite` to `^6.4.2`. Small — uses only `@vitejs/plugin-react` and `vite-plugin-singlefile`, both compatible with vite 6.
  - promptlm-web-ui: bump `vite` to `^6.4.2` **with** storybook 8→9 (see §4). Medium.
- **Effort:** trivial (tokens-preview), small (report-static), medium (web-ui, because of storybook coupling).
- **Spring Boot dependency:** none.

### 3. picomatch — 5 alerts

| # | Severity | GHSA | Range | Affected lock |
|---|----------|------|-------|---------------|
| 13 | High | GHSA-c2c7-rcm5-vvqj | >= 4.0.0, < 4.0.4 | root (4.0.3) |
| 14 | High | GHSA-c2c7-rcm5-vvqj | < 2.3.2 | root (2.3.1 via anymatch/micromatch/readdirp) |
| 15 | Moderate | GHSA-3v7f-55p6-f55p | >= 4.0.0, < 4.0.4 | root (4.0.3) |
| 16 | Moderate | GHSA-3v7f-55p6-f55p | < 2.3.2 | root (2.3.1) |
| 7 | Moderate | GHSA-3v7f-55p6-f55p | >= 4.0.0, < 4.0.4 | tokens-preview (4.0.3) |

- All transitive; pulled in by chokidar / anymatch / micromatch / readdirp under vite, storybook, vitest.
- **Recommended fix:** `npm overrides` pinning `picomatch >= 4.0.4` for the 4.x line, and `picomatch >= 2.3.2` for the 2.x line. Both are compatible patch bumps.
  ```json
  "overrides": {
    "picomatch": "^4.0.4",
    "anymatch": { "picomatch": "^2.3.2" },
    "micromatch": { "picomatch": "^2.3.2" },
    "readdirp": { "picomatch": "^2.3.2" }
  }
  ```
  (The nested overrides keep the major-2 chain on the 2.x line. Verify after `npm install` that no dependency requires the unpatched range.)
- **Effort:** small. Apply to root `package.json` + `components/ui/examples/tokens-preview/package.json`.
- **Spring Boot dependency:** none.

### 4. storybook — 2 alerts (WebSocket hijacking)

| # | Severity | GHSA | Manifest |
|---|----------|------|----------|
| 2 | High | GHSA-mjf5-7g4m-gx5w | components/promptlm-web-ui/package.json |
| 11 | High | GHSA-mjf5-7g4m-gx5w | root package-lock.json (same install) |

- Direct dev-dep `storybook@8.6.15`; patched in `8.6.17`.
- **Recommended fix:** bump all `@storybook/*` packages to `8.6.17` (in-range minor) — does not require the storybook 9 migration. The vite 5→6 + storybook 9 migration discussed in §2 is a separate, larger bump.
- **Reachability:** dev-server-only WebSocket hijacking. Same caveat as vite (only an issue if storybook dev server is exposed beyond localhost).
- **Effort:** trivial (8.6.15 → 8.6.17 is a patch bump).
- **Spring Boot dependency:** none.

### 5. fast-uri — 2 alerts

| # | Severity | GHSA | Range |
|---|----------|------|-------|
| 37 | High | GHSA-q3j6-qgpj-74h6 | <= 3.1.0 — path traversal via percent-encoded dots |
| 38 | High | GHSA-v39h-62p7-jpjc | <= 3.1.1 — host confusion via percent-encoded authority delimiters |

- Transitive `fast-uri@3.1.0` (dev-only); pulled in via ajv (used by openapi-typescript-codegen, json-schema-to-typescript, asyncapi specs).
- **Recommended fix:** `"fast-uri": "^3.1.2"` override.
- **Effort:** trivial.
- **Spring Boot dependency:** none.

### 6. lodash — 2 alerts (runtime scope!)

| # | Severity | GHSA | Summary |
|---|----------|------|---------|
| 29 | High (8.1) | GHSA-r5fr-rjxr-66jc | Code Injection via `_.template` imports key names |
| 28 | Moderate (6.5) | GHSA-f23m-r3pf-42rh | Prototype Pollution via array path bypass in `_.unset`/`_.omit` |

- `lodash@4.17.23` in root `package-lock.json`, `dev: null` (i.e. **runtime**).
- **Parents:** `recharts@2.15.4` (runtime dep of promptlm-web-ui), plus dev parents `@testing-library/jest-dom` and `json-schema-to-typescript`.
- **Reachability:** recharts is a UI library; the React UI bundles lodash into the browser. The `_.template` code-injection CVE only matters if app code passes attacker-controlled `imports` keys to `_.template` — we should `grep -r "_.template\|lodash/template" components/` to confirm. Almost certainly not used. The prototype pollution one requires attacker-controlled path arguments to `_.unset`/`_.omit` — same story.
- **Recommended fix:** `"lodash": "^4.18.0"` override. The 4.18.0 release is API-compatible.
- **Effort:** trivial.
- **Spring Boot dependency:** none.

### 7. postcss — 2 alerts

| # | Severity | GHSA | Manifest |
|---|----------|------|----------|
| 33 | Moderate | GHSA-qx2v-qp2m-jg93 | root (postcss 8.5.8, runtime via web-ui) |
| 31 | Moderate | GHSA-qx2v-qp2m-jg93 | tokens-preview (postcss 8.5.6, dev) |

- XSS via unescaped `</style>` in CSS stringify output. Patched in 8.5.10.
- **Recommended fix:** bump direct `"postcss": "^8.5.6"` in `components/promptlm-web-ui/package.json` to `^8.5.10`. For tokens-preview, this is purely transitive (build-time only) — an override is sufficient.
- **Effort:** trivial.
- **Spring Boot dependency:** none.

### 8. esbuild — 1 alert (moderate)

| # | Severity | GHSA | Range |
|---|----------|------|-------|
| 10 | Moderate | GHSA-67mh-4wv8-2f99 | <= 0.24.2 |

- Root lock shows two esbuild installs: top-level `esbuild@0.25.12` (already patched, dev) **and** a nested `node_modules/vite/node_modules/esbuild@0.21.5` pinned by vite 5.x. The 0.21.5 one is the one Dependabot flags.
- **Recommended fix:** resolved automatically by bumping vite 5 → 6 (see §2). Until then, a nested override would work but is fiddly. Recommend pairing the fix with the vite bump.
- **Reachability:** dev-server only ("any website can send requests to dev server"). Production builds use the already-patched 0.25.x.
- **Effort:** trivial (as part of vite bump); medium standalone.
- **Spring Boot dependency:** none.

### 9. rollup — 1 alert (high)

| # | Severity | GHSA | Range |
|---|----------|------|-------|
| 4 | High | GHSA-mw96-cpmx-2vgc | >= 4.0.0, < 4.59.0 (Arbitrary File Write via Path Traversal) |

- `rollup@4.53.3` in tokens-preview lock; transitive via vite 6.
- **Recommended fix:** override `"rollup": "^4.59.0"` in tokens-preview, or bump tokens-preview vite to 6.4.2 (which pulls a newer rollup).
- **Effort:** trivial.
- **Spring Boot dependency:** none.

### 10. yaml (npm) — 1 alert (moderate)

| # | Severity | GHSA | Range |
|---|----------|------|-------|
| 5 | Moderate | GHSA-48c2-rrv3-qjmp | >= 1.0.0, < 1.10.3 — Stack Overflow via deeply nested YAML |

- `yaml@1.10.2` in tokens-preview lock (deep transitive: `@emotion/babel-plugin` → `babel-plugin-macros@3` → `cosmiconfig@7` → `yaml@1`).
- Note: the root `package.json` and `promptlm-api-client/package.json` use `yaml@^2.x`, which is **not affected**. This alert is specifically the yaml@1 line.
- **Recommended fix:** `"yaml": "^1.10.3"` override scoped to cosmiconfig — or bump `babel-plugin-macros` / `@emotion/babel-plugin` to a version that uses cosmiconfig 8+ (which drops yaml@1 entirely).
- **Reachability:** build-time only (CSS-in-JS babel plugin). Vulnerable code path requires malicious YAML input, which we do not feed.
- **Effort:** small (override) or medium (chain bump).
- **Spring Boot dependency:** none.

### 11. playwright — 1 alert (high)

| # | Severity | GHSA | Range |
|---|----------|------|-------|
| 1 | High | GHSA-7mvr-c777-76hp | < 1.55.1 — browsers downloaded without SSL cert validation |

- Direct dev-dep `@playwright/test@1.49.0` in `acceptance-tests/package.json`.
- **Recommended fix:** bump to `^1.55.1`. Note: acceptance tests have flaky HappyPath issues today (per user memory); the bump should be validated against the existing test suite. Playwright 1.49 → 1.55 is 6 minor versions but generally backward-compatible.
- **Reachability:** matters at `npx playwright install` time (MITM could substitute browser binaries). CI usually pins network egress, so practical risk depends on CI config.
- **Effort:** small (verify tests still run; possibly snapshot-incompatible).
- **Spring Boot dependency:** none.

### 12. pytest — 2 alerts (moderate)

| # | Severity | GHSA | Manifest |
|---|----------|------|----------|
| 36 | Moderate | GHSA-6w46-j5rx-g56g | `.agents/skills/skills-ref/uv.lock` |
| 40 | Moderate | GHSA-6w46-j5rx-g56g | `skills-ref/uv.lock` — **STALE-PATH false positive** (lock file was deleted in commit `8e9d878`, "Cleanup", 2026-05-11) |

- Vulnerable tmpdir handling on Unix multi-user systems. `pytest@9.0.1` → patched `9.0.3`.
- **Reachability:** only used by the `skills-ref` agent-tooling sub-repo. Not part of the deployed Spring Boot app, not run in CI for the webapp.
- **Recommended fix:** for alert #36, bump `pytest` in `.agents/skills/skills-ref/pyproject.toml` from `>=7.0` to `>=9.0.3` and re-lock. For #40, dismiss as stale (the manifest no longer exists at that path).
- **Effort:** trivial.
- **Spring Boot dependency:** none.

### 13. Pygments — 2 alerts (low)

| # | Severity | GHSA | Manifest |
|---|----------|------|----------|
| 35 | Low | GHSA-5239-wwwm-4pmq | `.agents/skills/skills-ref/uv.lock` |
| 39 | Low | GHSA-5239-wwwm-4pmq | `skills-ref/uv.lock` — **STALE-PATH false positive** (same as above) |

- ReDoS via GUID regex. `Pygments@2.19.2` → patched `2.20.0`.
- **Reachability:** Pygments is pulled in by pytest's `rich` dep for traceback formatting. Same reachability story as pytest — agent skills repo only.
- **Recommended fix:** bump pytest (which pulls newer rich → newer Pygments), or add explicit `pygments>=2.20.0` to skills-ref dev deps. For #39, dismiss as stale.
- **Effort:** trivial.
- **Spring Boot dependency:** none.

## Stale-path findings (file as `NEEDS-HUMAN` / dismissal candidates)

| # | Pkg | Reason |
|---|-----|--------|
| 39 | Pygments | `skills-ref/uv.lock` was deleted in commit `8e9d878` on 2026-05-11. Same lock content now lives at `.agents/skills/skills-ref/uv.lock` (alerts #35 still tracks it). |
| 40 | pytest | Same as above. |

Recommendation: do **not** dismiss via API (the task brief disallows blanket dismissals). They will auto-close after Dependabot rescans the deleted manifest; if they linger after the next push, manually dismiss with reason "fix_started" referencing the new path.

## False positives / low practical risk (do not dismiss)

These have CVSS-high scores but minimal real-world reachability in our setup. Still recommended to fix because the fixes are trivial:

- **handlebars (all 7)** — codegen-time only, dev-dep, internal templates.
- **vite/storybook high (#8, #2, #11)** — require attacker reaching the dev server (localhost-only by default).
- **esbuild (#10)** — same dev-server caveat.
- **lodash (#29 high)** — `_.template` code injection requires attacker-controlled `imports`; we do not appear to use `_.template` directly. Worth a `grep -r "_\.template\|lodash/template" components/` before relying on this assessment.

## Recommended remediation sequence

### Phase 1 — Trivial wins, no Spring Boot dependency (target: same sprint)

1. **handlebars override** → `"handlebars": "^4.7.9"` in root `package.json` overrides. Closes 7 alerts incl. the only critical. **(trivial)**
2. **storybook 8.6.15 → 8.6.17** in `promptlm-web-ui` (patch bump). Closes 2 high alerts. **(trivial)**
3. **fast-uri override** → `"fast-uri": "^3.1.2"`. Closes 2 high alerts. **(trivial)**
4. **lodash override** → `"lodash": "^4.18.0"`. Closes 1 high + 1 moderate. **(trivial)**
5. **picomatch overrides** (both 2.x and 4.x lines). Closes 5 alerts. **(small)**
6. **postcss bump** → `"postcss": "^8.5.10"` in `promptlm-web-ui`; override for tokens-preview. Closes 2 moderate alerts. **(trivial)**

After phase 1: ~19 of 33 alerts closed. One PR per package or one batched PR — recommend batched (a single "security: refresh npm transitives via overrides" PR keeps the lockfile churn in one place).

### Phase 2 — Coordinated bumps

7. **vite 5 → 6.4.2 + storybook 8 → 9 in `promptlm-web-ui`**. Closes 1 high + 1 moderate (vite alerts) and resolves the nested-esbuild moderate alert. Storybook 9 migration is the only non-trivial step; refer to `https://storybook.js.org/docs/migration-guide`. **(medium — needs Storybook story validation)**
8. **vite 5 → 6.4.2 in `promptlm-report-static`**. Only uses `@vitejs/plugin-react` + `vite-plugin-singlefile`, both vite-6 compatible. **(small)**
9. **vite 6.1 → 6.4.2 in `tokens-preview`** (patch). Closes the high `GHSA-p9ff-h696-f583` alert and pulls newer rollup. **(trivial)**

### Phase 3 — Adjacent ecosystems

10. **Playwright 1.49 → 1.55.1** in `acceptance-tests/`. Validate against the flaky HappyPath suite. **(small — testing risk)**
11. **`skills-ref` pytest → 9.0.3 + Pygments → 2.20.0** via `uv lock --upgrade`. **(trivial; not on the deployed-app critical path)**
12. **yaml@1 override** in tokens-preview, or bump `@emotion/babel-plugin` to flush cosmiconfig 7 → 8. **(small)**

### Phase 4 — Dismiss stale-path alerts

13. After phase 1–3 lands and Dependabot rescans, the two `skills-ref/uv.lock` alerts (#39, #40) should auto-close. If they don't, manually dismiss with reason "fix_started".

## Cross-cutting notes

- **No Spring Boot bump is required for any of these alerts.** The triage brief asked us to sequence Spring-Boot-dependent fixes separately; that pile is empty for this batch.
- **No platform-BOM (PR #231) dependency.** All fixes live in `package.json` files inside `promptlm-app`. The parent-POM extraction can proceed in parallel without coordinating with this work.
- **Test impact:** the riskiest bumps are (a) storybook 8 → 9 and (b) playwright 1.49 → 1.55. Everything else is patch-level. Recommend running `npm --workspace @promptlm/web-ui run storybook:build` and `npx playwright test` in CI for those phases.
- **Override hygiene:** each `npm overrides` entry should carry a comment-style sibling entry (e.g. a top-level `_overridesNote` field) noting the GHSA it closes, so future devs know why the version is pinned. Alternatively, add a `SECURITY.md` table.

## Raw alert dump

The raw JSON used for this triage is at `/tmp/dependabot-triage/alerts.json` (33 alerts, 2026-05-20). Re-pull via:
```
gh api '/repos/promptLM/promptlm-app/dependabot/alerts?state=open&per_page=100' --paginate
```
