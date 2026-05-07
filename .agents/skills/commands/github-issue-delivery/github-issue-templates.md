# GitHub issue comment templates

Use these when posting back to an issue. Keep comments concise — link to artifacts (`.claude/issue-delivery/sprint-review-demo.md`, etc.) rather than pasting them.

## After clarification — Implementation analysis

```markdown
## Implementation analysis
- User problem:
- Repository areas affected:
- Acceptance criteria (clarified):
- Dependencies / related issues:
- Risks:
```

## After planning — Implementation plan

```markdown
## Implementation plan
- Workstream 1:
- Workstream 2:
- Pair-engineering approach:
- Verification:
- Security review:
- Demo scenario:
```

## After delivery — Implementation result

```markdown
## Implementation result
- Summary:
- Changed components:
- Verification run:
- Review-loop result:
- Security result:
- Demo notes:
- Follow-ups:
```

## Conventions

- **Do not close issues** in these comments unless the user explicitly asked.
- Link the PR or branch when relevant.
- Reference acceptance criteria by the same wording used in the issue so reviewers can map 1:1.
- If you had to defer something, list it under **Follow-ups** with enough context that someone else could pick it up.
