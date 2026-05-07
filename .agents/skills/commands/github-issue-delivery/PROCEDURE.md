# GitHub issue delivery — procedure

Canonical, agent-neutral workflow for delivering one or more GitHub issues end-to-end with role discipline, tests, review, security analysis, and a sprint demo.

This document is the single source of truth for the procedure. The Claude Code slash command at `deliver-issue.md` is a thin wrapper around it. Other agents can ingest this file directly.

The agent running this procedure acts as the **orchestrator** and may simulate the other roles inline or delegate them to subagents. Pick the smallest team the issue actually needs.

## Scope

Use this procedure when:

- One or more GitHub issues need delivery end-to-end.
- The user wants traceable, reviewable, testable delivery (not a quick patch).
- The change plausibly touches user-facing behavior, security, data, or public APIs.

Do **not** use it for one-off code edits, single-file refactors, or tasks unrelated to issue tracker delivery — the overhead is not worth it.

## Mandatory artifacts

Six files under `.claude/issue-delivery/` by default. If the repo already uses `.ai/`, `docs/decisions/`, or another convention, follow it and record the deviation in the decision log. Don't drop these directly into `.claude/` — that's where Claude Code keeps `settings.json` and other runtime state.

There are **two kinds** of artifact and they have different lifecycle rules.

**Append-only logs** — never overwrite, never edit prior entries:

- `.claude/issue-delivery/progress-log.md` — timestamped milestones
- `.claude/issue-delivery/decision-log.md` — material decisions

**Current-state documents** — rewritten as the work evolves; archive the previous version under `.claude/issue-delivery/archive/<YYYY-MM-DD-HHMM>/` before replacing (use `scripts/archive-current-state.sh`):

- `.claude/issue-delivery/implementation-plan.md` — the current plan
- `.claude/issue-delivery/review-report.md` — latest review-loop findings
- `.claude/issue-delivery/security-report.md` — threat model, findings, pen-test results
- `.claude/issue-delivery/sprint-review-demo.md` — final demo write-up

Templates: [`log-templates/`](log-templates/). Entry formats: [`log-formats.md`](log-formats.md). Initialization: `scripts/init-artifacts.sh <dir>`. Append a milestone: `scripts/append-progress.sh <dir> "<heading>"`.

> **Script paths.** All `scripts/...` paths in this document are relative to the install directory of this command. Under Claude Code that's `.claude/commands/github-issue-delivery/`, so the agent should call `.claude/commands/github-issue-delivery/scripts/init-artifacts.sh ...`. Other clients should substitute their install path.

If the user explicitly asks for a clean run, archive **everything** (logs included) first — never delete history.

## Roles

Use the smallest set the issue requires; don't invoke roles that add no value.

| Role | When to use | Owns |
|---|---|---|
| **orchestrator** | Always | Sequencing, integration, user comms, logs |
| **product-owner** | Issue is ambiguous, user-facing change, missing acceptance criteria | Acceptance criteria, demo scenarios, issue updates |
| **architect** | Touching multiple modules, public APIs, data flow, or non-trivial design | Design fit, files-to-change list, architectural risks |
| **xp-driver** + **xp-navigator** | Implementation step | Driver writes; navigator reviews continuously |
| **test-engineer** | Always (before merge) | Verification matrix, user-facing tests first |
| **security-analyst** | Any change to input handling, authn/authz, data, network, files, deps, secrets, public APIs | Threat model, security findings |
| **penetration-tester** | Externally reachable or security-sensitive behavior | Authorized adversarial testing |
| **code-reviewer** | Always (review loop) | Correctness, simplicity, regression risk |
| **demo-lead** | Always (final step) | Sprint-review write-up |

Detailed role missions, outputs, and the subagent task-brief format: [`team-roles.md`](team-roles.md).

When delegating to subagents, run them in parallel only for **independent, read-only** work (e.g. architecture survey + test-strategy survey). Never run parallel agents that edit the same files.

## Workflow

12 steps. Track progress as you go:

- [ ] 1. Initialize logs and state
- [ ] 2. Read & analyze GitHub issues
- [ ] 3. Repo & architecture analysis
- [ ] 4. Clarify with user (only if blocking)
- [ ] 5. Update GitHub issues with clarified scope
- [ ] 6. Write implementation plan
- [ ] 7. Implement with XP pair engineering
- [ ] 8. Verify (user-facing tests first)
- [ ] 9. Mandatory review loop
- [ ] 10. Security analysis + pen-testing (if applicable)
- [ ] 11. Sprint-review demo write-up
- [ ] 12. Final issue updates and user summary

### 1. Initialize state and logs

**Goal.** Make the work auditable from the start.

1. Confirm repo root (`git rev-parse --show-toplevel`) and current branch (`git branch --show-current`).
2. `git status` to capture working-tree state.
3. Decide artifact directory: `.claude/issue-delivery/` by default. If the repo uses a different convention, follow it and log the choice.
4. Create artifact files: `scripts/init-artifacts.sh .claude/issue-delivery` (idempotent — never overwrites).
5. Append an initial progress-log entry with timestamp, repo path, branch, issues in scope, and current assumptions: `scripts/append-progress.sh .claude/issue-delivery "Initialized"`.

**Do not.** Overwrite existing logs. If the user explicitly requested a clean run, archive everything under `archive/<YYYY-MM-DD-HHMM>/` first — never delete history.

### 2. Read and analyze GitHub issues

**Owner.** product-owner.

1. Use `gh issue view <N>` (or the GitHub MCP tools, preferred when both are available). For convenience, the slash command pre-loads issues via `scripts/load-issues.sh` at invocation time.
2. Read each issue's description, comments, labels, milestones, and linked issues.
3. If specific issue numbers were provided, prioritize those; otherwise identify likely-relevant open issues and proceed unless scope is genuinely ambiguous.

**Extract per issue.**

- Number + title
- User problem
- Expected behavior
- Acceptance criteria
- Non-goals / implied scope limits
- Affected components
- Labels, priority, milestone, assignees
- Dependencies / linked issues
- Ambiguities / missing info
- Product risk level
- Candidate demo scenario

**Output.** Append issue analysis to the progress log. Add product-scope decisions to the decision log when they matter.

### 3. Repository and architecture analysis

**Owners.** architect, test-engineer, security-analyst (read-only — these can run in parallel).

1. Inspect: `README`, `CONTRIBUTING`, `CLAUDE.md`, `AGENTS.md`, architecture docs, package manifests, build files, CI config.
2. Map relevant modules, boundaries, APIs, data flow, configuration, conventions.
3. Identify likely files to change.
4. Capture test framework, test commands, build, lint, typecheck, format commands.
5. Identify trust boundaries, sensitive data flows, input surfaces, authn/authz, network boundaries, file handling, dependency risks.

**Output.** Append to `implementation-plan.md`: architecture summary; relevant files/modules; test + CI summary; verification command candidates; security and privacy notes; initial implementation constraints.

### 4. Clarify with the user (only if blocking)

**Owners.** orchestrator, product-owner; pull in architect or security-analyst when relevant.

Ask the user **only** when missing info blocks correct or safe implementation — product behavior, scope, public-API compatibility, data migration, security posture, irreversible actions. Do not ask about anything that can be inferred from issues, repo conventions, tests, docs, product copy, or API behavior.

**When asking, include.**

1. A concise summary of your understanding.
2. Only the essential open questions.
3. A recommended default for each.
4. Which decisions block implementation and which assumptions you'll proceed on regardless.

**When not asking.** State the assumptions you'll proceed with and continue.

**Output.** Log questions, defaults, and assumptions in the progress log.

### 5. Adjust GitHub issues after clarification

**Owners.** product-owner, orchestrator.

Posting an issue comment is an externally visible action. Before posting, surface the proposed comment text to the user and get explicit per-issue confirmation. After confirmation (and if GitHub write access is available), post the comment with: clarified acceptance criteria, scope/non-goals, dependencies, security considerations, demo scenarios. (Templates: [`github-issue-templates.md`](github-issue-templates.md).)

**Do not.** Close issues unless the user explicitly asked or repo conventions clearly indicate it. One per-issue confirmation does not authorize comments on others.

**Fallback.** If no write access, write the proposed comment into `implementation-plan.md` and log the limitation.

### 6. Implementation planning

**Owners.** orchestrator + product-owner + architect + test-engineer + security-analyst.

**Plan must contain.**

- Objective
- Issue scope
- Product assumptions
- Acceptance criteria
- Demo scenarios
- Architecture approach
- Workstreams (each mapped to ≥1 acceptance criterion)
- XP pair-engineering plan
- Parallelization plan (independent slices only)
- Files likely to change
- Verification matrix (criterion → test → command)
- Tests to add/update — user-facing first, then unit
- Threat-model summary
- Pen-test scope (if applicable)
- Rollback plan
- Open risks

Prefer **vertical slices** that can be demoed end-to-end over horizontal layers.

**Pause and re-clarify if.** The change is destructive, alters public APIs, performs data migrations, modifies authn/authz, or has unresolved product decisions.

**Output.** `implementation-plan.md` is a current-state document. Archive any previous version with `scripts/archive-current-state.sh .claude/issue-delivery` before rewriting, then write the new plan.

### 7. Execute implementation with XP pair

**Owners.** xp-driver + xp-navigator; test-engineer alongside; security-analyst on sensitive slices.

**Loop per slice.**

1. **Driver** implements a small vertical slice (prefer something demoable end-to-end).
2. **Navigator** reviews direction, acceptance alignment, edge cases, naming, architecture, test coverage.
3. **test-engineer** adds/updates tests with the change.
4. **security-analyst** reviews the slice if it touches a sensitive surface.
5. Repeat until the agreed scope is complete.

**Rules.**

- Keep changes focused and minimal.
- Match repo style.
- Prefer user-facing tests for acceptance evidence.
- Add unit tests for edge cases and fast diagnosis.
- No unrelated refactors or broad rewrites.
- Stop and escalate on unresolved product, architecture, security, or destructive decisions.

**Logging.** Append progress-log entries at meaningful milestones with `scripts/append-progress.sh`. Record material decisions in the decision log.

### 8. Verification

**Owners.** test-engineer, orchestrator.

Run, in this priority order, what the repo actually defines:

1. User-facing acceptance tests
2. End-to-end tests
3. Integration tests
4. API contract tests
5. CLI behavior tests
6. UI behavior tests
7. Unit tests
8. Type check
9. Lint
10. Build
11. Format
12. Dependency / security audit
13. Manual reproduction for user-visible behavior
14. Regression checks around touched areas

Every acceptance criterion must have a verification path.

**On failure.** Diagnose root cause → fix if in scope → re-run → record in progress log.

**If a check can't run** in this environment, document why, the exact command that should be run later, residual risk, and suggested mitigation.

**Output.** Append verification evidence to `review-report.md` and `sprint-review-demo.md`.

### 9. Mandatory review loop

Run **at least one** formal review pass after implementation and initial verification.

**Reviewers.** code-reviewer, test-engineer, security-analyst. Add penetration-tester if externally reachable; architect if architecture moved; product-owner if user-visible behavior changed.

**Process.**

1. Summarize the diff.
2. Review against acceptance criteria, architecture, tests, maintainability, security.
3. Classify findings: **blocker / high / medium / low / note**.
4. Fix all blockers and highs unless explicitly out of scope.
5. Fix mediums when reasonable and safe.
6. Record unresolved findings with rationale.
7. Re-run relevant verification after fixes.

**Required perspectives.** Correctness; user-facing behavior; regression risk; test coverage; error handling; edge cases; maintainability; security; privacy; performance (where relevant); accessibility (where relevant).

**Output.** `review-report.md` is a current-state document — archive before rewriting (`scripts/archive-current-state.sh`).

### 10. Security analysis and pen-testing

**Required when** the change touches: user input, authn/authz, data storage or access, logging, networking, file handling, dependencies, secrets, payments, admin functionality, public APIs.

**security-analyst tasks.** Lightweight threat model (assets, trust boundaries, attackers, abuse cases, sensitive flows). Review authn/authz, input validation, output encoding, error handling, logging, secrets, dependencies. Recommend mitigations and tests. The threat-model review is read-only and does not require additional authorization.

**Authorization gate for adversarial testing.** Before any pen-test action, the orchestrator must (a) state the proposed scope (targets, attack classes, expected side effects), (b) get explicit user confirmation, and (c) record the confirmation in `security-report.md` under "Authorization confirmation". Authorization covers only the recorded scope — broadening scope requires a fresh confirmation.

**penetration-tester tasks.** Only after the authorization gate. Within authorized local/test boundaries, attempt: injection, XSS, CSRF, SSRF, IDOR, path traversal, unsafe upload, auth bypass, privilege escalation, sensitive data exposure, error disclosure, business-rule bypass.

**Hard limits.**

- No attacks on third-party or production systems.
- No exfiltration of real secrets, credentials, or user data.
- No destructive actions.

**Output.** `security-report.md` — current-state document, archive before rewriting.

### 11. Sprint-review demo

**Owner.** demo-lead.

`sprint-review-demo.md` must contain:

- Issue(s) addressed
- User problem solved
- User-visible behavior — before vs. after
- Demo script / steps
- Acceptance-criteria checklist
- Screenshots, command transcripts, API examples, CLI examples, or UI flows where applicable
- Tests + verification evidence
- Review-loop summary
- Security review + pen-test summary
- Known limitations
- Recommended follow-ups

**Principle.** Lead with user value, then technical implementation, then verification.

**Output.** `sprint-review-demo.md` — current-state document, archive before rewriting.

### 12. Final issue and log updates

**Owners.** orchestrator, product-owner, demo-lead.

1. Append final entries to the progress log: status, changed files, verification results, review results, security results, residual risks.
2. Append final material decisions to the decision log.
3. Update GitHub issues with implementation summary, verification evidence, security notes, and demo notes (per-issue confirmation, as in step 5).
4. **Do not close issues** unless the user explicitly asked or the repo's convention clearly indicates closure.
5. Produce the final user-facing summary.

**Final summary must list.**

- Issues addressed
- Implementation summary
- Files changed
- Verification commands + results
- User-facing tests added/updated
- Review findings + fixes
- Security analysis + pen-test summary
- Residual risks / follow-ups
- Whether issues were updated
- Locations of all six artifact files

## Operating principles

These trump local convenience. If you find yourself violating one, stop and escalate.

- **Explore before editing.** Read-only first. Plan before code.
- **Verify before claiming done.** Acceptance criteria → tests → run → evidence.
- **User-facing tests first.** Unit tests cover edges; they do not replace behavior tests.
- **Parallel only when safe.** Independent, read-only work can fan out. Never parallel-edit the same files.
- **Security is not optional** for the surfaces listed in step 10.
- **Traceability.** Every material decision ties back to an issue requirement, repo constraint, user clarification, or test result — captured in the decision log.
- **Autonomy with guardrails.** Proceed when the next step is clear and low-risk. Ask only on decisions that materially affect product, scope, compatibility, security, data migration, public APIs, or irreversible actions.
- **Never** commit, push, force-push, deploy, close issues, or take other destructive/external actions without explicit user authorization. A single approval covers a single action — not future ones.

## Gotchas

- **Don't overwrite append-only logs.** `progress-log.md` and `decision-log.md` accumulate history across runs.
- **Don't ask the user to re-confirm scope** if the issue + repo already answer the question. Read first; ask second.
- **Don't skip the review loop** because verification passed. Verification proves the code runs; review proves it should ship.
- **Don't run pen-tests against anything you don't own.** "External system" includes staging environments owned by third parties.
- **Don't simulate roles you don't need.** A typo fix doesn't need a product-owner. A README change doesn't need a pen-tester. Drop roles that add no value.
- **Don't conflate `gh` with the GitHub MCP tools.** Some environments expose only one. Try the MCP tools first if both are available — they're more reliable inside agent harnesses.
- **Don't close issues automatically.** Even on green CI. Closure is the user's call unless they said otherwise.
- **Match the verification stack to the repo.** Don't invent a test command — use what `package.json` / `pyproject.toml` / `Makefile` / CI config actually defines.

## Quality bar

Work is not done until:

1. Relevant issues were read and analyzed.
2. Acceptance criteria are explicit (clarified or assumption-logged).
3. Architecture and conventions were inspected before editing.
4. Plan maps work → acceptance criteria → demo scenarios.
5. GitHub issues were updated (or a local update proposal exists).
6. Implementation is complete for the agreed scope.
7. User-facing tests exist for each acceptance criterion (or the gap is justified).
8. Verification was run; results are recorded.
9. At least one review loop ran; blockers and highs are fixed.
10. Security review ran for sensitive surfaces; pen-tests ran when applicable.
11. `sprint-review-demo.md` exists and leads with user value.
12. Final user summary lists changes, verification, review, security, residual risks, and artifact locations.

## Failure handling

When blocked:

1. Investigate root cause first (docs, comments, tests, config).
2. Try a safe alternative.
3. Log the blocker and what you tried.
4. Ask the user only when the blocker requires product, access, credential, infra, or scope decisions.

When you can't finish the full scope: complete the safe subset, leave the repo coherent, document what's incomplete + the exact next steps + residual risk.

## References

- [`team-roles.md`](team-roles.md) — full role definitions, mission, outputs, subagent brief format
- [`log-formats.md`](log-formats.md) — entry formats for progress and decision logs
- [`github-issue-templates.md`](github-issue-templates.md) — issue comment templates
- [`log-templates/`](log-templates/) — starter templates for the six artifact files
- [`scripts/`](scripts/) — helper scripts (`init-artifacts.sh`, `archive-current-state.sh`, `append-progress.sh`, `load-issues.sh`)
