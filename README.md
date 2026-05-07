# Agent Skills

Reusable AI agent skills for IDE assistants. Drop them into any project and your
agent (Windsurf Cascade, Codex, etc.) gains structured capabilities like fixing
bugs, checking OSS readiness, and more.

## Skills

<!-- SKILL_TABLE_START -->
| Skill | Description |
|---|---|
| [bugfix](skills/bugfix/) | Fix a bug in the code using available issue tracking tools. |
| [check-oss-readiness](skills/check-oss-readiness/) | Check module or project for open source readiness and offers fixes to user (3 supporting files) |
| [research-methodology](skills/research-methodology/) | Print the canonical orchestrated-research methodology — the rules, prompt template, deliverable shape, and failure modes that govern research-programme and research-topic. Read once per project. Also registers a pointer to the research dossier in AGENT.md so future agents can find it. |
| [research-programme](skills/research-programme/) | Bootstrap a verified multi-topic research programme — orchestrated sub-agents producing a pre-implementation design dossier. Calls research-topic for each topic; rules in research-methodology. |
| [research-topic](skills/research-topic/) | Dispatch one research topic with the hardened sub-agent template (verification clause, anti-stall, injection-defence). Run a critic pass, distil into findings/NN-<topic>.md, archive the transcript, update the working set. Called by research-programme; can also be used standalone. |
| [spring-boot-test-authoring](skills/spring-boot-test-authoring/) | Write, review, and refactor high-quality Spring Boot 4 tests with strict conventions. Use when choosing between Spring test slices and full-context tests, creating Testcontainers-backed integration tests with @ServiceConnection, writing Spring Modulith module tests, enforcing JUnit 6 naming/assertion style, or adding deterministic test quality gates. |
<!-- SKILL_TABLE_END -->

Each skill lives in its own directory under `skills/`. The agent reads `SKILL.md`
when the skill is invoked. This table is auto-generated — see
[scripts/update-skill-table.sh](scripts/update-skill-table.sh).

### Skill bundles

Some skills work as coordinated sets. Use them together for the listed workflow.

- **Research bundle** — `research-methodology` + `research-programme` + `research-topic`.
  Orchestrated multi-topic research producing a pre-implementation design dossier with a verified sub-agent harness, working-set / archive separation, and a mandatory critic pass per topic. Read `research-methodology` once per project; `research-programme` bootstraps a programme and calls `research-topic` per item in the backlog.

## Quick start (curl)

Run this from your project root:

```bash
curl -fsSL https://raw.githubusercontent.com/promptics/agentskills/main/install.sh | bash
```

Pin to a specific release:

```bash
curl -fsSL https://raw.githubusercontent.com/promptics/agentskills/main/install.sh | bash -s v1.0.0
```

Then commit:

```bash
git add .agents/skills && git commit -m "Import agent-skills"
```

**Bundles install together.** Skills that belong to a coordinated bundle (see [Skill bundles](#skill-bundles)) are installed alongside everything else — `install.sh` is whole-repo, no per-bundle flag needed. After install, all bundle members are present under `.agents/skills/<skill>/`. Read the bundle's anchor skill (e.g. `research-methodology` for the research bundle) first to understand how the members cooperate.

## Git subtree (recommended for your own repos)

Subtree keeps the skills as normal tracked files — no submodule init dance, and
`git clone` just works for all contributors.

```bash
# First import
git subtree add --prefix=.agents/skills \
  https://github.com/promptics/agentskills.git main --squash

# Update later
git subtree pull --prefix=.agents/skills \
  https://github.com/promptics/agentskills.git main --squash
```

Tip: add a Makefile target so the team doesn't have to remember the command:

```makefile
.PHONY: update-skills
update-skills:
	git subtree pull --prefix=.agents/skills \
	  https://github.com/promptics/agentskills.git main --squash
```

## Updating

- **Subtree users:** `git subtree pull` (or `make update-skills`)
- **Curl users:** re-run `install.sh`, review the diff, commit

Both methods support tags instead of `main` for version pinning.

## Compatibility

These skills work with any IDE agent that reads `.agents/skills/` directories:

- **Windsurf** — Cascade discovers skills automatically
- **Codex** — supports the `.agents/skills/` convention
- **Other agents** — any tool that can read Markdown skill files

## Related Resources

- [The complete guide to build Agentskills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)
- [agentskills.io](https://agentskills.io/) — The official Agent Skills format documentation
- [agentskills.so](https://agentskills.so/) — Community platform for Agent Skills
- [agentskillsdb.com](https://www.agentskillsdb.com/) — Database of available Agent Skills
- [Anthropic Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) — Original spec and announcement from Anthropic

## Install Slash Commands

This repo also ships ready-to-use Claude Code slash commands under `commands/`. The snippets below pull each command directly from GitHub into the current project's `.claude/commands/` — run them from your project root, no edits required.

Install all bundled commands:

```bash
mkdir -p .claude/commands
curl -L https://github.com/promptics/agentskills/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=2 -C .claude/commands \
      agentskills-main/commands/code-review \
      agentskills-main/commands/repo-cleanup-audit \
      agentskills-main/commands/github-issue-delivery \
      agentskills-main/commands/discovery-interview
```

Or install a single command (pick the one you want):

```bash
# code-review (available as /code-review:review)
mkdir -p .claude/commands && curl -L https://github.com/promptics/agentskills/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=2 -C .claude/commands agentskills-main/commands/code-review

# repo-cleanup-audit (available as /repo-cleanup-audit:audit)
mkdir -p .claude/commands && curl -L https://github.com/promptics/agentskills/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=2 -C .claude/commands agentskills-main/commands/repo-cleanup-audit

# github-issue-delivery (available as /github-issue-delivery:deliver-issue)
mkdir -p .claude/commands && curl -L https://github.com/promptics/agentskills/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=2 -C .claude/commands agentskills-main/commands/github-issue-delivery

# discovery-interview (available as /discovery-interview:interview)
mkdir -p .claude/commands && curl -L https://github.com/promptics/agentskills/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=2 -C .claude/commands agentskills-main/commands/discovery-interview
```

See each command's `README.md` (e.g. [`commands/code-review/README.md`](commands/code-review/README.md)) for usage details and how to expose the bare command name (e.g. `/review` instead of `/code-review:review`).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add or improve skills, and
[DEVELOPER.md](DEVELOPER.md) for repo internals (hooks, CI, automation).

## License

Apache-2.0 — see [LICENSE](LICENSE).
