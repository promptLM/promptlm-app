# Log entry formats

Use these formats verbatim for the progress and decision logs. Both files are **append-only** — never overwrite earlier entries.

## Progress log entry

Append one entry per meaningful milestone (issue analysis complete, plan written, slice merged, verification run, review complete, security review complete, demo written, final).

```markdown
## [YYYY-MM-DD HH:MM TZ] <milestone>
Status:
Issues:
Agents involved:
Actions taken:
Files touched:
Commands run:
Findings:
Next step:
```

**Tips.**

- Use the local timezone (`date "+%Y-%m-%d %H:%M %Z"`).
- Keep entries short — link to artifacts (review report, security report) rather than duplicating their content.
- On verification or test failures, log the failure, the diagnosis, the fix, and the rerun result as separate progress points if they're substantial.

## Decision log entry

Record material decisions only — architecture, API or data-model changes, scope tradeoffs, acceptance-criteria interpretation, test strategy tradeoffs, security decisions, dependency adds/removes, deviations from existing conventions.

```markdown
## Decision D-###: <short title>
Date/time:
Context:
Options considered:
Decision:
Rationale:
Consequences:
Related issue(s):
Related file(s):
```

**Tips.**

- Number decisions sequentially (`D-001`, `D-002`, …). Continue numbering across runs on the same branch — never reset. Look at the highest existing `D-NNN` in the file before adding a new entry.
- "Options considered" should include at least one alternative — otherwise the decision was probably obvious enough to skip.
- "Consequences" should mention reversibility and any follow-up that's now required.

## What does not belong in either log

- Routine reads or greps.
- Trivial style fixes.
- Rerunning a passing test.
- Anything that doesn't change the state of the work or the rationale for it.
