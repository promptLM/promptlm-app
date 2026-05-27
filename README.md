# promptLM

[![CI](https://github.com/promptLM/promptlm-app/actions/workflows/CI.yml/badge.svg)](https://github.com/promptLM/promptlm-app/actions/workflows/CI.yml)
[![Release](https://github.com/promptLM/promptlm-app/actions/workflows/release.yml/badge.svg)](https://github.com/promptLM/promptlm-app/actions/workflows/release.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

promptLM is an open-source framework for managing the full lifecycle of LLM
prompts — authoring, versioning, releasing, and consuming them from your
application — backed by a Git-native store so every prompt has a real commit
history, branches, and release tags. It ships as a CLI, a Studio web app, and
client SDKs (Java, TypeScript).

## Quick install

Pre-built native binaries for macOS, Linux, and Windows are attached to each
GitHub release once `0.1.0` is cut. Until then, build from source — see
[DEVELOPER.md](DEVELOPER.md).

```bash
# macOS / Linux (once a release is published)
curl -fsSL https://raw.githubusercontent.com/promptLM/promptlm-app/main/scripts/install.sh | bash
```

```powershell
# Windows (once a release is published)
$script = irm https://raw.githubusercontent.com/promptLM/promptlm-app/main/scripts/install.ps1
& ([scriptblock]::Create($script))
```

Verify:

```bash
promptlm-cli --version
```

## Documentation

The full user and developer documentation is published at
[promptlm.dev/docs](https://promptlm.dev/docs) and sourced from [docs/](docs/) —
covering installation, CLI usage, REST and SSE APIs, client SDKs, the LiteLLM
gateway, the Spring AI execution backends, and the development quickstart.

- [CONTRIBUTING.md](CONTRIBUTING.md) — how to build, test, and submit changes
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — community expectations
- [SECURITY.md](SECURITY.md) — responsible disclosure policy
- [CHANGELOG.md](CHANGELOG.md) — release notes

## License

Apache License 2.0 — see [LICENSE](LICENSE).
