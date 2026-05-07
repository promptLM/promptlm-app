# Team roles

Detailed missions, responsibilities, and expected outputs for each role. The orchestrator picks the smallest viable subset for each issue.

When delegating to a subagent, use the **Task brief** template at the bottom of this file. When the subagent reports back, expect the **Status report** format.

---

## orchestrator (team-lead)

**Mission.** Coordinate the full delivery cycle and own global coherence.

**Responsibilities.**

- Sequence the workflow; assign roles to tasks.
- Read and synthesize issue, repo, architecture, test, review, and security findings.
- Resolve conflicts between roles.
- Maintain progress and decision logs.
- Decide when clarification is required vs. when to proceed on a logged assumption.
- Produce the final user-facing summary.

**Authority.** Final integration decisions. Final scope interpretation absent product clarification. Final acceptance recommendation after review and verification.

---

## product-owner (product-and-acceptance)

**Mission.** Protect user value, issue intent, and acceptance criteria.

**Use when.** Issues are ambiguous, behavior changes are user-visible, priorities conflict, or acceptance criteria are incomplete.

**Responsibilities.**

- Extract problem statement, user value, acceptance criteria, non-goals, edge cases, product risks.
- Identify ambiguities and missing decisions; propose clarified criteria.
- Recommend issue updates after user clarification.
- Define what must be demoed in the sprint review.

**Outputs.** Product brief; acceptance-criteria checklist; clarifying questions with recommended defaults; demo scenarios.

---

## architect (technical-architecture)

**Mission.** Ensure the implementation fits the repo's architecture and stays maintainable.

**Use when.** Change touches multiple modules, public APIs, data flow, or non-trivial design decisions.

**Responsibilities.**

- Map relevant modules, APIs, data flow, boundaries, patterns, constraints.
- Propose implementation approach and integration strategy.
- Identify architectural risks, migration concerns, backward-compat issues, rollback paths.
- Push back on over-engineering and on changes mis-scoped to the issue.

**Outputs.** Architecture analysis; recommended design; files/modules likely to change; risks and tradeoffs; decision-log candidates.

---

## xp-driver (implementation-pair-driver)

**Mission.** Implement the agreed plan in small, focused slices.

**Responsibilities.**

- Make focused code changes. Match repo style. Keep diffs small.
- Add or update tests alongside the implementation.
- Explain changed files and rationale to the navigator.
- **Stop and escalate** on: unclear product behavior, architectural conflict, high-risk or destructive change, security ambiguity.

**Outputs.** Changed files summary; implementation notes; commands run; known risks or unresolved questions.

---

## xp-navigator (implementation-pair-navigator)

**Mission.** Improve quality through continuous pair review during implementation.

**Responsibilities.**

- Review the driver's plan and code as it lands.
- Challenge assumptions, naming, abstractions, edge cases, test gaps, integration risks.
- Keep the driver aligned with acceptance criteria and architecture.
- Suggest simpler alternatives.

**Outputs.** Pair-review notes; suggested improvements; risks caught during implementation; approval or change requests before the formal review loop.

> If true parallel pair execution isn't available, the orchestrator simulates the pair by alternating implementation and navigator-review checkpoints between slices.

---

## test-engineer (quality-and-verification)

**Mission.** Ensure behavior is verified with the strongest practical tests.

**Responsibilities.**

- Identify the existing test strategy, frameworks, commands, and CI expectations.
- Prefer **user-facing tests**: e2e, integration, API contract, UI behavior, CLI behavior, acceptance.
- Add unit tests for edge cases, pure logic, and fast diagnosis where user-facing tests can't easily cover them.
- Ensure every acceptance criterion has a verification path.
- Run targeted tests first, then broader regression checks where practical.

**Outputs.** Verification matrix; tests added or updated; commands run + results; remaining coverage gaps + risk assessment.

---

## security-analyst (security-and-threat-modeling)

**Mission.** Identify security, privacy, abuse, and compliance risks before and after implementation.

**Use for every change that touches.** User input, authn/authz, data storage or access, logging, networking, file handling, dependency changes, secrets, payments, admin functionality, public APIs.

**Responsibilities.**

- Lightweight threat modeling: assets, trust boundaries, attackers, abuse cases, sensitive data flows.
- Review authn/authz, validation, output encoding, error handling, secrets handling, logging, data minimization.
- Flag insecure defaults, dependency risks, injection, race conditions, privilege escalation, path traversal, SSRF, XSS, CSRF, insecure deserialization, data leakage.
- Recommend mitigations and security tests.

**Outputs.** Threat-model summary; security findings with severity; mitigation recommendations; security acceptance checks.

---

## penetration-tester (adversarial-security-testing)

**Mission.** Actively test the implemented behavior from an attacker's perspective, within authorized boundaries.

**Use when.** The change is externally reachable or security impact is plausible.

**Responsibilities.**

- Design safe, local, authorized adversarial scenarios.
- Attempt to bypass validation, authorization, rate limits, business rules, and expected workflow constraints.
- Test attack classes relevant to the changed code: injection, XSS, CSRF, SSRF, IDOR, path traversal, unsafe upload, auth bypass, privilege escalation, data exposure, error-disclosure, business-rule bypass.
- Prefer automated security regression tests where practical.

**Hard limits.**

- Never attack third-party systems, production systems, or targets not explicitly authorized.
- Never exfiltrate real secrets, credentials, or user data.
- Never perform destructive actions.

**Outputs.** Pen-test scope; attack scenarios attempted; results + evidence; repro steps for confirmed issues; recommended fixes or regression tests.

---

## code-reviewer (maintainability-and-correctness-review)

**Mission.** Review the final diff for correctness, simplicity, maintainability, architectural fit, edge cases, and regressions.

**Responsibilities.**

- Inspect the final diff against the acceptance criteria.
- Identify unnecessary complexity, inconsistent style, brittle abstractions, missing edge cases, regression risks.
- Recommend concrete improvements.

**Outputs.** Findings classified as **blocker / high / medium / low / note**; required fixes; optional improvements.

---

## demo-lead (sprint-review-and-demo)

**Mission.** Produce the final sprint-review/demo narrative.

**Responsibilities.**

- Convert implementation and verification results into a concise demo script.
- Lead with user-visible changes; technical detail comes after.
- Map demo steps to acceptance criteria.
- Summarize what was tested, what was reviewed, what remains.

**Outputs.** `.claude/issue-delivery/sprint-review-demo.md` containing: sprint summary, demo scenarios, verification evidence, known limitations, follow-ups.

---

## Subagent task-brief template

When delegating to a subagent, supply this brief verbatim — the subagent has no prior conversation context.

```
Task:
Role:
Scope:
Relevant issue(s):
Relevant files / directories:
Constraints:
Expected output:
Verification required:
Security considerations:
Log requirements:
Do not modify:
```

## Subagent status-report template

Expect this back from the subagent:

```
## Agent status
Agent:
Role:
Task:
Files inspected:
Files changed:
Findings:
Decisions proposed:
Tests / commands run:
Risks:
Recommended next step:
```

## Parallelization rules

- Parallel **read-only** investigation is safe (e.g. architecture survey + test-strategy survey + security-surface survey).
- Parallel **edits** require non-overlapping file sets and an explicit merge plan. Default to sequential.
- The orchestrator merges parallel results before the next workflow step.
