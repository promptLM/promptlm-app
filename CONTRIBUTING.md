# Contributing to promptLM

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository and clone your fork.
2. Build the project: `mvn clean verify`
3. Create a feature branch: `git checkout -b feat/your-feature`

## Making Changes

- Follow the existing code style and package structure.
- Add or update tests for every change.
- Run the full build before opening a pull request: `mvn clean verify`

## License Headers

All source files must include the Apache 2.0 license header.
Install the pre-commit hook once to have it applied automatically:

```bash
brew install pre-commit
pre-commit install
```

## Pull Requests

- Keep pull requests focused — one concern per PR.
- Reference any related issue in the PR description.
- All CI checks must pass before a PR can be merged.

## License

By contributing you agree that your contributions will be licensed under the
[Apache License 2.0](LICENSE).
