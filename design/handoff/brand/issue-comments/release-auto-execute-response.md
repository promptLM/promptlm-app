## Designer response

You're right — I conflated Save and Release. Conceding the principle: **release ⇒ executions[] non-empty for the released revision.** The footnote stands for Save (don't auto-execute on every keystroke-save), but Release has different stakes and the integrity argument wins.

### Answers to the open questions

**1. What input is auto-run with?**

Layered fallback, picked automatically — author can override:

1. If a "release fixture" is pinned for this spec → use it.
2. Else if the eval suite is configured (#80) → use it.
3. Else last successful manual Test run's inputs → use them.
4. Else block release with "no inputs to run against — pin a release fixture or run Test once."

Rationale: pinned fixture is the deliberate-author path; eval suite is the rigorous path; last-run is the pragmatic path; nothing-at-all isn't a path. The author explicitly pinning a fixture is what makes this auditable later — reviewers see *which* inputs were used to validate.

**2. What if it fails?**

**Block release.** Record-and-proceed defeats the purpose; proceed-with-warning is the worst of both worlds (the artifact still ships broken). The block is recoverable — fix the prompt, re-release. The execution log captures the failed attempt for the bisect/audit trail even though the release didn't go through.

Edge case: model is down / network flake. Distinguish *prompt failed* (assertion, schema, tool error) from *infrastructure failed* (timeout, 5xx). Infra failures show "retry" + "release anyway (infra failure recorded)" — author's call. Prompt failures hard-block.

**3. Eval gating?**

**v1: recorded-only.** Eval suite runs if configured, results land in `executions[]`, but pass-required gating is **out of scope for v1**. Reasoning: pass-required eval gating is a separate UX surface (suite definition, threshold config, failure triage) that hasn't been designed. Recording-only gives us the audit trail and bisect signal now, and pass-required can layer on without changing the release contract.

If a single execution fails (#2 above), that still blocks. The "pass-required vs. recorded-only" distinction is specifically about the broader eval *suite* — multiple cases with thresholds.

**4. Where does this orchestrate?**

**Backend, atomic.** `releasePrompt(id, revision)` runs the pre-release execution server-side and only flips the release pointer if it succeeds. Reasons:

- Frontend orchestration means a user closing the tab mid-release leaves a half-released spec.
- Atomicity matches the integrity stake: either the released revision has a green execution attached, or it isn't released. No intermediate states.
- Other clients (CLI, CI) get the same guarantee for free.

The existing #32/#38 release SPI gets a new strategy: `pre-release-execute` (default for v1). Existing strategies keep working for specs that opt out (rare; gated by a flag).

**5. Does the CTA stay "Save & release"?**

**Upgrade.** Two changes:

- Rename to **"Release"** when the spec has unsaved changes that require a save first — Save is implicit; the user's intent is to release. (Form already handles save-before-release internally.)
- Replace the single button with a small **menu split**: `[Release ▾]` opening to `Release with last test inputs` / `Release with fixture: <name>` / `Release with eval suite`. Default action (the button itself) picks the layered fallback from question 1. The menu is the override.

This makes the auto-run *visible* — you can see what's about to happen before clicking — without forcing a wizard.

### Prototype implications (taking these on)

1. **Sticky header CTAs:** `Cancel` · `Save draft` · `[Release ▾]`. Split-button shows the resolved input source.
2. **Release flow states:** clicking Release transitions through `Saving draft… → Running pre-release check… → Released ✓` (or `Release blocked: <failure summary>` with a "View execution" link).
3. **"Has never been Tested" handling:** if the layered fallback resolves to *nothing* (no fixture, no eval, no prior run), the Release button is disabled with an inline hint: "Run Test at least once before releasing." This is the explicit-Test-first answer to your last question — we don't silently auto-run, because there's no input to run *with*.
4. **Test tab unchanged:** auto-run on save still doesn't exist. Run is explicit in the Test tab.
5. **Detail page:** released revisions get a "Pre-release execution" badge linking to the specific run that gated the release. Audit trail visible to reviewers.

### Updated deliverables

Adding to the prototype-update list:

6. Split-button Release CTA with resolved-source indicator.
7. Release flow states (saving / running / released / blocked).
8. Disabled Release with hint when no input source resolves.
9. Update `form.html` §Sticky header to document the new CTA.
10. Update `api.html` to reflect `releasePrompt` strategy = `pre-release-execute` and link to the relevant SPI issue (#32/#38).

### One thing I want to flag back

The "release fixture" concept (question 1, item 1) is new — it's a fixture *promoted* from the Test tab's saved fixtures, marked as the canonical pre-release input. Mechanically simple (a flag on the fixture or a pointer on the spec) but worth confirming the team likes that vocabulary before I bake it into the UI. Alternatives: "release input set," "canonical fixture," "pinned fixture." I'll go with **release fixture** unless you push back.
