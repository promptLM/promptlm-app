# {{REPO_NAME}}

This repository contains prompts for {{PROJECT_DESCRIPTION}}.

## Prompts

Add your prompts to the `prompts/` directory. Each prompt can be a separate file or organized in subdirectories.

## Usage Modes

This repository can be used in one of two modes. The mode is selected by the `release.enabled` flag in `promptlm.yml`.

### Mode 1 — Prompt management (default)

Use this repository as a plain git store for your prompts. Edit prompts under `prompts/`, commit, push. The included build and deploy workflows stay no-ops unless `.promptlm/artifacts.toml` is configured, so you can ignore them.

### Mode 2 — Prompt releases (opt-in)

Use GitHub Actions to validate, package, and publish your prompts as versioned artifacts. Set `release.enabled: true` in `promptlm.yml`, configure `.promptlm/artifacts.toml`, and tag a commit (`vX.Y.Z`) to cut a release.

If you also need to publish to Artifactory, set the variables and secrets listed under [Environment Variables](#environment-variables).

## GitHub Actions Workflows

The generated repository ships with a small set of GitHub Actions workflows under `.github/workflows/`. Which workflows are present depends on this repository's configuration.

### 📦 Artifact build (`build-artifacts.yml`)

- **Triggers**: Manual dispatch.
- **Actions**: Builds prompt artifacts for Java, Python, and JS based on `.promptlm/artifacts.toml`.
- **Behavior**: If no targets are configured, the build is skipped (no error).

### 🚀 Artifact deploy (`deploy-artifacts.yml`)

- **Triggers**: Tag push (`v*`), manual dispatch.
- **Actions**: Builds artifacts and publishes them when `deploy.enabled=true` in `.promptlm/artifacts.toml`.
- **Behavior**: Deployment is skipped when disabled or when no targets are configured.

### ✅ Prompt validation (`validate.yml`) — when release capability is enabled

- **Triggers**: Push, pull request.
- **Actions**: Validates prompts before packaging (non-empty prompt files, required metadata fields).
- **Availability**: Present when `release.enabled: true` in `promptlm.yml`.

### 🏷️ Release (`release.yml`) — when release capability is enabled

- **Triggers**: Tag push (`v*.*.*`), manual dispatch.
- **Actions**: Validates, packages, generates a release manifest with checksums, and publishes a GitHub Release.
- **Availability**: Present when `release.enabled: true` in `promptlm.yml`.

### 🏭 Deploy to Artifactory (`deploy-artifactory.yml`) — when Artifactory deployment is configured

- **Triggers**: Push to `main`, manual dispatch.
- **Actions**: Resolves version, builds in-place, and deploys artifacts to Artifactory.
- **Availability**: Present when Artifactory deployment is configured. Requires the variables and secrets listed under [Environment Variables](#environment-variables).

## Environment Variables

For `deploy-artifactory.yml`, configure these repository variables or secrets when you want the generated repository to publish to Artifactory:

- `ARTIFACTORY_URL`: Base Artifactory URL, for example `https://artifactory.example.com/artifactory`
- `ARTIFACTORY_REPOSITORY`: Target Maven repository key
- `ARTIFACTORY_USERNAME`: Artifactory deploy username
- `ARTIFACTORY_PASSWORD`: Artifactory deploy password or token

Optional checkout overrides:

- `REPO_REMOTE_URL`: Override checkout remote URL for nonstandard runner/network topologies
- `REPO_REMOTE_USERNAME`: Override checkout username when `REPO_REMOTE_URL` is set
- `REPO_REMOTE_TOKEN`: Override checkout token when `REPO_REMOTE_URL` is set

In normal GitHub or Gitea workflows, the checkout logic should usually rely on `${{ github.server_url }}` and `${{ github.token }}` instead of these overrides.

## Usage

1. Add your prompt specifications to the `prompts/` directory.
2. Update `.promptlm/prompts-meta.json` with metadata.
3. Configure `.promptlm/artifacts.toml` (including `project.version`) for optional artifact builds and deployment.
4. Push changes to `main` to trigger configured workflows.
5. Use manual workflow dispatch for controlled artifact builds or deploys when needed.

## License

Specify your project's license here.
