# Releasing promptlm-app

This document describes how to cut a release of the promptLM CLI and
Studio web application from this repository.

## Versioning

The artifact line `dev.promptlm:promptlm-app` follows semver:

- **Major (`X.0.0`)** — at least one user-facing breaking change (a CLI
  flag removed, a REST endpoint signature change, a prompt-storage format
  incompatible with the previous major, etc.).
- **Minor (`X.Y.0`)** — additive: new CLI command, new REST endpoint,
  new module under `components/`, dependency minor bump.
- **Patch (`X.Y.Z`)** — bugfix only; no user-visible API change.

While on the `0.x` line, the API surface is treated as not-yet-stable
and minor bumps may include breaking changes.

## Cutting a release

The release is fully driven by [`.github/workflows/release.yml`](.github/workflows/release.yml).

1. Open a tracking issue titled `release: promptlm-app X.Y.Z`.
2. Confirm the inherited `promptlm-parent` version is published to
   GitHub Packages and that the `<parent><relativePath/></parent>`
   element resolves to that published version (rather than a sibling
   working tree).
3. Confirm `main` is green and free of unresolved high/critical
   Dependabot alerts that affect runtime scope.
4. Run the **Release** workflow from the Actions tab with the
   `release_type` input (`major` / `minor` / `patch`). The workflow:
   - computes the next version from the current `-SNAPSHOT`,
   - runs JVM verify + acceptance tests + native-image matrix + native
     smoke,
   - cuts a GitHub Release tagged `v<X.Y.Z>`,
   - attaches the fat jars and native binaries (Linux / macOS / Windows
     × x64 / arm64) plus a `SHA256SUMS` file,
   - publishes Maven artifacts to GitHub Packages.
5. After the workflow finishes, `main` is bumped to the next
   `-SNAPSHOT` automatically.

## Changelog

The canonical changelog is the
[GitHub releases page](https://github.com/promptLM/promptlm-app/releases),
auto-aggregated from PR titles by the release workflow. `CHANGELOG.md`
in the repo carries a hand-curated section per release for highlights,
breaking changes, and migration notes that supplement the auto-generated
list.
