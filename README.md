# promptLM

AI Prompt Lifecycle Management — structured, testable, yours.

promptLM is an open-source framework designed to bring modern software engineering discipline to prompt-driven systems. The project packages requirements modelling, evaluation, deterministic replay, and distribution into one workflow so teams can ship AI functionality with confidence.

## Why promptLM

- **Build with structure:** Define prompts via declarative specifications backed by MCP tools and templating.
- **Evaluate with confidence:** Combine built-in and custom evals to check model behaviour across scenarios and prevent regressions.
- **Version everything:** Track prompt changes like code with full history, diff views, and release tagging.
- **Deploy safely:** Apply automated guardrails and approvals to ship prompts to production environments.
- **Distribute anywhere:** Publish through a prompt server, dependency packages, or direct repo access so consumers choose the retrieval flow that fits their stack.
- **Test deterministically:** Snapshot LLM and tool responses to replay executions for fast, zero-cost regression suites.

## Project Status

🚧 **Early Alpha** — We are actively shaping the workflow and ecosystem. APIs and file layouts may change quickly while we validate the developer experience.

## Roadmap Highlights

- ✅ Command-line and web UI authoring for prompt specs
- ✅ Evaluation presets and custom eval integration
- ✅ Replay engine for recorded LLM/tool responses
- ⏳ Prompt server & package-based distribution channels
- ⏳ Opinionated CI/CD templates for prompt releases
- ⏳ Documentation site (AsciiDoc + GitHub Pages) with tutorials and reference guides

## Get Involved

We are looking for committed collaborators to help build the foundation:

- **Prompt engineers** to shape authoring ergonomics and eval libraries
- **Toolsmiths** to expand MCP/test harness integrations
- **DevOps maintainers** to design distribution and release workflows
- **Documentation writers** to help capture the lifecycle and best practices

If you want to help define the future of prompt lifecycle management:

1. Star the repo and share ideas via issues or Discussions.
2. Open a PR with your proposal or implementation (please reference an issue or start a thread first).
3. Introduce yourself in the "Contributors" discussion — we want to elevate early committers into the core team.

## Contributing

We aim to keep onboarding lightweight during Alpha:

1. Fork the repository and create a feature branch.
2. Implement changes with concise commits and clear descriptions.
3. Add or update documentation/evals relevant to your change.
4. Open a Pull Request and request feedback. We strive for fast, collaborative reviews.

Check the issue tracker for **good first issues** and **help wanted** tags. If you have ideas that are not listed, open a proposal issue — we love sparring on roadmap direction.

## License

promptLM is released under the MIT License.
