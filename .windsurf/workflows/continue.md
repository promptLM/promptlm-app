---
description: Continue with current task
---

You are working on a task. You should proceed with the task until:

a) you hit a blocker, or
b) you finished with a reviewable unit of work or completed the current task according to the definition of done below.

## Definition: Reviewable Unit of Work (RUW)
A reviewable unit of work (RUW) is an enhancement/addon/new capability/change/modification, basically anything that has an observable effect to the user and changes data state.
It should be possible to test the added code and its functionality through tests.
The RUW must belong to the issue you are currently working on.

## Definition of Done (DoD)
To call a RUW done, it must:
- Add or alter funcxtionality vthat can be triggered through external signals or visually observed 
- Provide a test for addded or altered fucntionality
- Add documentation when users are affected or described documentation must change
- NOT add mocks, fallbacks, alterbative paths that were not explicitly requested
- Add/upgrade the relevant UI acceptance tests (Playwright or repo-standard UI acceptance framework)
- Add/upgrade business logic tests
- Run ALL tests (and lint/build checks if present)
- Fix regressions until green
- You commited with a good message: `Issue #<n>: <imperative summary>`
- You update the GitHub issue via MCP:
   - check completed tasks
   - update task text if the delivered behavior differs (keep it accurate)
- All typescript files must pass linting

## Quality rules (non-negotiable)
- Do NOT add fallbacks, mocks, stubs, demo-mode shortcuts, dummy code, or temporary implementations in production paths.
- Write tests for all business functionality:
  - new/changed business rules must have unit/integration coverage
  - bug fixes must include regression tests
- Do not change or modify business code to satisfy or help with tests
- Implement acceptance tests for all UI logic:
  - cover primary user flows + key edge cases
  - assert observable UI behavior (not internal implementation details)
- Keep the codebase green:
  - run the full test suite after any meaningful change
  - fix regressions immediately




## When blocked
Run all tests yourself and try to understand the problem.
If you found the issue try to fix it yourself. Otherwrise get back to me with a summary of your findings and what you think the prolem(s) could be and message me immediately with:
- exact error output
- what you tried
- minimal input needed from me

## When to message me
Only message me when you hit a blocker or have a RUW that is done b the DoD


## Response format (whenever you message)
- What changed:
- Tests added/updated:
- Commands run (PASS):
- Commit(s):
- Issue updates (checkboxes checked/edited):
- Next step you will do immediately (unless blocked):
- Status: COMPLETE / NOT COMPLETE

## Workflow
- If there is nothing that requires a user decision, clarification, credentials, or review, you MUST continue automatically to the next step without waiting for me and without messaging me.
- Only ask me questions when you are genuinely blocked.

Now continue.