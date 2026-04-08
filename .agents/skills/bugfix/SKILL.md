---
name: bugfix
description: Fix a bug in the code.
---

Fix the bug described in:

```text
$ARGUMENTS
```

`$ARGUMENTS` can be:
- A reference to an existing issue (e.g. a GitHub issue number or URL).
- A free-text bug description provided by the user.
- Empty — in which case, ask the user to describe the bug.

---

## Instructions

Work through every phase below **in order**. Do not skip phases. Track progress by posting comments on the issue after each significant step.

**Clarifying questions:** At any point during any phase, if information is missing, ambiguous, or you are unsure about the correct approach, **stop and ask the user** before proceeding. Do not guess or assume. It is always better to ask than to make a wrong fix.

---

### Phase 0: Ensure an Issue Exists

1. **If `$ARGUMENTS` is an issue reference** (number or URL) — fetch it from the issue tracker and proceed to Phase 1.
2. **If `$ARGUMENTS` is a free-text description or empty** — gather enough information to create a well-formed bug report:
   - Ask the user for: a short summary, expected behaviour, actual behaviour, and reproduction steps.
   - Keep asking follow-up questions until you have a clear, actionable description. Do not create a vague issue.
3. **Create the issue** in the issue tracker (e.g. GitHub Issues) with a descriptive title and a body containing:
   - **Description** of the bug
   - **Expected behaviour**
   - **Actual behaviour**
   - **Steps to reproduce**
   - Any relevant environment details
4. Note the created issue ID — all subsequent phases reference this issue.

---

### Phase 1: Understand the Bug

1. **Fetch the issue** from the issue tracker (if not already loaded from Phase 0). Read the title, description, labels, and all existing comments.
2. **Clarify ambiguities** — if the bug description is incomplete (no reproduction steps, no expected vs. actual behaviour, no environment info), ask the user or post a comment on the issue requesting the missing details. Do not proceed until you have a clear understanding of:
   - What the expected behaviour is
   - What the actual (broken) behaviour is
   - How to reproduce it (steps, input data, environment)
3. **Research the codebase** — use search tools (grep, code search, symbol info) to locate the relevant code paths. Trace the execution flow from the entry point to the point of failure.
4. **Identify the root cause** — determine *why* the bug occurs, not just *where*. Prefer fixing the root cause upstream over adding downstream workarounds or fallbacks that introduce additional code paths.
5. **Post findings** as a comment on the issue summarising:
   - Affected files and lines
   - Root cause explanation
   - Planned fix approach

---

### Phase 2: Write a Failing Test

1. **Choose the right test level** — prefer an integration test that exercises the bug through a realistic scenario. Fall back to a unit test only if an integration test is impractical. If a `test` skill exists in `.agents/skills/`, follow its conventions.
2. **Write the test** so that it:
   - Reproduces the exact bug condition
   - **Fails** (red) on the current codebase, proving the bug exists
   - **Will pass** (green) once the bug is fixed
3. **Add inline documentation** — include a Javadoc / docstring on the test method describing the intent: what bug it guards against and how it reproduces it.
4. **Run the test** to confirm it fails with the expected symptom.
5. **Commit and push** the failing test on a feature branch (e.g. `fix/<issue-id>-<short-description>`). This anchors the reproduction and makes the fix reviewable.
6. **Post a comment** on the issue noting the test was added and linking the commit.

---

### Phase 3: Fix the Bug

1. **Make the minimal change** that addresses the root cause identified in Phase 1. Follow existing code style and conventions. Do not introduce unrelated refactorings, fallbacks, or workarounds.
2. **Favour composition over inheritance** — only model IS-A relations as subclasses; otherwise delegate.
3. **Do not add or remove comments or documentation** unless directly related to the fix.

---

### Phase 4: Verify

1. **Run the new test** and confirm it passes (green).
2. **Run the full build** (e.g. `build-jdk.sh` at the project root for Java projects) to ensure nothing else broke.
3. **Run acceptance tests** if available (e.g. `test.sh` at the project root).
4. If any test fails, investigate and fix before proceeding. Do not weaken or delete existing tests.

---

### Phase 5: Commit, Push, and PR

1. **Commit** the fix with a clear message referencing the issue (e.g. `Fix #<issue-id>: <short summary>`).
2. **Push** the branch.
3. **Open a Pull Request** targeting the main branch. In the PR description include:
   - A summary of the root cause
   - What the fix changes
   - Reference to the issue (e.g. `Closes #<issue-id>`)
4. **Post a final comment** on the issue linking the PR and summarising the fix.

---

## Rules

- **No downstream workarounds** — do not introduce fallbacks or alternative code paths to mask the bug. Fix the root cause.
- **Minimal changes** — keep the diff small and focused. One bug, one fix.
- **Test first** — the test must exist and fail before the fix is applied.
- **Keep the build green** — all existing tests must continue to pass after the fix.
- **Communicate progress** — post comments on the issue at each phase transition so stakeholders can follow along.
- **Ask, don't assume** — whenever you are uncertain about expected behaviour, scope of the fix, or any technical detail, ask the user for clarification before continuing.
