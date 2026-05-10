# Review Criteria

Apply these in Phase 4 (review implementation) and Phase 6 (check risks). Skip categories that don't apply to the change at hand.

## Correctness

- Does the implementation do what it appears intended to do?
- Are there logic errors, incorrect assumptions, or missing branches?
- Are return values, state transitions, and side effects correct?

## Bugs and regressions

- Could existing behavior break?
- Are compatibility guarantees preserved?
- Are previous edge cases still handled?

## Security and secrets

- Are secrets, tokens, credentials, or private keys exposed?
- Are inputs validated and sanitized where needed?
- Are authentication and authorization checks preserved?
- Are there injection, traversal, SSRF, XSS, CSRF, deserialization, or privilege-escalation risks?
- Are dependency or configuration changes security-sensitive?

## Data handling

- Is user, customer, financial, health, personal, or sensitive data handled safely?
- Are privacy, retention, logging, masking, and access concerns addressed?
- Could data be lost, corrupted, duplicated, or leaked?

## Error handling

- Are errors handled deliberately?
- Are exceptions swallowed incorrectly?
- Are retries, fallbacks, and user-facing errors appropriate?
- Are failure modes observable?

## Edge cases

- Empty inputs.
- Null or undefined values.
- Large inputs.
- Invalid inputs.
- Boundary values.
- Partial failures.
- Missing permissions.
- Time zones, locale, encoding, and formatting issues where relevant.

## Performance

- Inefficient loops or queries.
- N+1 queries.
- Excessive memory use.
- Unbounded work.
- Slow startup or build impact.
- Cache invalidation or cache correctness.
- Hot-path regressions.

## Concurrency / async (when relevant)

- Race conditions.
- Deadlocks.
- Ordering assumptions.
- Cancellation.
- Timeout behavior.
- Shared mutable state.
- Transaction boundaries.
- Idempotency.

## API and contract compatibility

- Are public APIs changed?
- Are request/response shapes compatible?
- Are schemas, types, events, or messages changed safely?
- Are clients or downstream consumers affected?

## Database / migrations (when relevant)

- Migration safety.
- Rollback behavior.
- Backfills.
- Locking.
- Data transformations.
- Index creation.
- Nullable / non-nullable transitions.
- Default values.
- Compatibility between old and new application versions.

## Test coverage

- Are meaningful tests added or updated?
- Are important paths and edge cases covered?
- Are tests too brittle or too broad?
- Are mocks hiding important behavior?
- Is there evidence that tests were run?

## Maintainability

- Is the code understandable?
- Are responsibilities well separated?
- Are abstractions justified?
- Is complexity necessary?
- Are names clear?
- Is duplication acceptable or harmful?

## Simplicity

- Is there a simpler solution?
- Is the implementation over-engineered?
- Are broad rewrites avoided where a smaller change would work?

## Consistency with existing patterns

- Does the change match established project conventions?
- Does it use existing helpers, abstractions, error types, logging patterns, and test patterns?

## Documentation impact

- Are README, API docs, comments, examples, changelogs, or migration guides needed?
- Are behavior changes discoverable by future maintainers or users?

## Quality bar for findings

- Be specific and evidence-based; reference files and lines.
- Avoid vague criticism and style-only comments.
- Avoid rewriting code unless asked.
- Separate confirmed issues from speculative risks.
- Prefer minimal, targeted recommendations.
- State limitations clearly when context is missing.
- Do not overstate certainty or invent findings.
- Do not bury severe issues in long lists.
- Prioritize correctness, security, data safety, and regressions.
- Keep recommendations practical for the change's size and scope.
- Consider existing project conventions before recommending different patterns.
- Recognize good decisions when helpful, but keep the report focused.
