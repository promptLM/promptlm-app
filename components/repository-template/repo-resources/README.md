# {{REPO_NAME}}

This repository contains prompts for {{PROJECT_DESCRIPTION}}.

## Prompts

Add your prompts to the `prompts/` directory. Each prompt can be a separate file or organized in subdirectories.

## GitHub Actions Workflows

This repository includes a minimal set of pre-configured GitHub Actions workflows:

### 📦 **Artifact Build Workflow** (`.github/workflows/build-artifacts.yml`)
- **Triggers**: Manual dispatch
- **Actions**: Builds prompt artifacts for Java, Python, and JS based on `.promptlm/artifacts.toml`.
- **Behavior**: If no targets are configured, the build is skipped (no error).
- **Notes**: Each language builds in its own job; add/remove targets in the manifest to control which jobs do real work.

### 🚀 **Artifact Deploy Workflow** (`.github/workflows/deploy-artifacts.yml`)
- **Triggers**: Tag push (`v*`), manual dispatch
- **Actions**: Builds artifacts and publishes them when `deploy.enabled=true` in `.promptlm/artifacts.toml`.
- **Behavior**: Deployment is skipped when disabled or when no targets are configured.

### 🔄 **CI Workflow** (`.github/workflows/ci.yml`)
- **Triggers**: Push to `main`
- **Actions**: Builds and tests the prompt repository, generates test-support artifacts, and uploads outputs.

### 🏭 **Deploy to Artifactory** (`.github/workflows/deploy-artifactory.yml`)
- **Triggers**: Push to `main`, manual dispatch
- **Actions**: Resolves version, builds in-place, and deploys artifacts to Artifactory.
- **Requirements**: Artifactory configuration in `.github/artifactory-config.yml` and matching repository variables/secrets.

## Test Support Generation

The repository automatically generates WireMock stub mappings from your prompt specifications using the promptLM test support generator. This enables:

- **Automated testing**: Generated stubs mock LLM API responses based on your prompts
- **CI/CD integration**: Test artifacts are built and uploaded with each change
- **Consistent testing**: Same prompts used in production are available for testing

## Environment Variables

For `.github/workflows/deploy-artifactory.yml`, configure these repository variables or secrets when you want the generated repository to publish to Artifactory:

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

1. Add your prompt specifications to the `prompts/` directory
2. Update `.promptlm/prompts-meta.json` with metadata
3. Configure `.promptlm/artifacts.toml` (including `project.version`) for optional artifact builds and deployment
4. Push changes to `main` to trigger CI workflows as configured
5. Use manual workflow dispatch for controlled artifact builds or deploys when needed

## Workflow Archive

Deprecated or optional workflow variants are kept in
`components/repository-template/workflow-archive/` in the PromptLM monorepo.
Only the minimal runtime set is shipped in this template archive.

## License

Specify your project's license here.
