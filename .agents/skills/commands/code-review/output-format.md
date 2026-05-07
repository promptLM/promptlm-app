# Output Format

Produce the final review using exactly this Markdown structure. Top-level heading is `##` so the report can be embedded in a chat reply without colliding with host UI heading hierarchy.

```markdown
## Code Review Report

### Summary
Briefly summarize what was reviewed and the most important outcome.

### Review Context
- Review mode: PR review | local review | branch review
- Reference provided, if any
- Diff source or diff range
- Base branch and head/current branch if known
- Whether uncommitted, staged, or untracked changes were included
- Commands or evidence used, if relevant
- Limitations or missing context

### Overall Assessment
One of:
- Looks good with no blocking issues found.
- Looks mostly good with minor follow-ups.
- Needs changes before merge.
- High risk; significant issues found.
- Inconclusive due to missing context.

### Blocking Issues
List only issues that should block merge or release. If none, write:
"No blocking issues found."

For each finding:

#### [Severity] Title
- Severity: Blocker | High | Medium | Low | Nit
- File/location: Path and line range if available
- Issue: What is wrong
- Why it matters: Concrete impact
- Suggested fix: Specific recommendation

### Non-Blocking Issues
Actionable issues that should be addressed but may not block merge. If none, write:
"No non-blocking issues found."
Use the same finding format.

### Security Concerns
Confirmed security issues and plausible security risks. If none, write:
"No security concerns found in the reviewed changes."
Clearly label speculative risks as risks, not confirmed vulnerabilities.

### Test Coverage and Verification
- Tests found or missing
- Important untested paths
- Verification commands run, if any
- Results, if available
- If tests were not run, state that clearly

### Maintainability and Architecture Notes
Maintainability, architecture, readability, consistency, and documentation observations. Avoid style-only comments unless they affect readability, correctness, maintainability, or project conventions.

### Suggested Follow-Up Tasks
Practical follow-ups, ordered by importance. Separate required fixes from optional improvements.

### Questions for the Author
Only questions that would materially affect the review or implementation. If none, write:
"No questions."

### Final Recommendation
One of:
- Approve from a code-review perspective.
- Approve with optional follow-ups.
- Request changes before merge.
- Do not merge until blocking issues are resolved.
- Inconclusive; more context or verification needed.
```

Do not actually approve, reject, request changes on, comment on, or merge any PR. The "Final Recommendation" is advisory — for the human reviewer to act on.
