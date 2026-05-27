# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - TBD

### Added

- Initial public release of promptLM.
- `promptlm-domain` — core domain model: `PromptSpec`, `ChatCompletionRequest/Response`, prompt lifecycle types.
- `promptlm-store` — store API and GitHub-backed store implementation.
- `promptlm-lifecycle` — prompt lifecycle management.
- `promptlm-execution` — `PromptGateway` SPI and shared execution model.
- `promptlm-execution-springai` — OpenAI and Anthropic vendor clients backed by Spring AI.
- `promptlm-execution-litellm` — LiteLLM Docker-managed gateway with auto-configuration, container lifecycle management, and readiness probing.
- `promptlm-cli` — command-line interface with native (GraalVM) build.
- `promptlm-webapp` / `promptlm-web-ui` — promptLM Studio web application.
- Java and TypeScript client SDKs for consuming released prompts.
